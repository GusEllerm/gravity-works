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
 *
 * THE DEATH-CLOCK STAGGER (round 2, P4 item 6): all four encores rode ONE
 * rail, so the same failing build died at the SAME millisecond in sibling
 * rooms (player round 2: "same tray, same death"). This room takes the
 * SHELF-PAIR's late slot: the SAME 0.26 m finale shelf on its own eased
 * −11.35° grade (`BED05_GRADE`) with a 0.18 m crossing plate
 * (`BED05_PLANK`) — both stated rung-local deviations like `KITCHEN05_GAP`
 * before them; the room's ONE deck geometry and its 0.26 m shelf stay true
 * for the 01–04 ladder. Measured first: height, lead and catch moves
 * leave the death clock where it was (the arrival-plus-fall sum
 * self-cancels) and every shelf-height move either stalls the par or
 * drops the last-spend trim into the cup gap. At −11.35° + 0.18 m the
 * rail still sits on the set's floor disc (chain 1.397 m < the 1.4 m rim,
 * the rail-containment law intact), the canonical death — `drop →
 * straight → landing`, dip two uncrossed — lands at 3.100 s, 0.308 s
 * LATER than bathroom05's 2.792 s, every pair of encore deaths ≥0.3 s
 * apart (table: session note 2026-10-11), and EVERY order/promise/booster
 * law survives verbatim — deck-first still never catches sink two (falls
 * at 2.925), the mid decoy still kills, the hidden line (2.617 s) and the
 * gluttony builds are themselves. Only the decoy's run-out drag
 * compresses with the eased crawl (+0.39 → +0.14 s measured, the
 * porch-pair's idiom). Par moves 3.017 → 3.117 s.
 */
import type { Build } from '../../track/build.ts';
import { PIECE_KINDS, type PieceKind } from '../../track/pieces.ts';
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

/** THE STAGGER GRADE (round 2 P4 item 6): the finale's 0.26 m shelf on
 *  this room's own eased pitch — see the header. The grade is the ONLY
 *  axis that moves the death clock at all (height, lead and catch moves
 *  leave it where it was — the arrival-plus-fall sum self-cancels), and
 *  −11.35° is its measured limit: anything shallower stalls the par on
 *  the flat approach (the ladder's −12° convention's own margin) and
 *  anything steeper lands inside bathroom05's 0.3 s window. */
const BED05_GRADE = -11.35;

/** THE STAGGER PLANK (round 2 P4 item 6): the rail's plate 0.02 m shorter
 *  than the room's ladder deck (`BEDROOM_STRAIGHT` stays the law for
 *  01–04; the encore's rail is its own, stated). The eased grade lengthens
 *  the ramp, and the set's 1.4 m floor disc (the rail-containment law the
 *  disc-centring tests pin) only takes the rung's whole chain back to the
 *  eased crawl if the crossing plate shrinks — measured: 0.2 m walks the
 *  chain 4 mm off the disc rim, 0.18 m lands it back at 1.397 m. */
const BED05_PLANK = 0.18;

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26, BED05_GRADE) }, // the finale's shelf at the stagger grade (fixture)
      { def: 'drop', params: ENCORE_DIP }, // tray: cable dip ONE — ridden
      { def: 'straight', params: { length: BED05_PLANK } }, // tray: the plank between
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
      { def: 'ramp', params: kitchenRamp(0.26, BED05_GRADE) },
      { def: 'booster' }, // the early spend
      { def: 'drop', params: ENCORE_DIP },
      { def: 'straight', params: { length: BED05_PLANK } },
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
    par: { pieces: 4, time: 3.15 },
    maxTime: 12,
    // par's four + one DECOY straight + one TEMPTATION booster = 6 = budget
    tray: { drop: 2, straight: 2, landing: 1, booster: 1 },
    trayParams: { booster: {} },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);

// ---- the bedroom sandbox ---------------------------------------------------
//
// The set's no-budget room, mirroring `kitchen-sandbox` exactly: every piece
// unlocked (`sandbox: true`, budget 999 — "no budget" with the number the
// contract demands), NOT a campaign rung (invisible to `CAMPAIGN`, nobody's
// next, addressable by `?level=` like every off-ladder rig), and the
// reference build is one clean lap of the gap verbs at THIS ladder's own
// geometry: the 02-rung shelf (ramp 0.28), the ladder's single 0.2 m
// straight seating, the shared `KITCHEN_GAP`. Measured: 2.733 s.

export const BEDROOM_SANDBOX_ID = 'bedroom-sandbox';

function sandboxBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) }, // the shelf (fixture)
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } }, // the deck before the gap
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // the launch
      { def: 'drop', params: KITCHEN_GAP.drop }, // the gap + catch
      { def: 'landing', params: KITCHEN_GAP.landing }, // the run-out
      { def: 'straight', params: { length: BEDROOM_STRAIGHT } }, // ride to the cup
      { def: 'finishCup' }, // fixture
    ],
    BEDROOM_SANDBOX_ID,
    1,
  );
}

const EVERY_PIECE = Object.fromEntries(PIECE_KINDS.map((kind: PieceKind) => [kind, 99]));

export const BEDROOM_SANDBOX: BedroomLevel = registerBedroom(
  bedroomLevel({
    id: BEDROOM_SANDBOX_ID,
    name: 'Bedroom sandbox',
    set: 'bedroom',
    seed: 1,
    startSocket: startSocketFromBuild(sandboxBuild(), BEDROOM_GEOM.release * BEDROOM_GEOM.rampBlend),
    budget: 999, // no budget; the contract wants a number
    par: { pieces: 5, time: 2.75 }, // measured 2.733 s on the lap (regenerate via pars)
    maxTime: 20,
    sandbox: true,
    tray: EVERY_PIECE,
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild: sandboxBuild,
  }),
);
