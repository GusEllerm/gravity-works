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

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) }, // the books (fixture)
      { def: 'straight', params: { length: 0.12 } }, // tray: counter lip
      { def: 'drop', params: KITCHEN_GAP.drop }, // tray: the gap + its catch
      { def: 'straight', params: { length: 0.25 } }, // tray: to the cup
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
      { def: 'straight', params: { length: 0.25 } },
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
    par: { pieces: 3, time: 2.27 }, // 3 of the 5 tray pieces are placed on the par line
    maxTime: 12,
    tray: { straight: 2, gapLip: 1, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1, curve: 1 },
    parBuild,
  }),
);
