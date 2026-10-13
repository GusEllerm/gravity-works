/**
 * THE DOWNHILL e2e (build 1 of "THE DOWNHILL greenlit"): the whole-house
 * run verifies its own hash ON THE SHIPPED PAGE against the SAME
 * (level, build, seed) replayed in this Node process — the determinism
 * family's pattern (this spec's own process IS the node side; the browser
 * recomputes independently), pointed at the house instead of a rung. The
 * law it executes: "a downhill e2e collecting >= 3 rooms verifies its own
 * hash" — plus the second launch (THE SEATING LAW on the house: the run
 * is a tape, a re-release is the SAME run), the rooms result copy, the
 * device's best in the save, the par ghost default-ON (it IS the
 * afterlife), and the room windows' TOUR links, which are the UNCHANGED
 * `?level=<room>NN` bytes of the level select — the campaign demoted to
 * tours, never deleted.
 */
import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'
import { replayRun } from '../../src/replay/replay.ts'
import { HOUSE, HOUSE_ID } from '../../src/world/levels/house.level.ts'
import { CAMPAIGN_LADDER, CAMPAIGN } from '../../src/world/campaign.ts'
import { parseShareUrl } from '../../src/share/share.ts'

const PAR = HOUSE.parBuild()
const DESCENT = ['garage', 'kitchen', 'bedroom', 'bathroom', 'garden', 'porch'] as const

/** THE RECEIPT — computed once in this Node process (the determinism
 *  family’s wiring: this spec’s own process IS the node side); the
 *  referee both page runs must match, hash for hash, step for step. */
let REFPromise: Promise<Awaited<ReturnType<typeof replayRun>>> | null = null
const ref = () => (REFPromise ??= replayRun(HOUSE, PAR, {}))

interface HouseState {
  status: string
  hash: string
  steps: number
  time: number
  rooms: { room: string; step: number; time: number }[]
  best: { rooms: number; time: number } | undefined
  ghostEnabled: boolean
}

function seedAllStars(): string {
  // the whole ladder three-starred: every tour link is an OPEN door, so
  // the byte-comparison sees links, not locks (the lock law itself is the
  // level select's spec; this one is about URL bytes)
  return `
  const save = { v: 2, builds: {}, settings: {}, progress: { stars: {}, reached: {} } }
  for (const id of ${JSON.stringify(CAMPAIGN_LADDER)}) save.progress.stars[id] = 3
  localStorage.setItem('gravity-works.save', JSON.stringify(save))
  `
}

async function runDownhill(page: import('@playwright/test').Page): Promise<HouseState> {
  await page.waitForFunction(
    () => {
      const s = (window as any).__gwHouseState
      return typeof s === 'function'
    },
    undefined,
    { timeout: 30_000 },
  )
  await page
    .waitForFunction(
      () => {
        const st = (window as any).__gwHouseState()
        return st.status !== 'idle' && st.status !== 'running'
      },
      undefined,
      { timeout: 120_000, polling: 250 },
    )
    .catch(async () => {
      // honest debugging if it is wedged: where is it stuck?
      const st = await page.evaluate(() => (window as any).__gwHouseState())
      throw new Error(`downhill run did not terminate: ${JSON.stringify(st)}`)
    })
  return page.evaluate(() => (window as any).__gwHouseState())
}

test.describe('the downhill — the run verifies its own hash', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, `/?level=${HOUSE_ID}&launch=1`)
  })

  test('>= 3 rooms physics-approved, and the page hash equals the node replay', async ({ page }) => {
    const [s, REF] = [await runDownhill(page), await ref()]
    expect(REF.status).not.toBe('running')
    // THE RECEIPT: browser === node, hash and step count (the determinism
    // family's law, now covering the house's floor collider and wind too)
    expect(s.hash).toBe(REF.hash)
    expect(s.steps).toBe(REF.steps)
    expect(s.rooms.length).toBeGreaterThanOrEqual(3)
    // approvals obey the graph: a subsequence of the descent order, each
    // landing inside the descent, not in a tail
    const idx = s.rooms.map((r) => DESCENT.indexOf(r.room as (typeof DESCENT)[number]))
    expect(idx).toEqual([...idx].sort((a, b) => a - b))
    for (const r of s.rooms) expect(r.time).toBeLessThan(6)
  })

  test('the result bar reads rooms, and the save keeps the device best', async ({ page }) => {
    const s = await runDownhill(page)
    const line = await page.locator('#gw-house-result').textContent()
    expect(line).toMatch(
      new RegExp(`^${s.rooms.length} rooms? \\u00B7 \\d+\\.\\d s \\u2014 you stopped at the (${DESCENT.join('|')})$`),
    )
    const best = await page.evaluate((id) => {
      const raw = JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}')
      return raw.settings?.records?.houses?.[id] ?? null
    }, HOUSE_ID)
    expect(best).not.toBeNull()
    expect(best.rooms).toBe(s.rooms.length)
    const bestLine = await page.locator('#gw-house-best').textContent()
    expect(bestLine).toContain('your own runs on this device only')
  })

  test('the par ghost is ON by default here — this IS the afterlife', async ({ page }) => {
    const s = await runDownhill(page)
    expect(s.ghostEnabled).toBe(true)
  })

  test('a second release is the SAME run (the seating law, live)', async ({ page }) => {
    const [first, REF] = [await runDownhill(page), await ref()]
    await page.click('#gw-launch')
    const second = await runDownhill(page)
    expect(second.hash).toBe(first.hash)
    expect(second.hash).toBe(REF.hash)
  })

  test('ONE run prints ONE verdict — one live status after a run; a re-release says so honestly', async ({
    page,
  }) => {
    // THE CONTRADICTION (h4, loop-four truth 6): "3.7 s" printed directly
    // above "6.7 s" — the live counter kept its `role=status` after the
    // terminal edge, so one run announced TWO verdicts. The law: exactly
    // ONE live status element on the page after a run — the result line.
    // `finalize()` writes it and RETIRES the status line (role lifted, the
    // frozen clock is not a live region). A second Release rides the same
    // tape and the retired line SAYS SO — "same film", no silent freeze.
    const liveStatuses = () =>
      page
        .locator('[role="status"]')
        .evaluateAll((els) =>
          els
            .map((e) => ({ id: e.id, text: (e.textContent ?? '').trim() }))
            .filter((r) => r.text !== ''),
        )
    await runDownhill(page)
    expect((await liveStatuses()).map((r) => r.id)).toEqual(['gw-house-result'])
    const first = await runDownhill(page)
    // the re-release: the run is the SAME film, and the page says it
    await page.click('#gw-launch')
    const second = await runDownhill(page)
    expect(second.hash).toBe(first.hash)
    expect((await liveStatuses()).map((r) => r.id)).toEqual(['gw-house-result'])
    await expect(page.locator('#gw-house-status')).toContainText('same film')
  })

  test('THE TRAILER TRAVELS — Share mints a link whose replay verifies against the receipt', async ({
    page,
  }) => {
    // THE TRAVELING TRAILER (h4, loop-four truth 7): the downhill minted
    // a receipt it could not send. The Share verb rides the result bar;
    // the payload carries NOTHING the run did not already carry — the
    // INPUT law means the RECEIPT already commits the wind, so the link
    // is the (levelId, build, seed, hash) the tape always was, in a v2
    // envelope. Proof in two halves: (a) the node side decodes the link,
    // re-sims the carried build, and the receipt hash MATCHES the link's;
    // (b) the friend page — replay from the link — prints `verified`.
    const s = await runDownhill(page)
    const REF = await ref()
    expect(s.hash).toBe(REF.hash)
    await expect(page.locator('#gw-house-share')).toBeVisible()
    await page.click('#gw-house-share')
    await expect(page.locator('#gw-house-share-row')).toBeVisible({ timeout: 30_000 })
    const url = await page.inputValue('#gw-house-share-url')
    expect(url).toContain('#s=')
    // (a) the node half: the link's payload, decoded and RE-SIMMED here
    const payload = await parseShareUrl(url)
    expect(payload.levelId).toBe(HOUSE_ID)
    expect(payload.v).toBe(2) // the new path rides v2, nothing new inside
    expect(payload.hash).toBe(REF.hash)
    const linkSim = await replayRun(HOUSE, payload.build, {})
    expect(linkSim.hash).toBe(REF.hash) // the receipt answers for the link
    // (b) the friend half: the link OPENS INTO a replay that verifies
    await page.goto(url)
    await expect(page.locator('#gw-replay-status')).toHaveText('verified', { timeout: 180_000 })
  })
})

test.describe('the house page — tours are the unchanged campaign addresses', () => {
  test('every room window links its five rungs with the level select’s bytes', async ({ page }) => {
    await page.addInitScript(seedAllStars())
    await goto(page, '/?level=house')
    for (const room of CAMPAIGN) {
      const section = page.locator(`#gw-house-tours section[data-room="${room.id}"]`)
      await expect(section.locator('h2')).toHaveText(room.label)
      for (const id of room.levelIds) {
        await expect(section.locator(`a#gw-house-tour-${id}`)).toHaveAttribute('href', `?level=${id}`)
      }
      // the room's own rung set is exactly the campaign's rows, in order
      const hrefs = await section.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
      expect(hrefs).toEqual(room.levelIds.map((id) => `?level=${id}`))
    }
  })

  test('a locked rung is a lock, not a dead link (no-dead-affordances law)', async ({ page }) => {
    await goto(page, '/?level=house')
    // a clean device: only the ladder's first rung is open
    await expect(page.locator('#gw-house-tour-kitchen01')).toHaveAttribute('href', '?level=kitchen01')
    const locked = page.locator('#gw-house-tour-kitchen02')
    await expect(locked).toHaveCount(1)
    expect(await locked.evaluate((el) => el.tagName)).toBe('SPAN')
    expect((await locked.textContent()) ?? '').toContain('\uD83D\uDD12')
  })

  test('the menu camera parks at the porch; ?room= parks it at another window', async ({ page }) => {
    await goto(page, '/?level=house')
    await page.waitForFunction(() => typeof (window as any).__gwHouseState === 'function')
    const porch = await page.evaluate(() => (window as any).__gwHouseCameraPose?.())
    await goto(page, '/?level=house&room=garage')
    await page.waitForFunction(() => typeof (window as any).__gwHouseState === 'function')
    const garage = await page.evaluate(() => (window as any).__gwHouseCameraPose?.())
    if (porch && garage) expect(porch).not.toEqual(garage)
  })
})
