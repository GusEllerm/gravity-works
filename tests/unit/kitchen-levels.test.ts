/**
 * Kitchen ladder playability proof (stage 3, Level Designer's gate).
 *
 * The rule: a level whose par build does not finish is a bug in the LEVEL,
 * not in the physics. Every parBuild in the kitchen ladder — five levels plus
 * the sandbox — is replayed headless through the same seam the share links
 * and the determinism harness use (`replayRun` -> `World`, raycast-wheel car,
 * the shipped `ROLL_COEF`, the feel harness's own physics), and the status
 * must be `finished`. On top of the gate: the level contracts hold (budget =
 * tray, par build replays identically twice), L02's second line and L04's
 * ground line really finish (the choices are real), and L05's two wrong
 * allocations really DON'T (the trade-off is real).
 *
 * The rung that cannot be proven is stated in Concepts/Levels: no mid-run
 * yaw arc (curve/bank) is drivable by either shipped car, so L02's curve and
 * L03's bowl line are fixture geometry past the cup and that rung of the
 * ladder is BLOCKED pending piece request 1.
 */
import { describe, expect, test } from 'vitest';
import { KITCHEN01, KITCHEN_GEOM, trayCount, type KitchenLevel } from '../../src/world/levels/kitchen01.level.ts';
import { serialize, type Build } from '../../src/track/build.ts';
import { levelTrayParams, trayParityBuild } from '../../src/boot.ts';
import { PARS } from '../../src/world/stars.ts';
import type { PieceKind } from '../../src/track/pieces.ts';
import { KITCHEN02, kitchen02ArcBuild } from '../../src/world/levels/kitchen02.level.ts';
import { KITCHEN03 } from '../../src/world/levels/kitchen03.level.ts';
import { KITCHEN04, kitchen04GroundBuild } from '../../src/world/levels/kitchen04.level.ts';
import {
  KITCHEN05,
  KITCHEN_SANDBOX,
  kitchen05LateBoosterBuild,
  kitchen05NoBoosterBuild,
} from '../../src/world/levels/kitchen05.level.ts';
import { replayRun } from '../../src/replay/replay.ts';

const LADDER: readonly KitchenLevel[] = [KITCHEN01, KITCHEN02, KITCHEN03, KITCHEN04, KITCHEN05, KITCHEN_SANDBOX];

describe('kitchen ladder — every par build finishes (headless)', () => {
  for (const level of LADDER) {
    test(`${level.id} par build finishes`, async () => {
      const result = await replayRun(level, level.parBuild());
      expect(result.status).toBe('finished');
    }, 30_000);
  }

  test('the par build replays identically twice (kitchen levels are data)', async () => {
    const first = await replayRun(KITCHEN01, KITCHEN01.parBuild());
    const second = await replayRun(KITCHEN01, KITCHEN01.parBuild());
    expect(first.hash).toBe(second.hash);
    expect(first.steps).toBe(second.steps);
  });

  test('the finish is reached well inside the run cap on every rung', async () => {
    for (const level of LADDER) {
      const result = await replayRun(level, level.parBuild());
      expect(result.time).toBeLessThan(level.maxTime * 0.75);
    }
  }, 60_000);
});

describe('kitchen ladder — level contracts', () => {
  for (const level of LADDER.filter((l) => !l.sandbox)) {
    test(`${level.id}: budget = tray total, par pieces <= tray, release on a slope`, () => {
      expect(level.budget).toBe(trayCount(level.tray));
      expect(level.par.pieces).toBeLessThanOrEqual(level.budget);
      // the release pose sits on the start ramp's descending blend (a level
      // deck release stalls against the tuned rolling resistance)
      expect(level.startSocket.tangent.y).toBeLessThan(0);
      expect(level.startSocket.tangent.y).toBeCloseTo(Math.sin((KITCHEN_GEOM.rampAngle * Math.PI) / 180), 1);
    });
  }

  test('the sandbox has no budget and everything unlocked', () => {
    expect(KITCHEN_SANDBOX.sandbox).toBe(true);
    expect(KITCHEN_SANDBOX.budget).toBeGreaterThanOrEqual(999);
  });

  test('L01 tutorial: three tray pieces, one gap, and the par build IS all three', () => {
    expect(Object.keys(KITCHEN01.tray)).toHaveLength(3);
    expect(KITCHEN01.budget).toBe(3);
    const kinds = KITCHEN01.parBuild().pieces.map((p) => p.def);
    expect(kinds).toEqual(['ramp', 'gapLip', 'drop', 'landing', 'finishCup']);
  });

  test('L03 exposes the bowl rim sockets the Environment Artist builds to', () => {
    const sockets = KITCHEN03.propSockets!;
    expect(Object.keys(sockets).sort()).toEqual(['bowl.in', 'bowl.out']);
    expect(sockets['bowl.in']!.pos.distanceTo(sockets['bowl.out']!.pos)).toBeGreaterThan(0.01);
  });

  test('L04 carries the wet patch as data with the brief grip factor', () => {
    const hazard = KITCHEN04.hazards![0]!;
    expect(hazard.kind).toBe('wetPatch');
    expect(hazard.gripFactor).toBe(0.5);
    expect(hazard.source).toBe('tap');
  });
});

describe('kitchen ladder — tray ⊇ parBuild (a level you cannot build is not a level)', () => {
  /** Every line a level AUTHORS, in the level's own data: the par line plus
   *  the alternates the cards promise (L02's arc, L04's ground, L05's two
   *  wrong allocations). The invariant is asserted over all of them, so a
   *  second line cannot quietly grow a piece the tray does not hold. */
  const LINES: readonly { level: KitchenLevel; label: string; build: Build }[] = [
    ...LADDER.map((level) => ({ level, label: 'par build', build: level.parBuild() })),
    { level: KITCHEN02, label: 'arc line', build: kitchen02ArcBuild() },
    { level: KITCHEN04, label: 'ground line', build: kitchen04GroundBuild() },
    { level: KITCHEN05, label: 'no-booster line', build: kitchen05NoBoosterBuild() },
    { level: KITCHEN05, label: 'late-booster line', build: kitchen05LateBoosterBuild() },
  ];

  /** Pieces per kind, as a multiset. */
  function multiset(pieces: Build['pieces']): Map<PieceKind, number> {
    const counts = new Map<PieceKind, number>();
    for (const p of pieces) counts.set(p.def, (counts.get(p.def) ?? 0) + 1);
    return counts;
  }

  for (const { level, label, build } of LINES) {
    test(`${level.id} — ${label}: tray ⊇ build (every piece is tray- or fixture-afforded, at the tray's ONE geometry)`, () => {
      for (const [kind, needed] of multiset(build.pieces)) {
        const afford = (level.tray[kind] ?? 0) + (level.fixtures?.[kind] ?? 0);
        expect(
          afford,
          `${level.id} ${label}: places ${needed} × ${kind}, tray (${JSON.stringify(level.tray)}) + fixtures (${JSON.stringify(level.fixtures)}) afford ${afford}`,
        ).toBeGreaterThanOrEqual(needed);
        // the tray seats a held kind with ONE geometry — the level's declared
        // `trayParams` for it, else its first placement in the par build
        // (`levelTrayParams`, what the ghost and the seat actually use). A
        // line that places the same kind at OTHER parameters is a line the
        // shipped builder cannot place, however well the tray counts out.
        const params = levelTrayParams(level, level.tray) ?? {};
        const geometry =
          params[kind] ?? level.parBuild().pieces.find((p) => p.def === kind)?.params;
        for (const p of build.pieces.filter((q) => q.def === kind)) {
          expect(p.params, `${level.id} ${label}: a second ${kind} geometry`).toEqual(geometry);
        }
      }
    });
  }

  for (const level of LADDER) {
    test(`${level.id} — pars.json's par piece count is the same tray-basis number (the panel compares against the tray counter)`, () => {
      // The deployed panel said "3 pieces — par 5" on a three-piece tutorial:
      // `scripts/gen-pars.mjs` recorded the WHOLE reference build, fixtures
      // included, while `Builder.playerCount` counts tray placements only. One
      // basis, pinned.
      expect(PARS[level.id]?.pieces).toBe(level.par.pieces);
    });
  }

  for (const level of LADDER) {
    test(`${level.id} — the tray's own seating reproduces the par build byte-for-byte`, () => {
      // fixtures anchored at their par transforms (initialBuild), tray pieces
      // seated with the tray's single geometry per kind — what the player can
      // actually end up with, equal to the build the par was measured on.
      expect(serialize(trayParityBuild(level))).toBe(serialize(level.parBuild()));
    });
  }

  for (const level of LADDER) {
    test(`${level.id} — budget = tray total, and the level's par piece count is the TRAY basis pars.json records`, () => {
      const fromTray = level.parBuild().pieces.filter((p) => !(p.def in (level.fixtures ?? {}))).length;
      // the sandbox is the one level where the tray total is NOT the budget
      // (it declares "no budget": 999; the tray is everything ×99)
      if (!level.sandbox) expect(level.budget).toBe(trayCount(level.tray));
      expect(level.par.pieces).toBe(fromTray); // fixtures are nobody's purchase
      expect(fromTray).toBeLessThanOrEqual(level.budget);
    });
  }
});

describe('kitchen ladder — the choices and the trade-off are real', () => {
  test('L02: BOTH lines across the one gap finish', async () => {
    const par = await replayRun(KITCHEN02, KITCHEN02.parBuild());
    const arc = await replayRun(KITCHEN02, kitchen02ArcBuild());
    expect(par.status).toBe('finished');
    expect(arc.status).toBe('finished');
    // the lazy line (drop between straights) is the FAST one — that is the lesson
    expect(par.time).toBeLessThan(arc.time);
  }, 30_000);

  test('L04: the ground line through the wet patch also finishes (wet — the zone hook is live, see Modules/hazards)', async () => {
    const ground = await replayRun(KITCHEN04, kitchen04GroundBuild());
    expect(ground.status).toBe('finished');
  }, 30_000);

  test('L05: the two wrong allocations do NOT finish', async () => {
    const noBooster = await replayRun(KITCHEN05, kitchen05NoBoosterBuild());
    const lateBooster = await replayRun(KITCHEN05, kitchen05LateBoosterBuild());
    expect(noBooster.status).not.toBe('finished');
    expect(lateBooster.status).not.toBe('finished');
  }, 30_000);
});

/**
 * THE L01 PROMISE (stage 3, "L01 promise fix"). The playtest finding: the
 * three tray pieces did NOT close the gap with the shipped default launch
 * (A), and finishing needed a straight the budget never intended (C). The
 * gap geometry was re-authored so the exact three-piece fit (gapLip -> drop
 * -> landing, as the tray teaches) finishes — with MARGIN, not luck:
 * bit-stable across a seed sweep, and finishing across the whole release-
 * speed range (the old geometry fell from a 0.2-sim-unit nudge; the new one
 * survives up to the kit's full launch speed). And ONLY the three-piece fit
 * finishes: a build missing any tray piece is replayed the way the shipped
 * builder mounts one (`initialBuild` in boot.ts: fixtures sit ANCHORED at
 * their par transforms, the player's pieces chain off the start), so a
 * missing piece leaves its hole as real geometry and the car falls in.
 */
function l01BuildMissing(def: string): Build {
  const par = KITCHEN01.parBuild();
  const cup = par.pieces.find((p) => p.def === 'finishCup')!;
  const placed = par.pieces.filter((p) => p.def !== 'finishCup' && p.def !== def && (def !== 'all' || p.def === 'ramp'));
  return { levelId: KITCHEN01.id, seed: par.seed, pieces: [...placed, cup] };
}

describe('L01 promise — the three-piece tray fit finishes with margin, and ONLY it', () => {
  test('the exact three-piece fit finishes with the shipped default launch', async () => {
    const run = await replayRun(KITCHEN01, KITCHEN01.parBuild());
    expect(run.status).toBe('finished');
    expect(run.time).toBeLessThan(3); // measured 2.23 s; a full second of headroom
  }, 30_000);

  test('no build missing a tray piece finishes (cup anchored as in the shipped builder)', async () => {
    for (const def of ['gapLip', 'drop', 'landing']) {
      const run = await replayRun(KITCHEN01, l01BuildMissing(def));
      expect(run.status, `missing ${def}`).not.toBe('finished');
    }
    const bare = await replayRun(KITCHEN01, l01BuildMissing('all'));
    expect(bare.status).not.toBe('finished');
  }, 60_000);

  test('the finish is seed-stable (bit-identical times, 8-seed sweep)', async () => {
    const times = new Set<number>();
    for (let seed = 1; seed <= 8; seed++) {
      const build = KITCHEN01.parBuild();
      const run = await replayRun({ ...KITCHEN01, seed }, { ...build, seed });
      expect(run.status).toBe('finished');
      times.add(Number(run.time.toFixed(6)));
    }
    expect(times.size).toBe(1); // 0 % spread across the sweep
  }, 90_000);

  test('the finish survives the whole release-speed range (default 0 .. kit launch 3)', async () => {
    for (const launchSpeed of [0, 0.2, 1, 3]) {
      const run = await replayRun(KITCHEN01, KITCHEN01.parBuild(), { launchSpeed });
      expect(run.status, `launchSpeed ${launchSpeed}`).toBe('finished');
    }
  }, 60_000);
});
