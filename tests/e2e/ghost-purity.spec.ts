/**
 * THE GHOST MOUNTING LAW (final sheet probe item (d) — Decision Log
 * 2026-10-12 "THE GHOST law, extended"): ghosts are TRACE, never a second
 * simulation, and MOUNTING one is physics-neutral — PROVEN, not asserted.
 *
 * The fault the final probe named: an identical build reportedly finished
 * 0.10 s apart with the par ghost mounted vs off (`Sessions/2026-10-12
 * Final sheet probe.md` suffocation #6, the re-probe's 2.80/2.83 split).
 * The engineering audit found NO physics body on any ghost lane — every
 * source is a translucent Three.js rig plus a `GhostTrace`, and every wind
 * steps a FRESH headless `World` that is `free()`d — and the probe's own
 * return trip proves the cross-build reading of its numbers (0.57 s is the
 * friend's `bbc4df19` rail-shortcut build, 0.67 s the author's differently
 * seated cup: two builds, one misattribution).
 *
 * What was asserted in prose is now asserted per byte. The fixture is the
 * probe's kitchen line — the four-piece player build (three straights and
 * the player's OWN cup, the seat the mint keys on) — and EVERY ghost
 * source is mounted around the same run: the bundled par trace (cold wind
 * at launch, then cache hits), the your-best RECORD mirror (minted, cold
 * wind mid-run, then toggled and re-cached, then a cold page), a PASTED
 * friend link (the payload of these very bytes), and a CHAIN-ROW address
 * (`?link=`) on the walk the paste entered. In every state the launched
 * run must print the hash the Node `replayRun` prints for the same bytes,
 * and the result bar's time string must not move. The farewell states
 * mount no world at all (`src/pages/farewell.ts`: zero bodies, zero
 * solver) and a house row mounts the same trace machinery.
 *
 * `replay:all` staying 30/30 byte-identical at this HEAD is the same law
 * read from the other side (`Modules/replay`).
 */
import { test, expect } from '@playwright/test'
import zlib from 'node:zlib'
import { replayRun } from '../../src/replay/replay.ts'
import { deserialize } from '../../src/track/build.ts'
import { KITCHEN_SANDBOX } from '../../src/world/levels/kitchen05.level.ts'
import { base64urlEncode, encodeShareUrl, type ShareCodec } from '../../src/share/share.ts'
import { goto } from './goto.ts'

const zlibCodec: ShareCodec = {
  deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))),
  inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))),
}

/** The probe's kitchen build, placed through the shipped tray: three
 *  straights and the player's own cup (4 placed pieces; the fixtures the
 *  sandbox pre-mounts ride their par transforms). */
const FIXTURE = ['straight', 'straight', 'straight', 'finishCup'] as const

/** Launch, take the terminal edge, walk home for the next attempt. The
 *  hash is the run's own (`#gw-hash-value`), the time the result bar's
 *  finish print — the numbers the probe read. (The bar's TAIL wording
 *  differs on the first par reveal — `par 2.70 s ✓` vs `beat par ✓` — the
 *  claim here is the SECONDS: the printed finish, unchanged.) */
async function attempt(page: import('@playwright/test').Page): Promise<{ hash: string; time: string; secs: number }> {
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 90_000 })
  const hash = (await page.evaluate(() => document.getElementById('gw-hash-value')?.textContent?.trim())) ?? ''
  const time = ((await page.locator('#gw-result-time').textContent()) ?? '').trim()
  expect(hash).toMatch(/^[0-9a-f]{8}$/)
  const secs = Number(time.match(/^(\d+\.\d\d)/)?.[0] ?? NaN)
  expect(Number.isFinite(secs)).toBe(true)
  await page.click('#gw-result-retry')
  await expect(page.locator('#gw-result')).toBeHidden()
  await expect(page.locator('#gw-status')).toContainText('ready')
  return { hash, time, secs: Math.round(secs * 100) }
}

const buildFixture = async (page: import('@playwright/test').Page): Promise<void> => {
  for (const kind of FIXTURE) {
    await page.click(`#gw-tray button[data-kind="${kind}"]`)
    await page.click('#gw-place')
  }
}

test.describe('ghost mounting is physics-neutral (final probe item d)', () => {
  test.setTimeout(240_000)

  test('every ghost source mounted: the run hash and finish print are UNMOVED', async ({ page }) => {
    // — the reference: the fixture bytes, Node, no ghost machinery at all
    await goto(page, '/?level=kitchen-sandbox')
    await expect(page.locator('#gw-tray')).toBeVisible()
    await buildFixture(page)
    const bytes = await page.evaluate(() => (window as any).__gwBuildJson())
    const reference = await replayRun(KITCHEN_SANDBOX, deserialize(bytes))
    expect(reference.status).toBe('finished')

    // (1) PAR GHOST — the sandbox defaults the rail ON: this launch is the
    // cold wind racing the live run (the probe's exact mount shape).
    const parCold = await attempt(page)
    expect(parCold.hash).toBe(reference.hash)

    // (2) rail OFF — nothing wound, nothing mounted.
    await page.click('#gw-ghost-toggle')
    expect(await page.evaluate(() => (window as any).__gwGhostState().mode)).toBe('off')
    const off = await attempt(page)
    expect(off.hash).toBe(reference.hash)
    expect(off.secs).toBe(parCold.secs)

    // (3) rail ON again — the cache-hit flip (an O(1) Map read, no tape).
    await page.click('#gw-ghost-toggle')
    expect(await page.evaluate(() => (window as any).__gwGhostState().mode)).toBe('par')
    const parWarm = await attempt(page)
    expect(parWarm.hash).toBe(reference.hash)
    expect(parWarm.secs).toBe(parCold.secs)

    // (4) the RECORD MIRROR — mint the line, and your best run takes the
    // rail: the SAME bytes wound a second time, cold, mid-run.
    await page.click('#gw-launch')
    await expect(page.locator('#gw-result')).toBeVisible({ timeout: 90_000 })
    await expect(page.locator('#gw-result-name-chip')).toHaveText('name this line')
    await page.fill('#gw-result-name-input', 'ghost purity')
    await page.click('#gw-result-name-save')
    await page.click('#gw-result-retry')
    await expect(page.locator('#gw-status')).toContainText('ready')
    const mirror = await attempt(page)
    expect(await page.evaluate(() => (window as any).__gwGhostState().mode)).toBe('record')
    expect(mirror.hash).toBe(reference.hash)
    expect(mirror.secs).toBe(parCold.secs)

    // (5) the mirror OFF and back ON (cached) — the flip lane of the law.
    await page.click('#gw-ghost-toggle')
    const mirrorOff = await attempt(page)
    expect(mirrorOff.hash).toBe(reference.hash)
    expect(mirrorOff.secs).toBe(parCold.secs)
    await page.click('#gw-ghost-toggle')
    const mirrorWarm = await attempt(page)
    expect(mirrorWarm.hash).toBe(reference.hash)
    expect(mirrorWarm.secs).toBe(parCold.secs)

    // (6) PASTED FRIEND LINK — the payload IS these bytes (the share
    // encoder, Node-side): accept mounts their build as the track (the
    // same bytes) and winds their car.
    const url = await encodeShareUrl(
      { levelId: KITCHEN_SANDBOX.id, seed: KITCHEN_SANDBOX.seed, hash: reference.hash, build: deserialize(bytes) },
      zlibCodec,
    )
    await goto(page, '/?level=kitchen-sandbox')
    await expect(page.locator('#gw-tray')).toBeVisible()
    await buildFixture(page)
    await page.fill('#gw-ghost-link', url)
    await page.click('#gw-ghost-race')
    await expect
      .poll(async () => (await page.evaluate(() => (window as any).__gwGhostState().mode)), { timeout: 30_000 })
      .toBe('friend')
    const friend = await attempt(page)
    expect(friend.hash).toBe(reference.hash)
    expect(friend.secs).toBe(parCold.secs)

    // (7) the COLD PAGE with the minted line in the save — the mirror
    // winds at the first launch beside the live run (the re-probe's shape).
    // The autosave restores whatever board the session last edited, so the
    // claim is taken from THOSE bytes: re-place only on an empty board,
    // and compare against the Node replay of exactly what the board is.
    await goto(page, '/?level=kitchen-sandbox')
    await expect(page.locator('#gw-tray')).toBeVisible()
    const restored = deserialize(await page.evaluate(() => (window as any).__gwBuildJson()))
    if (restored.pieces.length <= 2) await buildFixture(page)
    const coldRef = await replayRun(KITCHEN_SANDBOX, deserialize(await page.evaluate(() => (window as any).__gwBuildJson())))
    const coldPage = await attempt(page)
    expect(coldPage.hash).toBe(coldRef.hash)
    expect(coldPage.secs).toBe(Math.round(coldRef.time * 100))
  })

  test('a chain-row address mounts the ghost and the link still verifies its own bytes', async ({ page }) => {
    // The row path (`?link=`, the CHAIN walk) mounts THEIR build as the
    // track and their trace beside it; the launched run must land on the
    // payload hash — the chain's own verifiability claim, now also proof
    // that the row's ghost mount moved nothing.
    await goto(page, '/?level=kitchen-sandbox')
    await expect(page.locator('#gw-tray')).toBeVisible()
    await buildFixture(page)
    const bytes = await page.evaluate(() => (window as any).__gwBuildJson())
    const reference = await replayRun(KITCHEN_SANDBOX, deserialize(bytes))
    const url = await encodeShareUrl(
      { levelId: KITCHEN_SANDBOX.id, seed: KITCHEN_SANDBOX.seed, hash: reference.hash, build: deserialize(bytes) },
      zlibCodec,
    )
    await goto(page, '/?level=kitchen-sandbox')
    await expect(page.locator('#gw-tray')).toBeVisible()
    await page.fill('#gw-ghost-link', url)
    await page.click('#gw-ghost-race')
    await expect
      .poll(async () => (await page.evaluate(() => (window as any).__gwGhostState().mode)), { timeout: 30_000 })
      .toBe('friend')
    // the walk entered the store; walk back in through the ROW, not the paste
    await goto(page, `/?level=kitchen-sandbox&link=${reference.hash}`)
    await expect(page.locator('#gw-ghost-note')).toContainText('their car is on the grid', { timeout: 30_000 })
    const row = await attempt(page)
    expect(row.hash).toBe(reference.hash)
  })

  test('a house-line row mounts the same trace machinery and the board run is UNMOVED', async ({ page }) => {
    // The LINES-tab click lands on the board with the house ghost winding
    // (chain.spec's own shape); the run the board makes beside it is the
    // run the board makes alone — the Node hash of those very bytes.
    await goto(page, '/?level=kitchen-sandbox&line=house')
    await expect(page.locator('#gw-ghost-note')).toContainText('the house line is on the grid', { timeout: 30_000 })
    const bytes = await page.evaluate(() => (window as any).__gwBuildJson())
    const reference = await replayRun(KITCHEN_SANDBOX, deserialize(bytes))
    const house = await attempt(page)
    expect(house.hash).toBe(reference.hash)
    void base64urlEncode // (the codec imports above stay a single source)
  })
})
