/**
 * PORCH 01 — "Screen Door" (the sixth room's first rung: the flight, the
 * fail-timing law, and the porch's ONE doctrine — the shade is a look).
 *
 * The porch ladder is the studio's first ladder authored ENTIRELY under the
 * stage-4 fail-timing law (the L02 sweep's verdict: "the death clock is
 * ramp-end arrival + a constant ~0.4 s fall"). Every rung launches on the
 * −29°/0.16 m chute tool — the geometry kitchen02 measured to cap every
 * near-rail death at ~1.3 s — so this is also the first ladder whose clocks
 * are NOT the bathroom's: the porch clocks ARE kitchen02's clocks, stated
 * openly, with the threshold fantasy (the crossing from house to yard) and
 * the read-only weave as the new thing.
 *
 * THE DOCTRINE: the screen-door weave lays a checked parallelogram of shade
 * across the planks, and it changes NOTHING under the wheels. The ratified
 * set ships `HAZARDS` empty BY LAW (`src/sets/porch/data.ts` — the weave is
 * read-only rhythm, the flume trickle a timing tell), and this rung — like
 * every rung of this ladder — adds no live zone of its own: shadow is never
 * slippery, and a hazard the player is taught must be enforced physics
 * (rain is a later room's wave, not this one's). The honest wet-side
 * assertion for the whole porch ladder is garden01's: there is nothing here
 * to be wet about (`hazards` is EMPTY on all five rungs; the ladder test
 * pins it). The `prop:weaveShadow` first-sight line registers in the SET
 * module (the bathroom/garden precedent — unlike the garage's level-side
 * ask #8a, the porch's port brought its callout row with it).
 *
 * The physics is kitchen02's ARC line verbatim on the chute (launch, catch,
 * roll-out): tray = the exact three-piece multiset, every one load-bearing,
 * the reach-sum law intact (the lip's span IS the ladder's straight length).
 * Placing all three finishes byte-identically to the par; every omission
 * falls against the anchored fixtures; the whole-tray orders and the death
 * families are measured by the ladder test's sweep (`tmp/porch-sweep.mjs`
 * authored it; the test keeps the claim).
 *
 * This file also carries the SHARED porch authoring kit — the `PorchLevel`
 * data shape (the kitchen/bedroom/bathroom/garden/garage seam with the set
 * id swapped) and `porchLevel`/`registerPorch`, mirrors of `garageLevel`/
 * `registerGarage`. The placement math (`lay`, `startSocketFromBuild`,
 * `trayCount`) is imported from the family's kit in `kitchen01.level.ts`.
 */
import type { Build } from '../../track/build.ts';
import type { PieceKind, PieceParams } from '../../track/pieces.ts';
import type { Level } from '../level.ts';
import { rampLevelForDrop } from '../../feel/kittrack.ts';
import { lay, startSocketFromBuild, trayCount } from './kitchen01.level.ts';
import { registerLevel } from './feeltrack.level.ts';

/** A porch level: the contract's `Level` plus the tray/fixture/parBuild
 *  metadata, exactly the kitchen/bedroom/bathroom/garden/garage seam
 *  (Concepts/Levels §The data model). Porch rungs ship NO `hazards` field
 *  value other than the empty list — the doctrine above — and (porch02)
 *  `propSockets` for the threshold pair the Environment Artist builds to. */
export interface PorchLevel extends Level {
  set: 'porch';
  /** What the player may place, per kind. The tray. Sum = `budget`. */
  tray: Partial<Record<PieceKind, number>>;
  /** Geometry for a tray kind the PAR line never places (the `levelTrayParams`
   *  seam — same rule as the rest of the family). */
  trayParams?: Partial<Record<PieceKind, PieceParams>>;
  /** The reference build — fixtures plus the designer's line. */
  parBuild(): Build;
  sandbox?: boolean;
  /** Pieces the level ships built-in. Not in the tray; part of parBuild. */
  fixtures?: Partial<Record<PieceKind, number>>;
  /** EMPTY on every porch rung BY LAW — the weave shade is read-only rhythm
   *  (the ratified set ships `HAZARDS` empty) and a hazard this room teaches
   *  must be enforced physics first. The field exists for the seam; the
   *  ladder test asserts `hazards` is absent-or-empty on every rung. */
  hazards?: readonly never[];
  /** Named prop sockets the Environment Artist builds to — the threshold
   *  pair (porch02 exports it through its mount; the ride THROUGH the door
   *  is staging, the bathroom-drain / garden-bore / garage-wheel pattern). */
  propSockets?: Record<string, import('../../track/socket.ts').Socket>;
}

/** Fill the contract fields from the tray (mirror of `garageLevel`). */
export function porchLevel(
  def: Omit<PorchLevel, 'budget' | 'placeholderBuild' | 'par'> & {
    par: { time: number; pieces?: number };
    budget?: number;
  },
): PorchLevel {
  return {
    ...def,
    par: { pieces: def.par.pieces ?? trayCount(def.tray), time: def.par.time },
    budget: def.sandbox ? (def.budget ?? 999) : trayCount(def.tray),
    placeholderBuild: def.parBuild,
  };
}

/** Register on the shared level registry and keep the porch type. */
export function registerPorch(level: PorchLevel): PorchLevel {
  registerLevel(level);
  return level;
}

// ---- the shared porch ladder geometry --------------------------------------

/** The MORNING CHUTE: the fail-timing tool verbatim (kitchen02's measured
 *  −29°/0.16 m short steep launch, blend 0.12 — the blend is the tool's
 *  camera-framing knob, kept as measured). The porch's story endorses the
 *  tool: a Sunday-morning dash does not crawl down a −12° aisle, and the
 *  sweep's death-clock law needs exactly this: airborne off the ramp end
 *  ~0.55 s in, NOTHING dies later than ~1.3 s. */
export const POR_CHUTE_BLEND = 0.12;
export const PORCH_GEOM = {
  rampAngle: -29,
  rampBlend: POR_CHUTE_BLEND,
  release: 0.9,
} as const;

export function porchChute(): PieceParams {
  return {
    angle: PORCH_GEOM.rampAngle,
    blend: PORCH_GEOM.rampBlend,
    level: rampLevelForDrop(
      0.16,
      PORCH_GEOM.rampAngle,
      PORCH_GEOM.rampBlend,
      PORCH_GEOM.release * PORCH_GEOM.rampBlend,
    ),
  };
}

/** ONE straight geometry across the ladder: 0.11 m — kitchen02's plank,
 *  which EQUALS the lip's span (the reach-sum law: with flat sockets a
 *  chain's reach is the SUM of its spans, and the straight/lip swap is the
 *  family's choice-line equality). The porch's rails are the shortest in
 *  the house — the deck is a deck, not a hallway. */
export const PORCH_STRAIGHT = 0.11;

/** The ladder's `gapLip` — kitchen02's measured lip (span 0.11 by the law
 *  above, launch 12°). */
export const PORCH_LIP = { length: 0.0405, angle: 12, blend: 0.05 };

/** THE THRESHOLD GAP: kitchen02's measured `drop` — the 0.10 m step with
 *  0.125 m leads, the pair of thresholds (belly-gap kill ≥ 0.10 m,
 *  pop-catch window ≤ 0.10 m) that makes every wrong pair DIE and every
 *  intended line land. The porch deviation from the ladder's KITCHEN_GAP
 *  (0.12/0.05) is the same one L02 measured and for the same reason: this
 *  ladder lives inside the fail-timing law. */
export const THRESHOLD_GAP = {
  lip: PORCH_LIP,
  drop: { height: 0.1, angle: 45, radius: 0.02, lead: 0.125 },
};

/**
 * THE PINNED porch STEP — the porch's own trench geometry, authored once
 * in this kit file and shared by porch03 (its hard line) and porch04
 * (the capstone's tray). The ladder's stock `drop` (0.10 m / 45° with the
 * kitchen leads) tuned the LADDER's belly routes to ROLL their trenches
 * (kitchen03's par is a belly-over; garage01's `s → d → s` finishes) — and
 * on the porch those same routes ROLLED too (the sweep caught a belly
 * beating a par). The porch step KILLS the belly visibly instead: height
 * 0.14 (wedge depth ≥ 2 ball radii + clearance), angle 55° (an entry face
 * steeper than the ball can roll out of), radius 0.005 (a corner that
 * stops defining a smooth surface at ball scale), lead 0.125 (the belly
 * line LEAVES the surface before the face — it lands, it does not crawl).
 * THE SPAN IS PRESERVED (≈ 0.35 m, the stock 0.14 + 0.20/cos45 — the lead
 * replaces the stock's 0.14 flat under the arc, the descent lands at the
 * same plane): tray reach arithmetic across the porch is the stock
 * trench's, so the step is a killer only in the BELLY case, never in the
 * pop-catch (the porch04 order sweep: 24/24 still finish). Tuned by
 * `tmp/porch-tune.mjs`; pinned by `tests/unit/porch-levels.test.ts`.
 */
export const PORCH_STEP = {
  height: 0.14,
  angle: 55,
  radius: 0.005,
  lead: 0.125,
};

/**
 * THE SINK — the porch's soft landing (kit geometry, used by porch04's
 * carry line and porch05's soft catch; the tuning war in porch03's header
 * is why it is NOT in porch03's tray). A LONG 21° ramp — span ≈ the
 * pinned step's (0.35, by this level) so the tray's reach sums stay equal
 * wherever a sink appears — that swallows a pop without braking it: land
 * ON it, keep your speed; land on the STEP and you pay. porch03's war
 * taught the doctrine: the sink lives only in trays where EVERY par line
 * still needs a pop to reach the cup, so it can never become a universal
 * bridge.
 */
export const PORCH_SINK = { level: 0.245, angle: 21, blend: 0.06 };

export const PORCH01_ID = 'porch01';

function parBuild(): Build {
  return lay(
    [
      { def: 'ramp', params: porchChute() }, // the hall-side step (fixture) — the chute tool
      { def: 'gapLip', params: THRESHOLD_GAP.lip }, // tray: the launch off the step
      { def: 'drop', params: THRESHOLD_GAP.drop }, // tray: the threshold + its catch
      { def: 'straight', params: { length: PORCH_STRAIGHT } }, // tray: the plank to the cup
      { def: 'finishCup' }, // fixture — the cup on the stoam line
    ],
    PORCH01_ID,
    1,
  );
}

export const PORCH01: PorchLevel = registerPorch(
  porchLevel({
    id: PORCH01_ID,
    name: 'Screen Door',
    set: 'porch',
    seed: 1,
    startSocket: startSocketFromBuild(parBuild(), PORCH_GEOM.release * PORCH_GEOM.rampBlend),
    par: { time: 1.1 }, // measured ~1.07 on the chute arc line (regenerate via `npm run pars`)
    maxTime: 12,
    // the tray IS the par line's multiset (3 = budget, all load-bearing).
    tray: { gapLip: 1, drop: 1, straight: 1 },
    fixtures: { ramp: 1, finishCup: 1 },
    parBuild,
  }),
);

/** Re-export the kit math the sibling rungs import (the garage file's
 *  re-export convention). This ladder ships NO `wetPatchOverSeam` — there
 *  is no zone to centre (the doctrine at the top of this file). */
export { lay, startSocketFromBuild, trayCount };
