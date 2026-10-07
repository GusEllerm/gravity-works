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
import { PIECES, type PieceKind } from '../../src/track/pieces.ts';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
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
import { World } from '../../src/world/world.ts';

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
      // deck release stalls against the tuned rolling resistance). L02 is
      // the one rung that deviates from the shared −12° ramp convention —
      // its own contract test below pins its steeper chute.
      if (level.id === KITCHEN02.id) return;
      expect(level.startSocket.tangent.y).toBeLessThan(0);
      expect(level.startSocket.tangent.y).toBeCloseTo(Math.sin((KITCHEN_GEOM.rampAngle * Math.PI) / 180), 1);
    });
  }

  test('L02: its stage-4 fail-timing pass deviates from the ladder ramp convention — a short steep chute, release on ITS slope', () => {
    // the −12°/0.28 m shared ramp was the CLUSTERING ENGINE: its 1.8 s
    // crawl put every wrong death at 2.2–2.4 s regardless of the mistake
    // (see the level header). The chute's angle is level-local, like L04's
    // gap; everything else on the rung stays on convention.
    const ramp = KITCHEN02.parBuild().pieces.find((p) => p.def === 'ramp')!.params as { angle: number };
    expect(ramp.angle).toBe(-29); // steep chute; the height rides in `level` (rampLevelForDrop)
    expect(KITCHEN02.startSocket.tangent.y).toBeLessThan(0);
    expect(KITCHEN02.startSocket.tangent.y).toBeCloseTo(Math.sin((-29 * Math.PI) / 180), 1);
  });

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
    // L04's ground build left this table at the learnability pass (Playtest
    // G): it is the hazard/juice PROBE (the decked sink the wet patch is
    // centred on and the divergence the zone hook is measured with), not an
    // authored ROUTE — its bridged deck ends at the ramp's deck height,
    // above and short of the anchored cup (measured `fell`), so it is not
    // tray-affordable and must not be claimed as one. See
    // kitchen04.level.ts's header; the probe still replays below.
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
  test('L04: the ground PROBE through the wet patch finishes (it is hazard data replay, not a player route — the tray does not afford it and the anchored cup would reject it)', async () => {
    const ground = await replayRun(KITCHEN04, kitchen04GroundBuild());
    expect(ground.status).toBe('finished');
  }, 30_000);

  test('L02: Playtest E’s lazy build (straight→drop→straight) finishes on the BUILDER mount — the line was discoverable; E’s failure predates the target-follow fix', async () => {
    const run = await replayRun(KITCHEN02, kitchenPlaced(KITCHEN02, ['straight', 'drop', 'straight']));
    expect(run.status).toBe('finished'); // measured 1.01 s (stage-4 fail-timing re-author)
  }, 30_000);

  /**
   * THE L02 DISCOVERABILITY PASS (stage 4). Playtest H (4 tries, three ends
   * “fell off after a long jump”, ~2.4 s) and Playtest K (3 builds, all
   * “fell off the set”, ~3.1 s) hit the same wall from opposite sides: the
   * 5-piece tray held two 3–4-piece lines whose chains split into finishes,
   * flyovers PAST the anchored cup, and launches into the hole — all with no
   * visible cue which rail a chain rides. Replaying their reported builds on
   * the builder’s anchored mount reproduced both death classes; the fix is
   * the tray (the union of the two lines, no spare) plus a gap geometry that
   * makes the reach sums agree — so EVERY order of the whole tray finishes
   * (the bedroom04 pattern), the two lines are the only three-piece routes
   * worth wanting, and no reachable build dies far past the cup anymore.
   */
  test('L02: EVERY order of the whole tray finishes on the builder mount (no stranger’s wall)', async () => {
    const orders = permutations<PieceKind>(['straight', 'straight', 'gapLip', 'drop']);
    expect(orders).toHaveLength(24); // 12 DISTINCT orders (the two straights are identical pieces)
    for (const order of orders) {
      const run = await replayRun(KITCHEN02, kitchenPlaced(KITCHEN02, order));
      expect(run.status, `order ${order.join('>')}`).toBe('finished'); // measured 1.01–1.16 s
    }
  }, 120_000);

  test('L02: the arc line finishes on the BUILDER mount and loses the clock to the lazy par', async () => {
    const arc = await replayRun(KITCHEN02, kitchenPlaced(KITCHEN02, ['gapLip', 'drop', 'straight']));
    const lazy = await replayRun(KITCHEN02, kitchenPlaced(KITCHEN02, ['straight', 'drop', 'straight']));
    expect(arc.status).toBe('finished'); // measured 1.07 s
    expect(lazy.status).toBe('finished'); // measured 1.01 s
    expect(lazy.time).toBeLessThan(arc.time); // the lazy line wins — in the GAME, not just the chained model
    // and the par ORDER is beatable within the tray (the L04 pattern): drop
    // first runs at/below the 1.05 par line
    const early = await replayRun(KITCHEN02, kitchenPlaced(KITCHEN02, ['drop', 'straight', 'straight']));
    expect(early.status).toBe('finished');
    expect(early.time).toBeLessThanOrEqual(PARS[KITCHEN02.id]!.time);
  }, 90_000);

  /**
   * THE L02 FAIL-TIMING PASS (stage 4, second pass). Every prior playtest
   * died INVISIBLE and IDENTICAL: nine distinct wrong builds and first tries
   * all ended at ~2.2–2.4 s with "the car vanished out of sight", because the
   * shared −12°/0.28 m ramp's ~1.8 s crawl is a clock every chain pays
   * before it can discover its own mistake. The sweep of steeper ramps ×
   * void sizes (~25 000 headless worlds) fixed the geometry that makes
   * failures speak (level header): the death clock = ramp-end arrival +
   * flight + a constant ~0.4 s fall, so a short steep chute moves EVERY
   * death to the near rail. This gate enumerates EVERY chainable build on
   * the shipped mount and pins three VISIBLE time families plus the
   * corrected airborne-x law: a failing build is never airborne above the
   * rail deck PAST the cup mouth (the old x-check sampled cars already
   * sliding on the floor — x that keeps drifting ~0.5 m past the rail — so
   * it could not see flyovers; this one samples the last point above the
   * deck plane, where a car that could hit the cup actually is).
   */
  test('L02: EVERY chainable build fails EARLY and DISTINCTLY or finishes — the three death families', async () => {
    const tray: PieceKind[] = ['straight', 'straight', 'gapLip', 'drop'];
    // every subset × every order, deduped by kind string (s/g/d keys)
    const chains = new Map<string, PieceKind[]>();
    for (let mask = 0; mask < 16; mask++) {
      const pool = [0, 1, 2, 3].filter((i) => mask & (1 << i)).map((i) => tray[i]);
      for (const order of permutations<PieceKind>(pool)) {
        const key = order.map((k) => (k === 'straight' ? 's' : k === 'gapLip' ? 'g' : 'd')).join('');
        if (!chains.has(key)) chains.set(key, order);
      }
    }
    // Pinned outcome table — measured on this geometry, seeds 1–6 and launch
    // speeds ×1.0–1.1 stable. f = finished; numbers are the fail times.
    //   ~0.9 s  near-rail: nothing or one/two flats under the release line
    //   ~1.05 s bridged decks land IN the void; ~1.15 bridge+lip catapults
    //   ~1.25 s drop pairs: the catch is crossed, the car falls OFF the drop
    const expected: Record<string, 'finish' | number> = {
      '': 0.86, s: 0.95, g: 0.96, ss: 1.04, sg: 1.04, gs: 1.05,
      d: 1.13, sd: 1.24, ds: 1.23, gd: 1.3, dg: 1.23,
      ssg: 1.14, sgs: 1.16, gss: 1.12,
      ssd: 'finish', sds: 'finish', dss: 'finish', sgd: 'finish', sdg: 'finish',
      gsd: 'finish', gds: 'finish', dsg: 'finish', dgs: 'finish',
      ssgd: 'finish', ssdg: 'finish', sgsd: 'finish', sgds: 'finish', sdsg: 'finish',
      sdgs: 'finish', gssd: 'finish', gsds: 'finish', gdss: 'finish', dssg: 'finish',
      dsgs: 'finish', dgss: 'finish',
    };    expect([...chains.keys()].sort()).toEqual(Object.keys(expected).sort());
    const { cupIn } = railGeometry(KITCHEN02);
    const failTimes: number[] = [];
    for (const [key, kinds] of chains) {
      const probe = await failProbe(KITCHEN02, kitchenPlaced(KITCHEN02, kinds));
      const want = expected[key]!;
      if (want === 'finish') {
        expect(probe.status, `build ${key}`).toBe('finished');
        continue;
      }
      expect(probe.status, `build ${key}`).not.toBe('finished');
      // the pinned time moved < 0.15 s from measurement (and NEVER back to
      // the old 2.2+ s cluster)
      expect(probe.time, `build ${key} time`).toBeGreaterThan(want - 0.15);
      expect(probe.time, `build ${key} time`).toBeLessThan(want + 0.15);
      expect(probe.time, `build ${key} dies late`).toBeLessThan(1.4);
      // never airborne past the cup mouth — the flyover class is dead: a
      // car whose whole path stays BELOW the rail deck after its last
      // support cannot touch the cup wherever it falls.
      expect(probe.airX, `build ${key} flew past the cup`).toBeLessThan(cupIn);
      failTimes.push(probe.time);
    }
    // the clustering law itself: the fail stream spans > 0.3 s across 15
    // failing builds with ≥ 12 distinct clockings (the old geometry crammed
    // 9 of 9 deaths inside 0.15 s of 2.3 s — 5 buckets at 0.1 resolution,
    // but 12 clocks at 0.01 — the RANGE is the separation claim)
    const distinct = new Set(failTimes.map((t) => Math.round(t * 100) / 100));
    expect(Math.max(...failTimes) - Math.min(...failTimes)).toBeGreaterThan(0.3);
    expect(distinct.size).toBeGreaterThanOrEqual(12);
  }, 180_000);

  test('L02: the discoverability pass’s two pinned exceptions are both dead at this geometry', async () => {
    // the old 2.20 s no-drop catapult finisher (`straight>straight>gapLip`)
    // and the `gapLip>drop` pair that wedge-captured the cup lip at the old
    // 0.12 m drop step now FALL — the fail-timing geometry left no wrong
    // build that finishes (pinned in the table test above; re-pinned here
    // so the claim names its two former exceptions).
    const fluke = await replayRun(KITCHEN02, kitchenPlaced(KITCHEN02, ['straight', 'straight', 'gapLip']));
    expect(fluke.status).not.toBe('finished');
    const pair = await replayRun(KITCHEN02, kitchenPlaced(KITCHEN02, ['gapLip', 'drop']));
    expect(pair.status).not.toBe('finished');
  }, 60_000);

  test('L05: the two wrong allocations do NOT finish', async () => {
    const noBooster = await replayRun(KITCHEN05, kitchen05NoBoosterBuild());
    const lateBooster = await replayRun(KITCHEN05, kitchen05LateBoosterBuild());
    expect(noBooster.status).not.toBe('finished');
    expect(lateBooster.status).not.toBe('finished');
  }, 30_000);
});

/**
 * THE L04 LEARNABILITY PASS (Playtest G: nine attempts, every tray combo,
 * "nose-first"/"flew off", quit at this rung). The wall was the TRAY, not
 * the physics: it held five pieces for a four-piece answer, so the puzzle
 * was "guess which 4 of 5" and every wrong subset fell into the sink. The
 * fix is eligibility: the tray IS the par line's multiset (4 = budget), and
 * because every kit socket seats flat, a chained line's reach is an
 * order-invariant SUM of its pieces — so EVERY whole-tray chain lands
 * deck-to-deck at the cup. Asserted here against the mount the shipped
 * builder makes (fixtures anchored at their par transforms via
 * `initialBuild`, tray pieces seated with the tray's geometry in the order
 * the player places them — the same emulation that reproduced G's nine
 * failures byte-for-failure).
 */
function kitchenPlaced(level: KitchenLevel, kinds: readonly PieceKind[]): Build {
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

const kitchen04Placed = (kinds: readonly PieceKind[]): Build => kitchenPlaced(KITCHEN04, kinds);

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  const out: T[][] = [];
  items.forEach((x, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).forEach((p) => out.push([x, ...p])),
  );
  return out;
}

/** The rail deck surface height (the par rail's flat straights) and the
 *  cup mouth x (the par rail's LAST straight's exit socket) — the datum
 *  pair for the airborne-x law: a car that has dropped below the deck plane
 *  can no longer reach the cup at all. */
function railGeometry(level: KitchenLevel) {
  const par = level.parBuild();
  const deckY = Math.min(...par.pieces.filter((p) => p.def === 'straight').map((p) => p.transform.elements[7]!));
  const last = [...par.pieces].reverse().find((p) => p.def === 'straight')!;
  const [, out] = PIECES.straight.sockets(last.params);
  const m = last.transform.elements;
  const cupIn = m[0]! * out.pos.x + m[4]! * out.pos.y + m[8]! * out.pos.z + m[12]!;
  return { deckY, cupIn };
}

/** Replay with the DECK-PLANE x metric: the last point the car was seen at
 *  or above the rail deck (the furthest point where it could still have
 *  hit the cup). Replaces the floor-plane sampling that hid flyovers. */
async function failProbe(level: KitchenLevel, build: Build) {
  const { deckY } = railGeometry(level);
  const world = await World.create(level, build, { visuals: false });
  world.launch();
  let airX = 0;
  while (world.stepCount < 15 * 120 && world.status === 'running') {
    world.step();
    const pose = world.carPose(1);
    if (pose.pos.y > deckY - 0.03) airX = pose.pos.x;
  }
  const result = { status: world.status, time: world.time, airX };
  world.dispose();
  return result;
}

describe('kitchen04 — learnability: place-everything works, guessing is over', () => {
  test('the tray is exactly the par line\u2019s multiset (no spare piece to guess with)', () => {
    const counts = new Map<PieceKind, number>();
    for (const p of KITCHEN04.parBuild().pieces) counts.set(p.def, (counts.get(p.def) ?? 0) + 1);
    for (const [kind, n] of counts) {
      if (kind === 'ramp' || kind === 'finishCup') continue; // fixtures
      expect(KITCHEN04.tray[kind], `tray ${kind}`).toBe(n);
    }
    for (const kind of Object.keys(KITCHEN04.tray) as PieceKind[]) {
      expect(counts.get(kind) ?? 0, `${kind} is load-bearing`).toBe(KITCHEN04.tray[kind]);
    }
    expect(KITCHEN04.par.pieces).toBe(trayCount(KITCHEN04.tray));
  });

  test('ALL 24 orders of the four tray pieces finish (builder-anchored mount)', async () => {
    const orders = permutations<PieceKind>(['gapLip', 'drop', 'landing', 'straight']);
    expect(orders).toHaveLength(24);
    for (const order of orders) {
      const run = await replayRun(KITCHEN04, kitchen04Placed(order));
      expect(run.status, `order ${order.join('>')}`).toBe('finished');
    }
  }, 180_000);

  test('Playtest G\u2019s partial builds still fail — the sink is geometry, not a suggestion', async () => {
    const partials: [string, PieceKind[]][] = [
      ['drop', ['drop']],
      ['drop>landing', ['drop', 'landing']],
      ['drop>straight', ['drop', 'straight']],
      ['gapLip>landing', ['gapLip', 'landing']],
      ['straight', ['straight']],
    ];
    for (const [label, kinds] of partials) {
      const run = await replayRun(KITCHEN04, kitchen04Placed(kinds));
      expect(run.status, `partial ${label}`).not.toBe('finished');
    }
  }, 120_000);

  test('the par order is beatable within the tray (an order runs faster than the reference)', async () => {
    const par = await replayRun(KITCHEN04, kitchen04Placed(['gapLip', 'drop', 'landing', 'straight']));
    const beat = await replayRun(KITCHEN04, kitchen04Placed(['drop', 'landing', 'straight', 'gapLip']));
    expect(par.status).toBe('finished');
    expect(beat.status).toBe('finished');
    expect(beat.time).toBeLessThan(par.time); // measured 2.47 s vs the 2.52 s par
  }, 60_000);
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
