/**
 * THE CAMERA TORTURE GATE (playtests R+S round 3: right-drag "worked once,
 * then dead permanently"; the camera "zombied into a parts-bin void, only
 * a reload fixed it"). The reproduced root cause: a press whose RELEASE is
 * lost (released off the window / over browser chrome) left the gesture
 * recogniser believing the button was still down, so every later HOVER
 * moved the framing — the camera drifts by itself into a corner of the
 * set and the yaw clamp pins it there, which reads as "orbit died"
 * because drags in the saturated direction do nothing.
 *
 * The contract this gate holds: the camera is STATE-ROBUST — no pointer
 * sequence (20 randomized operations here, seeded so failures replay)
 * can leave the view unrecoverable:
 *
 * 1. A lost release is RECONCILED: after it, hover moves (buttons
 *    physically up) change the framing state by EXACTLY nothing.
 * 2. After the torture, a fresh deliberate right-drag still moves the
 *    yaw — the recogniser is responsive whatever the last 20 events were.
 * 3. `Escape Escape` brings the pose home from any state (the recovery
 *    hatch), damped to the solved static framing.
 */
import { test, expect } from '@playwright/test'
import { BUILD_VIEW } from '../../src/camera/build-camera.ts'

const ready = (page: import('@playwright/test').Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

type View = { yaw: number; pan: number[]; yawTarget: number; panTarget: number[] }
const view = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as Record<string, () => View>).__gwBuildView())

/** Deterministic LCG — a red run reproduces operation for operation. */
const lcg = (seed: number) => {
  let s = seed
  return (a: number, b: number) => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return a + (s / 0x7fffffff) * (b - a)
  }
}

const sane = async (page: import('@playwright/test').Page, where: string) => {
  const v = await view(page)
  for (const n of [v.yaw, v.yawTarget, v.pan[0], v.pan[1], v.panTarget[0], v.panTarget[1]])
    expect(Number.isFinite(n), `${where}: non-finite view state ${JSON.stringify(v)}`).toBe(true)
  expect(Math.abs(v.yaw), `${where}: yaw escaped the hemisphere: ${v.yaw}`).toBeLessThanOrEqual(
    BUILD_VIEW.YAW_MAX + 1e-9,
  )
  expect(Math.abs(v.yawTarget), `${where}: yaw target escaped`).toBeLessThanOrEqual(
    BUILD_VIEW.YAW_MAX + 1e-9,
  )
  // pan is clamped to PAN_MAX x span; every kitchen span is < 3 m, and a
  // stuck/zombie state shows up HERE long before this cap — the number is
  // a sanity fence, the exact clamp is proved in tests/unit/build-camera
  for (const p of [v.pan, v.panTarget])
    expect(Math.hypot(p[0], p[1]), `${where}: pan left the table: ${p}`).toBeLessThan(3)
}

test('a lost pointer release cannot turn hover into a drag (zombie-camera proof)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen02')
  await ready(page)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  // press, travel a little, then the RELEASE vanishes: the pointer leaves
  // the viewport in one hop and the up is never delivered (R's off-window
  // release; pre-fix this left the recogniser stuck in drag mode)
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 30, cy, { steps: 2 })
  await page.mouse.move(-60, cy, { steps: 1 })
  await page.mouse.up({ button: 'left' }) // off-viewport: never dispatched

  // now HOVER the canvas hard across it — buttons physically up, so the
  // framing targets must not move by a single unit
  const before = await view(page)
  for (let i = 0; i < 6; i++)
    await page.mouse.move(cx + (i % 2 ? 380 : -380), cy + (i % 2 ? -200 : 200), { steps: 6 })
  await page.waitForTimeout(150)
  const after = await view(page)
  expect(Math.abs(after.yawTarget - before.yawTarget), 'hover ORBITED (zombie)').toBeLessThan(1e-9)
  expect(
    Math.hypot(after.panTarget[0] - before.panTarget[0], after.panTarget[1] - before.panTarget[1]),
    'hover PANNED (zombie)',
  ).toBeLessThan(1e-9)

  // and the view is RECOVERABLE: a fresh right-drag still orbits, in the
  // direction away from whichever clamp a legitimate drag may have hit
  const dir = before.yawTarget <= 0 ? 1 : -1
  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(cx + dir * 150, cy, { steps: 6 })
  await page.mouse.up({ button: 'right' })
  await expect
    .poll(async () => (await view(page)).yawTarget, { timeout: 5_000 })
    .not.toBe(before.yawTarget)
  await sane(page, 'after recovery')
  expect(errors).toEqual([])
})

test('Escape Escape brings the view home from any state', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen02')
  await ready(page)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  // park the view anywhere: orbit to the clamp and pan off the centre
  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(cx + 600, cy, { steps: 8 })
  await page.mouse.up({ button: 'right' })
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 200, cy + 160, { steps: 6 })
  await page.mouse.up()
  await expect
    .poll(async () => (await view(page)).yawTarget, { timeout: 5_000 })
    .not.toBe(0)

  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await expect
    .poll(async () => {
      const v = await view(page)
      return Math.abs(v.yaw) + Math.abs(v.yawTarget) + Math.hypot(v.pan[0], v.pan[1])
    }, { timeout: 5_000 })
    .toBeLessThan(1e-4)
  expect(errors).toEqual([])
})

test('torture: 20 randomized pointer ops leave the camera sane, responsive and homing', async ({ page }) => {
  test.slow()
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen02')
  await ready(page)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const rnd = lcg(20261009)

  for (let op = 0; op < 20; op++) {
    const kind = Math.floor(rnd(0, 8))
    switch (kind) {
      case 0: { // orbit drag, in-canvas release
        await page.mouse.move(cx, cy)
        await page.mouse.down({ button: 'right' })
        await page.mouse.move(cx + rnd(-200, 200), cy + rnd(-60, 60), { steps: 6 })
        await page.mouse.up({ button: 'right' })
        break
      }
      case 1: { // pan drag
        await page.mouse.move(cx + rnd(-150, 150), cy + rnd(-80, 80))
        await page.mouse.down()
        await page.mouse.move(cx + rnd(-250, 250), cy + rnd(-120, 120), { steps: 6 })
        await page.mouse.up()
        break
      }
      case 2: { // orbit released OUTSIDE the canvas (the controls gap —
        // deliberately NOT over the tray: a real mouse path across tray
        // buttons would hover-PICK a kind and change the place semantics)
        await page.mouse.move(cx, cy)
        await page.mouse.down({ button: 'right' })
        await page.mouse.move(cx, box.y - 6, { steps: 5 })
        await page.mouse.up({ button: 'right' })
        break
      }
      case 3: // right-drag whose release is LOST off the viewport
      case 4: { // left-drag whose release is LOST off the viewport
        await page.mouse.move(cx, cy)
        await page.mouse.down(kind === 3 ? { button: 'right' } : undefined)
        await page.mouse.move(cx + rnd(-80, 80), cy, { steps: 3 })
        await page.mouse.move(-50, cy, { steps: 1 })
        await page.mouse.up(kind === 3 ? { button: 'right' } : undefined)
        break
      }
      case 5: { // hover sweep — never a drag verb, at any point in the run
        const before = await view(page)
        for (let i = 0; i < 4; i++)
          await page.mouse.move(cx + (i % 2 ? 300 : -300), cy + rnd(-160, 160), { steps: 5 })
        const after = await view(page)
        // only the RING may move here: the framing state must be untouched
        expect(
          Math.abs(after.yawTarget - before.yawTarget) +
            Math.hypot(after.panTarget[0] - before.panTarget[0], after.panTarget[1] - before.panTarget[1]),
          `op ${op}: hover moved the framing (zombie state)`,
        ).toBeLessThan(1e-9)
        break
      }
      case 6: { // mixed buttons: left press, right joins (orbit verb), release both
        await page.mouse.move(cx, cy)
        await page.mouse.down()
        await page.mouse.down({ button: 'right' })
        await page.mouse.move(cx + rnd(-120, 120), cy, { steps: 4 })
        await page.mouse.up({ button: 'right' })
        await page.mouse.up()
        break
      }
      default: { // rapid press/release bursts on the canvas (no piece held:
        // these may only ever move the ring)
        for (let i = 0; i < 3; i++) {
          await page.mouse.click(cx + rnd(-100, 100), cy + rnd(-60, 60))
        }
      }
    }
    await sane(page, `after op ${op} (${kind})`)
  }

  // with nothing held the whole torture placed NOTHING the player did not
  // ask for: the counter they read is the proof
  await expect(page.locator('#gw-piece-count')).toHaveText(/0 of \d+ pieces used/)

  // RESPONSIVE: a fresh right-drag still moves the yaw (toward the free
  // direction, whichever clamp a legitimate drag left us near)
  const v = await view(page)
  const dir = v.yawTarget <= 0 ? 1 : -1
  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(cx + dir * 150, cy, { steps: 6 })
  await page.mouse.up({ button: 'right' })
  await expect
    .poll(async () => (await view(page)).yawTarget, { timeout: 5_000 })
    .not.toBe(v.yawTarget)

  // HOMING: double-Escape damps every offset back to the solved framing
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await expect
    .poll(async () => {
      const w = await view(page)
      return Math.abs(w.yaw) + Math.abs(w.yawTarget) + Math.hypot(w.pan[0], w.pan[1])
    }, { timeout: 5_000 })
    .toBeLessThan(1e-4)
  await sane(page, 'after homing')
  expect(errors).toEqual([])
})
