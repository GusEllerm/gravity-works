/**
 * BEDROOM 05 — "Cable Snake" (the encore rung: the DOUBLE CROSSING).
 *
 * Every rung of every room's ladder crossed its ONE hole. The encore says:
 * the cable snake crosses the lane TWICE, and the line rides OVER both —
 * the room's founding sentence (`bedroom01`, RIDE OVER, DON'T FLY), doubled.
 * The par is `drop → straight → drop → landing` from the FINALE's height
 * (ramp 0.26 — the encore rides the capstone's shelf): four tray pieces,
 * and for the first time in the house's late ladder NO omission finishes —
 * eleven one-, two- and three-piece builds FALL (pinned below), because the
 * rung pins its OWN dip geometry: the ladder's 0.12 m step on the porch
 * THRESHOLD's long lead (`ENCORE_DIP`, lead 0.11 → span 0.3566 m — longer
 * than a ~0.31 m roll-off can fly at this release; the porch fail-timing
 * law doing ladder work, a stated rung-local deviation like `KITCHEN05_GAP`
 * and `PORCH_STEP`). On the stock 0.05 leads the half-line `straight →
 * drop → landing` FLIES the remaining hole and finishes UNDER the par
 * clock (2.592 measured at lead 0.05) — the long lead is what makes the
 * second crossing load-bearing instead of decorative.
 *
 * THE TRAY is the par's four pieces + ONE DECOY `straight` + ONE
 * TEMPTATION `booster` — the room's first speed purchase (the booster's
 * verb is kitchen05's; here it is a CHOICE, not a forced trade). Measured,
 * both directions: spent EARLY (`bedroom05BoosterBuild`, exported) it buys
 * the whole second dip — 4 pieces, 2.442 s, the room's fastest 3★ and the
 * campaign's pinned hidden line (`porch03`'s bounce law: the par beable
 * hiding in plain sight); spent LATE it is decoration — `drop→straight→
 * drop→landing→booster` finishes at the par's OWN clock and hash with one
 * piece wasted. The decoy teaches the reach law both ways: TAIL-placed it
 * finishes at par's own hash (a piece bought, nothing earned), MID-LINE it
 * displaces the second dip and the run FALLS; between catcher and cup it
 * drags (+0.39 s). The ORDER is not free either: deck-first (`straight →
 * drop → drop → landing`) never catches the second sink — WHERE the two
 * dips sit around the plank is the line.
 *
 * The set ships no live zones and neither does this rung (the bedroom
 * ladder's law). Measured numbers: `npm run pars`, `tests/unit/bedroom-
 * levels.test.ts`.
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
  bedroomLevel,
  registerBedroom,
  type BedroomLevel,
} from './bedroom01.level.ts';

export const BEDROOM05_ID = 'bedroom05';

/** THE PINNED ENCORE DIP — the bedroom's cable-dip step (0.12 m) on the
 *  porch THRESHOLD's long lead: span 0.3566 m, longer than a roll-off can
 *  fly at this release (~0.31 m), so a MISSING dip is a fall, never a
 *  shortcut. Rung-local deviation, stated, like `PORCH_STEP` before it. */
export const ENCORE_DIP = { height: 0.12, angle: 45, radius: 0.02, lead: 0.11 };

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) }, // the finale's shelf (fixture)
      { def: 'drop', params: ENCORE_DIP }, // tray: cable dip ONE — ridden
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } }, // tray: the plank between
      { def: 'drop', params: ENCORE_DIP }, // tray: cable dip TWO — ridden
      { def: 'landing', params: KITCHEN_GAP.landing }, // tray: the run-out catch
      { def: 'finishCup' }, // fixture
    ],
    BEDROOM05_ID,
    1,
  );
}

/** THE BOOSTER LINE (exported, pinned): spend the speed EARLY and it buys
 *  the second crossing whole — four pieces, faster than the ride, the
 *  room's hidden 3★ (`porch03`'s bounce precedent). Spend the SAME piece
 *  last and the run is the par's own, one piece poorer. */
export function bedroom05BoosterBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) },
      { def: 'booster' }, // the early spend
      { def: 'drop', params: ENCORE_DIP },
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } },
      { def: 'landing', params: KITCHEN_GAP.landing },
      { def: 'finishCup' },
    ],
    BEDROOM05_ID,
    1,
  );
}

export const BEDROOM05: BedroomLevel = registerBedroom(
  bedroomLevel({
    id: BEDROOM05_ID,
    name: 'Cable Snake',
    set: 'bedroom',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), BEDROOM_GEOM.release * BEDROOM_GEOM.rampBlend),
    // measured on the par build (regenerate via `npm run pars`)
    par: { pieces: 4, time: 3.05 },
    maxTime: 12,
    // par's four + one DECOY straight + one TEMPTATION booster = 6 = budget
    tray: { drop: 2, straight: 2, landing: 1, booster: 1 },
    trayParams: { booster: {} },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);
