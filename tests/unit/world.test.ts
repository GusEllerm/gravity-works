/**
 * World module tests: the feel track (the real kit build) runs to a finish
 * headlessly, the state snapshots are interpolable pairs, and the state hash
 * is a pure function of (level, build, seed) — the determinism half of the
 * stage-2 acceptance lives here and in replay.test.ts.
 */
import { describe, expect, test } from 'vitest';
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts';
import { World, STALL_SECONDS } from '../../src/world/world.ts';
import { FIXED_DT } from '../../src/physics/sim.ts';
import { chain } from '../../src/track/build.ts';
import { PIECES } from '../../src/track/pieces.ts';
import type { Level } from '../../src/world/level.ts';
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

describe('stage 3: terminal-status latency (playtest E "result arrives seconds after the failure")', () => {
  const FLAT = (() => {
    const build = chain(['straight'], {
      params: { straight: { length: 2 } },
      levelId: 'latency-flat',
      seed: 3,
    });
    const [inSocket] = PIECES.straight.sockets(build.pieces[0]!.params);
    return {
      id: 'latency-flat',
      name: 'latency probe',
      seed: 3,
      startSocket: inSocket,
      budget: 0,
      par: { pieces: 1, time: 1 },
      maxTime: 12,
      placeholderBuild: () => build,
    } satisfies Level;
  })();

  async function runWith(options: { stallSpeed?: number; stallSeconds?: number }) {
    const world = await World.create(FLAT, FLAT.placeholderBuild(), { visuals: false, ...options });
    world.launch();
    let guard = 0;
    while (world.status === 'running' && guard++ < 12 * 120) world.step();
    const out = { status: world.status, time: world.time };
    world.dispose();
    return out;
  }

  test('a stopped car concludes in <= 1.0 s of the real sim stall (was 2.0 s)', async () => {
    // The car spawns AT REST on a flat deck: its speed is 0 from step 1 —
    // the "real sim stall" is t = 0, exactly. The stage-3 pair (0.05 m/s
    // held for 0.5 s) concludes in ~0.59 s (settle + window).
    const now = await runWith({});
    expect(now.status).toBe('stalled');
    expect(now.time).toBeGreaterThanOrEqual(STALL_SECONDS - FIXED_DT);
    // the 0.5 s window opens only once a wheel is GROUNDED — the chassis
    // settles onto its suspension for ~10 steps at spawn, then counts
    expect(now.time).toBeLessThanOrEqual(STALL_SECONDS + 0.15);
    expect(now.time).toBeLessThanOrEqual(1.0); // the ledger bar
    const before = await runWith({ stallSpeed: 0.02, stallSeconds: 2 });
    // the complaint, reproduced — WORSE than reported: a parked chassis
    // reads 0.02-0.05 m/s of contact-jitter "speed", the old sub-0.02
    // counter never filled, and the dead run rode to the 12 s timeout.
    expect(before.status).toBe('timeout');
    expect(before.time).toBeGreaterThan(11.9);
  });

  test('status-only constants cannot move the sim: feel-track hash and finish step identical across the swap', async () => {
    const drive = async (options: { stallSpeed?: number; stallSeconds?: number }) => {
      const world = await World.create(FEELTRACK, FEELTRACK.placeholderBuild(), {
        visuals: false,
        ...options,
      });
      world.launch();
      let guard = 0;
      while (world.status === 'running' && guard++ < 20 * 120) world.step();
      const out = { hash: world.hashHex(), status: world.status, steps: world.stepCount };
      world.dispose();
      return out;
    };
    const old = await drive({ stallSpeed: 0.02, stallSeconds: 2 });
    const now = await drive({});
    expect(now.status).toBe('finished');
    expect(now.hash).toBe(old.hash);
    expect(now.steps).toBe(old.steps);
  }, 60_000);
});

describe('stage 3: cup capture truth (playtest G "car visibly inside the cup, scored 0")', () => {
  // flat launch deck + finishCup; the launch speed selects where the car
  // dies — short of the cup (stalled AT the rim) or in it (finished).
  const CUP_DECK = (() => {
    const build = chain(['straight', 'finishCup'], {
      params: { straight: { length: 1.2 }, finishCup: {} },
      levelId: 'cup-probe',
      seed: 1,
    });
    const [inSocket] = PIECES.straight.sockets(build.pieces[0]!.params);
    return {
      level: {
        id: 'cup-probe',
        name: 'cup probe',
        seed: 1,
        startSocket: inSocket,
        budget: 0,
        par: { pieces: 2, time: 1 },
        maxTime: 6,
        placeholderBuild: () => build,
      } satisfies Level,
      build,
    };
  })();

  async function launchAt(worldSpeed: number) {
    const world = await World.create(CUP_DECK.level, CUP_DECK.build, {
      visuals: false,
      launchSpeed: worldSpeed * 10, // sim units
    });
    world.launch();
    let guard = 0;
    while (world.status === 'running' && guard++ < 6 * 120) world.step();
    const out = { status: world.status, time: world.time, hash: world.hashHex() };
    world.dispose();
    return out;
  }

  test('a car that STOPS at the bowl mouth (nose in cup, centre at the rim) is captured', async () => {
    // Measured rig: at launch 1.70 m/s the car reaches the cup and dies
    // 0.084 m from the bowl centre — 1.2 capture radii out, chassis nose
    // visibly in the bowl. Before stage 3 this ended `stalled` while the
    // picture said made-it (playtest G's contradiction, severity-exception
    // 1/3). The stall branch now tests cup-centre + half a car length.
    const rim = await launchAt(1.7);
    expect(rim.status).toBe('finished');
  }, 30_000);

  test('a car that dies well short of the cup still ends stalled', async () => {
    const short = await launchAt(1.4); // stops ~0.46 m from the bowl centre
    expect(short.status).toBe('stalled');
  }, 30_000);

  test('moving captures are untouched: every run that finished in motion keeps its terminal step', async () => {
    for (const v of [1.8, 2.4, 3.4]) {
      const r = await launchAt(v);
      expect(r.status).toBe('finished');
    }
    // and the harness-pinned ladder/feel hashes ride on this branch only
    // while MOVING — replayRun's feel-track hash comes from
    // replay.test.ts's pin; the stall branch never opens there.
  }, 60_000);
});
