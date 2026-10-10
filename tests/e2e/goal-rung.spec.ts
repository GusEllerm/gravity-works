/**
 * THE BLOCKED-RIM RUNG (P4 shortlist item 1 — the 2026-10-10 player
 * evaluation's UNFIXED item: "kitchen02 — the dump STILL finishes (union of
 * both lines, every order) … the 'choice' is still a formality").
 *
 * kitchen02 declares `blockedGoalSeat`: the cup's own body refuses any seat
 * across its mouth (`goalGuardFor` in `src/ui/builder.ts`), and by the
 * level's own reach-sum law the whole-tray union's 4th ask lands there in
 * EVERY order. In-game the union dump is no longer a build — the last piece
 * is refused where the dump aims it (the chain head), and the trio the dump
 * left seated falls in the void. The two AUTHORED lines (3 of 4 pieces)
 * seat and finish exactly as the level file says.
 */
import { test, expect, type Page } from '@playwright/test'
import { goto } from './goto.ts'

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

const place = (page: Page) => page.click('#gw-place')

test.describe('kitchen02: the union dump cannot be built (P4 item 1)', () => {
  test('the dump seats three and the fourth ask is refused — naming the cup', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await goto(page, '/?level=kitchen02')
    await ready(page)

    // the tray dump: hold each piece, press Place, let the ring walk the
    // chain — straight, straight, gapLip seat exactly as they always did…
    for (const kind of ['straight', 'straight', 'gapLip']) {
      await page.click(`#gw-tray-${kind}`)
      await place(page)
    }
    await expect(page.locator('#gw-piece-count')).toHaveText('3 of 4 pieces used')

    // …and the fourth ask of the union dies at the rim, WHEREVER the order:
    // the drop's tail deck reaches INTO the cup, the refusal names the cup
    // and points at the verb table's own walk key.
    await page.click('#gw-tray-drop')
    await place(page)
    await expect(page.locator('#gw-ghost-state')).toHaveText(
      'blocked — the cup is in the way · press ] to walk the open ends',
    )
    await expect(page.locator('#gw-piece-count')).toHaveText('3 of 4 pieces used')
    expect(errors).toEqual([])
  })

  test('the trio the dump left seated FALLS — the union line can die', async ({ page }) => {
    await goto(page, '/?level=kitchen02')
    await ready(page)
    for (const kind of ['straight', 'straight', 'gapLip']) {
      await page.click(`#gw-tray-${kind}`)
      await place(page)
    }
    await page.click('#gw-launch')
    await expect(page.locator('#gw-status')).toContainText('fell off', { timeout: 60_000 })
  })

  test('both authored lines still seat everything and finish', async ({ page }) => {
    // Start each line from an EMPTY board: a same-rung revisit RELOADS the
    // autosaved working build (playtest S's honest reload), which would
    // hand the arc a spent drop. The save keys go away BEFORE every
    // document load of this test (an evaluate-after-navigation would be
    // too late, and about:blank denies localStorage access).
    await page.addInitScript(() => {
      for (const k of Object.keys(localStorage)) if (k.startsWith('gravity-works.')) localStorage.removeItem(k)
    })
    for (const line of [
      ['straight', 'drop', 'straight'], // the lazy par
      ['gapLip', 'drop', 'straight'], // the arc
    ]) {
      await goto(page, '/?level=kitchen02')
      await ready(page)
      for (const kind of line) {
        await page.click(`#gw-tray-${kind}`)
        await place(page)
      }
      await expect(page.locator('#gw-piece-count')).toHaveText('3 of 4 pieces used')
      await page.click('#gw-launch')
      await expect(page.locator('#gw-status')).toContainText('finished', { timeout: 60_000 })
    }
  })

  test('a guarded rung flags every open end past the goal, not just the goal\u2019s own', async ({ page }) => {
    await goto(page, '/?level=kitchen02')
    await ready(page)
    await page.click('#gw-tray-straight')
    await page.locator('#gw-builder').press('ArrowRight') // past the rim: the fixture run-out's open end
    await expect(page.locator('#gw-ghost-state')).toContainText(
      'the run ends at the cup, so nothing past it is ever travelled',
    )
  })
})
