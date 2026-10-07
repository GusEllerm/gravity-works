/**
 * BEDROOM 02 — "Pillow Plateau" (the CHOICE rung: the sunk pillow vs the
 * hard step).
 *
 * STAGE-4 B2 REDESIGN (Playtest U round 4's wall — see
 * `Sessions/2026-10-09 Stage 4 - B2 learnability`). The rung's lesson is
 * the kitchen L02 shape re-staged on the bed — the plateau offers two ways
 * down to the mug and one of them is measurably lazier — but the OLD
 * geometry made the lesson a lie on the mount the game actually builds:
 * the soft line ended 18 cm below its par (ask #2b), 13 of the 20 tray
 * orders finished (several sub-par), and every drop-first build died at
 * 2.9–3.3 s far past the anchored cup with nothing on screen to read
 * ("the line let go before the cup" — unknowable, which is what walled U).
 *
 * The redesign puts BOTH lines on ONE deck plane — the same depth — so the
 * anchored cup catches either and no build can die late-invisible:
 *
 * - The PILLOW (par, fast) line crosses one `straight` of mattress and
 *   sinks into the pillow — a `landing` re-authored as a 30° sink
 *   (`PILLOW_SINK`, dy −0.1857) — and runs the floor plane out to the mug.
 *   Measured ~1.7 s.
 * - The STEP line keeps the deck high for two `straight`s, then takes the
 *   plateau edge on a `drop` whose step depth MATCHES the sink
 *   (`PLATEAU_STEP`, dy −0.1900 vs −0.1857 — the two decks pass the mug
 *   mouth 4 mm apart, inside the capture sphere). It finishes too, ~0.5 s
 *   slower: the ballistic slam eats what the high deck gained. The
 *   trade-off is real, measured, and asserted BOTH-CHAINED-AND-ANCHORED.
 *
 * Failure timing is separated the way kitchen02's second pass learned (the
 * ramp-angle tool: this rung ships its OWN launch, −22°, shortening the
 * crawl that compressed every L02 death into one clock). Every wrong build
 * now dies by ~2.5 s where a visible rail failed: the bare plateau falls
 * at the plateau END (~1.7 s); a step or pillow with no run-out dies AT
 * the crossing (~1.6–2.1 s); the double-drop (step AND pillow in one
 * chain) rolls a deck 19 cm BELOW the mug plane and dies at its far end,
 * the cup in frame overhead (~1.9–2.3 s). Nothing reaches 3 s. The cup
 * sits a whole crossing (0.78 m — two straights or straight+sink) beyond
 * any plateau end, far outside the ballistic reach (~0.25 m), so no
 * omission skips a missing piece into the capture; every ≤ 3-piece build
 * fails (test-pinned).
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

/** The launch deviation (the L02 "ramp angle is its own knob" precedent):
 *  −22° keeps the crawl short enough that the fail classes separate on the
 *  death clock instead of stacking at ~3 s. */
export const BEDROOM02_RAMP_ANGLE = -22;

/** The pillow as geometry: the `landing` piece re-authored as a 30° sink —
 *  dy −0.1857, dx 0.3831. Placed by the par line, so the tray seats it
 *  from the build (no `trayParams` entry needed). */
export const PILLOW_SINK = { level: 0.31, angle: 30, blend: 0.06 } as const;

/** The plateau step as geometry: the `drop` piece deepened to 0.19 m so its
 *  exit deck and the pillow's floor plane pass the mug 4 mm apart (dy
 *  −0.1900 vs −0.1857). The 0.0885 leads keep the empty span at the proven
 *  0.207 m — longer than the plateau END's ballistic reach — while the
 *  whole span matches the sink's dx to half a millimetre, which is what
 *  lets BOTH routes reach the anchored cup (ask #2b retired for this rung,
 *  test-pinned). Declared via `trayParams` — the par line never places it. */
export const PLATEAU_STEP = { height: 0.19, angle: 45, radius: 0.02, lead: 0.0885 } as const;

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
 *  one's opposite). */
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
