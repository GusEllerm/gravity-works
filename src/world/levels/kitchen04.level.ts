/**
 * KITCHEN 04 — "The Tap" (the set's hazard enters).
 *
 * The dripping tap wets a patch of counter, and the patch HALVES GRIP. As
 * data that is this level's `hazards` entry (a `WetPatch`: centre, radius,
 * `gripFactor: 0.5`) — since stage 3 the `World` DOES read zones, through
 * `src/world/hazards.ts` (the ask to the Feel Engineer, one per-contact
 * grip region hook, delivered). The tap drips visibly upstream of the patch
 * at all five canonical cameras: affordance before hazard.
 *
 * STAGE-3 LEARNABILITY PASS (Playtest G HARD-WALL: nine L04 attempts, every
 * tray combo, "nose-first"/"flew off", quit). Reproduced headlessly in the
 * mount the SHIPPED builder makes (`initialBuild` anchors the fixtures, the
 * tray pieces chain off them): all nine of G's builds fall exactly as
 * reported — and the diagnosis is the TRAY, not the physics:
 *
 * - The tray held FIVE pieces for a FOUR-piece answer (`straight` ×2 for a
 *   line that uses one). "Which 4 of 5?" is a guess-space, and every wrong
 *   subset fails harshly (the sink is a hole). This is the one rung of the
 *   ladder that asked the player to guess a SUBSET; L01/L03/L05 all place
 *   their whole tray, and G cleared those in 1–3 tries.
 * - The "second line" the card used to promise (the ground line decks the
 *   sink with two loose straights and drives through the patch) cannot
 *   reach the anchored cup at all: a bridged deck ends at the RAMP's deck
 *   height, 0.176 m ABOVE the cup entry the chained par leaves it at, and
 *   38 cm short of it (measured `fell` at 2.675 s — Concepts/Levels §"the
 *   same data replayed the way the BUILDER mounts it", ask #2b). With all
 *   kit sockets flat, a chained line's reach and exit height are
 *   order-invariant piece SUMS, so no subset of this tray that bridges the
 *   sink can also terminate at a low-run cup: on one anchored rail the
 *   fly line is the ONLY buildable line, whatever the tray says.
 *
 * The redesign is therefore the honest one: the tray IS the par line's
 * multiset (4 = budget, every piece load-bearing), which makes the sink
 * crossable by ELIGIBILITY instead of guessing — every chain of the whole
 * tray reaches the cup deck-to-deck (24/24 orders finish, 2.47–3.12 s,
 * test-asserted), so the lesson is the ORDER question the rung already
 * teaches upstream, and the par ORDER is beatable (`drop→landing→straight→
 * gapLip` runs 2.47 s against a 2.52 s par). The wet patch keeps its exact
 * authored data (the tap's drip lands in it — set-wiring). STAGE-4 K4
 * TAP-WALL PASS (Playtest R, headless on the builder mount): the old claim
 * that NO finishing line touches the zone was only true of the FLY lines —
 * 10 of the 24 whole-tray orders stand a deck across the sink's near half
 * and ROLL THROUGH the zone (grip 0.5 for 0.11–0.29 s) yet still finish,
 * at 2.53–2.61 s, inside the fly lines' own 2.47–3.12 s span. The patch is
 * a TELLS with a COSTLESS toll on the tray today: it bites where a decked
 * order rolls, it kills nothing (every wet-touching order finishes), and
 * one 3-piece order (`gapLip→straight→landing`, the tray minus `drop`)
 * even FINISHES wet where it `fell` dry — the ladder's wet-can-rescue
 * property (bathroom03's twin), test-pinned. Playtest R's wall itself was
 * neither the tray nor the zone: all three tries rode a REVERSED `gapLip`
 * mount (the R flag left up by an empty-handed press) — pinned falling at
 * the sink (2.192 s, nose −54°) and past the cup (2.533 s) with the SAME
 * note text; advice honesty for reversed mounts is a note-side ask
 * (`Sessions/2026-10-09 Stage 4 - K4 tap wall`, handoff to
 * `src/ui/result.ts`). The grip physics of the patch are still measured
 * — on `kitchen04GroundBuild()`, the HAZARD/JUICE PROBE: its hash diverges
 * wet vs dry and it runs faster wet (low-drag plastic,
 * [[Modules/hazards]]). It is not a route, and the card says so.
 */
import { KitRig } from '../../feel/kittrack.ts';
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
  type WetPatch,
} from './kitchen01.level.ts';

export const KITCHEN04_ID = 'kitchen04';

/** ONE straight geometry for the level: 0.3 m — the size the stage-3
 *  coherence pass pinned so the tray's single seating is the geometry both
 *  the par run-out and the ground PROBE deck the sink with. The tray holds
 *  `straight` ONCE now (the spare copy was the guess-space that walled
 *  Playtest G — see the header); the probe build below still chains two,
 *  as pure data the tray does not have to afford. */
const L04_STRAIGHT = 0.3;

/** Piece indices in the par chain (for the wet-patch placement maths). */

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) }, // the books (fixture)
      { def: 'gapLip', params: KITCHEN_GAP.lip }, // tray: the sink's edge
      { def: 'drop', params: KITCHEN_GAP.drop }, // tray: the sink
      { def: 'landing', params: KITCHEN_GAP.landing }, // tray
      { def: 'straight', params: { length: L04_STRAIGHT } }, // tray: past the wet
      { def: 'finishCup' }, // fixture
    ],
    KITCHEN04_ID,
    1,
  );
}

/** The ground build — the HAZARD AND JUICE PROBE, not a player route. Two
 *  straights deck the sink at ramp height and the car drives THROUGH the
 *  wet patch: this is the build `tests/unit/hazards.test.ts` and the juice
 *  tell-window test replay to prove the zone hook bites (hash diverges wet
 *  vs dry, finishes faster wet) and `wetPatch()` below centres the zone on.
 *  Kept byte-identical ON PURPOSE — the patch centre, the tap's yaw and the
 *  par's grip-independence claim all key off its seam. It is NOT tray-
 *  placable (its bridged deck could never reach the anchored cup anyway —
 *  the header states the measured `fell`) and since the learnability pass
 *  it is not counted as an authored LINE by the tray ⊇ gate.
 *  Exported as data so those tests can replay it. */
export function kitchen04GroundBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) },
      { def: 'straight', params: { length: L04_STRAIGHT } },
      { def: 'straight', params: { length: L04_STRAIGHT } },
      { def: 'finishCup' },
    ],
    KITCHEN04_ID,
    1,
  );
}

/** The wet patch sits under the tap's drip at deck height, over the sink's
 *  far rim — the ground probe's decked-sink seam drives across it and the
 *  par line flies past it. Centred from the GROUND build's straight seam —
 *  the decked-over sink's middle. (Stage-3 placement fix, Feel Engineer:
 *  this used to be centred from the PAR rig's landing run, which — now the
 *  zone hook exists — sits ON the par line's own deck and contradicts this
 *  file's own design claim. The hazard contract (Concepts/Levels §Hazards
 *  as data) is "the PAR line is grip-independent"; measured with the hook
 *  live, this centre gives par wet == par dry bit-for-bit, and the ground
 *  probe's hash diverges and finishes. See Modules/hazards §L04 placement
 *  fix. The set mount yaws the kitchen −45° so the tap's `drip` anchor maps
 *  onto this exact centre — do not move it without re-solving
 *  `TAP_LEVEL` in `src/world/setPlacement.ts`.) */
function wetPatch(): WetPatch {
  const build = kitchen04GroundBuild();
  const rig = new KitRig(build, 10);
  const p = rig.frameAt(rig.starts[2]!).pos;
  return {
    id: 'sinkSplash',
    kind: 'wetPatch',
    center: { x: p.x, y: p.y, z: p.z },
    radius: 0.14,
    gripFactor: 0.5,
    source: 'tap',
  };
}

export const KITCHEN04: KitchenLevel = registerKitchen(
  kitchenLevel({
    id: KITCHEN04_ID,
    name: 'The Tap',
    set: 'kitchen',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), KITCHEN_GEOM.release * KITCHEN_GEOM.rampBlend),
    par: { pieces: 4, time: 2.52 }, // the tray IS the par line's multiset (4/4 placed; measured — regenerate via pars)
    maxTime: 12,
    // The tray is the EXACT multiset the par line places (learnability pass —
    // the spare `straight` was the "which 4 of 5" guess-space that walled
    // Playtest G at nine tries; every whole-tray chain reaches the cup, so
    // placing everything always works and nothing needs to be guessed).
    tray: { gapLip: 1, drop: 1, landing: 1, straight: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [wetPatch()],
    parBuild,
  }),
);
