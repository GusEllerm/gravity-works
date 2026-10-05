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
