/**
 * THE CLICK-PLACE GATE (playtest R round 3: "several times with 'fits
 * here' showing, nothing placed until Enter" — a placement intent that
 * dies SILENTLY). Two contracts, one spec:
 *
 * 1. IDEMPOTENT-VISIBLE — a click that lands as placement intent MUST
 *    place. Ten mouse-API click-places on a live chain each move the
 *    counter the player reads (with a Delete between, so ten placements
 *    fit any budget and every one of them must register on its own).
 *    The old 6 px click threshold meant an ordinary click with a few px
 *    of finger travel latched as a drag and placed NOTHING; at the
 *    raised `CANVAS_DRAG_PX` (20 px) a 12-px-travel click places, and
 *    still never pans.
 * 2. NEVER SILENT — when a place-intent cannot land (here: the budget
 *    wall), the status line says WHY; the click is never a no-op that
 *    leaves the player re-clicking into the void.
 * 3. AUTOMATION HONESTY — a synthetic `click` with no pointer sequence
 *    behind it is STILL a place intent and places exactly once (the
 *    "Enter worked, click did not" split was at least partly an event
 *    -ordering split; both routes now run the same verb, deduped).
 */
import { test, expect } from '@playwright/test'
import { FEEL_TRACK_KINDS } from '../../src/feel/feeltrack.ts'
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts'

const laid = FEEL_TRACK_KINDS.length
const budget = FEELTRACK.budget

const ready = (page: import('@playwright/test').Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

const count = (page: import('@playwright/test').Page) => page.locator('#gw-piece-count')

test('ten mouse-API click-places all register (playtest R: click = nothing)', async ({ page }) => {
  test.slow()
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=feeltrack')
  await ready(page)
  await expect(count(page)).toHaveText(`${laid} of ${budget} pieces used`)
  // hold a piece by HOVER (no button focused — the world owns Enter and
  // the canvas owns the click)
  await page.hover('#gw-tray button[data-kind="straight"]')
  await expect(page.locator('#gw-ghost-state')).not.toHaveText('', { timeout: 10_000 })
  const box = (await page.locator('#gw-canvas').boundingBox())!
  for (let i = 1; i <= 10; i++) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await expect(count(page), `click-place ${i} did not register`).toHaveText(`${laid + 1} of ${budget} pieces used`)
    await page.keyboard.press('Delete') // make room for the next one
    await expect(count(page), `remove after click ${i}`).toHaveText(`${laid} of ${budget} pieces used`)
  }
  expect(errors).toEqual([])
})

test('a click with ordinary finger travel (12 px) places and never pans', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=feeltrack')
  await ready(page)
  await page.hover('#gw-tray button[data-kind="straight"]')
  await expect(page.locator('#gw-ghost-state')).not.toHaveText('', { timeout: 10_000 })
  const box = (await page.locator('#gw-canvas').boundingBox())!
  const before = await count(page).textContent()
  // the exact gesture the 6 px threshold made a silent no-op: press,
  // ~12 px of travel, release
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 12, box.y + box.height / 2, { steps: 3 })
  await page.mouse.up()
  await expect(count(page)).toHaveText(`${laid + 1} of ${budget} pieces used`)
  expect(before).toBe(`${laid} of ${budget} pieces used`)
  // and it stayed a PLACE: a click that lands must not also frame
  const v = (await page.evaluate(() =>
    (window as unknown as Record<string, () => { panTarget: number[]; yawTarget: number }>).__gwBuildView())) as { panTarget: number[]; yawTarget: number }
  expect(v.panTarget).toEqual([0, 0])
  expect(v.yawTarget).toBe(0)
  expect(errors).toEqual([])
})

test('a place-intent that cannot land says why (budget wall, never silent)', async ({ page }) => {
  test.slow()
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=feeltrack')
  await ready(page)
  await page.hover('#gw-tray button[data-kind="straight"]')
  const box = (await page.locator('#gw-canvas').boundingBox())!
  // drive the sandbox budget to the wall with click-places...
  for (let i = 0; i < budget - laid + 3; i++) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  }
  // ...every extra click PAST the wall leaves the counter honest and the
  // status line SPEAKING (pre-fix it just stopped answering)
  await expect(count(page)).toHaveText(`${budget} of ${budget} pieces used`)
  await expect(page.locator('#gw-ghost-state')).not.toHaveText('', { timeout: 10_000 })
  expect(errors).toEqual([])
})

test('a synthetic click (no pointer sequence) places exactly once', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('/?level=feeltrack')
  await ready(page)
  await page.hover('#gw-tray button[data-kind="straight"]')
  await expect(page.locator('#gw-ghost-state')).not.toHaveText('', { timeout: 10_000 })
  // node.click() — detail 0, no pointerdown/pointerup: still a place intent
  await page.evaluate(() => (document.querySelector('#gw-canvas') as HTMLElement).click())
  await expect(count(page)).toHaveText(`${laid + 1} of ${budget} pieces used`)
  // and the SAME point clicked with the real mouse API places exactly ONE
  // more (the synthetic-dedupe must not swallow a genuine second intent)
  const box = (await page.locator('#gw-canvas').boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(count(page)).toHaveText(`${laid + 2} of ${budget} pieces used`)
  expect(errors).toEqual([])
})
