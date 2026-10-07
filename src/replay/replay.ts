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
  /** Record the per-step car transforms alongside the hash (stage 5 seek
   * proof: the page's recorded cinematic trace must equal THIS list step for
   * step). Off by default — a plain replay stays exactly the stage-2 call. */
  record?: boolean;
}

/** One post-step sample of the car (world metres, quaternion x,y,z,w). The
 * step index is the sample index: sample k is the state after step k+1, so
 * state at sim time t is sample `floor(t / FIXED_DT)` — never an
 * interpolation of two samples. */
export interface TraceSample {
  t: number;
  pos: [number, number, number];
  quat: [number, number, number, number];
  speed: number;
  grounded: boolean;
}

export interface ReplayResult {
  /** hex FNV-1a state hash of the run */
  hash: string;
  /** numeric hash accumulator */
  hashValue: number;
  steps: number;
  time: number;
  status: RunStatus;
  /** Per-step car transforms when `record` was set (see `TraceSample`). */
  trace?: TraceSample[];
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
  const trace: TraceSample[] | undefined = options.record ? [] : undefined;
  world.launch();
  while (world.stepCount < cap && world.status === 'running') {
    world.step();
    if (trace) {
      const s = world.state();
      trace.push({
        t: world.time,
        pos: [s.car.pos.x, s.car.pos.y, s.car.pos.z],
        quat: [s.car.quat.x, s.car.quat.y, s.car.quat.z, s.car.quat.w],
        speed: s.car.speed,
        grounded: s.car.grounded,
      });
    }
  }
  const result: ReplayResult = {
    hash: world.hashHex(),
    hashValue: world.hash(),
    steps: world.stepCount,
    time: world.time,
    status: world.status,
    ...(trace ? { trace } : {}),
  };
  world.dispose();
  return result;
}
