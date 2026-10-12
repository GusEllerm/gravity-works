/**
 * THE CHAIN'S MISSING LINK (final sheet probe items (a) and (b)) — the e2e
 * the probe could not complete: paste link → beat → publish → the row
 * SHOWS LINEAGE → a third device verifies the chain of two.
 *
 * The fault, from the probe's own code read (`Sessions/2026-10-12 Final
 * sheet probe.md` Q2): the beat-a-name verdict row read `racedLink` (the
 * acceptance fact — correct), but `beatLineage` gated on the ghost RAIL's
 * current visual mode, which any edit lifts ("your edits replaced their
 * track") and any par-toggle can clear — so a friend who beat a link with
 * their own skill could never mint the beat-a-beat link, and the CHAIN's
 * middle link could not fire in play. The fix is one flag deep: a run
 * that ACCEPTED a hashed link ENDS in friend mode — the lineage reads the
 * SAME acceptance fact the verdict row already prints (`racedLink` with a
 * hash), and a fact phrased twice reads from one place.
 *
 * Item (b) rides the same round trip: the friend's VIEWER page (the `#s=`
 * page opened before `Build your own`) prints NAME · GOAL · PAR straight
 * off the payload v2 fields (`#gw-replay-payload-line`) — the probe's
 * "beautiful film with hashes and no name anywhere" is closed; a v1 link
 * prints nothing new (the v1-is-forever law).
 *
 * The beat itself is SKILL, not luck (determinism's last word): the author
 * publishes a long five-straight line; the friend accepts, rebuilds a
 * shorter seating of their own on the same board, and finishes strictly
 * ahead — under the seeded sim a mirror tie can never mint lineage, so the
 * chain only grows by beating, exactly as the CHAIN law intended. Nothing
 * here is timed on wall clocks: every verdict is a hash.
 */
import { test, expect } from '@playwright/test'
import zlib from 'node:zlib'
import { parseShareUrl, base64urlEncode } from '../../src/share/share.ts'
import { goto } from './goto.ts'
const place = async (page: import('@playwright/test').Page, kinds: string[]): Promise<void> => {
  for (const kind of kinds) {
    await page.click(`#gw-tray button[data-kind="${kind}"]`)
    await page.click('#gw-place')
  }
}

test('the CHAIN mints its middle link: paste a link, beat it with your own build, share — the row carries lineage, and a third device verifies the chain of two', async ({ page, browser }) => {
  test.slow()
  test.setTimeout(360_000)

  // — AUTHORITY DEVICE: mint a named line the friend can beat with skill
  await goto(page, '/?level=kitchen-sandbox')
  await expect(page.locator('#gw-tray')).toBeVisible()
  await place(page, ['straight', 'straight', 'straight', 'straight', 'finishCup'])
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 90_000 })
  await expect(page.locator('#gw-result-name-chip')).toHaveText('name this line')
  await page.fill('#gw-result-name-input', 'the long line')
  await page.click('#gw-result-name-save')
  await page.click('#gw-result-share')
  await expect(page.locator('#gw-result-share-url')).not.toHaveValue('', { timeout: 20_000 })
  const authorUrl = await page.locator('#gw-result-share-url').inputValue()
  const author = await parseShareUrl(authorUrl)
  expect(author.v).toBe(2)
  expect(author.name).toBe('the long line')
  const authorChain = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}')
    return raw.settings?.records?.chain ?? []
  })
  expect(authorChain[authorChain.length - 1].hash).toBe(author.hash)

  // — FRIEND DEVICE (a FRESH BROWSER CONTEXT — clean localStorage, the
  // probe's wiped-device method spelled in Playwright): open the link —
  // SHOWS THE CHALLENGE (item b): NAME · GOAL · PAR, off payload v2.
  const friendCtx = await browser.newContext()
  const friend = await friendCtx.newPage() // fresh context — no save, ever
  await goto(friend, authorUrl)
  await expect(friend.locator('#gw-replay-status')).toHaveText('verified', { timeout: 120_000 })
  const challenge = friend.locator('#gw-replay-payload-line')
  await expect(challenge).toBeVisible()
  const challengeText = (await challenge.textContent()) ?? ''
  expect(challengeText).toContain('“the long line”')
  expect(challengeText).toMatch(/par \d+\.\d\d s/)
  expect(challengeText).toMatch(/the cup at -?\d+\.\d\d, -?\d+\.\d\d, -?\d+\.\d\d m/)
  // — ...and `Build your own` is the ordinary accept the chain.spec walks
  await goto(friend, '/?level=kitchen-sandbox')
  await expect(friend.locator('#gw-tray')).toBeVisible()
  await friend.fill('#gw-ghost-link', authorUrl)
  await friend.click('#gw-ghost-race')
  await expect
    .poll(async () => (await friend.evaluate(() => (window as any).__gwGhostState().mode)), { timeout: 30_000 })
    .toBe('friend')

  // — BEAT WITH YOUR OWN HANDS: rebuild shorter (Remove takes the last
  // piece — the probe's law — so five removes walk the board off, then the
  // friend seats TWO straights and their own cup). The remove button is
  // honest-disabled on an empty board; the flow does not depend on which
  // pieces it takes, only on the seating the friend finally LAUNCHES.
  for (let i = 0; i < 5; i++) {
    await friend.click('#gw-remove-piece').catch(() => {})
  }
  await place(friend, ['straight', 'straight', 'finishCup'])
  await friend.click('#gw-launch')
  await expect(friend.locator('#gw-result')).toBeVisible({ timeout: 90_000 })
  const verdict = (await friend.locator('#gw-result-vspar').textContent()) ?? ''
  expect(verdict).toContain('you vs “the long line”’s par')
  expect(verdict).toMatch(/−\d+\.\d\d s vs their par/) // strictly ahead — SKILL, not a tie

  // — PUBLISH THE BEAT: the row carries the LINEAGE of the link it beat.
  if (await friend.locator('#gw-result-name-save').count()) {
    await friend.fill('#gw-result-name-input', 'the short line')
    await friend.click('#gw-result-name-save')
  }
  await friend.click('#gw-result-share')
  await expect(friend.locator('#gw-result-share-url')).not.toHaveValue('', { timeout: 20_000 })
  const friendUrl = await friend.locator('#gw-result-share-url').inputValue()
  const friendChain = await friend.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}')
    return raw.settings?.records?.chain ?? []
  })
  const beatRow = friendChain[friendChain.length - 1]
  expect(beatRow.hash).not.toBe(author.hash)
  expect(beatRow.lineage).toBeTruthy()
  expect(beatRow.lineage.hash).toBe(author.hash)
  expect(beatRow.lineage.name).toBe('the long line')
  // the payload itself carries it (the chain is payloads, not receipts)
  const beatPayload = await parseShareUrl(friendUrl)
  expect(beatPayload.v).toBe(2)
  expect(beatPayload.lineage?.hash).toBe(author.hash)

  // — THE LINES TAB prints the beat, in the row's own words
  await goto(friend, '/?levels=1')
  await friend.click('#gw-tab-lines')
  const row = friend.locator(`#gw-line-link-${beatPayload.hash}`)
  await expect(row).toBeVisible()
  expect(((await row.textContent()) ?? '')).toContain('beat “the long line”')

  // — THIRD DEVICE verifies the CHAIN OF TWO: each link replays to its own
  // embedded hash on a machine that has never seen either device, and the
  // beat link points at the author link BY HASH (checked above, node-side).
  await friendCtx.close()
  const thirdCtx = await browser.newContext()
  const third = await thirdCtx.newPage()
  try {
    await goto(third, authorUrl)
    await expect(third.locator('#gw-replay-status')).toHaveText('verified', { timeout: 120_000 })
    await goto(third, friendUrl)
    await expect(third.locator('#gw-replay-status')).toHaveText('verified', { timeout: 120_000 })
  } finally {
    await thirdCtx.close()
  }
})

test('a v1 link prints no challenge line (v1 is forever, and silent)', async ({ page }) => {
  // the fixture bytes (share-v1.json) → the wire token derived in-test, so
  // the OLD link opens its viewer with hashes and NO new fields — the
  // absent-field law: a link that never had a name keeps its silence.
  const { readFileSync } = await import('node:fs')
  const fixtures = JSON.parse(readFileSync('tests/fixtures/share-v1.json', 'utf8')) as {
    fixtures: { json: string }[]
  }
  const token = base64urlEncode(new Uint8Array(zlib.deflateRawSync(Buffer.from(fixtures.fixtures[0]!.json))))
  await goto(page, `/#s=${token}`)
  await expect(page.locator('#gw-replay-status')).toHaveText('verified', { timeout: 120_000 })
  await expect(page.locator('#gw-replay-payload-line')).toBeHidden()
})
