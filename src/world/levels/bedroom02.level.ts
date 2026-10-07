/**
 * BEDROOM 02 — "Pillow Plateau" (the CHOICE rung: the sunk pillow vs the
 * hard step).
 *
 * STAGE-5 B2 PASS 2 (Playtest AA's wall — see
 * `Sessions/2026-10-10 Stage 5 - B2 pass 2.md`). The stage-4 B2 redesign
 * (Playtest U round 4) put both lines on ONE deck plane so no build could
 * die invisibly past the cup; AA then rebuilt the rung six times and every
 * car died "~a hand's width from the glowing papers" with the SAME note
 * ("the line let go before the cup") and gave up. Reconstructing AA's six
 * builds headless (builder mount, documented assumptions in the session
 * log) showed the old death map had TWO families sharing the cup site at
 * 5 cm of each other: the start-sink build (sink placed at the ramp, dies
 * 0.10 m short of the mug, 1.57 s) and the deck-only build (three flats,
 * no crossing, dies 0.13 m short, 2.17 s) both end under the mug wall, and
 * the start-sink family died far too late and far too close to the cup to
 * read as "put the pillow further along".
 *
 * This pass keeps every stage-4 invariant — one deck plane for BOTH lines
 * (the sink and the step still pass the mug mouth ~3 mm apart), tray =
 * par multiset + the other line's parts, no ≤ 3-piece build finishes,
 * empty span still the proven 0.2066 m, −22° launch (the ramp-angle knob —
 * swept −12…−28: shallower STALLS the step line at −16/−19/−20, steeper
 * drags every family's clock toward the cup site, so −22 stays) — and moves
 * ONE number: the pillow sink steepens 30° → 32° (`PILLOW_SINK`, level
 * 0.31 → 0.29), with the `PLATEAU_STEP` lead shortened 0.0885 → 0.0766 so
 * the step span still matches the sink's dx to 0.03 mm. Why that number is
 * the knob: it shortens the sink's dx (0.383 → 0.360) while keeping the
 * dy, so the sink-at-start builds drop their car steeper and earlier and
 * the car now dies AT the start end (~1.34 s, 0.79 m short — a distinct
 * EARLY site), while the double-drop family stays where the U-redesign
 * pinned it (falls 1.9–2.5 s, never a tumble past the 2.6 s cap, which the
 * 34° variant measured and rejected).
 *
 * The families now read as FOUR different lessons on the death clock
 * (times at seed 1, builder mount):
 *
 * - flipped piece — 1.28 s, at the flip (the piece is visibly backwards);
 * - sink at the start — 1.34 s, ~0.8 m short, by the start end (the fix is
 *   on screen: the pillow sank the car before the bed);
 * - almost-right (pillow line minus a run-out deck) — 1.84 s, under and
 *   past the mug (the note names the deck still in the tray: ADD tail);
 * - deck-only / never bridged the pillow — 2.17 s, a hand's width short.
 *   THIS ONE IS STRUCTURAL, and it is said plainly: the tray's three
 *   straights chain to within sink dx of the par chain's end, so a flat
 *   build lands within ~0.13 m of the mug no matter what the angle does
 *   (measured across −12…−28: 0.07–0.15 m short at every angle that keeps
 *   the step line finishing). It is separated by the LATEST clock of any
 *   death (2.17 s against ≤1.84 s) and by the pass-2 note tail, which for
 *   this build lists exactly the two pieces the tray still holds — "add a
 *   drop or a landing". The lesson (stay high / bridge the pillow) is one
 *   informed retry away from ANY of the four deaths.
 *
 * Death-clock cap pinned at 2.6 s (all 20 whole-tray orders: worst 2.49);
 * 7 of 20 whole-tray orders finish (1.67–2.38, a CHOICE tray, not
 * order-invariant whole — unchanged from the B2 redesign); seeds and
 * launch jitter 0–0.1 m/s stable (measured).
 *
 * The deck is 0.4 m (`BEDROOM02_STRAIGHT`) — this rung's own seating, the
 * way 04 carries 0.3: the plateau spans want two decks, not five.
 *
 * `trayParams` carries the `drop`: the par (pillow) line never places it,
 * so without the declaration the piece the STEP route is built with would
 * seat at kit defaults and sink a different depth than the pillow (the
 * stage-3 coherence rule, Concepts/Levels). The landing needs no entry —
 * the par line itself carries the sink geometry.
 */
import type { Build } from '../../track/build.ts';
import {
  kitchenRamp,
  lay,
  startSocketFromBuild,
} from './kitchen01.level.ts';
import {
  BEDROOM_GEOM,
  bedroomLevel,
  registerBedroom,
  type BedroomLevel,
} from './bedroom01.level.ts';

export const BEDROOM02_ID = 'bedroom02';

/** This rung's own deck length (see the header; the ladder's 0.2 m
 *  `BEDROOM_STRAIGHT` cannot span a mattress in two pieces). */
export const BEDROOM02_STRAIGHT = 0.4;

/** The launch deviation (the L02 "ramp angle is its own knob" precedent).
 *  −22° is kept: the pass-2 sweep at −12/−16/−19/−20 STALLS the step line
 *  or drags the par clock past 1.9 s, and −25/−28 pull every family's
 *  death within 0.15 m of the mug (measured, session log). */
export const BEDROOM02_RAMP_ANGLE = -22;

/** The pillow as geometry: the `landing` re-authored as a 32° SINK —
 *  dy −0.1867, dx 0.3598. Steeper and shorter than the B2 pass-1 sink
 *  (30°/0.31): sinking the pillow at the START now dumps the car at the
 *  start end (~1.34 s, 0.79 m short) instead of rolling it a hand's width
 *  from the cup, which is what read as "nothing differentiated my six
 *  builds" for AA. Placed by the par line, so the tray seats it from the
 *  build (no `trayParams` entry needed). */
export const PILLOW_SINK = { level: 0.29, angle: 32, blend: 0.06 } as const;

/** The plateau step as geometry: the `drop` deepened to 0.19 m so its
 *  exit deck and the pillow's floor plane pass the mug ~3 mm apart (dy
 *  −0.1900 vs −0.1867). The 0.0766 leads keep the EMPTY span at the
 *  proven 0.2066 m — longer than the plateau END's ballistic reach — while
 *  the whole span (0.3597) matches the sink's new dx to 0.03 mm, which is
 *  what lets BOTH routes reach the anchored cup (ask #2b retired for this
 *  rung, test-pinned). Declared via `trayParams` — the par line never
 *  places it. */
export const PLATEAU_STEP = { height: 0.19, angle: 45, radius: 0.02, lead: 0.0766 } as const;

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28, BEDROOM02_RAMP_ANGLE) }, // the book pile below the lamp (fixture)
      { def: 'straight', params: { length: BEDROOM02_STRAIGHT } }, // tray: the plateau
      { def: 'landing', params: PILLOW_SINK }, // tray: THE SINK — the pillow, to the floor plane
      { def: 'straight', params: { length: BEDROOM02_STRAIGHT } }, // tray: the floor run
      { def: 'straight', params: { length: BEDROOM02_STRAIGHT } }, // tray: the floor run
      { def: 'finishCup' }, // the mug on the floor (fixture)
    ],
    BEDROOM02_ID,
    1,
  );
}

/** The STEP line: stay high across the plateau (two decks), then the hard
 *  step off the edge and a run-out. Kept as data so the test can prove it
 *  finishes ON THE BUILDER MOUNT — and which line is faster (it is this
 *  one's opposite: ~2.04 against the pillow's ~1.72 — the trade-off is
 *  real, measured, and asserted BOTH-CHAINED-AND-ANCHORED). */
export function bedroom02StepBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28, BEDROOM02_RAMP_ANGLE) },
      { def: 'straight', params: { length: BEDROOM02_STRAIGHT } }, // tray: the plateau
      { def: 'straight', params: { length: BEDROOM02_STRAIGHT } }, // tray: the plateau
      { def: 'drop', params: PLATEAU_STEP }, // tray: THE STEP off the plateau edge
      { def: 'straight', params: { length: BEDROOM02_STRAIGHT } }, // tray: the floor run-out
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
    // 4 of the 5 tray pieces are placed on the par (pillow) line — measured,
    // regenerate the time via `npm run pars`.
    par: { pieces: 4, time: 1.75 },
    maxTime: 12,
    tray: { straight: 3, drop: 1, landing: 1 },
    trayParams: { drop: PLATEAU_STEP },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);
