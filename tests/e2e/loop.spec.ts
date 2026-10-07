import { test, expect } from '@playwright/test'

/**
 * The playtest-fix spec (2026-10-05 stage 3): everything three fresh-eye
 * players could not do on the DEPLOYED page, asserted against the built
 * app at the viewport a human actually uses (Desktop Chrome, 1280x720 —
 * the specs must fail where the playtesters failed, not only where
 * Playwright's click-scrolling hides the bug):
 *
 * 1. the result panel is IN THE VIEWPORT at run end even when the reader
 *    had scrolled to look for the result — the deployed "panel invisible"
 *    bug (3/3): a stage-corner panel on a page taller than the window
 *    lands off-screen the moment the reader scrolls;
 * 2. the loop closes — the panel states the par lines behind the stars,
 *    Retry returns the as-built run to Launch in one click, Launch is
 *    pressable after ANY terminal status, Next level walks the ladder;
 * 3. the permanent Retry (as-built, beside Launch — the same `resetCar`
 *    wiring the panel's Retry carries, playtest N) returns the car and the
 *    view home without touching the build;
 * 4. the run camera MOVES the render camera while the run plays (§7.3 on
 *    the live path — the deployed run was unreadable), and hands the view
 *    back at the end;
 * 5. placement is teachable: holding a tray piece shows the one-line
 *    instruction until the first placement, and disabled tray buttons
 *    carry a VISIBLE reason (aria-describedby onto on-screen text).
 */

const ready = (page: import('@playwright/test').Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

const buildAllThree = async (page: import('@playwright/test').Page): Promise<void> => {
  for (const k of ['gapLip', 'drop', 'landing']) {
    await page.click(`#gw-tray-${k}`)
    if (k === 'gapLip') {
      // the boot default target sits on the PAR rail — the start ramp's
      // open exit — so the first Place begins the par line with no aiming
      // at all (playtest N's chain-order wall)
      await expect(page.locator('#gw-target-label')).toContainText('end of ramp')
    }
    await page.click('#gw-place')
    await expect(page.locator('#gw-piece-count')).toContainText(
      `${['gapLip', 'drop', 'landing'].indexOf(k) + 1} of 3`,
    )
  }
}

const cameraPose = (page: import('@playwright/test').Page): Promise<number[]> =>
  page.evaluate(() => (window as unknown as Record<string, () => { pos: number[] }>).__gwCameraPose().pos)

/**
 * Click Launch for a RE-launch, honestly: a click landing while a run is
 * in flight legitimately restarts it, so a naive click-until-panel loop
 * races the ~2 s run forever on a slow runner (this hung on the CI box
 * where SwiftShader makes actionability scans slow). Click only when the
 * status line proves nothing is running, retry if the click itself loses
 * the running-transition race, and never time the test out on it.
 */
const launchAgain = async (page: import('@playwright/test').Page): Promise<void> => {
  for (let attempt = 0; attempt < 8; attempt++) {
    const status = (await page.locator('#gw-status').textContent()) ?? ''
    if (status.includes('running')) {
      await page.waitForFunction(
        () => !document.querySelector('#gw-status')?.textContent?.includes('running'),
        undefined,
        { timeout: 60_000 },
      )
      return
    }
    try {
      await page.click('#gw-launch', { timeout: 5_000 })
      return
    } catch {
      await page.waitForTimeout(800)
    }
  }
  throw new Error('Launch never took a click')
}

test('the end-of-run panel is in the viewport even when the page was scrolled', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/')
  await ready(page)

  // a human scrolls down to read under the canvas (status, hash, callouts)
  // — exactly where all three playtesters read their results — and launches
  // without scrolling back (Space/Enter on the still-focused Launch does
  // the same; a JS click keeps the scroll, which is the state that hid the
  // panel in the deployed page)
  await page.evaluate(() => document.querySelector('#gw-status')?.scrollIntoView())
  const scrolledTo = await page.evaluate(() => window.scrollY)
  expect(scrolledTo).toBeGreaterThan(40)
  await page.evaluate(() => (document.querySelector('#gw-launch') as HTMLButtonElement).click())

  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  // the panel is not just "visible" — it is ON the screen the human is looking at
  const box = await page.locator('#gw-result').boundingBox()
  const viewport = page.viewportSize()!
  expect(box).not.toBeNull()
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)

  expect(errors).toEqual([])
})

test('the result states the par rules, and Retry / Launch / Next close the loop', async ({ page }) => {
  // several full runs deep on a shared CI runner — the slow lane is the
  // runner, not the assertion (launchAgain keeps it honest)
  test.slow()
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/')
  await ready(page)
  await buildAllThree(page)

  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  // the rules behind the stars are ON the panel, not folklore (playtest B)
  await expect(page.locator('#gw-result-rules')).toContainText('finish the run')
  await expect(page.locator('#gw-result-pieces')).toContainText('3 pieces — par 3')
  await expect(page.locator('#gw-result-time')).toContainText('— par')

  // Launch itself is pressable straight from a finished status (the
  // stall→launch→stall limbo with no feedback)
  await launchAgain(page)
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })

  // Retry: as-built, one click back to Launch — pieces stay, car goes home
  await page.click('#gw-result-retry')
  await expect(page.locator('#gw-status')).toContainText('ready')
  await expect(page.locator('#gw-result')).toBeHidden()
  await expect(page.locator('#gw-piece-count')).toHaveText('3 of 3 pieces used')

  // Next level: the ladder walks forward
  await launchAgain(page)
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await page.click('#gw-result-next')
  await expect(page).toHaveURL(/level=kitchen02/)
  await ready(page)

  expect(errors).toEqual([])
})

test('the permanent Retry returns the car and the view home after a terminal status', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/')
  await ready(page)
  const home = await cameraPose(page)

  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })

  await page.click('#gw-reset')
  await expect(page.locator('#gw-status')).toContainText('ready')
  await expect(page.locator('#gw-result')).toBeHidden()
  const back = await cameraPose(page)
  expect(Math.hypot(...back.map((b, i) => b - home[i]!))).toBeLessThan(1e-6)

  expect(errors).toEqual([])
})

test('the run camera follows on the live path', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?build=par&launch=1')
  await expect(page.locator('#gw-status')).toContainText('running', { timeout: 60_000 })
  const a = await cameraPose(page)
  // §7.3: the render camera must travel while the car travels — a static
  // wide shot through a 2.2 s run is exactly what the players saw.
  // Measured by POLLING for the farthest pose seen, not by one fixed
  // 600 ms wall window: the run is rAF-paced (a stalled software-GL frame
  // — swiftshader — can put the whole window inside one frame, which is
  // how this read went deterministically ~0 under forced SwiftShader);
  // the max-across-polls keeps the claim true even when the run ENDS and
  // the camera hands the view back to the static framing (see the
  // end-bury lift in src/camera/run-camera.ts).
  let seen = 0
  await expect
    .poll(() => {
      return cameraPose(page).then((b) => {
        seen = Math.max(seen, Math.hypot(...b.map((v, i) => v - a[i]!)))
        return seen
      })
    }, { timeout: 60_000 })
    .toBeGreaterThan(0.05)

  expect(errors).toEqual([])
})

test('holding a tray piece teaches Place, and disabled buttons say why', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/')
  await ready(page)
  await expect(page.locator('#gw-tray-hint')).toBeHidden()

  // the reason line is on-screen text, and locked buttons point at it
  await expect(page.locator('#gw-tray-reason')).toContainText('not in this level')
  await expect(page.locator('#gw-tray-straight')).toHaveAttribute('aria-describedby', 'gw-tray-reason')

  // hold a live piece: the one-line instruction appears next to the tray
  await page.click('#gw-tray-drop')
  await expect(page.locator('#gw-tray-hint')).toHaveText('Aim: hover the world or ←→ · Place: click the world or Enter · Flip: R · Look: right-drag · Home: Esc Esc')

  // a click on a greyed piece explains itself in the live status line
  // (dispatchEvent: the button is aria-disabled but focusable — the real
  // mouse still fires it, Playwright's actionability check would not)
  await page.dispatchEvent('#gw-tray-straight', 'click')
  await expect(page.locator('#gw-ghost-state')).toContainText('not in this level')

  // the first successful placement retires the lesson
  await page.click('#gw-place')
  await expect(page.locator('#gw-piece-count')).toContainText('1 of 3')
  await expect(page.locator('#gw-tray-hint')).toBeHidden()

  expect(errors).toEqual([])
})
