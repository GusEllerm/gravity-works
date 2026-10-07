/**
 * PORCH ladder playability proof (stage 5, Level Designer's gate) — the
 * garage/garden ladder test's twin, with the porch's own additions:
 *
 * - THE ZONE-FREE LAW: the ratified set ships `HAZARDS` empty (the weave
 *   shade is read-only rhythm) and NO rung adds a live zone — shadow is
 *   never slippery, and a taught hazard must be enforced physics first
 *   (rain is a later wave). The porch's honest wet-side assertion is
 *   garden01's: there is nothing here to be wet about. Every rung's
 *   `hazards` is absent-or-empty, test-pinned.
 * - THE FAIL-TIMING LAW, ladder-wide: every rung launches on the
 *   −29°/0.16 m chute tool, so the L02 sweep's death-clock verdict holds
 *   on every wrong build — nothing crawls past ~1.5 s. The death tables
 *   below are the sweep's (`tmp/porch-sweep.mjs`), classified into
 *   families: porch01's is the cleanest in the house (all singletons and
 *   the flat pair die at 0.87–0.97 s — UNDER ONE SECOND — and the only
 *   late death, the lip+drop pair crossing the catch at 1.28, is a full
 *   0.3 s away from that family).
 * - BOTH ROUTES ANCHORED on the choice/trade-off rungs: porch02's lazy
 *   and door lines AND porch03's sink and hard lines finish on the
 *   BUILDER-ANCHORED mount (the reach-sum equality makes it structural —
 *   bedroom02's B2 property, now routine), and porch05's two authored
 *   crossing routes finish on both mountings with the par clocking the
 *   faster.
 * - THE PINNED STEP: porch04's deeper 55° trench (the kitchen05
 *   precedent — the order lesson needs a crawl-uncrossable gap): the
 *   belly build `straight → drop → landing` that finishes under the
 *   LADDER's forgiving step DIES here at ~1.48 s, while all 24 whole-tray
 *   orders still finish (the span is untouched) and the only remaining
 *   3-piece finisher arrives 0.15 s over the par clock.
 * - The placement derivation on the flush planks (mount y = lowest
 *   authored finish deck − clearance − `DECK_Y`, the deck's own 5 mm
 *   carried explicitly — the garden's flush-deck rule), the derived
 *   dress-box sweep (the corner POSTS at set z +0.421 are the solid that
 *   sets `PORCH_AXIS_OFFSET` = 0.53), the threshold-pair staging honesty
 *   (porch02's exported sockets sit inside the deck bounds, their ±z
 *   travel across the +x lane — the ride through the door is a story),
 *   and the set module's `PROP_CALLOUTS` rows (the porch registered its
 *   callouts in the SET module where the garage asked #8a to move its
 *   one line — authorship matches every other set).
 */
import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import { PORCH01 } from '../../src/world/levels/porch01.level.ts';
import { PORCH02, porch02DoorBuild } from '../../src/world/levels/porch02.level.ts';
import { PORCH03, porch03BounceBuild } from '../../src/world/levels/porch03.level.ts';
import { PORCH04 } from '../../src/world/levels/porch04.level.ts';
import { PORCH05, porch05CatchFirstBuild } from '../../src/world/levels/porch05.level.ts';
import { trayCount, type KitchenLevel } from '../../src/world/levels/kitchen01.level.ts';
import { levelTrayParams } from '../../src/boot.ts';
import { PARS } from '../../src/world/stars.ts';
import { PIECES, type PieceKind } from '../../src/track/pieces.ts';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import { type Build } from '../../src/track/build.ts';
import { KitRig } from '../../src/feel/kittrack.ts';
import { porchSetPlacement, PORCH_AXIS_OFFSET } from '../../src/world/setPlacement.ts';
import { buildPorchSet } from '../../src/sets/porch/index.ts';
import { HAZARDS, insideDeck, PORCH_SOCKET_FRAMES } from '../../src/sets/porch/data.ts';
import { PROP_CALLOUTS } from '../../src/ui/callouts.ts';
import { replayRun } from '../../src/replay/replay.ts';

/** The structural rung the ladders all satisfy (the garage twin). */
type Rung = Omit<KitchenLevel, 'set'>;

const LADDER: readonly Rung[] = [PORCH01, PORCH02, PORCH03, PORCH04, PORCH05];

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
    const p = structuredClone(params[def]!);
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

/** Distinct orders of a multiset (porch05's two identical lips). */
function distinctOrders(items: readonly PieceKind[]): PieceKind[][] {
  const seen = new Set<string>();
  const out: PieceKind[][] = [];
  for (const p of permutations(items)) {
    const k = p.join('>');
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}

/** The y of a chained build's finish-deck (the finishCup in-socket). */
function finishDeckY(build: Build): number {
  const cup = build.pieces.find((p) => p.def === 'finishCup')!;
  const [inSocket] = PIECES.finishCup.sockets(cup.params);
  return transformSocket(inSocket, cup.transform).pos.y;
}

describe('porch ladder — every par build finishes (headless)', () => {
  for (const level of LADDER) {
    test(`${level.id} par build finishes`, async () => {
      const result = await replayRun(level, level.parBuild());
      expect(result.status).toBe('finished');
    }, 30_000);
  }

  test('the par build replays identically twice (porch levels are data)', async () => {
    const first = await replayRun(PORCH01, PORCH01.parBuild());
    const second = await replayRun(PORCH01, PORCH01.parBuild());
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

describe('porch ladder — level contracts, and the zone-free law', () => {
  for (const level of LADDER) {
    test(`${level.id}: budget = tray total, par pieces <= 4 and <= budget, release on a slope`, () => {
      expect(level.budget).toBe(trayCount(level.tray));
      expect(level.par.pieces).toBeLessThanOrEqual(4); // stage-4 accept line: pars are small
      expect(level.par.pieces).toBeLessThanOrEqual(level.budget);
      expect(level.startSocket.tangent.y).toBeLessThan(0);
    });
    test(`${level.id}: NO live zone — shadow is never slippery (the porch doctrine)`, () => {
      expect(level.hazards ?? []).toHaveLength(0);
    });
  }

  test('the set ships its hazards empty BY LAW, and its callout rows are REGISTERED in the set module', () => {
    expect(Object.keys(HAZARDS)).toHaveLength(0);
    // the porch did what garage ask #8a asked the garage to do: the
    // first-sight lines are SET-module registrations (the bathroom
    // `prop:wetPatch` precedent), applied by importing `sets/porch`.
    expect(PROP_CALLOUTS['prop:weaveShadow']).toBeTruthy();
    expect(PROP_CALLOUTS['prop:gutterFlume']).toBeTruthy();
    for (const key of ['prop:weaveShadow', 'prop:gutterFlume']) {
      expect(PROP_CALLOUTS[key]).not.toContain('\n');
      expect(PROP_CALLOUTS[key]!.length).toBeLessThanOrEqual(120);
    }
  });

  test('pars.json carries the porch rungs on the tray basis', () => {
    for (const level of LADDER) {
      expect(PARS[level.id]?.pieces).toBe(level.par.pieces);
    }
  });

  test('every rung launches on the chute TOOL (the fail-timing law, ladder-wide)', () => {
    for (const level of LADDER) {
      const ramp = level.parBuild().pieces.find((p) => p.def === 'ramp')!;
      expect(ramp.params.angle, level.id).toBe(-29); // the −29°/0.16 m L02 tool
      expect(ramp.params.blend, level.id).toBe(0.12);
    }
  });
});

describe('porch01 — the three-piece flight under the weave (shade teaches the eye)', () => {
  test('the exact fit finishes on the builder mount, byte-identically to the par', async () => {
    const par = await replayRun(PORCH01, PORCH01.parBuild());
    const fit = await replayRun(PORCH01, placed(PORCH01, ['gapLip', 'drop', 'straight']));
    expect(fit.status).toBe('finished');
    expect(fit.hash).toBe(par.hash);
    expect(fit.time).toBeLessThanOrEqual(1.1);
  }, 60_000);

  test('every omission falls against the anchored fixtures — EARLY', async () => {
    const par = PORCH01.parBuild();
    const omissions: [string, Build['pieces']][] = [
      ['bare (fixtures only)', par.pieces.filter((p) => p.def !== 'gapLip' && p.def !== 'drop' && p.def !== 'straight')],
      ['drop only', par.pieces.filter((p) => p.def !== 'gapLip' && p.def !== 'straight')],
      ['straight only', par.pieces.filter((p) => p.def !== 'gapLip' && p.def !== 'drop')],
      ['gapLip only', par.pieces.filter((p) => p.def !== 'drop' && p.def !== 'straight')],
      ['drop + straight (no launch)', par.pieces.filter((p) => p.def !== 'gapLip')],
      ['gapLip + straight (no span)', par.pieces.filter((p) => p.def !== 'drop')],
      ['gapLip + drop (no run-out)', par.pieces.filter((p) => p.def !== 'straight')],
    ];
    for (const [label, pieces] of omissions) {
      const run = await replayRun(PORCH01, { levelId: PORCH01.id, pieces, seed: par.seed });
      expect(run.status, label).not.toBe('finished');
      expect(run.time, label).toBeLessThan(1.35); // the chute caps the clock
    }
  }, 120_000);

  test('death families: the ramp-end family is UNDER 1 s; the only late death is a distinct 0.3 s away', async () => {
    const par = PORCH01.parBuild();
    const early = [
      ['bare', ['gapLip', 'drop', 'straight']],
      ['drop only', ['gapLip', 'straight']],
      ['straight only', ['gapLip', 'drop']],
      ['drop + straight', ['gapLip']],
    ] as const;
    for (const [label, dropped] of early) {
      const pieces = par.pieces.filter(
        (p) => !(dropped as readonly PieceKind[]).includes(p.def) || p.def === 'ramp' || p.def === 'finishCup',
      );
      const run = await replayRun(PORCH01, { levelId: PORCH01.id, pieces, seed: par.seed });
      expect(run.status, label).toBe('fell');
      expect(run.time, `${label} ramp-end family`).toBeLessThan(1.0); // <1s, the law's early class
    }
    // the lip+drop pair crosses the visible catch and falls at the FAR
    // deck — kitchen02's ~1.25 family, 0.3 s clear of the ramp-end family
    const late = await replayRun(
      PORCH01,
      // ramp + cup anchored, lip + drop chained, no run-out plank
      { levelId: PORCH01.id, pieces: par.pieces.filter((p) => p.def !== 'straight'), seed: par.seed },
    );
    expect(late.status).toBe('fell');
    expect(late.time).toBeGreaterThan(1.2);
    expect(late.time).toBeLessThan(1.35);
  }, 90_000);

  test('whole-tray ORDERS: all six finish (eligibility; the lip sits flat anywhere)', async () => {
    for (const order of permutations<PieceKind>(['gapLip', 'drop', 'straight'])) {
      const run = await replayRun(PORCH01, placed(PORCH01, order));
      expect(run.status, order.join('>')).toBe('finished');
    }
  }, 120_000);
});

describe('porch02 — the CHOICE: lazy deck vs the pop at the door mouth; both reach, the lazy wins', () => {
  test('both lines finish in the chained model, and the LAZY deck line is faster', async () => {
    const par = await replayRun(PORCH02, PORCH02.parBuild());
    const door = await replayRun(PORCH02, porch02DoorBuild());
    expect(par.status).toBe('finished');
    expect(door.status).toBe('finished');
    expect(par.time).toBeLessThan(door.time); // measured 1.158 vs 1.250 — the pop pays the hop
  }, 60_000);

  test('on the BUILDER mount BOTH lines still reach the cup and the lazy one still wins (reach-sum equality; ask #2b does not bite here)', async () => {
    const lazy = await replayRun(PORCH02, placed(PORCH02, ['straight', 'straight', 'drop', 'straight']));
    const door = await replayRun(PORCH02, placed(PORCH02, ['straight', 'gapLip', 'drop', 'straight']));
    expect(lazy.status).toBe('finished');
    expect(lazy.hash).toBe((await replayRun(PORCH02, PORCH02.parBuild())).hash);
    expect(door.status).toBe('finished'); // the swap is span-equal by construction
    expect(door.time).toBeGreaterThan(lazy.time);
  }, 90_000);

  test('whole-tray: EVERY order finishes (the union sums are order-invariant, kitchen02 law)', async () => {
    for (const order of distinctOrders(['straight', 'straight', 'straight', 'gapLip', 'drop'])) {
      const run = await replayRun(PORCH02, placed(PORCH02, order));
      expect(run.status, order.join('>')).toBe('finished');
    }
  }, 180_000);

  test('families: singletons and flat pairs die ≤ 1.05 s; the drop pairs die at the far deck ~1.25–1.43 s', async () => {
    const dies: [PieceKind[], number][] = [
      [['straight'], 1.0],
      [['gapLip'], 1.0],
      [['straight', 'straight'], 1.1],
      [['straight', 'gapLip'], 1.1],
      [['straight', 'straight', 'straight'], 1.2],
      [['straight', 'straight', 'gapLip'], 1.2],
      [['gapLip', 'drop'], 1.35],
      [['straight', 'drop'], 1.35],
      [['straight', 'straight', 'drop'], 1.45],
      [['straight', 'gapLip', 'drop'], 1.45],
    ];
    for (const [kinds, cap] of dies) {
      const run = await replayRun(PORCH02, placed(PORCH02, kinds));
      expect(run.status, kinds.join('>')).toBe('fell');
      expect(run.time, kinds.join('>')).toBeLessThan(cap);
    }
  }, 180_000);
});

describe('porch03 — THE STEP: tray = par (the kitchen03 shape), NO subset finishes at all, and the bounce is the hidden ceiling', () => {
  test('the par line finishes, byte-identically on the builder mount; the par places the WHOLE tray', async () => {
    const par = await replayRun(PORCH03, PORCH03.parBuild());
    const fit = await replayRun(PORCH03, placed(PORCH03, ['straight', 'gapLip', 'drop', 'straight']));
    expect(par.status).toBe('finished');
    expect(fit.status).toBe('finished');
    expect(fit.hash).toBe(par.hash);
    expect(PORCH03.par.pieces).toBe(trayCount(PORCH03.tray)); // the kitchen03 shape, proven again
  }, 60_000);

  test('the BOUNCE (exported) is the fastest legitimate build — ~0.12 s UNDER the par order (the kitchen02 beable-par, hidden in plain sight)', async () => {
    const bounce = await replayRun(PORCH03, porch03BounceBuild());
    expect(bounce.status).toBe('finished');
    expect(bounce.time).toBeLessThan(1.15); // measured ~1.125, all four tray pieces
    const par = await replayRun(PORCH03, PORCH03.parBuild());
    expect(bounce.time).toBeLessThan(par.time);
  }, 60_000);

  test('the ORDER lesson: 22 of 24 orders finish — lip-first with the step LAST wedges (porch04’s belly law, announced early)', async () => {
    let finished = 0;
    for (const order of permutations<PieceKind>(['straight', 'straight', 'gapLip', 'drop'])) {
      const run = await replayRun(PORCH03, placed(PORCH03, order));
      if (order.join('>') === 'gapLip>straight>straight>drop') {
        expect(run.status, order.join('>')).toBe('fell'); // the announced wedge
        expect(run.time).toBeLessThan(1.5);
      } else {
        expect(run.status, order.join('>')).toBe('finished');
      }
      if (run.status === 'finished') finished += 1;
    }
    expect(finished).toBe(22);
  }, 180_000);

  test('ANTI-CHEAT (the tuning war this rung fought): EVERY subset of the tray FALLS — no bridge exists', async () => {
    const dies: [PieceKind[], number][] = [
      [['straight'], 1.05],
      [['gapLip'], 1.05],
      [['drop'], 1.05],
      [['straight', 'straight'], 1.1],
      [['straight', 'gapLip'], 1.1],
      [['straight', 'drop'], 1.25],
      [['gapLip', 'drop'], 1.3],
      [['straight', 'gapLip', 'straight'], 1.2],
      [['straight', 'drop', 'straight'], 1.4],
      [['straight', 'gapLip', 'drop'], 1.45],
      [['gapLip', 'drop', 'straight'], 1.4],
    ];
    for (const [kinds, cap] of dies) {
      const run = await replayRun(PORCH03, placed(PORCH03, kinds));
      expect(run.status, kinds.join('>')).toBe('fell'); // not ONE subset reaches the cup
      expect(run.time, kinds.join('>')).toBeLessThan(cap); // and all die inside the law
    }
  }, 180_000);
});

describe('porch04 — the capstone: 24/24, and the PINNED step kills the cheat the ladder step fed', () => {
  test('ALL 24 orders of the four tray pieces finish (builder-anchored)', async () => {
    const orders = permutations<PieceKind>(['landing', 'drop', 'straight', 'gapLip']);
    expect(orders).toHaveLength(24);
    for (const order of orders) {
      const run = await replayRun(PORCH04, placed(PORCH04, order));
      expect(run.status, `order ${order.join('>')}`).toBe('finished');
    }
  }, 180_000);

  test('the par ORDER is the reference pace (the capstone is the ladder’s precision rung, stated) and every order finishes under 1.4 s', async () => {
    const par = await replayRun(PORCH04, placed(PORCH04, ['landing', 'drop', 'straight', 'gapLip']));
    expect(par.status).toBe('finished');
    expect(par.hash).toBe((await replayRun(PORCH04, PORCH04.parBuild())).hash);
    for (const order of permutations<PieceKind>(['landing', 'drop', 'straight', 'gapLip'])) {
      const run = await replayRun(PORCH04, placed(PORCH04, order));
      expect(run.time).toBeGreaterThanOrEqual(par.time - 0.01); // nothing legitimate beats the reference
      expect(run.time).toBeLessThan(1.4);
    }
  }, 180_000);

  test('the PINNED step kills the belly the ladder’s forgiving step fed (the kitchen05 precedent)', async () => {
    // with the ladder's kitchen02-tuned 0.10 m step this build ROLLED the
    // trench and finished at ~1.23 s — under the par line, un-teaching the
    // every-piece law. Pinned deeper (0.14 m / 55°), it wedges and dies at
    // ~1.48 s — late, visible, and the porch's clearest wrong-build lesson.
    const belly = await replayRun(PORCH04, placed(PORCH04, ['straight', 'drop', 'landing']));
    expect(belly.status).toBe('fell');
    expect(belly.time).toBeGreaterThan(1.4);
  }, 60_000);

  test('families: singletons ≤ 1.1 s, pairs ≤ 1.35 s, the shortcuts finish LATE (> the par line) or die', async () => {
    for (const kinds of [['straight'], ['gapLip'], ['drop'], ['landing']] as PieceKind[][]) {
      const run = await replayRun(PORCH04, placed(PORCH04, kinds));
      expect(run.status, kinds.join('>')).toBe('fell');
      expect(run.time, kinds.join('>')).toBeLessThan(1.15); // EARLY-class; the sink singleton slides to ~1.10
    }
    for (const kinds of [['straight', 'landing'], ['gapLip', 'landing'], ['gapLip', 'drop']] as PieceKind[][]) {
      const run = await replayRun(PORCH04, placed(PORCH04, kinds));
      expect(run.status, kinds.join('>')).toBe('fell');
      expect(run.time, kinds.join('>')).toBeLessThan(1.35);
    }
    // the pop-and-catch shortcut (the ladder's first verb three times over)
    // is the ONE 3-piece finisher: it arrives 0.15 s over the par line —
    // pieces star, never the time star.
    const shortcut = await replayRun(PORCH04, placed(PORCH04, ['gapLip', 'drop', 'landing']));
    expect(shortcut.status).toBe('finished');
    expect(shortcut.time).toBeGreaterThan(PORCH04.par.time);
  }, 180_000);
});

describe('porch05 — THE CROSSING: two thresholds, both routes finish on both mountings, the shortcut is late', () => {
  test('BOTH authored routes finish chained, and the sink-first PAR is the fast one', async () => {
    const sinkFirst = await replayRun(PORCH05, PORCH05.parBuild());
    const catchFirst = await replayRun(PORCH05, porch05CatchFirstBuild());
    expect(sinkFirst.status).toBe('finished');
    expect(catchFirst.status).toBe('finished');
    expect(sinkFirst.time).toBeLessThan(catchFirst.time); // measured ~1.19 vs ~1.39
  }, 60_000);

  test('BOTH authored routes finish on the BUILDER-ANCHORED mount (same multiset → same end plane, by construction)', async () => {
    const b = await replayRun(PORCH05, placed(PORCH05, ['gapLip', 'landing', 'gapLip', 'drop']));
    const a = await replayRun(PORCH05, placed(PORCH05, ['gapLip', 'drop', 'gapLip', 'landing']));
    expect(b.status).toBe('finished');
    expect(b.hash).toBe((await replayRun(PORCH05, PORCH05.parBuild())).hash);
    expect(a.status).toBe('finished');
    expect(a.time).toBeGreaterThan(b.time);
  }, 90_000);

  test('every WHOLE-TRAY order finishes (the campaign’s last kindness: the identical-span sum)', async () => {
    for (const order of distinctOrders(['gapLip', 'gapLip', 'drop', 'landing'])) {
      const run = await replayRun(PORCH05, placed(PORCH05, order));
      expect(run.status, order.join('>')).toBe('finished');
    }
  }, 180_000);

  test('the par ORDER is beatable within the tray (sink, belly the carry, then the double pop)', async () => {
    const beat = await replayRun(PORCH05, placed(PORCH05, ['landing', 'drop', 'gapLip', 'gapLip']));
    expect(beat.status).toBe('finished');
    expect(beat.time).toBeLessThan(PORCH05.par.time); // measured ~1.12 vs the 1.20 line
  }, 60_000);

  test('families: everything short of the tray FALLS by 1.55 s — the one 3-piece shortcut finishes ~0.07 s OVER the par line', async () => {
    const dies: [PieceKind[], number][] = [
      [['gapLip'], 1.05],
      [['landing'], 1.15],
      [['gapLip', 'gapLip'], 1.15],
      [['gapLip', 'landing'], 1.3],
      [['gapLip', 'drop'], 1.4],
      [['gapLip', 'gapLip', 'drop'], 1.6],
      [['gapLip', 'gapLip', 'landing'], 1.4],
      [['drop', 'landing'], 1.45],
    ];
    for (const [kinds, cap] of dies) {
      const run = await replayRun(PORCH05, placed(PORCH05, kinds));
      expect(run.status, kinds.join('>')).toBe('fell');
      expect(run.time, kinds.join('>')).toBeLessThan(cap);
    }
    const shortcut = await replayRun(PORCH05, placed(PORCH05, ['gapLip', 'drop', 'landing']));
    expect(shortcut.status).toBe('finished'); // one threshold only, once…
    expect(shortcut.time).toBeGreaterThan(PAR05_LINE()); // …and never under the time line
  }, 180_000);
});

/** The shipped 3-star TIME line for porch05 (the pars layer, not the file
 *  fallback) — shortcuts are scored against what the page actually shows. */
function PAR05_LINE(): number {
  return PARS['porch05']!.time;
}

describe('porch set wiring — the placement table is derived, not folklore', () => {
  const LINES_BY_LEVEL: Record<string, Build[]> = {
    porch01: [PORCH01.parBuild()],
    porch02: [PORCH02.parBuild(), porch02DoorBuild()],
    porch03: [PORCH03.parBuild(), porch03BounceBuild()],
    porch04: [PORCH04.parBuild()],
    porch05: [PORCH05.parBuild(), porch05CatchFirstBuild()],
  };

  for (const level of LADDER) {
    test(`${level.id} centres the deck on the run, 5 mm under the LOWEST authored finish deck (DECK_Y and all), 53 cm back`, () => {
      const p = porchSetPlacement(level.id)!;
      expect(p.yaw).toBe(0); // BY LAW: the weave crosses the scene exactly as ratified
      expect(p.position[2]).toBe(-PORCH_AXIS_OFFSET);
      const rig = new KitRig(level.parBuild(), 1);
      let mn = Infinity;
      let mx = -Infinity;
      for (let s = 0; s <= rig.length; s += 0.005) {
        const f = rig.frameAt(s);
        mn = Math.min(mn, f.pos.x);
        mx = Math.max(mx, f.pos.x);
      }
      expect(Math.abs(p.position[0] - (mn + mx) / 2)).toBeLessThan(0.002);
      // the flush-plank rule: the deck's FINISH surface lives at `DECK_Y`
      // (5 mm) above the set origin, so the mount y is the deck line minus
      // the clearance minus the plank top — the garden's flush-deck rule.
      const lowest = Math.min(...LINES_BY_LEVEL[level.id]!.map(finishDeckY));
      expect(p.position[1]).toBeCloseTo(lowest - 0.005 - 0.005, 5);
    });
  }

  test('no dress solid crosses the run corridor (lane |z| ≤ 5 cm; every near edge ≥ 10 cm clear)', () => {
    // the guard-solid sweep is DERIVED from the live group boxes: mount
    // each rung's set exactly as boot does and demand every `dress` mesh's
    // forward-most world z ≤ −10 cm behind the corridor. The ROOF CORNER
    // POSTS (set z +0.421) are the solids that set PORCH_AXIS_OFFSET = 0.53;
    // the deck, stoam, flume, door assembly and walls are SHELL (the
    // set's own guard split) and never enter this sweep.
    const set = buildPorchSet(THREE, {});
    for (const level of LADDER) {
      const p = porchSetPlacement(level.id)!;
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

  test('the threshold pair is staging: porch02 exports it, it sits INSIDE the deck bounds, and its travel axis is ACROSS the lane', () => {
    // the ride THROUGH the door is a story, not a bore (the bathroom
    // drain / garden bore / garage wheel pattern): the pair's tangent is
    // +z — the crossing direction of the HOUSE, not of the +x rail — and
    // a ride would need ask #4's prop-socket seating behind a
    // lane-crossing anchor (the porch ask, session log).
    const sockets = PORCH02.propSockets!;
    expect(Object.keys(sockets).sort()).toEqual(['door.in', 'door.out']);
    const p = porchSetPlacement('porch02')!;
    for (const name of ['door.in', 'door.out'] as const) {
      const f = PORCH_SOCKET_FRAMES[name];
      // INSIDE the deck bounds — evaluated in SET space (the deck disc is
      // centred on the set origin; the mount translates the pair with the
      // porch, which the second pair of assertions pins).
      expect(insideDeck(f.pos[0], f.pos[2]), name).toBe(true);
      const socket = sockets[name]!;
      expect(Math.abs(socket.pos.x - (f.pos[0] + p.position[0])), name).toBeLessThan(1e-5);
      expect(Math.abs(socket.pos.z - (f.pos[2] + p.position[2])), name).toBeLessThan(1e-5);
      expect(Math.abs(socket.tangent.z), name).toBeCloseTo(1, 9); // across the +x lane
      expect(Math.abs(socket.tangent.x), name).toBeCloseTo(0, 9);
    }
  });
});
