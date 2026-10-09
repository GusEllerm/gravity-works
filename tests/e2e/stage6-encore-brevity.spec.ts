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
import { goto } from './goto.ts'

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

for (const id of ['garden05', 'garage05'] as const) {
  test(`${id} clears blind on the porch clock: four blind Places, one launch`, async ({ page }) => {
    // THE CI BUDGET (the sibling lesson — campaign/the k3 note's specs run
    // slow() for exactly this): a blind-clear is boot + four Places + a full
    // real-time run, and CI's SwiftShader stretches every actionability
    // round-trip; the bare 30 s budget died mid-`click('#gw-place')` with
    // the 60 s waits inside assertions never able to spend it. slow() gives
    // those waits a real budget; the per-Place piece-count waits below are
    // the EVENT each click owes, not a sleep — the sequence can no longer
    // drift out of step with the page.
    test.slow()
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))

    await goto(page, `/?level=${id}`)
    await ready(page)

    // NO hover, NO advice: the boot ring sits on the head of the chain, and
    // every Place moves it to the end the placed piece just made. Four
    // placements — dip, plate, dip, catch — the trimmed par order a hand
    // reconstructs from the room's own 01–03 grammar. Each Place is
    // ANSWERED by the count it moved (event-driven, per placement).
    const placed = (n: number) =>
      expect(page.locator('#gw-piece-count')).toHaveText(`${n} of 6 pieces used`)
    await page.click('#gw-tray-drop')
    await page.click('#gw-place')
    await placed(1)
    await page.click('#gw-tray-straight')
    await page.click('#gw-place')
    await placed(2)
    await page.click('#gw-tray-drop')
    await page.click('#gw-place')
    await placed(3)
    await page.click('#gw-tray-landing')
    await page.click('#gw-place')
    await placed(4)

    await page.click('#gw-launch')
    await expect(page.locator('#gw-status')).toContainText('finished', { timeout: 60_000 })
    await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
    expect(errors).toEqual([])
  })
}
