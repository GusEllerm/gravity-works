/**
 * GARDEN 04 — "Golden Hour" (the capstone: everything, one tray, no
 * guesses — with the garden's own signature, a live sprinkler sprawl,
 * under the whole line, at the ratified low sun).
 *
 * Every garden verb on one line: the slab deck run (02's lazy work), the
 * launch off the bench (02's showy half), the gap dip-and-catch (01's
 * flight verb on the ground), and the soft run-out — four pieces, the
 * WHOLE tray, all load-bearing. The Playtest-G lesson as architecture: the
 * tray IS the par line's exact multiset, and with every kit socket flat a
 * whole-tray chain's reach is an order-invariant sum, so EVERY ORDER
 * finishes (24/24 gate, test-gated exactly like kitchen04's, bedroom04's
 * and bathroom04's — this rung deliberately inherits that sweep's seating,
 * the 0.3 m run-out, because its lesson IS the order-invariant whole-tray
 * sum). The LINE CHOICE the brief asks the capstone to combine is the one
 * this economy can honestly afford: with the whole tray in hand your
 * ORDERING is the line you pick, every ordering reaches the cup, and the
 * clock is the reward (the par ORDER is beatable — measured). The
 * hill/berm line-choice the exploration's C variant wanted needs the track
 * system's elevation profile (the AD re-homed C's ramps to the Track Kit
 * backlog exactly as bedroom C's springs went) — stated in the card, not
 * faked by a `drop`; the stepping stones are variant C's props, and the
 * ratified deck's gravel crossing is their STANDING IN — laid stone the
 * car rolls like any slab, which is the point the ladder keeps making:
 * what READS differently need not DRIVE differently, and what DRIVES
 * differently says so (the sprinkler sprawl is live; the shadows never
 * are).
 *
 * The COMBINE half that makes this the garden's capstone and not a re-run:
 * the sprinkler's sprawl is a LIVE grip zone under the flight window (03's
 * hazard at 01's flight), centred by the bathroom04 convention — above the
 * par line's landing-entry x at the DECKED (probe) height, so the zone's
 * near edge starts past the par's `drop` step-top. Every whole-tray order
 * crosses the sprawl airborne or on the low catch deck, so the rung's
 * claim is the strongest in the ladder: par replays BIT-IDENTICAL wet vs
 * dry and the dry sweep doubles as the wet sweep (asserted). The tell is
 * the wet paving; the toll is only for a line the tray cannot build.
 */
import type { Build } from '../../track/build.ts';
import { KitRig } from '../../feel/kittrack.ts';
import {
  kitchenRamp,
  lay,
  startSocketFromBuild,
  type WetPatch,
} from './kitchen01.level.ts';
import {
  BORE_GAP,
  GARD_GEOM,
  gardenLevel,
  registerGarden,
  type GardenLevel,
} from './garden01.level.ts';

export const GARDEN04_ID = 'garden04';

/** The run-out geometry, pinned to the kitchen-L04/bedroom04/bathroom04
 *  sweep's 0.3 m (header): the order-invariance proof lives at this
 *  seating. */
const SWEEP_STRAIGHT = 0.3;

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) }, // the potting bench at low sun (fixture)
      { def: 'straight', params: { length: SWEEP_STRAIGHT } }, // tray: the slab deck run
      { def: 'gapLip', params: BORE_GAP.lip }, // tray: the launch
      { def: 'drop', params: BORE_GAP.drop }, // tray: the gap's dip-and-catch
      { def: 'landing', params: BORE_GAP.landing }, // tray: the soft run-out
      { def: 'finishCup' }, // fixture
    ],
    GARDEN04_ID,
    1,
  );
}

/** The hazard PROBE, not a player route (the kitchen04 convention): ONE
 *  long deck laid across the gap rolls straight through the sprawl the
 *  par flies. The tray cannot build it (its `straight` seats at 0.3, not
 *  0.62) — the patch stays a TELLS-not-a-TOLL for every buildable line.
 *  Exported as data so the tests can replay it. */
export function garden04ProbeBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.26) },
      { def: 'straight', params: { length: 0.62 } },
      { def: 'straight', params: { length: 0.15 } },
      { def: 'finishCup' },
    ],
    GARDEN04_ID,
    1,
  );
}

/** The sprawl: centred above the gap's mouth — the par line's LANDING-
 *  entry x, at the DECKED (probe) y. Deliberately not the probe's seam
 *  (the bathroom04 lesson: the seam-centred draft lets the par's `drop`
 *  step-top graze the band); this centre starts the zone x-range past the
 *  step (par crosses on the low catch deck only) while the probe's long
 *  deck is still high and wet under it at that x. */
function sprinklerSprawl(): WetPatch {
  const rig = new KitRig(parBuild(), 1);
  const x = rig.frameAt(rig.starts[4]! + 0.06).pos.x; // into the par's landing
  const y = rig.frameAt(rig.starts[1]!).pos.y; // the decked/ramp-exit deck line
  return {
    id: 'sprinklerSprawl',
    kind: 'wetPatch',
    center: { x, y, z: 0 },
    radius: 0.14,
    gripFactor: 0.5,
    source: 'sprinkler',
  };
}

export const GARDEN04: GardenLevel = registerGarden(
  gardenLevel({
    id: GARDEN04_ID,
    name: 'Golden Hour',
    set: 'garden',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), GARD_GEOM.release * GARD_GEOM.rampBlend),
    par: { time: 2.7 }, // the whole tray placed — measured, regenerate via `npm run pars`
    maxTime: 12,
    // the tray IS the answer: 4 pieces, every one load-bearing.
    tray: { straight: 1, gapLip: 1, drop: 1, landing: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [sprinklerSprawl()],
    parBuild,
  }),
);
