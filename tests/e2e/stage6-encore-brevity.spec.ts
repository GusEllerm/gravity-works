/**
 * Stage 6 — the ENCORE BREVITY TRIM, blind-cleared (playtest DD: "trim
 * garden05/garage05 toward porch-level brevity").
 *
 * The rung moved to the fail-timing chute (3.05 → 1.35 par; the Decision
 * Log names the hashes). The floor this pins is the k3-discoverability
 * one, applied to the trimmed double crossing: a FRESH session, NO
 * instructions, no hover, no build params — the boot ring plus the tray
 * is the whole conversation. The par line is four Places from the ramp's
 * chain head and ONE launch (the cap is six); the run must FINISH on the
 * porch clock.
 */
import { test, expect, type Page } from '@playwright/test'

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

for (const id of ['garden05', 'garage05'] as const) {
  test(`${id} clears blind on the porch clock: four blind Places, one launch`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto(`/?level=${id}`)
    await ready(page)

    // NO hover, NO advice: the boot ring sits on the head of the chain, and
    // every Place moves it to the end the placed piece just made. Four
    // placements — dip, plate, dip, catch — the trimmed par order a hand
    // reconstructs from the room's own 01–03 grammar.
    await page.click('#gw-tray-drop')
    await page.click('#gw-place')
    await page.click('#gw-tray-straight')
    await page.click('#gw-place')
    await page.click('#gw-tray-drop')
    await page.click('#gw-place')
    await page.click('#gw-tray-landing')
    await page.click('#gw-place')
    await expect(page.locator('#gw-piece-count')).toHaveText('4 of 6 pieces used')

    await page.click('#gw-launch')
    await expect(page.locator('#gw-status')).toContainText('finished', { timeout: 60_000 })
    await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
    expect(errors).toEqual([])
  })
}
