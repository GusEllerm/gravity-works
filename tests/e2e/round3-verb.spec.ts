/**
 * ROUND-3 ITEM 2 — the note finally speaks a verb a keyboard owns.
 *
 * The round-3 verdict's worst teacher-moment: k04's dump DIES at 2.66 s
 * under "flatten the landing by the lip or lower the lip by the drop" —
 * fix sentences the builder cannot execute, four evaluations running. The
 * recon sweep (`scripts/k04-flatten-sweep.mjs`) measured WHICH flattening
 * actually heals that death: NONE — no angle/height/level variant and no
 * flip of any seated piece finishes the 3-seat line; the death is the
 * chain minus the tray's `straight`, and seating that one piece finishes
 * at 2.59 s. So the note now names THAT keystroke — tray button + Place —
 * in the ADD+where wording the drive-off tail already speaks.
 *
 * The proof law of this item: a fresh player who obeys ONLY the k04 note
 * clears k04. Stage one builds the verdict's death (three seats, the
 * fourth ask left on the tray); stage two does nothing the note did not
 * say — click the kind it NAMES, press Place where it says the ring
 * already is — and launches. If the rung finishes with a star, the note
 * told the truth.
 */
import { expect, test } from '@playwright/test'
import { goto } from './goto.ts'

// CI-honesty budget, same law as `p4-words-where.spec.ts` / `campaign.spec.ts`.
test.slow()

const ready = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
}

test('k04: a fresh player following ONLY the note clears the 2.66 s death', async ({ page }) => {
  await goto(page, '/?level=kitchen04')
  await ready(page)
  // the verdict's dump as it actually seated: drop, gapLip and landing at
  // the chain head, the fourth ask still on the tray
  for (const kind of ['drop', 'gapLip', 'landing']) {
    await page.click(`#gw-tray-${kind}`)
    await page.click('#gw-place')
  }
  await expect(page.locator('#gw-piece-count')).toHaveText('3 of 4 pieces used')
  await page.click('#gw-launch')
  const status = page.locator('#gw-status')
  await expect(status).toContainText('fell', { timeout: 60_000 })
  const note = page.locator('#gw-result-note')
  await expect(note).toContainText('fell off nose-first')
  // THE VERB LAW: the line names a keystroke — the kind the tray still
  // holds and the end it goes on — and no verbless critique at all
  await expect(note).toContainText('add a straight')
  await expect(note).toContainText('place at:')
  expect(await note.textContent()).not.toMatch(/flatten|lower/i)

  // obey the note EXACTLY, with nothing else: hold the named kind, Place
  // at the ring the sentence points at (it still marks the chain head)
  await page.click('#gw-tray-straight')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('4 of 4 pieces used')
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  // cleared: at least one star minted on the note’s own words
  await expect(page.locator('#gw-result-stars')).toContainText('★')
})
