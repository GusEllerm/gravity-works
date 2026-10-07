/**
 * `porch03` — **THE STEP** (the sixth room's THIRD rung: the ORDER rung on
 * the PORCH's own pinned geometry — kitchen03's trench lesson re-tuned for
 * the deck, and the rung where the porch's anti-cheat doctrine was FORGED).
 *
 * THE TRAY IS THE PAR (kitchen03's shape, porch's geometry): four pieces —
 * two planks, the lip, the pinned step — and the par line places EVERY
 * one: pop the gap, catch the STEP hard, run the plank out. An order rung
 * in kitchen03's lineage: what you're learning is WHERE the step goes in
 * the chain, and the whole tray is what the lesson costs. No subset of
 * this tray finishes at all (the sweep's omission table: every 3-piece
 * build FALLS, 1.175–1.408 s) — the strongest anti-cheat shape in the
 * house, and the answer to the tuning war this rung fought: an earlier
 * draft carried a fifth piece, a sink ramp, and the sweep found it was a
 * UNIVERSAL BRIDGE — a four-line no-lip belly cheat finished UNDER the
 * par clock (1.06–1.09 s), and every sink-order variant bled the same
 * cheat. Kitchen03 needed no landing in its tray for exactly this reason;
 * the porch now knows why.
 *
 * THE ORDER LESSON (measured, 24 orders): 22 finish. The two that die —
 * `gapLip → straight → straight → drop` — put the pop first and the step
 * LAST, wedging the ball into the 55° face with a flat run behind it:
 * porch04's belly law, announced early, softly. The mastery line is the
 * BOUNCE: `drop` FIRST slams the chute down the step's face, the ball
 * skids back onto the deck and sprints the planks and the lip to the cup
 * at ~1.13 — the fastest legitimate build on the rung, a full 0.11 s
 * UNDER the par order (kitchen02's beable-par pattern: the designer's
 * line teaches, the tray hides a faster one for the brave). The
 * belly-ORDER `straight → drop → …` (flat approach, no pop) still wedges
 * and dies at ~1.34 — the law holds: the step is POPPED or SLAMMED from
 * the chute, never bellied.
 *
 * THE DEATH CLOCK (fail-timing law): the −29°/0.16 m chute launch caps
 * every wrong build. Measured families: singletons die 0.99–1.03 s (the
 * ramp-end family, EARLY); pairs 1.08–1.29 s; triples 1.18–1.41 s.
 * Nothing crawls; nothing finishes late enough to pretend.
 *
 * The set is porch-architecture-v1 (see `sets/porch/data` — hazards empty
 * BY LAW: the shade teaches the eye, never the feet; the porch adds NO
 * live zone). The mount is authored at the deck centre (Level Designer
 * derived; boot applies verbatim), its y 5 mm under the par build's
 * finish deck.
 */
export const PORCH03_ID = 'porch03';

import type { Build } from '../../track/build.ts';
import { startSocketFromBuild, lay } from './kitchen01.level.ts';
import {
  porchChute,
  porchLevel,
  registerPorch,
  PORCH_GEOM,
  PORCH_STRAIGHT,
  PORCH_STEP,
  THRESHOLD_GAP,
  type PorchLevel,
} from './porch01.level.ts';

/** The par line: plank, POP, catch the step, run out. Every piece earns
 *  its place; nothing else in the tray reaches the cup. */
function porch03ParBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: porchChute() }, // fixture — the hall-side step, the chute tool
      { def: 'straight', params: { length: PORCH_STRAIGHT } }, // tray: the deck plank
      { def: 'gapLip', params: THRESHOLD_GAP.lip }, // tray: the pop across the gap
      { def: 'drop', params: PORCH_STEP }, // tray: the pinned step, caught HARD
      { def: 'straight', params: { length: PORCH_STRAIGHT } }, // tray: the run-out plank
      { def: 'finishCup' }, // fixture
    ],
    'porch03',
    1,
  );
}

/** THE BOUNCE (the exported mastery line, garage04's shortcut-export
 *  pattern but ABOVE par): slam the chute down the step's face, let the
 *  ball skid back and sprint everything else to the cup. All four tray
 *  pieces — a legitimate 3-star ceiling ~1.13 s, 0.11 s under the par
 *  order. The rung hides nothing; it just doesn't teach this on day one. */
export function porch03BounceBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: porchChute() },
      { def: 'drop', params: PORCH_STEP }, // tray: slammed from the chute itself
      { def: 'straight', params: { length: PORCH_STRAIGHT } },
      { def: 'straight', params: { length: PORCH_STRAIGHT } },
      { def: 'gapLip', params: THRESHOLD_GAP.lip }, // tray: the pop to the cup
      { def: 'finishCup' },
    ],
    'porch03',
    1,
  );
}

const porch03Level = registerPorch(
  porchLevel({
    id: PORCH03_ID,
    name: 'The Step',
    set: 'porch',
    seed: 1,
    startSocket: startSocketFromBuild(porch03ParBuild(), PORCH_GEOM.release * PORCH_GEOM.rampBlend),
    maxTime: 20,
    par: { pieces: 4, time: 1.25 }, // measured 1.242 on the par order (regenerate via `npm run pars`)
    // The tray IS the par line's multiset (4 = budget, all load-bearing):
    // no subset of it finishes AT ALL, which is the porch's answer to the
    // sink-bridge cheat this rung's tuning war exposed.
    tray: { straight: 2, gapLip: 1, drop: 1 },
    parBuild: porch03ParBuild,
    // Auto-extend: the ramp and cup are the built-ins; planks, lip and the
    // pinned step come from parBuild's transforms — garage02's seam.
    fixtures: { ramp: 1, finishCup: 1 },
  }),
);

export const PORCH03: PorchLevel & { bounceBuild(): Build } = {
  ...porch03Level,
  bounceBuild: porch03BounceBuild,
};
