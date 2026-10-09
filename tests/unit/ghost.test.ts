/**
 * The ghost rail (program T3.2) and the daily rung (T3.4), Node-side.
 *
 * The ghost law this pins: a ghost trace is the run, not a rendering of it —
 * `deriveGhostTrace` (a headless `TapeRecorder` wind) must produce the
 * EXACT per-step car list `replayRun({record:true})` produces, twice, and
 * it must never have touched a rendered world. Plus the reduced-motion
 * default (`ghostDefaultEnabled`), the pure `vsParLine` beat, and the
 * daily seed/record/streak arithmetic on a memory store.
 */
import { describe, expect, test } from 'vitest';
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';
import '../../src/world/levels/kitchen01.level.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { deriveGhostTrace, ghostDefaultEnabled, GhostRace } from '../../src/pages/ghost.ts';
import { vsParLine, type ResultModel } from '../../src/ui/result.ts';
import { SET_TOKENS } from '../../src/render/tokens.ts';
import {
  DAILY_KEY,
  dailyChipLine,
  dailySeed,
  readDaily,
  recordDailyBest,
  utcDateKey,
} from '../../src/save/daily.ts';
import { memoryStorage } from '../../src/save/save.ts';
import { canonicalBuild } from '../../src/track/snap.ts';

describe('ghost trace derivation (T3.2)', () => {
  test('the par trace equals the recorded replay step for step, and is stable', async () => {
    const build = FEELTRACK.placeholderBuild();
    const reference = await replayRun(FEELTRACK, build, { record: true });
    const first = await deriveGhostTrace(FEELTRACK, build);
    const second = await deriveGhostTrace(FEELTRACK, build);
    expect(first.steps).toBe(reference.trace!.length);
    expect(first.time).toBe(reference.time);
    for (const trace of [first, second]) {
      for (let i = 0; i < reference.trace!.length; i++) {
        expect(trace.pos[i * 3]).toBe(reference.trace![i]!.pos[0]);
        expect(trace.pos[i * 3 + 1]).toBe(reference.trace![i]!.pos[1]);
        expect(trace.pos[i * 3 + 2]).toBe(reference.trace![i]!.pos[2]);
        expect(trace.quat[i * 4]).toBe(reference.trace![i]!.quat[0]);
      }
    }
  });

  test('a fixture-carrying campaign par build winds too (kitchen01)', async () => {
    const build = KITCHEN01.parBuild!();
    const reference = await replayRun(KITCHEN01, build, { record: true });
    const trace = await deriveGhostTrace(KITCHEN01, build);
    expect(reference.status).toBe('finished');
    expect(trace.steps).toBe(reference.trace!.length);
    expect(trace.steps).toBeGreaterThan(0);
  });

  test('a permuted piece order is the SAME ghost (the measured order law)', async () => {
    // The probe (`scripts/probe-piece-order.mjs`) measured 148/148 shipped
    // permutations hash-identical; this pins the mechanism here: canonical
    // order is by `seq`, array order is noise, so the trace is identical.
    const build = FEELTRACK.placeholderBuild();
    const permuted = { ...build, pieces: build.pieces.slice().reverse() };
    expect(canonicalBuild(permuted.pieces).map((p) => p.seq)).toEqual(
      canonicalBuild(build.pieces).map((p) => p.seq),
    );
    const a = await deriveGhostTrace(FEELTRACK, build);
    const b = await deriveGhostTrace(FEELTRACK, permuted);
    expect(Array.from(b.pos)).toEqual(Array.from(a.pos));
    expect(b.time).toBe(a.time);
  });

  test('a build that will not run rejects rather than returning a fake trace', async () => {
    const broken = {
      ...FEELTRACK.placeholderBuild(),
      pieces: [
        {
          def: 'not-a-piece' as never,
          params: {},
          transform: FEELTRACK.placeholderBuild().pieces[0]!.transform,
          seq: 0,
        },
      ],
    };
    await expect(deriveGhostTrace(FEELTRACK, broken)).rejects.toBeTruthy();
  });
});

describe('ghost presentation law (T3.2)', () => {
  test('reduced motion means OFF by default; motion means ON', () => {
    expect(ghostDefaultEnabled(true)).toBe(false);
    expect(ghostDefaultEnabled(false)).toBe(true);
  });

  test('the race rig is translucent and shadowless', () => {
    const race = new GhostRace(SET_TOKENS.kitchen);
    let meshes = 0;
    race.group.traverse((o) => {
      const mesh = o as import('three').Mesh;
      if (!mesh.isMesh) return;
      meshes++;
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        expect(m.transparent).toBe(true);
        expect(m.depthWrite).toBe(false);
        expect(mesh.castShadow).toBe(false);
      }
    });
    expect(meshes).toBeGreaterThan(4); // the real rig, not a stand-in box
    race.dispose();
  });

  test('sync clamps at the trace end; the car appears WITH the launch', async () => {
    const trace = await deriveGhostTrace(FEELTRACK, FEELTRACK.placeholderBuild());
    const race = new GhostRace(SET_TOKENS.kitchen);
    race.setTrace('par', trace);
    // on the grid it is not painted (one pose, two cars is a double-exposure)
    expect(race.state().pos).toBeNull();
    race.beginRace();
    race.sync(trace.time + 7); // long after the ghost finished
    const late = race.state();
    expect(late.finished).toBe(true);
    expect(late.pos).not.toBeNull();
    const endPos: [number, number, number] = [
      trace.pos[(trace.steps - 1) * 3]!,
      trace.pos[(trace.steps - 1) * 3 + 1]!,
      trace.pos[(trace.steps - 1) * 3 + 2]!,
    ];
    expect(late.pos).toEqual(endPos);
    race.park(); // the walked-home grid: back to unpainted
    expect(race.state().pos).toBeNull();
    race.beginRace();
    race.setEnabled(false);
    expect(race.state().pos).toBeNull();
    race.dispose();
  });
});

describe('the you-vs-par beat (T3.2)', () => {
  const model = (over: Partial<ResultModel>): ResultModel => ({
    stars: 3,
    time: 2.0,
    piecesUsed: 3,
    note: '',
    status: 'finished',
    par: { pieces: 3, time: 2.5 },
    bestStarsBefore: 0,
    ...over,
  });

  test('a finished run states both star numbers as deltas', () => {
    expect(vsParLine(model({}))).toBe('you vs par — time −0.50 s vs par · same pieces as par');
    expect(vsParLine(model({ time: 2.75, piecesUsed: 5 }))).toBe(
      'you vs par — time +0.25 s vs par · 2 more pieces than par',
    );
    expect(vsParLine(model({ piecesUsed: 2 }))).toBe(
      'you vs par — time −0.50 s vs par · 1 fewer piece than par',
    );
    expect(vsParLine(model({ time: 2.5 }))).toBe(
      'you vs par — time even with par · same pieces as par',
    );
  });

  test('a failure says nothing (the note owns that story)', () => {
    expect(vsParLine(model({ status: 'fell' }))).toBe('');
  });
});

describe('the daily rung (T3.4)', () => {
  test('seed = hash(UTC date): stable inside a day, different across days', () => {
    const day = new Date('2026-10-09T23:59:00Z');
    const sameDay = new Date('2026-10-09T00:01:00Z');
    const next = new Date('2026-10-10T00:01:00Z');
    expect(dailySeed(day)).toBe(dailySeed(sameDay));
    expect(dailySeed(next)).not.toBe(dailySeed(day));
    expect(Number.isInteger(dailySeed(day))).toBe(true);
  });

  test('best is the min; streak extends across consecutive UTC days and resets on a skip', () => {
    const store = memoryStorage();
    const d1 = new Date('2026-10-09T10:00:00Z');
    const d1b = new Date('2026-10-09T18:00:00Z');
    const d2 = new Date('2026-10-10T09:00:00Z');
    const d4 = new Date('2026-10-12T09:00:00Z');

    expect(recordDailyBest(4.0, d1, store)).toEqual({ date: '2026-10-09', best: 4.0, streak: 1 });
    expect(recordDailyBest(3.2, d1b, store)).toEqual({ date: '2026-10-09', best: 3.2, streak: 1 });
    expect(recordDailyBest(5.0, d1b, store)!.best).toBe(3.2); // worse runs do not move it
    expect(recordDailyBest(3.0, d2, store)).toEqual({ date: '2026-10-10', best: 3.0, streak: 2 });
    expect(recordDailyBest(2.5, d4, store)).toEqual({ date: '2026-10-12', best: 2.5, streak: 1 });
    expect(readDaily(store)).toEqual({ date: '2026-10-12', best: 2.5, streak: 1 });
  });

  test('garbage in the key is no record, never a crash', () => {
    const store = memoryStorage({ [DAILY_KEY]: '{{{' });
    expect(readDaily(store)).toBeNull();
    expect(recordDailyBest(3.0, new Date('2026-10-09T10:00:00Z'), store)?.streak).toBe(1);
  });

  test('the chip line carries the single-machine honesty clause either way', () => {
    const line = dailyChipLine({ date: '2026-10-09', best: 3.21, streak: 4 }, '2026-10-09');
    expect(line).toContain('best 3.21 s');
    expect(line).toContain('streak 4 days');
    expect(line).toContain('this device only');
    const stale = dailyChipLine({ date: '2026-10-08', best: 3.21, streak: 4 }, '2026-10-09');
    expect(stale).toContain('not yet today');
    expect(stale).toContain('this device only');
    expect(dailyChipLine({ date: '2026-10-09', best: 3.21, streak: 1 }, '2026-10-09')).toContain(
      'streak 1 day ',
    );
    expect(utcDateKey(new Date('2026-10-09T23:59:59Z'))).toBe('2026-10-09');
  });
});
