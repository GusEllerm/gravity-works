import { test, expect } from '@playwright/test'
import { FEEL_TRACK_KINDS } from '../../src/feel/feeltrack.ts'
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts'

/**
 * The stage-3 result layer, end to end on the real boot:
 *
 * 1. Finish the feel track through `/?launch=1` (the existing boot's release
 *    hook): the panel must be ABSENT while the run plays (§5.11 — no panels
 *    over the set during a run) and appear at the end with the star readout,
 *    the time and the piece count. Stars are asserted against the same
 *    pars.json the page scores with — the reference build finishing at its
 *    regenerated par is what makes `★★★` derivable rather than hardcoded.
 * 2. The help drawer (§9.3): opens from its toggle, lists at least five
 *    unlocked pieces, and the shared mini-harness canvas renders non-black
 *    track geometry (orange pixels in a warm-paper field), proving the
 *    scissor-per-cell renders actually draw.
 * 3. Playtest J (2026-10-08), at the viewport that FAILED (~960x540): the
 *    panel is viewport-safe — Retry AND Next both sit inside the window
 *    with nothing scrolled — and a re-run of an already-starred level
 *    verdicts the par (`beat par ✓ / over par`) instead of aiming at it.
 */

test('finishing the feel track shows the result panel with stars and time', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?level=feeltrack&launch=1')
  // during the run: no panel over the set (§5.11)
  await expect(page.locator('#gw-result')).toBeHidden({ timeout: 5_000 })

  // the run ends (finish cup at the par build's par pace): the panel appears
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-result-stars')).toHaveText('★★★')
  await expect(page.locator('#gw-result-stars')).toHaveAccessibleName(/3 of 3 stars/)
  // the par lines ride with the tallies (playtest B: the star rules were
  // opaque) — every ✓ is one of the three lines the rules line spells out
  await expect(page.locator('#gw-result-time')).toHaveText(/^\d+\.\d{2} s — par [\d.]+ s ✓$/)
  await expect(page.locator('#gw-result-pieces')).toHaveText(
    new RegExp(`^${FEEL_TRACK_KINDS.length} pieces — par ${FEELTRACK.par.pieces} ✓$`),
  )
  await expect(page.locator('#gw-result-rules')).toContainText('finish the run')
  // a finished run earns silence, not a lecture (§11)
  await expect(page.locator('#gw-result-note')).toBeHidden()
  // and the par the page scored with is the regenerated one, sanity-bounded
  expect(FEELTRACK.par.pieces).toBe(FEEL_TRACK_KINDS.length)

  expect(errors).toEqual([])
})

test.describe('the panel at 960x540 (playtest J: the Next button was cut off)', () => {
  test.use({ viewport: { width: 960, height: 540 } })

  test('the panel is viewport-safe: Retry AND Next are both inside the window without scrolling', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    // the BOTH-BUTTONS case: kitchen01's par build finishes with a star and
    // the ladder has a next rung, so the panel shows Retry AND Next level
    await page.goto('/?level=kitchen01&build=par&launch=1')
    await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
    await expect(page.locator('#gw-result-stars')).toContainText('★')
    await expect(page.locator('#gw-result-retry')).toBeVisible()
    await expect(page.locator('#gw-result-next')).toBeVisible()

    // "without scrolling": the page never had to move — nothing was
    // scrolled by anyone, and the panel's own scrollback is unused — and
    // every part of the button row sits fully inside the 960x540 window
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    expect(await page.evaluate(() => {
      const p = document.querySelector('#gw-result')!
      return p.scrollHeight <= p.clientHeight && p.scrollTop === 0
    })).toBe(true)
    for (const sel of ['#gw-result', '#gw-result-retry', '#gw-result-next']) {
      const box = await page.locator(sel).boundingBox()
      expect(box).not.toBeNull()
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height).toBeLessThanOrEqual(540)
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(960)
    }

    expect(errors).toEqual([])
  })

  test('a re-run of an already-starred level leads with its own numbers and verdicts the par', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    // FIRST finish (nothing earned yet): the par is the genuine target —
    // the target lines with their per-line marks ride the panel
    await page.goto('/?level=feeltrack&build=par&launch=1')
    await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
    await expect(page.locator('#gw-result-pieces')).toHaveText(
      new RegExp(`^${FEEL_TRACK_KINDS.length} pieces — par ${FEELTRACK.par.pieces} ✓$`),
    )

    // RE-run the SAME build (Retry returns it as-built, Launch plays it):
    // the star is already in the save, so the panel leads with the run's
    // own numbers and the par reads as a clean verdict, not a target
    await page.click('#gw-result-retry')
    await expect(page.locator('#gw-status')).toContainText('ready')
    await page.click('#gw-launch')
    await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
    await expect(page.locator('#gw-result-pieces')).toHaveText(
      new RegExp(`^${FEEL_TRACK_KINDS.length} pieces — beat par ✓ \\(par ${FEELTRACK.par.pieces}\\)$`),
    )
    await expect(page.locator('#gw-result-time')).toHaveText(
      /^\d+\.\d{2} s — beat par ✓ \(par [\d.]+ s\)$/,
    )
    // the stale TARGET phrasing is gone on the replay
    await expect(page.locator('#gw-result-pieces')).not.toContainText('pieces — par')

    expect(errors).toEqual([])
  })
})

test('the help drawer lists the unlocked pieces and its renders are not black', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/')
  await page.click('#gw-help-toggle')
  await expect(page.locator('#gw-help-list')).toBeVisible()
  await expect(page.locator('#gw-help-toggle')).toHaveAttribute('aria-expanded', 'true')
  const entries = await page.locator('#gw-help-list > li').count()
  expect(entries).toBeGreaterThanOrEqual(5)
  await expect(page.locator('#gw-help-entry-straight')).toContainText('Flat deck')

  // track-orange pixels in the shared canvas: something is actually rendering
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const c = document.querySelector('#gw-help-canvas') as HTMLCanvasElement | null
          if (!c || !c.width) return 0
          const t = document.createElement('canvas')
          t.width = 320
          t.height = 180
          const g = t.getContext('2d')!
          g.drawImage(c, 0, 0, 320, 180)
          const d = g.getImageData(0, 0, 320, 180).data
          let orange = 0
          for (let i = 0; i < d.length; i += 4) {
            if (d[i]! > 170 && d[i + 1]! > 40 && d[i + 1]! < 180 && d[i + 2]! < 110) orange++
          }
          return orange / (320 * 180)
        }),
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0.002)

  expect(errors).toEqual([])
})
