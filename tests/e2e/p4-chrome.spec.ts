import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { goto } from './goto.ts'

/**
 * P4 CHROME LAW — no chrome rides on chrome at the compact breakpoint
 * (Evaluation 2026-10-10 player re-run, item 2's asterisk: at short window
 * heights the compact reflow made the HASH LINE overlap the GHOST-CHIP
 * STRIP below the stage).
 *
 * The bottom-corner chips (`#gw-ghost-bar`, `#gw-save`) are zero-flow,
 * viewport-pinned (bottom: 8px). The compact layout law reserved every
 * FLOW line under ≤700 px heights and made the page fit the window with no
 * scroll — and never counted the chips' band, so the last flow line (the
 * hash disclosure) ended INSIDE it. Measured before the fix at 1280x633:
 * hash 599–611 riding under the strip's 604–625. The studio does rects,
 * not vibes: pairwise-disjoint rects of the status row, the callout row,
 * the hash line, the two bottom chips, and the tray/controls rows at the
 * compact breakpoint (633 / 653 / 700), plus the stack-order statement
 * that at those heights the last flow line ends ABOVE the chip band, and
 * the no-scroll law. The 633 / 720 / 900 proof heights ride the same
 * assertion (above the breakpoint the page scrolls, so the rects are read
 * at scroll 0 in page space — the chips' corner law there is documented
 * and unchanged); each height attaches a full-window screenshot.
 *
 * ROUND 2 (Lane C, "the 20 px back") re-derived the compact arithmetic
 * WITHOUT narrowing this law: the band never needed WORLD rows. The
 * compact constant is back at 288 (the ledger's 613×345 stage at 633 —
 * the height the P4 band-buy had spent, returned) and the chips lowered
 * themselves to 4 px from the window edge (`--gw-chip-bottom`, shell.css)
 * so the last flow line still ends ~3 px ABOVE the band at every compact
 * height. Nothing rides on anything; the honesty the P4 fix bought is
 * still bought, and the stage-height floor below keeps the 20 px from
 * quietly spending itself again.
 *
 * Known adjacency, documented in Modules/ui: OPENING the hash <details>
 * grows the document past the window at compact heights — the disclosure
 * has always traded its reserved line for a scroll at every height, and
 * this law binds the shipped-default state.
 *
 * ROUND 3 (item 4's chrome debt) extends the law to the two states that
 * the idle audit left unmeasured: (a) a FAILED run — the failure band
 * rode the chip band and the flow lines under it at 633 (`567–623` over
 * chips at `608–629`); the band now steps that chrome aside
 * (`stepBandChrome`, `src/ui/result.ts`) with a stated height cap, and
 * the FAIL-state rects are asserted pairwise-disjoint; (b) a SANDBOX
 * page — its thirteen ×99-counted tray labels make an honest two-row
 * tray, and those 25 px used to spend themselves into the chip band
 * through the hash line; the canvas cap reserves them
 * (`body[data-gw-sandbox]`, `src/ui/shell.css`). Both re-measured here
 * at 633.
 */

const ROWS = [
  'gw-status',
  'gw-callout',
  'gw-hash-details',
  'gw-ghost-bar',
  'gw-save',
  'gw-tray',
  'gw-controls',
] as const

interface Rect {
  top: number
  left: number
  bottom: number
  right: number
}

/** Rects at scroll 0 (the compact pages cannot scroll; the taller ones are read before any scroll). */
async function rowRects(page: Page): Promise<Record<string, Rect>> {
  return page.evaluate((ids: string[]) => {
    const out: Record<string, Rect> = {}
    for (const id of ids) {
      const r = document.getElementById(id)!.getBoundingClientRect()
      out[id] = { top: r.top, left: r.left, bottom: r.bottom, right: r.right }
    }
    return out
  }, [...ROWS])
}

function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return w > 0 && h > 0 ? w * h : 0
}

async function settleAt(page: Page, width: number, height: number, url: string, testInfo: TestInfo) {
  await page.setViewportSize({ width, height })
  await goto(page, url)
  await expect(page.locator('#gw-tray button').first()).toBeVisible({ timeout: 30_000 })
  await page.screenshot({ path: testInfo.outputPath(`p4-chrome-${height}.png`) })
  await testInfo.attach(`screenshot-${height}`, {
    path: testInfo.outputPath(`p4-chrome-${height}.png`),
    contentType: 'image/png',
  })
}

for (const height of [633, 720, 900]) {
  test(`no chrome rect rides another at 1280x${height}`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await settleAt(page, 1280, height, '/', testInfo)

    const rects = await rowRects(page)
    for (let i = 0; i < ROWS.length; i++) {
      for (let j = i + 1; j < ROWS.length; j++) {
        const a = ROWS[i]
        const b = ROWS[j]
        expect(overlapArea(rects[a], rects[b]), `${a} vs ${b}`).toBe(0)
      }
    }

    if (height <= 700) {
      // the compact law: the page fits the window (no scroll) and the last
      // flow line ends ABOVE the chip band — stack order, not luck
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height)
      expect(rects['gw-hash-details'].bottom, 'hash line above the chip strip').toBeLessThanOrEqual(
        rects['gw-ghost-bar'].top,
      )
      // THE TRAY IS ONE ROW (round 2): the Linux-Fonts incident — thirteen
      // tray labels at the desktop voice wrapped the row on the CI box and
      // rode the page 25 px into the chip band; the compact block states
      // the button boxes, and this law keeps the row single on every OS
      expect(
        rects['gw-tray'].bottom - rects['gw-tray'].top,
        'the tray is one row at compact heights',
      ).toBeLessThan(30)
      if (height < 700) {
        // THE 20 px BACK (round 2, Lane C): the compact stage serves the
        // ledger's height again — a 633 window owes ≥ 340 px of world
        // (the ledger number is 345; the floor leaves sub-pixel slack)
        const stage = await page.evaluate(
          () => document.querySelector('#gw-stage canvas')!.getBoundingClientRect().height,
        )
        expect(stage, 'the compact stage kept its height').toBeGreaterThanOrEqual(340)
      }
    }

    expect(errors).toEqual([])
  })
}

/**
 * ROUND 3, item 4 — the FAIL state at the flagship window. A failed run
 * replaces the centred panel with the bottom band; idle disjointness is
 * not enough if the band then rides the chips, the hash line or the
 * callout row. Launch with an empty build (the car drives off the spawn
 * and falls), wait for the strip, and re-run the pairwise law on the
 * VISIBLE rects — the chrome the band stepped aside is honestly hidden,
 * not merely z-buried — plus the statements that the band really is the
 * strip shape and the page still does not scroll.
 */
const FAIL_ROWS = [...ROWS, 'gw-result'] as const

test('a FAILED run at 1280x633: the failure band rides nothing', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.setViewportSize({ width: 1280, height: 633 })
  await goto(page, '/?level=kitchen01&launch=1')
  await expect(page.locator('#gw-result.gw-result-strip')).toBeVisible({ timeout: 60_000 })
  await page.screenshot({ path: testInfo.outputPath('p4-chrome-fail-633.png') })
  await testInfo.attach('screenshot-fail-633', {
    path: testInfo.outputPath('p4-chrome-fail-633.png'),
    contentType: 'image/png',
  })

  const rects = await page.evaluate((ids: string[]) => {
    const out: Record<string, Rect & { shown: boolean }> = {}
    for (const id of ids) {
      const el = document.getElementById(id)!
      const r = el.getBoundingClientRect()
      out[id] = {
        top: r.top, left: r.left, bottom: r.bottom, right: r.right,
        shown: !el.hidden && r.height > 0 && getComputedStyle(el).display !== 'none',
      }
    }
    return out
  }, [...FAIL_ROWS])

  // the step-aside is honest: the band's neighbours are hidden, not covered
  for (const id of ['gw-save', 'gw-ghost-bar', 'gw-hash-details', 'gw-callout']) {
    expect(rects[id]!.shown, `${id} steps aside for the failure band`).toBe(false)
  }
  for (let i = 0; i < FAIL_ROWS.length; i++) {
    for (let j = i + 1; j < FAIL_ROWS.length; j++) {
      const a = FAIL_ROWS[i]
      const b = FAIL_ROWS[j]
      if (!rects[a]!.shown || !rects[b]!.shown) continue
      expect(overlapArea(rects[a], rects[b]), `${a} vs ${b} (fail state)`).toBe(0)
    }
  }
  // the band is inside the window and the page still fits it
  expect(rects['gw-result']!.bottom).toBeLessThanOrEqual(633)
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(633)
  expect(errors).toEqual([])
})

/**
 * ROUND 3, item 4 — the SANDBOX at the flagship window. The ×99-counted
 * tray is honestly two rows; the layout owes those pixels to the canvas
 * cap, not to the chip band. Same pairwise law on the idle sandbox
 * chrome, plus the statement that the tray really did wrap (if a future
 * change ever makes it one row again, the reservation must be re-derived
 * — the floor below notices).
 */
test('a sandbox at 1280x633: the counted tray pays itself, not the chip band', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.setViewportSize({ width: 1280, height: 633 })
  await goto(page, '/?level=kitchen-sandbox')
  await expect(page.locator('#gw-tray button').first()).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 30_000 })
  await page.screenshot({ path: testInfo.outputPath('p4-chrome-sandbox-633.png') })
  await testInfo.attach('screenshot-sandbox-633', {
    path: testInfo.outputPath('p4-chrome-sandbox-633.png'),
    contentType: 'image/png',
  })

  const rects = await rowRects(page)
  for (let i = 0; i < ROWS.length; i++) {
    for (let j = i + 1; j < ROWS.length; j++) {
      const a = ROWS[i]
      const b = ROWS[j]
      expect(overlapArea(rects[a], rects[b]), `sandbox: ${a} vs ${b}`).toBe(0)
    }
  }
  // the sandbox page fits the window, and the last flow line ends ABOVE
  // the chip band — the two-row tray bought its own pixels
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(633)
  expect(rects['gw-hash-details'].bottom, 'hash line above the chip strip').toBeLessThanOrEqual(
    rects['gw-ghost-bar'].top,
  )
  expect(errors).toEqual([])
})
