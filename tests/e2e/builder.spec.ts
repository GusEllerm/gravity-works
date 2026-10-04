import { test, expect } from '@playwright/test'

/**
 * The builder surface contract (stable selectors): #gw-tray with a button per
 * kit kind (data-kind), #gw-piece-count, #gw-ghost-state, #gw-place,
 * #gw-remove-piece. Hover shows the ghost; place/remove move the counter.
 */
test('builder: ghost appears on hover, place and remove move the piece counter', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Gravity Works' })).toBeVisible()
  await expect(page.getByRole('toolbar', { name: 'Piece tray' })).toBeVisible()
  await expect(page.locator('#gw-tray button')).toHaveCount(13)
  await expect(page.locator('#gw-piece-count')).toHaveText('8 / 16 pieces')
  await expect(page.locator('#gw-ghost-state')).toHaveText('hidden')

  // hover the straight in the tray -> a translucent ghost appears at the open socket
  await page.hover('#gw-tray button[data-kind="straight"]')
  await expect(page.locator('#gw-ghost-state')).not.toHaveText('hidden', { timeout: 10_000 })

  // click to hold, Enter-equivalent button to place -> counter increments
  await page.click('#gw-tray button[data-kind="straight"]')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('9 / 16 pieces')

  // the R button rotates the held piece into a reverse seat and back
  await page.click('#gw-rotate')
  await expect(page.locator('#gw-ghost-state')).toHaveText('seated')
  await page.click('#gw-rotate')
  await expect(page.locator('#gw-ghost-state')).toHaveText('snapped')

  // remove puts it back
  await page.click('#gw-remove-piece')
  await expect(page.locator('#gw-piece-count')).toHaveText('8 / 16 pieces')

  expect(errors).toEqual([])
})
