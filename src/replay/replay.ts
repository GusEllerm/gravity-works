/**
 * Headless replay: run a (level, build, seed) through `World` in Node, no GPU,
 * no renderer — the determinism harness of the brief (§7.1, §8 "Determinism
 * and replay"). Everything it needs is in the data: `World.create` with
 * `visuals: false`, launch, step to the cap or to a terminal status, read the
 * hash. A share link embeds that hash; a replay recomputes and compares.
 *
 * Termination is a function of the build alone (terminal status or the fixed
 * step cap), so two runs of the same data execute the same step sequence and
 * must produce the same hash.
 */
import type { Build } from '../track/build.ts';
import type { Level } from '../world/level.ts';
import { World, type RunStatus } from '../world/world.ts';

export interface ReplayOptions {
  /** Hard cap on fixed steps. Default 15 s of sim time at 120 Hz. */
  maxSteps?: number;
  /** Forward release speed (sim units) passed to the World. */
  launchSpeed?: number;
}

export interface ReplayResult {
  /** hex FNV-1a state hash of the run */
  hash: string;
  /** numeric hash accumulator */
  hashValue: number;
  steps: number;
  time: number;
  status: RunStatus;
}

export async function replayRun(
  level: Level,
  build: Build,
  options: ReplayOptions = {},
): Promise<ReplayResult> {
  const world = await World.create(level, build, {
    visuals: false,
    launchSpeed: options.launchSpeed,
  });
  const cap = options.maxSteps ?? 15 * 120;
  world.launch();
  while (world.stepCount < cap && world.status === 'running') world.step();
  const result: ReplayResult = {
    hash: world.hashHex(),
    hashValue: world.hash(),
    steps: world.stepCount,
    time: world.time,
    status: world.status,
  };
  world.dispose();
  return result;
}
