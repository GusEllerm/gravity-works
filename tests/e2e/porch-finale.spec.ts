/**
 * THE FINALE'S BLOCKED RIMS (round 3 — the 2026-10-11 verdict's cheapest
 * point 1: porch05's last gap gets a blocked-rim moment; the k02 mouth-
 * refusal machinery now reads the rung's declared `blockedRims`).
 *
 * The e2e SAMPLES the order table (`scripts/porch05-order-table.mjs`,
 * swept exhaustively by `tests/unit/porch-guard.test.ts`) with real
 * clicks on the shipped builder:
 *
 *  1. the TRAY-BUTTON DUMP (gapLip, gapLip, drop, landing — the click
 *     order the verdict walked at 4/4) now dies at the rims: the drop and
 *     the landing are refused over the stoam, the refusal NAMES the
 *     obstacle, and the two pieces it leaves seated FALL;
 *  2. the NEW PLAYER'S CLEAR — the authored sink-first order
 *     (gapLip, landing, gapLip, drop) seats 4/4 with no refusal and
 *     FINISHES at ★★★, so the rim law never walls the rung;
 *  3. the authored catch-first order still seats 4/4 and finishes for
 *     TWO stars (1.392 over the 1.20 line) — the second authored line is
 *     a line, not a dump.
 */
import { test, expect, type Page } from '@playwright/test'
import { goto } from './goto.ts'

test.slow()

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

const place = (page: Page) => page.click('#gw-place')

const clickOrder = async (page: Page, kinds: string[]) => {
  for (const kind of kinds) {
    await page.click(`#gw-tray-${kind}`)
    await place(page)
  }
}

test.describe('porch05 — the declared rims (round 3)', () => {
  test('the tray dump meets the stoam: the final asks are refused, naming the obstacle, and the two pieces it leaves FALL', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.addInitScript(() => {
      for (const k of Object.keys(localStorage)) if (k.startsWith('gravity-works.')) localStorage.removeItem(k)
    })
    await goto(page, '/?level=porch05')
    await ready(page)

    // the tray-button dump: two lips seat (the pop is always legal)…
    await clickOrder(page, ['gapLip', 'gapLip'])
    await expect(page.locator('#gw-piece-count')).toHaveText('2 of 4 pieces used')

    // …and the crossing pieces die where they would bridge the stoam
    // FLAT: the drop's deck and the landing's tail overlap the declared
    // mouth lip, and the refusal names it plus the walk key.
    await page.click('#gw-tray-drop')
    await place(page)
    await expect(page.locator('#gw-ghost-state')).toHaveText(
      'blocked — the stoam is in the way · press ] to walk the open ends',
    )
    await page.click('#gw-tray-landing')
    await place(page)
    await expect(page.locator('#gw-ghost-state')).toContainText('blocked — the stoam is in the way')
    await expect(page.locator('#gw-piece-count')).toHaveText('2 of 4 pieces used')
    expect(errors).toEqual([])

    await page.click('#gw-launch')
    await expect(page.locator('#gw-status')).toContainText('fell off', { timeout: 60_000 })
  })

  test('the new player clears: the authored sink-first order seats 4/4 with NO refusal and finishes for three', async ({ page }) => {
    await page.addInitScript(() => {
      for (const k of Object.keys(localStorage)) if (k.startsWith('gravity-works.')) localStorage.removeItem(k)
    })
    await goto(page, '/?level=porch05')
    await ready(page)
    await clickOrder(page, ['gapLip', 'landing', 'gapLip', 'drop'])
    await expect(page.locator('#gw-piece-count')).toHaveText('4 of 4 pieces used')
    await page.click('#gw-launch')
    await expect(page.locator('#gw-status')).toContainText('finished', { timeout: 60_000 })
    await expect(page.locator('#gw-result-stars')).toHaveText('★★★')
    await expect(page.locator('#gw-result-pieces')).toContainText('4 pieces')
  })

  test('the catch-first authored order still seats everything and finishes for two — authored, slower, honest', async ({ page }) => {
    await page.addInitScript(() => {
      for (const k of Object.keys(localStorage)) if (k.startsWith('gravity-works.')) localStorage.removeItem(k)
    })
    await goto(page, '/?level=porch05')
    await ready(page)
    await clickOrder(page, ['gapLip', 'drop', 'gapLip', 'landing'])
    await expect(page.locator('#gw-piece-count')).toHaveText('4 of 4 pieces used')
    await page.click('#gw-launch')
    await expect(page.locator('#gw-status')).toContainText('finished', { timeout: 60_000 })
    await expect(page.locator('#gw-result-stars')).toHaveText('★★☆')
  })
})
