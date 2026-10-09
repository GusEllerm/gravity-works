/**
 * Playtest AA (stage 5, fresh eyes at 1280x720) — the four player-surface
 * items the playtest filed, asserted on the built page:
 *
 * 1. SHARE EXISTS (AA: "no share button exists anywhere… I'd send replays
 *    to a friend if the game would hand me a link"): the result panel's
 *    `Share this run` produces the `#s=` link (clipboard when allowed, a
 *    visible readonly input regardless), and THAT link opens the replay
 *    page and verifies — the acceptance line, end to end, no hand-forging.
 * 2. ESC CLOSES THE OVERLAY FIRST (AA: "Home did nothing with the failure
 *    overlay up — camera stayed parked in a far failure vista"): the first
 *    Escape dismisses the panel and walks the framing home; the second is
 *    a lone first half of the camera's chord and does nothing violent.
 * 3. THE PANEL NEVER YANKS SCROLL (AA: "the results card yanks the page
 *    scroll — I lost the canvas twice"): opening or closing the panel at
 *    1280x720 AND 1280x633 moves no scroll and no canvas rect, and the
 *    panel is still fully on screen (anchored, not scrolled-to).
 * 4. ONE "OTHER SPOT" KEY (AA: "one level says press J, the next says
 *    press ]"): the tray-hint line — the other source beside the tie
 *    tail — names `]`, the key the bindings actually speak.
 */
import { test, expect, type Page } from '@playwright/test'
import { goto } from './goto.ts'

const ready = (page: Page) => expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

const cameraPose = (page: Page): Promise<number[]> =>
  page.evaluate(() => (window as unknown as Record<string, () => { pos: number[] }>).__gwCameraPose().pos)

const dist = (a: number[], b: number[]): number => Math.hypot(...a.map((v, i) => v - b[i]!))

test('the panel shares the run: the produced link opens the replay page and verifies', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await goto(page, '/?build=par&launch=1')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })

  // AA's exact want: a control ON the panel that hands over a link
  await expect(page.locator('#gw-result-share')).toBeVisible()
  await page.click('#gw-result-share')

  // the visible-link fallback is there whether or not the clipboard spoke
  await expect(page.locator('#gw-result-share-row')).toBeVisible()
  const url = await page.locator('#gw-result-share-url').inputValue()
  expect(url).toMatch(/#s=[A-Za-z0-9_-]+$/)
  await expect(page.locator('#gw-result-share-note')).not.toBeHidden()
  // the card PNG rides along once a link exists (brief §9.4, reused machinery)
  await expect(page.locator('#gw-result-share-card')).toBeVisible()

  // THE ACCEPTANCE LINE: a friend's click on that URL opens the replay and
  // the hash verdict is honest
  await goto(page, url)
  await expect(page.locator('#gw-replay-status')).toHaveText('verified', { timeout: 90_000 })
  expect(errors).toEqual([])
})

test('Escape closes the failure overlay and brings the view home; the second Escape is harmless', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await goto(page, '/')
  await ready(page)
  const home = await cameraPose(page)

  // a bare-build launch falls: the failure overlay comes up over the wide
  // death hold — the state AA found un-exitable ("camera parked in a far
  // failure vista", Esc twice doing nothing)
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await page.waitForTimeout(500) // let the death hold settle — it MUST differ from home
  const vista = await cameraPose(page)
  expect(dist(vista, home)).toBeGreaterThan(0.01)

  // FIRST Escape: overlay away, framing walking home
  await page.keyboard.press('Escape')
  await expect(page.locator('#gw-result')).toBeHidden()
  await expect
    .poll(() => cameraPose(page).then((p) => dist(p, home)), { timeout: 30_000 })
    .toBeLessThan(0.01)

  // SECOND Escape: a lone first half of the camera's chord — the view it is
  // not even aimed at is already home, so it must move nothing
  const back = await cameraPose(page)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  const after = await cameraPose(page)
  expect(dist(after, back)).toBeLessThan(1e-3)
  await expect(page.locator('#gw-result')).toBeHidden()

  expect(errors).toEqual([])
})

for (const viewport of [{ width: 1280, height: 720 }, { width: 1280, height: 633 }]) {
  test.describe(`the panel never yanks the page scroll at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport })

    test('open and close leave scrollY and the canvas rect exactly where they were', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(String(err)))

      await goto(page, '/?build=par')
      await ready(page)
      // the AA state: a reader scrolled to look at something under the
      // world (help thumbnails, the status lines) when the run ends
      await page.evaluate(() => document.querySelector('#gw-hash-details')?.scrollIntoView())
      await page.waitForTimeout(200)
      const scrollBefore = await page.evaluate(() => window.scrollY)
      const canvasBefore = await page.evaluate(() => {
        const r = document.querySelector('#gw-stage canvas')!.getBoundingClientRect()
        return { x: r.x, y: r.y, w: r.width, h: r.height }
      })

      // a JS click keeps the scroll (a Playwright click of a below-fold
      // control would itself scroll — that is not the player's gesture)
      await page.evaluate(() => (document.querySelector('#gw-launch') as HTMLButtonElement).click())
      await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })

      // no yank: the canvas has not moved by a pixel, the scroll has not
      // moved at all, and the panel is fully ON the screen the reader is
      // looking at (anchored there, not scrolled into view)
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore)
      expect(await page.evaluate(() => {
        const r = document.querySelector('#gw-stage canvas')!.getBoundingClientRect()
        return { x: r.x, y: r.y, w: r.width, h: r.height }
      })).toEqual(canvasBefore)
      const box = await page.locator('#gw-result').boundingBox()
      expect(box).not.toBeNull()
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)

      // closing (Retry) must not yank either
      await page.click('#gw-result-retry')
      await expect(page.locator('#gw-result')).toBeHidden()
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore)
      expect(await page.evaluate(() => {
        const r = document.querySelector('#gw-stage canvas')!.getBoundingClientRect()
        return { x: r.x, y: r.y, w: r.width, h: r.height }
      })).toEqual(canvasBefore)

      expect(errors).toEqual([])
    })
  })
}

test('every "other spot" hint names the same key: ] (the binding)', async ({ page }) => {
  await goto(page, '/')
  await ready(page)
  await page.click('#gw-tray-drop')
  // source 1 — the one-line tray lesson; source 2 is the live tie tail on
  // #gw-target-label ("press ] for the other one" / "for the next one"),
  // proven by aim-depth.spec. No player line names any other key for the
  // same verb (the arrows stay bound but are never ADVERTISED for it)
  await expect(page.locator('#gw-tray-hint')).toContainText('press ] for the other spot')
  expect(await page.locator('#gw-tray-hint').textContent()).not.toMatch(/[A-Z],/)
})
