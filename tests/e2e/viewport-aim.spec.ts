/**
 * THE HOSTILE-VIEWPORT GATE (playtests V+W round5, 2/2: "the green ghost
 * sat ~40 px up and left of my cursor" / "~2 m away", and a click on the
 * shown ghost placed nothing while Enter worked). The director's forensic
 * number — canvas rect (160,**311**,960,540) where the settled layout is
 * (160,270…) — is the whole story: the toolbar rows ABOVE the canvas
 * appear/hide/wrap mid-session and move the canvas under a STILL cursor,
 * and until this round the aim was only ever re-derived on the NEXT
 * pointer event, so the ghost sat at a constant stale offset.
 *
 * The contracts proven here (per hostile viewport: 1280x720 dpr1,
 * 1600x900 dpr2, a tall 1100x1400 dpr1.5, and a SCROLLED page):
 *
 * 1. SWEEP — every open socket a real mouse hovers is aimed EXACTLY as
 *    the app's own tie rules decide (real input events, no seams poked);
 *    and the target's projection sits within 3 px of the cursor when the
 *    cursor is ON a socket (the ~40 px offset can no longer exist).
 * 2. CLICK-THE-GHOST — a real mouse click at the GHOST's own screen
 *    position places: the counter increments AND the socket the ghost sat
 *    on is consumed (the placed piece IS the ghost's target line).
 * 3. STABLE RECT — the canvas rect does not move between idle / holding /
 *    placed / removed (the teleport that created the stale-aim window).
 * 4. RE-VALIDATION PARITY — when the layout DOES move (window resize),
 *    the still cursor's ghost equals what a fresh live hover decides.
 * 5. CONTEXT LOSS (W's black tab) — a lost WebGL context pauses cleanly
 *    behind "graphics hiccup — click to restore" and one click returns a
 *    painted, playable page — never a black silent dead canvas.
 * 6. STUCK PRESS — a release with no tracked pointerdown (its down fell
 *    outside the window / was dropped) is FRESH place intent over the
 *    canvas, never an event the page eats.
 */
import { test, expect, type Page } from '@playwright/test'
import { AIM_TIE_PX, HOVER_PX } from '../../src/ui/builder.ts'

type Pose = { pos: number[]; quat: number[] }
type Box = { x: number; y: number; width: number; height: number }

/** Project a world point to page px under the LIVE camera — the same
 *  35°-vertical perspective `aim-depth.spec.ts` independently derives (it
 *  deliberately does NOT reuse the app's transform: the point of this
 *  gate is that the app's mapping equals the truth, not itself). */
function project(pose: Pose, box: Box, p: number[]): { x: number; y: number; dCam: number } | null {
  const [qx, qy, qz, qw] = pose.quat
  const rot = (v: number[]) => {
    const ux = 2 * (qy * v[2]! - qz * v[1]!)
    const uy = 2 * (qz * v[0]! - qx * v[2]!)
    const uz = 2 * (qx * v[1]! - qy * v[0]!)
    return [
      v[0]! + qw * ux + (qy * uz - qz * uy),
      v[1]! + qw * uy + (qz * ux - qx * uz),
      v[2]! + qw * uz + (qx * uy - qy * ux),
    ]
  }
  const fwd = rot([0, 0, -1])
  const right = rot([1, 0, 0])
  const up = rot([0, 1, 0])
  const v = [p[0]! - pose.pos[0]!, p[1]! - pose.pos[1]!, p[2]! - pose.pos[2]!]
  const dot = (a: number[], b: number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!
  const f = 1 / Math.tan((35 * Math.PI) / 180 / 2)
  const z = dot(v, fwd)
  if (z <= 0.001) return null // behind the eye
  const nx = 0.5 + (dot(v, right) / z) * (f / (box.width / box.height)) * 0.5
  const ny = 0.5 - (dot(v, up) / z) * f * 0.5
  return { x: box.x + nx * box.width, y: box.y + ny * box.height, dCam: Math.hypot(v[0]!, v[1]!, v[2]!) }
}

/** The socket the app's aim rules give this cursor point: everything
 *  within HOVER_PX, reduced to near-ties of the screen-nearest, ordered
 *  NEAR-DEPTH first (the app's documented pick — asserted, not assumed). */
function winner(pose: Pose, box: Box, sockets: number[][], cx: number, cy: number): number {
  const proj = sockets.map((s, i) => ({ i, p: project(pose, box, s) }))
  const near = proj
    .filter((c) => c.p && Math.hypot(c.p.x - cx, c.p.y - cy) <= HOVER_PX)
    .map((c) => ({ i: c.i, d: Math.hypot(c.p!.x - cx, c.p!.y - cy), dCam: c.p!.dCam }))
  if (near.length === 0) return -1
  const best = Math.min(...near.map((c) => c.d))
  return near
    .filter((c) => c.d <= best + AIM_TIE_PX)
    .sort((a, b) => a.dCam - b.dCam || a.i - b.i)[0]!.i
}

const live = (page: Page) =>
  page.evaluate(() => {
    const c = document.querySelector('#gw-canvas')!.getBoundingClientRect()
    const w = window as unknown as Record<string, () => unknown>
    return {
      box: { x: c.left, y: c.top, width: c.width, height: c.height },
      pose: (w.__gwCameraPose as () => Pose)(),
      sockets: (w.__gwOpenSockets as () => number[][])(),
      target: (w.__gwTargetSocket as () => number[] | null)(),
    }
  })

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

const count = (page: Page) => page.locator('#gw-piece-count')

/** The sweep + click-the-ghost contract, run inside whatever viewport the
 *  describe block configured. Returns the number of on-screen sockets. */
async function sweepAndPlace(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=feeltrack')
  await ready(page)
  await page.hover('#gw-tray button[data-kind="straight"]')
  await expect(page.locator('#gw-ghost-state')).not.toHaveText('', { timeout: 10_000 })
  let s = await live(page)
  const onScreen = s.sockets
    .map((sock, i) => ({ i, p: project(s.pose, s.box, sock) }))
    .filter(
      (c) =>
        c.p !== null &&
        c.p.x > s.box.x + 30 &&
        c.p.x < s.box.x + s.box.width - 30 &&
        c.p.y > s.box.y + 30 &&
        c.p.y < s.box.y + s.box.height - 30,
    )
  expect(onScreen.length).toBeGreaterThan(0)

  // SWEEP: every on-screen socket, real mouse, app-rule aim
  for (const c of onScreen) {
    await page.mouse.move(c.p!.x, c.p!.y, { steps: 4 })
    await expect
      .poll(
        async () => {
          const l = await live(page)
          const t = l.target
          return t ? l.sockets.findIndex((x) => Math.hypot(x[0]! - t[0]!, x[1]! - t[1]!, x[2]! - t[2]!) < 1e-6) : -2
        },
        { message: `socket ${c.i} not aimed at its own screen point` },
      )
      .toBe(winner(s.pose, s.box, s.sockets, c.p!.x, c.p!.y))
    // the ghost sits UNDER the cursor when the cursor is on a socket and
    // that socket is the cursor's outright pick (the ~40 px offset check)
    if (winner(s.pose, s.box, s.sockets, c.p!.x, c.p!.y) === c.i) {
      const l = await live(page)
      const tp = project(l.pose, l.box, s.sockets[c.i]!)!
      expect(Math.hypot(tp.x - c.p!.x, tp.y - c.p!.y)).toBeLessThan(3)
    }
  }

  // CLICK-THE-GHOST: click at the ghost's own projected position; the
  // piece lands ON the ghost's socket (it leaves the open-socket list)
  let placed = 0
  for (const c of onScreen.slice(0, 3)) {
    s = await live(page)
    await page.mouse.move(c.p!.x, c.p!.y, { steps: 2 })
    await page.waitForTimeout(60)
    s = await live(page)
    if (!s.target) continue
    const ghostAt = project(s.pose, s.box, s.target)!
    const before = await count(page).textContent()
    const openBefore = s.sockets.length
    await page.mouse.move(ghostAt.x, ghostAt.y, { steps: 2 })
    await page.mouse.down()
    await page.mouse.up()
    await expect(count(page)).not.toHaveText(before!, { timeout: 10_000 })
    placed += 1
    // the ghost's socket was CONSUMED by the placement
    await expect
      .poll(async () => ((await live(page)).sockets ?? []).filter((x) => Math.hypot(x[0]! - s.target![0]!, x[1]! - s.target![1]!, x[2]! - s.target![2]!) < 1e-6).length)
      .toBe(0)
    void openBefore
    await page.keyboard.press('Delete') // make room for the next viewport
    await expect(count(page)).toHaveText(before!)
  }
  expect(placed).toBeGreaterThan(0)
  expect(errors).toEqual([])
}

for (const [label, vp] of [
  ['1280x720 dpr1 (the director baseline)', { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }],
  ['1600x900 dpr2', { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 }],
  ['1100x1400 dpr1.5 tall', { viewport: { width: 1100, height: 1400 }, deviceScaleFactor: 1.5 }],
] as const) {
  test.describe(`hostile viewport: ${label}`, () => {
    test.use(vp)
    test('sweep aims every socket exactly where it projects, and click-the-ghost places', async ({ page }) => {
      test.slow()
      await sweepAndPlace(page)
    })
    test('the canvas rect never teleports between session states', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(String(err)))
      await page.goto('/?level=kitchen01')
      await ready(page)
      const rect0 = (await live(page)).box
      await page.hover('#gw-tray button[data-kind="drop"]')
      const r1 = (await live(page)).box
      await page.mouse.move(r1.x + r1.width / 2, r1.y + r1.height / 2)
      const p = (await live(page))
      const sock = p.sockets.map((sk) => project(p.pose, p.box, sk)!).find((q) => Math.hypot(q.x - (r1.x + r1.width / 2), q.y - (r1.y + r1.height / 2)) < 600)!
      await page.mouse.move(sock.x, sock.y, { steps: 3 })
      await page.mouse.down()
      await page.mouse.up()
      await expect(count(page)).toContainText('1 of')
      const r2 = (await live(page)).box
      await page.keyboard.press('Delete')
      const r3 = (await live(page)).box
      for (const r of [r1, r2, r3]) {
        expect(Math.abs(r.y - rect0.y)).toBeLessThan(1)
        expect(Math.abs(r.x - rect0.x)).toBeLessThan(1)
      }
      expect(errors).toEqual([])
    })
  })
}

test.describe('scrolled page', () => {
  test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
  test('sweep + click-the-ghost hold with the page scrolled', async ({ page }) => {
    test.slow()
    await page.goto('/?level=feeltrack')
    await ready(page)
    await page.evaluate(() => window.scrollTo(0, 130))
    await page.waitForTimeout(200)
    const box = (await live(page)).box
    expect(box.y).toBeLessThan(200) // really scrolled
    await page.hover('#gw-tray button[data-kind="straight"]')
    const s = await live(page)
    const c = s.sockets.map((sock, i) => ({ i, p: project(s.pose, s.box, sock) })).find(
      (q) => q.p !== null && q.p.x > s.box.x + 30 && q.p.x < s.box.x + s.box.width - 30 && q.p.y > s.box.y + 30 && q.p.y < s.box.y + s.box.height - 30,
    )
    expect(c).toBeDefined()
    await page.mouse.move(c!.p!.x, c!.p!.y, { steps: 4 })
    await expect
      .poll(async () => {
        const l = await live(page)
        const t = l.target
        return t ? l.sockets.findIndex((x) => Math.hypot(x[0]! - t[0]!, x[1]! - t[1]!, x[2]! - t[2]!) < 1e-6) : -2
      })
      .toBe(winner(s.pose, s.box, s.sockets, c!.p!.x, c!.p!.y))
    const before = await count(page).textContent()
    await page.mouse.down()
    await page.mouse.up()
    await expect(count(page)).not.toHaveText(before!, { timeout: 10_000 })
  })
})

test('re-validation equals a live hover after the layout moves under a still cursor', async ({ page }) => {
  await page.goto('/?level=feeltrack')
  await ready(page)
  await page.hover('#gw-tray button[data-kind="straight"]')
  let s = await live(page)
  const p = project(s.pose, s.box, s.target!)!
  await page.mouse.move(p.x, p.y, { steps: 3 })
  await page.waitForTimeout(80)
  // move the layout WITHOUT any pointer event: a viewport-height change
  // (resize is the real-world trigger; here the same rect shift the V/W
  // session produced from the toolbar rows)
  await page.evaluate(() => {
    const d = document.createElement('div')
    d.id = 'shift-probe'
    d.style.height = '45px'
    document.querySelector('#gw-builder-host')!.after(d)
  })
  await page.waitForTimeout(200) // the frame loop re-validates
  const afterShift = (await live(page)).target
  await page.mouse.move(p.x + 0.5, p.y) // live hover under the same layout
  await page.waitForTimeout(80)
  const afterHover = (await live(page)).target
  expect(afterShift !== null && afterHover !== null && Math.hypot(afterShift[0]! - afterHover[0]!, afterShift[1]! - afterHover[1]!, afterShift[2]! - afterHover[2]!) < 1e-6).toBe(true)
  await page.evaluate(() => document.getElementById('shift-probe')?.remove())
})

test('graphics hiccup: lost context pauses cleanly, one click restores a painted page', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=feeltrack')
  await ready(page)
  await page.evaluate(() => (window as unknown as Record<string, () => void>).__gwForceContextLoss())
  await expect(page.locator('#gw-hiccup')).toContainText('graphics hiccup — click to restore')
  // the page is PAUSED, not spinning on a dead context: the overlay owns
  // the stage and the canvas is inert (no silent black — the story is up)
  await page.locator('#gw-hiccup').click()
  await expect(page.locator('#gw-hiccup')).toBeHidden()
  // restored AND playable: the canvas paints and a click-place still works
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const c = document.querySelector('#gw-canvas') as HTMLCanvasElement
        const t = document.createElement('canvas')
        t.width = 40
        t.height = 22
        const g = t.getContext('2d')!
        g.drawImage(c, 0, 0, 40, 22)
        const d = g.getImageData(0, 0, 40, 22).data
        for (let i = 0; i < d.length; i += 4) if (d[i]! + d[i + 1]! + d[i + 2]! > 30) return true
        return false
      }),
    )
    .toBe(true)
  await page.hover('#gw-tray button[data-kind="straight"]')
  const before = await count(page).textContent()
  // the ring's own projection — a LEGITIMATE place intent under the aim
  // reach law (this cell proves the restored page is PLAYABLE, not that
  // clicking empty space places)
  const tp = (await page.evaluate(() => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocketPx())) as number[] | null
  expect(tp, 'the ring must be on screen after the restore').not.toBeNull()
  await page.mouse.click(tp![0]!, tp![1]!)
  await expect(count(page)).not.toHaveText(before!, { timeout: 10_000 })
  expect(errors).toEqual([])
})

test('stuck press: a release with no tracked pointerdown places, never gets eaten', async ({ page }) => {
  await page.goto('/?level=feeltrack')
  await ready(page)
  await page.hover('#gw-tray button[data-kind="straight"]')
  const s = await live(page)
  const c = s.sockets.map((sock) => project(s.pose, s.box, sock)!).find((q) => q.x > s.box.x + 30 && q.x < s.box.x + s.box.width - 30 && q.y > s.box.y + 30 && q.y < s.box.y + s.box.height - 30)!
  const before = await count(page).textContent()
  // the playwright MOUSE API pattern: press OUTSIDE the window (CDP lets
  // the coordinate through where page.mouse clamps), move in, release —
  // the canvas never sees a pointerdown, so the release must be FRESH
  // intent (playtest V/W: an eaten click while Enter worked)
  const cdp = await page.context().newCDPSession(page)
  await page.mouse.move(c.x, c.y)
  await page.waitForTimeout(80)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: -40, y: -40, button: 'left', buttons: 1, clickCount: 1 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c.x, y: c.y, buttons: 1 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: c.x, y: c.y, button: 'left', buttons: 0, clickCount: 1 })
  await expect(count(page), 'untracked press-release must place, not be eaten').not.toHaveText(before!, { timeout: 10_000 })
})
