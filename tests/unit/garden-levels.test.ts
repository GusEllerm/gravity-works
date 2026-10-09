import { campaignIndex, nextInCampaign } from '../../src/world/campaign.ts';
/**
 * Garden ladder playability proof (stage 4, Level Designer's gate) — the
 * bathroom ladder test's twin, with the same hazard gates ([[Modules/
 * hazards]]): every authored PAR line replays BIT-IDENTICAL wet vs dry, the
 * wet-shortcut/PROBE lines DIVERGE, and where the solver says "wet is
 * FASTER on a straight" (low drag) the test pins THAT number, not a folk-
 * physics slide. Rung 01 ships NO zone at all — its lesson is the shadow
 * reading — so its wet-side assertion is the trivial-and-pinned one: the
 * level declares no hazards, and the shadow bars stay set architecture
 * (`HAZARDS` in the set is empty BY LAW, the concept's read-only-rhythm
 * sentence).
 *
 * The geometry economy is the bathroom's verbatim (same ramps, same
 * KITCHEN_GAP, same sweep seating), so the garden clocks are the bathroom
 * clocks — that is the point of the pass, and the test says so by pinning
 * the relationships, not folklore numbers. The garden ADDS: the derived
 * placement on the flush-deck rule (`DECK_Y` rides the y row), the dress
 * guard sweep from the live group boxes (variant B dresses all around its
 * deck — the hose coil in a forward sun stripe is why the garden sits
 * 52 cm back, the widest offset of the four sets), and rung 02's bore line
 * as staging-honesty data.
 */
import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import { GARDEN01 } from '../../src/world/levels/garden01.level.ts';
import { GARDEN02, garden02BoreBuild } from '../../src/world/levels/garden02.level.ts';
import { GARDEN03, garden03SprinklerBuild } from '../../src/world/levels/garden03.level.ts';
import { GARDEN04, garden04ProbeBuild } from '../../src/world/levels/garden04.level.ts';
import { GARDEN05, GARDEN_SANDBOX, garden05BoosterBuild, garden05ProbeBuild } from '../../src/world/levels/garden05.level.ts';
import { trayCount, type KitchenLevel } from '../../src/world/levels/kitchen01.level.ts';
import { trayParityBuild } from '../../src/boot.ts';
import { levelTrayParams } from '../../src/ui/advice.ts';
import { PARS } from '../../src/world/stars.ts';
import { PIECE_KINDS, PIECES, type PieceKind } from '../../src/track/pieces.ts';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import { serialize, type Build } from '../../src/track/build.ts';
import { KitRig } from '../../src/feel/kittrack.ts';
import { gardenSetPlacement, GARDEN_AXIS_OFFSET } from '../../src/world/setPlacement.ts';
import { buildGardenSet } from '../../src/sets/garden/index.ts';
import { DECK_Y, insideDeck, PIPE_SOCKET_FRAMES } from '../../src/sets/garden/data.ts';
import { replayRun } from '../../src/replay/replay.ts';

/** The structural rung the ladders all satisfy (the bathroom twin). */
type Rung = Omit<KitchenLevel, 'set'>;

const LADDER: readonly Rung[] = [GARDEN01, GARDEN02, GARDEN03, GARDEN05, GARDEN04];

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

describe('garden ladder — every par build finishes (headless)', () => {
  for (const level of LADDER) {
    test(`${level.id} par build finishes`, async () => {
      const result = await replayRun(level, level.parBuild());
      expect(result.status).toBe('finished');
    }, 30_000);
  }

  test('the par build replays identically twice (garden levels are data)', async () => {
    const first = await replayRun(GARDEN01, GARDEN01.parBuild());
    const second = await replayRun(GARDEN01, GARDEN01.parBuild());
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

describe('garden ladder — level contracts', () => {
  for (const level of LADDER) {
    test(`${level.id}: budget = tray total, par pieces <= 4 and <= budget, release on a slope`, () => {
      expect(level.budget).toBe(trayCount(level.tray));
      expect(level.par.pieces).toBeLessThanOrEqual(4);
      expect(level.par.pieces).toBeLessThanOrEqual(level.budget);
      expect(level.startSocket.tangent.y).toBeLessThan(0);
    });
  }

  test('pars.json carries the garden rungs on the tray basis', () => {
    for (const level of LADDER) {
      expect(PARS[level.id]?.pieces).toBe(level.par.pieces);
    }
  });

  test('rung 01 ships NO live zone — the shadow bars are read-only rhythm', () => {
    // the concept's law, kept by the ratified set and by the rung: a shadow
    // is never a hazard. Rung 01's lesson is the CAMERA reading, so the
    // honest wet-side assertion is that there is nothing to be wet about.
    expect(GARDEN01.hazards ?? []).toHaveLength(0);
  });

  test('the sprinkler zones name their head (source: sprinkler)', () => {
    expect(GARDEN03.hazards![0]!.source).toBe('sprinkler');
    expect(GARDEN04.hazards![0]!.source).toBe('sprinkler');
    expect(GARDEN05.hazards![0]!.source).toBe('sprinkler'); // the encore keeps the room's verb (in sink two's mouth, FLOWN)
  });
});

describe('garden01 — the three-piece flight under the bars (and no zone at all)', () => {
  test('the exact fit finishes on the builder mount, byte-identically to the par', async () => {
    const par = await replayRun(GARDEN01, GARDEN01.parBuild());
    const fit = await replayRun(GARDEN01, placed(GARDEN01, ['gapLip', 'drop', 'landing']));
    expect(fit.status).toBe('finished');
    expect(fit.hash).toBe(par.hash);
    expect(fit.time).toBeLessThanOrEqual(2.25);
  }, 60_000);

  test('every omission falls against the anchored fixtures', async () => {
    const par = GARDEN01.parBuild();
    const cup = par.pieces.find((p) => p.def === 'finishCup')!;
    const omissions: [string, Build['pieces']][] = [
      ['bare', par.pieces.filter((p) => p.def !== 'gapLip' && p.def !== 'drop' && p.def !== 'landing')],
      ['drop only', par.pieces.filter((p) => p.def !== 'gapLip' && p.def !== 'landing')],
      ['lip + drop (no catcher)', par.pieces.filter((p) => p.def !== 'landing' && p.def !== 'finishCup')],
      ['lip + landing (no span)', par.pieces.filter((p) => p.def !== 'drop' && p.def !== 'finishCup')],
      ['drop + landing (no launch)', par.pieces.filter((p) => p.def !== 'gapLip' && p.def !== 'finishCup')],
    ];
    for (const [label, pieces] of omissions) {
      const run = await replayRun(GARDEN01, { levelId: GARDEN01.id, pieces: [...pieces, cup], seed: par.seed });
      expect(run.status, label).not.toBe('finished');
    }
  }, 90_000);

  test('whole-tray ORDERS: five finish, the pinned one falls (the L01 table, garden-staged)', async () => {
    for (const order of permutations<PieceKind>(['gapLip', 'drop', 'landing'])) {
      const label = order.join('>');
      const run = await replayRun(GARDEN01, placed(GARDEN01, order));
      expect(run.status, label).toBe(label === 'landing>drop>gapLip' ? 'fell' : 'finished');
    }
  }, 120_000);
});

describe('garden02 — the slab/bore choice is real on BOTH mountings', () => {
  test('both lines finish in the chained model, and the lazy slab line is faster', async () => {
    const par = await replayRun(GARDEN02, GARDEN02.parBuild());
    const bore = await replayRun(GARDEN02, garden02BoreBuild());
    expect(par.status).toBe('finished');
    expect(bore.status).toBe('finished');
    expect(par.time).toBeLessThan(bore.time); // measured 2.350 vs 2.550 (the bathroom twin's clocks)
  }, 60_000);

  test('on the BUILDER mount both lines still reach the cup — and the lazy one still wins', async () => {
    const lazy = await replayRun(GARDEN02, placed(GARDEN02, ['straight', 'drop', 'straight']));
    const bore = await replayRun(GARDEN02, placed(GARDEN02, ['straight', 'gapLip', 'drop', 'landing']));
    expect(lazy.status).toBe('finished');
    expect(bore.status).toBe('finished'); // the bathroom02 exception holds here too — ask #2b bites LESS
    expect(lazy.time).toBeLessThan(bore.time); // 2.350 vs 2.367
  }, 90_000);

  test("the bore ride stays STAGING: the set's bore never crosses the +x lane at any rung mount", () => {
    // the mouth pair are set-space frames; at every shipped mount they land
    // behind the corridor (|z| ≥ 10 cm), so nothing on the lane can chain
    // through them — the blocked half stated as geometry (session-log ask
    // #7 / ask #5's shape), not as prose.
    for (const id of ['garden01', 'garden02', 'garden03', 'garden04']) {
      const p = gardenSetPlacement(id)!;
      const forwardZ = Math.max(...Object.values(PIPE_SOCKET_FRAMES).map((f) => f.pos[2]));
      expect(forwardZ + p.position[2]).toBeLessThanOrEqual(-0.70); // ≈ 0.77 m back
    }
    expect(GARDEN_AXIS_OFFSET).toBeGreaterThanOrEqual(0.45);
  });

  test('the whole tray finishes every order sampled (no Playtest-G wall), and some orders beat the par clock', async () => {
    const orders: PieceKind[][] = [
      ['straight', 'drop', 'landing', 'straight', 'gapLip'],
      ['straight', 'gapLip', 'drop', 'straight', 'landing'],
      ['straight', 'drop', 'straight', 'gapLip', 'landing'],
    ];
    const par = await replayRun(GARDEN02, GARDEN02.parBuild());
    let best = Infinity;
    for (const order of orders) {
      const run = await replayRun(GARDEN02, placed(GARDEN02, order));
      expect(run.status, order.join('>')).toBe('finished');
      best = Math.min(best, run.time);
    }
    expect(best).toBeLessThan(par.time); // measured 2.292 vs 2.350 — pieces-star traded for the clock
  }, 120_000);
});

describe('garden03 — the sprinkler trade-off: dry high line vs wet shortcut, both measured', () => {
  test('both lines finish in the chained model; the hard, DRY catch is faster', async () => {
    const par = await replayRun(GARDEN03, GARDEN03.parBuild());
    const wet = await replayRun(GARDEN03, garden03SprinklerBuild());
    expect(par.status).toBe('finished');
    expect(wet.status).toBe('finished');
    expect(par.time).toBeLessThan(wet.time); // measured 2.667 vs 2.708
  }, 60_000);

  test('the wet shortcut does NOT reach the anchored cup (chained-model claim only — ask #2b)', async () => {
    const run = await replayRun(GARDEN03, placed(GARDEN03, ['straight', 'gapLip', 'landing', 'straight']));
    expect(run.status).not.toBe('finished');
  }, 30_000);

  test('the shortcut is LEGITIMATELY wet: hash diverges; wet beats its own dry yet still loses to the DRY high line', async () => {
    const wet = await replayRun(GARDEN03, garden03SprinklerBuild());
    const dryRun = await replayRun(dry(GARDEN03), garden03SprinklerBuild());
    expect(wet.hash).not.toBe(dryRun.hash);
    expect(wet.time).toBeLessThan(dryRun.time); // measured 2.675 < 2.708 — low drag, the honest delta
    const par = await replayRun(GARDEN03, GARDEN03.parBuild());
    expect(par.time).toBeLessThan(wet.time); // 2.667 < 2.675 — height wins even against wet low drag
  }, 120_000);

  test('the PAR flies the sprawl: bit-identical wet vs dry', async () => {
    const wet = await replayRun(GARDEN03, GARDEN03.parBuild());
    const dryRun = await replayRun(dry(GARDEN03), GARDEN03.parBuild());
    expect(wet.hash).toBe(dryRun.hash);
  }, 60_000);

  test('the whole tray finishes every order sampled and beats the par clock', async () => {
    const orders: PieceKind[][] = [
      ['straight', 'gapLip', 'drop', 'landing', 'straight'],
      ['straight', 'drop', 'straight', 'gapLip', 'landing'],
    ];
    const par = await replayRun(GARDEN03, GARDEN03.parBuild());
    let best = Infinity;
    for (const order of orders) {
      const run = await replayRun(GARDEN03, placed(GARDEN03, order));
      expect(run.status, order.join('>')).toBe('finished');
      best = Math.min(best, run.time);
    }
    expect(best).toBeLessThan(par.time); // measured 2.483 vs 2.667
  }, 120_000);
});

describe('garden04 — everything, one tray, a live sprawl under the flight (capstone)', () => {
  test('ALL 24 orders of the four tray pieces finish (builder-anchored, dry)', async () => {
    const orders = permutations<PieceKind>(['straight', 'gapLip', 'drop', 'landing']);
    expect(orders).toHaveLength(24);
    for (const order of orders) {
      const run = await replayRun(GARDEN04, placed(GARDEN04, order));
      expect(run.status, `order ${order.join('>')}`).toBe('finished');
    }
  }, 180_000);

  test('the dry sweep IS a wet sweep: the orders sampled wet replay bit-identical to dry', async () => {
    for (const order of [
      ['straight', 'gapLip', 'drop', 'landing'],
      ['drop', 'landing', 'straight', 'gapLip'],
      ['drop', 'straight', 'gapLip', 'landing'],
    ] as PieceKind[][]) {
      const wet = await replayRun(GARDEN04, placed(GARDEN04, order));
      const dryRun = await replayRun(dry(GARDEN04), placed(GARDEN04, order));
      expect(wet.hash, order.join('>')).toBe(dryRun.hash);
    }
  }, 120_000);

  test('the par ORDER is beatable within the tray (your ordering IS the line choice)', async () => {
    const par = await replayRun(GARDEN04, GARDEN04.parBuild());
    const beat = await replayRun(GARDEN04, placed(GARDEN04, ['drop', 'landing', 'straight', 'gapLip']));
    expect(par.status).toBe('finished');
    expect(beat.status).toBe('finished');
    expect(beat.time).toBeLessThan(par.time); // measured 2.467 vs 2.683
  }, 60_000);

  test('the sprawl bites the decked probe (not the tray): probe diverges wet, finishes, wet is faster', async () => {
    const wet = await replayRun(GARDEN04, garden04ProbeBuild());
    const dryRun = await replayRun(dry(GARDEN04), garden04ProbeBuild());
    expect(wet.status).toBe('finished');
    expect(dryRun.status).toBe('finished');
    expect(wet.hash).not.toBe(dryRun.hash);
    expect(wet.time).toBeLessThan(dryRun.time); // measured 2.583 vs 2.717
  }, 90_000);
});

describe('garden05 — the ENCORE: the double crossing in the eye, and the sprinkler flies over sink two', () => {
  // The eye rung: the par's ORDER carries the whole lesson (deck-first
  // falls), every omission FALLS on the rung's pinned long-lead dip (span
  // 0.3566 m > a roll-off's flight), and the sprinkler sprawl lies in the
  // second crossing's mouth at the waterline a BRIDGED deck would roll —
  // the ridden dip flies it (bit-identical par), the unbuyable bridge
  // probe rolls the film and runs wet-faster (garden03's low-drag law).
  const spec = (kinds: string[]): PieceKind[] =>
    kinds.map((k) => ({ dr: 'drop', st: 'straight', la: 'landing', bo: 'booster' }[k]! as PieceKind));

  test('EVERY omission falls — the encore’s promise law, 11 builds sampled', async () => {
    for (const kinds of [
      ['dr'], ['st'], ['la'],
      ['dr', 'st'], ['st', 'dr'], ['dr', 'la'], ['st', 'la'],
      ['dr', 'st', 'dr'], ['dr', 'st', 'la'], ['st', 'dr', 'la'], ['dr', 'la', 'st'],
    ]) {
      const run = await replayRun(GARDEN05, placed(GARDEN05, spec(kinds)));
      expect(run.status, kinds.join('>')).not.toBe('finished');
    }
  }, 180_000);

  test('the ORDER is the line — porch-clocked (stage-6 brevity trim): deck-first finishes but must LOSE the clock; the par order is beatable within the tray', async () => {
    const par = await replayRun(GARDEN05, GARDEN05.parBuild());
    const deckFirst = await replayRun(GARDEN05, placed(GARDEN05, spec(['st', 'dr', 'dr', 'la'])));
    // The stage-6 brevity trim moved the release to the fail-timing chute
    // and the two adjacent dips now CARRY at chute speed — the −12° law's
    // measured fall (2.808 s) died with the crawl it rode. Re-stated as
    // measured, porch05's own exception idiom: an order that finishes is
    // only honest if it is LATE.
    expect(deckFirst.status).toBe('finished'); // measured 1.367 vs the 1.342 par
    expect(deckFirst.time).toBeGreaterThan(par.time); // pieces star, never the time star
    const beat = await replayRun(GARDEN05, placed(GARDEN05, spec(['dr', 'la', 'dr', 'st'])));
    expect(beat.status).toBe('finished');
    expect(beat.time).toBeLessThan(par.time); // measured 1.225 vs 1.342 — the par order stays beatable
  }, 90_000);

  test('the spare straight is a decoy: TAIL-placed it finishes at the par’s OWN hash, mid-line it finishes SLOW (the trim’s re-stated law), after the catcher it drags', async () => {
    const par = await replayRun(GARDEN05, GARDEN05.parBuild());
    const tail = await replayRun(GARDEN05, placed(GARDEN05, spec(['dr', 'st', 'dr', 'la', 'st'])));
    expect(tail.status).toBe('finished');
    expect(tail.hash).toBe(par.hash);
    const mid = await replayRun(GARDEN05, placed(GARDEN05, spec(['dr', 'st', 'st', 'dr', 'la'])));
    // the two-plank bridge ROLLS at chute speed (the −12° kill died with
    // the crawl) — but the decoy law's teeth survive on the clock: the
    // double plank is never the fast line.
    expect(mid.status).toBe('finished'); // measured 1.425 vs the 1.342 par
    expect(mid.time).toBeGreaterThan(par.time);
    const runout = await replayRun(GARDEN05, placed(GARDEN05, spec(['dr', 'st', 'dr', 'st', 'la'])));
    expect(runout.status).toBe('finished');
    expect(runout.time).toBeGreaterThan(par.time); // measured 1.433 — the porch clock compresses the old +0.3 s drag
  }, 120_000);

  test('the booster is a CHOICE both ways: spent EARLY it buys the second crossing whole (exported hidden line); spent LAST it is trim at the par’s hash', async () => {
    const par = await replayRun(GARDEN05, GARDEN05.parBuild());
    expect((await replayRun(GARDEN05, garden05BoosterBuild())).status).toBe('finished');
    const early = await replayRun(GARDEN05, placed(GARDEN05, spec(['bo', 'dr', 'st', 'la'])));
    expect(early.status).toBe('finished');
    expect(early.time).toBeLessThan(par.time); // measured 1.108 vs 1.342 — the garden's hidden 3★, porch-clocked
    const last = await replayRun(GARDEN05, placed(GARDEN05, spec(['dr', 'st', 'dr', 'la', 'bo'])));
    expect(last.status).toBe('finished');
    expect(last.hash).toBe(par.hash); // the par's own clock and hash — one piece wasted
    const full = await replayRun(GARDEN05, placed(GARDEN05, spec(['bo', 'dr', 'st', 'dr', 'la'])));
    // stage-6 brevity trim: at chute speed the booster SPENT and the dips
    // RIDDEN is the over-earned line — the extra Δv arrives with both
    // crossings already flown and overshoots the catch (measured `fell`
    // 1.492). The buy stays a SUBSTITUTION for the far crossing, never an
    // addition to the ride — kitchen05's rule, sharpened by the faster
    // release (it finished at 2.425 on the −12° crawl).
    expect(full.status).not.toBe('finished');
  }, 150_000);

  test('the whole tray is a CHOICE tray: the tail order finishes poor, the booster-first six-piece order falls', async () => {
    const tail = await replayRun(GARDEN05, placed(GARDEN05, spec(['dr', 'st', 'dr', 'la', 'st', 'bo'])));
    expect(tail.status).toBe('finished'); // 6 placed, the par's clock: the 2★ consolation
    const front = await replayRun(GARDEN05, placed(GARDEN05, spec(['bo', 'dr', 'st', 'st', 'dr', 'la'])));
    expect(front.status).not.toBe('finished');
  }, 90_000);

  test('the film is FLOWN: the par rides both crossings and replays bit-identical wet vs dry', async () => {
    const wet = await replayRun(GARDEN05, GARDEN05.parBuild());
    const dryRun = await replayRun(dry(GARDEN05), GARDEN05.parBuild());
    expect(wet.hash).toBe(dryRun.hash);
  }, 60_000);

  test('the BRIDGE PROBE rolls through the sprawl: diverges wet, finishes, wet FASTER (garden03’s law, flown)', async () => {
    const wet = await replayRun(GARDEN05, garden05ProbeBuild());
    const dryRun = await replayRun(dry(GARDEN05), garden05ProbeBuild());
    expect(wet.status).toBe('finished');
    expect(dryRun.status).toBe('finished');
    expect(wet.hash).not.toBe(dryRun.hash);
    expect(wet.time).toBeLessThan(dryRun.time); // measured 3.125 vs 3.342
  }, 90_000);
});

describe('garden set wiring — the placement table is derived, not folklore', () => {
  const LINES_BY_LEVEL: Record<string, Build[]> = {
    garden01: [GARDEN01.parBuild()],
    garden02: [GARDEN02.parBuild(), garden02BoreBuild()],
    garden03: [GARDEN03.parBuild(), garden03SprinklerBuild()],
    garden04: [GARDEN04.parBuild()],
    garden05: [GARDEN05.parBuild(), garden05BoosterBuild()],
  };

  for (const level of LADDER) {
    test(`${level.id} centres the patio disc on the run, 5 mm under the LOWEST authored deck's underside of the flush paving, 52 cm back`, () => {
      const p = gardenSetPlacement(level.id)!;
      expect(p.yaw).toBe(0);
      expect(p.position[2]).toBe(-GARDEN_AXIS_OFFSET);
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
      // the flush-deck rule: the paving's FINISH surface (DECK_Y above the
      // set origin, the floor-camera law) sits at DECK_CLEARANCE under the
      // lowest authored line's finish deck.
      expect(p.position[1] + DECK_Y).toBeCloseTo(lowest - 0.005, 5);
    });
  }

  test('no dress solid crosses the run corridor (lane |z| ≤ 5 cm; every near edge ≥ 10 cm clear)', () => {
    // the guard-solid sweep is DERIVED from the live group boxes (variant B
    // dresses all around its deck — an analytic near-edge table would be
    // folklore about instanced meshes): mount each rung's set exactly as
    // boot does and demand every `dress` mesh's forward-most world z ≥ the
    // 10 cm clearance behind the corridor.
    const set = buildGardenSet(THREE, {});
    for (const level of LADDER) {
      const p = gardenSetPlacement(level.id)!;
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

  test('the named deck anchors live inside the deck bounds (set-wiring convention)', () => {
    expect(insideDeck(0.215, -0.332)).toBe(true); // the pipe centre
    expect(insideDeck(0.34, 0.02)).toBe(true); // the gnome
    expect(insideDeck(-0.14, 0.24)).toBe(true); // the hose coil
  });
});

describe('Garden sandbox — the no-budget room (mirrors kitchen-sandbox, stage 6)', () => {
  test('the sandbox has no budget and everything unlocked', () => {
    expect(GARDEN_SANDBOX.sandbox).toBe(true);
    expect(GARDEN_SANDBOX.budget).toBeGreaterThanOrEqual(999);
    for (const kind of PIECE_KINDS) expect(GARDEN_SANDBOX.tray[kind], kind).toBe(99);
  });

  test('the sandbox is NOT a campaign rung: off the ladder, nobody\'s next, `?level=`-addressable like the kitchen one', () => {
    expect(campaignIndex('garden-sandbox')).toBe(-1);
    expect(nextInCampaign('garden-sandbox')).toBeNull();
  });

  test('the sandbox lap finishes (headless)', async () => {
    const result = await replayRun(GARDEN_SANDBOX, GARDEN_SANDBOX.parBuild());
    expect(result.status).toBe('finished');
  }, 30_000);

  test("the tray's own seating reproduces the sandbox lap byte-for-byte", () => {
    expect(serialize(trayParityBuild(GARDEN_SANDBOX))).toBe(serialize(GARDEN_SANDBOX.parBuild()));
  });

  test("pars.json's par piece count is the sandbox's tray basis", () => {
    expect(PARS[GARDEN_SANDBOX.id]?.pieces).toBe(GARDEN_SANDBOX.par.pieces);
  });

  test('the sandbox set mount follows the rung rule (centred on the lap, deck-cleared)', () => {
    const p = gardenSetPlacement('garden-sandbox')!;
    expect(p.yaw).toBe(0);
    expect(p.position[2]).toBe(-GARDEN_AXIS_OFFSET);
    const rig = new KitRig(GARDEN_SANDBOX.parBuild(), 1);
    let mn = Infinity;
    let mx = -Infinity;
    for (let s = 0; s <= rig.length; s += 0.005) {
      mn = Math.min(mn, rig.frameAt(s).pos.x);
      mx = Math.max(mx, rig.frameAt(s).pos.x);
    }
    expect(Math.abs(p.position[0] - (mn + mx) / 2)).toBeLessThan(0.002);
    expect(p.position[1] + DECK_Y).toBeCloseTo(finishDeckY(GARDEN_SANDBOX.parBuild()) - 0.005, 5);
  });
});
