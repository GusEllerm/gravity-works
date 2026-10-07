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
 *      controls whose effect is measured on the playhead) and cuts ≥ 3
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
  const url = await encodeShareUrl({ levelId, seed, hash, build } as never, zlibCodec)
  await page.goto(`/${url}`)
  await expect(page.locator('#gw-replay-status')).toHaveText('verified', { timeout: 90_000 })
  await page.waitForFunction(() => typeof (window as never as { __gwReplayTrace?: unknown }).__gwReplayTrace === 'function', undefined, { timeout: 90_000 })
}

async function replayState(page: Page): Promise<StateSeam> {
  return page.evaluate(() => (window as unknown as { __gwReplayState: () => StateSeam }).__gwReplayState())
}

async function ensurePaused(page: Page): Promise<void> {
  // A click on Play at the END of the run restarts from 0 (real UX). If the
  // run auto-paused in the window between the aria read and the click, the
  // click restarts playback — so re-read and, if needed, press again; the
  // loop converges on the first paused read.
  for (let i = 0; i < 4; i++) {
    if ((await page.getAttribute('#gw-replay-play', 'aria-pressed')) === 'false') return
    await page.click('#gw-replay-play')
    await page.waitForTimeout(30)
  }
  expect(await page.getAttribute('#gw-replay-play', 'aria-pressed')).toBe('false')
}

test.describe('stage 5 share link opens into the cinematic replay', () => {
  test('the trace, the seek and the playhead are the deterministic sim', async ({ page }) => {
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

    // ---- playback controls act on the playhead ----
    const timeline = page.locator('#gw-replay-timeline')
    await timeline.focus()
    await page.keyboard.press('Home')
    await ensurePaused(page)
    const t1 = (await replayState(page)).t
    await page.waitForTimeout(350)
    expect((await replayState(page)).t).toBe(t1) // PAUSED holds the state

    await page.click('#gw-replay-play') // play at 1x
    await page.waitForTimeout(300)
    const t2 = (await replayState(page)).t
    expect(t2).toBeGreaterThan(t1)
    await ensurePaused(page)

    await page.keyboard.press('Home')
    await ensurePaused(page)
    const t3 = (await replayState(page)).t
    await page.click('.gw-replay-speed[data-speed="4"]')
    await page.click('#gw-replay-play')
    await page.waitForTimeout(300)
    const t4 = (await replayState(page)).t
    expect(t4 - t3).toBeGreaterThanOrEqual(0.6) // 4x over 300 ms is 1.2 s of sim
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
