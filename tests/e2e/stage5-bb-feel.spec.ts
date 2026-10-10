/**
 * Stage 5 — the four playtest-BB feel fixes, end to end (branch
 * stage5-bb-feel):
 *
 * 1. THE FIRST PLAY CLICK MOVES (BB: "first Play click did nothing —
 *    second click worked"). The playhead races its own watchability: the
 *    film LOOKS over through the whole finish tail (and its last steps)
 *    while the resume test used to demand `time >= duration`, so a click
 *    landing there advanced one or two steps and re-paused — motion too
 *    short to see is a dead click. Play now rewinds whenever the playable
 *    window left is under PLAY_RESUME_MIN, and the click after a pause
 *    inside the tail must move the scrubber on the FIRST press.
 * 2. NO BLANK BETWEEN CUTS + THE FINALE LANDS ON THE CUP (BB: "one ~0.5 s
 *    window shows an empty ground frame", "if the cuts actually ENDED on
 *    the cup-dunk I'd forward it"): the last second of a real kitchen01
 *    replay is censused every 100 ms — every frame must carry car pixels
 *    (since program P4 mounts `createCarRig` on the film path the census
 *    is the RIG's body-blue band inside a 65 px box centred on the
 *    projected car NDC: measured 3.9–51 % on every honest kitchen01
 *    frame, ≈ 0 % on empty ground — the retired proxy-red census said
 *    the same thing while the film still starred the box), and the cup
 *    must be projected in-frame at the terminal
 *    beats. The cuts carry the subject through their blends and the
 *    finish shot owns the last 0.4 s before capture (REPLAY_FINISH_LEAD).
 * 3. AIM HAS A SNAP RANGE (BB bug 4, the round-3 recurrence: "click at
 *    700,600 placed a lip 150 px away and it counted"): the range is the
 *    screen pick cone `HOVER_PX` — a clean click beyond it from every
 *    socket places NOTHING, moves no ring, and says "nothing fits out
 *    here" (the old code's crime was placing at the STALE ring when the
 *    aim found nothing, not the radius — the click was 150 px out,
 *    already beyond 120); the near-tie midpoint still snaps to the nearer
 *    socket exactly as `aim-depth.spec.ts` proves empty-handed — here
 *    proven WHILE HOLDING.
 * 4. `]` COUNTS DISTINCT BUILD OUTCOMES (BB bug 3: "']' other spot
 *    sometimes silently does nothing — two runs byte-identical at
 *    1.94 s"): the tie hint's count must equal the number of DISTINCT
 *    dry-run canonical hashes (`__gwTieOutcomes`, `dryRunHash` from the
 *    test side) — outcomes, not sockets. A kitchen03 orbit tie held on a
 *    tray piece asserts the equality in both directions (two distinct
 *    outcomes → "two spots fit here"; the walk visits distinct builds).
 *    The collapse half of the law — an equivalent alternate is NOT
 *    offered — is carried by `tests/unit/aim-outcomes.test.ts`, because
 *    the builder's own join-filter structurally excludes coincident
 *    sockets (a ladder-wide scan finds zero build-equivalent tie pairs in
 *    shipped geometry — see the session log).
 */
import { test, expect, type Page } from '@playwright/test'
import zlib from 'node:zlib'
import { PNG } from 'pngjs'
import { replayRun } from '../../src/replay/replay.ts'
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts'
import { encodeShareUrl, type ShareCodec } from '../../src/share/share.ts'
import { dryRunHash } from '../../src/ui/builder.ts'
import { deserialize } from '../../src/track/build.ts'
import type { PieceKind, PieceParams } from '../../src/track/pieces.ts'
import type { Build } from '../../src/track/build.ts'
import { goto } from './goto.ts'

const zlibCodec: ShareCodec = {
  deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))),
  inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))),
}

const seam = (page: Page) =>
  page.evaluate(() => (window as never as { __gwReplayState: () => { t: number } }).__gwReplayState().t)
const aria = (page: Page) => page.getAttribute('#gw-replay-play', 'aria-pressed')

async function openKitchen01Share(page: Page): Promise<{ time: number; duration: number }> {
  const build = KITCHEN01.parBuild()
  const node = await replayRun(KITCHEN01, build)
  const url = await encodeShareUrl({ levelId: 'kitchen01', seed: build.seed, hash: node.hash, build }, zlibCodec)
  await goto(page, `/${url}`)
  await expect(page.locator('#gw-replay-status')).toHaveText('verified', { timeout: 90_000 })
  await page.waitForFunction(
    () => typeof (window as never as { __gwReplayState?: unknown }).__gwReplayState === 'function',
    undefined,
    { timeout: 90_000 },
  )
  return page.evaluate(() => {
    const t = (window as never as { __gwReplayTrace: () => { time: number; duration: number } }).__gwReplayTrace()
    return { time: t.time, duration: t.duration }
  })
}

/** Pause, then seek by dispatching the timeline's own pointer pair (the
 *  replay-red pattern) — deterministic, no wall-clock drift. */
async function seek(page: Page, t: number): Promise<void> {
  await page.evaluate((tt: number) => {
    const play = document.querySelector('#gw-replay-play') as HTMLButtonElement
    if (play.getAttribute('aria-pressed') === 'true') play.click()
    const el = document.querySelector('#gw-replay-timeline')!
    const r = el.getBoundingClientRect()
    const tr = (window as unknown as { __gwReplayTrace: () => { duration: number } }).__gwReplayTrace()
    const x = r.left + (tt / tr.duration) * r.width
    const id = 40 + Math.round(tt * 100)
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: r.top + r.height / 2, pointerId: id }))
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: r.top + r.height / 2, pointerId: id }))
  }, t)
}

/** THE CAR CENSUS (program P4 re-baseline): the ratified sedan's body
 *  blue (B clear of R by 60, B above 90 under the world lights and the
 *  post chain) inside a 65 px box centred on the projected car NDC —
 *  `__gwReplayCarNdc`, the very pose the rig rides. A frame with the car
 *  in it measures 3.9–51 % here (kitchen01 par, every honest framing
 *  from the wide opening to the finish hold); a box on empty ground reads
 *  ≈ 0 %, because nothing else in the kitchen set sits in this band. The
 *  box census replaces the retired full-frame proxy-red census (the film
 *  now stars the sedan — the proxy's colour survives only in track
 *  orange); a frame whose car projects off-frame counts 0. The floor
 *  (0.015) is the wide-opening measurement, 3.9 %, over ≈ 2.5. */
const CAR_BOX_HALF = 32
function carShare(png: PNG, carNdc: number[] | null): number {
  if (!carNdc || Math.abs(carNdc[0]!) > 1.4 || Math.abs(carNdc[1]!) > 1.4) return 0
  const cx = Math.round(((carNdc[0]! + 1) / 2) * png.width)
  const cy = Math.round(((1 - carNdc[1]!) / 2) * png.height)
  let car = 0
  let n = 0
  for (let y = cy - CAR_BOX_HALF; y <= cy + CAR_BOX_HALF; y++) {
    if (y < 0 || y >= png.height) continue
    for (let x = cx - CAR_BOX_HALF; x <= cx + CAR_BOX_HALF; x++) {
      if (x < 0 || x >= png.width) continue
      const p = (y * png.width + x) * 4
      const r = png.data[p]!
      const g = png.data[p + 1]!
      const b = png.data[p + 2]!
      if (b > 90 && b - r > 60 && b - g > 20) car++
      n++
    }
  }
  return n ? car / n : 0
}

test.describe('stage 5 playtest-BB feel fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('1a: after the opening autoplay ends, ONE Play click starts motion and the scrubber ticks', async ({ page }) => {
    test.slow()
    const tr = await openKitchen01Share(page)
    void tr
    // let the opening autoplay run the film to its end (the BB state)
    await expect.poll(async () => seam(page), { timeout: 60_000 }).toBeGreaterThan(3.0)
    await expect.poll(async () => aria(page), { timeout: 10_000 }).toBe('false')
    await page.click('#gw-replay-play')
    await expect(page.locator('#gw-replay-play')).toHaveAttribute('aria-pressed', 'true')
    const t1 = await seam(page)
    await page.waitForTimeout(300)
    const t2 = await seam(page)
    expect(t2, 'the FIRST click must move the scrubber').toBeGreaterThan(t1)
  })

  test('1b: paused inside the finish tail, the Play click REWINDS — never burns the invisible sliver', async ({ page }) => {
    test.slow()
    const tr = await openKitchen01Share(page)
    // paused 0.25 s short of the end — inside the settle the viewer has
    // already watched: the old code played that sliver and re-paused
    // (BB's "nothing happened"); Play must now REWIND and play.
    await seek(page, tr.duration - 0.25)
    expect(await aria(page), 'must start paused').toBe('false')
    await page.click('#gw-replay-play')
    const t1 = await seam(page)
    expect(t1, 'a tail Play click restarts from 0').toBeLessThan(0.6)
    await page.waitForTimeout(300)
    expect(await seam(page)).toBeGreaterThan(t1)
    expect(await aria(page)).toBe('true')
  })

  test('2: per-100 ms census of the last second — no empty-stage frames, cup on-screen at the terminal beats', async ({ page }) => {
    test.slow()
    const tr = await openKitchen01Share(page)
    // the last second of the RUN plus the finish tail — the finale, the
    // cut into it, and the settle. BB's blank window (≈ 1.3 s) sits at the
    // far edge of this sweep; the cut into the finale sits inside it.
    for (let t = Math.max(0, tr.time - 1.0); t <= tr.duration + 0.001; t += 0.1) {
      await seek(page, t)
      const ndc = await page.evaluate(() => ({
        car: (window as never as { __gwReplayCarNdc: () => number[] | null }).__gwReplayCarNdc(),
        cup: (window as never as { __gwReplayGoalNdc: () => number[] | null }).__gwReplayGoalNdc(),
      }))
      const png = PNG.sync.read(Buffer.from(await page.locator('#gw-canvas').screenshot()))
      const share = carShare(png, ndc.car)
      expect(share, `empty-stage frame (no car in frame) at t=${t.toFixed(2)} — car-band ${(share * 100).toFixed(3)}%`).toBeGreaterThanOrEqual(0.015)
    }
    // the cup on screen at the terminal beat and at the end of the tail
    for (const t of [tr.time, tr.duration]) {
      await seek(page, t)
      const cup = await page.evaluate(() => (window as never as { __gwReplayGoalNdc: () => number[] | null }).__gwReplayGoalNdc())
      expect(cup, 'no cup to frame').not.toBeNull()
      expect(Math.abs(cup![0]!), `cup off screen at t=${t.toFixed(2)}`).toBeLessThanOrEqual(0.8)
      expect(Math.abs(cup![1]!), `cup off screen at t=${t.toFixed(2)}`).toBeLessThanOrEqual(0.8)
    }
  })

  test('3: a click far from every socket places NOTHING and says so; a held near-tie still snaps to the nearer socket', async ({ page }) => {
    test.slow()
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await goto(page, '/?level=kitchen03')
    await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
    const box = (await page.locator('#gw-canvas').boundingBox())!
    await page.hover('#gw-tray button[data-kind="landing"]')
    await expect(page.locator('#gw-ghost-state')).not.toHaveText('', { timeout: 10_000 })
    const count0 = (await page.locator('#gw-piece-count').textContent())!

    // THE FAR CLICK: every open socket is projected; the click point is
    // the canvas corner farthest from all of them — beyond the snap range
    // (`HOVER_PX`, the screen pick cone) of every socket, which is where
    // the aim law must speak instead of placing at the resting ring.
    const pose = (await page.evaluate(() => (window as unknown as Record<string, () => { pos: number[]; quat: number[] }>).__gwCameraPose())) as { pos: number[]; quat: number[] }
    const sockets = (await page.evaluate(() => (window as unknown as Record<string, () => number[][]>).__gwOpenSockets())) as number[][]
    const proj = sockets.map((p) => projectPoint(pose, box, p)).filter((p): p is Projected => p !== null)
    const corners = [
      { x: box.x + 12, y: box.y + 12 },
      { x: box.x + box.width - 12, y: box.y + 12 },
      { x: box.x + 12, y: box.y + box.height - 12 },
      { x: box.x + box.width - 12, y: box.y + box.height - 12 },
    ]
    let far = corners[0]!
    let bestGap = -1
    for (const c of corners) {
      const gap = Math.min(...proj.map((p) => Math.hypot(p.x - c.x, p.y - c.y)))
      if (gap > bestGap) {
        bestGap = gap
        far = c
      }
    }
    expect(bestGap, 'no canvas point is screen-far from every socket here').toBeGreaterThan(140)
    const targetBefore = (await page.evaluate(() => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocket())) as number[] | null
    await page.mouse.click(far.x, far.y)
    await expect(page.locator('#gw-ghost-state')).toContainText('nothing fits out here')
    expect(await page.locator('#gw-piece-count').textContent(), 'a far click must place NOTHING').toBe(count0)
    const targetAfter = (await page.evaluate(() => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocket())) as number[] | null
    if (targetBefore !== null && targetAfter !== null) {
      expect(Math.hypot(targetAfter[0]! - targetBefore[0]!, targetAfter[1]! - targetBefore[1]!, targetAfter[2]! - targetBefore[2]!), 'the ring must not jump').toBeLessThan(1e-9)
    }

    // THE NEAR-TIE STILL SNAPS (while HOLDING): orbit 30° (the aim-depth
    // geometry), hover the ambiguous midpoint — the NEARER socket takes
    // the aim and the tie is walkable.
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    await page.mouse.move(cx, cy)
    await page.mouse.down({ button: 'right' })
    await page.mouse.move(cx + 100, cy, { steps: 8 })
    await page.mouse.up({ button: 'right' })
    await expect
      .poll(async () => {
        // SETTLED, not merely TARGETED (P3): the geometry below projects
        // the LIVE pose, so a pose read mid-damping makes the tie-pair pick
        // frame-pacing roulette — the frame-rate truth, not a clock
        const v = await page.evaluate(() => (window as unknown as Record<string, () => { yaw: number; yawTarget: number }>).__gwBuildView())
        return v.yawTarget > 0.3 && Math.abs(v.yaw - v.yawTarget) < 1e-3
      }, { timeout: 10_000, message: 'the 30° orbit never SETTLED past 0.3 rad' })
      .toBe(true)
    const pose2 = (await page.evaluate(() => (window as unknown as Record<string, () => { pos: number[]; quat: number[] }>).__gwCameraPose())) as { pos: number[]; quat: number[] }
    const sockets2 = (await page.evaluate(() => (window as unknown as Record<string, () => number[][]>).__gwOpenSockets())) as number[][]
    const proj2 = sockets2.map((s) => ({ s, p: projectPoint(pose2, box, s) })).filter((c) => c.p !== null && c.p.z > 0) as { s: number[]; p: { x: number; y: number; dCam: number; z: number } }[]
    let pair: { a: number[]; b: number[]; ax: number; ay: number; bx: number; by: number; near: number[] } | null = null
    outer: for (let i = 0; i < proj2.length; i++)
      for (let j = i + 1; j < proj2.length; j++) {
        const dPx = Math.hypot(proj2[i]!.p.x - proj2[j]!.p.x, proj2[i]!.p.y - proj2[j]!.p.y)
        if (proj2[i]!.p.dCam === proj2[j]!.p.dCam) continue
        if (dPx > 110) continue
        if (Math.abs(proj2[i]!.p.dCam - proj2[j]!.p.dCam) < 0.05) continue
        const mx = (proj2[i]!.p.x + proj2[j]!.p.x) / 2
        const my = (proj2[i]!.p.y + proj2[j]!.p.y) / 2
        if (mx < box.x + 8 || mx > box.x + box.width - 8 || my < box.y + 8 || my > box.y + box.height - 8) continue
        pair = {
          a: proj2[i]!.s, b: proj2[j]!.s, ax: mx, ay: my, bx: mx, by: my,
          near: proj2[i]!.p.dCam < proj2[j]!.p.dCam ? proj2[i]!.s : proj2[j]!.s,
        }
        if (dPx < 90) break outer
      }
    expect(pair, 'kitchen03 exposes no holdable near-tie at 30°').not.toBeNull()
    await page.mouse.move(pair!.ax, pair!.ay, { steps: 3 })
    await expect
      .poll(async () => {
        const t = (await page.evaluate(() => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocket())) as number[] | null
        if (!t) return -1
        return Math.hypot(t[0]! - pair!.near[0]!, t[1]! - pair!.near[1]!, t[2]! - pair!.near[2]!)
      }, { timeout: 5_000 })
      .toBeLessThan(0.02)
    expect(errors).toEqual([])
  })

  test('4: the tie hint counts DISTINCT dry-run build outcomes, not sockets', async ({ page }) => {
    test.slow()
    await goto(page, '/?level=kitchen03')
    await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
    const box = (await page.locator('#gw-canvas').boundingBox())!
    await page.hover('#gw-tray button[data-kind="landing"]')
    await expect(page.locator('#gw-ghost-state')).not.toHaveText('', { timeout: 10_000 })
    // orbit 30° and hover the nearest screen-tie midpoint (the aim-depth
    // geometry — while HOLDING the tray piece)
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    await page.mouse.move(cx, cy)
    await page.mouse.down({ button: 'right' })
    await page.mouse.move(cx + 100, cy, { steps: 8 })
    await page.mouse.up({ button: 'right' })
    await expect
      .poll(async () => {
        // SETTLED, not merely TARGETED (P3) — the tie-pair pick projects
        // the LIVE pose and must not depend on how fast the box renders
        const v = await page.evaluate(() => (window as unknown as Record<string, () => { yaw: number; yawTarget: number }>).__gwBuildView())
        return v.yawTarget > 0.3 && Math.abs(v.yaw - v.yawTarget) < 1e-3
      }, { timeout: 10_000, message: 'the 30° orbit never SETTLED past 0.3 rad' })
      .toBe(true)
    const pose = (await page.evaluate(() => (window as unknown as Record<string, () => { pos: number[]; quat: number[] }>).__gwCameraPose())) as { pos: number[]; quat: number[] }
    const sockets = (await page.evaluate(() => (window as unknown as Record<string, () => number[][]>).__gwOpenSockets())) as number[][]
    const proj = sockets.map((s) => ({ s, p: projectPoint(pose, box, s) })).filter((c) => c.p !== null && c.p.z > 0) as { s: number[]; p: { x: number; y: number; dCam: number; z: number } }[]
    let mid: { x: number; y: number; pair: [number[], number[]] } | null = null
    outer: for (let i = 0; i < proj.length; i++)
      for (let j = i + 1; j < proj.length; j++) {
        const dPx = Math.hypot(proj[i]!.p.x - proj[j]!.p.x, proj[i]!.p.y - proj[j]!.p.y)
        if (proj[i]!.p.dCam === proj[j]!.p.dCam || dPx > 110) continue
        if (Math.abs(proj[i]!.p.dCam - proj[j]!.p.dCam) < 0.05) continue
        const mx = (proj[i]!.p.x + proj[j]!.p.x) / 2
        const my = (proj[i]!.p.y + proj[j]!.p.y) / 2
        if (mx < box.x + 8 || mx > box.x + box.width - 8 || my < box.y + 8 || my > box.y + box.height - 8) continue
        mid = { x: mx, y: my, pair: [proj[i]!.s, proj[j]!.s] }
        if (dPx < 90) break outer
      }
    expect(mid, 'kitchen03 exposes no near-tie at 30°').not.toBeNull()
    await page.mouse.move(mid!.x, mid!.y, { steps: 3 })
    await expect(page.locator('#gw-target-label')).toContainText('spots fit here — press ] for', { timeout: 5_000 })

    // THE CLAIM: the hint's count equals the number of DISTINCT canonical
    // dry-run hashes — recomputed test-side from the exposed tie sockets
    // (full frames) and the exposed build, through the SAME `dryRunHash`
    // the builder memoises.
    const [seamHashes, buildJson, tieSockets, held] = (await page.evaluate(() => [
      (window as unknown as Record<string, () => string[]>).__gwTieOutcomes!(),
      (window as unknown as Record<string, () => string>).__gwBuildJson!(),
      (window as unknown as Record<string, () => { pos: number[]; tangent: number[]; up: number[] }[]>).__gwTieSockets!(),
      (window as unknown as Record<string, () => { kind: string | null; params: PieceParams; flipped: boolean }>).__gwHeldState!(),
    ])) as [string[], string, { pos: number[]; tangent: number[]; up: number[] }[], { kind: string | null; params: PieceParams; flipped: boolean }]
    expect(held.kind, 'nothing held for the tie dry run').not.toBeNull()
    const build = deserialize(buildJson) as Build
    const label = (await page.locator('#gw-target-label').textContent())!
    const count = label.includes('two spots') ? 2 : Number(/(\d+) spots/.exec(label)?.[1] ?? '1')
    // the dry run's INPUTS come from the app (the held kind's EXACT ghost
    // params — the tray override, not the kind default — and the flip
    // flag); the COMPUTATION is independent node-side through the same
    // exported dryRunHash
    const { Vector3 } = await import('three')
    const own = dryRunHash(build.levelId, build.seed, build.pieces, held.kind as PieceKind, held.params, held.flipped)
    const ownHashes = tieSockets.map((s) =>
      own({ pos: new Vector3(...s.pos), tangent: new Vector3(...s.tangent), up: new Vector3(...s.up) }),
    )
    expect(ownHashes, 'the tie seam disagrees with the test-side dry run').toEqual(seamHashes)
    const distinctOwn = new Set(ownHashes).size
    // the seam list is distinct BY CONSTRUCTION; its length is the count
    // the hint must speak, and it must equal the test-side distinct count
    expect(new Set(seamHashes).size, 'the tie seam leaked an equivalent candidate').toBe(seamHashes.length)
    expect(count, `hint says ${count}, distinct outcomes say ${distinctOwn}`).toBe(distinctOwn)
    // and the `]` walk visits DISTINCT builds: stepping the ring through
    // the tie changes the aimed socket and its dry-run hash every press
    const h0 = (await page.evaluate(() => (window as unknown as Record<string, () => string[]>).__gwTieOutcomes!())) as string[]
    const seen = new Set<string>([h0[0]!])
    for (let k = 1; k < h0.length; k++) {
      await page.keyboard.press(']')
      await page.waitForTimeout(60)
      // `]` walks the tie list without re-aiming; the candidate at the NEW
      // cursor position must differ from every press before it
      const hk = (await page.evaluate(() => (window as unknown as Record<string, () => string[]>).__gwTieOutcomes!())) as string[]
      const nowHash = hk[Math.min(k, hk.length - 1)]!
      expect(seen.has(nowHash), `] press ${k} landed on an equivalent build`).toBe(false)
      seen.add(nowHash)
    }
    expect(seen.size, 'the ] walk collapsed to an equivalent build').toBe(h0.length)
  })
})

type Projected = { x: number; y: number; z: number; dCam: number }

function projectPoint(
  pose: { pos: number[]; quat: number[] },
  box: { x: number; y: number; width: number; height: number },
  p: number[],
): Projected | null {
  const [qx, qy, qz, qw] = pose.quat
  const rot = (v: number[]): number[] => {
    const ux = 2 * (qy * v[2]! - qz * v[1]!)
    const uy = 2 * (qz * v[0]! - qx * v[2]!)
    const uz = 2 * (qx * v[1]! - qy * v[0]!)
    return [v[0]! + qw * ux + (qy * uz - qz * uy), v[1]! + qw * uy + (qz * ux - qx * uz), v[2]! + qw * uz + (qx * uy - qy * ux)]
  }
  const fwd = rot([0, 0, -1])
  const right = rot([1, 0, 0])
  const up = rot([0, 1, 0])
  const v = [p[0]! - pose.pos[0]!, p[1]! - pose.pos[1]!, p[2]! - pose.pos[2]!]
  const dot = (a: number[], b: number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!
  const f = 1 / Math.tan((35 * Math.PI) / 180 / 2)
  const z = dot(v, fwd)
  if (z <= 0.001) return null
  const nx = 0.5 + (dot(v, right) / z) * (f / (box.width / box.height)) * 0.5
  const ny = 0.5 - (dot(v, up) / z) * f * 0.5
  return { x: box.x + nx * box.width, y: box.y + ny * box.height, z, dCam: Math.hypot(v[0]!, v[1]!, v[2]!) }
}

