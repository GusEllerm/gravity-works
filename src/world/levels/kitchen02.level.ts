/**
 * KITCHEN 02 — "Two Ways" (the choice level).
 *
 * One gap, two valid lines across it, and the FAST one is the lazy one: the
 * tray holds a full lip/drop/landing bridge and two loose straights. The
 * intended (par) line just rolls the gap as a `drop` between two straights —
 * a clean catch, no launch, no landing blend bleeding speed. The tempting
 * arc route (gapLip launch, drop catch, landing roll-out) also finishes but
 * loses ~0.13 s to its own landing blend. Which line is faster is the lesson;
 * the tray makes both buildable (5 pieces, both routes finish — asserted in
 * `tests/unit/kitchen-levels.test.ts`).
 *
 * The rung this level was specced to add — a drivable mid-run `curve` — is
 * BLOCKED: no mid-run yaw arc is steerable by either shipped car (every
 * attempt ploughs off the outer wall or dies on the yaw seam; see
 * Concepts/Levels §Piece request 1 and the stage-2 `Modules/feel.md` "banked
 * yaw arcs are the open boundary" finding). The curve is therefore present as
 * a FIXTURE past the cup — built, colliding, railable, Hot-Wheels run-out
 * style, exactly the honesty standard the feel track set — and the timed run
 * ends at the cup. The par build gains one line once steering lands.
 */
import type { Build } from '../../track/build.ts';
import {
  KITCHEN_GAP,
  KITCHEN_GEOM,
  kitchenRamp,
  lay,
  registerKitchen,
  kitchenLevel,
  startSocketFromBuild,
  type KitchenLevel,
} from './kitchen01.level.ts';

export const KITCHEN02_ID = 'kitchen02';

/** The fixture run-out past the cup (visible curve; the timed run ends first). */
export const KITCHEN02_RUNOUT = { radius: 1.2, angle: 40 };

/** ONE straight geometry for the whole level (0.18 m).
 *  STAGE-3 LADDER-COHERENCE FIX: the par line used to chain a 0.12 and a 0.25
 *  straight. The tray has ONE geometry per kind — `levelTrayParams` takes a
 *  kind's FIRST par placement and the builder ghosts and seats every held
 *  straight with it — so a second, longer straight was a piece the shipped
 *  builder could not place: replayed the way the builder mounts a level
 *  (`initialBuild` anchors the fixtures, the tray pieces chain off them), the
 *  player's lazy line fell 0.13 m short of the anchored cup. One geometry per
 *  kind, both straights 0.18 m (the par's old 0.37 m of counter deck, kept
 *  within 1 cm), makes the par build exactly what the tray can place; the
 *  par's finish time is unchanged at 2.317 s and the arc route is still the
 *  slower line in the same authored model (2.442 s vs 2.317 s). */
const L02_STRAIGHT = 0.18;

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) }, // the books (fixture)
      { def: 'straight', params: { length: L02_STRAIGHT } }, // tray: counter lip
      { def: 'drop', params: KITCHEN_GAP.drop }, // tray: the gap + its catch
      { def: 'straight', params: { length: L02_STRAIGHT } }, // tray: to the cup
      { def: 'finishCup' }, // fixture
      { def: 'curve', params: KITCHEN02_RUNOUT }, // fixture: the visible curve
    ],
    KITCHEN02_ID,
    1,
  );
}

/** The slow-but-tempting arc route, kept as data so the test can prove both
 *  lines finish (it is what a player builds when the par build is theirs). */
export function kitchen02ArcBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) },
      { def: 'gapLip', params: KITCHEN_GAP.lip },
      { def: 'drop', params: KITCHEN_GAP.drop },
      { def: 'landing', params: KITCHEN_GAP.landing },
      { def: 'straight', params: { length: L02_STRAIGHT } },
      { def: 'finishCup' },
      { def: 'curve', params: KITCHEN02_RUNOUT },
    ],
    KITCHEN02_ID,
    1,
  );
}

export const KITCHEN02: KitchenLevel = registerKitchen(
  kitchenLevel({
    id: KITCHEN02_ID,
    name: 'Two Ways',
    set: 'kitchen',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), KITCHEN_GEOM.release * KITCHEN_GEOM.rampBlend),
    par: { pieces: 3, time: 2.32 }, // 3 of the 5 tray pieces are placed on the par line (measured — regenerate via pars)
    maxTime: 12,
    tray: { straight: 2, gapLip: 1, drop: 1, landing: 1 },
    // the arc route's pieces: the LAZY par line never places a `gapLip` or a
    // `landing`, and a tray kind's geometry otherwise comes from the par
    // build's first placement — without this declaration the two pieces the
    // CHOICE exists for would seat at kit defaults and build a different gap
    // than the one both lines were measured on.
    trayParams: { gapLip: KITCHEN_GAP.lip, landing: KITCHEN_GAP.landing },
    fixtures: { ramp: 1, finishCup: 1, curve: 1 },
    parBuild,
  }),
);
