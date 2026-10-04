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
  await expect(page.locator('#gw-piece-count')).toHaveText(`${laid} / ${budget} pieces`)
  await expect(page.locator('#gw-ghost-state')).toHaveText('hidden')

  // hover the straight in the tray -> a translucent ghost appears at the open socket
  await page.hover('#gw-tray button[data-kind="straight"]')
  await expect(page.locator('#gw-ghost-state')).not.toHaveText('hidden', { timeout: 10_000 })

  // click to hold, Enter-equivalent button to place -> counter increments
  await page.click('#gw-tray button[data-kind="straight"]')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText(`${laid + 1} / ${budget} pieces`)

  // the R button rotates the held piece into a reverse seat and back
  await page.click('#gw-rotate')
  await expect(page.locator('#gw-ghost-state')).toHaveText('seated')
  await page.click('#gw-rotate')
  await expect(page.locator('#gw-ghost-state')).toHaveText('snapped')

  // remove puts it back
  await page.click('#gw-remove-piece')
  await expect(page.locator('#gw-piece-count')).toHaveText(`${laid} / ${budget} pieces`)

  expect(errors).toEqual([])
})
