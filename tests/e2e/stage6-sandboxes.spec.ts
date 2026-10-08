/**
 * Stage 6 — the sandbox promise, FINISHED (playtest Final Report "next" #3).
 *
 * The brief promised a no-budget sandbox per set; the kitchen shipped one
 * (`kitchen-sandbox`) and the other five rooms are closing that gap
 * (`bedroom-sandbox`, `bathroom-sandbox`, `garden-sandbox`,
 * `garage-sandbox`, `porch-sandbox` — each registered by its room's 05
 * file, mirroring the kitchen's semantics exactly: `sandbox: true`, budget
 * 999, the full stocked tray at ×99, and NONE of the campaign surface —
 * not on the ladder, nobody's Next, invisible to the level select,
 * `?level=`-addressable like every off-ladder rig.
 *
 * The gate a unit test cannot reach is the ROOM: each sandbox must actually
 * RENDER its set dressed (all furniture on, mounted under the lap the way
 * the rung rows mount it). One screenshot smoke per sandbox: the page
 * boots ready, the set reports mounted, the pixels land, zero errors.
 */
import { test, expect, type Page } from '@playwright/test'

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

function noErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  return errors
}

for (const set of ['bedroom', 'bathroom', 'garden', 'garage', 'porch'] as const) {
  test(`the ${set} sandbox boots ready, dressed, and screenshots clean`, async ({ page }, testInfo) => {
    const errors = noErrors(page)
    await page.goto(`/?level=${set}-sandbox`)
    await ready(page)
    // the set mounts UNDER the lap (the placement rows are live, not null)
    await expect(page.locator('#gw-stage')).toHaveAttribute('data-set-mounted', set, {
      timeout: 60_000,
    })
    // off-ladder rigs wear NO dev-preview badge (boot's unlock read)
    await expect(page.locator('#gw-dev-preview')).toHaveCount(0)
    const shot = await page.screenshot()
    expect(shot.byteLength).toBeGreaterThan(1000)
    await testInfo.attach(`${set}-sandbox`, { body: shot, contentType: 'image/png' })
    expect(errors).toEqual([])
  })

  test(`the ${set} sandbox is campaign-invisible on the level select, like the kitchen one`, async ({ page }) => {
    await page.goto('/?levels=1')
    // the ladder shows its 30 rungs and NO sandbox button anywhere — the
    // kitchen sandbox's discoverability (exactly) is the reference
    await expect(page.locator(`#gw-level-${set}-sandbox`)).toHaveCount(0)
    await expect(page.locator('#gw-level-kitchen-sandbox')).toHaveCount(0)
    await expect(page.locator('#gw-level-porch05')).toBeVisible()
  })
}
