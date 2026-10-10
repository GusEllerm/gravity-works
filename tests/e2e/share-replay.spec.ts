/**
 * Stage 5 — the share link opens INTO the replay (`src/boot.ts`'s shared-run
 * page + `src/replay/cinematic.ts`), end to end on the real feel track and
 * the ladder's first rung:
 *
 *   1. SEEK PROOF — the page's recorded trace equals the Node
 *      `replayRun({ record: true })` trace step for step (exact doubles —
 *      same wasm, same step order, `state()` is the only source), and after
 *      a real drag/click on an event tick the state on screen IS the trace
 *      entry for `floor(t/dt)` — which just equals the node state at that
 *      step. No interpolation between steps exists to cheat with.
 *   2. The replay PLAYS (autoplays; play/pause and 1×/2×/4× are real
 *      controls whose effect is measured on the playhead — since the stage-5
 *      CI-red salvage PER RENDERED FRAME via the page's pace ledger, never
 *      by sampling after a wall-clock sleep, which SwiftShader frame pacing
 *      made off-step on the 15.8 s feeltrack link) and cuts ≥ 3
 *      shots; the FINISH shot frames the cup (projected |ndc| ≤ 0.8 at the
 *      end of the timeline, on kitchen01).
 *   3. The page sells the moment above the fold — "Watch this run", the
 *      Build-your-own exit — and the honest verification block sits BELOW
 *      the player (`#gw-replay-status` keeps the exact strings the
 *      stage-2/3/4 specs read).
 *
 * The build-view gesture gate is not exercised here on purpose: the replay
 * path never touches `attachBuildView`; `build-view.spec.ts` keeps guarding
 * the game page untouched.
 */
import { test, expect, type Page } from '@playwright/test'
import zlib from 'node:zlib'
import { replayRun } from '../../src/replay/replay.ts'
import { deriveEvents } from '../../src/replay/cinematic.ts'
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts'
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts'
import { encodeShareUrl, type ShareCodec } from '../../src/share/share.ts'
import type { TraceSample } from '../../src/replay/replay.ts'

const zlibCodec: ShareCodec = {
  deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))),
  inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))),
}

/** CI-TRUTH frame-starvation harness (feel pass, the CI red): with
 *  `E2E_STARVE_RAF_MS=N` every rAF CALLBACK arrives no earlier than N ms
 *  after it was requested — what CI's SwiftShader compositor does to this
 *  page (frame gaps of hundreds of ms while the sim clock keeps running).
 *  The tape wind must not care (it rides setTimeout(0); rAF only paints),
 *  and the pace law stays frame-gap-honest with the longer gaps. */
const RAF_STARVE_MS = Number(process.env.E2E_STARVE_RAF_MS ?? 0)
// The starve harness slows every FRAME (and this spec's own frame-polled
// probes), never the wind — hand the wall clock back to the harness runs
// so the proof is about the laws, not the default 30 s test budget.
if (RAF_STARVE_MS > 0) test.setTimeout(240_000)
async function starveFrames(page: Page): Promise<void> {
  if (!(RAF_STARVE_MS > 0)) return
  await page.addInitScript((ms: number) => {
    const real = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (cb: FrameRequestCallback): number =>
      real(() => setTimeout(() => cb(performance.now()), ms))
  }, RAF_STARVE_MS)
}

type TraceSeam = {
  dt: number
  steps: number
  time: number
  duration: number
  status: string
  hash: string
  events: { t: number; kind: string; label: string }[]
  shots: { kind: string; start: number; end: number }[]
  cuts: number[]
  verified: boolean
  poses: [number, number, number, number, number, number, number][]
}

type StateSeam = { t: number; step: number; pos: number[]; quat: number[] }

async function openShare(page: Page, levelId: string, seed: number, hash: string, build: unknown): Promise<void> {
  await starveFrames(page)
  const url = await encodeShareUrl({ levelId, seed, hash, build } as never, zlibCodec)
  await page.goto(`/${url}`)
  // THE READY POLL BEFORE THE FIRST EVALUATE (CI-red feel pass): the wind
  // seam exists from the moment the waiting bar goes up, so the spec waits
  // on the wind's OWN phase (90 s CI-tolerant window) before it evaluates
  // anything — the trace/state seams only READ the recorded tape (they do
  // no synchronous catch-up in the evaluate itself), and no probe may land
  // mid-wind where a starved compositor would hold the main thread busy.
  await page.waitForFunction(
    () => {
      const w = (window as never as { __gwReplayWind?: () => { phase: string } }).__gwReplayWind
      if (typeof w === 'function' && w().phase === 'ready') return true
      // fallback mount (the player could not build — WebGL failure): there
      // is no wind to poll, the verdict seam itself is the readiness
      return typeof (window as never as { __gwReplayTrace?: unknown }).__gwReplayTrace === 'function'
    },
    undefined,
    { timeout: 90_000 },
  )
  await expect(page.locator('#gw-replay-status')).toHaveText('verified', { timeout: 90_000 })
  await page.waitForFunction(() => typeof (window as never as { __gwReplayTrace?: unknown }).__gwReplayTrace === 'function', undefined, { timeout: 90_000 })
}

async function replayState(page: Page): Promise<StateSeam> {
  return page.evaluate(() => (window as unknown as { __gwReplayState: () => StateSeam }).__gwReplayState())
}

/** PACING-PROOF rate proof (stage 5 salvage — the CI red): the playhead is
 *  NEVER sampled after a wall-clock sleep — CI frame pacing (SwiftShader)
 *  can make a 300 ms window hold zero rendered frames (the playhead reads
 *  frozen) or one clamped giant (it reads off-step). The page's own pace
 *  ledger (`__gwReplayPace`, cleared at every seek/play/speed discontinuity)
 *  is polled instead, and the rate law is asserted PER RENDERED FRAME:
 *  every interval of a contiguous play session must advance the playhead
 *  by min(frame gap, 0.25 s) × rate. A multiplier cannot be faked by
 *  waiting, and no frame rate is fast enough or slow enough to break it. */
async function paceHeld(page: Page, rate: number): Promise<boolean> {
  return page.evaluate(async (r: number) => {
    const seam = () =>
      (window as unknown as { __gwReplayPace?: () => [number, number, number][] }).__gwReplayPace?.() ?? []
    const ended = () =>
      (window as unknown as { __gwReplayPhases?: () => string[] }).__gwReplayPhases?.()?.at(-1) === 'ended'
    const deadline = performance.now() + 30_000
    for (;;) {
      const p = seam()
      let checked = 0
      for (let i = 1; i < p.length; i++) {
        if (p[i]![2] !== r || p[i - 1]![2] !== r) continue
        checked++
        const want = Math.min((p[i]![0]! - p[i - 1]![0]!) / 1000, 0.25) * r
        const got = p[i]![1]! - p[i - 1]![1]!
        if (Math.abs(got - want) > Math.max(1e-9, want * 0.01)) return false
      }
      // 5 intervals is the full proof; a session that PLAYED THE FILM OUT
      // (phase ended with its ledger intact — clamps never wipe it) is
      // proved by every interval it ever painted, however few: under CI
      // frame pacing a 4× tail can end the watchable window in 2–3 frames,
      // and demanding 6 would demand frames the film does not contain.
      if (checked >= 5) return true
      if (checked >= 1 && ended()) return true
      if (performance.now() > deadline) return false
      await new Promise((res) => requestAnimationFrame(res))
    }
  }, rate)
}

async function ensurePaused(page: Page): Promise<void> {
  // CONVERGE ON THE FACE, not on more clicks: a paused face AND an ENDED
  // face both mean "not playing", and clicking either starts motion — the
  // BB rewind law (a Play click on a finished film rewinds and rolls).
  // The old aria-true-means-click rule never converged on CI at 4x (the
  // stage-6 PR red): a clamped frame delivers ~1 s of a 3.9 s film, so the
  // run ENDS between the read and the click (aria 'true' read, 'ended'
  // state), the click then REWINDS AND PLAYS, and every "press again"
  // iteration of the loop can watch a whole rewound film end before the
  // next read; (ii) even clicking a truly-playing face lost the SAME way
  // when one click round-trip outlasted duration/rate of wall clock — at
  // 4x on CI's frames that window is ~duration/4 ≈ 1 s, SHORTER than one
  // actionability round-trip, so a rewind-first loop can lose EVERY
  // iteration in lockstep (the third PR red). So a playing face has its
  // CLOCK SLOWED FIRST through the real speed control: a speed click has
  // no rewind rule and can NEVER start motion, and at 1x the runway
  // under the pause click is the whole film measured in wall SECONDS.
  // If the film did end in flight, the Play click rewound and rolled it
  // back to a fresh 1x full-runway film and the next iteration
  // converges. The reset leaves the player at 1x — harmless by
  // construction: every later assertion that needs a multiplier sets it
  // itself, and the pace-ledger proofs all run BEFORE the ensurePaused
  // that follows them.
  const face = () =>
    page.evaluate(() => {
      const b = document.querySelector<HTMLButtonElement>('#gw-replay-play')!
      return b.dataset['phase'] ?? ''
    })
  for (let i = 0; i < 8; i++) {
    if ((await face()) !== 'playing') return
    await page.click('.gw-replay-speed[data-speed="1"]')
    await page.click('#gw-replay-play')
    await page.waitForTimeout(30)
  }
  expect(await face(), 'Play never settled to a paused/ended face').not.toBe('playing')
}

test.describe('stage 5 share link opens into the cinematic replay', () => {
  test('the trace, the seek and the playhead are the deterministic sim', async ({ page }) => {
    // CI's SwiftShader paces rAF frames at hundreds of ms, so the budget
    // and the coverage poll stay generous (a bare 30 s budget flaked red
    // under parallel load). The stage-6 autopsy retired the patience theory
    // for the LAST red: the playhead never starved — the coverage BASELINE
    // was a no-op seek (focus + seek-while-playing; see the seek-and-
    // baseline law below the pace-proof block). The pace law itself stays
    // asserted exactly as the stage-5 salvage wrote it.
    test.slow()
    test.setTimeout(180_000) // the 90 s coverage poll must sit inside the budget
    const build = FEELTRACK.placeholderBuild()
    const node = await replayRun(FEELTRACK, build, { record: true })
    await openShare(page, build.levelId, build.seed, node.hash, build)
    const tr = await page.evaluate(() => (window as unknown as { __gwReplayTrace: () => TraceSeam }).__gwReplayTrace())

    // the visual world steps exactly like the headless harness (same trace
    // count, SAME hash: visuals never reach the solver)
    expect(tr.steps).toBe(node.steps)
    expect(tr.hash).toBe(node.hash)
    expect(tr.shots.length).toBeGreaterThanOrEqual(3)
    expect(tr.shots.map((s) => s.kind)).toEqual(['wide', 'follow', 'finish'])

    // events are the same pure derivation of the same samples, both sides
    expect(tr.events).toEqual(JSON.parse(JSON.stringify(deriveEvents(node.trace!, node.status))))

    // transforms match the node-recorded transforms EXACTLY at samples
    for (const i of [0, Math.floor(node.steps / 4), Math.floor(node.steps / 2), node.steps - 1]) {
      const s: TraceSample = node.trace![i]!
      expect(tr.poses[i]).toEqual([...s.pos, ...s.quat])
    }

    // ---- playback controls act on the playhead — PACING-PROOF: paused
    // means HELD across rendered frames (double-rAF, not a slept 350 ms),
    // advance is POLLED on the state seam, and the rate is proven by the
    // per-frame pace law above, never by a wall-clock snapshot ----
    // THE SEEK-AND-BASELINE LAW (the stage-6 CI-red autopsy): PAUSE FIRST,
    // then focus the timeline, then Home — and assert the seek LANDED. Two
    // CI-only traps made the 4x coverage poll red at any patience (the CI
    // Received values 0.4918 / 0.5917 / 0.1086 are each EXACTLY the ceiling
    // `duration - t3`, the playhead having played the film out):
    //  (a) `page.click` LEAVES FOCUS on the clicked button, so a bare
    //      press('Home') after the play/speed clicks is a SILENT NO-OP —
    //      the baseline `t3` silently kept the 1x session's position;
    //  (b) seeking while still PLAYING lets the film run on during the
    //      pause round-trips (0.25 s of sim per CI frame), so the baseline
    //      is whatever the wall clock left behind — and whenever that spot
    //      lands in the film's last 0.6 s, the 0.6-s coverage target is
    //      BEYOND `duration - t3`: unreachable no matter how long we poll
    //      (and a near-tail Play click legitimately REWINDS — the BB dead-
    //      click law — so `t - t3` still caps at `duration - t3`). The
    //      product never stalled: pause-then-seek makes both baselines
    //      exactly 0, and a seek that fails to land now fails LOUDLY here
    //      instead of resurfacing 90 s later as "never covered".
    const timeline = page.locator('#gw-replay-timeline')
    await ensurePaused(page)
    await timeline.focus()
    await page.keyboard.press('Home')
    const t1 = (await replayState(page)).t
    expect(t1, 'the Home seek must LAND while paused (playhead at 0)').toBe(0)
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => r())))))
    expect((await replayState(page)).t, 'PAUSED must hold the state across rendered frames').toBe(t1)

    await page.click('#gw-replay-play') // play at 1x
    await expect
      .poll(async () => (await replayState(page)).t, { timeout: 30_000, message: 'Play never advanced the playhead' })
      .toBeGreaterThan(t1)
    expect(await paceHeld(page, 1), 'the 1x frames did not honour the pace law').toBe(true)
    await ensurePaused(page)

    // baseline 0 by the same law as above — paused FIRST, focus the
    // TIMELINE (the previous clicks parked focus on the play button, where
    // Home is a no-op), then seek, then PROVE the seek landed. From 0 the
    // coverage target 0.6 s is inside the film and inside the pace law:
    // every painted frame delivers min(gap, 0.25 s) x 4 of sim time.
    await ensurePaused(page)
    await timeline.focus()
    await page.keyboard.press('Home')
    const t3 = (await replayState(page)).t
    expect(t3, 'the Home seek must LAND while paused (playhead at 0)').toBe(0)
    await page.click('.gw-replay-speed[data-speed="4"]')
    await page.click('#gw-replay-play')
    await expect
      .poll(async () => (await replayState(page)).t - t3, { timeout: 90_000, message: '4x never covered the sim window' })
      .toBeGreaterThanOrEqual(0.6)
    expect(await paceHeld(page, 4), 'the 4x frames did not honour the pace law').toBe(true)
    await ensurePaused(page)

    // ---- drag/click a tick: the seen state IS the node state at that step ----
    const events = tr.events
    const ticks = page.locator('.gw-replay-tick')
    expect(await ticks.count()).toBe(events.length)
    const target = events.find((e) => e.kind === 'bigAir') ?? events[Math.floor(events.length / 2)]!
    await ticks.nth(events.indexOf(target)).click()
    const st = await replayState(page)
    // the rendered state is the trace entry of `step` — floor, never a blend
    expect(st.pos).toEqual(tr.poses[st.step]!.slice(0, 3))
    expect(st.quat).toEqual(tr.poses[st.step]!.slice(3, 7))
    // and that trace entry is exactly the node sim's recorded transform
    const ns: TraceSample = node.trace![st.step]!
    expect(st.pos).toEqual(ns.pos)
    expect(st.quat).toEqual(ns.quat)
    // the seek landed on the beat (within the tick's pixel slop)
    expect(Math.abs(st.t - target.t)).toBeLessThan(0.06)

    // the finish beat's tick lands on the terminal sim state
    const finish = events.find((e) => e.kind === 'finish')!
    await ticks.nth(events.indexOf(finish)).click()
    const fin = await replayState(page)
    const lastSample: TraceSample = node.trace![node.steps - 1]!
    expect(fin.pos).toEqual(lastSample.pos)
    await page.screenshot({ path: 'docs/explorations/replay/share-replay-feeltrack.png' })
  })

  test('kitchen01: finish shot frames the cup, the copy sells the moment, verification sits below', async ({ page }) => {
    const build = KITCHEN01.parBuild()
    const node = await replayRun(KITCHEN01, build, { record: true })
    await openShare(page, build.levelId, build.seed, node.hash, build)
    const tr = await page.evaluate(() => (window as unknown as { __gwReplayTrace: () => TraceSeam }).__gwReplayTrace())
    expect(tr.hash).toBe(node.hash)
    expect(tr.verified).toBe(true)

    // THE FILM'S STAR (program P4, player final §8): the film stars the
    // car the game drives — the ratified `createCarRig` sedan is mounted
    // in the replay scene and the World's fallback proxy stays hidden
    // (visuals-only: it is still there, still transformed, never shown).
    const rig = await page.evaluate(() =>
      (window as unknown as { __gwReplayCarRig: () => { mounted: boolean; boxVisible: boolean } }).__gwReplayCarRig(),
    )
    expect(rig.mounted, 'the replay scene must mount the ratified car rig').toBe(true)
    expect(rig.boxVisible, 'the replay page must not show the fallback box').toBe(false)

    // shot-grammar artifacts for the session note: wide at the launch, the
    // tracked follow mid-run (paused, seeking is exact so these are honest)
    await page.locator('#gw-replay-timeline').focus()
    await page.keyboard.press('Home')
    await page.waitForTimeout(80)
    await page.screenshot({ path: 'docs/explorations/replay/share-replay-kitchen01-wide.png' })
    const follow = tr.shots.find((s) => s.kind === 'follow')!
    await page.evaluate((t: number) => {
      const el = document.querySelector<HTMLElement>('#gw-replay-timeline')!
      const r = el.getBoundingClientRect()
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + (t / (window as unknown as { __gwReplayTrace: () => { duration: number } }).__gwReplayTrace().duration) * r.width, clientY: r.top + r.height / 2, pointerId: 1 }))
      el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: r.left, clientY: r.top + r.height / 2, pointerId: 1 }))
    }, (follow.start + follow.end) / 2)
    await page.waitForTimeout(80)
    await page.screenshot({ path: 'docs/explorations/replay/share-replay-kitchen01-follow.png' })

    // above the fold: the moment, not the hash
    await expect(page.locator('#gw-replay-title')).toHaveText('Watch this run')
    const tagline = (await page.locator('#gw-replay-tagline').textContent())!
    expect(tagline.toLowerCase()).not.toContain('hash')
    await expect(page.locator('#gw-replay-build')).toHaveText('Build your own')
    expect(await page.getAttribute('#gw-replay-build', 'href')).toBe(`?level=${build.levelId}`)

    // the finish shot keeps the cup in the frame: seek to the end of the
    // timeline and project the cup's capture centre through the replay camera
    await page.locator('#gw-replay-timeline').focus()
    await page.keyboard.press('End')
    await expect(async () => {
      const ndc = (await page.evaluate(() => (window as unknown as { __gwReplayGoalNdc?: () => number[] | null }).__gwReplayGoalNdc!()))!
      expect(ndc).not.toBeNull()
      expect(Math.abs(ndc[0]!)).toBeLessThanOrEqual(0.8)
      expect(Math.abs(ndc[1]!)).toBeLessThanOrEqual(0.8)
    }).toPass({ timeout: 5_000 })
    await page.screenshot({ path: 'docs/explorations/replay/share-replay-kitchen01-finish.png' })

    // the honest half sits BELOW the player
    const barBox = await page.locator('#gw-replay-bar').boundingBox()
    const verifyBox = await page.locator('#gw-replay-verify').boundingBox()
    expect(barBox && verifyBox && verifyBox.y > barBox.y + barBox.height).toBeTruthy()
    await expect(page.locator('#gw-replay-status')).toHaveText('verified')
    const echoed = (await page.locator('#gw-replay-hash').textContent())!
    expect(echoed).toContain(`replay hash ${node.hash}`)
    // the share-card wiring rode through the rewrite untouched
    await expect(page.locator('#gw-share-card')).toBeVisible()
  })

  test('the game page keeps its build surface — no replay chrome leaks into the build view', async ({ page }) => {
    await page.goto('/?level=feeltrack&build=par')
    await expect(page.locator('#gw-builder-host')).toBeVisible()
    expect(await page.locator('#gw-replay-bar').count()).toBe(0)
    expect(await page.locator('#gw-replay-timeline').count()).toBe(0)
  })
})
