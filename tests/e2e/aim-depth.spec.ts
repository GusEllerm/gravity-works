/**
 * THE AIM-DEPTH GATE (playtest S round 3, K3 wall: the Landing ghost said
 * "fits here" at every floor point, "yet it ALWAYS snapped onto the chain
 * BEHIND the cup — I never found how to lay a catcher under the flight").
 * Under orbit two open sockets can OVERLAP in screen space; the old
 * screen-nearest pick could hand the click to the FAR one on a couple of
 * projected pixels. The contract now:
 *
 * 1. Among screen-space near-ties the socket NEARER the camera wins —
 *    hovering (and therefore clicking) the ambiguous midpoint between a
 *    near socket and a far one aims the NEAR one.
 * 2. The choice is EXPOSED: the label names the tie ("n of m near"), and
 *    `]` / Tab cycle the ring through the candidates, so the far socket is
 *    reachable too — the ambiguity is handed to the player, not hidden.
 *
 * Geometry is measured live through the `__gwOpenSockets` /
 * `__gwCameraPose` seams (the same projection the builder's aim does, so
 * the pair the test aims at is a real near-tie of THIS orbit, not a
 * hardcoded screen point).
 */
import { test, expect } from '@playwright/test'
import { HOVER_PX } from '../../src/ui/builder.ts'

type Pose = { pos: number[]; quat: number[] }
type Box = { x: number; y: number; width: number; height: number }

/** Project a world point to canvas-absolute px + camera distance, reading
 *  the live render camera (matches THREE's 35°-vertical perspective). */
function project(pose: Pose, box: Box, p: number[]): { x: number; y: number; z: number; dCam: number } {
  const [qx, qy, qz, qw] = pose.quat
  const rot = (v: number[]) => {
    const ux = 2 * (qy * v[2] - qz * v[1])
    const uy = 2 * (qz * v[0] - qx * v[2])
    const uz = 2 * (qx * v[1] - qy * v[0])
    return [
      v[0] + qw * ux + (qy * uz - qz * uy),
      v[1] + qw * uy + (qz * ux - qx * uz),
      v[2] + qw * uz + (qx * uy - qy * ux),
    ]
  }
  const fwd = rot([0, 0, -1])
  const right = rot([1, 0, 0])
  const up = rot([0, 1, 0])
  const v = [p[0]! - pose.pos[0]!, p[1]! - pose.pos[1]!, p[2]! - pose.pos[2]!]
  const dot = (a: number[], b: number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!
  const f = 1 / Math.tan((35 * Math.PI) / 180 / 2)
  const z = dot(v, fwd)
  const nx = 0.5 + (dot(v, right) / z) * (f / (box.width / box.height)) * 0.5
  const ny = 0.5 - (dot(v, up) / z) * f * 0.5
  return { x: box.x + nx * box.width, y: box.y + ny * box.height, z, dCam: Math.hypot(v[0]!, v[1]!, v[2]!) }
}

test('K3 at a 30° orbit: the ambiguous midpoint aims the NEARER socket, and [ ] / Tab cycle the tie', async ({ page }) => {
  test.slow()
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen03')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
  const box = (await page.locator('#gw-canvas').boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  // orbit 30 degrees (YAW_PER_PX 0.0058 — 100 px with the per-event delta
  // loss the drag test already tolerates)
  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(cx + 100, cy, { steps: 8 })
  await page.mouse.up({ button: 'right' })
  await expect
    .poll(async () => (await page.evaluate(() => (window as unknown as Record<string, () => { yaw: number; yawTarget: number } >).__gwBuildView())).yawTarget, { timeout: 5_000 })
    .toBeGreaterThan(0.3)

  const pose = (await page.evaluate(() => (window as unknown as Record<string, () => Pose>).__gwCameraPose())) as Pose
  const sockets = (await page.evaluate(() => (window as unknown as Record<string, () => number[][]>).__gwOpenSockets())) as number[][]
  const proj = sockets.map((s) => project(pose, box, s))
  // the CLOSEST screen pair with a real depth difference — the exact
  // ambiguity S hit; the midpoint between them is the ambiguous aim point
  let best: { i: number; j: number; dPx: number } | null = null
  for (let i = 0; i < sockets.length; i++)
    for (let j = i + 1; j < sockets.length; j++) {
      if (proj[i]!.z <= 0 || proj[j]!.z <= 0) continue
      const dPx = Math.hypot(proj[i]!.x - proj[j]!.x, proj[i]!.y - proj[j]!.y)
      if (proj[i]!.dCam === proj[j]!.dCam) continue
      if (!best || dPx < best.dPx) best = { i, j, dPx }
    }
  expect(best, 'K3 exposes no overlapping socket pair at 30° — the aim has no ambiguity to resolve').not.toBeNull()
  const b = best as { i: number; j: number; dPx: number }
  const a = proj[b.i]!
  const c = proj[b.j]!
  expect(Math.abs(a.dCam - c.dCam), 'the pair carries no depth signal').toBeGreaterThan(0.05)
  // the midpoint must be a genuine near-tie: each side within HOVER reach
  // of the mid point (at the exact midpoint the two screen distances are
  // EQUAL, so the tie band always holds and depth must decide)
  expect(b.dPx / 2, 'pair too far apart on screen to be within click reach of both').toBeLessThan(HOVER_PX)
  const mx = (a.x + c.x) / 2
  const my = (a.y + c.y) / 2
  expect(mx, 'tie midpoint left the canvas').toBeGreaterThan(box.x + 8)
  expect(mx).toBeLessThan(box.x + box.width - 8)
  expect(my, 'tie midpoint left the canvas').toBeGreaterThan(box.y + 8)
  expect(my).toBeLessThan(box.y + box.height - 8)
  const nearSock = a.dCam < c.dCam ? sockets[b.i]! : sockets[b.j]!
  const farSock = a.dCam < c.dCam ? sockets[b.j]! : sockets[b.i]!

  // AIM the ambiguous midpoint (hover first, exactly like the player):
  // the ring must sit on the NEARER socket, and the label must say the
  // pointer could mean more than one socket
  await page.mouse.move(mx, my)
  await expect
    .poll(async () => {
      const t = (await page.evaluate(() => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocket())) as number[] | null
      if (!t) return -1
      return Math.hypot(t[0]! - nearSock[0]!, t[1]! - nearSock[1]!, t[2]! - nearSock[2]!)
    }, { timeout: 5_000 })
    .toBeLessThan(0.02)
  const atNear = (await page.evaluate(() => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocket())) as number[]
  expect(
    Math.hypot(atNear[0]! - farSock[0]!, atNear[1]! - farSock[1]!, atNear[2]! - farSock[2]!),
    'the click-intent point aimed the FAR socket (chain-behind-the-cup bug)',
  ).toBeGreaterThan(0.02)
  await expect(page.locator('#gw-target-label')).toContainText('near')

  // EXPOSED: ']' cycles the ring to the far candidate — and Tab cycles it
  // too (world focus). The label tracks which one the ring marks.
  await page.keyboard.press(']')
  await expect
    .poll(async () => {
      const t = (await page.evaluate(() => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocket())) as number[] | null
      return t ? Math.hypot(t[0]! - farSock[0]!, t[1]! - farSock[1]!, t[2]! - farSock[2]!) : -1
    }, { timeout: 5_000 })
    .toBeLessThan(0.02)
  await page.keyboard.press('Tab')
  await expect
    .poll(async () => {
      const t = (await page.evaluate(() => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocket())) as number[] | null
      return t ? Math.hypot(t[0]! - nearSock[0]!, t[1]! - nearSock[1]!, t[2]! - nearSock[2]!) : -1
    }, { timeout: 5_000 })
    .toBeLessThan(0.02)
  expect(errors).toEqual([])
})
