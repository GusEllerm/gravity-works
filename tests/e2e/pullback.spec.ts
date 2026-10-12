/**
 * THE PULL-BACK AND THE FACE (final-sheet probe items (c) and (e)/(10),
 * 2026-10-12) — three claims, e2e on the shipped page:
 *
 *   1. THE OVERSHOOT SOFT-LOCK CLOSES (kitchen sandbox, live): the
 *      probe's scenario — the line stops one piece short of the default
 *      cup and the piece that would finish it sits PAST the cup, placed
 *      BEFORE the rest so the old LIFO button could never name it — dies
 *      with the pull-back sentence on the note; the Remove button now
 *      names the SAME piece the sentence names (one source:
 *      `pullbackTargetIndex`), one click takes it, the `]`-walked Place
 *      seats it at the head, and the launch finishes the par line. The
 *      six-room proof table lives in `tools/pullback-verify.mjs`; this is
 *      the one room walked end to end in the browser with the note as
 *      the only instruction.
 *   2. THE SHEET HAS A FACE, MODESTLY (sandbox result bar): a finished
 *      sandbox run whose sheet moved prints the lifetime number beside
 *      the word it counts — `earned — air ×2 (7) · … · your own runs on
 *      this device only` — and ONLY there: the numbers appear on kinds
 *      this run earned, never as their own line, and the campaign bar
 *      (sheet `null`) stays byte-identical to the shipped tail.
 *   3. THE FACE IS READABLE WHERE READING LIVES: the LINES tab ends in
 *      ONE quiet footline — every badge kind, its lifetime count
 *      (campaign-only kinds print their zeros), the device-honesty
 *      sentence verbatim. No streaks, no ranks, no button.
 */
import { test, expect, type Page } from '@playwright/test'
import { KITCHEN_SANDBOX } from '../../src/world/levels/kitchen05.level.ts'
import { replayRun } from '../../src/replay/replay.ts'
import { serialize } from '../../src/track/build.ts'
import type { Build } from '../../src/track/build.ts'
import { PIECES, type PieceKind } from '../../src/track/pieces.ts'
import { fitSocket } from '../../src/track/snap.ts'
import { transformSocket } from '../../src/track/socket.ts'
import { levelTrayParams } from '../../src/ui/advice.ts'
import { goto } from './goto.ts'

const ready = (page: Page) =>
  expect(page.locator('#gw-status')).toContainText('ready', { timeout: 60_000 })

const near = (a: number[], b: number[]) =>
  Math.abs(a[0]! - b[0]!) < 1e-3 && Math.abs(a[1]! - b[1]!) < 1e-3 && Math.abs(a[2]! - b[2]!) < 1e-3

const target = (page: Page) =>
  page.evaluate(() => (window as unknown as { __gwTargetSocket?: () => number[] | null }).__gwTargetSocket!())

/** Aim with ONLY the `]` walk (the key the clause teaches), place by button. */
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

async function expectBuildEquals(page: Page, build: Build): Promise<void> {
  const json = await page.evaluate(() => (window as unknown as { __gwBuildJson: () => string }).__gwBuildJson())
  type P = { def: string; transform: number[] }
  const mine = JSON.parse(json) as { pieces: P[] }
  const theirs = JSON.parse(serialize(build)) as { pieces: P[] }
  const key = (p: P) => `${p.def}|${p.transform.join(',')}`
  expect(mine.pieces.map(key).sort()).toEqual(theirs.pieces.map(key).sort())
}

const socketPos = (build: Build, i: number): number[] => {
  const p = build.pieces[i]!
  const s = transformSocket(PIECES[p.def].sockets(p.params)[1], p.transform)
  return [s.pos.x, s.pos.y, s.pos.z]
}

/** The probe's overshoot as data: the par line's finisher seated on the
 *  cup's own exit, the rest chained off the ramp (placement ORDER is the
 *  browser's business — the page places the overshoot FIRST). */
function sandboxOvershoot(level: typeof KITCHEN_SANDBOX): { exits: number[][]; cupExit: number[] } {
  const par = level.parBuild()
  const params = levelTrayParams(level as never, level.tray as never) as Record<string, object>
  const ramp = par.pieces.find((p) => p.def === 'ramp')!
  const cup = par.pieces.find((p) => p.def === 'finishCup')!
  let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform)
  const exits: number[][] = []
  for (const def of ['straight', 'gapLip', 'drop', 'landing'] as PieceKind[]) {
    const p = { ...params[def]! }
    const transform = fitSocket(cursor as never, PIECES[def].sockets(p as never)[0])
    cursor = transformSocket(PIECES[def].sockets(p as never)[1], transform)
    exits.push([cursor.pos.x, cursor.pos.y, cursor.pos.z])
  }
  const ce = transformSocket(PIECES.finishCup.sockets(cup.params)[1], cup.transform)
  return { exits, cupExit: [ce.pos.x, ce.pos.y, ce.pos.z] }
}

test('the overshoot soft-lock closes live: the note names it, the button takes it, the rebuild finishes (kitchen sandbox)', async ({ page }) => {
  test.setTimeout(240_000)
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))

  // node first (the replay-prediction law): the sandbox par line finishes
  // through the shipped harness — the browser rebuild must do the same.
  const parRun = await replayRun(KITCHEN_SANDBOX, KITCHEN_SANDBOX.parBuild(), {})
  expect(parRun.status).toBe('finished')

  await goto(page, '/?level=kitchen-sandbox')
  await ready(page)
  const { exits, cupExit } = sandboxOvershoot(KITCHEN_SANDBOX)

  // the probe's method: the overshoot straight goes in FIRST (at the
  // cup's own exit — the legal seat the builder tells at), then the line
  // stops one straight short of the cup
  await aimAndPlace(page, 'straight', cupExit)
  await aimAndPlace(page, 'straight', socketPos(KITCHEN_SANDBOX.parBuild(), 0))
  await aimAndPlace(page, 'gapLip', exits[0]!)
  await aimAndPlace(page, 'drop', exits[1]!)
  await aimAndPlace(page, 'landing', exits[2]!)

  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 90_000 })
  await expect(page.locator('#gw-result-note')).toContainText('the straight sits past the cup — pull it back')

  // back to the build: the button names the piece the SENTENCE names —
  // under the pull-back law this target is not the LIFO tail (the
  // landing was placed last; the straight past the cup goes first)
  await page.click('#gw-result-retry')
  await ready(page)
  await expect(page.locator('#gw-remove-piece')).toHaveText('Remove the straight past the cup')
  await expect(page.locator('#gw-remove-piece')).toHaveAttribute('aria-label', /pull it back, the piece past the finish/)
  await page.click('#gw-remove-piece')
  await expect(page.locator('#gw-ghost-state')).toContainText('removed the straight')
  // with nothing past the goal, the plain LIFO law stands in the label
  await expect(page.locator('#gw-remove-piece')).toHaveAttribute('aria-label', /the last piece you placed/)

  // Place the pulled piece back at the head the note named — the build
  // is the par line again and the launch finishes it
  await aimAndPlace(page, 'straight', exits[3]!)
  await expectBuildEquals(page, KITCHEN_SANDBOX.parBuild())
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 90_000 })
  // FINISHED: the verdict prints a time and no failure note (the page's
  // piece order is the builder's, the sim's answer is order-blind)
  await expect(page.locator('#gw-result-time')).toContainText(/\d+\.\d\d/)
  await expect(page.locator('#gw-result-note')).toBeHidden()
  expect(errors).toEqual([])
})

test('the sandbox sheet face: counts ride the earned line (never their own), and the LINES tab footline prints the ledger', async ({ page }) => {
  test.setTimeout(240_000)

  // FIRST FINISH on the sandbox's own par line (build=par remounts it):
  // the tail's earned line gains the honesty sentence; nothing else grew
  await goto(page, '/?level=kitchen-sandbox&build=par&launch=1')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 90_000 })
  const tail = page.locator('#gw-result-tally')
  await expect(tail).toBeVisible()
  const first = ((await tail.textContent()) ?? '').split('\n')[0] ?? ''
  expect(first).toContain('earned —')
  expect(first).toContain('your own runs on this device only')

  // SECOND FINISH: the sheet moved, so the numbers show beside the words
  // they count — small, in parentheses, never as their own line
  await page.click('#gw-result-retry')
  await ready(page)
  await page.click('#gw-launch')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 90_000 })
  const second = ((await tail.textContent()) ?? '').split('\n')[0] ?? ''
  expect(second).toMatch(/\w \(\d+\)/) // e.g. `air (2)` — the lifetime number
  expect(second).toContain('your own runs on this device only')

  // the campaign bar keeps the shipped tail byte-identical: no numbers,
  // no honesty sentence (sheet `null`)
  await goto(page, '/?level=kitchen05&build=par&launch=1')
  await expect(page.locator('#gw-result')).toBeVisible({ timeout: 90_000 })
  const camp = (await page.locator('#gw-result-tally').textContent()) ?? ''
  expect(camp).toContain('earned —')
  expect(camp).not.toContain('on this device')
  expect(camp).not.toMatch(/\w \(\d+\)/)

  // THE LINES TAB footline: the whole ledger, read-only, zeros and all
  await goto(page, '/?levels=1')
  await page.click('#gw-tab-lines')
  await expect(page.locator('#gw-panel-lines')).toBeVisible()
  const sheet = page.locator('#gw-lines-sheet')
  await expect(sheet).toBeVisible()
  const line = (await sheet.textContent()) ?? ''
  expect(line).toMatch(/air \d+/)
  expect(line).toMatch(/clean catch \d+/)
  expect(line).toMatch(/chain fall \d+/)
  // the room-crossing badge is a campaign-loop fact — a free session on
  // these two sandbox runs mints none, and the face prints the zero
  // honestly (a ledger that hides its zeros is edited, not calm)
  expect(line).toContain('room crossing 0')
  expect(line).toMatch(/booster spend \d+/)
  expect(line).toContain('your own runs on this device only')
})
