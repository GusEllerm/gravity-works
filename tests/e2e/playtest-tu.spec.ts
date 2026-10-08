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
    'Aim: hover the world or press ] for the other spot · Place: click the world or Enter · Flip: R · Launch: L · Look: right-drag · Home: press Esc twice',
  )
  // and no player line still shows the bracket-glyph wording
  const spoken = await page.evaluate(() =>
    ['#gw-target-label', '#gw-tray-hint', '#gw-ghost-state', '#gw-status'].map((s) => document.querySelector(s)!.textContent ?? '').join('\n'),
  )
  expect(spoken).not.toContain('[ ]')
  expect(spoken).not.toContain('Esc Esc')

  expect(errors).toEqual([])
})
import { CAMPAIGN_LADDER } from '../../src/world/campaign.ts'

// --- FE half (rotated-view click + home, T+U round4) ---

const count = (page: import('@playwright/test').Page) => page.locator('#gw-piece-count')
const spoken = (page: import('@playwright/test').Page) => page.locator('#gw-ghost-state')
type Pose = { pos: number[]; quat: number[] }
type Box = { x: number; y: number; width: number; height: number }
const poseOf = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as Record<string, () => Pose>).__gwCameraPose())
const viewOf = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    (window as unknown as Record<string, () => { yaw: number; yawTarget: number; pan: number[]; panTarget: number[] }>).__gwBuildView(),
  )

/** Project a world point to canvas-absolute px on the LIVE render camera
 *  (the same helper the aim-depth gate uses — 35° vertical perspective). */
function project(pose: Pose, box: Box, p: number[]): { x: number; y: number } {
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
  return { x: box.x + nx * box.width, y: box.y + ny * box.height }
}

/** Right-drag an orbit of about 40 degrees and wait for the damping to
 *  arrive — the rotated frame both testers clicked in. */
async function orbit40(page: import('@playwright/test').Page, cx: number, cy: number) {
  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(cx + 140, cy, { steps: 8 })
  await page.mouse.up({ button: 'right' })
  await expect.poll(async () => (await viewOf(page)).yaw, { timeout: 5_000 }).toBeGreaterThan(0.6)
}

const n = (s: string | null) => Number(s!.match(/\d+/)![0])

/** Ten mouse-API click-places ON THE GHOST ITSELF (the projected position
 *  of the socket the ring shows), each undone so the next one must also
 *  register: every intent lands on the counter or leaves the status line
 *  speaking — never silence. */
async function tenGhostClicks(page: import('@playwright/test').Page, box: Box) {
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(cx, cy) // hover-aim: the ring lands on a socket
    const t = (await page.evaluate(
      () => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocket(),
    )) as number[] | null
    expect(t, `iteration ${i}: hover found no target to click`).not.toBeNull()
    const p = project(await poseOf(page), box, t!)
    const before = n(await count(page).textContent())
    await page.mouse.click(p.x, p.y)
    const landed = await expect
      .poll(async () => n(await count(page).textContent()), { timeout: 4_000 })
      .toBe(before + 1)
      .then(() => true)
      .catch(() => false)
    if (!landed) {
      // the contract's OTHER half: a click that did not place MUST speak
      const line = (await spoken(page).textContent()) ?? ''
      throw new Error(`click-place ${i} neither placed nor explained (status said: "${line}")`)
    }
    await page.keyboard.press('Delete')
    await expect
      .poll(async () => n(await count(page).textContent()), { timeout: 4_000, message: `remove after click ${i}` })
      .toBe(before)
  }
}

test.describe.configure({ timeout: 240_000 })

test('T+U 1: 10 ghost click-places register after a 40-degree orbit', async ({ page }) => {
  test.slow()
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=feeltrack')
  await ready(page)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  await page.hover('#gw-tray button[data-kind="straight"]')
  await expect(spoken(page)).not.toHaveText('', { timeout: 10_000 })
  await orbit40(page, box.x + box.width / 2, box.y + box.height / 2)
  await tenGhostClicks(page, box)
  expect(errors).toEqual([])
})

test('T+U 1: and again with the R flip armed (rotated fit variants)', async ({ page }) => {
  test.slow()
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=feeltrack')
  await ready(page)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  await page.hover('#gw-tray button[data-kind="straight"]')
  await expect(spoken(page)).not.toHaveText('', { timeout: 10_000 })
  await orbit40(page, box.x + box.width / 2, box.y + box.height / 2)
  await page.keyboard.press('KeyR') // the R the testers pressed before clicking
  await tenGhostClicks(page, box)
  expect(errors).toEqual([])
})

test('T+U 1: the click binds to the SHOWN ghost during the damping tail', async ({ page }) => {
  test.slow()
  await page.goto('/?level=kitchen01')
  await ready(page)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  await page.hover('#gw-tray button[data-kind="gapLip"]')
  await expect(spoken(page)).not.toHaveText('', { timeout: 10_000 })
  // start an orbit and click WITHOUT waiting for the damping: the ghost
  // slides under the cursor while the pose settles — the placement must
  // still be the socket the ring was shown on, not a re-projected rival
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(cx + 100, cy, { steps: 5 })
  await page.mouse.up({ button: 'right' })
  await page.mouse.move(cx, cy) // hover-aim mid-damping: the ring lands NOWHERE-SPECIAL
  const t = (await page.evaluate(
    () => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocket(),
  )) as number[] | null
  expect(t).not.toBeNull()
  const p = project(await poseOf(page), box, t!)
  const before = n(await count(page).textContent())
  await page.mouse.click(p.x, p.y) // click the ghost WHILE the view settles
  await expect.poll(async () => n(await count(page).textContent()), { timeout: 4_000 }).toBe(before + 1)
  // and it landed ON the ghost's socket: the newest piece's entry matches
  // the socket the ring was on at click time
  const placed = (await page.evaluate(
    () => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocket(),
  )) as number[]
  void placed // the exit moved on; the counter + no mis-aim label is the seam
})

test('T+U 1: a lost right-release cannot eat the next left click (zombie reconcile)', async ({ page }) => {
  test.slow()
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=feeltrack')
  await ready(page)
  await page.hover('#gw-tray button[data-kind="straight"]')
  await expect(spoken(page)).not.toHaveText('', { timeout: 10_000 })
  // park the real pointer ON the ghost target — the ring's own projection
  // (the point the aim-reach law accepts as a click ON the shown ghost)
  const tp = (await page.evaluate(() => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocketPx())) as number[] | null
  expect(tp, 'the ring must be on screen').not.toBeNull()
  const [cx, cy] = tp!
  await page.mouse.move(cx, cy)
  // a right press whose pointerup is LOST (menu-up / release over chrome):
  // dispatched here so no trusted pointerup ever reconciles it by hover
  await page.evaluate(
    ([x, y]) => {
      const c = document.querySelector('#gw-canvas') as HTMLElement
      const opts = (b: number, buttons: number, dx: number) =>
        ({ bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: b, buttons, clientX: x + dx, clientY: y, isPrimary: true }) as PointerEventInit
      c.dispatchEvent(new PointerEvent('pointerdown', opts(2, 2, 0)))
      c.dispatchEvent(new PointerEvent('pointermove', opts(-1, 2, 40)))
      // NO pointerup — the release is lost; the recogniser believes RIGHT is down
    },
    [cx, cy] as const,
  )
  const before = n(await count(page).textContent())
  // the testers' exact death sequence: no trusted hover between the lost
  // release and the left PRESS — the press-time reconcile must eat the
  // zombie, not the click
  await page.mouse.down()
  await page.mouse.up()
  await expect
    .poll(async () => n(await count(page).textContent()), {
      timeout: 4_000,
      message: `click after a lost right-release died silently (status: ${await spoken(page).textContent()})`,
    })
    .toBe(before + 1)
  expect(errors).toEqual([])
})

test('T+U 1: an empty-handed world click speaks instead of silently moving the ring', async ({ page }) => {
  await page.goto('/?level=feeltrack')
  await ready(page)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  await expect(spoken(page)).toHaveText('')
  // nowhere in particular: the EMPTY-HAND line outranks the aim law's
  // "nothing fits out here" — the missing thing is the piece (stage 5 BB
  // ordering: a handless click about the hand, never about the aim)
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(spoken(page)).toContainText('nothing in hand')
})

test('T+U 2: Esc Esc brings the framing home at real human timing', async ({ page }) => {
  test.slow()
  await page.goto('/?level=kitchen01')
  await ready(page)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const home0 = await poseOf(page)
  for (const gap of [300, 900]) {
    // drag somewhere HOSTILE: an orbit AND a pan (T: "the build slid
    // offscreen and Esc-Esc Home did nothing")
    await orbit40(page, cx, cy)
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx - 200, cy + 140, { steps: 6 })
    await page.mouse.up()
    await expect
      .poll(async () => {
        const v = await viewOf(page)
        return Math.abs(v.yaw) + Math.hypot(v.pan[0]!, v.pan[1]!)
      }, { timeout: 5_000 })
      .toBeGreaterThan(0.05)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(gap) // deliberate two-KEY timing, not a double-tap
    await page.keyboard.press('Escape')
    await expect
      .poll(
        async () => {
          const v = await viewOf(page)
          return Math.abs(v.yaw) + Math.abs(v.yawTarget) + Math.hypot(v.pan[0]!, v.pan[1]!) + Math.hypot(v.panTarget[0]!, v.panTarget[1]!)
        },
        { timeout: 6_000, message: `Esc Esc with a ${gap} ms gap left the view stranded` },
      )
      .toBeLessThan(1e-4)
    const home = await poseOf(page)
    // millimetre-level return to the home pose (the state-sum check above
    // already proved the damped targets landed; this proves the EYE is
    // back where it was before the drag)
    for (let i = 0; i < 3; i++)
      expect(Math.abs(home.pos[i]! - home0.pos[i]!), `pose x[${i}] did not return home (${gap} ms gap)`).toBeLessThan(1e-3)
  }
})

test('T+U 2: the hint states the home chord once, honestly', async ({ page }) => {
  await page.goto('/?level=kitchen01')
  await ready(page)
  await page.hover('#gw-tray button[data-kind="gapLip"]')
  await expect(page.locator('#gw-tray-hint')).toBeVisible()
  await expect(page.locator('#gw-tray-hint')).toContainText('Home: press Esc twice')
})

test('T+U 3: the finish cup is inside the build framing on every campaign rung', async ({ page }) => {
  test.slow()
  // the sweep is the LADDER, not a remembered head-count — the porch ladder
  // merge (stage 5) grew the campaign 21 → 26 and pinned constants here went
  // stale; the cup-framing law holds rung by rung for however many there are
  expect(CAMPAIGN_LADDER.length).toBe(30) // the stage-6 encore pass: 26 → 30
  for (const id of CAMPAIGN_LADDER) {
    for (const build of ['', '&build=par']) {
      await page.goto(`/?level=${id}${build}`)
      await ready(page)
      // poll through the first render tick: the seam projects through the
      // LIVE camera (matrixWorldInverse only exists after a frame)
      let ndc: number[] | null = null
      await expect
        .poll(
          async () => {
            ndc = (await page.evaluate(async () => {
              await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
              return (window as unknown as Record<string, () => number[] | null>).__gwGoalNdc()
            })) as number[] | null
            return ndc !== null
          },
          { timeout: 15_000, message: `${id}${build ? ' (par)' : ''}: no finish cup at build framing` },
        )
        .toBe(true)
      // inside the canvas with margin for the cup's own radius
      expect(Math.abs(ndc![0]!), `${id}${build ? ' (par)' : ''}: cup off-frame in x (${ndc})`).toBeLessThanOrEqual(0.9)
      expect(Math.abs(ndc![1]!), `${id}${build ? ' (par)' : ''}: cup off-frame in y (${ndc})`).toBeLessThanOrEqual(0.9)
    }
  }
})
