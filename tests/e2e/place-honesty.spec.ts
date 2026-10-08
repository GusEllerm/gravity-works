/**
 * PLACE-BUTTON HONESTY (playtest DD's kitchen01 wall: ~10 launches and
 * 18 minutes burned because the plain-labelled "Place" button auto-dropped
 * at what read as "a fixed right-side socket" instead of the spot the aim
 * had named — hover-aim legitimately follows the mouse wherever it crosses
 * the canvas, including the TRANSIT to the button, so a press could land at
 * a socket the player never chose, every press building the wrong track).
 *
 * The fix is the input-truth law applied to the button: the button places
 * at the CURRENT aim (the ring the ghost wears) AND its label carries that
 * socket's ratified name — `Place — <socket>` — updated wherever the aim
 * updates. This spec is the fresh-eye replay of that wall:
 *
 * 1. A MOUSE-ONLY PLAYER on fresh kitchen01 presses the Place button (never
 *    the keyboard, never a canvas click for placement) and EVERY press
 *    places at the socket the aim's own line names — the button text equals
 *    the `#gw-target-label` socket name, and the placement occupies that
 *    same socket (`__gwTargetSocket`/`__gwOpenSockets` + the piece counter).
 *    Zero mis-drops is the assertion, not the aspiration.
 * 2. THE TRANSIT (the DD gesture itself): aim by hovering a far socket,
 *    then travel to the button ALONG A PATH THAT CROSSES THE CANVAS — the
 *    intermediate hovers may re-aim, the ring follows them, and the button
 *    must follow too: at the instant of the press its label names the
 *    ring's socket, and the piece lands there.
 * 3. A button that cannot place names no drop spot: empty-handed it reads
 *    plain "Place" and is aria-disabled (its refusal line belongs to
 *    `playtest-bb.spec.ts`; the naming claim is what lives here).
 */
import { test, expect, type Page } from '@playwright/test'

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

const count = (page: Page) => page.locator('#gw-piece-count')

const EM = '\u2014' // the dash separating the verb from the socket name

type Pose = { pos: number[]; quat: number[] }
type Box = { x: number; y: number; width: number; height: number }

/** Canvas-pixel projection of a world point — the aim-depth specs' helper,
 *  same FOV (35 deg) and same camera-pose seam. */
function projectPoint(pose: Pose, box: Box, p: number[]): { x: number; y: number } | null {
  const [qx, qy, qz, qw] = pose.quat
  const rot = (v: number[]): number[] => {
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
  if (z <= 0.001) return null
  const nx = 0.5 + (dot(v, right) / z) * (f / (box.width / box.height)) * 0.5
  const ny = 0.5 - (dot(v, up) / z) * f * 0.5
  return { x: box.x + nx * box.width, y: box.y + ny * box.height }
}

const seams = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as Record<string, () => unknown>
    return {
      pose: w.__gwCameraPose() as Pose,
      open: w.__gwOpenSockets() as number[][],
      target: w.__gwTargetSocket() as number[] | null,
    }
  })

/** The socket NAME the aim line speaks — the text after the `place X at:`
 *  verb, minus any tie tail (` · two spots fit here — …`). */
async function aimedName(page: Page): Promise<string> {
  const line = (await page.locator('#gw-target-label').textContent()) ?? ''
  const named = line.slice(line.indexOf(': ') + 2)
  return named.split(' \u00b7 ')[0]!.trim()
}

const buttonName = (page: Page) => page.locator('#gw-place').textContent()

const near = (a: number[], b: number[]) =>
  Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!) < 0.02

test.describe('place button names the socket it drops (playtest DD)', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('every Place-button press on kitchen01 lands where the aim names, mouse-only', async ({ page }) => {
    test.slow()
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.goto('/?level=kitchen01')
    await ready(page)

    // The button cannot place yet, so it names NO spot (a disabled button
    // that advertised a drop socket would be its own little lie).
    await expect(buttonName(page)).resolves.toBe('Place')
    await expect(page.locator('#gw-place')).toHaveAttribute('aria-disabled', 'true')

    const placeAt = async (kind: string, aimWorld: number[] | null, transit: boolean) => {
      await page.click(`#gw-tray button[data-kind="${kind}"]`)
      await expect(page.locator('#gw-place')).toHaveAttribute('aria-disabled', 'false')
      let s = await seams(page)
      const box = (await page.locator('#gw-canvas').boundingBox())!
      if (aimWorld) {
        // aim by hovering the socket itself — the ring and the line settle
        // on the spot this socket names
        const px = projectPoint(s.pose, box, aimWorld)
        expect(px, 'the aimed socket must be on screen').not.toBeNull()
        await page.mouse.move(px!.x, px!.y, { steps: 3 })
        await expect
          .poll(
            async () => {
              const t = (await seams(page)).target
              return t && near(t, aimWorld) ? 1 : 0
            },
            { timeout: 5_000 },
          )
          .toBe(1)
        // the button already names the socket the aim line names — BEFORE
        // the mouse ever leaves the canvas
        expect(await buttonName(page)).toBe(`Place ${EM} ${await aimedName(page)}`)
      }
      // THE DD GESTURE: travel to the Place button. A real player's path
      // crosses the canvas; so does this one (steps interpolates through
      // the canvas pixels between the aim point and the button).
      const pb = (await page.locator('#gw-place').boundingBox())!
      if (transit) await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2, { steps: 24 })
      // PRESS-MOMENT TRUTH: whatever the transit did to the aim, the
      // button's label and the ring's socket name the SAME spot.
      const name = await aimedName(page)
      expect(await buttonName(page)).toBe(`Place ${EM} ${name}`)
      s = await seams(page)
      const target = s.target
      expect(target, 'the ring must sit on a target at press time').not.toBeNull()
      expect(s.open.some((o) => near(o, target!)), 'the aimed socket is an open target').toBe(true)
      const before = (await count(page).textContent())!
      // THE PRESS itself is still a button click, mouse-only, never Enter.
      await page.click('#gw-place')
      // ZERO MIS-DROPS: the counter moved AND the socket the aim named is
      // now occupied — the piece sits exactly where the words said it would.
      const after = (await count(page).textContent())!
      expect(after, `the press placed nowhere named (was "${before}")`).not.toBe(before)
      const open = (await seams(page)).open
      expect(
        open.some((o) => near(o, target!)),
        `MIS-DROP: the aim named ${name} and the socket is still open`,
      ).toBe(false)
      // clean up the way a mouse-only player would: the Remove button
      await page.click('#gw-remove-piece')
      const back = (await count(page).textContent())!
      expect(back).toBe(before)
    }

    // PRESS 1 — the pure-click player: never touches the canvas, presses
    // the button where it rests (the chain head), and the button says so.
    await placeAt('drop', null, false)
    // PRESS 2 — the DD gesture: hover-aim the car's start point (a socket
    // far from the resting ring), travel to the button across the canvas.
    const boot = await seams(page)
    const start = boot.open.reduce((a, b) => (a[0]! < b[0]! ? a : b)) // lowest x: the car's start
    await placeAt('drop', start, true)
    // PRESS 3 — another named socket entirely (the cup's open exit), same
    // button, same honesty, fresh kind (the tray's third piece).
    const open3 = await seams(page)
    const cupExit = open3.open.reduce((a, b) => (a[0]! > b[0]! ? a : b)) // highest x: the cup's exit
    await placeAt('landing', cupExit, true)

    expect(errors).toEqual([])
  })

  test('the button label rides every aim change the mouse makes', async ({ page }) => {
    test.slow()
    await page.goto('/?level=kitchen01')
    await ready(page)
    await page.click('#gw-tray button[data-kind="drop"]')
    let s = await seams(page)
    const box = (await page.locator('#gw-canvas').boundingBox())!
    for (const sock of s.open) {
      const px = projectPoint(s.pose, box, sock)
      if (!px) continue // behind the camera: nothing to aim at
      await page.mouse.move(px.x, px.y, { steps: 3 })
      const name = await aimedName(page)
      expect(await buttonName(page), `the button never rode the aim to ${name}`).toBe(
        `Place ${EM} ${name}`,
      )
      // and the name the button speaks is the socket the RING sits on
      s = await seams(page)
      expect(near(s.target!, sock), `the ring is not on ${name}`).toBe(true)
    }
  })
})
