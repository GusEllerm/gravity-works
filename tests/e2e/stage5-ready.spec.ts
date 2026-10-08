/**
 * Stage 5 — REPLAY READINESS (feel pass on Playtest CC item (a): "first
 * Play click works, but the tape only starts ~6 s after the click… during
 * that silence the button still reads Play, so a stranger double-clicks").
 * The fix has three proofs here:
 *
 * 1. THE WAIT IS A STATE, NOT A SILENCE — the bar is up-front with
 *    `data-phase="waiting"` and a spinner label counting the wind
 *    ("winding the tape… 40%"), never a dead ▶. The button's FIRST face is
 *    captured atomically by an init-script observer, so no probe can race
 *    the ready-state rebuild.
 * 2. A CLICK DURING THE WIND IS REMEMBERED — `__gwReplayWind().pendingPlay`
 *    goes true, and on ready the playhead SNAPS to 0 and rolls with no
 *    second click. The button ledger (`__gwReplayPhases`) must run
 *    waiting → playing → ended with no gap, and the playhead must reach
 *    the terminal time within a wall-clock bound.
 * 3. THE CHUNKED WIND IS THE ONE-SHOT SIM — every slice boundary the page
 *    reports (`__gwReplayWind().chunks`) carries the state hash the
 *    one-shot Node `World` has after the same number of steps, and the
 *    ready trace equals the old one-shot `replayRun` result exactly
 *    (determinism gate extended from terminal-only to per-slice).
 * 4. THE WIND ANSWERS TO NO FRAME CLOCK — with the page BELIEVING it is
 *    backgrounded (visibilityState hidden) and rAF callbacks never firing
 *    (Chrome's hidden-tab behaviour: only timers run), the tape still
 *    winds to `ready` with the identical slice ledger. The chunk pump rides
 *    a MessageChannel port (`setTimeout(0)` only as the no-MessageChannel
 *    fallback); rAF carries only the progress-label paint.
 * 5. AND IT ANSWERS TO NO TIMER EITHER — with every page timer floored to
 *    Chrome's intensive-throttling ONE WAKE PER MINUTE (what a tab hidden
 *    past ~5 min actually gets), the tape still winds: the pump's clock is
 *    a self-posted message-port task, which no timer clamp can stall.
 *    (CDP offers no visibility override on this Playwright surface —
 *    `Emulation.setPageVisibilityOverride` / `Browser.getWindowForContext`
 *    probed absent — so the timer floor IS the hidden-tab harness.)
 */
import { test, expect, type Page } from '@playwright/test'
import zlib from 'node:zlib'
import { replayRun } from '../../src/replay/replay.ts'
import { World } from '../../src/world/world.ts'
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts'
import { encodeShareUrl, type ShareCodec } from '../../src/share/share.ts'
import type { Build } from '../../src/track/build.ts'

const zlibCodec: ShareCodec = {
  deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))),
  inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))),
}

interface WindInfo {
  phase: 'waiting' | 'ready'
  pendingPlay: boolean
  steps: number
  chunks: { steps: number; hash: string }[]
  windMs: number
}

/** Watches the play button from BEFORE any page script runs and records its
 *  first face (what a first-time visitor actually sees) plus every `data-phase`
 *  it ever wears. This exists because the waiting→ready swap can happen
 *  between two separate `page.evaluate` probes — an observer cannot race. */
const FACE_OBSERVER = () => {
  const seen: { faces: unknown[]; phaseOrder: string[] } = { faces: [], phaseOrder: [] }
  Object.defineProperty(window, '__gwFace', { value: seen })
  let cur: HTMLElement | null = null
  const iv = setInterval(() => {
    const b = document.querySelector('#gw-replay-play') as HTMLElement | null
    if (!b) return
    if (b !== cur) {
      cur = b
      seen.faces.push({
        text: b.textContent ?? '',
        busy: b.getAttribute('aria-busy'),
        pressed: b.getAttribute('aria-pressed'),
        phase: b.dataset['phase'] ?? '',
      })
    }
    const p = b.dataset['phase'] ?? ''
    if (seen.phaseOrder[seen.phaseOrder.length - 1] !== p) seen.phaseOrder.push(p)
    if (seen.faces.length > 3) clearInterval(iv)
  }, 8)
}

async function kitchen01ShareUrl(): Promise<{ url: string; node: Awaited<ReturnType<typeof replayRun>>; build: Build }> {
  const build = KITCHEN01.parBuild()
  const node = await replayRun(KITCHEN01, build)
  const url = await encodeShareUrl({ levelId: 'kitchen01', seed: build.seed, hash: node.hash, build }, zlibCodec)
  return { url, node, build }
}

const wind = (page: Page) =>
  page.evaluate(() => (window as never as { __gwReplayWind: () => WindInfo }).__gwReplayWind())
const phases = (page: Page) =>
  page.evaluate(() => (window as never as { __gwReplayPhases: () => string[] }).__gwReplayPhases())
const seam = (page: Page) =>
  page.evaluate(() => (window as never as { __gwReplayState: () => { t: number } }).__gwReplayState().t)

/** CI-TRUTH frame-starvation harness (feel pass, the CI red): with
 *  `E2E_STARVE_RAF_MS=N` every rAF CALLBACK arrives no earlier than N ms
 *  after it was requested — what CI's SwiftShader compositor does to this
 *  page. The wind rides `setTimeout(0)`, so slice clocks and slice hashes
 *  must not move a digit under the harness. */
const RAF_STARVE_MS = Number(process.env.E2E_STARVE_RAF_MS ?? 0)
// frame-polled probes and the LEDGER observers (setInterval-based, so they
// keep working under the harness) get the wall clock back too
if (RAF_STARVE_MS > 0) test.setTimeout(240_000)
async function starveFrames(page: Page): Promise<void> {
  if (!(RAF_STARVE_MS > 0)) return
  await page.addInitScript((ms: number) => {
    const real = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (cb: FrameRequestCallback): number =>
      real(() => setTimeout(() => cb(performance.now()), ms))
  }, RAF_STARVE_MS)
}

test.describe('stage 5 replay readiness (feel pass)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await starveFrames(page)
    await page.addInitScript(FACE_OBSERVER)
  })

  test('1: the wait is a WAITING state — spinner label counting, never a dead Play', async ({ page }) => {
    test.slow()
    const { url } = await kitchen01ShareUrl()
    await page.goto(`/${url}`)
    await expect(page.locator('#gw-replay-status')).toHaveText('verified', { timeout: 90_000 })
    const seen = await page.evaluate(() => (window as never as { __gwFace: { faces: { text: string; busy: string | null; pressed: string | null; phase: string }[]; phaseOrder: string[] } }).__gwFace)
    const first = seen.faces[0]
    expect(first, 'the play button must have a face').toBeTruthy()
    // THE FIRST FACE a visitor meets: a WAITING button with a progress
    // label — spinner wording, aria-busy, and NO aria-pressed (a pressed
    // Play on a tape that cannot roll is the dead-button lie)
    expect(first!.phase).toBe('waiting')
    expect(first!.busy).toBe('true')
    expect(first!.pressed).toBe(null)
    expect(first!.text).toMatch(/winding the tape… \d+%/)
    // and the phase ORDER is honest: waiting first, ready only later
    expect(seen.phaseOrder[0]).toBe('waiting')
    expect(seen.phaseOrder[seen.phaseOrder.length - 1]).not.toBe('waiting')
  })

  test('2: an immediate Play click is remembered, the tape snaps to 0 and rolls to the end', async ({ page }) => {
    test.slow()
    const { url, node } = await kitchen01ShareUrl()
    // THE WAITING STATE IS FORCED, NOT HOPED FOR (close review F-2 — no
    // silent conditional): the `e2eWindSlice=1` knob makes the pump take
    // ONE step per scheduled tick, and an init-script clicker presses the
    // button in the microtask its own DOM append schedules — the first
    // pump slice is a MESSAGE task, which cannot run before that
    // microtask. The click therefore ALWAYS lands on the waiting button;
    // both proofs below run ALWAYS, never behind an `if`.
    await page.addInitScript(() => {
      const rec = { clicked: false, phase: '' }
      Object.defineProperty(window, '__gwEarlyClick', { value: rec })
      const take = (): boolean => {
        if (rec.clicked) return false
        const b = document.querySelector('#gw-replay-play') as HTMLButtonElement | null
        if (!b) return false
        rec.clicked = true
        rec.phase = b.dataset['phase'] ?? ''
        b.click()
        return true
      }
      const mo = new MutationObserver(() => {
        if (take()) mo.disconnect()
      })
      // observe DOCUMENT, not documentElement — at init-script time the
      // document may still have no root element to observe
      mo.observe(document, { childList: true, subtree: true })
      take()
    })
    await page.goto(`/?e2eWindSlice=1${url}`)
    // the click LANDED, and it landed on the WAITING face — always
    await page.waitForFunction(
      () => (window as never as { __gwEarlyClick: { clicked: boolean } }).__gwEarlyClick.clicked,
      undefined,
      { timeout: 15_000 },
    )
    const early = await page.evaluate(
      () => (window as never as { __gwEarlyClick: { clicked: boolean; phase: string } }).__gwEarlyClick,
    )
    expect(early.clicked, 'the queued click must have happened').toBe(true)
    expect(early.phase, 'the knob must force the click to land while WAITING').toBe('waiting')
    // the click was QUEUED, not swallowed — and no second click follows
    expect((await wind(page)).pendingPlay, 'the click during the wind must be remembered').toBe(true)
    // READY: the playhead SNAPS to 0 (never the pinned-at-end state of the
    // old build) and the film rolls without another click
    await page.waitForFunction(
      () => (window as never as { __gwReplayWind: () => WindInfo }).__gwReplayWind().phase === 'ready',
      undefined,
      { timeout: 30_000 },
    )
    const tAtReady = await seam(page)
    const dur = await page.evaluate(() =>
      (window as never as { __gwReplayTrace: () => { duration: number } }).__gwReplayTrace().duration,
    )
    expect(
      tAtReady,
      'on ready the playhead must be at (or a frame past) the START, not the end',
    ).toBeLessThan(dur * 0.5)
    // the ledger: waiting → (queued-click) → playing → ended, in order —
    // within a wall-clock bound, so no six-second silence can hide in it
    await expect
      .poll(
        async () => {
          const ps = await phases(page)
          const iWait = ps.indexOf('waiting')
          const iPlay = ps.indexOf('playing')
          const iEnd = ps.indexOf('ended')
          return iWait === 0 && iPlay > iWait && iEnd > iPlay ? 'ok' : ps.join('>')
        },
        { timeout: 60_000 },
      )
      .toBe('ok')
    // the queued click is VISIBLE in the ledger — unconditional now that the
    // waiting state is forced: waiting → queued-click → playing → ended
    expect(await phases(page), 'the ready path must honour the queued click').toContain('queued-click')
    // and it ENDS at the terminal time of the tape — the playhead is where
    // the run says it is
    const tEnd = await seam(page)
    expect(tEnd).toBeGreaterThanOrEqual(dur - 0.05)
    expect((await phases(page)).at(-1)).toBe('ended')
    // the one-shot sim truth (determinism gate, terminal half): the ready
    // trace IS the old one-shot replayRun result
    const tr = await page.evaluate(() => {
      const t = (window as never as {
        __gwReplayTrace: () => { hash: string; steps: number; time: number }
      }).__gwReplayTrace()
      return { hash: t.hash, steps: t.steps, time: t.time }
    })
    expect(tr.hash).toBe(node.hash)
    expect(tr.steps).toBe(node.steps)
    expect(tr.time).toBeCloseTo(node.time, 6)
  })

  test('3: every slice boundary carries the one-shot sim hash (chunked wind ≡ one-shot)', async ({ page }) => {
    test.slow()
    const { url, node, build } = await kitchen01ShareUrl()
    await page.goto(`/${url}`)
    await page.waitForFunction(
      () => (window as never as { __gwReplayWind: () => WindInfo }).__gwReplayWind().phase === 'ready',
      undefined,
      { timeout: 90_000 },
    )
    const w = await wind(page)
    expect(w.chunks.length, 'the wind must report per-slice evidence').toBeGreaterThan(1)
    // strictly increasing boundaries ending at the one-shot step count
    let prev = 0
    for (const c of w.chunks) {
      expect(c.steps).toBeGreaterThan(prev)
      prev = c.steps
    }
    expect(w.chunks[w.chunks.length - 1]!.steps).toBe(node.steps)
    // the STATE HASH at each boundary equals the one-shot Node sim's hash
    // after the same number of steps — slicing never moved a boundary
    const world = await World.create(KITCHEN01, build, { visuals: false })
    world.launch()
    let k = 0
    for (const c of w.chunks) {
      while (k < c.steps) {
        world.step()
        k++
      }
      expect(c.hash, `slice hash at step ${c.steps}`).toBe(world.hashHex())
    }
    world.dispose()
    expect(w.chunks[w.chunks.length - 1]!.hash).toBe(node.hash)
    // the ready-time bound (feel target): from click-less page open to a
    // wound tape must be a SHORT story — the CC crime was six seconds.
    // Headless CI pays a one-time SwiftShader shader-compile, so the
    // asserted bound is CI-tolerant (4 s); the typical-box target of 1.5 s
    // is carried by the same number read on real hardware (session log).
    const readyMs = await page.evaluate(
      () => performance.now() - (window as never as { __gwReplayWind: () => { t0: number } }).__gwReplayWind().t0,
    )
    expect(readyMs).toBeLessThan(4_000)
  })

  test('4: a backgrounded tab still winds — hidden visibilityState, rAF NEVER fires, chunks ride timers', async ({ page }) => {
    test.slow()
    const { url, node } = await kitchen01ShareUrl()
    // The hidden-tab truth (the product bug behind the CI red): Chrome
    // stops firing rAF callbacks on a hidden page ENTIRELY — only timers
    // run. The page is made to BELIEVE it is backgrounded (visibilityState
    // / hidden overrides) and every rAF request is swallowed, so NOTHING
    // but the setTimeout(0) pump chain can possibly wind the tape.
    await page.addInitScript(() => {
      Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true })
      Object.defineProperty(document, 'hidden', { get: () => true, configurable: true })
      window.requestAnimationFrame = (): number => 0
    })
    await page.goto(`/${url}`)
    // TIMER-polled (polling: 1000) — waitForFunction's DEFAULT poll rides
    // rAF, which this harness swallows: the PROBE must not need frames
    // either, exactly like the wind itself.
    await page.waitForFunction(
      () => (window as never as { __gwReplayWind: () => WindInfo }).__gwReplayWind().phase === 'ready',
      undefined,
      { timeout: 90_000, polling: 1000 },
    )
    const w = await wind(page)
    // it winds CHUNKED, not as one hidden catch-up block, and the tape is
    // the tape — the slice ledger and the terminal hash equal the one-shot
    // Node sim's, exactly as on a foreground frame-paced tab
    expect(await page.evaluate(() => document.visibilityState), 'the page must have believed it was hidden').toBe('hidden')
    expect(w.chunks.length, 'the hidden wind must still chunk').toBeGreaterThan(1)
    expect(w.chunks[w.chunks.length - 1]!.steps).toBe(node.steps)
    expect(w.chunks[w.chunks.length - 1]!.hash).toBe(node.hash)
  })

  test('5: a hidden tab with TIMERS clamped to one wake per minute still winds — the pump rides a message port', async ({ page }) => {
    test.slow()
    const { url, node } = await kitchen01ShareUrl()
    // The hidden-tab TRUTH (close review F-1): a tab hidden past ~5 minutes
    // gets Chrome's intensive throttling — chained timers aligned to roughly
    // ONE WAKE PER MINUTE, so an N-slice timer-driven wind waits N minutes.
    // The harness floors every page setTimeout/setInterval to 60 s (and
    // swallows rAF, the other half of the hidden-tab story), which is the
    // strongest clock a backgrounded page actually owns; the CDP page-
    // visibility override does not exist on this Playwright surface (both
    // `Emulation.setPageVisibilityOverride` and `Browser.getWindowForContext`
    // were probed absent at write time), so the floor stands in for the
    // real thing. On the old `setTimeout(0)` chain this test CANNOT pass
    // inside its 30 s deadline; on the message-port pump the chunks arrive
    // as message-loop tasks no clamp can stall.
    await page.addInitScript(() => {
      Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true })
      Object.defineProperty(document, 'hidden', { get: () => true, configurable: true })
      window.requestAnimationFrame = (): number => 0
      const FLOOR = 60_000
      const st = window.setTimeout.bind(window)
      const si = window.setInterval.bind(window)
      window.setTimeout = ((cb: TimerHandler, ms?: number, ...rest: unknown[]) =>
        st(cb, Math.max(ms ?? 0, FLOOR), ...rest)) as typeof window.setTimeout
      window.setInterval = ((cb: TimerHandler, ms?: number, ...rest: unknown[]) =>
        si(cb, Math.max(ms ?? 0, FLOOR), ...rest)) as typeof window.setInterval
    })
    await page.goto(`/${url}`)
    // THE PROBE CLOCK IS THIS PROCESS, not the page: every page-side timer
    // is floored to a minute, so even `waitForFunction` with polling: 1000
    // would pay a minute per tick. Node-side polling with REAL timers
    // watches the seam; 30 s is several winds of the fixed pump.
    const deadline = Date.now() + 30_000
    let w: WindInfo | null = null
    for (;;) {
      try {
        w = await wind(page)
      } catch {
        /* the seam is not up yet — keep polling */
      }
      if (w?.phase === 'ready' || Date.now() > deadline) break
      await new Promise((r) => setTimeout(r, 200))
    }
    expect(await page.evaluate(() => document.visibilityState), 'the page must have believed it was hidden').toBe('hidden')
    expect(w?.phase, 'the tape must wind to ready on message tasks alone').toBe('ready')
    expect(w!.chunks.length, 'the floored wind must still chunk').toBeGreaterThan(1)
    expect(w!.chunks[w!.chunks.length - 1]!.steps).toBe(node.steps)
    expect(w!.chunks[w!.chunks.length - 1]!.hash).toBe(node.hash)
  })
})
