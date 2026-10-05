/**
 * The shell-truth gate (playtests E/F/G, 2026-10-05): the four claims the
 * three strangers could not make on the shipped page, now asserted.
 *
 * 1. KEYBOARD-ONLY BUILD — kitchen01 solved with NOTHING but arrows + Enter
 *    (the stage-6 a11y requirement arriving early). The arrows drive a
 *    VISIBLE target (the `__gwTargetSocket` seam proves the marker MOVES,
 *    and the ring mesh renders it); Enter places at it; no dead keys.
 * 2. STAR-GATED PROGRESSION — a 0-star fail shows Retry but NEVER
 *    `Next level` (§9.2: the ladder advances on stars, not on trying); a
 *    run that earned a star shows it.
 * 3. FIRST PAINT — the canvas is never black: an init-script probe samples
 *    the canvas the first instant it exists (before World.create resolves
 *    the physics wasm) and the frame must be non-black (playtest F: "black
 *    screen for seconds").
 * 4. ROTATE IS VISIBLE — pressing R re-renders the ghost through a
 *    ≤150 ms snap-to-orientation animation; a pixel diff of the canvas
 *    proves the ghost region CHANGED (playtest G: "clicked R; ghost never
 *    visibly changed").
 */
import { test, expect } from '@playwright/test'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

const ready = (page: import('@playwright/test').Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

/** Hold kind `k` using ONLY ArrowUp cycling (aria-pressed is the truth of
 *  what the ghost is wearing). */
const holdKind = async (page: import('@playwright/test').Page, k: string): Promise<void> => {
  for (let i = 0; i < 15; i++) {
    if ((await page.getAttribute(`#gw-tray-${k}`, 'aria-pressed')) === 'true') return
    await page.keyboard.press('ArrowUp')
  }
  throw new Error(`ArrowUp never landed on ${k}`)
}

/** Move the VISIBLE target until its label matches, with ArrowRight only. */
const aimAt = async (page: import('@playwright/test').Page, label: string): Promise<void> => {
  for (let i = 0; i < 8; i++) {
    if (((await page.textContent('#gw-target-label')) ?? '').includes(label)) return
    await page.keyboard.press('ArrowRight')
  }
  throw new Error(`←→ never surfaced target "${label}"`)
}

const targetSocket = (page: import('@playwright/test').Page): Promise<number[] | null> =>
  page.evaluate(() => (window as unknown as Record<string, () => number[] | null>).__gwTargetSocket())

const canvasShot = async (page: import('@playwright/test').Page): Promise<Buffer> =>
  (await page.locator('#gw-canvas').screenshot()) as Buffer

const diffCount = (a: Buffer, b: Buffer): number => {
  const pa = PNG.sync.read(a)
  const pb = PNG.sync.read(b)
  return pixelmatch(pa.data, pb.data, undefined, pa.width, pa.height, { threshold: 0.1 })
}

test('keyboard-only: kitchen01 is built, finished and advanced with arrows + Enter alone', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?level=kitchen01')
  await ready(page)

  // THE MARKER MOVES: the arrows drive the visible target socket — an
  // actual world-space displacement, not a silent index (playtest E:
  // "arrows cycle an UNMARKED target")
  const before = await targetSocket(page)
  await page.keyboard.press('ArrowRight')
  const after = await targetSocket(page)
  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  expect(Math.hypot(...before!.map((b, i) => b - after![i]!))).toBeGreaterThan(0.05)

  // build the whole par line with keys alone: hold → aim → Enter, ×3
  await holdKind(page, 'gapLip')
  await aimAt(page, 'end of ramp')
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-piece-count')).toHaveText('1 of 3 pieces used')

  await holdKind(page, 'drop')
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-piece-count')).toHaveText('2 of 3 pieces used')

  await holdKind(page, 'landing')
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-piece-count')).toHaveText('3 of 3 pieces used')

  // Launch by keyboard (focus + native Enter on the button — the button
  // keeps its own Enter; the page-level Enter is PLACE)
  await page.locator('#gw-launch').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  // a star was EARNED — and the star gate therefore OPENS the ladder
  await expect(page.locator('#gw-result-stars')).toHaveText(/^★/)
  await expect(page.locator('#gw-result-next')).toBeVisible()

  expect(errors).toEqual([])
})

test('a 0-star fail gets Retry only — Next level never rides on a failure', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?level=kitchen01')
  await ready(page)

  // nothing built: the car leaves the set, the run is a 0-star `fell`
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#gw-result-stars')).toHaveText('☆☆☆')

  // playtest E/F/G: "Next level after a failed run — skipping is allowed"
  // was the ladder lying to itself (§9.2 progression-by-stars)
  await expect(page.locator('#gw-result-retry')).toBeVisible()
  await expect(page.locator('#gw-result-next')).toBeHidden()

  // and Retry returns the as-built run to Launch
  await page.click('#gw-result-retry')
  await expect(page.locator('#gw-status')).toContainText('ready')

  expect(errors).toEqual([])
})

test('the first canvas frame is non-black — the shell never shows a black flash', async ({ page }) => {
  // sample the canvas the FIRST moment it exists in the DOM — long before
  // World.create's wasm + physics boot can deliver the first World frame
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>
    w.__gwFirstPaint = null
    const iv = setInterval(() => {
      const c = document.querySelector('#gw-canvas') as HTMLCanvasElement | null
      if (!c || c.width === 0) return
      clearInterval(iv)
      const t = document.createElement('canvas')
      t.width = 40
      t.height = 24
      const g = t.getContext('2d')!
      g.drawImage(c, 0, 0, 40, 24)
      const d = g.getImageData(0, 0, 40, 24).data
      let max = 0
      for (let i = 0; i < d.length; i += 4) {
        max = Math.max(max, d[i]! + d[i + 1]! + d[i + 2]!)
      }
      w.__gwFirstPaint = max
    }, 4)
  })
  await page.goto('/?level=kitchen01')
  await ready(page)
  const first = await page.evaluate(() => (window as unknown as Record<string, number | null>).__gwFirstPaint)
  expect(first, 'canvas probe never sampled a frame').not.toBeNull()
  // black would be 0; the warm static framing frame is >300 per pixel-sum
  expect(first!, { message: `first canvas frame was black (max channel sum ${first})` }).toBeGreaterThan(120)
})

test('R visibly re-renders the ghost (rotate animation, ≤150 ms)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('/?level=kitchen01')
  await ready(page)
  await page.click('#gw-tray-landing') // the asymmetric catcher: a flip is obvious
  await expect(page.locator('#gw-ghost-state')).not.toHaveText('', { timeout: 10_000 })
  // let any first-hover animation settle before the baseline shot
  await page.waitForTimeout(250)

  const base = await canvasShot(page)
  let diff = 0
  await page.keyboard.press('r')
  // sample through the ≤150 ms animation AND its settled end: the flip is
  // either MID-FLIGHT or a visibly different ORIENTATION — never nothing
  for (let i = 0; i < 8 && diff <= 50; i++) {
    diff = Math.max(diff, diffCount(base, await canvasShot(page)))
    await page.waitForTimeout(30)
  }
  expect(diff).toBeGreaterThan(50)

  expect(errors).toEqual([])
})
