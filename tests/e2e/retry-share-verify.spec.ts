/**
 * THE SEATING LAW, end to end (the flow the Chain ships): beat-a-friend
 * links must verify. The repo previously had NO test crossing build ->
 * Retry -> launch -> share -> paste -> VERIFIED, and that exact gap let the
 * retry-law finding ship as a law (Decision Log 2026-10-12): `World.reset()`
 * re-seated the car with changed collider registration order, so the same
 * build ran 337 steps fresh vs 339 after any Retry — a share link minted
 * after a Retry FAILED ITS OWN REPLAY. This spec is that e2e, red before the
 * seating fix:
 *
 *   finish a run (fresh launch) -> Retry -> launch -> finish -> Share this
 *   run -> open the link in a fresh page -> the replay prints `verified`.
 *
 * Red-first receipts (pre-fix, port 4971): the share page prints
 * `mismatch` — the retry run's hash is not the replay's hash.
 */
import { test, expect, type Page } from '@playwright/test'
import { goto } from './goto.ts'

async function finishRun(page: Page): Promise<void> {
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
}

test('build -> Retry -> launch -> share -> paste: the link verifies its own replay', async ({ page, browser }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))

  // FRESH launch of the par build, run to the finish. NOT feeltrack: the
  // feel-track build provably converges even pre-fix (the seating unit test
  // shows it); kitchen01's par build is the one the retry law moves.
  await goto(page, '/?level=kitchen01&build=par&launch=1')
  await finishRun(page)

  // RETRY (the seating path), then launch again — the second live launch
  await page.click('#gw-result-retry')
  await expect(page.locator('#gw-result')).toBeHidden()
  await expect(page.locator('#gw-status')).toContainText('ready')
  await page.click('#gw-launch')
  await finishRun(page)

  // Share THIS run (the post-Retry run is the one whose hash goes on the wire)
  await page.click('#gw-result-share')
  await expect
    .poll(() => page.locator('#gw-result-share-url').inputValue(), { timeout: 15_000 })
    .toMatch(/#s=/)
  const shareUrl = await page.locator('#gw-result-share-url').inputValue()

  // Paste the link into a fresh page: the replay must VERIFY the retry run
  const pasted = await browser.newPage()
  try {
    await goto(pasted, shareUrl)
    await expect(pasted.locator('#gw-replay-status')).toHaveText('verified', { timeout: 90_000 })
    await expect(pasted.locator('#gw-replay-verdict')).toContainText('matches the link')
  } finally {
    await pasted.close()
  }

  expect(errors).toEqual([])
})
