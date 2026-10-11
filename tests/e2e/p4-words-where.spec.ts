/**
 * P4 SHORTLIST ITEMS 4 + 5 (the 2026-10-10 player evaluation, bar 7).
 *
 * Item 4 (bedroom02 "flatten the landing" named no WHERE): the whole-tray
 * dump in BUTTON ORDER (straight ×3, drop, landing) is the evaluator's own
 * build — it FELL at ~2.3 s nose-first. The round-5 pass gave the critique
 * a socket tail ("past the cup"); the round-3 verdict then scored it again
 * — a WHERE on a verbless verb is still a sentence nobody can say. The
 * ACTIONABLE-VERB PRIORITY (`src/ui/result.ts`) now reads the SAME join
 * graph the tail used: a piece the player placed sits PAST the goal, so
 * the line speaks the MOVE clause's verb — `pull it back`, the Remove
 * button — instead of the critique.
 *
 * Item 5 (the first hour never says the magic words): the bank/curve lines
 * the tray could never teach now speak at the rung that SHIPS them as
 * geometry — kitchen02's run-out `curve`, kitchen03's bowl-rim `bank`, once
 * ever across saves, after the star-rules line has had its first boot — and
 * the level select says the sandboxes exist, the pieces they keep, and the
 * one door the campaign itself opens onto them.
 */
import { expect, test } from '@playwright/test'
import { goto } from './goto.ts'
import { KITCHEN02 } from '../../src/world/levels/kitchen02.level.ts'
import { KITCHEN03 } from '../../src/world/levels/kitchen03.level.ts'

// Same CI-honesty budget as `goal-rung.spec.ts` / `campaign.spec.ts`: the 60_000
// `ready`/`fell` waits document a 60 s intent the default 30 s TEST timeout cuts
// mid-launch (the 2026-10-10 08:51Z CI red: this test died at 30.2 s inside a
// healthy `#gw-place` click under software-GL saturation; the same tree passed
// twice on a fast runner). `slow()` carries the promised budget; waits and
// assertions unchanged.
test.slow()

const ready = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
}

const place = async (page: import('@playwright/test').Page) => {
  await page.click('#gw-place')
}

test('bedroom02: the whole-tray dump names WHERE the landing sits (P4 item 4)', async ({ page }) => {
  await goto(page, '/?level=bedroom02')
  await ready(page)
  for (const kind of ['straight', 'straight', 'straight', 'drop', 'landing']) {
    await page.click(`#gw-tray-${kind}`)
    await place(page)
  }
  await expect(page.locator('#gw-piece-count')).toHaveText('5 of 5 pieces used')
  await page.click('#gw-launch')
  // the evaluator's dump dies nose-first (7 of 20 whole-tray orders finish;
  // the button-order dump is not one of them) — the note must answer it
  const status = page.locator('#gw-status')
  await expect(status).toContainText('fell', { timeout: 60_000 })
  const note = page.locator('#gw-result-note')
  // The live aim places the fifth press at the OPEN END the walk offers —
  // the cup's far exit on this board — and the round-3 verb law reads that
  // graph position as what it is: a piece the player paid for that the run
  // can never travel. The line speaks the MOVE clause's verb (`pull it
  // back`, the Remove button's word) and its site — no verbless critique.
  // (The unit twin's straight chain-fit walk seats the same piece `by the
  // drop` and keeps the critique: unused stock and no orphan there.)
  await expect(note).toContainText('the landing sits past the cup')
  await expect(note).toContainText('pull it back')
  // and the verbless critique is GONE from this build's line, not merely
  // tailless — round 3 measured that no `flatten` keystroke exists
  expect(await note.textContent()).not.toMatch(/flatten|lower/i)
})

test('the shipped-but-never-stocked kinds say their line at the rung (P4 item 5)', async ({ page }) => {
  // kitchen02 ships `curve` as the run-out fixture; its tray never stocks
  // one. Boot it twice: the star-rules line owns boot one, the SET line
  // speaks boot two, and a third boot is quiet chrome again.
  await goto(page, '/?level=kitchen02')
  await ready(page)
  await expect(page.locator('#gw-callout')).toContainText('Stars: finish the run') // the rules line
  await goto(page, '/?level=kitchen02')
  await ready(page)
  await expect(page.locator('#gw-callout')).toContainText('tight turn')
  await goto(page, '/?level=kitchen02')
  await ready(page)
  await expect(page.locator('#gw-callout')).toHaveText('')
  // kitchen03 owns the banked bowl rim; the shared `curve` line spent at
  // kitchen02, so the bank line is what this rung gets to say
  await goto(page, '/?level=kitchen03')
  await ready(page)
  await goto(page, '/?level=kitchen03')
  await ready(page)
  await expect(page.locator('#gw-callout')).toContainText('banked')
  await page.reload()
  await ready(page)
  await expect(page.locator('#gw-callout')).toHaveText('')
  expect(KITCHEN02.blockedGoalSeat).toBe(true)
  expect(KITCHEN03.fixtures?.bank).toBe(1)
})

test('the level select LINKS the six sandboxes and says what they keep (round 2, Lane C)', async ({ page }) => {
  // the P4 sentence has been promoted to six doors: one quiet sub-entry
  // per room row, each carrying the kinds fact the old prose line carried
  await goto(page, '/?levels=1')
  await expect(page.locator('#gw-levelselect-sandboxes')).toHaveCount(0) // prose retired
  await expect(page.locator('a.gw-level-sandbox')).toHaveCount(6)
  for (const room of ['kitchen', 'bedroom', 'bathroom', 'garden', 'garage', 'porch']) {
    const link = page.locator(`a#gw-level-${room}-sandbox`)
    await expect(link).toBeVisible()
    await expect(link).toContainText('loops and springs')
    await expect(link).toHaveAttribute('href', `?level=${room}-sandbox`)
  }
})
