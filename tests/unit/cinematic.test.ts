/**
 * The cinematic record (stage 5): the shot-sequence trace is the SIM's own
 * record, not a second simulation. The proofs here are the unit half of the
 * "no interpolation cheating" claim —
 *
 *   1. `stepAndRecord` over the REAL feel track stores, step for step, the
 *      identical car transforms `replayRun({record:true})` produces (the
 *      Node determinism harness's own list) — exact doubles, zero difference;
 *      recording twice is bit-identical.
 *   2. The event beats and the shot plan are functions of that record:
 *      launch and the terminal beat always exist; the plan is always at
 *      least three contiguous shots tiling [0, duration].
 *   3. `ReplayDirector.poseAt` is a pure function of sim time: inside the
 *      follow shot (away from a blend window) the pose IS the recorded
 *      follow state of `floor(t/dt)`, and equal times give equal poses.
 */
import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts';
import { World } from '../../src/world/world.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { ReplayDirector, deriveEvents, planShots, stepAndRecord, TapeRecorder } from '../../src/replay/cinematic.ts';

describe('cinematic replay record', () => {
  test('the recorded trace equals the node replay trace exactly, step for step', async () => {
    const build = FEELTRACK.placeholderBuild();
    const node = await replayRun(FEELTRACK, build, { record: true });
    const world = await World.create(FEELTRACK, build, { visuals: false });
    const trace = stepAndRecord(world, build);
    world.dispose();
    expect(trace.steps).toBe(node.steps);
    expect(trace.hash).toBe(node.hash);
    expect(node.trace).toBeDefined();
    let maxDiff = 0;
    for (let i = 0; i < node.trace!.length; i++) {
      const s = node.trace![i]!;
      maxDiff = Math.max(
        maxDiff,
        Math.abs(trace.pos[i * 3]! - s.pos[0]!),
        Math.abs(trace.pos[i * 3 + 1]! - s.pos[1]!),
        Math.abs(trace.pos[i * 3 + 2]! - s.pos[2]!),
        Math.abs(trace.quat[i * 4]! - s.quat[0]!),
        Math.abs(trace.quat[i * 4 + 3]! - s.quat[3]!),
      );
    }
    // EXACT: both sides read `World.state()` after the same step sequence
    expect(maxDiff).toBe(0);
  });

  test('recording twice is bit-identical, and events come from the record', async () => {
    const build = FEELTRACK.placeholderBuild();
    const wa = await World.create(FEELTRACK, build, { visuals: false });
    const ta = stepAndRecord(wa, build);
    wa.dispose();
    const wb = await World.create(FEELTRACK, build, { visuals: false });
    const tb = stepAndRecord(wb, build);
    wb.dispose();
    expect(Array.from(ta.pos)).toEqual(Array.from(tb.pos));
    expect(Array.from(ta.followPos)).toEqual(Array.from(tb.followPos));
    expect(ta.events).toEqual(tb.events);
    // beats: launch at 0, terminal beat at the run end, terminal-labelled
    expect(ta.events[0]).toEqual({ t: 0, kind: 'launch', label: 'Launch' });
    const last = ta.events[ta.events.length - 1]!;
    expect(last.kind).toBe('finish');
    expect(last.t).toBe(ta.time);
    expect(['Finish', 'Fell off', 'Stalled', 'Timed out']).toContain(last.label);
    // events match the node stream through the same pure derivation
    const node = await replayRun(FEELTRACK, build, { record: true });
    expect(deriveEvents(node.trace!, node.status)).toEqual(ta.events);
  });

  test('the chunked wind IS the one-shot wind: same trace, and every slice boundary lands on the same state hash', async () => {
    // The share page pumps a `TapeRecorder` in rAF-sized slices (feel pass,
    // Playtest CC: no six-second silent block). Chunking may only ever be a
    // SCHEDULING decision — so the sliced record must equal the one-shot
    // record EXACTLY, and the hash at every slice boundary must equal the
    // one-shot sim's hash after the same number of steps.
    const build = FEELTRACK.placeholderBuild();
    const node = await replayRun(FEELTRACK, build, { record: true });
    // (1) one-shot reference trace
    const wa = await World.create(FEELTRACK, build, { visuals: false });
    const oneShot = stepAndRecord(wa, build);
    wa.dispose();
    // (2) the one-shot law's hash after EVERY step, twin world stepped 1-by-1
    const wc = await World.create(FEELTRACK, build, { visuals: false });
    const hashAfterStep: string[] = [];
    wc.launch();
    while (wc.status === 'running' && wc.stepCount < node.steps) {
      wc.step();
      hashAfterStep.push(wc.hashHex());
    }
    wc.dispose();
    expect(hashAfterStep.length).toBe(node.steps);
    // (3) the chunked wind: 7-step slices (deliberately not a divisor of
    // the run length, so the final short slice is exercised too)
    const wd = await World.create(FEELTRACK, build, { visuals: false });
    const rec = new TapeRecorder(wd, build);
    const boundaries: { steps: number; hash: string }[] = [];
    while (!rec.done) {
      rec.pump(7);
      boundaries.push({ steps: rec.totalSteps, hash: rec.hashHex });
      // the invariant HOLDS AT EVERY SLICE, not just at the end
      expect(rec.hashHex).toBe(hashAfterStep[rec.totalSteps - 1]!);
    }
    const trace = rec.finish();
    wd.dispose();
    expect(trace.steps).toBe(node.steps);
    expect(trace.hash).toBe(node.hash);
    expect(Array.from(trace.pos)).toEqual(Array.from(oneShot.pos));
    expect(Array.from(trace.quat)).toEqual(Array.from(oneShot.quat));
    expect(Array.from(trace.followPos)).toEqual(Array.from(oneShot.followPos));
    expect(trace.events).toEqual(oneShot.events);
    expect(trace.plan).toEqual(oneShot.plan);
    // the recorder's own slice ledger agrees with the manual boundaries
    expect(rec.sliceHashes.map((c) => c.steps)).toEqual(boundaries.map((c) => c.steps));
    expect(rec.sliceHashes.map((c) => c.hash)).toEqual(boundaries.map((c) => c.hash));
    const lastB = boundaries[boundaries.length - 1]!;
    expect(lastB.steps).toBe(node.steps);
    expect(lastB.hash).toBe(node.hash);
  });

  test('the plan is at least three contiguous shots tiling the replay', async () => {
    const plan = planShots(3.0, [
      { t: 0, kind: 'launch', label: 'Launch' },
      { t: 1.2, kind: 'bigAir', label: 'Big air' },
      { t: 3.0, kind: 'finish', label: 'Finish' },
    ]);
    expect(plan.shots.length).toBeGreaterThanOrEqual(3);
    expect(plan.shots[0]!.kind).toBe('wide');
    expect(plan.shots[plan.shots.length - 1]!.kind).toBe('finish');
    expect(plan.shots[0]!.start).toBe(0);
    expect(plan.shots[plan.shots.length - 1]!.end).toBeCloseTo(plan.duration, 10);
    for (let i = 1; i < plan.shots.length; i++) {
      expect(plan.shots[i]!.start).toBeCloseTo(plan.shots[i - 1]!.end, 10); // no gaps
    }
    expect(plan.cuts).toEqual([plan.shots[0]!.end, plan.shots[1]!.end]);
    // cuts sit on beats where the beats allow (the big air moves cut 1)
    expect(Math.abs(plan.shots[0]!.end - 1.2)).toBeLessThan(0.5);
    // a pathologically short run still gets three ordered shots
    const tiny = planShots(0.1, [{ t: 0, kind: 'launch', label: 'Launch' }]);
    expect(tiny.shots.length).toBe(3);
    for (const s of tiny.shots) expect(s.end).toBeGreaterThan(s.start);
  });

  test('the director pose is a pure function of sim time', async () => {
    const build = FEELTRACK.placeholderBuild();
    const world = await World.create(FEELTRACK, build, { visuals: false });
    const trace = stepAndRecord(world, build);
    world.dispose();
    const box = new THREE.Box3();
    for (let i = 0; i < trace.steps; i += 13) {
      box.expandByPoint(new THREE.Vector3(trace.pos[i * 3]!, trace.pos[i * 3 + 1]!, trace.pos[i * 3 + 2]!));
    }
    const a = new ReplayDirector({ trace, box, cup: null });
    const b = new ReplayDirector({ trace, box, cup: null });
    const follow = trace.plan.shots.find((s) => s.kind === 'follow')!;
    // well inside the follow shot, away from both blend windows
    const t = (follow.start + follow.end) / 2;
    a.poseAt(t);
    b.poseAt(t);
    expect(a.position.toArray()).toEqual(b.position.toArray());
    expect(a.quaternion.toArray()).toEqual(b.quaternion.toArray());
    const step = Math.floor(t / trace.dt);
    expect(a.position.toArray()).toEqual([
      trace.followPos[step * 3]!,
      trace.followPos[step * 3 + 1]!,
      trace.followPos[step * 3 + 2]!,
    ]);
    // same t twice = same pose (seeking cannot perturb the camera)
    a.poseAt(t);
    expect(a.position.toArray()).toEqual(b.position.toArray());
  });

  test('a nose-first fell (vertical final tangent, no cup) never parks the finish eye in the car', async () => {
    // playtest AA (stage 5) reproduced: a build with nothing under the
    // release falls straight down (status `fell`, 0.4 s) and the no-cup
    // finish fallback took its tangent from the last 24 samples — exactly
    // UP — where the pose's `tangent*-0.45d + UP*0.42d` terms cancel to
    // ~3 cm and the red chassis fills the frame (the "solid red" report).
    const build = { levelId: FEELTRACK.id, pieces: [], seed: 1 };
    const world = await World.create(FEELTRACK, build, { visuals: false });
    const trace = stepAndRecord(world, build);
    world.dispose();
    expect(trace.status).toBe('fell');
    const last = trace.steps - 1;
    const fellAt = new THREE.Vector3(trace.pos[last * 3]!, trace.pos[last * 3 + 1]!, trace.pos[last * 3 + 2]!);
    const d = new ReplayDirector({ trace, box: new THREE.Box3(), cup: null });
    const finish = trace.plan.shots.find((s) => s.kind === 'finish')!;
    for (const t of [finish.start + 0.1, (finish.start + finish.end) / 2, finish.end - 0.1]) {
      d.poseAt(t);
      const eyeGap = d.position.distanceTo(fellAt);
      // BEFORE the guard: 0.033 m (inside the chassis). The law's full
      // offset on this span is dFinish*|(-0.45, +0.42)| ≈ 0.68 m.
      expect(eyeGap, `finish eye inside the car at t=${t}`).toBeGreaterThan(0.4);
      expect(d.position.y).toBeGreaterThan(fellAt.y);
    }
    // purity preserved: the guard is constructor math, the pose stays a
    // function of sim time alone
    const e = new ReplayDirector({ trace, box: new THREE.Box3(), cup: null });
    d.poseAt(0.7);
    e.poseAt(0.7);
    expect(d.position.toArray()).toEqual(e.position.toArray());
  });
});
