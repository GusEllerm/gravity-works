/**
 * The replay-stage RED censor (playtest AA, stage 5): a hand-forged `#s=`
 * link played honestly — viewer, scrubber, speeds, verdict — but the stage
 * rendered SOLID RED. The disease was the finish lock-off on a cup-less
 * nose-first `fell`: the final tangent is exactly UP, the pose's
 * `tangent*-0.45d + UP*0.42d` offset terms cancel to ~3 cm, and the camera
 * sits INSIDE the red chassis for the whole finish hold (measured before
 * the guard: 98.4 % of the frame inside the car-chassis colour band at the
 * playtesters' exact playhead). This spec is the pixel half of that claim:
 *
 *   1. the playtest reproduction — a build with nothing under the release
 *      (falls at 0.4 s, 1.3 s tape, the exact bar reading AA reported) —
 *      screenshotted mid-shot at t=0.7 s and censused: fewer than 40 % of
 *      pixels may read as chassis-red (measured healthy: 0.7 %). The solid
 *      red class is machine-independent geometry, so a fixed build cannot
 *      bring it back on any GPU.
 *   2. the shots actually differ: on the REAL kitchen01 par link the wide,
 *      follow and finish frames must pixelmatch-differ above a tenth of
 *      the frame from each other (a stage that "renders red" or freezes one
 *      frame for every shot fails here too) — and every sampled frame
 *      carries the same red census.
 */
import { test, expect } from '@playwright/test'
import zlib from 'node:zlib'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import '../../src/world/campaign.ts' // registers the ladder (the registry convention)
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts'
import { getLevel } from '../../src/world/levels/feeltrack.level.ts'
import { replayRun } from '../../src/replay/replay.ts'
import { encodeShareUrl, type ShareCodec } from '../../src/share/share.ts'
import type { Build } from '../../src/track/build.ts'

const zlibCodec: ShareCodec = {
  deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))),
  inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))),
}

async function shareUrl(levelId: string, build: Build): Promise<string> {
  const run = await replayRun(getLevel(levelId), build, {})
  return encodeShareUrl({ levelId, seed: build.seed, hash: run.hash, build }, zlibCodec)
}

/** Seek by clicking the real timeline (the playtesters' path), then read
 * the canvas as a PNG — the mid-shot frame the player is looking at. */
async function shotAt(page: import('@playwright/test').Page, t: number): Promise<Buffer> {
  await page.evaluate((tt: number) => {
    const play = document.querySelector('#gw-replay-play') as HTMLButtonElement
    if (play.getAttribute('aria-pressed') === 'true') play.click() // pause: a screenshot RPC gap is wall time, and autoplay would drift the frame
    const el = document.querySelector('#gw-replay-timeline')!
    const r = el.getBoundingClientRect()
    const x = r.left + (tt / (window as unknown as { __gwReplayTrace: () => { duration: number } }).__gwReplayTrace().duration) * r.width
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: r.top + r.height / 2, pointerId: 40 + Math.round(tt * 10) }))
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: r.top + r.height / 2, pointerId: 40 + Math.round(tt * 10) }))
  }, t)
  return page.locator('#gw-canvas').screenshot()
}

/** The chassis-red band: R above 90, dominating G by 60 and B by 50 — the
 * `#d7263d` chassis under the world lights, and nothing else the set or the
 * track can produce (measured: track orange tops out below this band's G
 * floor, so honest frames sit in single digits). */
function redShare(png: PNG): number {
  let red = 0
  for (let i = 0; i < png.width * png.height; i++) {
    const p = i * 4
    const r = png.data[p]!
    if (r > 90 && r - png.data[p + 1]! > 60 && r - png.data[p + 2]! > 50) red++
  }
  return red / (png.width * png.height)
}

test('a cup-less nose-first fell never renders the replay stage solid red', async ({ page }) => {
  test.slow() // the replay record boots wasm + steps the sim on load
  const build: Build = { levelId: FEELTRACK.id, pieces: [], seed: 1 }
  const url = await shareUrl(FEELTRACK.id, build)
  await page.goto(`/${url}`)
  await page.waitForSelector('#gw-replay-timeline', { timeout: 120_000 })
  const tr = await page.evaluate(() => (window as unknown as { __gwReplayTrace: () => { duration: number; status: string } }).__gwReplayTrace())
  expect(tr.status).toBe('fell') // the reproduction: 0.4 s fall, 1.3 s tape
  expect(tr.duration).toBeCloseTo(1.3, 5)
  for (const t of [tr.duration * 0.05, 0.3, 0.7, tr.duration - 0.1]) {
    const png = PNG.sync.read(Buffer.from(await shotAt(page, t)))
    expect(redShare(png), `solid red at t=${t.toFixed(2)}`).toBeLessThan(0.4)
  }
})

test('the three shots actually differ on the real kitchen01 par link', async ({ page }) => {
  test.slow()
  const level = getLevel('kitchen01')
  const build = level.parBuild!()
  const url = await shareUrl('kitchen01', build)
  await page.goto(`/${url}`)
  await page.waitForSelector('#gw-replay-timeline', { timeout: 120_000 })
  const plan = await page.evaluate(() => (window as unknown as { __gwReplayTrace: () => { shots: { kind: string; start: number; end: number }[] } }).__gwReplayTrace().shots)
  const wide = plan.find((s) => s.kind === 'wide')!
  const follow = plan.find((s) => s.kind === 'follow')!
  const finish = plan.find((s) => s.kind === 'finish')!
  const frames: Record<string, PNG> = {}
  for (const s of [wide, follow, finish]) {
    const png = PNG.sync.read(Buffer.from(await shotAt(page, (s.start + s.end) / 2)))
    expect(redShare(png), `solid red in the ${s.kind} shot`).toBeLessThan(0.4)
    frames[s.kind] = png
  }
  const diff = (a: PNG, b: PNG): number =>
    pixelmatch(a.data, b.data, undefined, a.width, a.height, { threshold: 0.1 }) / (a.width * a.height)
  // frame-diff between cuts: every pair of shots must be a different
  // picture above the 10 % floor (a frozen/red stage fails this too)
  expect(diff(frames.wide!, frames.follow!), 'wide vs follow').toBeGreaterThan(0.1)
  expect(diff(frames.follow!, frames.finish!), 'follow vs finish').toBeGreaterThan(0.1)
  expect(diff(frames.wide!, frames.finish!), 'wide vs finish').toBeGreaterThan(0.1)
})
