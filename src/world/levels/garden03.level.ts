/**
 * GARDEN 03 — "The Sprinkler" (the TRADE-OFF: the dry high line, or the
 * wet shortcut — grip vs time, the garden's own hazard verb).
 *
 * The sprinkler is the garden's variant of the wet patch — the AD ported
 * it into the ratified set as the timed gate the concept asked A for ("a
 * hazard that is pure vertical motion in a set of straights"). The hazard
 * system has ONE kind today, `WetPatch` (a static disc, `src/world/
 * hazards.ts`), so what ships is the SPRAWL it leaves on the paving: an
 * always-on spray zone, `source: 'sprinkler'`. The TIMING half — a head
 * that cycles, a gate you read off its duty cycle — is a new hazard KIND
 * (`sprinkler`: centre, radius, phase/period) requested of the Systems
 * Engineer in the session log; until it exists the rung makes the
 * always-wet claim and no timing claim, and the card says only what the
 * solver runs.
 *
 * The lesson is bathroom03's tightest statement re-staged under the sun:
 * the PAR takes the HIGH, DRY route (the hard `drop` catch, deck crossing
 * below the spray band — grip-neutral to the bit), the WET SHORTCUT swaps
 * the `drop` for the long soft `landing` whose deck rolls THROUGH the
 * sprawl. It finishes (chained; against the anchored cup it does not
 * reach — ask #2b, pinned), its hash DIVERGES wet vs dry, and the honest
 * delta is the low-drag one [[Modules/hazards]] measures on straights:
 * sprinkler-wet BEATS sprinkler-dry yet STILL loses to the dry high line.
 * Grip vs time stated exactly as the solver lives it: on channel straights
 * half grip is LOW DRAG, and even that toll-free shortcut loses to height.
 *
 * Zone placement follows the bathroom03 lesson: centred DEEP on the soft
 * line's OWN landing deck (a seam-centred draft lets the par's step-top
 * graze the band — measured, fixed there). Tray ⊇ par holds: one 0.20 m
 * `straight` on both lines, `trayParams` declares the `landing` the par
 * never places.
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
  GARD_STRAIGHT,
  gardenLevel,
  registerGarden,
  type GardenLevel,
} from './garden01.level.ts';

export const GARDEN03_ID = 'garden03';

/** The wet shortcut's catcher: the longer, gentler landing whose deck dips
 *  into the spray — the piece the par line never places, declared in
 *  `trayParams` so it seats at this geometry (bathroom03's SOFT twin). */
const SPRINKLER_CATCH = { level: 0.32, angle: 12, blend: 0.06 };

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) }, // the shed-roof line (fixture)
      { def: 'straight', params: { length: GARD_STRAIGHT } }, // tray: the deck run
      { def: 'gapLip', params: BORE_GAP.lip }, // tray: the launch off the roof
      { def: 'drop', params: BORE_GAP.drop }, // tray: the HARD, DRY catch
      { def: 'straight', params: { length: GARD_STRAIGHT } }, // tray: the sunny run-out
      { def: 'finishCup' }, // fixture
    ],
    GARDEN03_ID,
    1,
  );
}

/** The WET SHORTCUT: the same launch, the soft `landing` whose deck sits
 *  in the spray. Both lines finish in the chained model; the hard dry
 *  catch is the faster clock, and the soft line's hash is the wet one
 *  (asserted in `tests/unit/garden-levels.test.ts`). */
export function garden03SprinklerBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: kitchenRamp(0.3) },
      { def: 'straight', params: { length: GARD_STRAIGHT } },
      { def: 'gapLip', params: BORE_GAP.lip },
      { def: 'landing', params: SPRINKLER_CATCH }, // the soft catch, low in the spray
      { def: 'straight', params: { length: GARD_STRAIGHT } },
      { def: 'finishCup' },
    ],
    GARDEN03_ID,
    1,
  );
}

/** The sprinkler sprawl: centred DEEP on the wet line's own landing deck
 *  (bathroom03's fix, reused verbatim — a wheel rolling the shortcut is
 *  inside the band; the par's hard-catch deck crosses the same x BELOW the
 *  band with its wheels airborne over the first half — grip-neutral by
 *  measurement, pinned wet == dry). `source: 'sprinkler'` names the head
 *  the sprawl belongs to; the cycling head itself is the session-log ask
 *  (a timed `sprinkler` hazard kind on the data model). */
function sprinklerSprawl(): WetPatch {
  const build = garden03SprinklerBuild();
  const rig = new KitRig(build, 1);
  // deep on the soft catcher's own deck (piece 3: ramp, straight, gapLip,
  // landing) — 0.26 m in, past the PAR line's `drop` step-top, exactly the
  // depth bathroom03 measured the par's step cannot graze.
  const p = rig.frameAt(rig.starts[3]! + 0.26).pos;
  return {
    id: 'sprinklerSprawl',
    kind: 'wetPatch',
    center: { x: p.x, y: p.y, z: p.z },
    radius: 0.12,
    gripFactor: 0.5,
    source: 'sprinkler',
  };
}

export const GARDEN03: GardenLevel = registerGarden(
  gardenLevel({
    id: GARDEN03_ID,
    name: 'The Sprinkler',
    set: 'garden',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), GARD_GEOM.release * GARD_GEOM.rampBlend),
    // 4 of the 5 tray pieces are placed on the par (dry, high) line —
    // measured, regenerate via `npm run pars`.
    par: { pieces: 4, time: 2.7 },
    maxTime: 12,
    tray: { straight: 2, gapLip: 1, drop: 1, landing: 1 },
    trayParams: { landing: SPRINKLER_CATCH },
    fixtures: { ramp: 1, finishCup: 1 },
    hazards: [sprinklerSprawl()],
    parBuild,
  }),
);
