/**
 * KITCHEN 02 — "Two Ways" (the choice level).
 *
 * One gap, two valid lines across it — and (measured) the lazy one wins the
 * clock by a hair. STAGE-4 DISCOVERABILITY PASS (Playtest H: 4 tries, 3 ends
 * "fell off after a long jump"; Playtest K: 3 builds, all "fell off the set"
 * ~3.1 s, quit). Headless replay of every chain their reports describe, on
 * the mount the SHIPPED builder makes (`initialBuild` anchors the fixtures,
 * tray pieces chain off the ramp's exit), said the wall was the FINDING, not
 * the physics: with a 5-piece tray for two 3–4-piece lines, the plausible
 * orders split three ways — lines that finish (~2.2–2.6 s), lines that land
 * PAST the cup and fall off the far end (~3.0–3.1 s: K's three deaths), and
 * lip-launched lines that fly the hole and fall in it (~2.4 s: H's three
 * deaths) — and nothing on screen says which rail a chain rides. The fix is
 * the rule the bedroom rungs later (bedroom03/04) authored under and
 * kitchen04's learnability pass proved: kill the guess-space, not the choice.
 *
 * THE TRAY IS NOW THE UNION OF THE TWO LINES — 4 pieces, none spare:
 *   the LAZY line — `straight`, `drop`, `straight` — 3 of 4, the par, 2.17 s;
 *   the ARC line — `gapLip` launch, `drop` catch, one `straight` run-out —
 *   3 of 4, 2.19 s. The lip replaces one straight (that swap IS the choice);
 *   placing ALL FOUR finishes in EVERY order (12/12 measured, 2.17–3.10 s —
 *   the place-everything test-gate, exactly bedroom04's pattern), so a
 *   stranger cannot build a stranger's death: H's and K's reported builds all
 *   finish or die fast and NEAR the gap, never past the cup.
 *
 * WHY THE GAP IS SMALLER NOW (and the drop/lip are re-tuned LOCALLY, one
 * deviation from the KITCHEN_GAP-chain convention, stated honestly): on a
 * single anchored rail two lines share the cup only if their reaches SUM to
 * the same distance. Flat sockets make a chain's reach the sum of its
 * spans, so `gapLip`'s span had to equal one `straight`'s (0.09 m) and the
 * `drop`'s catch had to meet the launched parabola from a shorter deck — the
 * lip's launch angle is 12° and the drop's leads 0.07 m, both local to this
 * level (the tray's `gapLip`/`drop` geometry is declared via `trayParams`).
 * The old 5-piece tray could not satisfy that law at ANY order count: one
 * line always summed 0.36 m past the cup — the flyovers H and K died on.
 * The lesson as shipped is now TRUE IN THE GAME, not just in the chained
 * model: both lines reach the anchored cup and the lazy one is faster
 * (2.17 s vs 2.19 s; par 2.20 — both 3-star-able, the lazy one wins by
 * 0.02 s, small, measured, true — the bedroom03 precedent for an honest
 * margin). The choice is also beatable: `drop` FIRST (`drop → straight →
 * straight`) runs 2.17 s against a 2.20 par — order, not subset, is the
 * speed question.
 *
 * KNOWN MEASURED EDGE (kept honest, like L04's probe rows): two-piece builds
 * (`straight → gapLip`, `straight → straight`, `gapLip → drop`,
 * `straight → drop`) and one-piece builds all FAIL — near the gap or just
 * past the cup, never finishing — and one THREE-piece fluke,
 * `straight → straight → gapLip`, catapults across the hole without the
 * `drop` (2.20 s, test-pinned as finishing so the claim stays falsifiable).
 * The old "no build missing the drop crosses" law needed the big gap the two
 * lines could not share; on the small gap the lip can almost buy a crossing.
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

/** ONE straight geometry for the whole level — and it EQUALS the lip's span
 *  by design (see the header's reach-sum law): one `straight` is exactly the
 *  deck the arc line buys back when the lip replaces it.
 *  HISTORY: stage 3 unified the level's two straights (0.12/0.25) to ONE
 *  0.18 m geometry; the discoverability pass shortened the single geometry to
 *  0.09 m so the lip's span can trade against it deck-for-deck. */
const L02_STRAIGHT = 0.09;

/** L02's own `gapLip` geometry — span 0.09 m (= the straight's), launch 12°.
 *  Declared in `trayParams` because the par line never places it. */
const L02_LIP = { length: 0.02, angle: 12, blend: 0.05 };

/** L02's own `drop` geometry — the shared `KITCHEN_GAP` catch with longer
 *  leads (0.07 m) so the launched parabola AND the flat roll-off both meet
 *  the exit deck on this level's shorter run-up. This is the level's ONE
 *  deviation from the ladder's KITCHEN_GAP-chain convention, and the tray
 *  seats it here so par, arc and every player chain share it. */
const L02_DROP = { height: 0.12, angle: 45, radius: 0.02, lead: 0.07 };

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) }, // the books (fixture)
      { def: 'straight', params: { length: L02_STRAIGHT } }, // tray: counter lip
      { def: 'drop', params: L02_DROP }, // tray: the gap + its catch
      { def: 'straight', params: { length: L02_STRAIGHT } }, // tray: to the cup
      { def: 'finishCup' }, // fixture
      { def: 'curve', params: KITCHEN02_RUNOUT }, // fixture: the visible curve
    ],
    KITCHEN02_ID,
    1,
  );
}

/** The tempting arc route, kept as data so the test can prove both lines
 *  finish: the lip replaces the line's first straight (the tray's whole
 *  choice), the drop catches the launch, one straight runs out to the cup. */
export function kitchen02ArcBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.28) },
      { def: 'gapLip', params: L02_LIP },
      { def: 'drop', params: L02_DROP },
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
    par: { pieces: 3, time: 2.2 }, // 3 of the 4 tray pieces are placed on the par line (measured 2.17 — regenerate via pars)
    maxTime: 12,
    // the tray IS the union of the two lines — 4 pieces, no spare, and
    // EVERY order of ALL of them finishes (test-gated): the discoverability
    // fix for the two-stranger wall (see the header).
    tray: { straight: 2, gapLip: 1, drop: 1 },
    // the arc line's piece: the LAZY par line never places a `gapLip`, and a
    // tray kind's geometry otherwise comes from the par build's first
    // placement — without this declaration the piece the CHOICE exists for
    // would seat at kit defaults and break the reach-sum law both lines and
    // the place-everything gate are measured on.
    trayParams: { gapLip: L02_LIP },
    fixtures: { ramp: 1, finishCup: 1, curve: 1 },
    parBuild,
  }),
);
