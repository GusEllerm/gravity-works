import { test, expect } from '@playwright/test'
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts'
import { KITCHEN04 } from '../../src/world/levels/kitchen04.level.ts'
import { replayRun } from '../../src/replay/replay.ts'

/**
 * Stage-3 level↔set wiring, end to end on the built shell:
 *
 * 1. `/?level=kitchen01&launch=1&build=par` finishes IN its set (the mounted
 *    group is tagged on the stage), and its state hash equals the headless
 *    Node replay of the same (level, build, seed) — the set is visual mount
 *    only and cannot perturb physics through the browser (`build=par`
 *    because the GAME default is now the fixture-only build — the player
 *    builds the tray pieces; this seam pins the reference build);
 * 2. `/?level=kitchen04&launch=1&build=par` finishes, the hazard status path
 *    is live
 *    (the world exposes its mounted zone count: 1 for the tap level, 0 for
 *    hazard-free levels — the same field the grip hook reads);
 * 3. the set-aware builder guard: on kitchen03 a piece targeted at a bowl-rim
 *    fixture socket turns the ghost RED (`blocked`) instead of green;
 * 4. the help drawer ships COLLAPSED behind its toggle (the deployed-page
 *    bug the director caught: `hidden` did not fight the inline `display`);
 * 5. the harness level seam (`?harness=1&scene=kitchen-set&level=kitchen03`)
 *    renders the set with that level's par build mounted — the canonical
 *    shot list sourced through `setCameras`, falling back to the kitchen rig.
 */

interface HarnessWindow {
  __sceneReady?: boolean
  __sceneError?: string
}

test('kitchen01 finishes in its mounted set at the headless replay hash', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  const node = await replayRun(KITCHEN01, KITCHEN01.parBuild())
  expect(node.status).toBe('finished')

  await page.goto('/?level=kitchen01&launch=1&build=par')
  await expect(page.locator('#gw-stage')).toHaveAttribute('data-set-mounted', 'kitchen', { timeout: 60_000 })
  await expect(page.locator('#gw-status')).toContainText('finished', { timeout: 60_000 })

  const text = (await page.locator('#gw-status').textContent()) ?? ''
  const hash = text.match(/hash ([0-9a-f]{8})/)?.[1]
  expect(hash, `status line carried no hash: ${JSON.stringify(text)}`).toBe(node.hash)
  // the hazard status path is data-honest on a hazard-free level, too
  expect(await page.evaluate(() => (window as unknown as Record<string, () => number>).__gwHazardZones())).toBe(0)
  expect(errors).toEqual([])
})

test('kitchen04 par finishes at the replay hash and the hazard path is live', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  const node = await replayRun(KITCHEN04, KITCHEN04.parBuild())
  expect(node.status).toBe('finished')

  await page.goto('/?level=kitchen04&launch=1&build=par')
  await expect(page.locator('#gw-stage')).toHaveAttribute('data-set-mounted', 'kitchen', { timeout: 60_000 })
  // the mounted world carries the tap's wet-patch zone (the grip field the
  // car's wheel contacts sample — this par line is grip-independent by design)
  await expect
    .poll(() => page.evaluate(() => (window as unknown as Record<string, () => number>).__gwHazardZones()), { timeout: 60_000 })
    .toBe(1)
  await expect(page.locator('#gw-status')).toContainText('finished', { timeout: 60_000 })
  const text = (await page.locator('#gw-status').textContent()) ?? ''
  expect(text.match(/hash ([0-9a-f]{8})/)?.[1]).toBe(node.hash)
  expect(errors).toEqual([])
})

test('the builder ghost goes red on a set solid (L03 bowl-rim socket)', async ({ page }) => {
  await page.goto('/?level=kitchen03')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

  // the default boot is the FIXTURE build: ramp + cup + the two rim
  // fixtures, tray full (`straight` is on L03's tray, so it is holdable)
  await page.click('#gw-tray button[data-kind="straight"]')
  // targets: level start, then the fixtures' open exits — end of ramp,
  // end of finishCup, and the bowl-rim fixture socket (end of curve =
  // `bowl.out`; `bowl.in` is closed by the counter-arc's in-socket) —
  // riding the rim, where a straight would drive through the ceramic
  await expect(page.locator('#gw-target-label')).toContainText('level start')
  await page.locator('#gw-builder').press('ArrowRight') // end of ramp
  await expect(page.locator('#gw-target-label')).toContainText('end of ramp')
  await page.locator('#gw-builder').press('ArrowRight') // the cup's run-out
  await expect(page.locator('#gw-target-label')).toContainText('end of finishCup')
  await page.locator('#gw-builder').press('ArrowRight') // end of curve -> bowl.out
  await expect(page.locator('#gw-target-label')).toContainText('end of curve')
  await expect(page.locator('#gw-ghost-state')).toHaveText('blocked', { timeout: 10_000 })

  // the red ghost is the guard's claim; a seat attempt (Enter — a blocked
  // seat is refused) adds nothing to the build
  const before = (await page.locator('#gw-piece-count').textContent()) ?? ''
  await page.locator('#gw-builder').press('Enter')
  await expect(page.locator('#gw-piece-count')).toHaveText(before)
})

test('the help drawer is collapsed behind its toggle until clicked', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#gw-help-list')).toBeHidden()
  await expect(page.locator('#gw-help-toggle')).toHaveAttribute('aria-expanded', 'false')
  await page.click('#gw-help-toggle')
  await expect(page.locator('#gw-help-list')).toBeVisible()
  await expect(page.locator('#gw-help-toggle')).toHaveAttribute('aria-expanded', 'true')
  await page.click('#gw-help-toggle')
  await expect(page.locator('#gw-help-list')).toBeHidden()
})

test('harness scene=kitchen-set&level=kitchen03 mounts the level in the set', async ({ page }) => {
  await page.goto('/?harness=1&scene=kitchen-set&level=kitchen03&shot=hero')
  await page.waitForFunction(() => {
    const w = window as unknown as HarnessWindow
    return w.__sceneReady === true || w.__sceneError !== undefined
  })
  const error = await page.evaluate(() => (window as unknown as HarnessWindow).__sceneError)
  expect(error, 'harness reported an error').toBeUndefined()
})
