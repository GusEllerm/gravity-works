/**
 * THE TALLY TAPE — the run-local buffer the shell fills with one
 * `TraceSample` per physics step (Freeplay Lane B; THE INPUT LAW: the
 * tally DERIVES from the tape, owns no bodies, steps nothing). The page
 * side of the same list `replayRun({record:true})` stores in Node
 * (`Modules/replay`), sampled identically from `World.state()` after each
 * step — reading poses is the firewall pattern's third instance, after
 * `src/juice/layer.ts` and the car rig: the tape WRITES ONLY into its own
 * array, and `tallyFromTrace` reads the array back. Mounting a tape on a
 * live run moves no hash — `tests/unit/tally.test.ts` measures it against
 * the shipped atlas receipt (the feasibility note's own probe measurement,
 * kept as a permanent gate).
 */
import type { TallySample } from './detectors.ts';

/** One state-shaped snapshot (the `WorldState` slice the tape needs —
 * structurally what `recorder.sample` already reads in `src/boot.ts`). */
export interface TapeState {
  time: number;
  car: {
    pos: { x: number; y: number; z: number };
    quat: { w: number; x: number; y: number; z: number };
    speed: number;
    grounded: boolean;
  };
}

export class TallyTape {
  private readonly samples: TallySample[] = [];

  /** Zero the tape at a launch. Like the witnesses in `src/ui/result.ts`,
   *  a reset per launch: the tape describes exactly one run. */
  reset(): void {
    this.samples.length = 0;
  }

  /** Append one post-step state. Read-only into the sim; the push is into
   *  the tape's own list — the only write this module ever performs. */
  sample(s: TapeState): void {
    this.samples.push({
      t: s.time,
      pos: [s.car.pos.x, s.car.pos.y, s.car.pos.z],
      quat: [s.car.quat.x, s.car.quat.y, s.car.quat.z, s.car.quat.w],
      speed: s.car.speed,
      grounded: s.car.grounded,
    });
  }

  /** The tape, oldest first — the exact list `tallyFromTrace` reads. */
  read(): readonly TallySample[] {
    return this.samples;
  }
}
