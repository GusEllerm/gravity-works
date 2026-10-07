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

test('builder: empty-handed R says what it did, once (playtest R\u2019s K4 wall)', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?level=feeltrack')
  await expect(page.locator('#gw-piece-count')).toBeVisible({ timeout: 30_000 })
  // nothing held: the line is silent before the first press
  await expect(page.locator('#gw-ghost-state')).toHaveText('')

  // The FIRST press that ARMS the reversal with nothing held states what
  // it did (playtest R: one stray R silently reversed every later mount —
  // with no ghost there was nothing to echo onto, so nothing said so).
  await page.click('#gw-rotate')
  await expect(page.locator('#gw-ghost-state')).toHaveText(
    'reversing \u2014 track runs backwards this way (press R unless you want a coaster)',
  )
  // flipping back is the silent half (the flag is off; nothing to teach)
  await page.click('#gw-rotate')
  await expect(page.locator('#gw-ghost-state')).toHaveText('')
  // a SECOND arm stays silent too — one-time line, retired for the session
  await page.click('#gw-rotate')
  await expect(page.locator('#gw-ghost-state')).toHaveText('')

  // and the line retires at the FIRST PLACE: the held reversed ghost
  // takes the line over with its own copy (the FLIP_WHY tail)
  await page.click('#gw-tray button[data-kind="straight"]')
  await page.click('#gw-place')
  await expect(page.locator('#gw-ghost-state')).not.toContainText('reversing')
  await expect(page.locator('#gw-ghost-state')).toContainText('flipped fit')

  expect(errors).toEqual([])
})

test('builder: remove is one spoken shot per click — round-trip, never silent (playtest Z round7)', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))

  // Z's finding: two Remove clicks "eaten" with the counter unmoved and the
  // mode "quietly off". Remove is ONE-SHOT per click, and every click now
  // SPEAKS — success names the piece, refusal names why. No silent drift.
  await page.goto('/?level=kitchen01')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
  await expect(page.locator('#gw-piece-count')).toHaveText('0 of 3 pieces used')

  // place one, then the round-trip back
  await page.click('#gw-tray-gapLip')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')

  await page.click('#gw-remove-piece')
  await expect(page.locator('#gw-piece-count')).toHaveText('0 of 3 pieces used')
  await expect(page.locator('#gw-ghost-state')).toHaveText('removed the lip')

  // the Z variant: a click with nothing left to remove says SO (only the
  // level's own fixture ramp remains) instead of vanishing into silence
  await page.click('#gw-remove-piece')
  await expect(page.locator('#gw-ghost-state')).toContainText('nothing to remove')
  await expect(page.locator('#gw-piece-count')).toHaveText('0 of 3 pieces used')

  // and the keyboard twin speaks the same line
  await page.keyboard.press('Delete')
  await expect(page.locator('#gw-ghost-state')).toContainText('nothing to remove')

  expect(errors).toEqual([])
})
