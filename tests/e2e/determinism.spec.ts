/**
 * Stage 2 determinism cross-check (PROMPT.md §2.2; §10 accept line "the
 * headless determinism test passes; a share link replays to the same hash").
 *
 * For ONE (level, build, seed) — the real feel track — the state hash is
 * computed twice: in NODE (`replayRun` over `World` with `visuals: false`)
 * and in the BROWSER page (the `#s=` shared-run page in `src/boot.ts`
 * replays the same data and echoes its recomputed hash). This spec records
 * the honesty matrix that feeds the Decision Log's cross-platform claim:
 *
 *   node <-> node    HARD-ASSERTED (same process, same wasm, must match)
 *   node <-> browser HARD-ASSERTED since the stage-3 review — the outcome
 *                    has been KNOWN-GOOD (MATCH / `verified`) on every run
 *                    since the stage-2 gate (see `Modules/replay`), so the
 *                    §2.2 "reported, not asserted" allowance is retired.
 *                    Wiring: the spec's own Node process IS the node side
 *                    (same `replayRun` import the tools use — no spawn,
 *                    no fixture file to drift); the browser recomputes
 *                    independently and compares against the hash embedded
 *                    in the share fragment, so the assertion below is a
 *                    genuine two-engine compare. A mismatch on any runner
 *                    is a REAL cross-engine/cross-platform finding — fail
 *                    loudly, never skip around it.
 */
import { test, expect } from '@playwright/test'
import zlib from 'node:zlib'
import { replayRun } from '../../src/replay/replay.ts'
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts'
import { encodeShareUrl, type ShareCodec } from '../../src/share/share.ts'

const zlibCodec: ShareCodec = {
  deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))),
  inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))),
}

const HEX8 = /^[0-9a-f]{8}$/

test.describe('stage 2 determinism cross-check (level, build, seed)', () => {
  test('node <-> node: the same run stepped twice hashes identically', async () => {
    const build = FEELTRACK.placeholderBuild()
    const a = await replayRun(FEELTRACK, build)
    const b = await replayRun(FEELTRACK, FEELTRACK.placeholderBuild()) // fresh Build object

    console.log(
      `[determinism:node-vs-node] run1 ${a.hash} (${a.steps} steps, ${a.status}) ` +
        `run2 ${b.hash} (${b.steps} steps, ${b.status}) => ${a.hash === b.hash ? 'MATCH' : 'MISMATCH'}`,
    )
    expect(a.hash).toMatch(HEX8)
    expect(b.hash).toMatch(HEX8)
    expect(b.hash).toBe(a.hash)
    expect(b.steps).toBe(a.steps)
    expect(b.status).toBe(a.status)
  })

  test('node <-> browser: the browser replay must reproduce the node hash (hard gate)', async ({ page }) => {
    const build = FEELTRACK.placeholderBuild()
    const node = await replayRun(FEELTRACK, build)

    // Embed the NODE-computed hash in a share fragment; the page recomputes
    // from the same (level, build, seed) and declares verified/mismatch
    // against what we embedded — that verdict IS the node-vs-browser compare.
    const url = await encodeShareUrl(
      { levelId: build.levelId, seed: build.seed, hash: node.hash, build },
      zlibCodec,
    )
    await page.goto(`/${url}`)
    const statusLocator = page.locator('#gw-replay-status')
    await expect(statusLocator).toHaveText(/verified|mismatch/, { timeout: 60_000 })
    const echoed = await page.locator('#gw-replay-hash').textContent()
    const browserHash = echoed?.match(/replay hash ([0-9a-f]{8})/)?.[1]
    expect(browserHash, `page echoed no hash in ${JSON.stringify(echoed)}`).toMatch(HEX8)

    const verdict = (await statusLocator.textContent())!.trim()
    const match = browserHash === node.hash
    const line =
      `[determinism:node-vs-browser] node ${node.hash} browser ${browserHash} => ` +
      `${match ? 'MATCH' : 'MISMATCH'} (page verdict: ${verdict})`
    console.log(line)
    test.info().annotations.push({
      type: match ? 'determinism' : 'determinism-MISMATCH',
      description: line,
    })
    // HARD gate (stage-3 review): the outcome has been known-good on every
    // run since the stage-2 gate, so equality is now asserted — same wasm,
    // same fixed-point discipline, no tolerance. A failure here is a real
    // cross-engine/cross-platform nondeterminism finding to investigate,
    // never a flake to skip.
    expect(match, line).toBe(true)
    expect(verdict, `page verdict for ${node.hash}`).toBe('verified')
  })
})
