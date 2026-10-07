import { test, expect } from '@playwright/test'
import { BEDROOM01 } from '../../src/world/levels/bedroom01.level.ts'

/**
 * Playtests T+U round-4 shell items (stage 4, Systems Engineer):
 *
 * 1. The autosave is EDIT-SIDE (T: "reload kept the build — 1 of 3
 *    survived"): every placement/removal starts a short debounce window, the
 *    window closes into one write, and the flush hooks in `src/boot.ts`
 *    (pagehide / visibility-hidden) guarantee a reload or a put-away tab
 *    inside the window still stores the LAST edit. A mid-build reload keeps
 *    EVERY piece — placed 3, reloaded, 3 come back.
 * 2. Cross-level NO-LEAK: builds are keyed per level and `startBuildFor`
 *    refuses a foreign record — a kitchen edit must never restore onto a
 *    bedroom level, and each level restores exactly its own build.
 * 3. The candidate-switch line speaks PLAIN WORDS with the key named
 *    (U: "'other one with [ ]' — brackets never named"): "two spots fit
 *    here — press ] for the other one", shown ONLY while a near-tie is live
 *    (the `aim-depth` gate proves the tie-gated string; this file pins that
 *    a NO-AMBIGUITY aim line carries no hint of it).
 * 4. The home reset is one honest sentence (U: 'hint rendered "Home: Esc
 *    Esc"'): "Home: press Esc twice" — the DOUBLE-press recenter actually
 *    wired in `src/camera/build-camera.ts` (`tests/e2e/camera-torture.spec.ts`
 *    proves the gesture; this file pins only the copy).
 */

const ready = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 30_000 })
}

const kitchenBuild = async (page: import('@playwright/test').Page, kinds: string[]) => {
  for (const kind of kinds) {
    await page.click(`#gw-tray-${kind}`)
    await page.click('#gw-place')
  }
}

test('a mid-build reload keeps EVERY piece: 3 placed, 3 restored (T: "1 of 3 survived")', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen01')
  await ready(page)

  await kitchenBuild(page, ['gapLip', 'drop', 'landing'])
  await expect(page.locator('#gw-piece-count')).toHaveText('3 of 3 pieces used')

  // the reload T did — mid-build, no run since the edits. The debounce
  // window has LONG closed by the round-trip, and the pagehide flush makes
  // even an instant reload safe (next test); every piece must be there.
  await page.reload()
  await ready(page)
  await expect(page.locator('#gw-piece-count')).toHaveText('3 of 3 pieces used')
  await expect(page.locator('#gw-status')).toHaveText('ready — 3 of 3 pieces used')

  expect(errors).toEqual([])
})

test('a reload fired instantly after an edit loses nothing (the before-unload flush)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen01')
  await ready(page)

  await kitchenBuild(page, ['gapLip', 'drop'])
  await expect(page.locator('#gw-piece-count')).toHaveText('2 of 3 pieces used')
  // NO settle time: the second pagehide fires while the debounce window of
  // the last edit may still be open — the flush hook must carry it
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
  await page.reload()
  await ready(page)
  await expect(page.locator('#gw-piece-count')).toHaveText('2 of 3 pieces used')

  expect(errors).toEqual([])
})

test('a kitchen edit never restores onto a bedroom level — and each level restores its OWN (no-leak)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  // build the full kitchen01 tray line, then WALK to the bedroom mid-build
  await page.goto('/?level=kitchen01')
  await ready(page)
  await kitchenBuild(page, ['gapLip', 'drop', 'landing'])

  await page.goto('/?level=bedroom01')
  await ready(page)
  // the kitchen autosave must NOT be this page's build: fresh, fixtures only
  await expect(page.locator('#gw-piece-count')).toHaveText(`0 of ${BEDROOM01.budget} pieces used`)

  // build one bedroom piece, walk BACK: kitchen keeps its 3, bedroom keeps
  // its 1 — two records, two levels, no cross-contamination either way
  await page.click('#gw-tray-straight')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText(`1 of ${BEDROOM01.budget} pieces used`)

  await page.goto('/?level=kitchen01')
  await ready(page)
  await expect(page.locator('#gw-piece-count')).toHaveText('3 of 3 pieces used')

  await page.goto('/?level=bedroom01')
  await ready(page)
  await expect(page.locator('#gw-piece-count')).toHaveText(`1 of ${BEDROOM01.budget} pieces used`)

  expect(errors).toEqual([])
})

test('the switch hint is plain words with the key named, and silent with no ambiguity (U)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen01')
  await ready(page)

  // no near-tie (a straight-on boot view, keyboard-walked target): the aim
  // line is BARE — a hint that fires without an ambiguity teaches nothing
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#gw-target-label')).toHaveText('target: cup on the table')

  // the teaching line names the home reset as a SENTENCE, not "Esc Esc"
  await page.click('#gw-tray-drop')
  await expect(page.locator('#gw-tray-hint')).toHaveText(
    'Aim: hover the world or ←→ · Place: click the world or Enter · Flip: R · Look: right-drag · Home: press Esc twice',
  )
  // and no player line still shows the bracket-glyph wording
  const spoken = await page.evaluate(() =>
    ['#gw-target-label', '#gw-tray-hint', '#gw-ghost-state', '#gw-status'].map((s) => document.querySelector(s)!.textContent ?? '').join('\n'),
  )
  expect(spoken).not.toContain('[ ]')
  expect(spoken).not.toContain('Esc Esc')

  expect(errors).toEqual([])
})
