/**
 * PORCH 05 — "The Crossing" (the campaign's last rung: two thresholds, one
 * tray, two authored routes, and the shortcut home arrives late).
 *
 * The fantasy the whole house was built to walk out of: HALL to DECK to
 * YARD in one timed run. Two thresholds stand on the line — the door
 * mouth's drop and the stoam's step — and the tray buys both crossings
 * with four pieces: two `gapLip`s (identical geometry, laid as two
 * instances — the coherence rule) and two catchers, the hard `drop` and
 * the soft `landing` (rung 03's SINK, span-matched to the drop by the
 * reach-sum law, so WHICH catcher lands on WHICH threshold is a choice
 * that ends at the same cup either way).
 *
 * The two INTENDED routes finish on BOTH mountings — chained and
 * builder-anchored, test-pinned — and the clock ranks them honestly:
 * the SINK-FIRST line (par) softens the mouth and slingshots the dip into
 * a hard catch of the step (~1.19 s); the CATCH-FIRST line pops the mouth
 * hard and runs out soft over the stoam (~1.39 s, the same pop the ladder
 * opened with, spent on the last threshold). Same multiset, same end
 * plane — the dy bookkeeping is additive and the spans are equal, so both
 * routes deck-to-deck under the one anchored cup BY CONSTRUCTION. Every
 * whole-tray order finishes (the identical-span sum again — the campaign's
 * last kindness, stated as what it is); the omissions die in the porch's
 * families — the two-piece ones at <1.1 s off the chute's clock, the
 * three-piece `gapLip → drop → landing` shortcut the ONE exception: it
 * finishes, but ~0.07 s over the par TIME line it must beat to matter, so
 * it takes the pieces star and misses the time star. The crossing cannot
 * be shortcut; it can only be late.
 *
 * Beyond this rung `nextInCampaign('porch05') === null`: the campaign ends
 * where the house ends — outside, in the morning, the chime still swinging
 * over the porch the player just crossed.
 */
import type { Build } from '../../track/build.ts';
import {
  PORCH_GEOM,
  THRESHOLD_GAP,
  porchChute,
  porchLevel,
  PORCH_SINK,
  registerPorch,
  type PorchLevel,
} from './porch01.level.ts';
import { lay, startSocketFromBuild } from './kitchen01.level.ts';

export const PORCH05_ID = 'porch05';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: porchChute() }, // the hall-side step (fixture)
      { def: 'gapLip', params: THRESHOLD_GAP.lip }, // tray: the door-mouth pop
      { def: 'landing', params: PORCH_SINK }, // tray: the mouth, SOFT-caught — the dip that slingshots
      { def: 'gapLip', params: THRESHOLD_GAP.lip }, // tray: the stoam pop (same geometry — laid by instance)
      { def: 'drop', params: THRESHOLD_GAP.drop }, // tray: the step, HARD-caught
      { def: 'finishCup' }, // fixture — the cup on the yard side
    ],
    PORCH05_ID,
    1,
  );
}

/** The CATCH-FIRST route: the authored alternate — hard on the mouth,
 *  soft over the step. Both routes finish (chained AND anchored,
 *  test-pinned); the catch-first clock pays the slam it skipped at the
 *  mouth twice over by the stoam. */
export function porch05CatchFirstBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: porchChute() },
      { def: 'gapLip', params: THRESHOLD_GAP.lip },
      { def: 'drop', params: THRESHOLD_GAP.drop }, // the mouth, HARD-caught
      { def: 'gapLip', params: THRESHOLD_GAP.lip },
      { def: 'landing', params: PORCH_SINK }, // the step, SOFT-caught — the run-out
      { def: 'finishCup' },
    ],
    PORCH05_ID,
    1,
  );
}

export const PORCH05: PorchLevel = registerPorch(
  porchLevel({
    id: PORCH05_ID,
    name: 'The Crossing',
    set: 'porch',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), PORCH_GEOM.release * PORCH_GEOM.rampBlend),
    par: { time: 1.2 }, // the whole tray placed — measured, regenerate via `npm run pars`
    maxTime: 12,
    // the tray IS the answer: two pops, two catchers, 4 pieces, all
    // load-bearing; the tray seats ONE geometry per kind (the two lips are
    // the same parameters, laid as two instances — the coherence rule).
    tray: { gapLip: 2, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);
