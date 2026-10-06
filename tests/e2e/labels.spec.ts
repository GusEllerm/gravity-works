import { test, expect } from '@playwright/test'

/**
 * Playtest M's label/layout/copy ledger, pinned as the shell's contract:
 *
 * 1. NO raw codenames in the toolbar or the Help glossary — every tray
 *    button, aria-label, legend, lock/spent message, and Help title speaks
 *    the `PIECE_LABELS` word (gapLip -> "Lip", bigCurve -> "Wide curve",
 *    sbend -> "S-bend", springLauncher -> "Spring", finishCup -> "Cup").
 *    The codenames stay ONLY as ids: `#gw-tray-<kind>` and `data-kind`.
 * 2. The Help drawer OVERLAYS the world and never resizes or scrolls the
 *    stage: at 1280x720 the canvas keeps > 60 % of its area inside the
 *    viewport with Help OPEN, and opening it moves nothing (identical
 *    canvas rect, identical scroll) — playtest M: "Help panel pushes the
 *    world entirely off-screen".
 * 3. The determinism disclosure reads one human line:
 *    "Same pieces, same run, every time — this code proves it." with the
 *    hash value still behind the details.
 * 4. The R/Flip press prints a passive "rotated" echo (playtest M: "R-flip
 *    has no visible confirmation text").
 */

const RAW_CODENAMES = /gapLip|bigCurve|sbend|springLauncher|finishCup/

test.use({ viewport: { width: 1280, height: 720 } })

test('the tray speaks player words, never codenames (ids stay)', async ({ page }) => {
  await page.goto('/?level=kitchen01')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

  await expect(page.locator('#gw-tray button')).toHaveCount(13)
  // no button TEXT carries a raw codename (straight/curve/ramp… ARE words;
  // the five camel-case ids are the ones playtest M actually quoted)
  const texts = (await page.locator('#gw-tray button').allTextContents()).join(' | ')
  expect(texts).not.toMatch(RAW_CODENAMES)

  // the quoted three, and the rest of the 13-kind audit, say their word
  for (const [kind, label] of [
    ['gapLip', 'Lip'],
    ['bigCurve', 'Wide curve'],
    ['sbend', 'S-bend'],
    ['bank', 'Banked turn'],
    ['springLauncher', 'Spring'],
    ['finishCup', 'Cup'],
  ] as const) {
    const b = page.locator(`#gw-tray button[data-kind="${kind}"]`)
    await expect(b).toContainText(label)
    await expect(b).toHaveAttribute('aria-label', `Hold the ${label} piece`)
  }

  // the decremented legend keeps the word too (kitchen01's tray kinds carry ×N)
  await expect(page.locator('#gw-tray-gapLip')).toHaveText(/^Lip ×\d$/)
  // ids unchanged: the test surface is still the codename
  await expect(page.locator('#gw-tray button[data-kind="gapLip"]')).toHaveCount(1)
})

test('locked/spent tray messages and the Help glossary speak player words', async ({ page }) => {
  await page.goto('/?level=kitchen01')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

  // a locked kind explains itself in its WORD, not its id (aria-disabled:
  // dispatchEvent, same seam loop.spec.ts uses for these buttons)
  await page.dispatchEvent('#gw-tray-finishCup', 'click')
  await expect(page.locator('#gw-ghost-state')).toContainText('the Cup is not in this level’s tray')
  await expect(page.locator('#gw-ghost-state')).not.toContainText('finishCup')

  // the Help drawer's titles are the same words (entry ids stay the ids)
  await page.click('#gw-help-toggle')
  await expect(page.locator('#gw-help-list')).toBeVisible()
  await expect(page.locator('#gw-help-entry-gapLip strong')).toHaveText('Lip')
  await expect(page.locator('#gw-help-entry-springLauncher strong')).toHaveText('Spring')
  await expect(page.locator('#gw-help-list')).not.toContainText(RAW_CODENAMES)
})

test('Help overlays the world: the canvas keeps >60 % visible with Help OPEN (1280x720)', async ({
  page,
}) => {
  await page.goto('/?level=kitchen01')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

  const frame = () =>
    page.evaluate(() => {
      const c = document.querySelector('#gw-canvas') as HTMLCanvasElement
      const r = c.getBoundingClientRect()
      const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0))
      const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0))
      return { area: (w * h) / (r.width * r.height), rect: [r.x, r.y, r.width, r.height], scrollY: scrollY }
    })

  const before = await frame()
  expect(before.area).toBeGreaterThan(0.6)

  await page.click('#gw-help-toggle')
  await expect(page.locator('#gw-help-list')).toBeVisible()
  await expect(page.locator('#gw-help-toggle')).toHaveAttribute('aria-expanded', 'true')

  const during = await frame()
  // > 60 % of the canvas is still inside the window with the drawer open...
  expect(during.area).toBeGreaterThan(0.6)
  // ...and the drawer MOVED NOTHING: an overlay, never a reflow or a scroll
  expect(during.rect).toEqual(before.rect)
  expect(during.scrollY).toBe(before.scrollY)
})

test('the fingerprint disclosure reads one human line (hash still behind it)', async ({ page }) => {
  await page.goto('/?level=kitchen01')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
  await expect(page.locator('#gw-hash-details > summary')).toHaveText(
    'Same pieces, same run, every time — this code proves it.',
  )
  await expect(page.locator('body')).not.toContainText('same build, same run, anywhere')
  // the engineering truth survives: the details still carry the hash value
  await expect(page.locator('#gw-hash-value')).toHaveCount(1)
})

test('the R/Flip press prints a passive rotated line', async ({ page }) => {
  await page.goto('/?level=kitchen01')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

  await page.click('#gw-tray-landing') // the asymmetric catcher: a flip matters
  await expect(page.locator('#gw-ghost-state')).not.toContainText('rotated')

  await page.keyboard.press('r')
  await expect(page.locator('#gw-ghost-state')).toContainText('rotated')

  // the button path echoes too (R and Flip drive the same rotate())
  await page.click('#gw-rotate')
  await expect(page.locator('#gw-ghost-state')).toContainText('rotated')
})
