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
 *
 * Round 2 (Action Plan 2026-10-11 Lane B) adds THE GHOST LAW and the trace
 * cache: an unearned campaign rung shows NO par line (the bar carries the
 * calm `ghost: par — finish first to race` word, no wind arms, and the
 * evaluator's build-phase scenario holds); the rung's FIRST finish unlocks
 * the line remembered ON (reduced-motion law still decides); sandboxes and
 * the daily are afterlife surfaces and default ON; the friend link is an
 * explicit ask, never locked; and after the first wind a toggle flip is a
 * cache hit, measured O(1) against a forced cold MISS (`__gwGhostTraceCache`).
 */
import { test, expect } from '@playwright/test'
import zlib from 'node:zlib'
import { readFileSync } from 'node:fs'
import { replayRun } from '../../src/replay/replay.ts'
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts'
import { encodeShareUrl, type ShareCodec } from '../../src/share/share.ts'
import { dailySeed, DAILY_KEY, utcDateKey } from '../../src/save/daily.ts'
import { goto } from './goto.ts'

/** Merge-not-wipe seeding (the farewell.spec idiom): stars written here make
 *  a rung EARNED for THE GHOST LAW (the save's per-rung truth) without
 *  faking any other record; settings an earlier run left are preserved. */
function seedStars(stars: Record<string, number>): string {
  return `
    let save = {}
    try { save = JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}') } catch { save = {} }
    const progress = save.progress ?? {}
    progress.stars = { ...(${JSON.stringify(stars)}), ...(progress.stars ?? {}) }
    progress.reached = progress.reached ?? {}
    save.progress = progress
    save.v = save.v ?? 2
    save.builds = save.builds ?? {}
    save.settings = save.settings ?? {}
    localStorage.setItem('gravity-works.save', JSON.stringify(save))
  `
}

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
  /** A tape is turning RIGHT NOW (the honest bar state while winding). */
  winding: boolean
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
  // THE GHOST LAW: the rail is an afterlife affordance ON by default only
  // once the rung is EARNED — this page proves the racing, so the rung is
  // finished in the seed (the unearned case has its own spec below).
  await page.addInitScript(seedStars({ kitchen01: 1 }))
  await goto(page, '/?level=kitchen01&build=par&launch=1')
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
  await page.addInitScript(seedStars({ kitchen01: 1 })) // earned → the rail is on
  await goto(page, '/?level=kitchen01&build=par&launch=1')
  await waitForGhost(page)
  const s0 = await ghostState(page)
  expect(s0.mode).toBe('par') // the ghost IS on for this hash claim
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-hash-value')).toHaveText(node.hash, { timeout: 10_000 })
})

test('reduced motion defaults the ghost OFF — and the toggle turns it on', async ({ page }) => {
  await page.addInitScript(seedStars({ kitchen01: 1 })) // earned: the toggle is offered, not locked
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await goto(page, '/?level=kitchen01')
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
  // a FRESH save: the par rail is LOCKED here (the rung is unearned) — the
  // friend link is an explicit ask and the law never locks it.
  await goto(page, '/?level=kitchen01')
  await expect(page.locator('#gw-ghost-toggle')).toHaveText('ghost: par — finish first to race')
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
  await goto(page, '/?level=kitchen01')
  await page.fill('#gw-ghost-link', 'not-a-link')
  await page.click('#gw-ghost-race')
  await expect(page.locator('#gw-ghost-note')).toContainText('not a run', { timeout: 5_000 })
  expect((await ghostState(page)).mode).toBe('off')
})

test('the daily rung: ?daily=1 is seed = hash(UTC date), and the chip records the best', async ({ page }) => {
  const seed = dailySeed()
  const parBuild = KITCHEN01.parBuild!()
  const seeded = await replayRun(KITCHEN01, { ...parBuild, seed })
  await goto(page, '/?level=kitchen01&build=par&launch=1&daily=1')
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

// ---- round 2 (Lane B): THE GHOST LAW and the trace cache --------------------

const LOCKED_WORD = 'ghost: par — finish first to race'

/** One toggle flip from OFF to ON, timed against the `gw-ghost-ready` fact
 *  (never a timeout): the flip is the thing the cache is supposed to make
 *  free, so the clock rides the same page that answers it. */
async function flipOnAndAwaitReady(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const t = document.getElementById('gw-ghost-toggle') as HTMLButtonElement
        const t0 = performance.now()
        const done = () => resolve(performance.now() - t0)
        window.addEventListener('gw-ghost-ready', done, { once: true })
        window.setTimeout(() => reject(new Error('flip never landed a ready ghost')), 30_000)
        t.click()
      }),
  )
}

test('the ghost law: an unearned puzzle rung shows NO par line (build phase, evaluator scenario)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await goto(page, '/?level=kitchen02') // fresh save: the rung is unfinished
  // the bar carries the calm word — and NOTHING winds, teases, or arms
  await expect(page.locator('#gw-ghost-toggle')).toHaveText(LOCKED_WORD)
  await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-disabled', 'true')
  await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-pressed', 'false')
  const s0 = await ghostState(page)
  expect(s0.mode).toBe('off')
  expect(s0.ready).toBe(false)
  expect(s0.winding).toBe(false)
  // pressing the locked toggle changes nothing: no wind, no persisted
  // choice (force: Playwright reads aria-disabled as not-enabled, and the
  // pointer reaching a locked button is exactly what this line probes)
  await page.click('#gw-ghost-toggle', { force: true })
  await page.waitForTimeout(1_000)
  const s1 = await ghostState(page)
  expect(s1.ready).toBe(false)
  expect(s1.winding).toBe(false)
  await expect(page.locator('#gw-ghost-note')).toHaveText('')
  expect(await page.evaluate(() => (window as any).__gwGhostTraceCache().misses)).toBe(0)
  expect(errors).toEqual([])
})

test('the ghost law: the FIRST finish unlocks the line, remembered ON — and it persists', async ({ page }) => {
  await goto(page, '/?level=kitchen01&build=par&launch=1') // fresh: locked, then EARNED by this run
  await expect(page.locator('#gw-ghost-toggle')).toHaveText(LOCKED_WORD)
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  // the unlock edge: the calm word retires, the remembered ON arrives, and
  // the wound-once line is ready for the next launch
  await expect(page.locator('#gw-ghost-toggle')).toHaveText('ghost: par')
  await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-pressed', 'true')
  await waitForGhost(page)
  // reload with NO seed script: the save's own star is the truth now
  await goto(page, '/?level=kitchen01')
  await expect(page.locator('#gw-ghost-toggle')).toHaveText('ghost: par')
  await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-pressed', 'true')
})

test('the ghost law: an earned rung defaults ON, and an explicit OFF persists across reload', async ({ page }) => {
  await page.addInitScript(seedStars({ kitchen01: 2 }))
  await goto(page, '/?level=kitchen01')
  await expect(page.locator('#gw-ghost-toggle')).toHaveText('ghost: par')
  await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-pressed', 'true')
  await page.click('#gw-ghost-toggle') // the player's choice: OFF
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}')?.settings?.ghosts?.par === false,
    undefined,
    { timeout: 10_000 },
  )
  await goto(page, '/?level=kitchen01')
  await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-pressed', 'false')
  expect((await ghostState(page)).enabled).toBe(false)
})

test('the ghost law: afterlife surfaces default ON — the sandbox and the daily', async ({ page }) => {
  await goto(page, '/?level=porch-sandbox')
  await expect(page.locator('#gw-ghost-toggle')).toHaveText('ghost: par')
  await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-pressed', 'true')
  await goto(page, '/?level=kitchen-sandbox')
  await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-pressed', 'true')
  await goto(page, '/?level=kitchen01&daily=1') // the daily rides a rung and is still afterlife
  await expect(page.locator('#gw-ghost-toggle')).toHaveText('ghost: par')
  await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-pressed', 'true')
})

test('the trace cache: the first flip pays the wind, every flip after is O(1)', async ({ page }) => {
  await page.addInitScript(seedStars({ kitchen01: 1 }))
  await goto(page, '/?level=kitchen01') // lazy wind: nothing wound yet at the grid
  await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-pressed', 'true')
  const stats = () =>
    page.evaluate(() => (window as any).__gwGhostTraceCache() as { size: number; hits: number; misses: number })
  await page.evaluate(() => (window as any).__gwGhostTraceCacheClear())
  // a COLD flip (cache emptied) is the pre-cache cost: the whole tape winds
  await page.click('#gw-ghost-toggle') // off
  const missMs = await flipOnAndAwaitReady(page) // on — full wind
  // the cached flip is the new toggle-flip cost: a Map hit and a pose
  await page.click('#gw-ghost-toggle') // off
  const hitMs = await flipOnAndAwaitReady(page) // on — cache hit
  const after = await stats()
  expect(after.misses).toBeGreaterThanOrEqual(1)
  expect(after.hits).toBeGreaterThanOrEqual(1)
  expect(hitMs).toBeLessThan(250) // O(1) in practice, not in prose
  expect(hitMs * 4).toBeLessThan(missMs) // the flip got at least 4× cheaper
})
