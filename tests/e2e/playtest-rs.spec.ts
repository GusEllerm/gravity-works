import { test, expect } from '@playwright/test'
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts'

/**
 * Playtests R+S round-3 shell fixes (stage 4, Systems Engineer):
 *
 * 1. NOTHING blocks the toolbar while the result panel is open (R: "Remove
 *    clicks died behind the result card" — she replayed identical builds
 *    unknowingly). The panel root is pointer-transparent and its buttons are
 *    hittable THROUGH the open panel; Remove works behind it, dismisses
 *    it, and refreshes BOTH count lines (the panel-open variant of item 4);
 *    and no element on the page intercepts a toolbar hit.
 * 2. A reload preserves the WORKING build (S: reload "silently wiped my
 *    in-progress build") — and starts fresh exactly where the save rules say
 *    fresh (?build=par recorded addressing).
 * 3. Target labels name the THING plainly: "where the car starts", "cup on
 *    the table" — no internal words ("level start", "end of cup", "the set")
 *    on any player line.
 * 4. After Remove the piece counts agree EVERYWHERE: the idle status line and
 *    the builder tally are one source, asserted identical mid-session.
 * 5. Par is defined where it first appears (both: "unexplained par times").
 */

const ready = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 30_000 })
}

test('the open result panel blocks NOTHING: tray selects and Remove works behind it (R)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen01')
  await ready(page)

  // build one piece and launch it into a terminal status: the panel is up
  await page.click('#gw-tray-gapLip')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })

  // the R situation: she had been SCROLLING to look at the world, and the
  // blind click where Remove used to be fell on the canvas THROUGH the
  // transparent panel. With the page scrolled and the panel up, the sticky
  // toolbar is still on screen and still the thing under the cursor.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))

  // the parent-wrapper audit: the topmost element at the toolbar's own
  // buttons IS the button — the panel, its wrapper (#gw-stage), or anything
  // else mounted in the stage never covers the toolbar or the tray while it
  // is open, scrolled or not
  const covering = await page.evaluate(() => {
    const bad: string[] = []
    for (const sel of ['#gw-remove-piece', '#gw-tray-gapLip', '#gw-launch', '#gw-reset']) {
      const el = document.querySelector(sel)!
      const r = el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > innerHeight) {
        bad.push(`${sel} off-screen (top=${Math.round(r.top)}/${innerHeight})`)
        continue
      }
      const top = document.elementFromPoint(r.left + r.width / 2, Math.min(r.top + r.height / 2, innerHeight - 1))
      if (top !== el && !el.contains(top ?? null)) bad.push(`${sel} covered by ${top?.id || top?.tagName}`)
    }
    return bad
  })
  expect(covering).toEqual([])

  // a tray click works WHILE the panel is open (no force: an intercept would
  // fail the actionability check itself) and selects the kind
  await page.click('#gw-tray-landing')
  await expect(page.locator('#gw-tray-landing')).toHaveAttribute('aria-pressed', 'true')

  // Remove works BEHIND the panel: the piece goes and the edit dismisses the
  // panel (an edited build invalidates the last result)
  await page.click('#gw-remove-piece')
  await expect(page.locator('#gw-piece-count')).toHaveText('0 of 3 pieces used')
  await expect(page.locator('#gw-result')).toBeHidden()

  // The PANEL-OPEN variant of S's counter check: the Remove that succeeds
  // behind the card must refresh BOTH count lines, not just the builder
  // tally — the idle line returns to the SAME tally the tally already
  // shows (S's "4 of 5 vs 3 of 5" wearing the panel-open shape).
  await expect(page.locator('#gw-status')).toHaveText('ready — 0 of 3 pieces used')

  expect(errors).toEqual([])
})

test('reload preserves the working build, and stays fresh where the save says fresh (S)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen01')
  await ready(page)
  await expect(page.locator('#gw-piece-count')).toHaveText('0 of 3 pieces used')

  await page.click('#gw-tray-gapLip')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')

  // the reload S did: the in-progress build is where she left it
  await page.reload()
  await ready(page)
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')
  await expect(page.locator('#gw-status')).toHaveText('ready — 1 of 3 pieces used')

  // …and the fresh direction: ?build=par is recorded addressing, a test rig,
  // and re-mounts the reference build whatever the autosave holds
  await page.goto('/?level=kitchen01&build=par')
  await ready(page)
  await expect(page.locator('#gw-piece-count')).toHaveText(
    `${KITCHEN01.parBuild().pieces.filter((p) => p.def !== 'ramp' && p.def !== 'finishCup').length} of 3 pieces used`,
  )

  expect(errors).toEqual([])
})

test('after Remove both count lines are ONE source — identical everywhere (S)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen01')
  await ready(page)

  const tally = async (): Promise<string[]> =>
    page.evaluate(() => [
      document.querySelector('#gw-status')!.textContent!,
      document.querySelector('#gw-piece-count')!.textContent!,
    ])

  // place two, remove one: the idle line and the builder tally must say the
  // SAME numbers in the SAME words — S's "ready — 4 of 5 vs header 3 of 5"
  // was one number wearing two places
  await page.click('#gw-tray-gapLip')
  await page.click('#gw-place')
  await page.click('#gw-tray-drop')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('2 of 3 pieces used')
  await page.click('#gw-remove-piece')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')
  const [status, count] = await tally()
  expect(status).toBe('ready — 1 of 3 pieces used')
  expect(count).toBe('1 of 3 pieces used')

  expect(errors).toEqual([])
})

test('target labels name the thing, never the internals (R+S)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  // kitchen01: the cup's open exit is the CUP they can see, not "end of cup"
  await page.goto('/?level=kitchen01')
  await ready(page)
  await expect(page.locator('#gw-target-label')).toHaveText('target: end of ramp')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#gw-target-label')).toHaveText('target: cup on the table')

  // kitchen04: the bare release-point socket says what it is, not "level start"
  await page.goto('/?level=kitchen04')
  await ready(page)
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('#gw-target-label')).toHaveText('target: where the car starts')

  // no internal word on any spoken line of the idle page
  const speak = await page.evaluate(() =>
    ['#gw-status', '#gw-piece-count', '#gw-ghost-state', '#gw-target-label', '#gw-callout', '#gw-tray-hint']
      .map((s) => document.querySelector(s)!.textContent ?? '')
      .join('\n'),
  )
  expect(speak).not.toMatch(/\bthe set\b|level start/i)

  expect(errors).toEqual([])
})

test('par is defined where it first appears (R+S)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?levels=1')
  await expect(page.locator('.gw-level-rules').first()).toContainText(
    'par = the target time for this run',
  )
  expect(errors).toEqual([])
})
