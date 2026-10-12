/**
 * THE TALLY, MADE REAL (freeplay program Lane B — Action Plan 2026-10-12).
 * Three claims, e2e on the shipped page:
 *
 *   1. THE TAIL ON EVERY RESULT BAR — a fresh campaign run's result bar
 *      carries its tally tail (kitchen05's par line earns air/catch/fall/
 *      spend on the shipped sweep; the tail says `earned —` and the
 *      device had never seen them: `first … — earned`). The campaign
 *      keeps its stars and GAINS the tail — the sheet fills during the
 *      tutorial.
 *   2. THE SANDBOX APPLICATION — a placed cup re-anchors a NAMED record:
 *      build out to a seat, place the cup, finish, NAME the line; the
 *      personal best rides the tail with the daily's honesty sentence
 *      verbatim, and the NEXT launch races your-best (the record ghost —
 *      `ghostMode: record`, the par machinery on the stored build).
 *   3. THE SANDBOX RUN-CAM — the share page's cinematic mounts on the
 *      sandbox result (the `film` seam of `__gwTally` reads true while
 *      the panel is up).
 *
 * Hash honesty: this page IS the tally-mounted page, and the family of
 * specs that compare the page's run hash to the Node `replayRun` hash
 * (`determinism.spec.ts`) runs against this same shell — the unit gate
 * (`tests/unit/tally.test.ts`) pins the with/without-tally equality to the
 * atlas receipt directly.
 */
import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'

test('campaign result bar shows its tally tail — earned counts and firsts', async ({ page }) => {
  await goto(page, '/?level=kitchen05&build=par&launch=1')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  const tally = page.locator('#gw-result-tally')
  await expect(tally).toBeVisible()
  const text = (await tally.textContent()) ?? ''
  // The shipped sweep says kitchen05's par earns air, catch, a fall and a
  // spend; at least two of those lines must appear, in the stock voice.
  expect(text).toContain('earned —')
  const earned = text.split('\n')[0] ?? ''
  const granted = ['air', 'clean catch', 'chain fall', 'booster spend'].filter((w) => earned.includes(w))
  expect(granted.length).toBeGreaterThanOrEqual(2)
  // a FRESH save: everything this run earned is also a first
  expect(text).toContain('first ')
  expect(text).toContain('— earned')
})

test('sandbox: placing a cup + finishing mints a named record whose ghost races the next attempt', async ({ page }) => {
  // The record-ghost wind and the run-cam mount are honest work (the a11y
  // spec's own words), and on CI's SwiftShader frame pacing the launch
  // cycle alone outlasts the default 30 s budget — the same budget the
  // wind-bearing specs carry (a11y/farewell); the assertions are unchanged.
  test.setTimeout(180_000)
  await goto(page, '/?level=kitchen-sandbox')
  await expect(page.locator('#gw-tray')).toBeVisible()

  // build five straights out from the ramp and seat the CUP at the head —
  // the tray holds both at ×99; every placement is an ordinary click+Place
  for (let i = 0; i < 5; i++) {
    await page.click('#gw-tray button[data-kind="straight"]')
    await page.click('#gw-place')
  }
  await page.click('#gw-tray button[data-kind="finishCup"]')
  await page.click('#gw-place')

  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })

  // the chip: this line has no name yet — name it
  await expect(page.locator('#gw-result-name-chip')).toHaveText('name this line')
  await page.fill('#gw-result-name-input', 'the spillway')
  await page.click('#gw-result-name-save')

  // the named record rides the tail, honesty sentence verbatim
  const tally = page.locator('#gw-result-tally')
  await expect(tally).toContainText('“the spillway”')
  await expect(tally).toContainText('personal best')
  await expect(tally).toContainText('your own runs on this device only')

  // the save carries the line (settings.records, v2 envelope, no bump)
  const records = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}')
    return raw.settings?.records?.lines ?? null
  })
  expect(Object.values(records as Record<string, { name: string }>).some((l) => l.name === 'the spillway')).toBe(true)

  // the chip retires to the named label (no re-mint path)
  await expect(page.locator('#gw-result-name-chip')).toContainText('line “the spillway”')

  // NEXT ATTEMPT: your-best races on the rail — the record ghost, the
  // par machinery wound from the stored build (no new truth).
  await page.click('#gw-result-retry')
  await expect(page.locator('#gw-status')).toContainText('ready')
  await page.click('#gw-launch')
  await expect
    .poll(async () => (await page.evaluate(() => (window as any).__gwGhostState())).mode, { timeout: 30_000 })
    .toBe('record')
  await expect(page.locator('#gw-ghost-toggle')).toHaveText('ghost: your line')

  // the sandbox result mounts the share page's run-cam while the panel is up
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  expect(await page.evaluate(() => (window as any).__gwTally().film)).toBe(true)
  // and the named line's record line stands on the tail again
  await expect(tally).toContainText('“the spillway”')
})
