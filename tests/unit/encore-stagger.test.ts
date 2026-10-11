/**
 * THE ENCORE DEATH-CLOCK STAGGER (Action Plan 2026-10-11, P4 item 6, round-2
 * Lane A) — the four `05` encores used to ride ONE shared rail, so the SAME
 * failing build died at the SAME millisecond in sibling rooms (player round
 * 2: "the same build dies at the same 2.63 s in both rooms"; the plan's
 * headline: four encores die by milliseconds).
 *
 * The canonical fail is the rung family's own promise wall — `drop →
 * straight → landing`, crossing two uncrossed. It dies in all four rooms,
 * so it is the clock all four share a name with. THE LAW: these four death
 * clocks are pairwise ≥ 0.3 s apart, pinned to the millisecond.
 *
 * The geometry that delivers it (measured, each room's own table in the
 * session note `Sessions/2026-10-11 Round2 choice.md`):
 *   garden05   −29°/0.24 m porch chute, unchanged — the PORCH-PAIR ANCHOR
 *              (every measured move — grade, release — broke the hidden
 *              booster line; the −29° tool is also the rung's own law).
 *   garage05   the chute eased to −17° at the same 0.24 m drop + a 0.22 m
 *              stagger plate (`GAR05_PLANK`); every law's status survives.
 *   bathroom05 the shelf's own grade, −12.4° (`BATH05_GRADE`) — the
 *              SHELF-PAIR anchor slot, moved two ticks to open the pair.
 *   bedroom05  the finale's 0.26 m shelf eased to −11.35° (`BED05_GRADE`)
 *              with the rung's 0.18 m crossing plate (`BED05_PLANK`) that
 *              keeps the longer crawl on the set's 1.4 m floor disc.
 *
 * Honest footnotes: the plan's own "die at the same 2.25 s" folklore was
 * measured wrong (the pair clocks sat at ~2.81–2.91 s on the shelf rail and
 * ~1.44–1.48 s on the porch rail — two shared clocks, not one), and the
 * stagger's pars were re-derived by `npm run pars` (bathroom 3.05 → 2.9,
 * bedroom 3.05 → 3.15, garage 1.35 → 2.0; garden stays 1.35).
 */
import { describe, expect, test } from 'vitest';
import { initRapier } from '../../src/physics/sim.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { PIECES, type PieceKind } from '../../src/track/pieces.ts';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import type { Build } from '../../src/track/build.ts';
import { levelTrayParams } from '../../src/ui/advice.ts';
import { GARDEN05 } from '../../src/world/levels/garden05.level.ts';
import { GARAGE05 } from '../../src/world/levels/garage05.level.ts';
import { BATHROOM05 } from '../../src/world/levels/bathroom05.level.ts';
import { BEDROOM05 } from '../../src/world/levels/bedroom05.level.ts';
import type { KitchenLevel } from '../../src/world/levels/kitchen01.level.ts';

type Rung = Omit<KitchenLevel, 'set'>;

const CANONICAL_FAIL: readonly PieceKind[] = ['drop', 'straight', 'landing'];

function placed(level: Rung, kinds: readonly PieceKind[]): Build {
  const par = level.parBuild();
  const fixtures = new Set(Object.keys(level.fixtures!));
  const pieces = par.pieces.filter((p) => fixtures.has(p.def)).map((p, i) => ({ ...p, seq: i }));
  const params = levelTrayParams(level, level.tray)!;
  const ramp = pieces.find((p) => p.def === 'ramp')!;
  let cursor = transformSocket(PIECES.ramp.sockets(ramp.params)[1], ramp.transform);
  for (const def of kinds) {
    const p = { ...params[def] };
    const t = fitSocket(cursor, PIECES[def].sockets(p)[0]);
    pieces.push({ def, params: p, transform: t, seq: pieces.length });
    cursor = transformSocket(PIECES[def].sockets(p)[1], t);
  }
  return { levelId: level.id, pieces, seed: level.seed };
}

// The pinned table (measured, `npm run replay`-grade deterministic).
const DEATHS: Record<string, number> = {
  garden05: 1.475,
  garage05: 2.0083333333333333,
  bathroom05: 2.7916666666666665,
  bedroom05: 3.100,
};

describe('encore death-clock stagger — P4 item 6 (round 2)', () => {
  test('the canonical fail still DIES in all four encores (the promise wall is the clock)', async () => {
    await initRapier();
    for (const level of [GARDEN05, GARAGE05, BATHROOM05, BEDROOM05] as readonly Rung[]) {
      const run = await replayRun(level, placed(level, CANONICAL_FAIL));
      expect(run.status, level.id).not.toBe('finished');
      expect(run.time, level.id).toBeCloseTo(DEATHS[level.id]!, 4);
    }
  }, 180_000);

  test('every pair of encore death clocks is ≥ 0.3 s apart (the stagger law)', async () => {
    const ids = Object.keys(DEATHS);
    for (const a of ids) for (const b of ids) {
      if (a === b) continue;
      expect(Math.abs(DEATHS[a]! - DEATHS[b]!), `${a} vs ${b}`).toBeGreaterThanOrEqual(0.3);
    }
  });

  test('the four pars are pairwise distinct clocks too (no two rungs replay alike)', async () => {
    await initRapier();
    const hashes = new Map<string, string>();
    for (const level of [GARDEN05, GARAGE05, BATHROOM05, BEDROOM05] as readonly Rung[]) {
      const run = await replayRun(level, level.parBuild());
      expect(run.status, level.id).toBe('finished');
      hashes.set(level.id, run.hash);
    }
    expect(new Set(hashes.values()).size).toBe(4);
  }, 180_000);
});
