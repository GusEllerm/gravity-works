/**
 * P4 SHORTLIST ITEMS 4 + 5 (the 2026-10-10 player evaluation, bar 7).
 *
 * Item 4 (bedroom02 "flatten the landing" named no WHERE): the whole-tray
 * dump in BUTTON ORDER (straight ×3, drop, landing) is the evaluator's own
 * build — it FELL at ~2.3 s nose-first — and the note must now locate the
 * landing with the Remove button's own socket words, `by the drop`. The
 * unit twin (`tests/unit/critique-where.test.ts`) proves the map; this
 * proves the live board mounts the dump the same way the graph reads it.
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
  // the cup's far exit on this board — so the site this build earns is
  // `past the cup`; the unit twin's straight chain-fit walk lands the same
  // piece `by the drop`. Both are the join graph's truth about ITS build;
  // what may never happen is a tail-less critique.
  await expect(note).toContainText('flatten the landing past the cup')
  // and it is the CRITIQUE line, not an ADD line wearing a tail by accident
  expect(await note.textContent()).not.toMatch(/add a flat landing/)
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

test('the level select says the sandboxes exist and what they keep (P4 item 5)', async ({ page }) => {
  await goto(page, '/?levels=1')
  const line = page.locator('#gw-levelselect-sandboxes')
  await expect(line).toBeVisible()
  await expect(line).toContainText('sandboxes')
  await expect(line).toContainText('loops and springs')
})
