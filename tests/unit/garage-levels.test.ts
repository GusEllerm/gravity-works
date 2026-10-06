/**
 * Garage ladder playability proof (stage 4, Level Designer's gate) — the
 * bathroom/garden ladder test's twin, with the same hazard gates
 * ([[Modules/hazards]]): every authored PAR line replays BIT-IDENTICAL wet
 * vs dry, the wet lines/PROBES DIVERGE, and where the solver says "wet is
 * FASTER on a straight" (low drag) the test pins THAT number, not a folk-
 * physics slide.
 *
 * The geometry economy is the bathroom's verbatim (same ramps, same
 * KITCHEN_GAP as `SHOP_GAP`, same sweep seating), so the garage clocks ARE
 * the bathroom clocks — stated as the point of the pass, and the test pins
 * the relationships (choice wins on both mountings, wet beats its own dry
 * and still loses to the speed line, 24/24 order sweeps), not folklore
 * seconds. The garage ADDS: the placement derivation on the flush slab
 * (no DECK_Y row — the epoxy and the beyond-slab ground both sit at set
 * y = 0), the derived dress-solid sweep from the live group boxes (the
 * flattened cardboard is the forward-most guard solid, which is what sets
 * the 0.37 offset), the goal-line staging honesty (the wheel tunnel never
 * crosses the +x lane), and the `prop:oilStain` callout registered by the
 * LEVEL module — the set module carries no PROP_CALLOUTS row (session-log
 * ask), so this file pins that the line at least EXISTS in the manifest.
 */
import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import { GARAGE01, garage01ProbeBuild } from '../../src/world/levels/garage01.level.ts';
import { GARAGE02, garage02FloorBuild } from '../../src/world/levels/garage02.level.ts';
import { GARAGE03, garage03OilLaneBuild } from '../../src/world/levels/garage03.level.ts';
import { GARAGE04, garage04ProbeBuild } from '../../src/world/levels/garage04.level.ts';
import { trayCount, type KitchenLevel } from '../../src/world/levels/kitchen01.level.ts';
import { levelTrayParams } from '../../src/boot.ts';
import { PARS } from '../../src/world/stars.ts';
import { PIECES, type PieceKind } from '../../src/track/pieces.ts';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import { type Build } from '../../src/track/build.ts';
import { KitRig } from '../../src/feel/kittrack.ts';
import { garageSetPlacement, GARAGE_AXIS_OFFSET } from '../../src/world/setPlacement.ts';
import { buildGarageSet } from '../../src/sets/garage/index.ts';
import { insideFloor } from '../../src/sets/garage/data.ts';
import { PROP_CALLOUTS } from '../../src/ui/callouts.ts';
import { replayRun } from '../../src/replay/replay.ts';

/** The structural rung the ladders all satisfy (the bathroom twin). */
type Rung = Omit<KitchenLevel, 'set'>;

const LADDER: readonly Rung[] = [GARAGE01, GARAGE02, GARAGE03, GARAGE04];

/** The same level with its zones deleted — the dry side of every wet/dry
 *  hash assertion (`x * 1 === x` discipline, Modules/hazards). */
function dry<T extends Rung>(level: T): T {
  return { ...level, hazards: [] };
}

/** The builder-anchored mount emulation (fixtures at par transforms, tray
 *  pieces chained off the ramp exit at the tray's single geometry). */
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

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  const out: T[][] = [];
  items.forEach((x, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).forEach((p) => out.push([x, ...p])),
  );
  return out;
}

/** The y of a chained build's finish-deck (the finishCup in-socket). */
function finishDeckY(build: Build): number {
  const cup = build.pieces.find((p) => p.def === 'finishCup')!;
  const [inSocket] = PIECES.finishCup.sockets(cup.params);
  return transformSocket(inSocket, cup.transform).pos.y;
}

describe('garage ladder — every par build finishes (headless)', () => {
  for (const level of LADDER) {
    test(`${level.id} par build finishes`, async () => {
      const result = await replayRun(level, level.parBuild());
      expect(result.status).toBe('finished');
    }, 30_000);
  }

  test('the par build replays identically twice (garage levels are data)', async () => {
    const first = await replayRun(GARAGE01, GARAGE01.parBuild());
    const second = await replayRun(GARAGE01, GARAGE01.parBuild());
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

describe('garage ladder — level contracts', () => {
  for (const level of LADDER) {
    test(`${level.id}: budget = tray total, par pieces <= 4 and <= budget, release on a slope`, () => {
      expect(level.budget).toBe(trayCount(level.tray));
      expect(level.par.pieces).toBeLessThanOrEqual(4);
      expect(level.par.pieces).toBeLessThanOrEqual(level.budget);
      expect(level.startSocket.tangent.y).toBeLessThan(0);
    });
  }

  test('pars.json carries the garage rungs on the tray basis', () => {
    for (const level of LADDER) {
      expect(PARS[level.id]?.pieces).toBe(level.par.pieces);
    }
  });

  test('every live zone names its prop (source: oilStain)', () => {
    for (const level of [GARAGE01, GARAGE03, GARAGE04]) {
      expect(level.hazards![0]!.source).toBe('oilStain');
    }
  });

  test('the oil-stain first-sight line is in the manifest (registered by the level file — session-log ask to move it to the set module)', () => {
    // The ratified set module (src/sets/garage/index.ts) carries NO
    // PROP_CALLOUTS row; garage01 registers the line so the lesson is not
    // silently missing from the help manifest. When the EA lands the row
    // in the set module, this assertion still passes (registration is
    // idempotent by key) — the test pins EXISTENCE, not authorship.
    expect(PROP_CALLOUTS['prop:oilStain']).toBeTruthy();
    expect(PROP_CALLOUTS['prop:oilStain']).not.toContain('\n');
    expect(PROP_CALLOUTS['prop:oilStain']!.length).toBeLessThanOrEqual(90);
  });
});

describe('garage01 — the three-piece flight over the stain (hazard enters)', () => {
  test('the exact fit finishes on the builder mount, byte-identically to the par', async () => {
    const par = await replayRun(GARAGE01, GARAGE01.parBuild());
    const fit = await replayRun(GARAGE01, placed(GARAGE01, ['gapLip', 'drop', 'landing']));
    expect(fit.status).toBe('finished');
    expect(fit.hash).toBe(par.hash);
    expect(fit.time).toBeLessThanOrEqual(2.25);
  }, 60_000);

  test('every omission falls against the anchored fixtures', async () => {
    const par = GARAGE01.parBuild();
    const cup = par.pieces.find((p) => p.def === 'finishCup')!;
    const omissions: [string, Build['pieces']][] = [
      ['bare', par.pieces.filter((p) => p.def !== 'gapLip' && p.def !== 'drop' && p.def !== 'landing')],
      ['drop only', par.pieces.filter((p) => p.def !== 'gapLip' && p.def !== 'landing')],
      ['lip + drop (no catcher)', par.pieces.filter((p) => p.def !== 'landing' && p.def !== 'finishCup')],
      ['lip + landing (no span)', par.pieces.filter((p) => p.def !== 'drop' && p.def !== 'finishCup')],
      ['drop + landing (no launch)', par.pieces.filter((p) => p.def !== 'gapLip' && p.def !== 'finishCup')],
    ];
    for (const [label, pieces] of omissions) {
      const run = await replayRun(GARAGE01, { levelId: GARAGE01.id, pieces: [...pieces, cup], seed: par.seed });
      expect(run.status, label).not.toBe('finished');
    }
  }, 90_000);

  test('whole-tray ORDERS: five finish, the pinned one falls (the L01 table, garage-staged)', async () => {
    for (const order of permutations<PieceKind>(['gapLip', 'drop', 'landing'])) {
      const label = order.join('>');
      const run = await replayRun(GARAGE01, placed(GARAGE01, order));
      expect(run.status, label).toBe(label === 'landing>drop>gapLip' ? 'fell' : 'finished');
    }
  }, 120_000);

  test('the PAR flies the stain: bit-identical wet vs dry', async () => {
    const wet = await replayRun(GARAGE01, GARAGE01.parBuild());
    const dryRun = await replayRun(dry(GARAGE01), GARAGE01.parBuild());
    expect(wet.hash).toBe(dryRun.hash);
  }, 60_000);

  test('the stain bites the decked probe (not the tray): probe diverges wet, finishes, wet is faster', async () => {
    const wet = await replayRun(GARAGE01, garage01ProbeBuild());
    const dryRun = await replayRun(dry(GARAGE01), garage01ProbeBuild());
    expect(wet.status).toBe('finished');
    expect(dryRun.status).toBe('finished');
    expect(wet.hash).not.toBe(dryRun.hash);
    expect(wet.time).toBeLessThan(dryRun.time); // measured 2.250 vs 2.383 — low drag, the honest delta
  }, 90_000);
});

describe('garage02 — the mezzanine choice is real in the chained model, pinned honest anchored', () => {
  test('both lines finish in the chained model, and the HIGH (workbench) line is faster', async () => {
    const par = await replayRun(GARAGE02, GARAGE02.parBuild());
    const floor = await replayRun(GARAGE02, garage02FloorBuild());
    expect(par.status).toBe('finished');
    expect(floor.status).toBe('finished');
    expect(par.time).toBeLessThan(floor.time); // measured 2.367 vs 2.575 (the bedroom02 twin's clocks)
  }, 60_000);

  test('on the BUILDER mount the high line reaches; the floor line falls short of the anchored cup (ask #2b, pinned)', async () => {
    const high = await replayRun(GARAGE02, placed(GARAGE02, ['straight', 'straight', 'straight']));
    const floor = await replayRun(GARAGE02, placed(GARAGE02, ['straight', 'drop', 'landing', 'straight']));
    expect(high.status).toBe('finished');
    expect(high.hash).toBe((await replayRun(GARAGE02, GARAGE02.parBuild())).hash);
    expect(floor.status).not.toBe('finished'); // fell 2.925 — the bedroom02 plateau property, stated on the card
  }, 90_000);

  test('whole-tray orders SAMPLED: the pure-high subset is the only finisher family, and a sampled order beats the par clock', async () => {
    const orders: PieceKind[][] = [
      ['straight', 'straight', 'straight'],
      ['straight', 'landing', 'straight', 'drop'], // completes, 2.250 — beats the par clock
      ['drop', 'straight', 'landing', 'straight'],
      ['straight', 'straight', 'drop', 'landing', 'straight'],
      ['landing', 'drop', 'straight', 'straight', 'straight'],
    ];
    const par = await replayRun(GARAGE02, GARAGE02.parBuild());
    let best = Infinity;
    for (const order of orders) {
      const run = await replayRun(GARAGE02, placed(GARAGE02, order));
      if (order.join('>') === 'straight>landing>straight>drop') {
        expect(run.status, order.join('>')).toBe('finished');
        best = Math.min(best, run.time);
      } else if (order.length === 3) {
        expect(run.status, order.join('>')).toBe('finished');
      } else {
        expect(run.status, order.join('>')).not.toBe('finished'); // the CHOICE tray is not whole-order-invariant (bedroom02's property; the invariant gate is the capstone's)
      }
    }
    expect(best).toBeLessThan(par.time); // 2.250 vs 2.367 — pieces-star traded for the clock
  }, 120_000);
});

describe('garage03 — the tunnel forces the speed line; the oil lane costs time, both measured', () => {
  test('both lines finish in the chained model; the hard, DRY speed line is faster', async () => {
    const par = await replayRun(GARAGE03, GARAGE03.parBuild());
    const lane = await replayRun(GARAGE03, garage03OilLaneBuild());
    expect(par.status).toBe('finished');
    expect(lane.status).toBe('finished');
    expect(par.time).toBeLessThan(lane.time); // measured 2.667 vs 2.675 (bathroom03's tightest margin, re-flowed)
  }, 60_000);

  test('the oil lane does NOT reach the anchored cup (chained-model claim only — ask #2b)', async () => {
    const run = await replayRun(GARAGE03, placed(GARAGE03, ['straight', 'gapLip', 'landing', 'straight']));
    expect(run.status).not.toBe('finished');
  }, 30_000);

  test('the lane is LEGITIMATELY wet: hash diverges; lane-wet beats its own dry yet still loses to the DRY speed line', async () => {
    const wet = await replayRun(GARAGE03, garage03OilLaneBuild());
    const dryRun = await replayRun(dry(GARAGE03), garage03OilLaneBuild());
    expect(wet.hash).not.toBe(dryRun.hash);
    expect(wet.time).toBeLessThan(dryRun.time); // measured 2.675 < 2.708 — low drag, the honest delta
    const par = await replayRun(GARAGE03, GARAGE03.parBuild());
    expect(par.time).toBeLessThan(wet.time); // 2.667 < 2.675 — the speed line wins even against wet low drag
  }, 120_000);

  test('the PAR flies the film: bit-identical wet vs dry', async () => {
    const wet = await replayRun(GARAGE03, GARAGE03.parBuild());
    const dryRun = await replayRun(dry(GARAGE03), GARAGE03.parBuild());
    expect(wet.hash).toBe(dryRun.hash);
  }, 60_000);

  test('the whole tray finishes every order sampled and beats the par clock', async () => {
    const orders: PieceKind[][] = [
      ['straight', 'gapLip', 'drop', 'landing', 'straight'],
      ['straight', 'drop', 'straight', 'gapLip', 'landing'],
    ];
    const par = await replayRun(GARAGE03, GARAGE03.parBuild());
    let best = Infinity;
    for (const order of orders) {
      const run = await replayRun(GARAGE03, placed(GARAGE03, order));
      expect(run.status, order.join('>')).toBe('finished');
      best = Math.min(best, run.time);
    }
    expect(best).toBeLessThan(par.time); // measured 2.483 vs 2.667
  }, 120_000);
});

describe('garage04 — stain + height, one tray, a live film under the flight (capstone, campaign end)', () => {
  test('ALL 24 orders of the four tray pieces finish (builder-anchored, dry)', async () => {
    const orders = permutations<PieceKind>(['straight', 'gapLip', 'drop', 'landing']);
    expect(orders).toHaveLength(24);
    for (const order of orders) {
      const run = await replayRun(GARAGE04, placed(GARAGE04, order));
      expect(run.status, `order ${order.join('>')}`).toBe('finished');
    }
  }, 180_000);

  test('the dry sweep IS a wet sweep: the orders sampled wet replay bit-identical to dry', async () => {
    for (const order of [
      ['straight', 'gapLip', 'drop', 'landing'],
      ['drop', 'landing', 'straight', 'gapLip'],
      ['drop', 'straight', 'gapLip', 'landing'],
    ] as PieceKind[][]) {
      const wet = await replayRun(GARAGE04, placed(GARAGE04, order));
      const dryRun = await replayRun(dry(GARAGE04), placed(GARAGE04, order));
      expect(wet.hash, order.join('>')).toBe(dryRun.hash);
    }
  }, 120_000);

  test('the par ORDER is beatable within the tray (your ordering IS the line choice)', async () => {
    const par = await replayRun(GARAGE04, GARAGE04.parBuild());
    const beat = await replayRun(GARAGE04, placed(GARAGE04, ['drop', 'landing', 'straight', 'gapLip']));
    expect(par.status).toBe('finished');
    expect(beat.status).toBe('finished');
    expect(beat.time).toBeLessThan(par.time); // measured 2.467 vs 2.683
  }, 60_000);

  test('the film bites the decked probe (not the tray): probe diverges wet, finishes, wet is faster', async () => {
    const wet = await replayRun(GARAGE04, garage04ProbeBuild());
    const dryRun = await replayRun(dry(GARAGE04), garage04ProbeBuild());
    expect(wet.status).toBe('finished');
    expect(dryRun.status).toBe('finished');
    expect(wet.hash).not.toBe(dryRun.hash);
    expect(wet.time).toBeLessThan(dryRun.time); // measured 2.583 vs 2.717
  }, 90_000);
});

describe('garage set wiring — the placement table is derived, not folklore', () => {
  const LINES_BY_LEVEL: Record<string, Build[]> = {
    garage01: [GARAGE01.parBuild()],
    garage02: [GARAGE02.parBuild(), garage02FloorBuild()],
    garage03: [GARAGE03.parBuild(), garage03OilLaneBuild()],
    garage04: [GARAGE04.parBuild()],
  };

  for (const level of LADDER) {
    test(`${level.id} centres the slab on the run, 5 mm under the LOWEST authored finish deck, 37 cm back`, () => {
      const p = garageSetPlacement(level.id)!;
      expect(p.yaw).toBe(0);
      expect(p.position[2]).toBe(-GARAGE_AXIS_OFFSET);
      const rig = new KitRig(level.parBuild(), 1);
      let mn = Infinity;
      let mx = -Infinity;
      for (let s = 0; s <= rig.length; s += 0.005) {
        const f = rig.frameAt(s);
        mn = Math.min(mn, f.pos.x);
        mx = Math.max(mx, f.pos.x);
      }
      expect(Math.abs(p.position[0] - (mn + mx) / 2)).toBeLessThan(0.002);
      // the flush-slab rule: the epoxy surface lives AT the set origin (y 0
      // — no DECK_Y row here; the slab and the beyond-slab ground are both
      // flat), so the mount y IS the deck line minus the clearance.
      const lowest = Math.min(...LINES_BY_LEVEL[level.id]!.map(finishDeckY));
      expect(p.position[1]).toBeCloseTo(lowest - 0.005, 5);
    });
  }

  test('no dress solid crosses the run corridor (lane |z| ≤ 5 cm; every near edge ≥ 10 cm clear)', () => {
    // the guard-solid sweep is DERIVED from the live group boxes: mount
    // each rung's set exactly as boot does and demand every `dress` mesh's
    // forward-most world z ≤ −10 cm behind the corridor. The flattened
    // CARDBOARD (set z +0.261) is the solid that sets GARAGE_AXIS_OFFSET;
    // the wet-patch films ride inside `dress` too and clear trivially.
    const set = buildGarageSet(THREE, {});
    for (const level of LADDER) {
      const p = garageSetPlacement(level.id)!;
      set.group.position.set(...p.position);
      set.group.rotation.set(0, p.yaw, 0);
      set.group.updateMatrixWorld(true);
      const dress = set.group.getObjectByName('dress')!;
      dress.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh) return;
        const box = new THREE.Box3().setFromObject(o);
        expect(box.max.z, `${level.id}: ${o.parent?.name ?? '?'}/${o.name || 'mesh'}`)
          .toBeLessThanOrEqual(-0.10);
      });
    }
  }, 60_000);

  test('the goal line stays a goal line: the bike-wheel tunnel is entirely BEHIND the lane at every mount', () => {
    // the wheel tunnel is a STORY, not a bore (variant C declares no
    // sockets); its live box at every shipped mount must stay behind the
    // corridor guard line — nothing on the lane can chain through it (the
    // garden bore's honesty, same shape).
    const set = buildGarageSet(THREE, {});
    for (const level of LADDER) {
      const p = garageSetPlacement(level.id)!;
      set.group.position.set(...p.position);
      set.group.rotation.set(0, p.yaw, 0);
      set.group.updateMatrixWorld(true);
      const wheel = set.group.getObjectByName('bike-wheel-tunnel')!;
      const box = new THREE.Box3().setFromObject(wheel);
      expect(box.max.z, level.id).toBeLessThanOrEqual(-0.10);
    }
  }, 30_000);

  test('the named stain anchor lives inside the floor bounds (set-wiring convention)', () => {
    expect(insideFloor(-0.09, -0.14)).toBe(true); // the oil film
    expect(insideFloor(-0.3, 0.2)).toBe(true); // the flattened cardboard
    expect(insideFloor(0.22, 0.1)).toBe(true); // the nail spill
  });
});
