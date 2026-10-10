/**
 * THE FAREWELL end to end (program T3.3, PAIRED with the doors): clearing
 * porch05 for the first time REPLACES the result bar with one crane pass
 * over all six sets in campaign order carrying the player's own star
 * tally, then three doors, one click each — sandbox, daily, share. The
 * law lives in `src/pages/farewell.ts`; this file is its gate.
 *
 * The crane is cinematic, so this spec rides `?farewell=1` (the same
 * URL-affordance family as `?intro=1`) — and the ordinary suite can never
 * be ambushed by it, because `tests/e2e/goto.ts` appends `?farewell=off`
 * for every non-visual rider. The clear itself is the shipped machinery:
 * a seeded save unlocks porch05 (previous rung's star), `?build=par` +
 * `?launch=1` runs the rung's own line, and the mint is `recordStars`
 * earning it — no param forges the ending any more than it forges a star.
 */
import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'

/** Merge-not-wipe star seeding (the campaign.spec idiom): the init script
 *  re-runs on every navigation, so the stars the runs EARN must survive
 *  the seeds. porch04's star opens porch05: the clear is EARNED, not a
 *  dev preview. */
function seedStars(stars: Record<string, number>): string {
  return `
    let save = {}
    try { save = JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}') } catch { save = {} }
    const progress = save.progress ?? {}
    progress.stars = { ...(${JSON.stringify(stars)}), ...(progress.stars ?? {}) }
    progress.reached = progress.reached ?? {}
    save.progress = progress
    save.v = save.v ?? 2
    save.builds = save.builds ?? {}
    save.settings = save.settings ?? {}
    localStorage.setItem('gravity-works.save', JSON.stringify(save))
  `
}

const unlockPorch05 = (page: import('@playwright/test').Page) =>
  page.addInitScript(seedStars({ porch04: 3 }))

/** LINE LATCH (the CI-red fix, program P4 filmcar): a crane reveal line
 *  lives ~0.6 s of PLAN time, and a starved CI can land the whole crane
 *  between two DOM polls — so the reveal-order law cannot be read off a
 *  textContent snapshot. This init script latches EVERY mutation of
 *  `#gw-farewell-line` into `__gwFarewellLineLog`; the spec asserts on
 *  that ledger, which cannot miss a frame the page really showed. */
const latchFarewellLine = (page: import('@playwright/test').Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __gwFarewellLineLog?: string[] }
    w.__gwFarewellLineLog = []
    const log = (el: Element) => w.__gwFarewellLineLog!.push(el.textContent ?? '')
    let target: Element | null = null
    const observer = new MutationObserver(() => {
      if (target) log(target)
    })
    const timer = window.setInterval(() => {
      const el = document.querySelector('#gw-farewell-line')
      if (!el) return
      clearInterval(timer)
      target = el
      observer.observe(el, { childList: true, characterData: true, subtree: true })
      log(el)
    }, 25)
  })

const lineLog = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __gwFarewellLineLog?: string[] }).__gwFarewellLineLog ?? [])

/** Clear porch05 on its par line with the farewell FORCED (the cinematic
 *  family's own-spec door) and wait until the page owns the stage. */
const clearPorch05 = async (page: import('@playwright/test').Page): Promise<void> => {
  await unlockPorch05(page)
  await goto(page, '/?level=porch05&build=par&launch=1&farewell=1')
  await expect(page.locator('#gw-farewell')).toBeVisible({ timeout: 60_000 })
}

/** Skip straight to the doors (a crane skipped is still an honest "seen" —
 *  the flag was set at the fire, not at the finish). */
const toDoors = async (page: import('@playwright/test').Page): Promise<void> => {
  await clearPorch05(page)
  await page.keyboard.press('Space')
  await expect(page.locator('#gw-farewell-doors')).toBeVisible({ timeout: 10_000 })
}

test('the first porch05 clear replaces the result bar with the crane pass', async ({ page }) => {
  test.setTimeout(180_000)
  await unlockPorch05(page)
  await latchFarewellLine(page)
  await goto(page, '/?level=porch05&build=par&launch=1&farewell=1')
  // the page owns the stage INSTEAD of the bar: the result panel never
  // renders at this edge, and the builder chrome is hidden with it
  await expect(page.locator('#gw-farewell')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-result')).toBeHidden()
  await expect(page.locator('#gw-builder-host')).toBeHidden()
  // THE FAREWELL LEAK, CURED (player final 2026-10-10 §7, program P4):
  // every page-corner chip — the sound chip, the save row, the ghost
  // strip — wears the one honest `hidden` sweep (`src/pages/farewell.ts`
  // + the chip `[hidden]` rule in `shell.css`); nothing chrome-like may
  // render through the ending any more.
  for (const id of ['gw-sound', 'gw-save', 'gw-ghost-bar']) {
    await expect(page.locator(`#${id}`)).toHaveJSProperty('hidden', true)
    await expect(page.locator(`#${id}`)).toBeHidden()
  }
  // the pass is event-driven: the rooms are revealed IN CAMPAIGN ORDER,
  // Kitchen first and Porch last, as the eye arrives at each — read from
  // the mutation latch, not a live snapshot (a reveal line is ~0.6 s of
  // plan time and a starved CI can end the crane between two polls; the
  // ledger cannot miss a line the page actually showed)
  await expect
    .poll(
      async () => {
        const ls = await lineLog(page)
        const k = ls.findIndex((l) => /^Kitchen — \d+ \/ 15 stars$/.test(l))
        const p = ls.findIndex((l) => /^Porch — \d+ \/ 15 stars$/.test(l))
        return k >= 0 && p >= 0 && k < p
      },
      { timeout: 30_000, message: 'the reveal ledger never showed Kitchen before Porch' },
    )
    .toBe(true)
  // the whole-house tally lands with the pull-back, and the doors open
  await expect(page.locator('#gw-farewell-doors')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('#gw-farewell-summary')).toBeVisible()
  await expect(page.locator('#gw-farewell-rooms .gw-farewell-room')).toHaveCount(6)
  await expect(page.locator('#gw-farewell-total')).toContainText('30 rungs walked')
  // the run still MINTS like any clear (the farewell replaces the panel,
  // not the star): porch05 carries its earned stars in the tally table
  await expect(page.locator('#gw-farewell-rooms .gw-farewell-room').nth(5)).toContainText(/\d+ \/ 15/)
  const state = await page.evaluate(() => (window as any).__gwFarewellState?.())
  // the seen flag is a UI fact outside the save schema, set at the FIRE
  expect(await page.evaluate(() => localStorage.getItem('gravity-works.farewell.seen'))).toBe('1')
  void state
})

test('a key skips the crane and the doors land whole (still an honest seen)', async ({ page }) => {
  test.setTimeout(120_000)
  await toDoors(page)
  // the skip shows the WHOLE tally at once — the summary is never a tease
  await expect(page.locator('#gw-farewell-summary')).toBeVisible()
  await expect(page.locator('#gw-farewell-line')).toContainText('Kitchen')
  await expect(page.locator('#gw-farewell-line')).toContainText('Porch')
  // and the ending is spent: a second clear (no forcing) lands the bar
  await goto(page, '/?level=porch05&build=par&launch=1&farewell=0')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-farewell')).toHaveCount(0)
})

test('door one: the sandbox — one click, the porch sandbox page', async ({ page }) => {
  test.setTimeout(120_000)
  await toDoors(page)
  await page.click('#gw-farewell-sandbox')
  await expect(page).toHaveURL(/level=porch-sandbox/)
  await expect(page.locator('#gw-launch')).toBeVisible({ timeout: 60_000 })
})

test('door two: the daily — one click, today’s daily run', async ({ page }) => {
  test.setTimeout(120_000)
  await toDoors(page)
  await page.click('#gw-farewell-daily')
  await expect(page).toHaveURL(/daily=1/)
  await expect(page).toHaveURL(/level=porch05/)
  await expect(page.locator('#gw-launch')).toBeVisible({ timeout: 60_000 })
})

test('door three: the film — one click, the porch05 run replays and verifies', async ({ page }) => {
  test.setTimeout(180_000)
  await toDoors(page)
  await page.click('#gw-farewell-share')
  await expect(page).toHaveURL(/#s=/, { timeout: 30_000 })
  // the share page IS the film: it opens playing and verdicts honestly
  await expect(page.locator('#gw-replay-title')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-replay-status')).toContainText('verified', { timeout: 90_000 })
})

test('a second clear (flag set, no forcing) is the ordinary result bar', async ({ page }) => {
  test.setTimeout(120_000)
  await page.addInitScript(seedStars({ porch04: 3 }))
  await page.addInitScript(() => localStorage.setItem('gravity-works.farewell.seen', '1'))
  await goto(page, '/?level=porch05&build=par&launch=1&farewell=0')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-farewell')).toHaveCount(0)
})

test('reduced motion gets the STATIC SUMMARY PAGE instead of the crane', async ({ browser }) => {
  test.setTimeout(120_000)
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await unlockPorch05(page)
  await goto(page, '/?level=porch05&build=par&launch=1&farewell=1')
  // the same truth with no camera move: summary + doors land at once —
  // the crane (pure motion) never plays, the set row is never even built
  await expect(page.locator('#gw-farewell')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-farewell-summary')).toBeVisible()
  await expect(page.locator('#gw-farewell-doors')).toBeVisible()
  await expect(page.locator('#gw-farewell-canvas')).toHaveCount(0)
  const state = await page.evaluate(() => (window as any).__gwFarewellState?.())
  expect(state?.phase).toBe('static')
  await ctx.close()
})
