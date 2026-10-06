/**
 * GARDEN 02 — "Slab or Bore" (the CHOICE rung: the garden's bowl moment,
 * honestly re-staged on the one signature the ratified set actually has).
 *
 * The brief asked this rung for a BIRDBATH BOWL TURN — the garden's answer
 * to the kitchen's bowl. The ratified variant-B set has no birdbath: the
 * exploration DELIBERATELY left the bowl out so the garden would not spend
 * its signature on the kitchen's idea (`docs/explorations/garden/Concept.md`
 * §the bowl sentence), and production shipped what the review ratified. The
 * set's one socketed signature is the DRAIN-PIPE BORE (`PIPE_SOCKET_FRAMES`
 * in `src/sets/garden/data.ts` — the mouth yawed off-axis, the garden's
 * tunnel-mouth staging). So this rung keeps kitchen03's/bedroom03's/
 * bathroom02's LESSON (a choice, and the fast line is the lazy one) and
 * re-homes its SIGN: the lazy slab line is the par; the SHOWY line launches
 * off the rim toward the bore mouth — which is STAGING at deck height, not
 * a ride: the bore never crosses the +x lane at any mount that keeps the
 * props off the corridor (measured while authoring — the ask #5 shape, one
 * lane-crossing bore anchor from it), and no level can chain through it.
 * The bowl-turn ask itself (a birdbath prop with a lane-crossing
 * `birdbath.in`/`birdbath.out` pair — ask #7, stated in the session log,
 * and behind it ask #1's drivable yaw and ask #4's prop-socket seating,
 * exactly the kitchen03 stack) is the garden's blocked-rung honesty, kitchen
 * L03's pattern: the RUNG is not blocked — both authored lines finish and
 * the choice is measured; only the showy half's PROMISE is bigger than the
 * set.
 *
 * Geometry is the family economy again: one 0.20 m `straight` seating, the
 * shared `BORE_GAP` numbers, ramp 0.28 — bathroom02's proven twin. The tray
 * affords BOTH lines; `trayParams` carries `gapLip`/`landing` (the par
 * never places them — the stage-3 coherence rule).
 */
import type { Build } from '../../track/build.ts';
import {
  kitchenRamp,
  lay,
  startSocketFromBuild,
} from './kitchen01.level.ts';
import {
  BORE_GAP,
  GARD_GEOM,
  GARD_STRAIGHT,
  gardenLevel,
  registerGarden,
  type GardenLevel,
} from './garden01.level.ts';

export const GARDEN02_ID = 'garden02';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) }, // the raised-bed plank (fixture)
      { def: 'straight', params: { length: GARD_STRAIGHT } }, // tray: the slab deck
      { def: 'drop', params: BORE_GAP.drop }, // tray: THE DIP — the lazy catch
      { def: 'straight', params: { length: GARD_STRAIGHT } }, // tray: the sunny run-out
      { def: 'finishCup' }, // fixture
    ],
    GARDEN02_ID,
    1,
  );
}

/** The SHOWY line: launch off the rim edge and drive the straight at the
 *  bore mouth. Kept as data so the test can prove it finishes (chained
 *  model) and which clock wins (it is not this one). The mouth it aims at
 *  is the set's pipe STAGING — nothing snaps to it; the bore ride is the
 *  blocked half (ask #5's bore-anchor shape + ask #7's birdbath ask, in
 *  Concepts/Levels §Piece requests and the session log). */
export function garden02BoreBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) },
      { def: 'straight', params: { length: GARD_STRAIGHT } }, // the slab deck, same seating
      { def: 'gapLip', params: BORE_GAP.lip }, // the launch toward the bore
      { def: 'drop', params: BORE_GAP.drop }, // the gap flown
      { def: 'landing', params: BORE_GAP.landing }, // the landing past the mouth
      { def: 'finishCup' },
    ],
    GARDEN02_ID,
    1,
  );
}

export const GARDEN02: GardenLevel = registerGarden(
  gardenLevel({
    id: GARDEN02_ID,
    name: 'Slab or Bore',
    set: 'garden',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), GARD_GEOM.release * GARD_GEOM.rampBlend),
    // 3 of the 5 tray pieces are placed on the par (lazy) line — measured,
    // regenerate via `npm run pars`.
    par: { pieces: 3, time: 2.35 },
    maxTime: 12,
    tray: { straight: 2, gapLip: 1, drop: 1, landing: 1 },
    trayParams: { gapLip: BORE_GAP.lip, landing: BORE_GAP.landing },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);
