/**
 * BEDROOM 04 — "Lights Out" (the capstone: everything, one tray, no guesses).
 *
 * Every bedroom verb on one line: the plateau-straight run from the book
 * pile (L01's deck work), the launch off the pyramid edge (L03's air), the
 * stepped dip-and-catch the cable taught (L01/L03's `drop`), and the soft
 * `landing` run-out — four pieces, the WHOLE tray, all load-bearing. This
 * is the Playtest-G lesson as architecture: the tray IS the par line's
 * exact multiset, so the rung cannot degenerate into "which 4 of 5"; with
 * every kit socket flat a whole-tray chain's reach is an order-invariant
 * sum, so EVERY ORDER finishes (24/24 gate, test-asserted) and the lesson
 * is the clock, not the gate. The par ORDER is beatable (measured), which
 * is what the 3-star time is for.
 *
 * The lamp-shadow drama is PURE STAGING: the practical is the set's own
 * point light (`LAMP.bulb`), the level moves no light and no mechanic —
 * the dusk pool is where the line runs because the set mounts canonical.
 *
 * `straight` is 0.3 m here (not the ladder's 0.2): this rung's lesson is
 * the order-invariant whole-tray SUM, and that property was proven at the
 * 0.3 m run-out geometry the kitchen L04 sweep gates (24/24). One geometry
 * per kind still holds — the tray seats its one straight at 0.3.
 */
import type { Build } from '../../track/build.ts';
import {
  KITCHEN_GAP,
  kitchenRamp,
  lay,
  startSocketFromBuild,
} from './kitchen01.level.ts';
import {
  BEDROOM_GEOM,
  CABLE_DIP,
  bedroomLevel,
  registerBedroom,
  type BedroomLevel,
} from './bedroom01.level.ts';

export const BEDROOM04_ID = 'bedroom04';

/** The run-out geometry, pinned to the kitchen L04 sweep's 0.3 m (header). */
const L04_STRAIGHT = 0.3;

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) }, // the book pile under the lamp (fixture)
      { def: 'straight', params: { length: L04_STRAIGHT } }, // tray: the deck run
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // tray: the launch
      { def: 'drop', params: CABLE_DIP.drop }, // tray: the dip-and-catch
      { def: 'landing', params: KITCHEN_GAP.landing }, // tray: the soft run-out
      { def: 'finishCup' }, // fixture
    ],
    BEDROOM04_ID,
    1,
  );
}

export const BEDROOM04: BedroomLevel = registerBedroom(
  bedroomLevel({
    id: BEDROOM04_ID,
    name: 'Lights Out',
    set: 'bedroom',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), BEDROOM_GEOM.release * BEDROOM_GEOM.rampBlend),
    par: { time: 2.7 }, // the whole tray placed — measured, regenerate via `npm run pars`
    maxTime: 12,
    // the tray IS the answer: 4 pieces, every one load-bearing.
    tray: { straight: 1, gapLip: 1, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);
