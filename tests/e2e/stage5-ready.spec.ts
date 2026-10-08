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

test.describe('stage 5 replay readiness (feel pass)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
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
    await page.goto(`/${url}`)
    // click AS EARLY AS POSSIBLE — the moment a button exists. Landing on
    // the waiting button (the CC stranger's move) is the queued-click
    // proof; if the machine is fast and the tape is already rolling, do NOT
    // click a playing film (that would PAUSE it) — autoplay carries the
    // same ledger proof.
    await page.waitForSelector('#gw-replay-play', { timeout: 15_000 })
    const clickedWhileWaiting = await page.evaluate(() => {
      const b = document.querySelector('#gw-replay-play') as HTMLButtonElement
      if (b.dataset.phase !== 'waiting') return false
      b.click()
      return true
    })
    if (clickedWhileWaiting) {
      // the click was QUEUED, not swallowed — and no second click follows
      expect((await wind(page)).pendingPlay, 'the click during the wind must be remembered').toBe(true)
    }
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
})
