/**
 * THE SEATING LAW (Decision Log 2026-10-12, the retry-law finding): every
 * launch seats the car in the IDENTICAL collider/world state. Before the fix
 * `World.reset()` removed-and-re-added the car bodies; Rapier re-registered
 * them with bumped handle generations, the solver iterated the contact graph
 * in a different order, and the same build ran 337 steps fresh vs 339 after
 * any Retry — byte-identically deterministic *within itself*, which made a
 * share link minted after a Retry fail its own replay.
 *
 * These are the two claims, red before the fix:
 *  1. SEATING EQUALITY — after a run + `reset()`, every body/collider handle
 *     (index AND generation, the raw f64 handle bits) and the car's spawn
 *     pose equal the fresh world's, for three different levels;
 *  2. RUN EQUALITY — the same World's second `launch()` replays the first
 *     launch step for step, hash to hash, and equals a fresh World's run and
 *     `replayRun` (what the share link verifies against).
 */
import { describe, expect, test } from 'vitest';
import { World } from '../../src/world/world.ts';
import { initRapier } from '../../src/physics/sim.ts';
import { replayRun } from '../../src/replay/replay.ts';
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';
import { getLevel } from '../../src/world/levels/feeltrack.level.ts';
import { KITCHEN_SANDBOX_ID } from '../../src/world/levels/kitchen05.level.ts';
import type { Level } from '../../src/world/level.ts';

const LEVELS: readonly { name: string; level: () => Level }[] = [
  { name: 'feeltrack', level: () => FEELTRACK },
  { name: 'kitchen01', level: () => KITCHEN01 },
  { name: 'kitchen-sandbox', level: () => getLevel(KITCHEN_SANDBOX_ID) },
];

/** Raw handle bits as a canonical string (index AND generation — the field
 *  the remove/re-add law bumped). */
function handleBits(h: number): string {
  const buf = new DataView(new ArrayBuffer(8));
  buf.setFloat64(0, h);
  return buf.getBigUint64(0, true).toString(16).padStart(16, '0');
}

interface Seating {
  bodies: string[];
  colliders: string[];
  car: { pos: number[]; quat: number[] };
}

function seating(world: World): Seating {
  const sim = world['sim'] as import('@dimforge/rapier3d-compat').World;
  const bodies: string[] = [];
  sim.bodies.forEach((b) => bodies.push(handleBits(b.handle)));
  const colliders: string[] = [];
  sim.colliders.forEach((c) => colliders.push(handleBits(c.handle)));
  const car = world.state().car;
  return { bodies, colliders, car: { pos: [car.pos.x, car.pos.y, car.pos.z], quat: [car.quat.w, car.quat.x, car.quat.y, car.quat.z] } };
}

function runAll(world: World, cap = 20000): { steps: number; hash: string; status: string } {
  world.launch();
  let steps = 0;
  while (world.status === 'running' && steps < cap) {
    world.step();
    steps++;
  }
  return { steps, hash: world.hashHex(), status: world.status };
}

describe('THE SEATING LAW: a retry seats the car exactly like the first launch', () => {
  test.beforeAll(async () => {
    await initRapier();
  });

  for (const { name, level: getLevelFn } of LEVELS) {
    test(`${name}: fresh vs post-reset seating — collider order (handle bits) and pose identical`, async () => {
      const level = getLevelFn();
      const build = level.parBuild ? level.parBuild() : level.placeholderBuild();
      const world = await World.create(level, build, { visuals: false });
      const fresh = seating(world);

      // run it to the end, then Retry (launch after a finished run resets)
      runAll(world);
      world.reset();
      const reseated = seating(world);

      expect(reseated.bodies).toEqual(fresh.bodies);
      expect(reseated.colliders).toEqual(fresh.colliders);
      expect(reseated.car.pos).toEqual(fresh.car.pos);
      expect(reseated.car.quat).toEqual(fresh.car.quat);
    });

    test(`${name}: the same build runs identically fresh, after a Retry, and under replayRun`, async () => {
      const level = getLevelFn();
      const build = level.parBuild ? level.parBuild() : level.placeholderBuild();

      const world = await World.create(level, build, { visuals: false });
      const fresh = runAll(world);
      const retry = runAll(world); // the Retry path: launch() -> reset() -> run
      const world2 = await World.create(level, build, { visuals: false });
      const again = runAll(world2);
      const replay = await replayRun(level, build, {});

      expect(fresh.status).toBe('finished');
      expect(retry).toEqual(fresh);
      expect(again).toEqual(fresh);
      expect(replay.hash).toBe(fresh.hash);
    });
  }
});
