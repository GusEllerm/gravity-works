/**
 * THE CHAIN, MADE REAL (freeplay program Lane C — Decision Log 2026-10-12
 * "THE CHAIN law greenlit", proof list: seed thirty playable, named-line
 * publish, beat-a-friend verdict row). Three claims on the shipped page:
 *
 *  1. THE LINES TAB — level select gains a second tab: the thirty seeded
 *     links ("published by the house", one click) above the device's
 *     chain walk; a house row lands on the board with the house line's
 *     ghost on the grid.
 *  2. THE BEAT-A-FRIEND VERDICT ROW — racing a link ghost prints `you vs
 *     <name>’s par` against the LINK's OWN par; the re-probe's wrong-game
 *     `you vs par` cannot print while a link is on the grid (the pure
 *     law is unit-proved in tests/unit/chain.test.ts; here it is the
 *     real bar).
 *  3. NAMED-LINE PUBLISH — a named sandbox run shares a v2 payload
 *     (name + par + goal ride), the share press enters the device's
 *     chain, the LINES tab lists it, and ONE CLICK on that row races
 *     the link — the challenge half the re-probe named as missing.
 */
import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'

test('LINES tab: the thirty house rows list, and a click lands on the board with the house line armed', async ({ page }) => {
  await goto(page, '/?levels=1')
  await page.click('#gw-tab-lines')
  await expect(page.locator('#gw-panel-lines')).toBeVisible()
  // the seed is NEVER empty: all thirty authored pars, one click each
  await expect(page.locator('#gw-lines-house .gw-line')).toHaveCount(30)
  const first = (await page.locator('#gw-lines-house .gw-line').first().textContent()) ?? ''
  expect(first).toContain('published by the house')
  expect(first).toMatch(/par \d+\.\d\d s/)
  // the rank sentence is a device-walk count, honesty clause inside
  await expect(page.locator('#gw-lines-rank')).toContainText('this device only')
  // one click → that board, house line winding
  await page.click('#gw-line-kitchen01')
  await expect(page).toHaveURL(/level=kitchen01/)
  await expect(page.locator('#gw-ghost-note')).toContainText('the house line is on the grid', { timeout: 30_000 })
  await expect
    .poll(async () => (await page.evaluate(() => (window as any).__gwGhostState?.()?.mode ?? 'none')), { timeout: 30_000 })
    .toBe('friend')
})

test('the house-line verdict row: you vs <name>’s par, the link’s OWN par — never the wrong game', async ({ page }) => {
  await goto(page, '/?level=kitchen01&line=house&build=par&launch=1')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  const row = page.locator('#gw-result-vspar')
  await expect(row).toBeVisible()
  const text = (await row.textContent()) ?? ''
  expect(text).toContain('’s par —')
  expect(text).toContain('vs their par')
  // THE IMPOSSIBILITY: while a link was raced, the plain par row is gone
  expect(text).not.toMatch(/^you vs par —/)
})

test('named-line publish → v2 payload → chain row → one click races it with the named verdict', async ({ page }) => {
  test.slow()
  // — the line is minted the Lane B way: cup down, finish, name it
  await goto(page, '/?level=kitchen-sandbox')
  await expect(page.locator('#gw-tray')).toBeVisible()
  for (let i = 0; i < 5; i++) {
    await page.click('#gw-tray button[data-kind="straight"]')
    await page.click('#gw-place')
  }
  await page.click('#gw-tray button[data-kind="finishCup"]')
  await page.click('#gw-place')
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-result-name-chip')).toHaveText('name this line')
  await page.fill('#gw-result-name-input', 'the spillway')
  await page.click('#gw-result-name-save')

  // — SHARE PUBLISH: the link the button mints is a v2 payload carrying
  // the line's NAME, the author's MEASURED par and the cup-goal, and the
  // share press enters the device's chain (settings.records.chain).
  await page.click('#gw-result-share')
  await expect(page.locator('#gw-result-share-url')).not.toHaveValue('', { timeout: 15_000 })
  const chain = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}')
    return raw.settings?.records?.chain ?? null
  }) as { levelId: string; hash: string; name?: string; par?: number; goal?: number[] }[]
  expect(Array.isArray(chain)).toBe(true)
  expect(chain).toHaveLength(1)
  expect(chain[0]!.name).toBe('the spillway')
  expect(chain[0]!.par).toBeGreaterThan(0) // the gen-pars rule over THEIR run
  expect(chain[0]!.levelId).toBe('kitchen-sandbox')

  // decode the minted token HERE (Node side): the wire bytes are v2 with
  // the challenge half the re-probe found missing
  const url = await page.locator('#gw-result-share-url').inputValue()
  const { parseShareUrl } = await import('../../src/share/share.ts')
  const decoded = await parseShareUrl(url)
  expect(decoded.v).toBe(2)
  expect(decoded.name).toBe('the spillway')
  expect(decoded.par).toBeGreaterThan(0)
  expect(decoded.hash).toBe(chain[0]!.hash)

  // — THE LINES TAB lists the chain row (payloads only, this device only)
  await goto(page, '/?levels=1')
  await page.click('#gw-tab-lines')
  const row = page.locator(`#gw-line-link-${chain[0]!.hash}`)
  await expect(row).toBeVisible()
  await expect(row).toContainText('“the spillway”')
  await expect(page.locator('#gw-lines-rank')).toContainText('1 link walked on this device')

  // — ONE CLICK: the link's ghost on the grid; launching races THEIR
  // build, and the verdict row reads THEIR par — the 2.80-vs-2.80 tie of
  // the re-probe now lands as a named verdict, not `you vs par`.
  await row.click()
  await expect(page).toHaveURL(/level=kitchen-sandbox/)
  await expect
    .poll(async () => (await page.evaluate(() => (window as any).__gwGhostState?.()?.mode ?? 'none')), { timeout: 30_000 })
    .toBe('friend')
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  const verdict = (await page.locator('#gw-result-vspar').textContent()) ?? ''
  expect(verdict).toContain('you vs “the spillway”’s par')
  expect(verdict).not.toMatch(/^you vs par —/)
})
