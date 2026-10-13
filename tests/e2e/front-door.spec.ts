/**
 * THE FRONT DOOR (downhill build 2, Decision Log law 3 — "the home screen
 * becomes THE HOUSE, rendered — the crane's path parked as the menu camera
 * it always was; this is the irreversible UI act"). The bare route boots
 * the house page in HOME mode (`src/pages/house.ts`, routed by
 * `src/boot.ts`): the cross-section under the parked wide crane, the six
 * windows as the interactive level select, the house run as the
 * front-door act, and the corner chrome keeping its corners.
 *
 * The law this file executes, per surface:
 * - THE WINDOWS ARE THE BOARD — real buttons, in the Tab walk (a11y:
 *   named "kitchen, 5 rungs, toured", Enter enters, and the global focus
 *   ring — the 8.7:1 receipt in `src/ui/shell.css` — reads on the cream
 *   cross-section exactly as it reads on paper);
 * - TOURS BYTE-COMPATIBLE — each window's rung links are the UNCHANGED
 *   `?level=<room>NN` bytes (the greenlight's proof, re-asserted at the
 *   new address), locked rungs stay locks;
 * - STARS ON THE SILL — toured rooms wear the save's folded number,
 *   never a mirrored string;
 * - THE OLD FRONT END IS ADDRESSED — `?boot=rung` lands the rung builder
 *   (every non-visual spec rides it through `tests/e2e/goto.ts`);
 *   the `?levels=1` board and every campaign pixel ride this commit
 *   untouched (law 3's re-baseline is the ENUMERATION in
 *   `Sessions/2026-10-12 Front door.md`, not a quiet move);
 * - THE RUN IS THE ACT — the front-door release verifies its own hash
 *   against this Node process (the cold-load tripwire, extended).
 */
import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'
import { replayRun } from '../../src/replay/replay.ts'
import { HOUSE } from '../../src/world/levels/house.level.ts'
import { CAMPAIGN_LADDER } from '../../src/world/campaign.ts'

const ROOMS = ['kitchen', 'bedroom', 'bathroom', 'garden', 'garage', 'porch'] as const

const PAR = HOUSE.parBuild()
let REFPromise: Promise<Awaited<ReturnType<typeof replayRun>>> | null = null
const ref = () => (REFPromise ??= replayRun(HOUSE, PAR, {}))

function seedAllStars(): string {
  return `
  const save = { v: 2, builds: {}, settings: {}, progress: { stars: {}, reached: {} } }
  for (const id of ${JSON.stringify(CAMPAIGN_LADDER)}) save.progress.stars[id] = 3
  localStorage.setItem('gravity-works.save', JSON.stringify(save))
  `
}

/** Press Tab until focus lands on `selector` — the REAL walk (the a11y
 *  spec's discipline: an audit that cheats with focus() audits nothing). */
async function tabTo(page: import('@playwright/test').Page, selector: string, max = 60): Promise<string[]> {
  const seen: string[] = []
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const name = await page.evaluate(() => {
      const a = document.activeElement
      if (!a || a === document.body) return 'body'
      if (a.id) return `#${a.id}`
      return a.tagName.toLowerCase()
    })
    seen.push(name)
    if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) return seen
    if (name === 'body' && seen.filter((n) => n === 'body').length > 3) break
  }
  throw new Error(`tab walk never reached ${selector}: ${seen.join(' → ')}`)
}

test.describe('the front door — the bare route is the house', () => {
  test('the cross-section boots with six windows, the parked crane, and the corner chrome', async ({ page }) => {
    await page.goto('/?boot=house') // the explicit home face; webdriver ≠ first visit
    await page.waitForFunction(() => typeof (window as any).__gwHouseState === 'function', undefined, { timeout: 60_000 })
    await expect(page.locator('h1')).toContainText('Gravity Works')
    await expect(page.locator('#gw-house-windows section')).toHaveCount(6)
    await expect(page.locator('#gw-launch')).toBeVisible()
    // the corner chrome kept its corners
    await expect(page.locator('#gw-daily-board')).toHaveAttribute('href', '?daily=1')
    await expect(page.locator('#gw-daily-board')).toContainText('today’s board')
    await expect(page.locator('#gw-lines-corner')).toBeVisible()
    await page.click('#gw-lines-corner')
    await expect(page.locator('#gw-lines-corner-panel')).toBeVisible()
    await expect(page.locator('#gw-lines-corner-panel')).toContainText('Published by the house')
    // the menu camera is the wide parked crane, not a room close-up: the
    // pose seam answers with the pure `homePose` the windows project through
    const pose = await page.evaluate(() => (window as any).__gwHouseCameraPose())
    expect(pose.eye[2]).toBeGreaterThan(8) // pulled back across the whole descent
  })

  test('every window is a tab stop with a name that reads the room, and Enter enters', async ({ page }) => {
    test.slow() // THE FURNISHED BUDGET (Lane F1): every evaluate/keypress on a
    // six-set page blocks on the frame; on a shared runner that is ~4× the
    // pre-furnishing cost. The ASSERTIONS are untouched — names, ring,
    // bytes, Enter; only the wall clock was re-measured.
    await page.addInitScript(seedAllStars())
    await page.goto('/?boot=house')
    await page.waitForFunction(() => typeof (window as any).__gwHouseState === 'function', undefined, { timeout: 60_000 })
    for (const room of ROOMS) {
      await tabTo(page, `#gw-house-window-${room}`)
      // named: "<room>, 5 rungs, toured, 15 of 15 stars" (all-starred save)
      await expect(page.locator(`#gw-house-window-${room}`)).toHaveAttribute(
        'aria-label',
        `${room}, 5 rungs, toured, 15 of 15 stars`,
      )
      // a clean focus ring reads on the cross-section (the contrast gate's
      // receipt: the global 3 px ring survives into the overlay)
      const outline = await page.evaluate(
        () => getComputedStyle(document.activeElement as HTMLElement).outlineWidth,
      )
      expect(outline).toBe('3px')
    }
    // Enter enters: the kitchen window opens its tours in place
    await tabTo(page, '#gw-house-window-kitchen')
    await page.keyboard.press('Enter')
    await expect(page.locator('#gw-house-window-kitchen')).toHaveAttribute('aria-expanded', 'true')
    const links = page.locator('#gw-house-tours-kitchen a')
    await expect(links).toHaveCount(5)
    const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))
    expect(hrefs).toEqual(['kitchen01', 'kitchen02', 'kitchen03', 'kitchen04', 'kitchen05'].map((id) => `?level=${id}`))
  })

  test('toured rooms wear their stars on the sill; untouched rooms wear nothing', async ({ page }) => {
    await page.addInitScript(`
      const save = { v: 2, builds: {}, settings: {}, progress: { stars: { kitchen01: 3, kitchen02: 2 }, reached: {} } }
      localStorage.setItem('gravity-works.save', JSON.stringify(save))
    `)
    await page.goto('/?boot=house')
    await expect(page.locator('#gw-house-window-kitchen .gw-window-sill')).toHaveText('★ 5/15')
    await expect(page.locator('#gw-house-window-kitchen')).toHaveAttribute(
      'aria-label',
      'kitchen, 5 rungs, toured, 5 of 15 stars',
    )
    await expect(page.locator('#gw-house-window-garage .gw-window-sill')).toHaveText('')
    await expect(page.locator('#gw-house-window-garage')).toHaveAttribute(
      'aria-label',
      'garage, 5 rungs, not toured yet',
    )
  })

  test('tour entries are the UNCHANGED rung URLs — bytes, locks, no dead doors', async ({ page }) => {
    await page.goto('/?boot=house') // a clean device
    await page.click('#gw-house-window-kitchen')
    await expect(page.locator('#gw-house-tours-kitchen')).toBeVisible()
    await expect(page.locator('a#gw-house-tour-kitchen01')).toHaveAttribute('href', '?level=kitchen01')
    const locked = page.locator('#gw-house-tour-kitchen02')
    expect(await locked.evaluate((el) => el.tagName)).toBe('SPAN')
    expect((await locked.textContent()) ?? '').toContain('\uD83D\uDD12')
    // a rung link navigates to the SAME page the level select's button wrote
    await page.click('a#gw-house-tour-kitchen01')
    await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
  })

  test('a window deep-link opens its room and parks the crane at its deck (presentation only)', async ({ page }) => {
    await page.goto('/?boot=house&room=garage')
    await page.waitForFunction(() => typeof (window as any).__gwHouseState === 'function', undefined, { timeout: 60_000 })
    await expect(page.locator('#gw-house-window-garage')).toHaveAttribute('aria-expanded', 'true')
    const garage = await page.evaluate(() => (window as any).__gwHouseCameraPose())
    await page.goto('/?boot=house&room=kitchen')
    await page.waitForFunction(() => typeof (window as any).__gwHouseState === 'function', undefined, { timeout: 60_000 })
    const kitchen = await page.evaluate(() => (window as any).__gwHouseCameraPose())
    expect(garage).not.toEqual(kitchen) // different decks, different parked eyes
  })

  test('the old front end is ADDRESSED: ?boot=rung lands the rung builder it always was', async ({ page }) => {
    await goto(page, '/') // the harness default IS the old front end
    await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
    await expect(page.locator('#gw-tray')).toBeVisible()
    await expect(page.locator('#gw-house-windows')).toHaveCount(0)
  })

  test('Escape closes whatever the door opened — the window panel, focus home to the window', async ({
    page,
  }) => {
    // THE KEYBOARD SEAM (h4, loop-four truth 5): at the door Escape closed
    // NOTHING — open a window, press Escape, `aria-expanded` stayed true.
    // The door now answers the key it already speaks: the open panel
    // closes and focus returns to the window that opened it.
    await page.goto('/?boot=house')
    await page.waitForFunction(() => typeof (window as any).__gwHouseState === 'function', undefined, { timeout: 60_000 })
    await page.click('#gw-house-window-kitchen')
    await expect(page.locator('#gw-house-window-kitchen')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#gw-house-tours-kitchen')).toBeVisible()
    await page.keyboard.press('Tab') // step INTO the opened panel — Escape must walk focus back
    await page.keyboard.press('Escape')
    await expect(page.locator('#gw-house-window-kitchen')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('#gw-house-tours-kitchen')).toBeHidden()
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('gw-house-window-kitchen')
  })

  test('Escape closes the Lines corner too, and focus returns to the button', async ({ page }) => {
    await page.goto('/?boot=house')
    await page.waitForFunction(() => typeof (window as any).__gwHouseState === 'function', undefined, { timeout: 60_000 })
    await page.click('#gw-lines-corner')
    await expect(page.locator('#gw-lines-corner-panel')).toBeVisible()
    await page.keyboard.press('Tab') // into the panel's rows — same walk back
    await page.keyboard.press('Escape')
    await expect(page.locator('#gw-lines-corner')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('#gw-lines-corner-panel')).toBeHidden()
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('gw-lines-corner')
  })

  test('FREE is one hop: the six sandboxes ride the home page, named and Tab-reachable', async ({ page }) => {
    // loop-four truth 7's home half — "Home carries exactly three anchors
    // … ZERO sandbox links". The six doors' free-build siblings join the
    // door's own chrome (the rooms in DESCENT order, garage first), one
    // hop from `/`, named in the Tab walk.
    await page.goto('/?boot=house')
    await page.waitForFunction(() => typeof (window as any).__gwHouseState === 'function', undefined, { timeout: 60_000 })
    const hrefs = await page.locator('#gw-home-sandboxes a').evaluateAll((as) =>
      as.map((a) => a.getAttribute('href')),
    )
    expect(hrefs).toEqual(
      ['garage', 'kitchen', 'bedroom', 'bathroom', 'garden', 'porch'].map((r) => `?level=${r}-sandbox`),
    )
    for (const room of ['garage', 'kitchen', 'bedroom', 'bathroom', 'garden', 'porch']) {
      await tabTo(page, `#gw-home-sandbox-${room}`)
      await expect(page.locator(`#gw-home-sandbox-${room}`)).toContainText('free build')
    }
    // one hop: a hop lands the sandbox page, the way-back crumb and all
    await page.click('#gw-home-sandbox-garage')
    await expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })
    await expect(page.locator('#gw-home-link')).toBeVisible()
  })
})

test.describe('the front-door run — the cold-load tripwire, extended', () => {
  test('the home boot’s FIRST run on a fresh profile equals the node hash', async ({ page }) => {
    test.setTimeout(180_000)
    // the downhill spec's standing tripwire (build 1) pointed at the
    // addressed house page; build 2 extends it to the FRONT DOOR itself:
    // the bare route, first release, fresh browser — the same bytes, the
    // same receipt, the door is presentation only
    await page.goto('/?boot=house&launch=1')
    await page.waitForFunction(
      () => {
        const s = (window as any).__gwHouseState
        return typeof s === 'function' && s().status !== 'running' && s().status !== 'idle'
      },
      undefined,
      { timeout: 120_000, polling: 250 },
    )
    const s = await page.evaluate(() => (window as any).__gwHouseState())
    const REF = await ref()
    expect(s.hash).toBe(REF.hash)
    expect(s.steps).toBe(REF.steps)
    expect(s.rooms.length).toBeGreaterThanOrEqual(3)
  })
})
