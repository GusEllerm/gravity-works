/**
 * The BOOT invariant (N-wave fault, playtest N's kitchen02 "tray empty at
 * boot" report): what the GAME mounts when a rung first boots must be the
 * FIXTURES and nothing else — every tray piece lives in the tray at full
 * count, so there is always a line left to build. The fault class is a
 * kind shared between the `tray` and the `fixtures` table: a membership test
 * cannot tell the fixture's copy from the tray's, and mounts the whole tray
 * (`initialBuild` now applies the occurrence-quota rule;
 * `trayParityBuild`/`playerPieceCount` share it).
 *
 * Pinned here for EVERY rung of the campaign ladder, deterministically and
 * without a browser:
 *
 * 1. boot build ⊆ fixtures — the boot build's per-kind multiset never
 *    exceeds the level's declared `fixtures` counts (the fault's exact
 *    shape: tray pieces riding in on the boot build);
 * 2. the boot build is mounted entirely from the fixture table — every
 *    piece it carries is a declared kind (no stray parBuild placements);
 * 3. the TRAY MAP IS DISJOINT FROM THE FIXTURE TABLE — the rule every rung
 *    follows today (the L02 curve run-out rides fixtures precisely because
 *    `curve` is not in L02's tray). This is what makes "fixture vs tray"
 *    decidable at all; if a rung ever wants a kind in BOTH, this test is
 *    the gate that forces the mount rule to be authored, not guessed;
 * 4. the tray boots FULL — for every tray kind, the boot build mounted
 *    fewer copies than the tray's allowance, so the ×N legend boots at
 *    (allowance − mounted) > 0 and a fresh rung always has pieces to place.
 */
import { describe, expect, test } from 'vitest';
import { initialBuild, trayParityBuild } from '../../src/boot.ts';
import { CAMPAIGN_LADDER } from '../../src/world/campaign.ts';
import { getLevel } from '../../src/world/levels/feeltrack.level.ts';
import type { PieceKind } from '../../src/track/pieces.ts';

interface Rung {
  id: string;
  tray: Partial<Record<PieceKind, number>>;
  fixtures: Partial<Record<PieceKind, number>>;
}

/** Every ladder rung with a fixture table (the game-shell rungs — the feel
 *  rig is off-ladder and ships its reference build by contract). */
const rungs: Rung[] = [];
for (const id of CAMPAIGN_LADDER) {
  const level = getLevel(id) as unknown as {
    tray?: Partial<Record<PieceKind, number>>;
    fixtures?: Partial<Record<PieceKind, number>>;
    parBuild?: () => unknown;
  };
  if (level.tray && level.fixtures && level.parBuild) {
    rungs.push({ id, tray: level.tray, fixtures: level.fixtures });
  }
}

const countByKind = (id: string): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const p of initialBuild(getLevel(id)).pieces) out[p.def] = (out[p.def] ?? 0) + 1;
  return out;
};

const at = (m: Partial<Record<PieceKind, number>>, kind: string): number | undefined =>
  m[kind as PieceKind];

describe('boot invariants: every rung boots fixtures-only, tray full', () => {
  test('the probe actually walks the whole ladder', () => {
    expect(rungs.length).toBe(CAMPAIGN_LADDER.length);
  });

  test('the boot build never mounts more of a kind than the fixtures declare', () => {
    for (const r of rungs) {
      const mounted = countByKind(r.id);
      for (const [kind, n] of Object.entries(mounted)) {
        expect(at(r.fixtures, kind), `${r.id}: boot mounted ${kind} (not a declared fixture)`).toBeDefined();
        expect(n, `${r.id}: mounted ${n} × ${kind}, fixtures declare ${at(r.fixtures, kind)}`).toBeLessThanOrEqual(
          at(r.fixtures, kind) ?? 0,
        );
      }
    }
  });

  test('no rung shares a kind between the tray and the fixtures', () => {
    // the mount-rule's decidability gate (see the header): fixture-vs-tray
    // is a per-kind fact ONLY while the two tables are disjoint
    for (const r of rungs) {
      for (const kind of Object.keys(r.tray)) {
        expect(at(r.fixtures, kind), `${r.id}: kind ${kind} is in BOTH the tray and the fixtures`).toBeUndefined();
      }
    }
  });

  test('the tray boots FULL on every rung: allowance − mounted > 0 for every tray kind', () => {
    for (const r of rungs) {
      const mounted = countByKind(r.id);
      for (const [kind, allowance] of Object.entries(r.tray)) {
        const left = (allowance ?? 0) - (mounted[kind] ?? 0);
        expect(left, `${r.id}: tray boots with ${left} × ${kind} left to place`).toBeGreaterThan(0);
      }
    }
  });

  test('the tray can still place the par build everywhere (parity rides the same rule)', () => {
    // `trayParityBuild` byte-identity to `parBuild` is the ladder tests'
    // claim; the boot-side restatement: every piece the boot mounted sits in
    // the parity build AT ITS OWN anchored transform — the parity probe
    // anchors exactly the fixtures, and chains everything else from them
    for (const r of rungs) {
      const level = getLevel(r.id);
      const parity = trayParityBuild(level);
      const mounted = initialBuild(level);
      for (const p of mounted.pieces) {
        const same = parity.pieces.some(
          (q) =>
            q.def === p.def &&
            q.transform.elements.every((v, i) => v === p.transform.elements[i]),
        );
        expect(same, `${r.id}: parity lost fixture ${p.def} at its anchored transform`).toBe(true);
      }
    }
  });
});
