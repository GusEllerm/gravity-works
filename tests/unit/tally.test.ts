/**
 * THE TALLY unit gates (freeplay Lane B). Three claims, three blocks:
 *
 * 1. DETECTOR TRUTH TABLES — every badge fires on its approval and stays
 *    silent on its near-miss, derived from hand-built trace lists (pure,
 *    no physics).
 * 2. HASH NEUTRALITY — the feasibility note's measurement (§3: "a probe
 *    reading state() INLINE every step leaves the run hash untouched")
 *    promoted to a permanent gate: kitchen01's par build hashes to its
 *    ATLAS RECEIPT (`d32417dc`, tools/replay-all.mjs's claim) whether or
 *    not a tally tape is mounted on the step loop, and the event stream
 *    itself is identical across repeats. A change that makes the tally
 *    reach the sim turns this red.
 * 3. PERSONAL RECORDS — badge accumulation reports firsts exactly once
 *    and named lines beat only on a faster finish; the records ride the
 *    v2 envelope without a version bump.
 */
import { describe, expect, test } from 'vitest';
import { initRapier, FIXED_DT } from '../../src/physics/sim.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { World } from '../../src/world/world.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';
import {
  tallyFromTrace,
  tallyCounts,
  AIR_MIN_S,
  RUNOUT_MIN_M,
  FALL_MIN_S,
  SPEND_MIN_GAIN_MPS,
  type TallySample,
} from '../../src/tally/detectors.ts';
import { TallyTape } from '../../src/tally/tape.ts';
import { freshSave, memoryStorage, loadSave } from '../../src/save/save.ts';
import { accumulateBadges, recordNamedLine, readNamedLine, readRecords } from '../../src/save/records.ts';
import { serialize } from '../../src/track/build.ts';
import { tallyLines } from '../../src/ui/result.ts';

describe('THE TALLY SWEEP FIXTURES — sandbox scale (the sheet-fix, 2026-10-12)', () => {
  test('THE FILM-KEPT RUN MINTS: the garage "slick skip" jump-fly-land earns air AND clean catch', async () => {
    // The re-probe's decisive exhibit: a run that visibly JUMPS, FLIES,
    // LANDS and rolls into the player's cup printed `events: []` under the
    // campaign-scale thresholds. The fixture is the journal reconstruction
    // (`tools/tally-fixtures.mjs`); the claim is the sheet-fix law — what
    // the eyes see, the sheet must grant.
    const { namedLines } = await import('../../tools/tally-fixtures.ts');
    const { getLevel } = await import('../../src/world/levels/feeltrack.level.ts');
    const { lay } = await import('../../src/world/levels/kitchen01.level.ts');
    const fixture = namedLines().find(f => f.name === "garage-slick-skip")!;
    const level = getLevel(fixture.levelId);
    const run = await replayRun(level, lay(fixture.list, fixture.levelId, 1), { record: true });
    expect(run.status).toBe('finished');
    const counts = tallyCounts(tallyFromTrace(run.trace!));
    expect(counts.air ?? 0).toBeGreaterThanOrEqual(1);
    expect(counts.catch ?? 0).toBeGreaterThanOrEqual(1);
  });

  test('a sandbox gap hop is a JUMP FACT at every swept threshold between the seam and the flight', async () => {
    // the seam/flight separation the sweep measures: deck seams fly one
    // step (0.0083 s), sandbox gap flights fly ~0.108 s. A threshold in
    // the void between must grant on the flight and never on the seam.
    const { namedLines } = await import('../../tools/tally-fixtures.ts');
    const { getLevel } = await import('../../src/world/levels/feeltrack.level.ts');
    const { lay } = await import('../../src/world/levels/kitchen01.level.ts');
    const fixture = namedLines().find(f => f.name === "garage-slick-skip")!;
    const level = getLevel(fixture.levelId);
    const run = await replayRun(level, lay(fixture.list, fixture.levelId, 1), { record: true });
    for (const airMinS of [0.25, 0.05]) {
      const ev = tallyFromTrace(run.trace!, { thresholds: { airMinS } });
      for (const e of ev.filter(e => e.kind === 'air')) {
        expect(e.value).toBeGreaterThanOrEqual(0.1); // no seam-sized grant
      }
    }
  });
});

describe('tally tail (the result bar’s three lines)', () => {
  test('line 1 counts this run’s badges in sheet order; ×n repeats only', () => {
    const lines = tallyLines(
      [
        { kind: 'air' }, { kind: 'air' }, { kind: 'catch' }, { kind: 'spend' },
      ],
      [],
    );
    expect(lines).toEqual(['earned — air ×2 · clean catch · booster spend']);
  });
  test('line 2 speaks only for badges the device never saw; line 3 keeps the honesty sentence verbatim', () => {
    const lines = tallyLines([{ kind: 'chainFall' }], ['chainFall'], {
      name: 'the spillway',
      best: 2.108,
      fresh: false,
    });
    expect(lines).toEqual([
      'earned — chain fall',
      'first chain fall — earned',
      'on “the spillway” — personal best 2.11 s · your own runs on this device only',
    ]);
    expect(lines.join(' ')).toContain('your own runs on this device only');
  });
  test('an empty sheet prints no tail at all, and the tail never exceeds three lines', () => {
    expect(tallyLines([], [])).toEqual([]);
    expect(
      tallyLines(
        [
          { kind: 'air' }, { kind: 'catch' }, { kind: 'crossing' }, { kind: 'chainFall' }, { kind: 'spend' },
        ],
        ['air', 'catch', 'crossing', 'chainFall', 'spend'],
        { name: 'x', best: 1, fresh: true },
      ).length,
    ).toBe(3);
  });
});

/** Build a trace from a per-step generator (120 Hz). */
function traceOf(n: number, at: (i: number, t: number) => Omit<TallySample, 't'>): TallySample[] {
  const out: TallySample[] = [];
  for (let i = 0; i < n; i++) out.push({ t: (i + 1) * FIXED_DT, ...at(i, (i + 1) * FIXED_DT) });
  return out;
}

const flat = (x: number) => ({
  pos: [x, 0.041, 0] as [number, number, number],
  quat: [0, 0, 0, 1] as [number, number, number, number],
  speed: 1,
  grounded: true,
});

describe('tally detectors — truth tables', () => {
  test('air-time: > AIR_MIN_S of flight grants at touchdown, <= does not', () => {
    const air = (secs: number) => {
      const nAir = Math.round(secs / FIXED_DT);
      return traceOf(40 + nAir + 10, (i) => ({
        ...flat(i * 0.01),
        grounded: i < 40 || i >= 40 + nAir,
      }));
    };
    expect(tallyFromTrace(air(AIR_MIN_S + 0.05)).some((e) => e.kind === 'air')).toBe(true);
    expect(tallyFromTrace(air(AIR_MIN_S - 0.05)).some((e) => e.kind === 'air')).toBe(false);
  });

  test('clean catch: a flight + RUNOUT_MIN_M of held ground grants; a bounce-roll and a run-out that dies do not', () => {
    const flight = 0.2;
    const mk = (runout: number, hold: boolean) => {
      const nAir = Math.round(flight / FIXED_DT);
      const dxStep = 0.01;
      const nRun = Math.ceil(runout / dxStep);
      return traceOf(20 + nAir + nRun + 2, (i) => {
        const airborne = i >= 20 && i < 20 + nAir;
        const landed = i >= 20 + nAir;
        return {
          pos: [i * dxStep, airborne ? 0.2 : 0.041, 0] as [number, number, number],
          quat: [0, 0, 0, 1] as [number, number, number, number],
          speed: landed && !hold ? 0 : 1,
          grounded: !airborne,
        };
      });
    };
    // run-out held: the badge lands on the deck (>= RUNOUT_MIN_M of ground)
    const caught = tallyFromTrace(mk(RUNOUT_MIN_M + 0.05, true)).filter((e) => e.kind === 'catch');
    expect(caught.length).toBe(1);
    // bounce-roll: touch then immediate stop -> no catch
    expect(tallyFromTrace(mk(RUNOUT_MIN_M + 0.05, false)).some((e) => e.kind === 'catch')).toBe(false);
    // too little ground after the touchdown
    expect(tallyFromTrace(mk(RUNOUT_MIN_M - 0.08, true)).some((e) => e.kind === 'catch')).toBe(false);
    // a wobble (no flight of CATCH_MIN_AIR_S) is a weld, not a landing
    const noFlight = traceOf(200, (i) => ({
      ...flat(i * 0.01),
      grounded: !(i >= 30 && i < 40), // 10 steps = 0.083 s of hop
    }));
    expect(tallyFromTrace(noFlight).some((e) => e.kind === 'catch')).toBe(false);
  });

  test('room crossing: parcel change grants once; outside parcels and same-parcel never do', () => {
    const rooms = [
      { name: 'kitchen', minX: 0, maxX: 4, minZ: -2, maxZ: 2 },
      { name: 'bedroom', minX: 4, maxX: 8, minZ: -2, maxZ: 2 },
    ];
    const cross = traceOf(400, (i) => flat(i * 0.025)); // x 0..10: kitchen -> bedroom -> void
    const ev = tallyFromTrace(cross, { rooms }).filter((e) => e.kind === 'crossing');
    expect(ev.length).toBe(1);
    expect(ev[0]!.label).toBe('bedroom');
    // no rooms declared (a one-room campaign/sandbox level): nothing to cross
    expect(tallyFromTrace(cross).some((e) => e.kind === 'crossing')).toBe(false);
    // staying inside one parcel grants nothing
    const flat1 = traceOf(200, (i) => flat(i * 0.01));
    expect(tallyFromTrace(flat1, { rooms }).some((e) => e.kind === 'crossing')).toBe(false);
  });

  test('chain fall: a sustained AIRBORNE descent grants; a short drop and a rolling descent do not', () => {
    const mk = (fallSecs: number) => {
      const nFall = Math.max(2, Math.round(fallSecs / FIXED_DT));
      return traceOf(40 + nFall + 20, (i) => ({
        pos: [
          i * 0.01,
          i < 40 ? 0.041 : i < 40 + nFall ? 0.041 - (i - 39) * 0.004 : 0.041 - nFall * 0.004,
          0,
        ] as [number, number, number],
        quat: [0, 0, 0, 1] as [number, number, number, number],
        speed: 1,
        grounded: !(i >= 40 && i < 40 + nFall), // airborne WHILE descending — the fall
      }));
    };
    expect(tallyFromTrace(mk(FALL_MIN_S + 0.05)).some((e) => e.kind === 'chainFall')).toBe(true);
    expect(tallyFromTrace(mk(FALL_MIN_S - 0.08)).some((e) => e.kind === 'chainFall')).toBe(false);
    // A ROLLING descent is gravity's daily job, not an approval: wheels on
    // the deck, sustained down, grants nothing.
    const rolling = traceOf(120, (i) => ({
      ...flat(i * 0.01),
      pos: [i * 0.01, 0.041 - i * 0.004, 0] as [number, number, number],
    }));
    expect(tallyFromTrace(rolling).some((e) => e.kind === 'chainFall')).toBe(false);
    // a level fall (air, no drop) is air, not a fall
    const level = traceOf(80, (i) => ({ ...flat(i * 0.01), grounded: i >= 20 && i < 60 ? false : true }));
    expect(tallyFromTrace(level).some((e) => e.kind === 'chainFall')).toBe(false);
  });

  test('booster/spring spend: a one-step gain beyond the gravity floor grants; a downhill ramp does not', () => {
    const gain = 9.81 * FIXED_DT; // max gravity can add to |v| per step on a slope
    const spend = traceOf(40, (i) => ({
      ...flat(i * 0.01),
      speed: i < 20 ? 1 : 1 + SPEND_MIN_GAIN_MPS + 0.2,
    }));
    expect(tallyFromTrace(spend).some((e) => e.kind === 'spend')).toBe(true);
    const gravity = traceOf(40, (i) => ({ ...flat(i * 0.01), speed: 1 + i * gain }));
    expect(tallyFromTrace(gravity).some((e) => e.kind === 'spend')).toBe(false);
  });

  test('tallyCounts collapses events into per-kind counts', () => {
    expect(tallyCounts([{ kind: 'air', t: 1, value: 0.3 }, { kind: 'air', t: 2, value: 0.4 }, { kind: 'spend', t: 3, value: 1 }])).toEqual({ air: 2, spend: 1 });
  });
});

describe('tally hash neutrality (the feasibility §3 gate)', () => {
  test('kitchen01 par build: the hash with a tally tape mounted EQUALS the plain replay and the atlas receipt', async () => {
    await initRapier();
    const build = KITCHEN01.parBuild!();
    const plain = await replayRun(KITCHEN01, build);
    expect(plain.hash).toBe('d32417dc'); // the shipped atlas receipt (replay:all)

    // The SAME stepper `replayRun` uses, with the tally mounted INLINE —
    // the tape samples state() after every step and the sheet derives at
    // the terminal edge. Nothing here steps, owns, or writes a body.
    const runMounted = async () => {
      const world = await World.create(KITCHEN01, build, { visuals: false });
      const tape = new TallyTape();
      world.launch();
      while (world.status === 'running' && world.stepCount < 15 * 120) {
        world.step();
        tape.sample(world.state());
      }
      const hash = world.hashHex();
      const events = tallyFromTrace(tape.read());
      world.dispose();
      return { hash, events };
    };
    const a = await runMounted();
    const b = await runMounted();
    expect(a.hash).toBe(plain.hash); // the tally is a probe, not a participant
    expect(b.hash).toBe(plain.hash);
    // the event stream itself is deterministic across repeats
    expect(a.events).toEqual(b.events);
    // and the tape is the SAME list replayRun({record:true}) yields
    const recorded = await replayRun(KITCHEN01, build, { record: true });
    const world = await World.create(KITCHEN01, build, { visuals: false });
    const tape = new TallyTape();
    world.launch();
    while (world.status === 'running' && world.stepCount < 15 * 120) {
      world.step();
      tape.sample(world.state());
    }
    world.dispose();
    const derived = tallyFromTrace(tape.read());
    const fromNode = tallyFromTrace(recorded.trace!);
    expect(derived).toEqual(fromNode);
  });
});

describe('personal records (settings.records, schema-tolerant)', () => {
  test('badge accumulation reports a first exactly once and counts up', () => {
    const store = memoryStorage();
    expect(accumulateBadges({ air: 2, spend: 1 }, store)).toEqual(['air', 'spend']);
    expect(accumulateBadges({ air: 1 }, store)).toEqual([]);
    const rec = readRecords({ ...freshSave(), ...{ settings: { records: { badges: { air: 3, spend: 1 } } } } });
    expect(rec.badges).toEqual({ air: 3, spend: 1 });
    const onDisk = JSON.parse(store.getItem('gravity-works.save')!);
    expect(onDisk.v).toBe(2); // no version bump — the records ride the v2 envelope
    expect(onDisk.settings.records.badges).toEqual({ air: 3, spend: 1 });
  });

  test('named lines: mint, beat only on faster, keep the name', () => {
    const store = memoryStorage();
    const build = { levelId: 'kitchen-sandbox', seed: 1, pieces: [] };
    const key = 'kitchen-sandbox@1000,50,0';
    const mint = recordNamedLine(key, 'the spillway', 2.5, build, store);
    expect(mint.outcome).toBe('minted');
    const slow = recordNamedLine(key, 'renamed?', 2.6, build, store);
    expect(slow.outcome).toBe('held');
    expect(slow.line.name).toBe('the spillway');
    const fast = recordNamedLine(key, 'renamed?', 2.4, build, store);
    expect(fast.outcome).toBe('beat');
    expect(readNamedLine(key, store)!.best).toBe(2.4);
    expect(readNamedLine(key, store)!.build).toBe(serialize(build));
  });

  test('garbage under settings.records reads as absent, never crashes', () => {
    const store = memoryStorage({ 'gravity-works.save': JSON.stringify({ v: 2, builds: {}, settings: { records: { lines: { x: { name: 'a'.repeat(99), best: 1, build: 'zzz' } } } }, progress: { stars: {}, reached: {} } }) });
    expect(readRecords(loadSave(store)).lines).toEqual({});
  });
});
