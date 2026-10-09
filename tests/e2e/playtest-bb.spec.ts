/**
 * Playtest BB (stage 5, fresh eyes at 1280x720) — the shell-coherence items
 * the playtest filed, asserted on the built page:
 *
 * 1. PLACE WITH THE MODAL UP IS NEVER SILENT (BB item 2: "Place button
 *    click while result modal open: no-op, no feedback"). A place INTENT
 *    (button, Enter, canvas click — one hook, `onPlaceIntent`) collapses
 *    the panel into the build view BEFORE the attempt: the success path
 *    places visibly, and every refusal lands its line on a live board.
 * 2. THE FAILURE CAPTION RIDEs THE BOTTOM STRIP (BB item 6: "failure toast
 *    renders mid-canvas and hides the ball's fate during the flight
 *    camera"). Across the death second the panel's rect and the ball's
 *    projected screen point (the `__gwCarNdc` seam, same NDC space the
 *    goal-frame law uses) NEVER overlap; a finished run keeps the centred
 *    panel.
 * 3. THE DEV-PREVIEW BADGE (BB item 5: "?level= loads a locked level; the
 *    map shows it locked"). Debug addressing stands, but a locked campaign
 *    rung says what it is — and mints nothing: no star is written from a
 *    dev-preview finish. The share/replay page wears no badge.
 */
import { test, expect, type Page } from '@playwright/test'
import { goto } from './goto.ts'

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

/** Wait (in-page, cheap) until the result panel shows; returns once visible. */
const waitPanel = (page: Page) =>
  page
    .waitForFunction(() => {
      const el = document.getElementById('gw-result')
      return !!el && !el.hidden
    }, undefined, { timeout: 60_000 })
    .then(() => undefined)

const cameraPose = (page: Page): Promise<number[]> =>
  page.evaluate(() => (window as unknown as Record<string, () => { pos: number[] }>).__gwCameraPose().pos)

const dist = (a: number[], b: number[]): number => Math.hypot(...a.map((v, i) => v - b[i]!))

test.describe('place with the result modal up (BB item 2)', () => {
  test('a held Place auto-dismisses the panel into the build view, THEN places', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))

    await goto(page, '/?level=bedroom02')
    await ready(page)
    const home = await cameraPose(page)

    await page.click('#gw-launch')
    await waitPanel(page)

    // BB's exact gesture: pick a piece up, hit Place, panel still open
    await page.click('#gw-tray-straight')
    await page.click('#gw-place')

    // the panel is AWAY (collapsed into the build view) and the piece is
    // ON — a placement, not a swallowed click
    await expect(page.locator('#gw-result')).toBeHidden({ timeout: 10_000 })
    await expect(page.locator('#gw-piece-count')).toHaveText('1 of 5 pieces used')
    await expect(page.locator('#gw-status')).toContainText('ready — 1 of 5 pieces used')
    // and the view walked home from the death hold — the placement lands
    // in a board the player can see
    await expect
      .poll(() => cameraPose(page).then((p) => dist(p, home)), { timeout: 30_000 })
      .toBeLessThan(0.01)
    expect(errors).toEqual([])
  })

  test('a refusal behind the modal speaks on the live board — never silence', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))

    await goto(page, '/?level=bedroom02')
    await ready(page)

    await page.click('#gw-launch')
    await waitPanel(page)

    // Empty-handed Place: the button SAYS the piece is not in hand (BB:
    // the click was silent), and it does NOT collapse the modal — an empty
    // intent is not a build intent, and the world's Enter/button dismisses
    // nothing without a piece behind it (playtest Q's focus law, kept
    // intact).
    await page.click('#gw-place', { force: true })
    await expect(page.locator('#gw-ghost-state')).toContainText('nothing in hand')
    await expect(page.locator('#gw-result')).toBeVisible()

    // the blocked-fit refusal with a piece HELD and the modal up: the
    // panel collapses into the build view and the blocked line stands on a
    // live board
    await page.click('#gw-launch')
    await waitPanel(page)
    await page.click('#gw-tray-landing')
    await page.click('#gw-place')
    await expect(page.locator('#gw-result')).toBeHidden({ timeout: 10_000 })
    await expect(page.locator('#gw-ghost-state')).toContainText('blocked')
    // nothing was placed by the swallowed-intent gesture either way
    await expect(page.locator('#gw-piece-count')).toHaveText('0 of 5 pieces used')
    expect(errors).toEqual([])
  })
})

test.describe('the failure caption never covers the ball (BB item 6)', () => {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 960, height: 540 }]) {
    test.use({ viewport })

    test(`the strip's rect misses the ball's screen point across the death second at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(String(err)))

      await goto(page, '/?launch=1')
      await waitPanel(page)
      await expect(page.locator('#gw-result')).toHaveClass(/gw-result-strip/)

      // the death second: sample the ball's projected point against the
      // whole strip's rect for ~1.2 s of the end-hold
      const overlaps = await page.evaluate(async () => {
        const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
        const hits: unknown[] = []
        for (let i = 0; i < 10; i++) {
          const ndc = (window as unknown as Record<string, () => number[] | null>).__gwCarNdc()
          const c = document.querySelector('#gw-stage canvas')!.getBoundingClientRect()
          const p = document.getElementById('gw-result')!.getBoundingClientRect()
          if (ndc) {
            const x = c.x + (ndc[0] * 0.5 + 0.5) * c.width
            const y = c.y + (0.5 - ndc[1] * 0.5) * c.height
            if (x >= p.x && x <= p.right && y >= p.y && y <= p.bottom) hits.push({ x, y, p: [p.x, p.y, p.width, p.height] })
          }
          await wait(120)
        }
        return hits
      })
      expect(overlaps).toEqual([])
      // the caption is still READABLE where it stands
      await expect(page.locator('#gw-result-note')).toBeInViewport()
      expect(errors).toEqual([])
    })
  }

  test('a finished run keeps the centred panel', async ({ page }) => {
    await goto(page, '/?build=par&launch=1')
    await waitPanel(page)
    await expect(page.locator('#gw-result')).not.toHaveClass(/gw-result-strip/)
    await expect(page.locator('#gw-result-stars')).toHaveText('★★★')
  })
})

test.describe('the dev-preview badge on a locked ?level= (BB item 5)', () => {
  test('a locked rung loaded by URL wears the honest badge', async ({ page }) => {
    await goto(page, '/?level=bedroom02')
    await ready(page)
    await expect(page.locator('#gw-dev-preview')).toBeVisible()
    await expect(page.locator('#gw-dev-preview')).toHaveText(
      /^dev preview — progress from here won.t unlock anything$/,
    )
  })

  test('an unlocked rung wears nothing', async ({ page }) => {
    await goto(page, '/?level=kitchen01')
    await ready(page)
    await expect(page.locator('#gw-dev-preview')).toHaveCount(0)
  })

  test('finishing a dev preview mints nothing: no star enters the save', async ({ page }) => {
    await goto(page, '/?level=bedroom02&build=par&launch=1')
    await waitPanel(page)
    await expect(page.locator('#gw-result-stars')).not.toHaveText('☆☆☆')
    const stars = await page.evaluate(
      () => JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}')?.progress?.stars ?? {},
    )
    expect(stars['bedroom02'] ?? 0).toBe(0)
    // and Next stays gated: the dev-preview rung offers no ladder hop
    await expect(page.locator('#gw-result-next')).toBeHidden()
  })

  test('the share/replay page wears no badge, even for a locked rung', async ({ page }) => {
    // make the link from a dev-preview finish of the LOCKED bedroom02…
    await goto(page, '/?level=bedroom02&build=par&launch=1')
    await waitPanel(page)
    await page.click('#gw-result-share')
    await expect(page.locator('#gw-result-share-row')).toBeVisible()
    const url = await page.locator('#gw-result-share-url').inputValue()
    expect(url).toMatch(/#s=[A-Za-z0-9_-]+$/)
    // …a friend opening it lands on the replay page: no badge anywhere
    await goto(page, url)
    await expect(page.locator('#gw-replay-status')).toHaveText('verified', { timeout: 90_000 })
    await expect(page.locator('#gw-dev-preview')).toHaveCount(0)
  })
})
