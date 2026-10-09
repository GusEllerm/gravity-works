/**
 * PROGRAM T2 — THE VOICE (2026-10-09 plan), end to end on the real boot:
 *
 * 1. THE MOVE CLAUSE (T2.1), kitchen04 — the evaluation's attempt A: a lip
 *    on the line, a drop stranded PAST the cup, the rest of the tray
 *    untouched. The note says MOVE where it used to say ADD ("the drop
 *    sits past the cup — pull it back · place at: … · press ] …"), the
 *    Remove button already named that same piece BEFORE the launch (the
 *    LIFO truth in the label), and the node proves the pull-back finish
 *    (replay-prediction law). WHY the rebuild is not stepped live here is
 *    itself a finding: kitchen04's tap guard box hangs 2–7 mm BELOW the
 *    deck plane (its group box's bottom is the riser base at counter
 *    level, and the par's own exit decks sit above it), so EVERY
 *    whole-tray order is refused a second seat at `end of lip` — the rung
 *    is placeably unwinnable as shipped (R's wall, still standing; see
 *    `Sessions/2026-10-09 Program T2 voice` and the Deferred line — the
 *    K4 session audited only the INITIAL sockets, never the mid-chain
 *    ones). The live clause-executed rebuild the plan asks for runs in
 *    the kitchen05 test, where the lane is clear of guard solids.
 * 2. THE BOOSTER SEQUENCING TRUTH (T2.1), kitchen05: hold the booster out
 *    of the head of the line and the note says the trade-off — spending it
 *    EARLY — with the `]` walk as the aim. Then the sentence is EXECUTED:
 *    Remove ×N (each label naming what it takes), rebuild booster-first
 *    off the ramp, and the par build is byte-rebuilt and finishes.
 * 3. THE FIRST TWO SECONDS (T2.2), the share link: the film is the first
 *    thing (stage above the verdict, small caption, no hero), the verdict
 *    is ONE honest line under the player that promises before it pronouns,
 *    the hash essay hides behind a fold, "Build your own" is visible and
 *    one click away while the tape is still winding, and the page plays
 *    with zero clicks (a re-sim, not media — the evaluation's own line).
 *
 * Every scenario is computed node-side FIRST (the replay-prediction law:
 * the browser is asserted against what the deterministic sim already said),
 * and the placements aim with `]` — the key the clause itself teaches.
 */
import { test, expect, type Page } from '@playwright/test'
import zlib from 'node:zlib'
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts'
import { KITCHEN04 } from '../../src/world/levels/kitchen04.level.ts'
import { KITCHEN05, kitchen05NoBoosterBuild } from '../../src/world/levels/kitchen05.level.ts'
import { replayRun } from '../../src/replay/replay.ts'
import { serialize } from '../../src/track/build.ts'
import type { Build, PlacedPiece } from '../../src/track/build.ts'
import { PIECES, type PieceKind } from '../../src/track/pieces.ts'
import { fitSocket } from '../../src/track/snap.ts'
import { transformSocket } from '../../src/track/socket.ts'
import { levelTrayParams } from '../../src/ui/advice.ts'
import { encodeShareUrl, type ShareCodec } from '../../src/share/share.ts'
import { goto } from './goto.ts'

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

const near = (a: number[], b: number[]) =>
  Math.abs(a[0]! - b[0]!) < 1e-3 && Math.abs(a[1]! - b[1]!) < 1e-3 && Math.abs(a[2]! - b[2]!) < 1e-3

const target = (page: Page) =>
  page.evaluate(() => (window as unknown as { __gwTargetSocket?: () => number[] | null }).__gwTargetSocket!())

/** Aim the ring at a world socket using ONLY the `]` walk (the key the
 *  failure note teaches — the spec dogfoods the clause it proves), then
 *  place with the Place button, which places at the ring's socket exactly. */
async function aimAndPlace(page: Page, kind: string, world: number[]): Promise<void> {
  await page.click(`#gw-tray button[data-kind="${kind}"]`)
  await expect
    .poll(async () => {
      const t = await target(page)
      if (t && near(t, world)) return 1
      await page.keyboard.press(']')
      return 0
    }, { timeout: 20_000, message: `the ']' walk never reached the ${kind} target socket` })
    .toBe(1)
  await page.click('#gw-place')
}

/** The build the page holds, with every piece's transform compared
 *  element-wise against the node build's — the same chain math either way
 *  (the determinism law), so equality is a fact about the scenario, not a
 *  tolerance to tune. */
async function expectBuildEquals(page: Page, build: Build): Promise<void> {
  const json = await page.evaluate(() => (window as unknown as { __gwBuildJson: () => string }).__gwBuildJson())
  type P = { def: string; transform: number[] }
  const mine = JSON.parse(json) as { pieces: P[] }
  const theirs = JSON.parse(serialize(build)) as { pieces: P[] }
  const key = (p: P) => `${p.def}|${p.transform.join(',')}`
  expect(mine.pieces.map(key).sort()).toEqual(theirs.pieces.map(key).sort())
}

/** Seat a chain of kinds deck-to-deck off the ramp, then one extra piece
 *  on the goal's own exit — the tray-dump-past-the-goal build as data. */
function orphanBuild(
  level: { parBuild: () => Build; tray: Partial<Record<PieceKind, number>> },
  chain: PieceKind[],
  past: PieceKind,
): { build: Build; exits: number[][] } {
  const par = level.parBuild()
  const fixtures = par.pieces.filter((p) => p.def === 'ramp' || p.def === 'finishCup')
  const params = levelTrayParams(level as never, level.tray) as Record<string, object>
  const pieces: PlacedPiece[] = fixtures.map((p, i) => ({ ...p, seq: i }))
  let cursor = transformSocket(PIECES.ramp.sockets(fixtures[0]!.params)[1], fixtures[0]!.transform)
  const exits: number[][] = []
  for (const def of chain) {
    const p = { ...params[def]! }
    const transform = fitSocket(cursor as never, PIECES[def].sockets(p as never)[0])
    pieces.push({ def, params: p, transform, seq: pieces.length })
    cursor = transformSocket(PIECES[def].sockets(p as never)[1], transform)
    exits.push([cursor.pos.x, cursor.pos.y, cursor.pos.z])
  }
  const cup = fixtures.find((p) => p.def === 'finishCup')!
  const cupExit = transformSocket(PIECES.finishCup.sockets(cup.params)[1], cup.transform)
  const p = { ...params[past]! }
  pieces.push({
    def: past,
    params: p,
    transform: fitSocket(cupExit as never, PIECES[past].sockets(p as never)[0]),
    seq: pieces.length,
  })
  return { build: { levelId: par.levelId, seed: par.seed, pieces }, exits }
}

const socketPos = (build: Build, i: number): number[] => {
  const p = build.pieces[i]!
  const s = transformSocket(PIECES[p.def].sockets(p.params)[1], p.transform)
  return [s.pos.x, s.pos.y, s.pos.z]
}

test.describe('T2.1 the move wave — kitchen04 names the piece past the cup', () => {
  test('the note says MOVE, the Remove label named it first, and the clause rebuilds the level', async ({ page }) => {
    test.slow()
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))

    // ---- node first (the replay-prediction law): the misplaced build
    // FALLS drive-off at a fixed time; the par build FINISHES. (THE TAP
    // LAW: kitchen04's faucet blocks some seats — the buildable wrong
    // build is the evaluation's own attempt A, a lone lip plus a drop on
    // the cup's own exit, the rest of the tray still in hand.)
    const { build: orphan } = orphanBuild(KITCHEN04, ['gapLip'], 'drop')
    const fell = await replayRun(KITCHEN04, orphan)
    expect(fell.status).toBe('fell')
    const fixed = await replayRun(KITCHEN04, KITCHEN04.parBuild())
    expect(fixed.status).toBe('finished')

    await goto(page, '/?level=kitchen04')
    await ready(page)

    // build the wrong line the player builds it: a lip at the ramp, then
    // the drop — aimed with `]` onto the CUP'S OWN EXIT, the far-side
    // mistake the evaluation's attempt A walked into
    const rampExit = socketPos(KITCHEN04.parBuild(), 0)
    await aimAndPlace(page, 'gapLip', rampExit)
    const cupExitPiece = KITCHEN04.parBuild().pieces.find((p) => p.def === 'finishCup')!
    const cupExit = transformSocket(PIECES.finishCup.sockets(cupExitPiece.params)[1], cupExitPiece.transform)
    await aimAndPlace(page, 'drop', [cupExit.pos.x, cupExit.pos.y, cupExit.pos.z])
    await expectBuildEquals(page, orphan)

    // THE REMOVE BUTTON NAMED IT BEFORE THE NOTE EVER COULD: LIFO takes the
    // drop — and the label says so, by where it sits.
    await expect(page.locator('#gw-remove-piece')).toHaveText('Remove the drop past the cup')
    await expect(page.locator('#gw-remove-piece')).toHaveAttribute('aria-label', /the last piece you placed/)

    // the launch: the clause fires on the drive-off death the node predicted
    await page.click('#gw-launch')
    await expect(page.locator('#gw-result')).toBeVisible({ timeout: 90_000 })
    const note = page.locator('#gw-result-note')
    await expect(note).toBeVisible()
    await expect(note).toContainText('the line let go before the cup')
    await expect(note).toContainText('the drop sits past the cup — pull it back')
    await expect(note).toContainText('place at:')
    await expect(note).toContainText('press ] to walk the open ends')
    // the death is the predicted one (browser truth == node truth)
    await expect(page.locator('#gw-result-time')).toContainText(fell.time.toFixed(2))

    // The pull-back's EXECUTABILITY is node-proven here (the 24-orders
    // law: the deck-to-deck rebuild finishes — see `fixed`): on THIS rung
    // the builder itself refuses the second seat (the tap-box finding in
    // the header), so the live execute-the-sentence rebuild is the
    // kitchen05 test below.

    expect(errors).toEqual([])
  })
})

test.describe('T2.1 the booster sequencing truth — kitchen05', () => {
  test('a booster kept out of the head of the line gets the EARLY sentence, and the sentence rebuilds par', async ({ page }) => {
    // CI-starve budget (P3): TWO launched runs plus two full placement
    // chains — `slow()` (90 s) was still starved on the saturated software
    // runner (run 38003676911 died mid-`page.click` with the sim still
    // rolling); the wait stays the 90 s EVENT on the stars line, the TEST
    // budget is what the machine honestly costs.
    test.slow()
    test.setTimeout(180_000)
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))

    // node first (the replay-prediction law): the builder-mount shape —
    // fixtures at their PAR seats (what the page mounts) + the tray chain
    // in place order, the same reconstruction `kitchenPlaced` uses. The
    // booster held back FALLS drive-off; the booster-first par FINISHES.
    const nbLay = kitchen05NoBoosterBuild()
    const nbFixtures = KITCHEN05.parBuild().pieces.filter((p) => p.def === 'ramp' || p.def === 'finishCup')
    const noBooster: Build = {
      levelId: KITCHEN05.id,
      seed: KITCHEN05.seed,
      pieces: [
        ...nbFixtures.map((p, i) => ({ ...p, seq: i })),
        ...nbLay.pieces
          .filter((p) => p.def !== 'ramp' && p.def !== 'finishCup')
          .map((p, i) => ({ ...p, seq: nbFixtures.length + i })),
      ],
    }
    const fell = await replayRun(KITCHEN05, noBooster)
    expect(fell.status).toBe('fell')
    const par = KITCHEN05.parBuild()
    expect((await replayRun(KITCHEN05, par)).status).toBe('finished')

    await goto(page, '/?level=kitchen05')
    await ready(page)

    // the five-piece line, booster held back — each placement at the chain
    // head the ring already follows (chain piece j joins at piece j-1's
    // exit: the aim point is the PREVIOUS piece's exit; nbLay is that
    // place-order chain)
    for (let j = 1; j < nbLay.pieces.length - 1; j++) {
      const p = nbLay.pieces[j]!
      if (p.def === 'finishCup' || p.def === 'ramp') continue
      await aimAndPlace(page, p.def, socketPos(nbLay, j - 1))
    }
    await expectBuildEquals(page, noBooster)

    await page.click('#gw-launch')
    await expect(page.locator('#gw-result')).toBeVisible({ timeout: 90_000 })
    const note = page.locator('#gw-result-note')
    await expect(note).toContainText('the booster needs spending EARLY')
    await expect(note).toContainText('remove back to the ramp')
    await expect(note).toContainText('before the first lip')
    await expect(note).toContainText('press ] to walk the open ends')
    await expect(page.locator('#gw-result-time')).toContainText(fell.time.toFixed(2))

    // EXECUTE THE SENTENCE: "remove back to the ramp" — every Remove label
    // names the piece it takes, LIFO, by where it sits.
    await expect(page.locator('#gw-remove-piece')).toHaveText('Remove the landing by the drop')
    for (let i = 0; i < 5; i++) await page.click('#gw-remove-piece')
    await expect(page.locator('#gw-remove-piece')).toHaveText('Remove piece')

    // "place the booster FIRST, before the first lip" — off the ramp's own
    // exit, reached with the ] the note taught
    const rampExit = socketPos(par, 0)
    await aimAndPlace(page, 'booster', rampExit)
    // then the rest, each at the chain head the ring follows — the par
    // line behind the booster (k=1 IS the booster, placed just above)
    for (let k = 2; k < par.pieces.length - 1; k++) {
      const p = par.pieces[k]!
      if (p.def === 'finishCup' || p.def === 'ramp') continue
      await aimAndPlace(page, p.def, socketPos(par, k - 1))
    }
    await expectBuildEquals(page, par)
    await page.click('#gw-launch')
    await expect(page.locator('#gw-result-stars')).toHaveText('★★★', { timeout: 90_000 })

    expect(errors).toEqual([])
  })
})

test.describe('T2.2 the first two seconds — the share link opens playing', () => {
  const zlibCodec: ShareCodec = {
    deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))),
    inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))),
  }

  test('film first, one honest verdict line, the essay folded, one click out, zero clicks to play', async ({ page }) => {
    test.slow()
    const node = await replayRun(KITCHEN01, KITCHEN01.parBuild())
    const url = await encodeShareUrl(
      { levelId: KITCHEN01.id, seed: KITCHEN01.parBuild().seed, hash: node.hash, build: KITCHEN01.parBuild() } as never,
      zlibCodec,
    )
    await goto(page, `/${url}`)

    // ONE HONEST LINE under the player, from first paint: it promises
    // while the tape winds and pronouns when it lands — never a badge to
    // hunt, never a silent 'replaying…' with no subject.
    const verdict = page.locator('#gw-replay-verdict')
    await expect(verdict).toBeVisible({ timeout: 15_000 })
    // the film is ABOVE it all: stage first, verdict under the player,
    // the title a small caption, not a hero
    const stage = (await page.locator('#gw-stage').boundingBox())!
    const title = (await page.locator('#gw-replay-title').boundingBox())!
    expect(title.height, 'the title is a caption, not a hero').toBeLessThan(48)
    expect(stage.y).toBeGreaterThanOrEqual(title.y)
    expect(stage.y).toBeLessThan(title.y + 200)
    const v = (await verdict.boundingBox())!
    expect(v.y).toBeGreaterThan(stage.y + stage.height - 10)

    // the badge scavenger hunt is gone — no pill, the line IS the verdict
    await expect(page.locator('#gw-replay-badge')).toHaveCount(0)

    // the hash essay lives behind a fold, closed by default
    await expect(page.locator('#gw-replay-verify-note')).toBeHidden()
    await page.click('#gw-replay-verify-fold summary')
    await expect(page.locator('#gw-replay-verify-note')).toBeVisible()
    await expect(page.locator('#gw-replay-verify-note')).toContainText('Linux/x86-64 and Apple silicon')

    // "Build your own" is one click and visible while the tape is still
    // winding (the page is never a waiting room with no exit)
    await expect(page.locator('#gw-replay-build')).toBeVisible({ timeout: 15_000 })
    expect(await page.getAttribute('#gw-replay-build', 'href')).toBe('?level=kitchen01')

    // ZERO CLICKS: the playhead moves on its own — a re-sim, not media
    await expect
      .poll(async () => {
        const m = /([\d.]+)s \/ ([\d.]+)s/.exec((await page.locator('#gw-replay-time').textContent()) ?? '')
        return m ? Number(m[1]) : 0
      }, { timeout: 90_000 })
      .toBeGreaterThan(0.05)

    // the verdict line PRONOUNS — and says verified, in words, on this machine
    await expect(verdict).toContainText('verified', { timeout: 90_000 })
    await expect(verdict).toContainText('matches the link')
    await expect(verdict).toContainText('this machine')
    // the seam strings below the fold still say exactly what the specs read
    await expect(page.locator('#gw-replay-status')).toHaveText('verified')
    await expect(page.locator('#gw-replay-hash')).toHaveText(`replay hash ${node.hash}`)
  })

  test('an invalid link says so in the line, not just in the fold', async ({ page }) => {
    await goto(page, '/#s=not-a-real-link')
    await expect(page.locator('#gw-replay-status')).toHaveText('invalid share link', { timeout: 15_000 })
    await expect(page.locator('#gw-replay-verdict')).toContainText('not a run')
  })
})
