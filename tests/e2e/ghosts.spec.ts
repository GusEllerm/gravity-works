/**
 * Program T3.2/T3.4 — ghost racing and the daily rung, end to end on the
 * real game shell:
 *
 *   1. PAR GHOST — on `?level=kitchen01&build=par&launch=1` the translucent
 *      par car is mounted and RACING beside the player (its pose exists in
 *      the scene, its clock rides the sim), and its own finish lands on the
 *      par line: the wind's terminal time is the measured par the pars.json
 *      line ceils, so `traceTime <= parTime <= traceTime + 0.05` IS the
 *      stated tolerance (gen-pars ceils to 0.05 s — `Modules/world`). The
 *      finish screen carries the "you vs par" delta beat.
 *   2. VISUALS ONLY — with the ghost on, the run's hash equals the Node
 *      `replayRun` hash of the same build EXACTLY (and `npm run replay:all`
 *      stays byte-identical; the tool run is part of the lane's gate).
 *   3. REDUCED MOTION — the ghost defaults OFF (toggle present and can
 *      turn it ON: the still-frame law binds the default, not the choice).
 *   4. FRIEND GHOST — a crafted `#s=` share URL pasted into "ghost: from
 *      link" mounts THEIR build as the track (the launched run hashes to
 *      the payload's hash) and winds THEIR car as the ghost.
 *   5. DAILY — `?daily=1` is the same page at `seed = hash(UTC date)`
 *      (byte-equal to `?seed=<dailySeed()>`'s hash, verified against Node),
 *      and the finish screen's "race today" chip records today's best into
 *      localStorage with the streak and the single-machine clause.
 */
import { test, expect } from '@playwright/test'
import zlib from 'node:zlib'
import { readFileSync } from 'node:fs'
import { replayRun } from '../../src/replay/replay.ts'
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts'
import { encodeShareUrl, type ShareCodec } from '../../src/share/share.ts'
import { dailySeed, DAILY_KEY, utcDateKey } from '../../src/save/daily.ts'

// the shipped pars line, read from the generated file itself (the spec's
// Node transform cannot bare-import JSON; one fs read keeps the file the
// single source — same bytes `src/world/stars.ts` compiles into PARS)
const PARS: Record<string, { pieces: number; time: number }> = Object.fromEntries(
  (JSON.parse(readFileSync('src/world/pars.json', 'utf8')) as {
    levelId: string
    parPieces: number
    parTime: number
  }[]).map((e) => [e.levelId, { pieces: e.parPieces, time: e.parTime }]),
)

const zlibCodec: ShareCodec = {
  deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))),
  inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))),
}

interface GhostState {
  mode: 'off' | 'par' | 'friend'
  enabled: boolean
  ready: boolean
  racing: boolean
  time: number
  steps: number
  pos: [number, number, number] | null
  at: number
  finished: boolean
}

const ghostState = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as any).__gwGhostState() as GhostState)

async function waitForGhost(page: import('@playwright/test').Page, ready = true): Promise<GhostState> {
  await page.waitForFunction(
    (r) => (window as any).__gwGhostState().ready === r,
    ready,
    { timeout: 30_000 },
  )
  return ghostState(page)
}

test('the par ghost mounts, races beside the car, and finishes on the par line', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen01&build=par&launch=1')
  // the trace is derived at level-load: wait for the wind. The car is
  // PAINTED FROM THE LAUNCH ON (the grid stays a single car — the idle
  // frame the shell baseline records); this page auto-launches, so once
  // the tape is ready the race is on and the ghost has a live pose.
  const ready = await waitForGhost(page)
  expect(ready.mode).toBe('par')
  expect(ready.enabled).toBe(true)

  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  const done = await ghostState(page)
  expect(done.racing).toBe(true)
  expect(done.pos).not.toBeNull()
  // THE TOLERANCE, STATED: pars.json CEILS the measured finish to 0.05 s
  // (gen-pars), so the ghost's own terminal time must sit inside
  // [parTime - 0.05, parTime] of the shipped line.
  const par = PARS.kitchen01!
  expect(done.time).toBeLessThanOrEqual(par.time + 1e-9)
  expect(done.time).toBeGreaterThan(par.time - 0.05)
  expect(done.finished).toBe(true)

  // THE FINISH BEAT: "you vs par" in the stars' own numbers (a par build on
  // the par rails is the even case on both lines)
  await expect(page.locator('#gw-result-vspar')).toBeVisible()
  await expect(page.locator('#gw-result-vspar')).toContainText('you vs par — time')
  expect(errors).toEqual([])
})

test('the ghost never touches the hash: the run hashes byte-identical to the Node replay', async ({ page }) => {
  const node = await replayRun(KITCHEN01, KITCHEN01.parBuild!())
  await page.goto('/?level=kitchen01&build=par&launch=1')
  await waitForGhost(page)
  const s0 = await ghostState(page)
  expect(s0.mode).toBe('par') // the ghost IS on for this hash claim
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-hash-value')).toHaveText(node.hash, { timeout: 10_000 })
})

test('reduced motion defaults the ghost OFF — and the toggle turns it on', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?level=kitchen01')
  await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-pressed', 'false')
  expect((await ghostState(page)).pos).toBeNull()
  // the choice stays the player's: flip it on and the line winds
  await page.click('#gw-ghost-toggle')
  await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-pressed', 'true')
  const on = await waitForGhost(page)
  expect(on.mode).toBe('par')
  expect(on.ready).toBe(true)
})

test('a share link pasted into the ghost bar mounts their track and races their car', async ({ page }) => {
  const build = KITCHEN01.parBuild!()
  const node = await replayRun(KITCHEN01, build)
  const frag = await encodeShareUrl(
    { levelId: KITCHEN01.id, seed: build.seed, hash: node.hash, build },
    zlibCodec,
  )
  await page.goto('/?level=kitchen01')
  await page.fill('#gw-ghost-link', `http://localhost:${process.env.E2E_PORT ?? 4173}/${frag}`)
  await page.click('#gw-ghost-race')
  // the friend mount races the par wind for the grid; wait for the MODE,
  // not just readiness (the par ghost may already be ready when pasted)
  await page.waitForFunction(
    () => (window as any).__gwGhostState().mode === 'friend',
    undefined,
    { timeout: 30_000 },
  )
  const g = await ghostState(page)
  expect(g.mode).toBe('friend')
  expect(g.ready).toBe(true)
  // THEIR BUILD IS THE TRACK: the launched run hashes to the payload's hash
  await page.keyboard.press('l')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-hash-value')).toHaveText(node.hash)
  const done = await ghostState(page)
  expect(done.mode).toBe('friend')
  expect(done.finished).toBe(true)
})

test('a garbage link says so instead of pretending', async ({ page }) => {
  await page.goto('/?level=kitchen01')
  await page.fill('#gw-ghost-link', 'not-a-link')
  await page.click('#gw-ghost-race')
  await expect(page.locator('#gw-ghost-note')).toContainText('not a run', { timeout: 5_000 })
  expect((await ghostState(page)).mode).toBe('off')
})

test('the daily rung: ?daily=1 is seed = hash(UTC date), and the chip records the best', async ({ page }) => {
  const seed = dailySeed()
  const parBuild = KITCHEN01.parBuild!()
  const seeded = await replayRun(KITCHEN01, { ...parBuild, seed })
  await page.goto('/?level=kitchen01&build=par&launch=1&daily=1')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  // the seed law: the page's hash is the Node replay AT THE DAY'S SEED
  await expect(page.locator('#gw-hash-value')).toHaveText(seeded.hash, { timeout: 10_000 })
  // the chip: today's line with the single-machine honesty clause inside it
  await expect(page.locator('#gw-result-daily')).toBeVisible()
  await expect(page.locator('#gw-result-daily')).toContainText('race today')
  await expect(page.locator('#gw-result-daily')).toContainText('this device only')
  const rec = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? 'null'),
    DAILY_KEY,
  )
  expect(rec).not.toBeNull()
  expect(rec.date).toBe(utcDateKey())
  expect(rec.best).toBeGreaterThan(0)
  expect(rec.streak).toBeGreaterThanOrEqual(1)
})
