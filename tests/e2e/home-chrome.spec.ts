import { test, expect, type Page } from '@playwright/test'
import { goto } from './goto.ts'

/**
 * THE DOOR WEARS ITS NAME AND HAS A WAY BACK (h4 Lane F2 — player
 * truths 2 and 3, priced at the pixels the DOM-presence gate missed).
 *
 * TRUTH 2 — THE DISJOINT-RECT LAW EXTENDS TO HOME. The P4 law measured
 * the rung page's rows; the home screen inherited the compact rule
 * (`max-height: 700px → h1 { font-size: 13px }`) and nobody measured
 * the door's own chrome against it. At 1280x633 the wordmark rendered
 * UNDER the daily chip — the verdict's proof shot
 * `03-wordmark-under-chip-proof.png` raised the h1's z-index to reveal
 * the name hiding behind the chip mid-screen. The gate this closes is
 * PIXEL truth, not DOM presence: `elementFromPoint` over the FIRST TEXT
 * LINE of the wordmark must return the h1 itself (the name is VISIBLE
 * where it renders), at 1280x633 / 633x900 / 390x844, and the chip must
 * keep its own hittable center. The red-first run of this test at the
 * pre-fix tree is recorded in `Sessions/2026-10-13 Wire the door.md`.
 *
 * TRUTH 3 — THE DOOR IS NOT ONE-WAY. `⌂ the house` is the nav's first
 * crumb on the rung builder, the sandboxes, and the share page, named
 * and Tab-reachable, and the lone `Escape` is its key form — with the
 * build camera's double-Escape chord owning the key while it MEANS
 * something (the chord test below proves the door does not steal it).
 */

const house = (page: Page) =>
  page.waitForFunction(() => typeof (window as any).__gwHouseState === 'function', undefined, {
    timeout: 60_000,
  })

/** elementFromPoint truth at the FIRST TEXT LINE of the wordmark: two
 *  points inside the glyphs' line box, both must resolve to the h1 (or
 *  its text), and the chip's center must resolve to the chip. */
async function nameplateProbe(page: Page) {
  return page.evaluate(() => {
    const h1 = document.querySelector('h1')!
    const chip = document.getElementById('gw-daily-board')!
    const r = h1.getBoundingClientRect()
    const lineY = r.top + Math.min(r.height, 24) / 2
    const probe = (x: number, y: number): string => {
      const el = document.elementFromPoint(x, y)
      if (!el) return 'null'
      if (el === h1 || h1.contains(el)) return 'h1'
      if (el === chip || chip.contains(el)) return 'chip'
      return el.tagName.toLowerCase() + '#' + (el.id || '')
    }
    const c = chip.getBoundingClientRect()
    return {
      wordmark: [probe(r.left + 8, lineY), probe(r.left + Math.min(r.width - 8, 80), lineY)],
      chip: probe(c.left + c.width / 2, c.top + c.height / 2),
      h1: { top: r.top, left: r.left, w: r.width, h: r.height },
      chipRect: { top: c.top, left: c.left, w: c.width, h: c.height },
    }
  })
}

for (const viewport of [
  { width: 1280, height: 633 }, // the verdict's proof-shot window
  { width: 633, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`the wordmark is VISIBLE under the disjoint-rect law at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await goto(page, '/?boot=house')
    await house(page)
    const probe = await nameplateProbe(page)
    expect(probe.wordmark, `wordmark pixels hit-testable (got ${probe.wordmark})`).toEqual(['h1', 'h1'])
    expect(probe.chip).toBe('chip')
  })
}

test('the home chrome exposes the sound chip and it is the engine toggle', async ({ page }) => {
  await goto(page, '/?boot=house')
  await house(page)
  await expect(page.locator('#gw-sound #gw-sound-toggle')).toBeVisible()
})

// ---- the way back ----------------------------------------------------------

async function tabTo(page: Page, selector: string, max = 60): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) return
    await page.keyboard.press('Tab')
  }
  throw new Error(`never focused ${selector}`)
}

test('the rung chrome carries the house crumb — named, Tab-reachable, and it lands the door', async ({ page }) => {
  await goto(page, '/') // the addressed rung builder (the spec gate's default)
  await expect(page.locator('#gw-levels-nav')).toContainText('the house')
  await tabTo(page, '#gw-home-link') // named + Tab-reachable
  await page.keyboard.press('Enter')
  await house(page)
  expect(page.url()).not.toContain('boot=rung')
})

test('a lone Escape on a rung page opens the door; the double-Escape chord keeps precedence', async ({ page }) => {
  await goto(page, '/?level=kitchen02')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
  // the view parked far from home: Escape #1 is the camera's chord, NOT a door
  const box = (await page.locator('#gw-canvas').boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(cx + 400, cy, { steps: 6 })
  await page.mouse.up({ button: 'right' })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(120)
  expect(page.url()).toContain('level=kitchen02') // still in the room
  await page.keyboard.press('Escape') // chord completes; view walks home
  await page.waitForTimeout(400)
  expect(page.url()).toContain('level=kitchen02') // the SECOND press is never a door
  // now the view is home: a FRESH lone Escape is the door
  await page.waitForTimeout(1600) // let the chord window close
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => typeof (window as any).__gwHouseState === 'function', undefined, {
    timeout: 60_000,
  })
})

test('the sandbox chrome carries the crumb too', async ({ page }) => {
  await goto(page, '/?level=kitchen-sandbox')
  await expect(page.locator('#gw-home-link')).toHaveText('⌂ the house')
})

test('the share page carries the crumb and a lone Escape is the door there', async ({ page }) => {
  // mint a real share link the way the a11y walk does: run, read the panel
  await goto(page, '/')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await page.click('#gw-result-share') // the link is minted on the press
  await expect(page.locator('#gw-result-share-row')).toBeVisible()
  const url = await page.inputValue('#gw-result-share-url')
  expect(url).toContain('#s=')
  await goto(page, url)
  await expect(page.locator('#gw-home-link')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => typeof (window as any).__gwHouseState === 'function', undefined, {
    timeout: 60_000,
  })
})
