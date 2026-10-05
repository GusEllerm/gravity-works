/**
 * BEDROOM 02 — "Pillow Plateau" (the CHOICE rung: high road vs soft landing).
 *
 * The bed's pillow plateau sits above the floor, and the tray offers both
 * ways off it. The HIGH line — three `straight`s, the deck never leaves the
 * plateau — is the par and (measured) the FAST one: pure rolling, no catch
 * to bleed speed. The tempting SOFT line drops off the plateau edge into a
 * `drop` catch and runs the floor on a `landing` — it finishes too, but the
 * catch costs it time. Same lesson shape the kitchen L02 taught with counter
 * decks, re-staged on the bed: the lazy line is the fast line, and the tray
 * makes both buildable (5 pieces, both routes finish — asserted in
 * `tests/unit/bedroom-levels.test.ts`).
 *
 * `trayParams` carries `drop`/`landing`: the par (high) line never places
 * them, so without the declaration the two pieces the CHOICE exists for
 * would seat at kit defaults and build a different descent than the one
 * both lines were measured on (the stage-3 coherence rule, Concepts/Levels).
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
  BEDROOM_STRAIGHT,
  CABLE_DIP,
  bedroomLevel,
  registerBedroom,
  type BedroomLevel,
} from './bedroom01.level.ts';

export const BEDROOM02_ID = 'bedroom02';

/** The soft line's catcher: the `landing` off the plateau edge is the
 *  kitchen gap's proven soft catch (level 0.24, 12°) — a pillow, staged. */
const PILLOW = KITCHEN_GAP.landing;

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) }, // up to the mattress (fixture)
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } }, // tray: the plateau
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } }, // tray: the plateau
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } }, // tray: to the cup, still high
      { def: 'finishCup' }, // fixture
    ],
    BEDROOM02_ID,
    1,
  );
}

/** The SOFT line: drop off the plateau into the pillow catch and run the
 *  floor. Kept as data so the test can prove both lines finish — and which
 *  one is faster (it is not this one). */
export function bedroom02SoftBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) },
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } },
      { def: 'drop', params: CABLE_DIP.drop }, // off the mattress edge
      { def: 'landing', params: PILLOW }, // the pillow catch
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } }, // the floor run
      { def: 'finishCup' },
    ],
    BEDROOM02_ID,
    1,
  );
}

export const BEDROOM02: BedroomLevel = registerBedroom(
  bedroomLevel({
    id: BEDROOM02_ID,
    name: 'Pillow Plateau',
    set: 'bedroom',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), BEDROOM_GEOM.release * BEDROOM_GEOM.rampBlend),
    // 3 of the 5 tray pieces are placed on the par (high) line — measured,
    // regenerate via `npm run pars`.
    par: { pieces: 3, time: 2.4 },
    maxTime: 12,
    tray: { straight: 3, drop: 1, landing: 1 },
    trayParams: { drop: CABLE_DIP.drop, landing: PILLOW },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);
