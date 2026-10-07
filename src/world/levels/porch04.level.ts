/**
 * PORCH 04 — "Sunday Morning" (the capstone: every porch verb on one line,
 * the tray IS the answer, every ORDER finishes — and the step is pinned
 * UNFORGIVING so nothing short of the whole tray arrives on time).
 *
 * Every porch verb on one line: the dipped plank roll (rung 03's lesson —
 * sink and carry), the threshold's hard dip-and-catch (rung 01's verb,
 * deepened below), the deck plank (rung 02's lazy run), and the pop off
 * the lip under the cup (rung 01's launch, spent LAST) — four pieces, the
 * WHOLE tray, all load-bearing. The Playtest-G lesson as architecture, the
 * kitchen04/bedroom04/bathroom04/garden04/garage04 gate in its sixth
 * instance: the tray IS the par line's exact multiset, every kit socket is
 * flat, so a whole-tray chain's reach is an ORDER-INVARIANT SUM and EVERY
 * ORDER finishes against the anchored cup — all 24, measured 1.08–1.37 s,
 * test-gated. Your ORDERING is the line you pick and the clock is the
 * reward (kitchen04's sentence, porch-staged — here several orders run
 * UNDER the par reference, so the pieces-star line is also the speed line).
 *
 * THE PINNED STEP (the kitchen05 precedent, ported): the capstone's lesson
 * needs a trench a crawl cannot cross. When the ladder's forgiving
 * `THRESHOLD_GAP` (kitchen02's 0.10 m step, tuned for the LAUNCH-failure
 * clocks) softened into this rung, a three-piece `straight → drop →
 * landing` build began rolling the belly-slide down the slope-line and
 * finishing UNDER the par clock — the order lesson un-taught, exactly how
 * kitchen05's no-booster line once silently finished. So porch04 pins its
 * own step: `PORCH_STEP`, a 0.14 m drop on 55° knife walls — deep enough
 * that a slow belly wedges and DIES (measured ~1.48 s in the porch's late
 * family) while the pop's parabola still meets the exit deck in the
 * catch window and the sink's dip still slingshots the legitimate carry.
 * The SPAN is untouched at the ladder's 0.35 m (lead·2 + height/tan), so
 * the reach-sum law that makes the 24/24 possible is intact BY CONSTRUC-
 * TION, not by luck. The one 3-piece build that still finishes —
 * `gapLip → drop → landing`, the pop-and-catch shortcut, the ladder's
 * first verb three times over — arrives at ~1.25 s, a FULL quarter-second
 * over the par ORDER's own pace: it takes the pieces star and MISSES the
 * time star. The par ORDER (~1.08, par line 1.10) is not beatable within
 * the tray by measurement — the capstone is the ladder's precision rung,
 * stated openly where every earlier rung's par was beatable.
 *
 * And the doctrine holds under every order: no live zone rides this rung;
 * the weave's shade lies across the flight window and changes nothing,
 * which is the porch's whole lesson told while the player already knows
 * how to drive.
 */
import type { Build } from '../../track/build.ts';
import {
  PORCH_GEOM,
  PORCH_LIP,
  PORCH_STRAIGHT,
  porchChute,
  porchLevel,
  PORCH_SINK,
  registerPorch,
  type PorchLevel,
} from './porch01.level.ts';
import { lay, startSocketFromBuild } from './kitchen01.level.ts';

export const PORCH04_ID = 'porch04';

/** THE PINNED STEP lives in the KIT file (`porch01.level.ts`) with the
 *  full tuning argument — porch04's capstone is where the pinning was BORN
 *  (the sweep kept reporting a belly rolling the stock trench under the
 *  par line) and porch03's hard line shares the geometry. Kitchen05's
 *  trick — "the lesson needs an unforgiving gap" — stated for a trench
 *  instead of a hole: a belly-roll wedges (measured `fell` ~1.48 s), a pop
 *  still catches, a sink-carried line still flies. Tuned on
 *  `tmp/porch-tune.mjs`; the ladder test re-runs the battery. */
export { PORCH_STEP } from './porch01.level.ts';
import { PORCH_STEP } from './porch01.level.ts';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: porchChute() }, // the hall-side step (fixture)
      { def: 'landing', params: PORCH_SINK }, // tray: the dipped plank — sink and CARRY (03's lesson)
      { def: 'drop', params: PORCH_STEP }, // tray: the pinned step, taken on the carry
      { def: 'straight', params: { length: PORCH_STRAIGHT } }, // tray: the stoam plank
      { def: 'gapLip', params: PORCH_LIP }, // tray: the last pop, under the cup
      { def: 'finishCup' }, // fixture
    ],
    PORCH04_ID,
    1,
  );
}

export const PORCH04: PorchLevel = registerPorch(
  porchLevel({
    id: PORCH04_ID,
    name: 'Sunday Morning',
    set: 'porch',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), PORCH_GEOM.release * PORCH_GEOM.rampBlend),
    par: { time: 1.1 }, // the whole tray placed, the reference ORDER — measured, `npm run pars`
    maxTime: 12,
    // the tray IS the answer: 4 pieces, every one load-bearing (the belly
    // cheat is pinned DEAD by the step; the pop shortcut is pinned SLOW).
    tray: { landing: 1, drop: 1, straight: 1, gapLip: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);
