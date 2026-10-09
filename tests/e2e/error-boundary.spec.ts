import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'

/**
 * THE ERROR BOUNDARY (program T0.4, evaluation R2/R3): an unexpected error
 * anywhere lands on ONE honest overlay, never a frozen canvas or a
 * half-page. Two faces of the same law:
 *
 * 1. A THROWN EXCEPTION mid-run (injected through `addInitScript` on a
 *    deferred timer, so it fires while the page is live and the boundary
 *    is installed) must show `#gw-error` with the Reload affordance and
 *    FREEZE the frame loop honestly — the status line must stop advancing
 *    under the overlay, not stay stuck ticking on a dead canvas.
 * 2. A REJECTED SET-CHUNK IMPORT at boot (the flaky-CDN shape: the kitchen
 *    geometry module 4xx/aborts) must show the SAME face with Retry —
 *    never the half-page of an h1 over an empty stage — and Retry after
 *    the block lifts must land on a live game page.
 */

test('a thrown exception lands on the honest overlay, not a frozen canvas', async ({ page }) => {
  // deferred throw: fires at +1.5 s, while the boundary listener is live
  await page.addInitScript(() => {
    window.setTimeout(() => {
      throw new Error('injected boundary probe')
    }, 1500)
  })
  // ?launch=1 so a run is PLAYING at the injection: the pre-fix truth was a
  // frozen canvas with this line stuck at "running — t" and nothing to click
  await goto(page, '/?level=kitchen01&launch=1')
  await expect(page.locator('#gw-status')).toContainText('running', { timeout: 30_000 })

  const overlay = page.locator('#gw-error')
  await expect(overlay).toBeVisible({ timeout: 15_000 })
  await expect(overlay).toHaveAttribute('role', 'alert')
  await expect(page.locator('#gw-error-reload')).toBeVisible()

  // FROZEN HONESTLY: the loop stops under the overlay — the same status
  // text twice across a gap (a stuttering world would keep advancing the
  // clock between rethrows)
  const first = await page.locator('#gw-status').textContent()
  await page.waitForTimeout(700)
  expect(await page.locator('#gw-status').textContent()).toBe(first)
})

test('a rejected set-chunk import shows the same face with Retry, never a half-page', async ({ page }) => {
  // the kitchen geometry rides its own lazy chunk (the stage-4 payload fix);
  // killing that fetch is the flaky-CDN shape of evaluation R3
  const blocked = '**/assets/kitchen-*.js'
  await page.route(blocked, (route) => route.abort())
  await goto(page, '/?level=kitchen01')

  // the face goes up (not the pre-fix half-page: an h1 and a warm canvas
  // with no builder and no message)
  await expect(page.locator('#gw-error')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('#gw-error-retry')).toBeVisible()
  await expect(page.locator('#gw-builder')).toHaveCount(0) // no half-boot

  // Retry re-enters the document (a failed chunk fetch is cached in the
  // module map — an in-page re-import could only reject again); with the
  // block lifted that lands on a LIVE game page, not the same face.
  await page.unroute(blocked)
  await page.locator('#gw-error-retry').click()
  await expect(page.locator('#gw-builder')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('#gw-error')).toHaveCount(0)
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 30_000 })
})
