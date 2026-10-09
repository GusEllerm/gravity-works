import { campaignIndex, nextInCampaign } from '../../src/world/campaign.ts';
/**
 * Bedroom ladder playability proof (stage 4, Level Designer's gate) — the
 * kitchen ladder test's twin, plus the stage-4 extension of the
 * `tray ⊇ parBuild` invariant to EVERY authored level of BOTH ladders
 * (the kitchen rungs and the bedroom rungs ride one rule).
 *
 * Same seams as the kitchen gate: every parBuild finishes headless through
 * `replayRun`; the level contracts hold (budget = tray, one geometry per
 * kind, `trayParityBuild` byte-identical to `parBuild`, pars.json on the
 * tray basis); the choices and the trade-off are real (bedroom02's pillow
 * line beats its step line ON BOTH MOUNTS since the B2 redesign,
 * bedroom03's hard catch beats its soft catch,
 * bedroom04's whole tray finishes in all 24 orders and the par order is
 * beatable, bedroom01's three-piece fit is the ONLY builder-mountable fit).
 *
 * The chained-vs-anchored honesty note the kitchen era established
 * (Concepts/Levels §The same data replayed the way the BUILDER mounts it)
 * USED to except bedroom02's soft line (ask #2b — chained finish, anchored
 * fall). The stage-4 B2 redesign retired that exception for this rung: the
 * pillow sink and the plateau step now end on ONE deck plane (≈3 mm apart
 * since the pass-2 sink steepening), both lines finish on the builder
 * mount, and the tests below assert it.
 */
import { describe, expect, test } from 'vitest';
import { BEDROOM01 } from '../../src/world/levels/bedroom01.level.ts';
import { BEDROOM02, bedroom02StepBuild } from '../../src/world/levels/bedroom02.level.ts';
import { BEDROOM03, bedroom03SoftBuild } from '../../src/world/levels/bedroom03.level.ts';
import { BEDROOM04 } from '../../src/world/levels/bedroom04.level.ts';
import { BEDROOM05, BEDROOM_SANDBOX, bedroom05BoosterBuild } from '../../src/world/levels/bedroom05.level.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';
import { trayCount, type KitchenLevel } from '../../src/world/levels/kitchen01.level.ts';
import { KITCHEN02, kitchen02ArcBuild } from '../../src/world/levels/kitchen02.level.ts';
import { KITCHEN03 } from '../../src/world/levels/kitchen03.level.ts';
import { KITCHEN04 } from '../../src/world/levels/kitchen04.level.ts';
import { KITCHEN05, KITCHEN_SANDBOX } from '../../src/world/levels/kitchen05.level.ts';
import { BATHROOM01 } from '../../src/world/levels/bathroom01.level.ts';
import { BATHROOM02, bathroom02DrainBuild } from '../../src/world/levels/bathroom02.level.ts';
import { BATHROOM03, bathroom03SplashBuild } from '../../src/world/levels/bathroom03.level.ts';
import { BATHROOM04 } from '../../src/world/levels/bathroom04.level.ts';
import { BATHROOM05, bathroom05BoosterBuild } from '../../src/world/levels/bathroom05.level.ts';
import { GARDEN01 } from '../../src/world/levels/garden01.level.ts';
import { GARDEN02, garden02BoreBuild } from '../../src/world/levels/garden02.level.ts';
import { GARDEN03, garden03SprinklerBuild } from '../../src/world/levels/garden03.level.ts';
import { GARDEN04 } from '../../src/world/levels/garden04.level.ts';
import { GARDEN05, garden05BoosterBuild } from '../../src/world/levels/garden05.level.ts';
import { GARAGE01 } from '../../src/world/levels/garage01.level.ts';
import { GARAGE02, garage02FloorBuild } from '../../src/world/levels/garage02.level.ts';
import { GARAGE03, garage03OilLaneBuild } from '../../src/world/levels/garage03.level.ts';
import { GARAGE04 } from '../../src/world/levels/garage04.level.ts';
import { GARAGE05, garage05BoosterBuild } from '../../src/world/levels/garage05.level.ts';
import { PORCH01 } from '../../src/world/levels/porch01.level.ts';
import { PORCH02, porch02DoorBuild } from '../../src/world/levels/porch02.level.ts';
import { PORCH03, porch03BounceBuild } from '../../src/world/levels/porch03.level.ts';
import { PORCH04 } from '../../src/world/levels/porch04.level.ts';
import { PORCH05, porch05CatchFirstBuild } from '../../src/world/levels/porch05.level.ts';
import { trayParityBuild } from '../../src/boot.ts';
import { levelTrayParams } from '../../src/ui/advice.ts';
import { PARS } from '../../src/world/stars.ts';
import { PIECE_KINDS, PIECES, type PieceKind } from '../../src/track/pieces.ts';
import { fitSocket } from '../../src/track/snap.ts';
import { transformSocket } from '../../src/track/socket.ts';
import { serialize, type Build } from '../../src/track/build.ts';
import { KitRig } from '../../src/feel/kittrack.ts';
import { bedroomSetPlacement } from '../../src/world/setPlacement.ts';
import { insideFloor, DRAWER_SOCKET_FRAMES, HOMEWORK } from '../../src/sets/bedroom/data.ts';
import { replayRun } from '../../src/replay/replay.ts';

/** The structural rung both ladders satisfy — the kitchen/bedroom level
 *  shapes without the literal set id (the seams the invariants read). */
type Rung = Omit<KitchenLevel, 'set'>;

const LADDER: readonly Rung[] = [BEDROOM01, BEDROOM02, BEDROOM03, BEDROOM05, BEDROOM04];
const KITCHEN_LADDER: readonly Rung[] = [
  KITCHEN01,
  KITCHEN02,
  KITCHEN03,
  KITCHEN04,
  KITCHEN05,
  KITCHEN_SANDBOX,
];

/** The builder-anchored mount emulation (initialBuild anchors the fixtures
 *  at their par transforms; the tray pieces chain off the ramp exit with the
 *  tray's single geometry — the same emulation the kitchen test ports). */
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

describe('bedroom ladder — every par build finishes (headless)', () => {
  for (const level of LADDER) {
    test(`${level.id} par build finishes`, async () => {
      const result = await replayRun(level, level.parBuild());
      expect(result.status).toBe('finished');
    }, 30_000);
  }

  test('the par build replays identically twice (bedroom levels are data)', async () => {
    const first = await replayRun(BEDROOM01, BEDROOM01.parBuild());
    const second = await replayRun(BEDROOM01, BEDROOM01.parBuild());
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

describe('bedroom ladder — level contracts', () => {
  for (const level of LADDER) {
    test(`${level.id}: budget = tray total, par pieces <= 4 and <= budget, release on a slope`, () => {
      expect(level.budget).toBe(trayCount(level.tray));
      expect(level.par.pieces).toBeLessThanOrEqual(4); // stage-4 accept line: pars are small
      expect(level.par.pieces).toBeLessThanOrEqual(level.budget);
      expect(level.startSocket.tangent.y).toBeLessThan(0);
    });
  }

  test('bedroom03 exports the drawer bore sockets the Environment Artist builds to', () => {
    const sockets = BEDROOM03.propSockets!;
    expect(Object.keys(sockets).sort()).toEqual(['drawer.in', 'drawer.out']);
    for (const [name, socket] of Object.entries(sockets)) {
      // placed by this level's mount (the bowl-rim convention)
      expect(insideFloor(socket.pos.x, socket.pos.z)).toBe(true);
      // the tangent MISMATCH the bedroom ask states: the frames carry the
      // set's own DRAWER_AXIS tangents, which point OUT of the bore at both
      // ends — the pair is exported unchanged so the ask is stated against
      // real numbers, not a wish.
      const frame = DRAWER_SOCKET_FRAMES[name as 'drawer.in' | 'drawer.out'];
      expect(socket.tangent.x).toBeCloseTo(frame.tangent[0], 9);
      expect(socket.tangent.z).toBeCloseTo(frame.tangent[2], 9);
    }
  });
});

describe('ladders (kitchen + bedroom + bathroom + garden + garage + porch) — tray ⊇ parBuild on EVERY authored level', () => {
  /** Every line ALL SIX ladders author, in the level files' own data. */
  const BATHROOM_LADDER: readonly Rung[] = [BATHROOM01, BATHROOM02, BATHROOM03, BATHROOM05, BATHROOM04];
  const GARDEN_LADDER: readonly Rung[] = [GARDEN01, GARDEN02, GARDEN03, GARDEN05, GARDEN04];
  const GARAGE_LADDER: readonly Rung[] = [GARAGE01, GARAGE02, GARAGE03, GARAGE05, GARAGE04];
  const PORCH_LADDER: readonly Rung[] = [PORCH01, PORCH02, PORCH03, PORCH04, PORCH05];
  const LINES: readonly { level: Rung; label: string; build: Build }[] = [
    ...[...KITCHEN_LADDER, ...LADDER, ...BATHROOM_LADDER, ...GARDEN_LADDER, ...GARAGE_LADDER, ...PORCH_LADDER].map((level) => ({
      level,
      label: 'par build',
      build: level.parBuild(),
    })),
    { level: KITCHEN02, label: 'arc line', build: kitchen02ArcBuild() },
    { level: BEDROOM02, label: 'step line', build: bedroom02StepBuild() },
    { level: BEDROOM03, label: 'soft catch line', build: bedroom03SoftBuild() },
    { level: BATHROOM02, label: 'drain line', build: bathroom02DrainBuild() },
    { level: BATHROOM03, label: 'splash line', build: bathroom03SplashBuild() },
    { level: GARDEN02, label: 'bore line', build: garden02BoreBuild() },
    { level: GARDEN03, label: 'wet shortcut', build: garden03SprinklerBuild() },
    { level: GARAGE02, label: 'floor line', build: garage02FloorBuild() },
    { level: GARAGE03, label: 'oil lane', build: garage03OilLaneBuild() },
    { level: PORCH02, label: 'door line', build: porch02DoorBuild() },
    { level: PORCH03, label: 'bounce line', build: porch03BounceBuild() },
    { level: PORCH05, label: 'catch-first line', build: porch05CatchFirstBuild() },
    { level: BEDROOM05, label: 'booster line', build: bedroom05BoosterBuild() },
    { level: BATHROOM05, label: 'booster line', build: bathroom05BoosterBuild() },
    { level: GARDEN05, label: 'booster line', build: garden05BoosterBuild() },
    { level: GARAGE05, label: 'booster line', build: garage05BoosterBuild() },
  ];

  function multiset(pieces: Build['pieces']): Map<PieceKind, number> {
    const counts = new Map<PieceKind, number>();
    for (const p of pieces) counts.set(p.def, (counts.get(p.def) ?? 0) + 1);
    return counts;
  }

  for (const { level, label, build } of LINES) {
    test(`${level.id} — ${label}: tray ⊇ build (tray- or fixture-afforded, at the tray's ONE geometry)`, () => {
      for (const [kind, needed] of multiset(build.pieces)) {
        const afford = (level.tray[kind] ?? 0) + (level.fixtures?.[kind] ?? 0);
        expect(afford, `${level.id} ${label}: ${needed} × ${kind}`).toBeGreaterThanOrEqual(needed);
        const params = levelTrayParams(level, level.tray) ?? {};
        const geometry = params[kind] ?? level.parBuild().pieces.find((p) => p.def === kind)?.params;
        for (const p of build.pieces.filter((q) => q.def === kind)) {
          expect(p.params, `${level.id} ${label}: a second ${kind} geometry`).toEqual(geometry);
        }
      }
    });
  }

  for (const level of [...KITCHEN_LADDER, ...LADDER, ...BATHROOM_LADDER, ...GARAGE_LADDER]) {
    test(`${level.id} — pars.json's par piece count is the tray-basis number`, () => {
      expect(PARS[level.id]?.pieces).toBe(level.par.pieces);
    });
    test(`${level.id} — the tray's own seating reproduces the par build byte-for-byte`, () => {
      expect(serialize(trayParityBuild(level))).toBe(serialize(level.parBuild()));
    });
    test(`${level.id} — budget = tray total and par pieces are the tray basis`, () => {
      const fromTray = level.parBuild().pieces.filter((p) => !(p.def in (level.fixtures ?? {}))).length;
      if (!level.sandbox) expect(level.budget).toBe(trayCount(level.tray));
      expect(level.par.pieces).toBe(fromTray);
      expect(fromTray).toBeLessThanOrEqual(level.budget);
    });
  }
});

describe('bedroom01 — the three-piece fit is the ONLY fit (cable dip promise)', () => {
  test('the exact fit finishes on the builder mount, at par', async () => {
    const run = await replayRun(BEDROOM01, placed(BEDROOM01, ['straight', 'drop', 'straight']));
    expect(run.status).toBe('finished');
    expect(run.time).toBeLessThanOrEqual(2.35);
  }, 30_000);

  test('every omission falls against the anchored fixtures', async () => {
    const par = BEDROOM01.parBuild();
    const cup = par.pieces.find((p) => p.def === 'finishCup')!;
    const straights = par.pieces.filter((p) => p.def === 'straight');
    const omissions: [string, Build['pieces']][] = [
      ['no pieces', par.pieces.filter((p) => p.def !== 'straight' && p.def !== 'drop')],
      ['drop only', par.pieces.filter((p) => p.def !== 'straight')],
      ['one straight only', [...par.pieces.filter((p) => p.def !== 'straight' && p.def !== 'drop'), straights[0]!]],
      ['first straight missing', par.pieces.filter((p) => p.def !== 'finishCup' && p !== straights[0] && p.def !== 'drop')],
      ['second straight missing', par.pieces.filter((p) => p.def !== 'finishCup' && p !== straights[1] && p.def !== 'drop')],
    ];
    for (const [label, pieces] of omissions) {
      const run = await replayRun(BEDROOM01, { levelId: BEDROOM01.id, pieces: [...pieces, cup], seed: par.seed });
      expect(run.status, label).not.toBe('finished');
    }
  }, 90_000);

  test('every whole-tray ORDER finishes (eligibility, not guessing)', async () => {
    for (const order of permutations<PieceKind>(['straight', 'drop', 'straight'])) {
      const run = await replayRun(BEDROOM01, placed(BEDROOM01, order));
      expect(run.status, order.join('>')).toBe('finished');
    }
  }, 90_000);
});

describe('bedroom02 — the plateau choice finishes on BOTH mounts (B2 redesign; ask #2b retired here)', () => {
  test('BOTH lines finish in the chained model, and the pillow line is faster', async () => {
    const par = await replayRun(BEDROOM02, BEDROOM02.parBuild());
    const step = await replayRun(BEDROOM02, bedroom02StepBuild());
    expect(par.status).toBe('finished');
    expect(step.status).toBe('finished');
    expect(par.time).toBeLessThan(step.time); // measured ~1.72 vs ~2.04
  }, 60_000);

  test('on the BUILDER mount BOTH lines finish — one deck plane, one anchored cup', async () => {
    const pillow = await replayRun(BEDROOM02, placed(BEDROOM02, ['straight', 'landing', 'straight', 'straight']));
    expect(pillow.status).toBe('finished');
    const step = await replayRun(BEDROOM02, placed(BEDROOM02, ['straight', 'straight', 'drop', 'straight']));
    expect(step.status).toBe('finished'); // the old ask #2b pin (soft line falls anchored) is RETIRED
    expect(pillow.time).toBeLessThan(step.time); // ~1.72 vs ~2.04 (the pass-2 sink shortened the step's run-out)
    const short = await replayRun(BEDROOM02, placed(BEDROOM02, ['straight', 'straight']));
    expect(short.status).not.toBe('finished'); // two plateau decks fly short of the crossing
  }, 90_000);

  test('no build of three pieces or fewer finishes (the crossing needs its piece)', async () => {
    const tried = new Set<string>();
    for (let ns = 0; ns <= 3; ns++)
      for (let nd = 0; nd <= 1; nd++)
        for (let nl = 0; nl <= 1; nl++) {
          if (ns + nd + nl > 3) continue;
          const items: string[] = [];
          items.push(...Array(ns).fill('straight'), ...Array(nd).fill('drop'), ...Array(nl).fill('landing'));
          for (const order of permutations(items)) {
            const key = order.join(',');
            if (tried.has(key)) continue;
            tried.add(key);
            const run = await replayRun(BEDROOM02, placed(BEDROOM02, order as PieceKind[]));
            expect(run.status, order.join('>')).not.toBe('finished');
          }
        }
  }, 180_000);

  test('the fail stream is separated: every death lands by 2.6 s, both routes finish (U wall, ask #2b)', async () => {
    const PINNED: [string, ('finished' | 'fell')][] = [
      // the pillow line's orders (multiset s,s,s,l) + the step line's (s,s,s,d)
      ['s,l,s,s', 'finished'],
      ['l,s,s,s', 'finished'],
      ['s,s,l,s', 'finished'],
      ['s,s,s,l', 'finished'],
      ['s,d,s,s', 'finished'],
      ['s,s,d,s', 'finished'],
      // whole-tray orders: the step+pillow chain finishes one way…
      ['d,s,s,s,l', 'finished'],
      ['l,s,s,s,d', 'finished'],
      // …and Playtest U's class (drop+landing mixed into the straights) dies
      // EARLY and visibly, never the old invisible ~3 s past the cup:
      ['d,l,s,s', 'fell'],
      ['l,s,s,d', 'fell'],
      ['s,l,s,d', 'fell'],
      ['s,s,l,d', 'fell'],
      ['d,s,s,l', 'fell'],
      ['l,d,s,s', 'fell'],
      ['s,d,l,s', 'fell'],
      ['s,s,d,l', 'fell'],
      ['s,d,l', 'fell'],
      ['s,s,s', 'fell'],
      ['s,s,d', 'fell'],
      ['s,s,l', 'fell'],
    ];
    const KIND = { s: 'straight', d: 'drop', l: 'landing' } as const;
    for (const [line, status] of PINNED) {
      const run = await replayRun(BEDROOM02, placed(BEDROOM02, line.split(',').map((c) => KIND[c as keyof typeof KIND])));
      expect(run.status, line).toBe(status);
      expect(run.time, `death clock on ${line}`).toBeLessThanOrEqual(2.6);
    }
  }, 180_000);

  test("AA's builds die at DISTINCT sites on DISTINCT clocks (pass-2 fail-timing law)", async () => {
    // Playtest AA (stage 5) rebuilt this rung six ways and saw ONE death —
    // "always ~a hand's width from the glowing papers". The pass-2 sink
    // (32°) re-houses the start-sink family at the START end; the deck-only
    // family keeps its structural hand's-width site but now owns the
    // LATEST death clock alone; the almost-right family dies UNDER AND
    // PAST the mug, nowhere near the other clocks. Sites are the last
    // recorded car x; the cup is the par build's capture centre.
    const par = BEDROOM02.parBuild();
    const cup = par.pieces.find((p) => p.def === 'finishCup')!;
    const cv = PIECES.finishCup.captureVolume!(cup.params);
    const e = cup.transform.elements;
    const cupX = cv.center.x * e[0]! + cv.center.y * e[4]! + e[12]!;
    const rows: [string, PieceKind[], 'start' | 'early' | 'past' | 'late'][] = [
      ['sink at the start', ['landing'], 'start'],
      ['sink + run-out', ['landing', 'straight'], 'early'],
      ['three flats, no crossing', ['straight', 'straight', 'straight'], 'late'],
      ['pillow line, one deck short', ['straight', 'landing', 'straight'], 'past'],
    ];
    const clocks: number[] = [];
    for (const [label, kinds, site] of rows) {
      const run = await replayRun(BEDROOM02, placed(BEDROOM02, kinds), { record: true });
      expect(run.status, label).toBe('fell');
      expect(run.time, label).toBeLessThanOrEqual(2.6);
      const last = run.trace![run.trace!.length - 1]!;
      clocks.push(run.time);
      if (site === 'start') {
        // the start-sink family LEFT the cup cluster: dies ≥ 0.55 m SHORT
        // of the mug (measured 0.79) and under 1.45 s
        expect(last.pos[0], label).toBeLessThanOrEqual(cupX - 0.55);
        expect(run.time, label).toBeLessThanOrEqual(1.45);
      }
      if (site === 'early') {
        expect(run.time, label).toBeLessThanOrEqual(1.75);
      }
      if (site === 'late') {
        // the deck-only family is the LATEST clock on the level — its
        // hand's-width site is structural (three tray decks chain to
        // within sink dx of the par chain end at EVERY angle that keeps
        // the step line finishing — swept −12…−28), so it is separated by
        // the clock, not the site, and the note tail names the two
        // crossing pieces the tray still holds
        expect(run.time, label).toBeGreaterThanOrEqual(1.95);
      }
      if (site === 'past') {
        // the almost-right family rolls a deck BELOW the mug plane and
        // dies past it — the cup in frame overhead, never "a hand away"
        expect(last.pos[0], label).toBeGreaterThanOrEqual(cupX);
      }
    }
    expect(Math.max(...clocks) - Math.min(...clocks)).toBeGreaterThanOrEqual(0.5);
  }, 120_000);
});

describe('bedroom03 — the catch trade-off is measured', () => {
  test('both catches cross the one launch; the HARD (drop) catch is faster', async () => {
    const par = await replayRun(BEDROOM03, BEDROOM03.parBuild());
    const soft = await replayRun(BEDROOM03, bedroom03SoftBuild());
    expect(par.status).toBe('finished');
    expect(soft.status).toBe('finished');
    expect(par.time).toBeLessThan(soft.time); // measured 2.667 vs 2.708
  }, 60_000);

  test('the whole tray finishes on the builder mount in any order tried, and beats the par clock', async () => {
    const lipFirst = await replayRun(BEDROOM03, placed(BEDROOM03, ['straight', 'gapLip', 'drop', 'landing', 'straight']));
    const dropFirst = await replayRun(BEDROOM03, placed(BEDROOM03, ['straight', 'drop', 'straight', 'gapLip', 'landing']));
    expect(lipFirst.status).toBe('finished');
    expect(dropFirst.status).toBe('finished');
    const par = await replayRun(BEDROOM03, BEDROOM03.parBuild());
    expect(Math.min(lipFirst.time, dropFirst.time)).toBeLessThan(par.time); // 2.483 vs 2.667
  }, 90_000);

  test('the soft four-piece fit does NOT reach the anchored cup (chained-model claim only — ask #2b)', async () => {
    const run = await replayRun(BEDROOM03, placed(BEDROOM03, ['straight', 'gapLip', 'landing', 'straight']));
    expect(run.status).not.toBe('finished');
  }, 30_000);
});

describe('bedroom04 — the whole tray is the answer (Playtest-G lesson, capstone)', () => {
  test('ALL 24 orders of the four tray pieces finish (builder-anchored mount)', async () => {
    const orders = permutations<PieceKind>(['straight', 'gapLip', 'drop', 'landing']);
    expect(orders).toHaveLength(24);
    for (const order of orders) {
      const run = await replayRun(BEDROOM04, placed(BEDROOM04, order));
      expect(run.status, `order ${order.join('>')}`).toBe('finished');
    }
  }, 180_000);

  test('the par ORDER is beatable within the tray', async () => {
    const par = await replayRun(BEDROOM04, BEDROOM04.parBuild());
    const beat = await replayRun(BEDROOM04, placed(BEDROOM04, ['drop', 'landing', 'straight', 'gapLip']));
    expect(par.status).toBe('finished');
    expect(beat.status).toBe('finished');
    expect(beat.time).toBeLessThan(par.time); // measured 2.467 vs 2.683
  }, 60_000);
});

describe('bedroom05 — the ENCORE: the double crossing, every omission fatal, the booster a choice', () => {
  // The encore's promise law, strongest in the house: the rung pins its
  // dip on the porch THRESHOLD's long lead (span 0.3566 m > the ~0.31 m a
  // roll-off can fly at this release — a stated rung-local deviation like
  // `PORCH_STEP`), so no half-line exists. The room ships no live zones
  // and neither does the encore (the bedroom's law).
  const spec = (kinds: string[]): PieceKind[] =>
    kinds.map((k) => ({ dr: 'drop', st: 'straight', la: 'landing', bo: 'booster' }[k]! as PieceKind));

  test('EVERY omission falls — the encore’s promise law, 11 builds sampled', async () => {
    for (const kinds of [
      ['dr'], ['st'], ['la'],
      ['dr', 'st'], ['st', 'dr'], ['dr', 'la'], ['st', 'la'],
      ['dr', 'st', 'dr'], ['dr', 'st', 'la'], ['st', 'dr', 'la'], ['dr', 'la', 'st'],
    ]) {
      const run = await replayRun(BEDROOM05, placed(BEDROOM05, spec(kinds)));
      expect(run.status, kinds.join('>')).not.toBe('finished');
    }
  }, 180_000);

  test('the ORDER is the line: deck-first never catches dip two; the par order is beatable within the tray', async () => {
    const deckFirst = await replayRun(BEDROOM05, placed(BEDROOM05, spec(['st', 'dr', 'dr', 'la'])));
    expect(deckFirst.status).not.toBe('finished'); // measured fall at 2.808 — the plank first strands the second sink
    const beat = await replayRun(BEDROOM05, placed(BEDROOM05, spec(['dr', 'la', 'dr', 'st'])));
    const par = await replayRun(BEDROOM05, BEDROOM05.parBuild());
    expect(beat.status).toBe('finished');
    expect(beat.time).toBeLessThan(par.time); // measured 2.783 vs 3.017 — kitchen04's law holds here too
  }, 90_000);

  test('the spare straight is a decoy: TAIL-placed it finishes at the par’s OWN hash, mid-line it kills the run, after the catcher it drags', async () => {
    const par = await replayRun(BEDROOM05, BEDROOM05.parBuild());
    const tail = await replayRun(BEDROOM05, placed(BEDROOM05, spec(['dr', 'st', 'dr', 'la', 'st'])));
    expect(tail.status).toBe('finished');
    expect(tail.hash).toBe(par.hash); // the extra deck stands past the cup: a piece bought, nothing earned
    const mid = await replayRun(BEDROOM05, placed(BEDROOM05, spec(['dr', 'st', 'st', 'dr', 'la'])));
    expect(mid.status).not.toBe('finished'); // deck-first again, in disguise: dip two goes uncrossed
    const runout = await replayRun(BEDROOM05, placed(BEDROOM05, spec(['dr', 'st', 'dr', 'st', 'la'])));
    expect(runout.status).toBe('finished');
    expect(runout.time).toBeGreaterThan(par.time + 0.3); // measured 3.408 — the extra plank before the catch drags
  }, 120_000);

  test('the booster is a CHOICE both ways: spent EARLY it buys dip two whole (exported hidden line); spent LAST it is trim at the par’s hash', async () => {
    const par = await replayRun(BEDROOM05, BEDROOM05.parBuild());
    expect((await replayRun(BEDROOM05, bedroom05BoosterBuild())).status).toBe('finished'); // chained export
    const early = await replayRun(BEDROOM05, placed(BEDROOM05, spec(['bo', 'dr', 'st', 'la'])));
    expect(early.status).toBe('finished');
    expect(early.time).toBeLessThan(par.time); // measured 2.442 — the room's hidden 3★, porch03's bounce law
    const last = await replayRun(BEDROOM05, placed(BEDROOM05, spec(['dr', 'st', 'dr', 'la', 'bo'])));
    expect(last.status).toBe('finished');
    expect(last.hash).toBe(par.hash); // measured: the par's own clock and hash — one piece wasted
    const full = await replayRun(BEDROOM05, placed(BEDROOM05, spec(['bo', 'dr', 'st', 'dr', 'la'])));
    expect(full.status).toBe('finished');
    expect(full.time).toBeLessThan(par.time); // measured 2.425 — kitchen05's rule: spend EARLY
    expect(full.time).toBeCloseTo(early.time, 1); // the pop across dip two buys the same clock as the pop skipping it
  }, 150_000);

  test('the whole tray is a CHOICE tray: the tail order finishes poor, the booster-first six-piece order falls', async () => {
    const tail = await replayRun(BEDROOM05, placed(BEDROOM05, spec(['dr', 'st', 'dr', 'la', 'st', 'bo'])));
    expect(tail.status).toBe('finished'); // 6 placed, the par's clock: the 2★ consolation — Playtest-G's wall, priced not walled
    const front = await replayRun(BEDROOM05, placed(BEDROOM05, spec(['bo', 'dr', 'st', 'st', 'dr', 'la'])));
    expect(front.status).not.toBe('finished'); // the early pop overruns the extra plank — the tray punishes gluttony
  }, 90_000);

  test('the encore ships no live zone — the bedroom’s law, kept by the fifth rung', () => {
    expect((BEDROOM05 as { hazards?: unknown[] }).hazards ?? []).toHaveLength(0);
  });
});

describe('bedroom set wiring — the placement table is derived, not folklore', () => {
  const LINES_BY_LEVEL: Record<string, Build[]> = {
    bedroom01: [BEDROOM01.parBuild()],
    bedroom02: [BEDROOM02.parBuild(), bedroom02StepBuild()],
    bedroom03: [BEDROOM03.parBuild(), bedroom03SoftBuild()],
    bedroom04: [BEDROOM04.parBuild()],
    bedroom05: [BEDROOM05.parBuild(), bedroom05BoosterBuild()],
  };

  for (const level of LADDER) {
    test(`${level.id} centres the floor disc on the run (x = rail midpoint), 5 mm under the LOWEST deck, 0.15 back`, () => {
      const p = bedroomSetPlacement(level.id)!;
      expect(p.yaw).toBe(0);
      expect(p.position[2]).toBe(-0.15);
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

  test('no bedroom prop solid starts inside the run corridor (lane = z±5 cm, x 0..1.2)', () => {
    // analytic AABBs at the shipped dz — the homework is the one detail
    // within reach; the notebook yaw 0.3 puts its near edge 14.6 cm off-axis
    // (the x-centring of the disc moves the props ALONG the lane, never
    // across the corridor, so the z arithmetic is mount-x independent).
    const dz = -0.15;
    const nb = HOMEWORK.notebook;
    const nearZ = nb.position[2] + (0.06 * Math.abs(Math.sin(nb.yaw)) + 0.075 * Math.abs(Math.cos(nb.yaw))) + dz;
    expect(nearZ).toBeLessThan(-0.10); // 10 cm clear of the lane edge
  });

  test('every par rail point stays on the floor disc at the mounted position', () => {
    for (const level of LADDER) {
      const p = bedroomSetPlacement(level.id)!;
      const rig = new KitRig(level.parBuild(), 1);
      const samples: number[] = [...rig.starts, rig.length - 1e-6];
      for (const s of samples) {
        const f = rig.frameAt(s);
        // the set floor is mounted at (position.x, position.z); the chain is
        // the level's own world metres, so the rail must live inside the
        // FLOOR disc translated to the mount.
        expect(
          Math.hypot(f.pos.x - p.position[0], f.pos.z - p.position[2]),
          `${level.id} at s=${s.toFixed(2)}`,
        ).toBeLessThan(1.4);
      }
    }
  }, 60_000);
});

describe('Bedroom sandbox — the no-budget room (mirrors kitchen-sandbox, stage 6)', () => {
  test('the sandbox has no budget and everything unlocked', () => {
    expect(BEDROOM_SANDBOX.sandbox).toBe(true);
    expect(BEDROOM_SANDBOX.budget).toBeGreaterThanOrEqual(999);
    for (const kind of PIECE_KINDS) expect(BEDROOM_SANDBOX.tray[kind], kind).toBe(99);
  });

  test('the sandbox is NOT a campaign rung: off the ladder, nobody\'s next, `?level=`-addressable like the kitchen one', () => {
    expect(campaignIndex('bedroom-sandbox')).toBe(-1);
    expect(nextInCampaign('bedroom-sandbox')).toBeNull();
  });

  test('the sandbox lap finishes (headless)', async () => {
    const result = await replayRun(BEDROOM_SANDBOX, BEDROOM_SANDBOX.parBuild());
    expect(result.status).toBe('finished');
  }, 30_000);

  test("the tray's own seating reproduces the sandbox lap byte-for-byte", () => {
    expect(serialize(trayParityBuild(BEDROOM_SANDBOX))).toBe(serialize(BEDROOM_SANDBOX.parBuild()));
  });

  test("pars.json's par piece count is the sandbox's tray basis", () => {
    expect(PARS[BEDROOM_SANDBOX.id]?.pieces).toBe(BEDROOM_SANDBOX.par.pieces);
  });

  test('the sandbox set mount follows the rung rule (centred on the lap, deck-cleared)', () => {
    const p = bedroomSetPlacement('bedroom-sandbox')!;
    expect(p.yaw).toBe(0);
    expect(p.position[2]).toBe(-0.15);
    const rig = new KitRig(BEDROOM_SANDBOX.parBuild(), 1);
    let mn = Infinity;
    let mx = -Infinity;
    for (let s = 0; s <= rig.length; s += 0.005) {
      mn = Math.min(mn, rig.frameAt(s).pos.x);
      mx = Math.max(mx, rig.frameAt(s).pos.x);
    }
    expect(Math.abs(p.position[0] - (mn + mx) / 2)).toBeLessThan(0.002);
    expect(p.position[1]).toBeCloseTo(finishDeckY(BEDROOM_SANDBOX.parBuild()) - 0.005, 5);
  });
});
