/**
 * THE CLICK-DIFFERENTIAL MATRIX (playtest Y round6: "every level: clicks
 * inert, Enter always placed" at 1280x768 dpr1, while the director's own
 * CDP down/up-at-fits placed fine in every path). The remaining suspect
 * space is ORDERING — who moved first, whether the canvas had listeners
 * when the events flew, and whether any pointermove ever reached the
 * page at the click point. Every case below is a FRESH context against
 * the production preview build with a recording proxy installed before
 * any app code runs (`installProbe`): it logs every canvas listener
 * REGISTRATION the app makes, and every pointer/click event the browser
 * actually DISPATCHES (document capture, before the app can eat it), so
 * a "the page never received it" failure is distinguishable from a
 * "the page received it and ignored it" failure.
 */
import { test, expect, type Page } from '@playwright/test'
import { goto } from './goto.ts'

type Pose = { pos: number[]; quat: number[] }
type Box = { x: number; y: number; width: number; height: number }

/** Installed via addInitScript BEFORE any page script: an addEventListener
 *  proxy (what/when the app attached), a document-capture event recorder
 *  (what the browser actually delivered), a canvas-creation counter and a
 *  getContext counter (the black-death leak probe). */
function installProbe() {
  const rec = {
    regs: [] as { type: string; t: number; id: string }[],
    events: [] as {
      type: string; t: number; x: number; y: number; button: number;
      buttons: number; detail: number; trusted: boolean; id: string;
    }[],
    canvases: 0,
    gl: 0,
  }
  const w = window as unknown as Record<string, unknown>
  w.__gwProbe = rec
  const origAdd = EventTarget.prototype.addEventListener
  EventTarget.prototype.addEventListener = function (
    this: EventTarget,
    type: string,
    fn: EventListenerOrEventListenerObject | null,
    opts?: boolean | AddEventListenerOptions,
  ) {
    try {
      const t = this as unknown as { tagName?: string; id?: string }
      if (
        t.tagName === 'CANVAS' &&
        ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'click', 'mousedown', 'mouseup'].includes(type)
      )
        rec.regs.push({ type, t: performance.now(), id: t.id ?? '' })
    } catch {
      /* probe never breaks the app */
    }
    return origAdd.call(this, type, fn as EventListener, opts)
  } as typeof EventTarget.prototype.addEventListener
  for (const k of ['pointerdown', 'pointermove', 'pointerup', 'click', 'mousedown', 'mouseup'] as const) {
    origAdd.call(
      document,
      k,
      (ev: Event) => {
        const e = ev as MouseEvent & { pointerId?: number }
        const tg = e.target as HTMLElement
        rec.events.push({
          type: k,
          t: Math.round(performance.now()),
          x: e.clientX,
          y: e.clientY,
          button: e.button,
          buttons: e.buttons,
          detail: e.detail,
          trusted: e.isTrusted,
          id: tg.id || tg.tagName,
        })
        if (rec.events.length > 500) rec.events.shift()
      },
      true,
    )
  }
  for (const k of ['webglcontextlost', 'webglcontextrestored'] as const) {
    origAdd.call(
      document,
      k,
      () => rec.regs.push({ type: `${k} FIRED`, t: performance.now(), id: '' }),
      true,
    )
  }
  const origCreate = Document.prototype.createElement
  Document.prototype.createElement = function (this: Document, ...args: Parameters<typeof document.createElement>) {
    const el = origCreate.apply(this, args)
    if ((args[0] as string).toLowerCase() === 'canvas') rec.canvases++
    return el
  } as typeof document.createElement
  const origGet = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    type: string,
    ...attrs: unknown[]
  ) {
    if (typeof type === 'string' && type.startsWith('webgl')) rec.gl++
    return (origGet as (...a: unknown[]) => unknown).call(this, type, ...attrs)
  } as typeof HTMLCanvasElement.prototype.getContext
}

const probe = (page: Page) =>
  page.evaluate(() => (window as unknown as Record<string, unknown>).__gwProbe)

async function dump(page: Page, label: string) {
  const p = await probe(page)
  console.log(`\n=== PROBE [${label}] ===`)
  console.log('regs:', JSON.stringify((p as { regs: unknown[] }).regs))
  console.log('events:', JSON.stringify((p as { events: unknown[] }).events, null, 0))
  console.log('canvases:', (p as { canvases: number }).canvases, 'gl:', (p as { gl: number }).gl)
}

/** Raw CDP input — the playtester's tool class: events at coordinates the
 *  page may never have HOVERED, with no Playwright-managed move implied. */
async function cdpInput(page: Page) {
  const cdp = await page.context().newCDPSession(page)
  const send = (args: Record<string, unknown>) =>
    cdp.send('Input.dispatchMouseEvent', args as never)
  return {
    move: (x: number, y: number) =>
      send({ type: 'mouseMoved', x, y, buttons: 0, timestamp: Date.now() / 1000 }),
    down: (x: number, y: number) =>
      send({ type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1, timestamp: Date.now() / 1000 }),
    up: (x: number, y: number) =>
      send({ type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, timestamp: Date.now() / 1000 }),
    rightDown: (x: number, y: number) =>
      send({ type: 'mousePressed', x, y, button: 'right', buttons: 2, clickCount: 1 }),
    rightMove: (x: number, y: number) =>
      send({ type: 'mouseMoved', x, y, buttons: 2 }),
    rightUp: (x: number, y: number) =>
      send({ type: 'mouseReleased', x, y, button: 'right', buttons: 0, clickCount: 0 }),
  }
}

function project(pose: Pose, box: Box, p: number[]): { x: number; y: number } | null {
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
  const vv = [p[0]! - pose.pos[0]!, p[1]! - pose.pos[1]!, p[2]! - pose.pos[2]!]
  const dot = (a: number[], b: number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!
  const f = 1 / Math.tan((35 * Math.PI) / 180 / 2)
  const z = dot(vv, fwd)
  if (z <= 0.001) return null
  const nx = 0.5 + (dot(vv, right) / z) * (f / (box.width / box.height)) * 0.5
  const ny = 0.5 - (dot(vv, up) / z) * f * 0.5
  return { x: box.x + nx * box.width, y: box.y + ny * box.height }
}

const live = (page: Page) =>
  page.evaluate(() => {
    const c = document.querySelector('#gw-canvas')!.getBoundingClientRect()
    const w = window as unknown as Record<string, () => unknown>
    return {
      box: { x: c.left, y: c.top, width: c.width, height: c.height },
      pose: (w.__gwCameraPose as () => Pose)(),
      target: (w.__gwTargetSocket as () => number[] | null)(),
    }
  })

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

const count = (page: Page) => page.locator('#gw-piece-count')

/** The ring's own screen point — the spot whose status is "fits here"
 *  while a piece is held (the cursor sitting ON the shown target). */
async function ringSpot(page: Page) {
  const s = await live(page)
  const p = s.target ? project(s.pose, s.box, s.target) : null
  if (!p) throw new Error('no visible target to click')
  return { ...p, box: s.box }
}

/** Grab the held piece WITHOUT moving the mouse (DOM activation), so a
 *  later zero-move click really is a zero-move click. */
async function grabViaDom(page: Page, kind: string) {
  await page.evaluate((k) => {
    ;(document.querySelector(`#gw-tray button[data-kind="${k}"]`) as HTMLButtonElement).click()
  }, kind)
  await expect(page.locator('#gw-ghost-state')).not.toHaveText('', { timeout: 10_000 })
}

test.describe('Y round6 click-differential matrix (1280x768 dpr1)', () => {
  test.use({ viewport: { width: 1280, height: 768 }, deviceScaleFactor: 1 })
  test.beforeEach(({ context }) => context.addInitScript(installProbe))

  test('T0 director path: move → down+up at fits places', async ({ page }) => {
    await goto(page, '/?level=kitchen01')
    await ready(page)
    await grabViaDom(page, 'drop')
    const spot = await ringSpot(page)
    const cdp = await cdpInput(page)
    await cdp.move(spot.x, spot.y)
    await cdp.down(spot.x, spot.y)
    await cdp.up(spot.x, spot.y)
    await expect(count(page), 'T0: director flow regressed').toHaveText('1 of 3 pieces used', { timeout: 5_000 }).catch(async (err) => {
      await dump(page, 'T0')
      throw err // the dump is a DIAGNOSTIC; the failure is the verdict (stage-4 close review F1)
    })
  })

  test('T1 zero-move CDP down/up at fits places', async ({ page }) => {
    await goto(page, '/?level=kitchen01')
    await ready(page)
    await grabViaDom(page, 'drop')
    const spot = await ringSpot(page)
    const cdp = await cdpInput(page)
    await cdp.down(spot.x, spot.y)
    await cdp.up(spot.x, spot.y)
    await expect(count(page), 'T1: zero-move down/up placed nothing').toHaveText('1 of 3 pieces used', { timeout: 5_000 }).catch(async (err) => {
      await dump(page, 'T1')
      throw err
    })
  })

  test('T2 move BEFORE canvas listeners attach, click after, places', async ({ page }) => {
    await goto(page, '/?level=kitchen01', { waitUntil: 'commit' })
    const cdp = await cdpInput(page)
    // a teleport move DURING boot — before the gesture owner may exist
    await cdp.move(560, 650)
    await ready(page)
    await grabViaDom(page, 'drop')
    const spot = await ringSpot(page)
    await cdp.down(spot.x, spot.y)
    await cdp.up(spot.x, spot.y)
    await expect(count(page), 'T2: pre-listener move then click placed nothing').toHaveText('1 of 3 pieces used', { timeout: 5_000 }).catch(async (err) => {
      await dump(page, 'T2')
      throw err
    })
  })

  test('T3 down/up within the first 500 ms of boot', async ({ page }) => {
    await goto(page, '/?level=kitchen01', { waitUntil: 'commit' })
    const cdp = await cdpInput(page)
    for (let i = 0; i < 5; i++) {
      await cdp.down(560, 650)
      await cdp.up(560, 650)
      await page.waitForTimeout(100)
    }
    await ready(page)
    // whatever the early storm did, the settled page must place normally
    await grabViaDom(page, 'drop')
    const spot = await ringSpot(page)
    await cdp.down(spot.x, spot.y)
    await cdp.up(spot.x, spot.y)
    await expect(count(page), 'T3: post-boot click placed nothing').toHaveText('1 of 3 pieces used', { timeout: 5_000 }).catch(async (err) => {
      await dump(page, 'T3')
      throw err
    })
    const regs = (await probe(page)) as { regs: { type: string; t: number }[] }
    const attachT = Math.max(...regs.regs.filter((r) => r.type === 'pointerdown').map((r) => r.t))
    console.log(`T3: canvas pointerdown attached at boot ms=${attachT.toFixed(0)}`)
  })

  test('T4 stale TOOLBAR-only move then zero-canvas-move click places', async ({ page }) => {
    await goto(page, '/?level=kitchen01')
    await ready(page)
    // a real hover over the toolbar (pointermove on the BUTTON, none on the
    // canvas ever), then the click happens at a canvas point never moved to
    await page.hover('#gw-tray button[data-kind="drop"]')
    await page.evaluate(() => {
      ;(document.querySelector('#gw-tray button[data-kind="drop"]') as HTMLButtonElement).click()
    })
    await expect(page.locator('#gw-ghost-state')).not.toHaveText('')
    const spot = await ringSpot(page)
    const cdp = await cdpInput(page)
    await cdp.down(spot.x, spot.y)
    await cdp.up(spot.x, spot.y)
    await expect(count(page), 'T4: toolbar-stale click placed nothing').toHaveText('1 of 3 pieces used', { timeout: 5_000 }).catch(async (err) => {
      await dump(page, 'T4')
      throw err
    })
  })

  test('T9 stale-coord down/up is NO intent — intent must arrive at the board', async ({ page }) => {
    // THE MIXED-TOOL PROXY FOR Y'S REPORT (reproduces the symptom exactly,
    // page-innocently): hovers arrive at the fits spot THROUGH CDP — aim
    // tracks, status reads `fits here` — while the press/release come from
    // an input path whose own cursor never moved, so the events dispatch
    // at a STALE point (0,0), far outside the canvas rect. The page
    // correctly treats a click that never touched the board as NOT a
    // place intent (the toolbar keeps its single-verb meaning); the
    // symptom — fits + inert + Enter-works — lives ENTIRELY in the tool's
    // coordinate split. What settles Y's machine: her tool's dispatch log
    // against this page-side probe — if the probe sees zero pointerdown/
    // up AT the cursor point, the events never arrived there.
    await goto(page, '/?level=kitchen01')
    await ready(page)
    await grabViaDom(page, 'drop')
    const spot = await ringSpot(page)
    const cdp = await cdpInput(page)
    await cdp.move(spot.x, spot.y)
    await expect(page.locator('#gw-ghost-state')).toContainText('fits', { timeout: 5_000 })
    await page.mouse.down()
    await page.mouse.up()
    await page.waitForTimeout(400)
    await expect(count(page)).toHaveText('0 of 3 pieces used') // the law: off-board coords never place
    const evs = (await probe(page)) as { events: { type: string; x: number; y: number }[] }
    const onBoard = evs.events.filter(
      (e) => e.type === 'pointerdown' && e.x > spot.box.x && e.x < spot.box.x + spot.box.width,
    )
    expect(onBoard.length, 'no pointerdown EVER arrived at the canvas rect').toBe(0)
    await dump(page, 'T9')
  })

  test('T10 a button-field-less dispatch is an EVENT THAT NEVER EXISTED', async ({ page }) => {
    // `Input.dispatchMouseEvent` mousePressed/mouseReleased WITHOUT the
    // `button` field generates ZERO page-visible events — Chrome eats it
    // in the browser process. A tool whose down/up omits `button:'left'`
    // reproduces Y's report VERBATIM (hover tracks through the moves it
    // does send; every "click" is inert on every level; Enter places) and
    // NOTHING the page can do reaches it. This cell pins that law with
    // the probe: the reproduction fingerprint is pointermove arriving and
    // zero pointerdown/pointerup for the tool's own down/up.
    await goto(page, '/?level=kitchen01')
    await ready(page)
    await grabViaDom(page, 'drop')
    const spot = await ringSpot(page)
    const cdp = await cdpInput(page)
    await cdp.move(spot.x, spot.y)
    const cdpRaw = await page.context().newCDPSession(page)
    await cdpRaw.send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: spot.x, y: spot.y, buttons: 1, clickCount: 1,
    } as never)
    await cdpRaw.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: spot.x, y: spot.y, buttons: 0, clickCount: 1,
    } as never)
    await page.waitForTimeout(300)
    await expect(count(page)).toHaveText('0 of 3 pieces used')
    const evs = (await probe(page)) as { events: { type: string }[] }
    const downs = evs.events.filter((e) => e.type === 'pointerdown' || e.type === 'pointerup')
    expect(downs.length, 'a button-less dispatch must produce zero page events').toBe(0)
    await dump(page, 'T10')
  })

  test('T5 down with no tracked up (up over chrome) then click places', async ({ page }) => {
    await goto(page, '/?level=kitchen01')
    await ready(page)
    await grabViaDom(page, 'drop')
    const spot = await ringSpot(page)
    const cdp = await cdpInput(page)
    // a press whose RELEASE the page never sees: down at the canvas, the
    // up delivered with the pointer off-window (button mask already up)
    await cdp.down(spot.x, spot.y)
    const cdp2 = await cdpInput(page)
    await cdp2.up(spot.x, spot.y) // untracked release at the SAME point
    await cdp.down(spot.x, spot.y)
    await cdp.up(spot.x, spot.y)
    await expect(count(page), 'T5: post-lost-release click placed nothing').toHaveText('1 of 3 pieces used', { timeout: 5_000 }).catch(async (err) => {
      await dump(page, 'T5')
      throw err
    })
  })

  test('T13 press begins on a CONTROL, releases in the world — not fresh intent, nothing places', async ({ page }) => {
    // Stage-4 close review F3: hold a piece, press Launch (button DOWN),
    // drag into the world, RELEASE on the canvas. The canvas never saw the
    // press (it is a canvas listener), so the release was untracked — and
    // the coordinates guard used to call it FRESH INTENT and place at the
    // release point. A press that began on a control is that control's
    // gesture: it places nothing (and the button gets no activation click
    // either — down and up targets differ — the sequence is neither verb).
    await goto(page, '/?level=kitchen01')
    await ready(page)
    await grabViaDom(page, 'drop')
    const spot = await ringSpot(page)
    const launch = await page.locator('#gw-launch').boundingBox()
    expect(launch).not.toBeNull()
    const cdp = await cdpInput(page)
    const bx = launch!.x + launch!.width / 2
    const by = launch!.y + launch!.height / 2
    await cdp.down(bx, by)
    for (let i = 1; i <= 8; i++)
      await cdp.move(bx + ((spot.x - bx) * i) / 8, by + ((spot.y - by) * i) / 8)
    await cdp.up(spot.x, spot.y)
    await page.waitForTimeout(400)
    await expect(count(page)).toHaveText('0 of 3 pieces used') // a control-begun drag never places
    // and the Launch button never activated (no click fires when the
    // down/up targets differ): the run did not start
    await expect(page.locator('#gw-status')).toContainText('ready')
    // POSITIVE CONTROL: an ordinary canvas press+release right after
    // places — the refusal is provenance, not broken input.
    await cdp.down(spot.x, spot.y)
    await cdp.up(spot.x, spot.y)
    await expect(count(page), 'T13: canvas-origin click regressed').toHaveText('1 of 3 pieces used', { timeout: 5_000 }).catch(async (err) => {
      await dump(page, 'T13')
      throw err
    })
  })
})

test.describe('X round6 short-viewport geometry (1280x633)', () => {
  test.use({ viewport: { width: 1280, height: 633 }, deviceScaleFactor: 1 })
  test.beforeEach(({ context }) => context.addInitScript(installProbe))

  test('T6 ghost equals cursor within 3 px at the fits point and the click places', async ({ page }) => {
    await goto(page, '/?level=kitchen01')
    await ready(page)
    await page.hover('#gw-tray button[data-kind="drop"]')
    // hover the ring spot with a REAL move; the target under the cursor
    // must project back within 3 px of it (the 80-130 px vertical offset
    // must be impossible)
    const first = await live(page)
    const p0 = project(first.pose, first.box, first.target!)!
    await page.mouse.move(p0.x, p0.y)
    await expect(page.locator('#gw-ghost-state')).toContainText('fits', { timeout: 10_000 })
    const now = await live(page)
    const p1 = project(now.pose, now.box, now.target!)
    expect(p1, 'no on-screen target after hover').not.toBeNull()
    expect(Math.hypot(p1!.x - p0.x, p1!.y - p0.y), 'ghost projection offset under 3 px').toBeLessThan(3)
    await page.mouse.down()
    await page.mouse.up()
    await expect(count(page), 'T6: click at fits placed nothing').toHaveText('1 of 3 pieces used', { timeout: 5_000 }).catch(async (err) => {
      await dump(page, 'T6')
      throw err
    })
  })

  test('T6b clicks below the viewport fold are a no-op (documented browser law)', async ({ page }) => {
    await goto(page, '/?level=kitchen01')
    await ready(page)
    await grabViaDom(page, 'drop')
    const s = await live(page)
    const below = s.box.y + s.box.height - 5
    test.skip(below < 633, 'canvas fits inside the fold at this viewport')
    const cdp = await cdpInput(page)
    await cdp.down(s.box.x + 200, below + 100)
    await cdp.up(s.box.x + 200, below + 100)
    const evs = (await probe(page)) as { events: { type: string; y: number }[] }
    console.log(
      'T6b: canvas bottom',
      s.box.y + s.box.height,
      '| page received',
      evs.events.filter((e) => e.type.startsWith('pointer')).length,
      'pointer events for a below-fold CDP click',
    )
    await dump(page, 'T6b')
  })
})

test.describe('below-fold release at canvas coords (1280x721 — the shape where the guard is LIVE)', () => {
  test.use({ viewport: { width: 1280, height: 721 }, deviceScaleFactor: 1 })
  test.beforeEach(({ context }) => context.addInitScript(installProbe))

  test('T11 release inside the canvas RECT past the viewport fold PLACES', async ({ page }) => {
    // X round6: content visible past a short window's fold — Chrome routes
    // a release whose point lies inside the canvas RECT but below the fold
    // to <html> (target HTML), and the page used to eat it silently on the
    // `ev.target === canvas` test. The stuck-press guard now asks
    // COORDINATES, not identity: a release AT the canvas rect that lands on
    // no control is fresh place intent.
    // STAGE-4 CLOSE REVIEW F2: the cell used to run at 1280x633, where the
    // Z round7 compact variant (<= 700 px height) caps the canvas INSIDE
    // the fold — the skip made this guard UNTESTABLE anywhere. 721 is the
    // product shape the guard exists for: over 700 px tall the compact
    // variant is off, the chrome (~319 px) plus the full 540 px canvas
    // still runs the RECT past the fold (bottom ~859), and the release
    // point below the fold is routed OFF the canvas by the browser —
    // asserted below, so this cell can only pass on the COORDINATES path.
    await goto(page, '/?level=kitchen01')
    await ready(page)
    await grabViaDom(page, 'drop')
    const s = await live(page)
    const fold = 721
    // PRECONDITION (never a silent skip): the rect must genuinely cross the fold
    expect(
      s.box.y + s.box.height,
      'canvas rect bottom must run past the fold for this cell to mean anything',
    ).toBeGreaterThan(fold + 20)
    // Stage 5 BB aim-reach law: a below-fold release PLACES only if the
    // point is a legitimate place intent — aim-reachable. It is: straight
    // below the socket that sits closest ABOVE the fold. The guard under
    // test (COORDINATE routing of a below-fold release) is untouched —
    // the release is still below the fold, inside the rect, and delivered
    // off the canvas target.
    const sockets = (await page.evaluate(() => ((window as unknown as Record<string, () => number[][]>).__gwOpenSockets)())) as number[][]
    const projs = sockets.map((p) => project(s.pose, s.box, p)).filter((p): p is { x: number; y: number } => p !== null)
    expect(projs.length, 'the canvas shows no socket').toBeGreaterThan(0)
    const near = projs.reduce((a, b) => (b.y > a.y ? b : a)) // the socket nearest the fold
    expect(near.y, 'a socket must sit above the fold for this cell to place').toBeLessThan(fold)
    const y = Math.min(s.box.y + s.box.height - 60, Math.max(fold + 6, near.y + 45))
    expect(y, 'release point must sit BELOW the fold').toBeGreaterThan(fold)
    expect(y - near.y, 'release must sit within aim reach of the nearest socket').toBeLessThanOrEqual(110)
    const cdp = await cdpInput(page)
    await cdp.down(near.x, y)
    await cdp.up(near.x, y)
    // the ANTI-VACUITY half: the release must have ARRIVED with a non-canvas
    // target — if the browser delivered it to the canvas, this cell would
    // only be re-testing the identity path the fix replaced.
    const evs = (await probe(page)) as { events: { type: string; y: number; id: string }[] }
    const downs = evs.events.filter((e) => e.type === 'pointerup' && e.y > fold)
    expect(downs.length, 'the browser must route the below-fold release to <html>, not the canvas').toBeGreaterThan(0)
    expect(downs.some((e) => e.id !== 'gw-canvas'), 'guard exercised by COORDINATES, not identity').toBe(true)
    await expect(count(page), 'T11: below-fold in-rect release placed nothing').toHaveText(
      '1 of 3 pieces used',
      { timeout: 5_000 },
    ).catch(async (err) => {
      await dump(page, 'T11')
      throw err
    })
  })
})

test.describe('target-source label audit (Y item 4)', () => {
  test('T12 no target ever names a greyed kind as an option', async ({ page }) => {
    // kitchen02 is the audit fixture: its tray (straight ×2, lip, drop)
    // greyes every other kind, and its BUILT-IN run-out `curve` once made
    // the goal-line target read "target: end of curve" — parsed as advice
    // to place a piece that cannot be placed ("Curve is greyed; none
    // exists"). Sweep the WHOLE target list with the arrows: a locked
    // kind's word may appear ONLY inside a "pre-built" phrase that says
    // plainly it is already there, and the retired copy ("where the car
    // starts", "level start") must be gone.
    await goto(page, '/?level=kitchen02')
    await ready(page)
    await page.click('#gw-tray button[data-kind="drop"]')
    const labels = new Set<string>()
    for (let i = 0; i < 8; i++) {
      labels.add((await page.textContent('#gw-target-label')) ?? '')
      await page.keyboard.press('ArrowRight')
    }
    expect(labels.size, 'the arrows walk more than one target').toBeGreaterThan(1)
    const GREYED = ['curve', 'ramp', 'bank', 'landing', 'booster']
    for (const label of labels) {
      for (const word of GREYED) {
        if (label.toLowerCase().includes(word))
          expect(
            label.toLowerCase(),
            `"${label}" names the greyed kind "${word}" bare`,
          ).toContain(`pre-built ${word}`)
      }
      expect(label).not.toContain('where the car starts')
      expect(label).not.toContain('level start')
    }
  })
})

test.describe('camera latch + context accounting', () => {
  test.use({ viewport: { width: 1280, height: 768 }, deviceScaleFactor: 1 })

  const view = (page: Page) =>
    page.evaluate(() =>
      (window as unknown as Record<string, () => { yawTarget: number } >).__gwBuildView(),
    )

  test('T7 right-drag orbits repeatedly in one session and across level loads', async ({ page }) => {
    const cdp = await cdpInput(page)
    const drag = async () => {
      await cdp.rightDown(600, 500)
      for (let i = 1; i <= 6; i++) await cdp.rightMove(600 + i * 20, 500)
      await cdp.rightUp(720, 500)
      await page.waitForTimeout(150)
    }
    await goto(page, '/?level=kitchen01')
    await ready(page)
    await drag()
    const y1 = (await view(page)).yawTarget
    await drag()
    const y2 = (await view(page)).yawTarget
    expect(y1, 'first right-drag moved the view').not.toBe(0)
    expect(y2, 'second right-drag moved the view further').not.toBe(y1)
    // Esc-Esc brings it home
    await page.keyboard.press('Escape')
    await page.waitForTimeout(120)
    await page.keyboard.press('Escape')
    await expect
      .poll(async () => (await view(page)).yawTarget, { timeout: 5_000 })
      .toBe(0)
    // and after a fresh load of ANOTHER level the drag still works
    await goto(page, '/?level=kitchen02')
    await ready(page)
    await drag()
    expect((await view(page)).yawTarget, 'right-drag on the next page load').not.toBe(0)
  })

  test('T8 one canvas and one GL context per page; no silent context loss', async ({ page }) => {
    await page.context().addInitScript(installProbe)
    const cdp = await cdpInput(page)
    for (const lvl of ['kitchen01', 'kitchen02', 'kitchen03', 'kitchen04']) {
      await goto(page, `/?level=${lvl}`)
      await ready(page)
      // exercise the drag path the black-death was reported on
      await cdp.rightDown(600, 500)
      await cdp.rightMove(700, 500)
      await cdp.rightUp(700, 500)
      const p = (await probe(page)) as { canvases: number; gl: number; regs: { type: string }[] }
      console.log(`${lvl}: canvases=${p.canvases} gl=${p.gl} lost=${p.regs.filter((r) => r.type.includes('FIRED')).length}`)
      expect(p.canvases, `${lvl}: extra canvas created`).toBe(1)
      expect(p.gl, `${lvl}: extra GL context`).toBeLessThanOrEqual(2)
      expect(p.regs.filter((r) => r.type === 'webglcontextlost FIRED').length, `${lvl}: silent context loss`).toBe(0)
    }
  })
})
