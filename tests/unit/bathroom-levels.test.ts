/**
 * Bathroom ladder playability proof (stage 4, Level Designer's gate) — the
 * bedroom ladder test's twin, with the hazard gates kitchen04 established:
 * every authored PAR line replays BIT-IDENTICAL wet vs dry (the grip-
 * independence contract, [[Modules/hazards]]), every hazard PROBE/SPLASH
 * line DIVERGES, and where the solver says "wet is FASTER on a straight"
 * (low drag — the honest in-channel manifestation of halved grip) the test
 * pins THAT number rather than a folk-physics slide.
 *
 * The rest is the family invariant set: every parBuild finishes headless
 * through `replayRun`; budget = tray, par ≤ 4 tray pieces, one geometry per
 * kind; the builder-anchored mount tells the truth about the second lines
 * (02's drain line reaches the cup and loses the clock by 17 ms — unlike
 * bedroom03's soft line, 03's splash line does NOT reach it, ask #2b,
 * pinned); 04 runs the inherited 24/24 whole-tray sweep with a live zone
 * under the flight window.
 *
 * The placement table is derived, not folklore: x = the par rail's
 * midpoint, z −25 cm off the corridor (`BATH_AXIS_OFFSET`), floor 5 mm
 * under the LOWEST authored line's finish deck; every prop solid clears
 * the lane by the bedroom's 10 cm standard (the towel/soap data moves exist
 * so this test passes without moving the RATIFIED tub, wall or drain).
 */
import { describe, expect, test } from 'vitest';
import { BATHROOM01, bathroom01ProbeBuild } from '../../src/world/levels/bathroom01.level.ts';
import { BATHROOM02, bathroom02DrainBuild } from '../../src/world/levels/bathroom02.level.ts';
import { BATHROOM03, bathroom03SplashBuild } from '../../src/world/levels/bathroom03.level.ts';
import { BATHROOM04, bathroom04ProbeBuild } from '../../src/world/levels/bathroom04.level.ts';
import { trayCount, type KitchenLevel } from '../../src/world/levels/kitchen01.level.ts';
import { levelTrayParams } from '../../src/boot.ts';
import { PARS } from '../../src/world/stars.ts';
import { PIECES, type PieceKind } from '../../src/track/pieces.ts';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import { type Build } from '../../src/track/build.ts';
import { KitRig } from '../../src/feel/kittrack.ts';
import { bathroomSetPlacement } from '../../src/world/setPlacement.ts';
import { insideFloor, SOAPDISH, TOOTHBRUSH, TOWELS, TUB, DRAIN } from '../../src/sets/bathroom/data.ts';
import { replayRun } from '../../src/replay/replay.ts';

/** The structural rung the ladders all satisfy (the bedroom twin). */
type Rung = Omit<KitchenLevel, 'set'>;

const LADDER: readonly Rung[] = [BATHROOM01, BATHROOM02, BATHROOM03, BATHROOM04];

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

describe('bathroom ladder — every par build finishes (headless)', () => {
  for (const level of LADDER) {
    test(`${level.id} par build finishes`, async () => {
      const result = await replayRun(level, level.parBuild());
      expect(result.status).toBe('finished');
    }, 30_000);
  }

  test('the par build replays identically twice (bathroom levels are data)', async () => {
    const first = await replayRun(BATHROOM01, BATHROOM01.parBuild());
    const second = await replayRun(BATHROOM01, BATHROOM01.parBuild());
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

describe('bathroom ladder — level contracts', () => {
  for (const level of LADDER) {
    test(`${level.id}: budget = tray total, par pieces <= 4 and <= budget, release on a slope`, () => {
      expect(level.budget).toBe(trayCount(level.tray));
      expect(level.par.pieces).toBeLessThanOrEqual(4);
      expect(level.par.pieces).toBeLessThanOrEqual(level.budget);
      expect(level.startSocket.tangent.y).toBeLessThan(0);
    });
  }

  test('pars.json carries the bathroom rungs on the tray basis', () => {
    for (const level of LADDER) {
      expect(PARS[level.id]?.pieces).toBe(level.par.pieces);
    }
  });
});

describe('bathroom01 — the three-piece flight over the puddle (and the puddle is live)', () => {
  test('the exact fit finishes on the builder mount, byte-identically to the par', async () => {
    const par = await replayRun(BATHROOM01, BATHROOM01.parBuild());
    const fit = await replayRun(BATHROOM01, placed(BATHROOM01, ['gapLip', 'drop', 'landing']));
    expect(fit.status).toBe('finished');
    expect(fit.hash).toBe(par.hash);
    expect(fit.time).toBeLessThanOrEqual(2.25);
  }, 60_000);

  test('every omission falls against the anchored fixtures', async () => {
    const par = BATHROOM01.parBuild();
    const cup = par.pieces.find((p) => p.def === 'finishCup')!;
    const omissions: [string, Build['pieces']][] = [
      ['bare', par.pieces.filter((p) => p.def !== 'gapLip' && p.def !== 'drop' && p.def !== 'landing')],
      ['drop only', par.pieces.filter((p) => p.def !== 'gapLip' && p.def !== 'landing')],
      ['lip + drop (no catcher)', par.pieces.filter((p) => p.def !== 'landing' && p.def !== 'finishCup')],
      ['lip + landing (no span)', par.pieces.filter((p) => p.def !== 'drop' && p.def !== 'finishCup')],
      ['drop + landing (no launch)', par.pieces.filter((p) => p.def !== 'gapLip' && p.def !== 'finishCup')],
    ];
    for (const [label, pieces] of omissions) {
      const run = await replayRun(BATHROOM01, { levelId: BATHROOM01.id, pieces: [...pieces, cup], seed: par.seed });
      expect(run.status, label).not.toBe('finished');
    }
  }, 90_000);

  test('whole-tray ORDERS: five finish, the pinned one falls (the L01 table, bathroom-staged)', async () => {
    for (const order of permutations<PieceKind>(['gapLip', 'drop', 'landing'])) {
      const label = order.join('>');
      const run = await replayRun(BATHROOM01, placed(BATHROOM01, order));
      expect(run.status, label).toBe(label === 'landing>drop>gapLip' ? 'fell' : 'finished');
    }
  }, 120_000);

  test('the par line is grip-NEUTRAL to the bit (it flies the patch)', async () => {
    const wet = await replayRun(BATHROOM01, BATHROOM01.parBuild());
    const dryRun = await replayRun(dry(BATHROOM01), BATHROOM01.parBuild());
    expect(wet.hash).toBe(dryRun.hash);
  }, 60_000);

  test('the THROUGH line is the probe, not a route: it diverges wet, finishes, and wet is FASTER (low drag)', async () => {
    const wet = await replayRun(BATHROOM01, bathroom01ProbeBuild());
    const dryRun = await replayRun(dry(BATHROOM01), bathroom01ProbeBuild());
    expect(wet.status).toBe('finished');
    expect(dryRun.status).toBe('finished');
    expect(wet.hash).not.toBe(dryRun.hash);
    expect(wet.time).toBeLessThan(dryRun.time); // measured 2.250 vs 2.383 — Modules/hazards §1
  }, 90_000);
});

describe('bathroom02 — the rim/drain choice is real on BOTH mountings', () => {
  test('both lines finish in the chained model, and the lazy rim line is faster', async () => {
    const par = await replayRun(BATHROOM02, BATHROOM02.parBuild());
    const drain = await replayRun(BATHROOM02, bathroom02DrainBuild());
    expect(par.status).toBe('finished');
    expect(drain.status).toBe('finished');
    expect(par.time).toBeLessThan(drain.time); // measured 2.350 vs 2.550
  }, 60_000);

  test('on the BUILDER mount both lines still reach the cup — and the lazy one still wins (2.350 vs 2.367)', async () => {
    const lazy = await replayRun(BATHROOM02, placed(BATHROOM02, ['straight', 'drop', 'straight']));
    const drain = await replayRun(BATHROOM02, placed(BATHROOM02, ['straight', 'gapLip', 'drop', 'landing']));
    expect(lazy.status).toBe('finished');
    expect(drain.status).toBe('finished'); // the exception to the bedroom02/03 pattern — ask #2b bites LESS here
    expect(lazy.time).toBeLessThan(drain.time);
  }, 90_000);

  test('the whole tray finishes every order sampled (no Playtest-G wall), and some orders beat the par clock', async () => {
    const orders: PieceKind[][] = [
      ['straight', 'drop', 'landing', 'straight', 'gapLip'],
      ['straight', 'gapLip', 'drop', 'straight', 'landing'],
      ['straight', 'drop', 'straight', 'gapLip', 'landing'],
    ];
    const par = await replayRun(BATHROOM02, BATHROOM02.parBuild());
    let best = Infinity;
    for (const order of orders) {
      const run = await replayRun(BATHROOM02, placed(BATHROOM02, order));
      expect(run.status, order.join('>')).toBe('finished');
      best = Math.min(best, run.time);
    }
    expect(best).toBeLessThan(par.time); // measured 2.292 vs 2.350 — pieces-star traded for the clock
  }, 120_000);
});

describe('bathroom03 — the tub-wall trade-off: height (dry) vs splash (wet), both measured', () => {
  test('both lines finish in the chained model; the hard, DRY catch is faster', async () => {
    const par = await replayRun(BATHROOM03, BATHROOM03.parBuild());
    const splash = await replayRun(BATHROOM03, bathroom03SplashBuild());
    expect(par.status).toBe('finished');
    expect(splash.status).toBe('finished');
    expect(par.time).toBeLessThan(splash.time); // measured 2.667 vs 2.708
  }, 60_000);

  test('the splash line does NOT reach the anchored cup (chained-model claim only — ask #2b)', async () => {
    const run = await replayRun(BATHROOM03, placed(BATHROOM03, ['straight', 'gapLip', 'landing', 'straight']));
    expect(run.status).not.toBe('finished');
  }, 30_000);

  test('the splash line is LEGITIMATELY wet: hash diverges, and the honest delta is low drag — wet splash is faster than dry splash, yet still slower than the DRY high line', async () => {
    const wet = await replayRun(BATHROOM03, bathroom03SplashBuild());
    const dryRun = await replayRun(dry(BATHROOM03), bathroom03SplashBuild());
    expect(wet.hash).not.toBe(dryRun.hash);
    expect(wet.time).toBeLessThan(dryRun.time); // measured 2.675 < 2.708 — water is fast, the CARD says so
    const par = await replayRun(BATHROOM03, BATHROOM03.parBuild());
    expect(par.time).toBeLessThan(wet.time); // 2.667 < 2.675 — height wins even against wet low drag
  }, 120_000);

  test('the PAR flies the splash: bit-identical wet vs dry', async () => {
    const wet = await replayRun(BATHROOM03, BATHROOM03.parBuild());
    const dryRun = await replayRun(dry(BATHROOM03), BATHROOM03.parBuild());
    expect(wet.hash).toBe(dryRun.hash);
  }, 60_000);

  test('the whole tray finishes every order sampled and beats the par clock', async () => {
    const orders: PieceKind[][] = [
      ['straight', 'gapLip', 'drop', 'landing', 'straight'],
      ['straight', 'drop', 'straight', 'gapLip', 'landing'],
    ];
    const par = await replayRun(BATHROOM03, BATHROOM03.parBuild());
    let best = Infinity;
    for (const order of orders) {
      const run = await replayRun(BATHROOM03, placed(BATHROOM03, order));
      expect(run.status, order.join('>')).toBe('finished');
      best = Math.min(best, run.time);
    }
    expect(best).toBeLessThan(par.time); // measured 2.483 vs 2.667
  }, 120_000);
});

describe('bathroom04 — everything, one tray, a live puddle under the flight (capstone)', () => {
  test('ALL 24 orders of the four tray pieces finish (builder-anchored, dry)', async () => {
    const orders = permutations<PieceKind>(['straight', 'gapLip', 'drop', 'landing']);
    expect(orders).toHaveLength(24);
    for (const order of orders) {
      const run = await replayRun(BATHROOM04, placed(BATHROOM04, order));
      expect(run.status, `order ${order.join('>')}`).toBe('finished');
    }
  }, 180_000);

  test('the dry sweep IS a wet sweep: the orders sampled wet replay bit-identical to dry', async () => {
    for (const order of [
      ['straight', 'gapLip', 'drop', 'landing'],
      ['drop', 'landing', 'straight', 'gapLip'],
      ['drop', 'straight', 'gapLip', 'landing'],
    ] as PieceKind[][]) {
      const wet = await replayRun(BATHROOM04, placed(BATHROOM04, order));
      const dryRun = await replayRun(dry(BATHROOM04), placed(BATHROOM04, order));
      expect(wet.hash, order.join('>')).toBe(dryRun.hash);
    }
  }, 120_000);

  test('the par ORDER is beatable within the tray', async () => {
    const par = await replayRun(BATHROOM04, BATHROOM04.parBuild());
    const beat = await replayRun(BATHROOM04, placed(BATHROOM04, ['drop', 'landing', 'straight', 'gapLip']));
    expect(par.status).toBe('finished');
    expect(beat.status).toBe('finished');
    expect(beat.time).toBeLessThan(par.time); // measured 2.467 vs 2.683
  }, 60_000);

  test('the puddle bites the decked probe (not the tray): probe diverges wet, finishes, wet is faster', async () => {
    const wet = await replayRun(BATHROOM04, bathroom04ProbeBuild());
    const dryRun = await replayRun(dry(BATHROOM04), bathroom04ProbeBuild());
    expect(wet.status).toBe('finished');
    expect(dryRun.status).toBe('finished');
    expect(wet.hash).not.toBe(dryRun.hash);
    expect(wet.time).toBeLessThan(dryRun.time); // measured 2.583 vs 2.717
  }, 90_000);
});

describe('bathroom set wiring — the placement table is derived, not folklore', () => {
  const LINES_BY_LEVEL: Record<string, Build[]> = {
    bathroom01: [BATHROOM01.parBuild()],
    bathroom02: [BATHROOM02.parBuild(), bathroom02DrainBuild()],
    bathroom03: [BATHROOM03.parBuild(), bathroom03SplashBuild()],
    bathroom04: [BATHROOM04.parBuild()],
  };

  for (const level of LADDER) {
    test(`${level.id} centres the floor disc on the run, 5 mm under the LOWEST authored deck, 25 cm back`, () => {
      const p = bathroomSetPlacement(level.id)!;
      expect(p.yaw).toBe(0);
      expect(p.position[2]).toBe(-0.25);
      const rig = new KitRig(level.parBuild(), 1);
      let mn = Infinity;
      let mx = -Infinity;
      for (let s = 0; s <= rig.length; s += 0.005) {
        const f = rig.frameAt(s);
        mn = Math.min(mn, f.pos.x);
        mx = Math.max(mx, f.pos.x);
      }
      expect(Math.abs(p.position[0] - (mn + mx) / 2)).toBeLessThan(0.002);
      const lowest = Math.min(...LINES_BY_LEVEL[level.id]!.map(finishDeckY));
      expect(p.position[1]).toBeCloseTo(lowest - 0.005, 5);
    });
  }

  test('every par rail point stays on the floor disc at the mounted position', () => {
    for (const level of LADDER) {
      const p = bathroomSetPlacement(level.id)!;
      const rig = new KitRig(level.parBuild(), 1);
      const samples: number[] = [...rig.starts, rig.length - 1e-6];
      for (const s of samples) {
        const f = rig.frameAt(s);
        expect(
          Math.hypot(f.pos.x - p.position[0], f.pos.z - p.position[2]),
          `${level.id} at s=${s.toFixed(2)}`,
        ).toBeLessThan(1.4);
      }
    }
  }, 60_000);

  test('no prop solid crosses the run corridor (lane |z| ≤ 5 cm; every near edge ≥ 10 cm clear)', () => {
    // analytic near edges at the shipped dz = −0.25 (the x-centring moves
    // props ALONG the lane, never across it — the bedroom argument, reused):
    //   tub shell: ±radius·0.98·zScale about the tub centre;
    //   towel stack: yawed half-extent of the fold footprint;
    //   soap dish / drain ring / toothbrush: their own footprints.
    const dz = -0.25;
    const near = {
      tub: TUB.position[2] + TUB.radius * 0.98 * TUB.zScale + dz, //  −0.152
      towels: TOWELS.position[2] + 0.0473 + dz, //                    −0.303
      soap: SOAPDISH.position[2] + 0.058 + dz, //                      −0.432
      drain: DRAIN.position[2] + 0.026 + dz, //                        −0.519
      brush: TOOTHBRUSH.position[2] + 0.09 + dz, //                    −0.49
    };
    for (const [name, z] of Object.entries(near)) {
      expect(z, name).toBeLessThanOrEqual(-0.10);
    }
    // and the RATIFIED anchors stay exactly where the review measured them
    expect(TUB.position).toEqual([-0.155, 0, -0.06]);
    expect(DRAIN.position).toEqual([0.065, 0, -0.295]);
  });

  test('the drain and the tub live inside the floor bounds (set-wiring convention)', () => {
    expect(insideFloor(DRAIN.position[0], DRAIN.position[2])).toBe(true);
    expect(insideFloor(TUB.position[0], TUB.position[2])).toBe(true);
  });
});
