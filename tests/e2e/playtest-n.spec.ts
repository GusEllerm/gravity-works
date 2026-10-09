/**
 * The playtest-N gate (stage 4, systems engineer): the four things a fresh
 * pair of eyes could not do on the live page, asserted on the built app.
 *
 * 1. THE PANEL DOES NOT SWALLOW THE WORLD — with the result panel open, a
 *    canvas click inside the panel's own rectangle still PLACES (the panel
 *    root takes no pointer events; its buttons do), and dragging across the
 *    panel selects no panel text (N: "dragging selected panel text
 *    instead"); the panel's Retry stays clickable.
 * 2. A DISMISSED PANEL NEVER HIDES THE WAY BACK — the permanent Retry sits
 *    beside Launch with the as-built semantics the panel's Retry carries
 *    (the same `resetCar` wiring).
 * 3. STAR RULES BEFORE THE FIRST RUN — the level select prints the rules
 *    line (stars + this rung's par numbers) on every OPEN rung, and the
 *    level's FIRST boot says the same line quietly before any run exists
 *    ("teaching precedes failure").
 * 4. SPENT-KIND MESSAGES NAME THE KIND YOU TRIED — hovering a spent tray
 *    button neither steals the held piece nor contradicts it, and a spent
 *    click names the kind the click attempted AND the piece in hand (both
 *    M and N tripped on "no landing left in the tray" while holding gapLip).
 * 5. L01'S DEFAULT TARGET SITS ON THE PAR RAIL — fresh kitchen01 aims the
 *    first Place at the start ramp's exit with zero aiming, the first Place
 *    advances the par chain, and the pure-UI three-click build finishes.
 */
import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'

const ready = (page: import('@playwright/test').Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

test('the open result panel passes world clicks through to the canvas and selects no text', async ({ page }) => {
  // CI-starve budget (P3): a launched run ENDS on its own event; a saturated
  // software-GL runner just spends longer wall-clock getting there.
  test.slow()
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  // two of three pieces, then a launch that FAILS: the panel is up while a
  // tray piece is still holdable — the exact state N lost clicks in
  await goto(page, '/?level=kitchen01')
  await ready(page)
  await page.click('#gw-tray-gapLip')
  await page.click('#gw-place')
  await page.click('#gw-tray-drop')
  await page.click('#gw-place')
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })

  // the pointer-event scoping is real, not incidental: the panel box takes
  // no pointers; its button row does
  const box = (await page.locator('#gw-result').boundingBox())!
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.querySelector('#gw-result')!).pointerEvents))
    .toBe('none')
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.querySelector('#gw-result-buttons')!).pointerEvents))
    .toBe('auto')

  // and a DRAG across the OPEN panel selects none of its text (N's exact
  // symptom) — done while the panel is still up: the placement below is an
  // edit, and an edit honestly retires the panel
  await page.mouse.move(box.x - 40, box.y + 8)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 })
  await page.mouse.up()
  const selected = await page.evaluate(() => window.getSelection()?.toString() ?? '')
  expect(selected).toBe('')

  // hold the third piece and click INSIDE the panel's rectangle: the
  // click must reach the world, not die inside the panel or select its
  // text (N's symptom). SINCE STAGE 5 the FAILURE panel is the bottom
  // strip (playtest BB item 6 — the caption no longer stands over the
  // world); on a page taller than the window its row still crosses the
  // canvas's bottom band, and there the pass-through law lives: the hit
  // test says the canvas, and the intent ENDS READ — the piece placed or
  // the refusal line spoken — the panel retired to the board that says
  // so. Where the strip sits clear of the canvas, the same never-silent
  // build-intent law is exercised on the Place button instead.
  await page.click('#gw-tray-landing')
  const probe = await page.evaluate(() => {
    const b = document.getElementById('gw-result')!.getBoundingClientRect()
    const c = document.querySelector('#gw-stage canvas')!.getBoundingClientRect()
    const y = b.y + b.height / 2
    if (y < c.top || y > c.bottom) return { x: 0, y, over: false, hit: 'off-canvas' }
    // walk the strip row from its left edge to the first point whose hit
    // test is the CANVAS — a spot under the caption's pointer-transparent
    // text, never the button row (whose controls keep their own pointers)
    for (let x = Math.max(b.x + 4, c.x + 4); x <= Math.min(b.right - 4, c.right - 4); x += 6) {
      if (document.elementFromPoint(x, y)?.id === 'gw-canvas') return { x, y, over: true, hit: 'gw-canvas' }
    }
    return { x: 0, y, over: false, hit: 'buttons-only' }
  })
  if (probe.over) {
    expect(probe.hit, 'the strip box takes no pointers — the canvas is the hit target').toBe('gw-canvas')
    await page.mouse.click(probe.x, probe.y)
  } else {
    await page.click('#gw-place')
  }
  // the intent ENDS read: placed at where it clicked/rang, or refused in
  // words — never the silent swallow N found
  await expect(page.locator('#gw-result')).toBeHidden({ timeout: 10_000 })
  await expect
    .poll(
      async () =>
        ((await page.textContent('#gw-piece-count')) ?? '') === '3 of 3 pieces used'
          ? 'placed'
          : ((await page.textContent('#gw-ghost-state')) ?? '').trim() || 'silent',
      { timeout: 10_000 },
    )
    .not.toBe('silent')
  // the panel retired because the placement was an EDIT, not because of a
  // pointer mystery — and the next run's panel Retry is still hittable
  await expect(page.locator('#gw-result')).toBeHidden()
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await page.click('#gw-result-retry')
  await expect(page.locator('#gw-status')).toContainText('ready')

  expect(errors).toEqual([])
})

test('the permanent Retry sits outside the panel and retries as-built', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await goto(page, '/?level=kitchen01')
  await ready(page)
  // the control is there BEFORE any panel exists, and it says the word
  await expect(page.locator('#gw-reset')).toBeVisible()
  await expect(page.locator('#gw-reset')).toHaveText('Retry')

  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  // an edit dismisses the panel — the way back must survive it
  await page.click('#gw-tray-drop')
  await page.click('#gw-place')
  await expect(page.locator('#gw-result')).toBeHidden()

  await page.click('#gw-reset')
  await expect(page.locator('#gw-status')).toContainText('ready')
  await expect(page.locator('#gw-result')).toBeHidden()
  // as-built: the build is untouched by the retry
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')

  expect(errors).toEqual([])
})

test('the star rules ride the level select before the first run', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await goto(page, '/?levels=1')
  // an open rung states what its stars cost, with ITS par numbers (kitchen01:
  // par 3 pieces, par 2.25 s per pars.json)
  await expect(page.locator('#gw-level-kitchen01 .gw-level-rules')).toContainText('finish the run')
  await expect(page.locator('#gw-level-kitchen01 .gw-level-rules')).toContainText('3 pieces (par)')
  await expect(page.locator('#gw-level-kitchen01 .gw-level-rules')).toContainText('s (par)')

  expect(errors).toEqual([])
})

test('a level quietly states the star rules on its first boot and never again', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await goto(page, '/?level=kitchen01')
  await ready(page)
  // before any run exists, the quiet line is up (playtest N: the rules only
  // appeared AFTER a run)
  await expect(page.locator('#gw-callout')).toContainText('Stars: finish the run')

  // a second boot of the same level says it no more (the seen set rode the
  // save, exactly like the piece callouts)
  await goto(page, '/?level=kitchen01')
  await ready(page)
  await expect(page.locator('#gw-callout')).toHaveText('')

  expect(errors).toEqual([])
})

test('a spent tray button steals nothing on hover and names BOTH kinds on click', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await goto(page, '/?level=kitchen01')
  await ready(page)
  // spend the Landing only: it goes onto the ramp exit (legal, off-par)
  await page.click('#gw-tray-landing')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')

  // hold the Lip, then let the mouse PASS OVER the spent Landing button:
  // the hold must stay the Lip (before the fix the hover silently swapped
  // the held piece for the spent one — the origin of N's contradiction)
  await page.click('#gw-tray-gapLip')
  await expect(page.locator('#gw-tray-gapLip')).toHaveAttribute('aria-pressed', 'true')
  await page.hover('#gw-tray-landing')
  await expect(page.locator('#gw-tray-gapLip')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('#gw-tray-landing')).toHaveAttribute('aria-pressed', 'false')

  // and a CLICK on the spent button names the kind the click TRIED and the
  // piece in hand — one line, no contradiction
  // (dispatchEvent: aria-disabled buttons stay focusable and real-mouse
  // clickable; Playwright's actionability check would not fire them)
  await page.dispatchEvent('#gw-tray-landing', 'click')
  await expect(page.locator('#gw-ghost-state')).toContainText('no Landing left in the tray')
  await expect(page.locator('#gw-ghost-state')).toContainText('you are holding Lip')

  expect(errors).toEqual([])
})

test('fresh kitchen01 aims the FIRST Place at the par rail and the pure-UI build finishes', async ({ page }) => {
  // CI-starve budget (P3): the whole finish-the-run loop is event-driven;
  // the budget is the software-GL wall-clock truth, not a hidden sleep.
  test.slow()
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await goto(page, '/?level=kitchen01')
  await ready(page)

  // ZERO aiming: holding the first tray piece shows the target on the
  // start ramp's OPEN EXIT — the socket the par line begins on (N's
  // eight-try wall was the default aiming `level start`, a legal dead end).
  // HELD phrasing (playtest Z round7): while a piece is in hand the line
  // says `place lip at:` — an AIM, never the star-rules `target` (goal).
  await page.click('#gw-tray-gapLip')
  await expect(page.locator('#gw-target-label')).toHaveText('place lip at: end of the pre-built ramp')

  // the first Place at the default target ADVANCES the par chain: the
  // placed piece's exit becomes the new target
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')
  await expect(page.locator('#gw-target-label')).toHaveText('target: end of lip')

  await page.click('#gw-tray-drop')
  await page.click('#gw-place')
  await expect(page.locator('#gw-target-label')).toHaveText('target: end of drop')
  await page.click('#gw-tray-landing')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('3 of 3 pieces used')

  // the three blind Places built the PAR LINE: the run finishes inside the
  // par lines — pure-UI, no aiming, no `?build=par`
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-status')).toContainText('finished')
  await expect(page.locator('#gw-result-stars')).toHaveText('★★★')

  expect(errors).toEqual([])
})
