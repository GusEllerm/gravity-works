/**
 * THE BUILD-VIEW GATE (playtest Q item 6: "left-drag on canvas PLACES a
 * piece (press+move+release counts as click) — no way to orbit; right-drag
 * does nothing"). On the BUILT page:
 *
 * 1. RIGHT-DRAG turns the camera (damped yaw, inside the clamp) and places
 *    NOTHING — the held piece stays in the hand.
 * 2. LEFT-DRAG past the 6 px threshold PANS the framing and places NOTHING
 *    — a travelled press is never a place (Q's accidental placement).
 * 3. A CLICK (press→release within 6 px) still places at the aimed socket
 *    — the placement verb survives the disambiguation intact.
 * 4. SPACE+DRAG is the keyboard alternative for the orbit verb.
 *
 * The camera assertions read `__gwCameraPose` (the live render transform —
 * the same seam §7.3's follow test uses) and `__gwBuildView` (the damped
 * yaw/pan state). Piece assertions read the counter the player reads.
 */
import { test, expect } from '@playwright/test'
import { BUILD_VIEW } from '../../src/camera/build-camera.ts'
import { goto } from './goto.ts'

const ready = (page: import('@playwright/test').Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

type Pose = { pos: number[]; quat: number[] }
const pose = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as Record<string, () => Pose>).__gwCameraPose())
type View = { yaw: number; pan: number[]; yawTarget: number; panTarget: number[] }
const view = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as Record<string, () => View>).__gwBuildView())

const quatAngle = (a: number[], b: number[]): number =>
  2 * Math.acos(Math.min(1, Math.abs(a.reduce((s, v, i) => s + v * b[i]!, 0))))

/** Hold a piece by HOVER (no button ends up focused — the keyboard-free
 *  state the drag tests need). Kitchen 01's tray is lip + drop + landing. */
async function holdPiece(page: import('@playwright/test').Page) {
  await page.hover('#gw-tray button[data-kind="gapLip"]')
  await expect(page.locator('#gw-ghost-state')).not.toHaveText('', { timeout: 10_000 })
}

test('right-drag orbits the build camera — the view turns, nothing is placed', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await goto(page, '/?level=kitchen01')
  await ready(page)
  await holdPiece(page)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  const before = await pose(page)
  expect((await view(page)).yaw).toBe(0) // framing starts at the solved static pose

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2, { steps: 6 })
  await page.mouse.up({ button: 'right' })

  // the DAMPED state arrives (tau 0.15 s — poll, never sleep-and-pray)
  await expect
    .poll(async () => (await view(page)).yaw, { timeout: 5_000 })
    .toBeGreaterThan(0.05)
  const after = await pose(page)
  expect(quatAngle(before.quat, after.quat)).toBeGreaterThan(0.02) // the CAMERA turned
  expect((await view(page)).yaw).toBeLessThanOrEqual(BUILD_VIEW.YAW_MAX + 1e-9) // hemisphere clamp
  // and the gesture placed NOTHING: the counter the player reads is the proof
  await expect(page.locator('#gw-piece-count')).toHaveText('0 of 3 pieces used')
  expect(errors).toEqual([])
})

test('left-drag pans the framing — it never places (playtest Q click-vs-drag)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await goto(page, '/?level=kitchen01')
  await ready(page)
  await holdPiece(page)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  const before = await pose(page)

  // a press that TRAVELS (press → 100 px move → release): the exact
  // gesture Q reported as "PLACES a piece"
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 - 60, { steps: 8 })
  await page.mouse.up()

  await expect
    .poll(async () => Math.hypot(...(await view(page)).panTarget.map(Math.abs)), { timeout: 5_000 })
    .toBeGreaterThan(0)
  const after = await pose(page)
  const moved = after.pos.reduce((s, v, i) => s + (v - before.pos[i]!) ** 2, 0)
  expect(Math.sqrt(moved)).toBeGreaterThan(0.01) // the framing moved
  expect(quatAngle(before.quat, after.quat)).toBeLessThan(1e-6) // pure translation: no turn
  await expect(page.locator('#gw-piece-count')).toHaveText('0 of 3 pieces used') // and NOTHING placed
  expect(errors).toEqual([])
})

test('a click (press→release within 6 px) still places at the aimed socket', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await goto(page, '/?level=kitchen01')
  await ready(page)
  await holdPiece(page)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  // AIM VIA THE RING, NOT THE CANVAS CENTRE: program T1.2 re-framed the
  // static build view on the SET, and under the room-centred law the dead
  // centre is counter, not necessarily an aimable deck pixel (it happened
  // to be one under the old track-box law). The seam that names the ring
  // a click would act on is the legit aim point for gesture specs (see
  // the playtest specs); sweep from the centre until one is under the
  // cursor, then click THAT pixel — the law-independent statement of
  // "press→release within 6 px places at the aimed socket".
  let px: number[] | null = null
  outer: for (const [dy, dx] of [
    [0, 0], [0, -90], [0, 90], [-60, 0], [60, 0], [-60, -90], [60, 90], [-60, 90], [60, -90],
  ] as const) {
    await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy)
    px = await page.evaluate(() =>
      (window as unknown as { __gwTargetSocketPx?: () => number[] | null }).__gwTargetSocketPx?.() ?? null,
    )
    if (px) break outer
  }
  expect(px, 'no aimable socket ring under any probe point').not.toBeNull()
  await page.mouse.click(px![0]!, px![1]!)
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used', { timeout: 10_000 })
  expect((await view(page)).panTarget).toEqual([0, 0]) // a click never frames
  expect((await view(page)).yawTarget).toBe(0)
  expect(errors).toEqual([])
})

test('space+drag is the orbit alternative — turns the view, places nothing', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await goto(page, '/?level=kitchen01')
  await ready(page)
  await holdPiece(page)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.keyboard.down('Space')
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2, { steps: 6 })
  await page.mouse.up()
  await page.keyboard.up('Space')

  await expect
    .poll(async () => (await view(page)).yaw, { timeout: 5_000 })
    .toBeLessThan(-0.05) // dragged left → yawed the other way
  expect(Math.abs((await view(page)).yaw)).toBeLessThanOrEqual(BUILD_VIEW.YAW_MAX + 1e-9)
  await expect(page.locator('#gw-piece-count')).toHaveText('0 of 3 pieces used')
  expect(errors).toEqual([])
})
