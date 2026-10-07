import { test, expect } from '@playwright/test'

/**
 * The shell-readiness gate the deployed-page check demanded (stage 3):
 *
 * 1. kitchen01 boots EMPTY of tray pieces — the player builds the tutorial
 *    (the fixture build only: the book-stack ramp and the cup are mounted,
 *    the three tray pieces are not);
 * 2. the canvas shows the TRACK (a pixel probe: > 1 % of the frame differs
 *    from the corner pixel — a camera that frames the counter instead of
 *    the line is exactly how "cream void" reached the deployed page);
 * 3. the tray speaks the level budget: kitchen01's tray is gapLip/drop/
 *    landing — those three enabled, the other ten kinds aria-disabled with
 *    a reason title, and the counter reads `0 of 3 pieces used` (TRAY placements
 *    over budget, never build-size over budget);
 * 4. no literal "hidden" anywhere on the shell;
 * 5. placing all three pieces finishes the level (Concepts/Levels' proved
 *    claim, now playable through the real builder), and the RESULT PANEL —
 *    not just the status line — appears at run end, inside the viewport,
 *    with at least one star. The Launch button sits ABOVE the canvas so a
 *    click cannot scroll the world (and the panel over it) off-screen —
 *    the deployed "panel never appeared" bug; `?launch=1` never could.
 */

const probe = async (page: import('@playwright/test').Page): Promise<number> =>
  page.evaluate(() => {
    const c = document.querySelector('#gw-canvas') as HTMLCanvasElement | null
    if (!c || !c.width) return 0
    const t = document.createElement('canvas')
    t.width = 240
    t.height = 135
    const g = t.getContext('2d')!
    g.drawImage(c, 0, 0, 240, 135)
    const d = g.getImageData(0, 0, 240, 135).data
    const bg = [d[0]!, d[1]!, d[2]!]
    let diff = 0
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i]! - bg[0]!) + Math.abs(d[i + 1]! - bg[1]!) + Math.abs(d[i + 2]! - bg[2]!) > 24) diff++
    }
    return diff / (240 * 135)
  })

test('kitchen01 boots framed, empty, tray-gated, and says no literal "hidden"', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?level=kitchen01')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

  // the camera shows the track, not a cream void
  await expect.poll(() => probe(page), { timeout: 15_000 }).toBeGreaterThan(0.01)

  // the tutorial build is EMPTY of tray pieces and the counter is honest
  await expect(page.locator('#gw-piece-count')).toHaveText('0 of 3 pieces used')
  await expect(page.locator('#gw-ghost-state')).toHaveText('')

  // tray gating: exactly the three tray kinds live, the rest carry a reason
  await expect(page.locator('#gw-tray button')).toHaveCount(13)
  for (const k of ['gapLip', 'drop', 'landing']) {
    await expect(page.locator(`#gw-tray button[data-kind="${k}"]`)).toHaveAttribute(
      'aria-disabled',
      'false',
    )
  }
  for (const k of ['straight', 'curve', 'bigCurve', 'sbend', 'bank', 'loop', 'ramp', 'booster', 'springLauncher', 'finishCup']) {
    const b = page.locator(`#gw-tray button[data-kind="${k}"]`)
    await expect(b).toHaveAttribute('aria-disabled', 'true')
    expect(((await b.getAttribute('title')) ?? '').length).toBeGreaterThan(0)
  }

  // and the word "hidden" appears nowhere in the shell's text
  await expect(page.locator('body')).not.toContainText('hidden')

  expect(errors).toEqual([])
})

test('building all three tray pieces launches, finishes, and shows the result panel', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?level=kitchen01')
  await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

  // the player builds the line: lip -> drop -> landing on the open exits
  await page.click('#gw-tray-gapLip')
  // the BOOT DEFAULT TARGET is the par rail (the start ramp's exit, the
  // chain head of the as-shipped build) — playtest N's chain-order fix
  await expect(page.locator('#gw-target-label')).toContainText('end of the pre-built ramp')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')
  await page.click('#gw-tray-drop')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('2 of 3 pieces used')
  await page.click('#gw-tray-landing')
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toHaveText('3 of 3 pieces used')

  // the tray now says so: every kind of the budget is spent
  await expect(page.locator('#gw-tray-gapLip')).toHaveAttribute('aria-disabled', 'true')

  // launch with a CLICK — the point of this spec: the control sits above
  // the canvas, so focusing it cannot push the world off-screen
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-status')).toContainText('finished')

  // the panel is genuinely ON SCREEN (in the viewport, not just "visible")
  const box = await page.locator('#gw-result').boundingBox()
  const viewport = page.viewportSize()!
  expect(box).not.toBeNull()
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)

  // at least one star for finishing, and the tray-piece tally (3, not 5)
  await expect(page.locator('#gw-result-stars')).toHaveText(/[★☆]{3}/)
  expect(((await page.locator('#gw-result-stars').textContent()) ?? '').includes('★')).toBe(true)
  await expect(page.locator('#gw-result-pieces')).toContainText('3 pieces')
  await expect(page.locator('#gw-result-time')).toHaveText(/^\d+\.\d{2} s — par /)

  // and the panel never prints the word "hidden" either
  await expect(page.locator('body')).not.toContainText('hidden')

  expect(errors).toEqual([])
})
