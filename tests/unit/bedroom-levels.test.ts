/**
 * Bedroom ladder playability proof (stage 4, Level Designer's gate) — the
 * kitchen ladder test's twin, plus the stage-4 extension of the
 * `tray ⊇ parBuild` invariant to EVERY authored level of BOTH ladders
 * (the kitchen rungs and the bedroom rungs ride one rule).
 *
 * Same seams as the kitchen gate: every parBuild finishes headless through
 * `replayRun`; the level contracts hold (budget = tray, one geometry per
 * kind, `trayParityBuild` byte-identical to `parBuild`, pars.json on the
 * tray basis); the choices and the trade-off are real (bedroom02's plateau
 * line beats its soft line, bedroom03's hard catch beats its soft catch,
 * bedroom04's whole tray finishes in all 24 orders and the par order is
 * beatable, bedroom01's three-piece fit is the ONLY builder-mountable fit).
 *
 * The chained-vs-anchored honesty note the kitchen era established
 * (Concepts/Levels §The same data replayed the way the BUILDER mounts it)
 * applies to bedroom02's soft line: it finishes in the chained model the
 * card quotes and does NOT reach the anchored cup (ask #2b) — asserted
 * below so the claim can never silently become prose about the wrong model.
 */
import { describe, expect, test } from 'vitest';
import { BEDROOM01 } from '../../src/world/levels/bedroom01.level.ts';
import { BEDROOM02, bedroom02SoftBuild } from '../../src/world/levels/bedroom02.level.ts';
import { BEDROOM03, bedroom03SoftBuild } from '../../src/world/levels/bedroom03.level.ts';
import { BEDROOM04 } from '../../src/world/levels/bedroom04.level.ts';
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
import { GARDEN01 } from '../../src/world/levels/garden01.level.ts';
import { GARDEN02, garden02BoreBuild } from '../../src/world/levels/garden02.level.ts';
import { GARDEN03, garden03SprinklerBuild } from '../../src/world/levels/garden03.level.ts';
import { GARDEN04 } from '../../src/world/levels/garden04.level.ts';
import { GARAGE01 } from '../../src/world/levels/garage01.level.ts';
import { GARAGE02, garage02FloorBuild } from '../../src/world/levels/garage02.level.ts';
import { GARAGE03, garage03OilLaneBuild } from '../../src/world/levels/garage03.level.ts';
import { GARAGE04 } from '../../src/world/levels/garage04.level.ts';
import { levelTrayParams, trayParityBuild } from '../../src/boot.ts';
import { PARS } from '../../src/world/stars.ts';
import { PIECES, type PieceKind } from '../../src/track/pieces.ts';
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

const LADDER: readonly Rung[] = [BEDROOM01, BEDROOM02, BEDROOM03, BEDROOM04];
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

describe('ladders (kitchen + bedroom + bathroom + garden + garage) — tray ⊇ parBuild on EVERY authored level', () => {
  /** Every line ALL FIVE ladders author, in the level files' own data. */
  const BATHROOM_LADDER: readonly Rung[] = [BATHROOM01, BATHROOM02, BATHROOM03, BATHROOM04];
  const GARDEN_LADDER: readonly Rung[] = [GARDEN01, GARDEN02, GARDEN03, GARDEN04];
  const GARAGE_LADDER: readonly Rung[] = [GARAGE01, GARAGE02, GARAGE03, GARAGE04];
  const LINES: readonly { level: Rung; label: string; build: Build }[] = [
    ...[...KITCHEN_LADDER, ...LADDER, ...BATHROOM_LADDER, ...GARDEN_LADDER, ...GARAGE_LADDER].map((level) => ({
      level,
      label: 'par build',
      build: level.parBuild(),
    })),
    { level: KITCHEN02, label: 'arc line', build: kitchen02ArcBuild() },
    { level: BEDROOM02, label: 'soft line', build: bedroom02SoftBuild() },
    { level: BEDROOM03, label: 'soft catch line', build: bedroom03SoftBuild() },
    { level: BATHROOM02, label: 'drain line', build: bathroom02DrainBuild() },
    { level: BATHROOM03, label: 'splash line', build: bathroom03SplashBuild() },
    { level: GARDEN02, label: 'bore line', build: garden02BoreBuild() },
    { level: GARDEN03, label: 'wet shortcut', build: garden03SprinklerBuild() },
    { level: GARAGE02, label: 'floor line', build: garage02FloorBuild() },
    { level: GARAGE03, label: 'oil lane', build: garage03OilLaneBuild() },
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

describe('bedroom02 — the plateau choice is real (and honest about mounting)', () => {
  test('BOTH lines finish in the chained model, and the high line is faster', async () => {
    const par = await replayRun(BEDROOM02, BEDROOM02.parBuild());
    const soft = await replayRun(BEDROOM02, bedroom02SoftBuild());
    expect(par.status).toBe('finished');
    expect(soft.status).toBe('finished');
    expect(par.time).toBeLessThan(soft.time); // measured 2.367 vs 2.575
  }, 60_000);

  test('on the BUILDER mount the plateau line finishes and the soft line does NOT reach the anchored cup (ask #2b)', async () => {
    const high = await replayRun(BEDROOM02, placed(BEDROOM02, ['straight', 'straight', 'straight']));
    expect(high.status).toBe('finished');
    const softAnchored = await replayRun(BEDROOM02, placed(BEDROOM02, ['straight', 'drop', 'landing', 'straight']));
    expect(softAnchored.status).not.toBe('finished'); // the card states this as the anchored truth
    const short = await replayRun(BEDROOM02, placed(BEDROOM02, ['straight', 'straight']));
    expect(short.status).not.toBe('finished'); // two of the three plateau decks fall short
  }, 90_000);
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

describe('bedroom set wiring — the placement table is derived, not folklore', () => {
  const LINES_BY_LEVEL: Record<string, Build[]> = {
    bedroom01: [BEDROOM01.parBuild()],
    bedroom02: [BEDROOM02.parBuild(), bedroom02SoftBuild()],
    bedroom03: [BEDROOM03.parBuild(), bedroom03SoftBuild()],
    bedroom04: [BEDROOM04.parBuild()],
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
