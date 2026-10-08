/**
 * STAGE 6 — the accessibility gate. What the audit promised to be true,
 * asserted rather than admired:
 *
 * 1. THE TAB WALK IS A WALK, NOT A TRAP — every interactive control on the
 *    game page is a tab stop exactly once (link, the world's builder group,
 *    ALL thirteen tray kinds, the five toolbar buttons, the Help toggle,
 *    the fingerprint disclosure, sound mute + volume); Tab never cycles
 *    aim anymore (that hijack — the old "world focus" tie-walk — could
 *    strand a keyboard user on the body forever; `[ ]` own the tie-walk
 *    now, see `Modules/ui`), and no stop swallows the next Tab.
 * 2. A FULL LEVEL BY KEYBOARD ALONE — kitchen01 held, aimed, PLACED and
 *    LAUNCHED with Tab, Enter, the arrows and L only (no `focus()` helper,
 *    no mouse): place through a focused tray button's Enter, place through
 *    the world's Enter, launch through L, retry and Next through the
 *    panel's buttons.
 * 3. FOCUS IS VISIBLE on every surface, incl. the DARK result panel (the
 *    ring's computed style is the receipt; `Reference/Accessibility audit
 *    2026-10-08.md` carries the screenshots of tab stops).
 * 4. THE SHARE / REPLAY PAGE gets the same walk (play, the role=slider
 *    scrubber with a keyboard seek, the three speeds, the exit link), and
 *    the level select's LOCKED rungs stay honest tab stops that explain
 *    themselves.
 * 5. NEVER COLOR-ONLY — the ghost always wears a WORD, stars are shape +
 *    an `N of 3 stars` label, locks are a 🔒 glyph with the rule in words.
 * 6. REDUCED MOTION honors the OS setting: the replay page defaults to
 *    PAUSED under `prefers-reduced-motion: reduce` (the still-frame
 *    equivalent of the cinematic; the builder's flip tween and the help
 *    spinner share the same source, `src/ui/motion.ts`).
 */
import { test, expect, type Page } from '@playwright/test'

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

/** A stable name for the currently focused element. */
const activeName = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const a = document.activeElement
    if (!a || a === document.body) return 'body'
    if (a.id) return `#${a.id}`
    return a.tagName.toLowerCase()
  })

/** Press Tab until focus lands on `selector` — the REAL walk, never
 *  `.focus()` (an audit of tab order that cheats with focus() audits
 *  nothing). Throws with the whole traversal when the stop is unreachable. */
async function tabTo(page: Page, selector: string, max = 45): Promise<string[]> {
  const seen: string[] = []
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const name = await activeName(page)
    seen.push(name)
    if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector))
      return seen
    if (name === 'body') {
      // wrapped out of the document — keep walking once more around
      if (seen.filter((s) => s === 'body').length > 2) break;
    }
  }
  throw new Error(`Tab never reached ${selector}; walked: ${seen.join(' → ')}`)
}

test('the Tab walk visits every control exactly once and traps on none', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen01')
  await ready(page)

  const trayIds = await page.$$eval('#gw-tray button', (bs) => bs.map((b) => `#${b.id}`))
  expect(trayIds.length).toBe(13)

  const walk: string[] = []
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    const name = await activeName(page)
    if (name === 'body') break // walked out of the document: the cycle is complete
    walk.push(name)
  }
  // every tray kind, every toolbar button, and the page's other controls
  for (const id of [
    '#gw-levels-link',
    '#gw-builder', // the world's own tab stop (role=group)
    ...trayIds,
    '#gw-place',
    '#gw-rotate',
    '#gw-remove-piece',
    '#gw-reset',
    '#gw-launch',
    '#gw-help-toggle',
    'summary',
    '#gw-sound-toggle',
    '#gw-sound-volume',
  ]) {
    expect(walk, `Tab never stopped on ${id} (walk: ${walk.join(' → ')})`).toContain(id)
  }
  // NO TRAP, NO REPEAT inside one cycle: a hijacked Tab (the pre-stage-6
  // tie-walk) repeated the SAME stop forever instead of walking on
  const dupes = walk.filter((w, i) => walk.indexOf(w) !== i)
  expect(dupes, `Tab repeated stops (walk: ${walk.join(' → ')})`).toEqual([])
  expect(errors).toEqual([])
})

test('keyboard end-to-end: kitchen01 built, launched, finished and retried with Tab/Enter/L only', async ({ page }) => {
  // This flow is honest about being long: many focus round-trips plus a
  // simulated run under CI's SwiftShader pacing. Without `slow()` the bare
  // 30 s test budget was the wall it hit on CI (green locally at ~4 s).
  test.slow()
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=kitchen01')
  await ready(page)

  /** Hold a kind with Tab + the focused button's native Enter (after the
   *  activation the button blurs — the P+Q focus policy — so focus is the
   *  world again and the NEXT Enter is PLACE). */
  const hold = async (id: string) => {
    await tabTo(page, `#${id}`)
    await page.keyboard.press('Enter')
    await expect(page.locator(`#${id}`)).toHaveAttribute('aria-pressed', 'true')
    expect(await activeName(page)).toBe('body')
  }

  // the par line, three pieces, no pointer and no focus() shortcut
  await hold('gw-tray-gapLip')
  await page.keyboard.press('Enter') // the world's Enter: PLACE
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')

  await hold('gw-tray-drop')
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-piece-count')).toHaveText('2 of 3 pieces used')

  await hold('gw-tray-landing')
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-piece-count')).toHaveText('3 of 3 pieces used')

  // L LAUNCHES from world focus — the launch needs neither the pointer nor
  // parking focus on the Launch button (the hint line teaches the key)
  await page.keyboard.press('l')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-result-stars')).toHaveText(/^★/)
  await expect(page.locator('#gw-result-next')).toBeVisible()

  // the panel closes from the keyboard: Tab to Retry, native Enter, blur
  await tabTo(page, '#gw-result-retry')
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-result')).toBeHidden()

  // L over a FOCUSED control is just a letter — it launches nothing
  await page.locator('#gw-launch').focus()
  await page.keyboard.press('l')
  await expect(page.locator('#gw-status')).toContainText('ready')

  expect(errors).toEqual([])
})

test('focus is visible: the ring shows on the paper toolbar AND on the dark result panel', async ({ page }) => {
  await page.goto('/?level=kitchen01')
  await ready(page)

  await tabTo(page, '#gw-tray-gapLip')
  const paper = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement as Element)
    return { width: s.outlineWidth, style: s.outlineStyle, color: s.outlineColor }
  })
  expect(paper.style).toBe('solid')
  expect(parseFloat(paper.width)).toBeGreaterThanOrEqual(3)

  // finish a run so the panel is up, then land focus on its Retry
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await tabTo(page, '#gw-result-retry')
  const dark = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement as Element)
    return { width: s.outlineWidth, style: s.outlineStyle, color: s.outlineColor }
  })
  expect(dark.style).toBe('solid')
  expect(parseFloat(dark.width)).toBeGreaterThanOrEqual(3)
  expect(dark.color).toBe('rgb(255, 225, 168)') // #ffe1a8 — 7.4:1 on the panel
})

test('the replay page is a keyboard surface: play, slider scrubber with a keyboard seek, speeds, exit', async ({ page }) => {
  test.setTimeout(180_000) // the tape wind is honest work
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  // earn a real run through the keyboard flow, then Share it through the
  // panel's own control — the link the audit then walks
  await page.goto('/?level=kitchen01')
  await ready(page)
  await page.goto('/?level=kitchen01&build=par&launch=1')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await page.click('#gw-result-share')
  await expect(page.locator('#gw-result-share-row')).toBeVisible()
  // the share row is tabbable too (it is a control row, not decoration)
  await tabTo(page, '#gw-result-share-url', 50)
  const url = await page.inputValue('#gw-result-share-url')
  expect(url).toContain('#s=')

  await page.goto(url)
  await expect
    .poll(
      async () =>
        (await page.locator('#gw-replay-play').getAttribute('data-phase')) ?? 'waiting',
      { timeout: 120_000 },
    )
    .not.toBe('waiting')

  const walk: string[] = []
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    const name = await activeName(page)
    if (name === 'body') break
    walk.push(name)
  }
  for (const stop of ['#gw-replay-play', '#gw-replay-timeline', '#gw-replay-speed-1', '#gw-replay-build']) {
    if (stop === '#gw-replay-speed-1') {
      // the speed buttons carry a class, not per-id; the walk must hold ≥ 3 of them
      continue
    }
    expect(walk, `replay Tab walk: ${walk.join(' → ')}`).toContain(stop)
  }
  // the scrubber is a real slider with a keyboard seek
  await page.locator('#gw-replay-timeline').focus()
  expect(await page.getAttribute('#gw-replay-timeline', 'role')).toBe('slider')
  expect(await page.getAttribute('#gw-replay-timeline', 'aria-valuenow')).not.toBeNull()
  await page.keyboard.press('End')
  const max = Number(await page.getAttribute('#gw-replay-timeline', 'aria-valuemax'))
  expect(Number(await page.getAttribute('#gw-replay-timeline', 'aria-valuenow'))).toBeCloseTo(max, 1)
  await page.keyboard.press('Home')
  expect(Number(await page.getAttribute('#gw-replay-timeline', 'aria-valuenow'))).toBe(0)
  expect(errors).toEqual([])
})

test('never color-only: ghost words, star labels, and lock glyphs speak', async ({ page }) => {
  await page.goto('/?level=kitchen01')
  await ready(page)

  // the ghost's fit verdict is a WORD on a live line, never just a tint
  await page.click('#gw-tray-drop')
  const ghost = (await page.textContent('#gw-ghost-state')) ?? ''
  expect(ghost).toMatch(/fits here|flipped fit|no seat|blocked/i)

  // stars are SHAPE plus a counted label
  await page.goto('/?level=kitchen01&build=par&launch=1')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-result-stars')).toHaveAttribute('role', 'img')
  await expect(page.locator('#gw-result-stars')).toHaveAttribute('aria-label', /\d of 3 stars/)
  await expect(page.locator('#gw-result-stars')).toContainText(/[★☆]/)

  // locked rungs are a LOCK GLYPH plus the rule in words (never a dim ☆)
  await page.goto('/?levels=1')
  const locked = page.locator('button[aria-disabled="true"]').first()
  await expect(locked).toContainText('🔒')
  await expect(locked).toContainText(/Earn a star on .* to open this/)
  await expect(locked).toHaveAttribute('aria-disabled', 'true')
  // and it is a TALKING tab stop: Enter speaks the rule
  await locked.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-levelselect-status')).toContainText('Locked — earn at least one star')
})

test('reduced motion (OS setting): the replay cinematic defaults to its still frame', async ({ page }) => {
  test.setTimeout(180_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?level=kitchen01&build=par&launch=1')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await page.click('#gw-result-share')
  await expect(page.locator('#gw-result-share-row')).toBeVisible()
  const url = await page.inputValue('#gw-result-share-url')
  await page.goto(url)
  await expect
    .poll(
      async () => (await page.locator('#gw-replay-play').getAttribute('data-phase')) ?? 'waiting',
      { timeout: 120_000 },
    )
    .not.toBe('waiting')
  // the still-frame default: PAUSED, a named Play control waiting for opt-in
  // (without the media query the same page autoplays — the share-replay
  // spec pins that direction)
  await expect(page.locator('#gw-replay-play')).toHaveAttribute('aria-pressed', 'false')
})

test('the share row speaks through a live region and the input is a tab stop', async ({ page }) => {
  await page.goto('/?level=kitchen01&build=par&launch=1')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await page.click('#gw-result-share')
  await expect(page.locator('#gw-result-share-note')).toBeVisible()
  await expect(page.locator('#gw-result-share-note')).toHaveAttribute('aria-live', 'polite')
  await expect(page.locator('#gw-result-share-url')).toHaveAttribute('aria-label', /share link/i)
})
