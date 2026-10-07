/**
 * The playtest P+Q gate (stage 4, systems engineer): the five shell claims
 * two round-2 strangers could not make on the live page, asserted on the
 * built app.
 *
 * 1. FOCUS RETURNS TO THE WORLD (P: "Enter re-picks the last-focused
 *    button", "Rotate steals focus and breaks the next Enter"; Q: "Enter
 *    both re-launches and dismisses the win overlay"). Every toolbar/tray
 *    and panel button blurs after activation, Enter's world action fires
 *    only with focus on the world, Launch keeps its NATIVE Enter only
 *    while the button itself is focused.
 * 2. ONE COUNTER, ONE VERB (P: "piece-count text flip-flops"; Q: "0 of 4
 *    used vs ready — 1 placed"). The tray tally and the idle status line
 *    state the same numbers in the same words; mid-run the status line
 *    carries the clock only — never a second tally to contradict.
 * 3. THE TARGET RING SPEAKS (Q: "white ring markers unlabeled"). The first
 *    time the ring is visible in a page session one quiet line names it —
 *    "the ring is where it will land" — and the first placement retires
 *    it; the ring's socket label shows even with nothing held.
 * 4. NO STUCK HOLDS ON EXHAUSTED KINDS (Q: "no Drop left in the tray"
 *    while holding a spent Drop). Placing the LAST of a kind releases the
 *    hold; a spent-place refusal releases too. The next Place is never
 *    spent on a piece that cannot place.
 * 5. PAR ON THE RULES LINE, NOT ONLY HELP. Every OPEN rung of the level
 *    select and a level's first-boot line carry THAT level's par numbers
 *    (the N pass wired `starRulesLine`; this asserts PER-RUNG content,
 *    not just the words "finish the run").
 */
import { test, expect } from '@playwright/test'

const ready = (page: import('@playwright/test').Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

/** What holds keyboard focus right now (BODY = the world holds it). */
const focusedTag = (page: import('@playwright/test').Page): Promise<string> =>
  page.evaluate(() => document.activeElement?.tagName ?? 'NONE')

const targetSocket = (page: import('@playwright/test').Page): Promise<number[] | null> =>
  page.evaluate(() => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocket())

test('a clicked toolbar button releases focus: Enter places, arrows aim, nothing re-clicks', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?level=kitchen01')
  await ready(page)

  // click a TRAY button — after activation the world holds focus again
  await page.click('#gw-tray-gapLip')
  expect(await focusedTag(page)).toBe('BODY')
  await expect(page.locator('#gw-tray-gapLip')).toHaveAttribute('aria-pressed', 'true')

  // …and the next Enter is PLACE (P's symptom was Enter re-picking the
  // button): the counter moves, the button was not re-clicked
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')
  await expect(page.locator('#gw-ghost-state')).not.toContainText('not in this level')

  // Rotate by CLICK eats nothing: focus is the world's, the arrows still
  // move the visible target, and Enter does not re-fire the Rotate button
  await page.click('#gw-rotate')
  expect(await focusedTag(page)).toBe('BODY')
  const before = await targetSocket(page)
  await page.keyboard.press('ArrowRight')
  const after = await targetSocket(page)
  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  expect(Math.hypot(...before!.map((b, i) => b - after![i]!))).toBeGreaterThan(0.05)
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-ghost-state')).not.toContainText('rotated')

  // Launch by CLICK does not keep the Enter: the panel ends the run with
  // focus on the world, and Enter neither re-launches (status never runs)
  // nor dismisses the panel (Q's ambiguous Enter)
  await page.click('#gw-launch')
  expect(await focusedTag(page)).toBe('BODY')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  const panelText = (await page.locator('#gw-status').textContent()) ?? ''
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-status')).not.toContainText('running')
  await expect(page.locator('#gw-status')).toHaveText(panelText)
  await expect(page.locator('#gw-result')).toBeVisible()

  // the panel's Retry releases focus too: Enter after a clicked Retry is
  // the world's Enter, not a second Retry
  await page.click('#gw-result-retry')
  expect(await focusedTag(page)).toBe('BODY')
  await expect(page.locator('#gw-result')).toBeHidden()
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-status')).toContainText('ready')

  // Launch KEEPS its native Enter while the button itself is focused
  await page.locator('#gw-launch').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-status')).toContainText('running')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })

  expect(errors).toEqual([])
})

test('one counter, one verb: the tray tally and the status line never contradict', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?level=kitchen01')
  await ready(page)

  // at rest both lines state the SAME tally in the SAME words
  await expect(page.locator('#gw-piece-count')).toHaveText('0 of 3 pieces used')
  await expect(page.locator('#gw-status')).toHaveText('ready — 0 of 3 pieces used')

  // after a placement the two lines keep saying the same thing (P's
  // flip-flop and Q's "0 of 4 used vs ready — 1 placed" are one bug)
  await page.click('#gw-tray-landing')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')
  await expect(page.locator('#gw-status')).toHaveText('ready — 1 of 3 pieces used')

  // mid-run the status line carries the CLOCK only — no second tally to
  // contradict the tray counter while the numbers cannot change
  await page.click('#gw-launch')
  await expect(page.locator('#gw-status')).toContainText('running')
  await expect(page.locator('#gw-status')).not.toContainText('pieces')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')

  // terminal: still no stray tally; the panel's number IS the counter's
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-status')).not.toContainText('pieces used')
  await expect(page.locator('#gw-result-pieces')).toContainText('1 pieces')

  expect(errors).toEqual([])
})

test('the ring names itself once per session and retires at the first placement', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?level=kitchen01')
  await ready(page)

  // the ring is visible on the idle table and the line names it (Q: the
  // rings were unlabeled white circles)
  await expect(page.locator('#gw-ring-hint')).toBeVisible()
  await expect(page.locator('#gw-ring-hint')).toHaveText('the ring is where it will land')
  // the ring keeps its socket's label with NOTHING held (it always answers
  // "where will it go", so the label line is never silent while it shows)
  await expect(page.locator('#gw-target-label')).toContainText('target: end of ramp')

  // the first successful placement retires the line — for good, this session
  await page.click('#gw-tray-gapLip')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')
  await expect(page.locator('#gw-ring-hint')).toBeHidden()
  await page.click('#gw-tray-drop')
  await page.click('#gw-place')
  await expect(page.locator('#gw-ring-hint')).toBeHidden()

  // SESSION-scoped by design: a fresh visit re-teaches it (the line is not
  // burned into the save the way a piece callout is)
  await page.reload()
  await ready(page)
  await expect(page.locator('#gw-ring-hint')).toBeVisible()

  expect(errors).toEqual([])
})

test('placing the LAST of a kind releases the hold — no stranded spent piece', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?level=kitchen01')
  await ready(page)

  // hold the Drop (its tray count is 1) and place it: the kind is now spent
  await page.click('#gw-tray-drop')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')

  // Q's stuck hold: the ghost used to stay the spent Drop and every Place
  // then said "no Drop left in the tray". The hold RELEASES instead and
  // says so once, naming the kind that ran out
  await expect(page.locator('#gw-tray-drop')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('#gw-ghost-state')).toContainText('last Drop placed')

  // and Place never again spends itself on the stranded hold
  // (dispatchEvent: with nothing held Place is aria-disabled, and Playwright's
  // actionability check would not fire it — the real-mouse path does)
  await page.dispatchEvent('#gw-place', 'click')
  await expect(page.locator('#gw-ghost-state')).not.toContainText('no Drop left')
  await expect(page.locator('#gw-ghost-state')).toContainText('last Drop placed')

  // the remaining kinds still hold and place normally (the release is
  // about the SPENT kind only)
  await page.click('#gw-tray-landing')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('2 of 3 pieces used')
  await expect(page.locator('#gw-tray-landing')).toHaveAttribute('aria-pressed', 'false')

  expect(errors).toEqual([])
})

test('every open rung and the first boot state THAT level’s par numbers', async ({ browser }) => {
  const errors: string[] = []

  // an earned-campaign save so several rungs are OPEN (each carries its
  // own rules line; locked rungs state the unlock rule, not a par)
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'gravity-works.save',
      JSON.stringify({
        v: 2,
        builds: {},
        settings: {},
        progress: {
          stars: { kitchen01: 1, kitchen02: 3, kitchen03: 3, kitchen04: 3, kitchen05: 1, bedroom01: 1 },
          reached: {},
        },
      }),
    )
  })
  await page.goto('/?levels=1')
  // the rungs are the level's OWN par numbers from pars.json — asserted
  // per rung (the N pass wired starRulesLine; the words alone proved the
  // plumbing, not the addressing)
  const rungs: [string, string, string][] = [
    ['kitchen01', '3', '2.25'],
    ['kitchen02', '3', '1.05'],
    ['kitchen03', '5', '2.65'],
    ['kitchen04', '4', '2.55'],
    ['kitchen05', '6', '2.40'],
    ['bedroom01', '3', '2.35'],
  ]
  for (const [id, pieces, time] of rungs) {
    const line = page.locator(`#gw-level-${id} .gw-level-rules`)
    await expect(line).toBeVisible()
    await expect(line).toContainText(`${pieces} pieces (par)`)
    await expect(line).toContainText(`${time} s (par)`)
  }
  await ctx.close()

  // the level's FIRST boot says the same line quietly — with ITS numbers
  const ctx2 = await browser.newContext()
  const boot = await ctx2.newPage()
  boot.on('pageerror', (err) => errors.push(String(err)))
  await boot.goto('/?level=kitchen03')
  await ready(boot)
  await expect(boot.locator('#gw-callout')).toContainText('Stars: finish the run')
  await expect(boot.locator('#gw-callout')).toContainText('5 pieces (par)')
  await expect(boot.locator('#gw-callout')).toContainText('2.65 s (par)')
  await ctx2.close()

  expect(errors).toEqual([])
})
