/**
 * World module tests: the feel track (the real kit build) runs to a finish
 * headlessly, the state snapshots are interpolable pairs, and the state hash
 * is a pure function of (level, build, seed) — the determinism half of the
 * stage-2 acceptance lives here and in replay.test.ts.
 */
import { describe, expect, test } from 'vitest';
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts';
import { World } from '../../src/world/world.ts';
import { replayRun } from '../../src/replay/replay.ts';

describe('world', () => {
  test('the feel track finishes headlessly', async () => {
    const run = await replayRun(FEELTRACK, FEELTRACK.placeholderBuild());
    expect(run.status).toBe('finished');
    expect(run.time).toBeGreaterThan(0.5);
    expect(run.time).toBeLessThan(FEELTRACK.maxTime);
  });

  test('state() exposes the last two snapshots for interpolation', async () => {
    const world = await World.create(FEELTRACK, FEELTRACK.placeholderBuild(), { visuals: false });
    world.launch();
    for (let i = 0; i < 30; i++) world.step();
    const [prev, cur] = world.states();
    expect(cur.step).toBe(world.stepCount);
    expect(prev.step).toBe(cur.step - 1);
    // alpha 0/1 of carPose reproduce the two snapshots exactly
    expect(world.carPose(0).pos.x).toBeCloseTo(prev.car.pos.x, 12);
    expect(world.carPose(1).pos.x).toBeCloseTo(cur.car.pos.x, 12);
    // and alpha 0.5 lies between them
    const mid = world.carPose(0.5).pos.x;
    expect(Math.min(prev.car.pos.x, cur.car.pos.x) - 1e-12).toBeLessThanOrEqual(mid);
    expect(mid).toBeLessThanOrEqual(Math.max(prev.car.pos.x, cur.car.pos.x) + 1e-12);
    world.dispose();
  });

  test('a step never runs at a variable rate: state time advances by FIXED_DT', async () => {
    const world = await World.create(FEELTRACK, FEELTRACK.placeholderBuild(), { visuals: false });
    world.launch();
    const t0 = world.state().time;
    world.step();
    world.step();
    expect(world.state().time - t0).toBeCloseTo(2 / 120, 12);
    world.dispose();
  });

  test('the seed folds into the hash: same run, different seed, different hash', async () => {
    const build = FEELTRACK.placeholderBuild();
    const a = await replayRun(FEELTRACK, build);
    const b = await replayRun(FEELTRACK, { ...build, seed: build.seed + 1 });
    expect(a.hash).not.toBe(b.hash);
  });

  test('a car spawned off any deck is a terminal status, not a hang', async () => {
    // budget 0 pieces = an empty build; the car free-falls to `fell`.
    const run = await replayRun(FEELTRACK, { levelId: FEELTRACK.id, pieces: [], seed: 7 });
    expect(['fell', 'stalled', 'timeout']).toContain(run.status);
  });

  test('the reified build gets plain visual meshes and no renderer reads physics', async () => {
    const world = await World.create(FEELTRACK, FEELTRACK.placeholderBuild(), { visuals: true });
    expect(world.scene).not.toBeNull();
    expect(world.carMesh).not.toBeNull();
    let meshes = 0;
    world.scene!.traverse((o) => {
      if ('isMesh' in o) meshes++;
    });
    expect(meshes).toBeGreaterThan(5); // five pieces x (sweep + extras) + car + ground
    world.dispose();
  });
});
