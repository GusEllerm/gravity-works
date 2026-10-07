import { test, expect } from '@playwright/test'
import { FEEL_TRACK_KINDS } from '../../src/feel/feeltrack.ts'
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts'

/**
 * The builder surface contract (stable selectors): #gw-tray with a button per
 * kit kind (data-kind), #gw-piece-count, #gw-ghost-state, #gw-place,
 * #gw-remove-piece. Hover shows the ghost; place/remove move the counter.
 *
 * The piece counters are DERIVED from the level data (the feel chain's piece
 * count and the level budget), never hand-mirrored — when the feel engineer
 * adds a piece to `FEEL_TRACK_KINDS` this spec follows automatically (the
 * stage-2 review's blocker: a hardcoded 8/16 went stale at 9 pieces).
 */
const laid = FEEL_TRACK_KINDS.length
const budget = FEELTRACK.budget
test('builder: ghost appears on hover, place and remove move the piece counter', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?level=feeltrack')
  await expect(page.getByRole('heading', { name: 'Gravity Works' })).toBeVisible()
  await expect(page.getByRole('toolbar', { name: 'Piece tray' })).toBeVisible()
  await expect(page.locator('#gw-tray button')).toHaveCount(13)
  await expect(page.locator('#gw-piece-count')).toHaveText(`${laid} of ${budget} pieces used`)
  // the ghost-state line reads EMPTY when nothing is held — the literal
  // word "hidden" never reaches the screen
  await expect(page.locator('#gw-ghost-state')).toHaveText('')

  // hover the straight in the tray -> a translucent ghost appears at the open socket
  await page.hover('#gw-tray button[data-kind="straight"]')
  await expect(page.locator('#gw-ghost-state')).not.toHaveText('', { timeout: 10_000 })

  // click to hold, Enter-equivalent button to place -> counter increments
  await page.click('#gw-tray button[data-kind="straight"]')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText(`${laid + 1} of ${budget} pieces used`)

  // the R button flips the fit into a reverse seat and back — the VERB
  // TABLE's copy ("seated"/"snapped" never reach the screen; playtest E),
  // and since playtest M each press also echoes a passive "rotated" tail.
  // The FIRST reversed result of the session additionally carries the
  // once-per-session WHY tail (playtest Q item 5: "flipped fit" vs "fits
  // here" was uninterpretable; the tail is honest about the ride AND the
  // reversibility). Subsequent flips say just the verb.
  await page.click('#gw-rotate')
  await expect(page.locator('#gw-ghost-state')).toHaveText(
    'flipped fit · rotated — it rides backwards; fine for a coaster, not for a launch (press R again to flip back)',
  )
  await page.click('#gw-rotate')
  await expect(page.locator('#gw-ghost-state')).toHaveText('fits here · rotated')

  // remove puts it back
  await page.click('#gw-remove-piece')
  await expect(page.locator('#gw-piece-count')).toHaveText(`${laid} of ${budget} pieces used`)

  expect(errors).toEqual([])
})
