/**
 * THE HOUSE ladder test (build 1 of "THE DOWNHILL greenlit").
 *
 * The referee claims, as executables:
 *
 * 1. THE CANON TABLE — the six deck altitudes re-derive from the live
 *    campaign y-statistics onto the ratified rows of the Decision Log
 *    (3.432 / 2.745 / 2.059 / 1.373 / 0.686 / 0.000), porch 0 = the floor
 *    of the world, garage mezzanine top = the launch.
 * 2. THE RECEIPT — the canonical downhill build replays twice headless
 *    with the SAME hash and step count: the run IS its own receipt (the
 *    input law rides the replayed data; nothing else moves the car).
 * 3. ROOMS COLLECTED — the parcel probe (read-only) approves the rooms
 *    the physics carried the car through, under the shipped capture law;
 *    an approval never ends the run (the only cup that ends it is the
 *    porch's, and the canonical line proves it by APPROVING its way past
 *    the kitchen and still running).
 * 4. THE INPUT LAW IS NOT OPTIONAL — gravity alone dies in the garage (the
 *    spike's wind-off probe, 1 room).
 * 5. APPEND-ONLY — the house is nobody's rung: the ladder, the rooms and
 *    the daily fold are untouched, and `replay:all` is the byte referee.
 */
import { describe, expect, test } from 'vitest';
import { HOUSE, HOUSE_ID } from '../../src/world/levels/house.level.ts';
import {
  DESCENT_ORDER,
  INTERNAL_DROP,
  KIT_DROP_H,
  approveParcels,
  deckAlts,
  deckStep,
  houseLayout,
  roomGraph,
} from '../../src/world/house-frame.ts';
import { CAMPAIGN_LADDER, dailyBoardId } from '../../src/world/campaign.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { serialize } from '../../src/track/build.ts';
import { CUP_CAPTURE_FACTOR } from '../../src/world/world.ts';
import { CAR } from '../../src/physics/car.ts';
import { SIM_SCALE } from '../../src/physics/sim.ts';
import { PARS } from '../../src/world/stars.ts';

const CANON_ALT = { garage: 3.432, kitchen: 2.745, bedroom: 2.059, bathroom: 1.373, garden: 0.686, porch: 0.0 } as const;

const probeOpts = {
  captureFactor: CUP_CAPTURE_FACTOR,
  stallReachExtra: CAR.halfL / SIM_SCALE,
  dt: 1 / 120,
};

describe('the house frame — canon table', () => {
  test('the six deck altitudes land on the ratified rows (±1 mm)', () => {
    const alts = deckAlts();
    for (const room of DESCENT_ORDER) {
      expect(Math.abs(alts[room] - CANON_ALT[room])).toBeLessThan(0.001);
    }
    // the step law: one internal campaign drop + one kit-default connector
    expect(deckStep(KIT_DROP_H)).toBeCloseTo(INTERNAL_DROP + 0.25, 6);
    expect(alts.garage - alts.kitchen).toBeCloseTo(alts.kitchen - alts.bedroom, 9);
  });

  test('the layout is pure and deterministic', () => {
    const a = houseLayout();
    const b = houseLayout();
    expect(a.decks.map((d) => d.x)).toEqual(b.decks.map((d) => d.x));
    expect(a.parcels.map((p) => p.center)).toEqual(b.parcels.map((p) => p.center));
    expect(a.decks.map((d) => d.room)).toEqual([...DESCENT_ORDER]);
    expect(a.parcels).toHaveLength(6);
    expect(a.legs).toHaveLength(5);
    // the shrunk slab: top at -0.75, ending 2 m past the frame (no 60 m cruise)
    expect(a.floor.center[1] + a.floor.half[1]).toBeCloseTo(-0.75, 9);
    const spanX = Math.max(...a.decks.map((d) => d.bounds.max[0])) - Math.min(...a.decks.map((d) => d.bounds.min[0]));
    expect(a.floor.half[0]).toBeCloseTo(spanX / 2 + 2, 9);
  });

  test('the room graph is the layout: 6 nodes, 5 edges (the camera law rides it)', () => {
    const g = roomGraph();
    expect(g.nodes).toHaveLength(6);
    expect(g.edges).toHaveLength(5);
    expect(g.edges.map((e) => e.to)).toEqual([...DESCENT_ORDER].slice(1));
  });
});

describe('the house level — append-only citizenship', () => {
  test('the house is nobody\u2019s rung: not on the ladder, not a room row', () => {
    expect(CAMPAIGN_LADDER).not.toContain(HOUSE_ID);
    expect(CAMPAIGN_LADDER).toHaveLength(30);
    expect(HOUSE_ID.startsWith('kitchen')).toBe(false);
    for (let s = 0; s < 61; s++) expect(CAMPAIGN_LADDER).toContain(dailyBoardId(s));
  });

  test('the par build is deterministic data, and the PORCH cup is the last capture volume', () => {
    const a = HOUSE.parBuild();
    const b = HOUSE.parBuild();
    expect(serialize(a)).toBe(serialize(b));
    expect(a.levelId).toBe(HOUSE_ID);
    expect(a.pieces[a.pieces.length - 1]!.def).toBe('finishCup'); // the outcome law reads the porch
    const cups = a.pieces.filter((p) => p.def === 'finishCup');
    expect(cups).toHaveLength(6); // six ratified decks, one cup each
  });

  test('the run ends honestly: parStatuses name completion; a timeout would be a bug', () => {
    expect(HOUSE.parStatuses).toEqual(['finished', 'stalled', 'fell']);
    expect(HOUSE.maxTime).toBeLessThanOrEqual(12);
  });
});

describe('THE RECEIPT — the canonical downhill run', () => {
  test('hashes stable TWICE headless, and rooms are physics-approved on the way down', async () => {
    const layout = houseLayout();
    const a = await replayRun(HOUSE, HOUSE.parBuild!(), { record: true });
    const b = await replayRun(HOUSE, HOUSE.parBuild!(), { record: true });
    expect(a.hash).toBe(b.hash);
    expect(a.steps).toBe(b.steps);
    expect(HOUSE.parStatuses).toContain(a.status);

    const approvals = approveParcels(layout.parcels, a.trace!, {
      ...probeOpts,
      stallTerminal: a.status === 'stalled',
    });
    // THE NUMBER's own row: the canonical frame physics-approves 4 rooms
    expect(approvals.length).toBeGreaterThanOrEqual(3);
    expect(approvals.map((p) => p.room)).toEqual(['garage', 'kitchen', 'bedroom', 'bathroom']);
    // an approval does NOT end the run: the kitchen is crossed and the car
    // keeps running — the outcome law knows only the porch cup
    const kitchen = approvals.find((p) => p.room === 'kitchen')!;
    expect(kitchen.step).toBeLessThan(a.steps);
    // the verdict is decided inside the descent, not in a tail
    for (const p of approvals) expect(p.time).toBeLessThan(6);

    // the shipped par line is the reference run's, honestly measured
    const par = PARS[HOUSE_ID]!;
    expect(par.pieces).toBe(HOUSE.parBuild!().pieces.length);
    expect(par.time).toBeGreaterThanOrEqual(a.time - 1e-9);
    expect(par.time).toBeLessThan(a.time + 0.05 + 1e-9);
  }, 60_000);

  test('THE INPUT LAW IS NOT OPTIONAL — gravity alone dies in the garage', async () => {
    const layout = houseLayout();
    const noWind = { ...HOUSE, inputs: {} };
    const r = await replayRun(noWind, HOUSE.parBuild!(), { record: true });
    const approvals = approveParcels(layout.parcels, r.trace!, {
      ...probeOpts,
      stallTerminal: r.status === 'stalled',
    });
    expect(approvals.length).toBeLessThanOrEqual(1);
  }, 60_000);
});
