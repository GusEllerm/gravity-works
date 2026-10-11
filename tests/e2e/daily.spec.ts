/**
 * THE DAILY, MADE REAL (round 2, Lane C — Action Plan 2026-10-11). The old
 * daily was a date sticker on rung one: `seed = hash(UTC date)` rode the
 * build field and the sim never reads the seed, so every day was the same
 * run. The date now picks a BOARD too: `dailyBoardId` folds the SAME
 * day's number onto the thirty rungs of the ladder, the page names
 * TODAY'S BOARD in a corner tag, the result chip LEADS with that name, and
 * the par ghost rides the rung by the ghost law (the daily is an afterlife
 * surface — default ON, Decision Log 2026-10-11).
 *
 * The laws this spec pins, e2e on the shipped page:
 *
 *   1. TWO DATES, TWO BOARDS — `?date=` (the recorded debug-param family)
 *      pins the UTC day BOTH SIDES of every comparison (engineering
 *      round-2 N6: no Node↔page midnight race exists to flake), and two
 *      different days land on two different named rungs, each matching
 *      the Node-folded `dailyBoardId(dailySeed(day))` — stable within a
 *      date (a second visit shows the same tag).
 *   2. THE SEED LAW, HONEST ABOUT ITSELF — a date-seeded RUN is
 *      deterministic: the page's hash equals the Node `replayRun` of
 *      TODAY'S BOARD at that seed, and the same address run twice hashes
 *      the same bytes (the seed rides the build field; this is the claim
 *      the date is allowed to make, verified rather than asserted).
 *   3. THE CHIP READS THE BOARD'S NAME — the result line starts with
 *      today's board's registry name and keeps the single-machine honesty
 *      clause inside the sentence; the localStorage record belongs to the
 *      ADDRESSED day, not the wall clock.
 *   4. The ghost law rides it: the daily board's par line defaults ON
 *      (afterlife surface) even on a rung the save never finished.
 */
import { test, expect } from '@playwright/test'
import { replayRun } from '../../src/replay/replay.ts'
import { getLevel } from '../../src/world/levels/feeltrack.level.ts'
import { dailyBoardId } from '../../src/world/campaign.ts'
import { dailySeed, DAILY_KEY, utcDateKey } from '../../src/save/daily.ts'
import { goto } from './goto.ts'

/** The board a UTC day addresses — Node side, the same two-line rule the
 *  page runs (`dailySeed` → `dailyBoardId`), stated once here so no test
 *  ever hardcodes a date or a name. */
function boardOfDay(date: string): { id: string; name: string; seed: number } {
  const seed = dailySeed(new Date(`${date}T12:00:00Z`))
  const id = dailyBoardId(seed)
  return { id, name: getLevel(id).name, seed }
}

const DAY_A = '2026-10-11'
const DAY_B = '2026-10-12'

test('two dates, two boards: each day lands on its named rung and says so', async ({ page }) => {
  const seen: string[] = []
  for (const day of [DAY_A, DAY_B]) {
    const want = boardOfDay(day)
    await goto(page, `/?daily=1&date=${day}`)
    await expect(page.locator('#gw-daily-board')).toBeVisible()
    await expect(page.locator('#gw-daily-board')).toHaveText(`today’s board — ${want.name} · ${day}`)
    // the ghost law rides the daily: afterlife surface, default ON, even
    // though this save never finished (or addressed!) the rung
    await expect(page.locator('#gw-ghost-toggle')).toHaveText('ghost: par')
    await expect(page.locator('#gw-ghost-toggle')).toHaveAttribute('aria-pressed', 'true')
    seen.push(want.id)
  }
  expect(seen[0]).not.toBe(seen[1]) // two different boards — not a sticker
})

test('stable within a date: the same day twice shows the same board, and a plain ?daily=1 names today', async ({ page }) => {
  const want = boardOfDay(DAY_A)
  for (const _ of [0, 1]) {
    await goto(page, `/?daily=1&date=${DAY_A}`)
    await expect(page.locator('#gw-daily-board')).toHaveText(`today’s board — ${want.name} · ${DAY_A}`)
  }
  // the un-pinned face names the day the page itself claims, and its tag
  // date is the UTC day the seed was folded from (both sides read ONE key)
  await goto(page, '/?daily=1')
  const tag = (await page.locator('#gw-daily-board').textContent()) ?? ''
  const claimed = tag.split('·')[1]?.trim()
  expect(claimed, 'the tag states a UTC date').toMatch(/^\d{4}-\d{2}-\d{2}$/)
  // the seed law for the day the PAGE says it is: the page's own claim is
  // checkable against the Node fold of that same date (no clock race —
  // engineering round-2 N6)
  const seed = dailySeed(new Date(`${claimed}T12:00:00Z`))
  expect(getLevel(dailyBoardId(seed)).name).toBe(tag.split('—')[1]?.trim().split(' ·')[0])
})

test('the date-seeded run is deterministic: the page hash is the Node replay, twice over', async ({ page }) => {
  test.slow()
  const want = boardOfDay(DAY_A)
  const par = getLevel(want.id).parBuild!()
  const node = await replayRun(getLevel(want.id), { ...par, seed: want.seed })
  let first = ''
  for (const pass of [0, 1]) {
    await goto(page, `/?daily=1&date=${DAY_A}&build=par&launch=1`)
    await expect(page.locator('#gw-result')).toBeVisible({ timeout: 120_000 })
    const h = (await page.locator('#gw-hash-value').textContent()) ?? ''
    expect(h.length, 'the run landed a hash').toBeGreaterThanOrEqual(8)
    if (pass === 0) first = h
    // the same date-seeded address, run twice, hashes the SAME bytes —
    // and they are the Node replay's bytes at that day's seed
    expect(h).toBe(first)
    expect(h).toBe(node.hash)
  }
})

test('the result chip reads the board’s name and keeps the single-machine line', async ({ page }) => {
  test.slow()
  const want = boardOfDay(DAY_A)
  await goto(page, `/?daily=1&date=${DAY_A}&build=par&launch=1`)
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 120_000 })
  await expect(page.locator('#gw-result-daily')).toBeVisible()
  await expect(page.locator('#gw-result-daily')).toContainText(want.name)
  await expect(page.locator('#gw-result-daily')).toContainText('race today')
  await expect(page.locator('#gw-result-daily')).toContainText('this device only')
  // the record belongs to the ADDRESSED day (a debug date is a whole date
  // address, streak included — the chip and the record cannot disagree)
  const rec = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? 'null'),
    DAILY_KEY,
  )
  expect(rec).not.toBeNull()
  expect(rec.date).toBe(DAY_A)
  expect(rec.best).toBeGreaterThan(0)
  expect(rec.streak).toBeGreaterThanOrEqual(1)
  expect(utcDateKey(new Date(`${rec.date}T12:00:00Z`))).toBe(rec.date)
})
