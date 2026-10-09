import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'

/**
 * T0.3 / R1 — SAVE QUARANTINE (Action Plan 2026-10-09, Evaluation 2026-10-09
 * engineering R1, Recommendations 2026-10-09 technical §2).
 *
 * THE EVALUATOR'S EXACT REPRO, written RED first: a save blob that PARSES but
 * the current migrade cannot use — here a `v:3` envelope (v3 is deliberately
 * reserved) holding TWO BANKED STARS — used to be silently `freshSave()`d by
 * `migrateBlob`, and ONE ordinary click of `#gw-sound-toggle` (any `saveSave`
 * of the fresh state) committed the wipe forever: zero builds, zero stars,
 * zero message. After T0.3:
 *
 *   (i)  the raw bytes are quarantined OUTSIDE the envelope under
 *        `gravity-works.save.corrupt-<n>` — the next `saveSave` of fresh
 *        state must NOT destroy recoverability;
 *   (ii) ONE honest line surfaces in the settings row (export / import);
 *   (iii) the two banked stars are RECOVERABLE — restore-from-quarantine and
 *        file import both run the same migrate/validate machinery;
 *   (iv) the game keeps playing throughout (no crash, no half-page).
 *
 * The mutation is the proof: delete the quarantine stash in `migrateBlob`'s
 * failure path (or make it `freshSave()` silently again) and this file goes
 * RED exactly where the old silent wipe lived.
 */

const ready = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 30_000 })
}

/** The evaluator's hostile blob: parseable, from-the-future, two banked stars. */
const v3WithTwoBankedStars = () =>
  JSON.stringify({
    v: 3,
    builds: {},
    settings: {},
    progress: { stars: { kitchen01: 3, kitchen02: 2 }, reached: {} },
  })

const quarantineKeys = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const out: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? ''
      if (k.startsWith('gravity-works.save.corrupt-')) out[k] = localStorage.getItem(k) ?? ''
    }
    return out
  })

const storedStars = (page: import('@playwright/test').Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}')?.progress?.stars ?? {},
  )

/** Wait THROUGH the restore/import reload (a poll would die on the
 *  navigation): the envelope's banked stars land the wanted shape. */
const starsLanded = async (page: import('@playwright/test').Page, wanted: Record<string, number>) => {
  await page.waitForFunction(
    (w) => {
      const stars =
        JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}')?.progress?.stars ?? {}
      return Object.entries(w).every(
        ([k, n]) => (typeof stars[k] === 'object' ? stars[k].n : stars[k]) === n,
      )
    },
    wanted,
    { timeout: 20_000 },
  )
}

test('R1 repro: a parseable v3 save with two banked stars is quarantined, not silently wiped', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await goto(page, '/?level=kitchen01')
  await ready(page)

  // the evaluator's probe: drop a v3 save holding two banked stars into the key
  await page.evaluate((raw) => localStorage.setItem('gravity-works.save', raw), v3WithTwoBankedStars())
  await page.reload()
  await ready(page) // the game MUST keep playing whatever the blob was

  // the evaluator's commit lever: ONE ordinary click that saves the fresh
  // state — today this is what makes the wipe PERMANENT
  await page.click('#gw-sound-toggle')

  // (i) the raw bytes live OUTSIDE the envelope — the wipe is recoverable
  expect(Object.values(await quarantineKeys(page))).toContain(v3WithTwoBankedStars())
  // (iv) and the envelope the game plays on is a live v2 save, not a shrug
  const envelope = await page.evaluate(
    () => JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}'),
  )
  expect(envelope.v).toBe(2)

  // (ii) ONE honest line, in the settings row
  await page.click('#gw-save-toggle')
  await expect(page.locator('#gw-save-quarantine')).toContainText(/set aside/i)

  // (iii) recoverable: restore from quarantine puts the two banked stars back
  await page.click('#gw-save-restore-0')
  await starsLanded(page, { kitchen01: 3, kitchen02: 2 })
  await ready(page)

  expect(errors).toEqual([])
})

test('R1 settings row: import validates through migrate before accepting — garbage never replaces the save', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await goto(page, '/?level=kitchen01')
  await ready(page)

  // a real banked star the player owns today
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}')
    raw.progress = { stars: { kitchen01: 2 }, reached: {} }
    localStorage.setItem('gravity-works.save', JSON.stringify(raw))
  })
  await page.reload()
  await ready(page)

  await page.click('#gw-save-toggle')
  // an unusable file is REJECTED, the live save survives (validate-then-accept)
  await page.setInputFiles('#gw-save-import', {
    name: 'gravity-works-save.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{{{ not a save'),
  })
  await expect(page.locator('#gw-save-note')).toContainText(/not a usable save/i)
  await expect
    .poll(() => storedStars(page), { timeout: 5_000 })
    .toMatchObject({ kitchen01: 2 })

  // a v3 file the migrade cannot open is STILL importable through the same
  // validate machinery's salvage: two banked stars come back
  await page.setInputFiles('#gw-save-import', {
    name: 'gravity-works-save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(v3WithTwoBankedStars()),
  })
  await starsLanded(page, { kitchen01: 3, kitchen02: 2 })
  await ready(page)

  expect(errors).toEqual([])
})
