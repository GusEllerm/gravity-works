/**
 * KITCHEN 02 — "Two Ways" (the choice level). STAGE-4 SECOND PASS (level
 * designer): the discoverability pass's geometry still funneled EVERY wrong
 * build into one invisible death. Both stage-4 playtests died at the SAME
 * time — 2.2–2.4 s, "car vanished out of sight" for all nine distinct wrong
 * builds AND on first tries — so nothing in the fail stream said WHICH
 * mistake was made. The predecessor's standing finding said why: with the
 * shared ramp convention (`kitchenRamp(0.28)`, −12°, a 1.43 m crawl) the
 * ramp-end arrival clock alone runs ~1.8 s, and every wrong chain then
 * covers a similar ramp+flight+fall to a similar near-cup death. This pass
 * executed their sweep instruction — steep launch ramps × void sizes, ~25
 * 000 headless worlds on the shipped mount — and the sweep's verdict is the
 * headline: THE DEATH CLOCK IS THE RAMP-END ARRIVAL + A CONSTANT ~0.4 s
 * FALL; the "ramp angle" moves it mainly through its HEIGHT, and a wrong
 * build can only die EARLY if it dies where it can see the rail it must
 * cross. So L02 now STEERS the release into the void itself.
 *
 * THE GEOMETRY (all local to this level; the ladder's −12° kitchen ramp
 * convention is deliberately deviated from, like L04 deviates its gap):
 *   ramp — a short steep chute: 0.16 m of drop at −29° (vs the ladder's
 *     −12° convention) with a 0.14 m blend; the car is airborne
 *     at the ramp end ~0.55 s after launch, so NOTHING can die later than
 *     ~1.3 s, and the level's whole fail stream compresses from 2.2–2.5 s
 *     into three VISIBLE families (below);
 *   one `straight` geometry, 0.11 m, EQUAL to the lip's span (the reach-sum
 *     law from the discoverability pass is kept intact — chain sums stay
 *     order-invariant, which is what makes place-everything finish);
 *   the `gapLip` is lengthened (0.0405) so its span matches the new
 *     straight; launch angle stays 12°;
 *   the `drop` is one ladder deviation deeper than it looks: a 0.10 m step
 *     (shallower than the ladder's 0.12) with 0.125 m leads — the sweep
 *     found the two thresholds only coexist at this pair: the belly-gap
 *     kill (every pair gap ≥ 0.10 m wedges or falls) and the pop-catch
 *     window (the lip's 12° parabola and the flat release line both meet
 *     the exit deck). At the 0.12 m step no lead value stopped the
 *     `gapLip → drop` pair wedge-capturing the cup lip and finishing at par
 *     speed; at 0.10 every 2-piece build dies.
 *
 * WHAT THE PLAYER NOW LEARNS FROM FAILING (measured on the shipped mount,
 * every chainable build enumerated — see the test):
 *   ~0.9 s family — bare ramp, one piece, or two flat pieces: the release
 *     line flies off the ramp end into the void right at the rail;
 *   ~1.05 s family — three flats, or flat+lip: the deck bridges to the near
 *     lip and the car lands IN the void a rail-length out;
 *   ~1.25 s family — any pair that includes the drop: the drop's catch is
 *     visibly crossed and the car falls at the FAR side of the drop deck —
 *     the "the deck must REACH the cup, the drop only catches it" lesson;
 *   ~1.15 s — bridge+lip combos catapult short into the same void.
 * Nothing flies past the cup any more (last-airborne x of every failing
 * build is 0.86–1.22 vs cup mouth at 0.99 — the test gates death x on the
 * corrected metric; the first pass's x-gate sampled cars ALREADY on the
 * floor, whose x keeps drifting ~0.5 m and hid flyovers up to x≈2.1).
 *
 * THE CHOICE still stands, and the law that makes it honest still stands:
 *   the LAZY line — `straight`, `drop`, `straight` — 3 of 4, the par, 1.01 s;
 *   the ARC line — `gapLip` launch, `drop` catch, one `straight` — 3 of 4,
 *     1.07 s: the pop over the level's own deck costs the hop, honestly
 *     slower (bedroom03's precedent for a small measured margin);
 *   the par is BEATABLE: `drop → straight → straight` runs 0.99 s under the
 *     1.05 par — order, not subset, is the speed question (kept from the
 *     first pass);
 *   placing ALL FOUR tray pieces (the tray is still exactly the union —
 *     2 straights, 1 gapLip, 1 drop, par multiset = tray) finishes in EVERY
 *     order — 12/12, 1.01–1.16 s — the place-everything gate, and every
 *     order now also finishes FASTER than the old level ran.
 * Robustness re-measured across seeds 1–6 and launch speeds ×1.0–1.1.
 *
 * KNOWN MEASURED EDGE (kept honest, pinned in the test): the fail table IS
 * the edge list — every build short of a line dies. The discoverability
 * pass's pinned fluke, `straight → straight → gapLip`, once a 2.20 s
 * FINISHER, now falls in the void at ~1.14 s, and the `gapLip → drop` pair
 * that wedge-captured the cup lip at the old 0.12 m step dies at ~1.3 s.
 * Across ~25 000 swept geometries the sweep found no cell on this
 * architecture where a wrong build finishes.
 *
 * The rung this level was specced to add — a drivable mid-run `curve` — is
 * still BLOCKED (see Concepts/Levels §Piece request 1). The curve remains a
 * FIXTURE past the cup — built, colliding, railable, run-out style — and the
 * timed run ends at the cup.
 */
import type { Build } from '../../track/build.ts';
import { rampLevelForDrop } from '../../feel/kittrack.ts';
import {
  KITCHEN_GEOM,
  lay,
  registerKitchen,
  kitchenLevel,
  startSocketFromBuild,
  type KitchenLevel,
} from './kitchen01.level.ts';

export const KITCHEN02_ID = 'kitchen02';

/** L02's own launch ramp: short and steep (the stage-4 sweep's finding —
 *  the death clock is ramp-end arrival + fall, so a 0.16 m chute caps every
 *  death near the rail at ~1.3 s). 0.28 m / −12° was the clustering engine. */
/** L02's own launch ramp: short and steep (the stage-4 sweep's finding —
 *  the death clock is ramp-end arrival + fall, so a 0.16 m chute caps every
 *  death near the rail at ~1.3 s). 0.28 m / −12° was the clustering engine.
 *  The BLEND is its own knob too: 0.12 m (vs the ladder's 0.08) — measured
 *  on the camera contract, the −29° chute's tangent rotated fast enough per
 *  metre that the run camera's arc smoothing left it pitched down the chute
 *  while the car was already at the drop (car high in frame, |ndc| 0.99 >
 *  the 0.95 gate); the longer blend eases that rotation to 0.89. (0.14 also
 *  clears the camera but STALLS one whole-tray order and lets a 2-piece
 *  fly the gap — the rail laws are NOT blend-invariant, they shift with the
 *  longer exit; 0.12 keeps every one of them.) */
const L02_RAMP_BLEND = 0.12;
const L02_RAMP = {
  angle: -29,
  blend: L02_RAMP_BLEND,
  level: rampLevelForDrop(0.16, -29, L02_RAMP_BLEND, KITCHEN_GEOM.release * L02_RAMP_BLEND),
};

/** The fixture run-out past the cup (visible curve; the timed run ends first). */
export const KITCHEN02_RUNOUT = { radius: 1.2, angle: 40 };

/** ONE straight geometry for the whole level — and it EQUALS the lip's span
 *  by design (the reach-sum law the discoverability pass proved): one
 *  `straight` is exactly the deck the arc line buys back when the lip
 *  replaces it. HISTORY: stage 3 unified the level's two straights to ONE
 *  0.18 m; the discoverability pass shortened it to 0.09 (= the 0.02 lip's
 *  span); the stage-4 fail-timing pass lengthened the pair to 0.11 so the
 *  two-piece belly gap (always exactly one straight, by the same law) sits
 *  past the measured 0.10 m wedge-capture threshold — every pair now dies. */
const L02_STRAIGHT = 0.11;

/** L02's own `gapLip` geometry — span 0.11 m (= the straight's, by the law
 *  above; the 0.0405 deck length is what the 12° + blend geometry needs to
 *  span it), launch 12°. Declared in `trayParams` because the par line
 *  never places it. */
const L02_LIP = { length: 0.0405, angle: 12, blend: 0.05 };

/** L02's own `drop` geometry — a 0.10 m step (the sweep's threshold
 *  coexistence: ≥ 0.10 m so a pair's belly gap never wedge-captures the cup
 *  lip, ≤ 0.10 m so the lip's pop and the flat release line both meet the
 *  exit deck) and 0.125 m leads. This is the level's one deviation from the
 *  KITCHEN_GAP-chain convention; the tray seats it here so par, arc and
 *  every player chain share it. */
const L02_DROP = { height: 0.1, angle: 45, radius: 0.02, lead: 0.125 };

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: L02_RAMP }, // the books (fixture)
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
      { def: 'ramp', params: L02_RAMP },
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
    startSocket: startSocketFromBuild(parBuild(), KITCHEN_GEOM.release * L02_RAMP_BLEND),
    par: { pieces: 3, time: 1.05 }, // 3 of the 4 tray pieces are placed on the par line (measured 1.01, ceil-to-0.05 — regenerate via pars)
    maxTime: 12,
    // the tray IS the union of the two lines — 4 pieces, no spare, and
    // EVERY order of ALL of them finishes (test-gated): the discoverability
    // fix, kept from the first pass and still true at the new geometry.
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
