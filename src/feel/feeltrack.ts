/**
 * Feel track v2 — the permanent test level as a track-kit `Build`
 * (docs/vault/Concepts/Feel.md §The feel track; §7.5 of the brief).
 *
 * Chain of kit pieces: 30 cm drop (a solid `ramp` plunged at -30°, so a car
 * at rest starts moving with no launch velocity — the honest "released from
 * a 30 cm drop" of Feel.md) -> short straight -> banked turn -> loop at the
 * threshold radius -> gap lip (the gap is the lip's own empty span) ->
 * landing -> finish cup on its own short straight.
 *
 * This replaces the chord-slab provisional track of stage 1, whose slab
 * stitching produced the false-deceleration findings (see `Modules/feel.md`
 * for the successor note; the slab code lives in git history). Colliders are
 * now the kit's merged-run convex hulls built from the SAME spline samples
 * as the mesh — `src/feel/kittrack.ts` does the rigging.
 */
import * as THREE from 'three';
import { chain } from '../track/build.ts';
import type { PieceKind, PieceParams } from '../track/pieces.ts';
import { KitRig, rampLevelForDrop } from './kittrack.ts';

// ---- geometry constants (world metres / degrees) ----------------------------

/** The brief's 30 cm drop. */
export const DROP_HEIGHT = 0.3;
/** Pitch of the feel track's drop ramp. Sized so the bottom transition is
 *  drivable: blend radius >= v^2 / (1 g) at the measured ramp-exit speed. */
export const DROP_RAMP_ANGLE = 12;
/** Pitch of the roll rig's drop ramp (stage-1/2 honest rig: gentle ramp). */
export const ROLL_RAMP_ANGLE = 12;
/** Pitch of the loop-threshold rig's release ramp (steep: the friction
 *  budget for a loop gate needs the least possible horizontal run). */
export const LOOP_RAMP_ANGLE = 60;
/** Blend arc used by the roll rig's ramp. */
export const ROLL_RAMP_BLEND = 0.08;
/** Blend of the feel track's drop ramp. */
export const DROP_BLEND = 0.08;
/** Free-fall height of the feel track's drop (world m). The timed run needs
 *  real speed: a 0.3 m drop cannot deliver BOTH the loop-completion gate
 *  (> 1.21 m/s at this radius) AND the 9 cm gap jump after the loop climb,
 *  so the feel track drops 0.45 m. (The §7.1 roll-metric rig keeps its
 *  canonical 0.3 m.) */
export const FEEL_DROP_HEIGHT = 0.45;
/**
 * Loop radius on the feel track, chosen by the LOOP GEOMETRY RULE
 * (docs/vault/Concepts/Feel.md §Loop geometry), not by taste:
 *
 *   R >= 1.25 x car LENGTH = 1.25 x 0.750 sim = 0.9375 sim = 0.0938 world m
 *   (equivalently inner diameter 2R >= 2.5 x WHEELBASE; here 2R = 3.7 WB)
 *
 * The old 0.03 sat BELOW the rule: the loop's own diameter (0.3 sim) was
 * shorter than the 0.75-sim car, so the car physically could not run inside
 * it — every "completion" at that radius was a ballistic hop through the
 * loop's empty interior. 0.10 is the rule with a 7 % margin (it is also the
 * radius whose measured threshold lands in the §7.1 [2.25, 2.75] R band:
 * see the session log 2026-10-05 loop-geometry entry).
 */
export const LOOP_RADIUS = 0.10;
/** Lead straights inside the loop piece. */
export const LOOP_LEAD = 0.03;
/** Gap-lip parameters (the empty arc IS the gap — Track Kit decision). */
export const LIP_LEN = 0.1;
export const LIP_BLEND = 0.05;
export const LIP_RISE_BLEND = 0.05;
/** Release point inside the first blend arc, as a fraction of the blend. */
export const RELEASE_FRACTION = 0.9;
/** Flat run-out of the roll rig (world m — plenty for the ~2.5 m target). */
export const ROLL_FLAT_LENGTH = 5;

/** The feel track's piece order. The `curve` is required, not decoration:
 *  a kit `bank` ends yawed by its angle (banking flattens at the socket but
 *  yaw does not — pieces.ts design note), so without a return the loop would
 *  seat turned 45° and its circle would lie in a tilted plane. The mirrored
 *  `curve` arc hands the car back to a straight, level line so the loop
 *  keeps a true vertical plane, and the whole layout is a lane-width S
 *  like real Hot Wheels track. */
/** The feel track's piece order. Every kit piece the §7.5 brief lists, in a
 *  layout a 1:64 car can actually drive: the banked turn and its return come
 *  AFTER the finish cup, Hot-Wheels-style, so the timed run is the drop →
 *  bank-free loop → jump section and the bank stays on the track (built,
 *  colliding, camera-railed) as the post-cup run-out. This ordering is a
 *  measured decision, not taste: the four-ray chassis has no physical
 *  channel contact, and on a banked yaw arc taken MID-run every lateral
 *  model tried this session (tyre scrub, caster tyres, weathervane torque,
 *  compliant channel-wall springs, hard COM cancellation, anti-roll damping)
 *  eventually ploughs the outside wall or rings the marginal roll mode into
 *  a hop — see the session log for the table. The wheel-collider variant
 *  DOES touch the rails and is the hypothesis for steering the bank in the
 *  next stage. A kit `bank` also ends yawed by its angle (banking flattens
 *  at the socket but yaw does not — pieces.ts design note), so the mirrored
 *  `curve` arc beside it is required to bring the track back straight. */
export const FEEL_TRACK_KINDS: readonly PieceKind[] = [
  'ramp', 'straight', 'loop', 'gapLip', 'landing', 'finishCup', 'bank', 'curve',
];

export const FEEL_PARAMS: Record<string, PieceParams> = {
  ramp: { angle: -DROP_RAMP_ANGLE, blend: DROP_BLEND, level: rampLevelForDrop(FEEL_DROP_HEIGHT, -DROP_RAMP_ANGLE, DROP_BLEND, RELEASE_FRACTION * DROP_BLEND) },
  straight: { length: 0.05 },
  bank: { radius: 1.8, angle: 30, bank: 9 },
  curve: { radius: 1.8, angle: -30 },
  loop: { radius: LOOP_RADIUS, lead: LOOP_LEAD },
  gapLip: { length: LIP_LEN, angle: 10, blend: LIP_RISE_BLEND },
  landing: { level: 0.18, angle: 12, blend: 0.06 },
  finishCup: { length: 0.3 },
};

/** Piece indices in the feel chain. */
export const FEEL_INDEX = { ramp: 0, straight: 1, loop: 2, gapLip: 3, landing: 4, finishCup: 5, bank: 6, curve: 7 } as const;

/** The permanent feel track as a rig (build + colliders + arc queries). */
export function feelTrackRig(): KitRig {
  const rig = new KitRig(
    chain(FEEL_TRACK_KINDS, { params: FEEL_PARAMS, levelId: 'feel-track', seed: 0 }),
    10,
  );
  const loopStart = rig.starts[FEEL_INDEX.loop]!;
  const lipStart = rig.starts[FEEL_INDEX.gapLip]!;
  rig.marks.start = RELEASE_FRACTION * DROP_BLEND;
  rig.marks.loopStart = loopStart + LOOP_LEAD;
  rig.marks.loopApex = loopStart + LOOP_LEAD + Math.PI * LOOP_RADIUS;
  rig.marks.loopEnd = loopStart + 2 * LOOP_LEAD + 2 * Math.PI * LOOP_RADIUS;
  rig.marks.gapStart = lipStart + 0.02 + LIP_RISE_BLEND;
  rig.marks.gapEnd = rig.starts[FEEL_INDEX.landing]!;
  return rig;
}

/** 30 cm drop ramp onto a long flat — the rolling-resistance rig (§7.1). */
export function rollRampRig(): KitRig {
  const level = rampLevelForDrop(DROP_HEIGHT, -ROLL_RAMP_ANGLE, ROLL_RAMP_BLEND, RELEASE_FRACTION * ROLL_RAMP_BLEND);
  const rig = new KitRig(
    chain(['ramp', 'straight'], {
      params: { ramp: { angle: -ROLL_RAMP_ANGLE, blend: ROLL_RAMP_BLEND, level }, straight: { length: ROLL_FLAT_LENGTH } },
      levelId: 'roll-ramp',
      seed: 0,
    }),
    10,
  );
  rig.marks.start = RELEASE_FRACTION * ROLL_RAMP_BLEND;
  return rig;
}

/** A flat deck for the symmetric free-drop tripwire rig. */
export function flatRig(): KitRig {
  return new KitRig(
    chain(['straight'], { params: { straight: { length: 1.5 } }, levelId: 'flat', seed: 0 }),
    10,
  );
}

/**
 * Loop-threshold rig: a steep release ramp dropping exactly `releaseHeight`
 * (measured from the release pose) to the deck the loop sits on, the kit
 * loop piece of radius `radius`, and a run-out straight. The loop bottom is
 * translated to y = 0 so height bookkeeping matches theory.
 */
export function loopRig(releaseHeight: number, radius: number): KitRig {
  const a = (LOOP_RAMP_ANGLE * Math.PI) / 180;
  const c = (Math.cos(RELEASE_FRACTION * a) - Math.cos(a) + (1 - Math.cos(a))) / a;
  const blend0 = Math.min(0.3, releaseHeight / c);
  let blend = blend0;
  let level = rampLevelForDrop(releaseHeight, -LOOP_RAMP_ANGLE, blend, RELEASE_FRACTION * blend);
  if (level < 0.01) {
    level = 0.01;
    blend = (releaseHeight - 0.01 * Math.sin(a)) / c;
  }
  const lead = 0.04;
  const build = chain(['ramp', 'loop', 'straight'], {
    params: {
      ramp: { angle: -LOOP_RAMP_ANGLE, blend, level },
      loop: { radius, lead },
      // Long run-out: a high-margin bisect trial leaves the loop at several
      // m/s and must have deck to land on BEFORE it can be judged by the
      // rail-proximate exit check (a 0.5 m run-out let fast trials fly off
      // the end of the rig and read DNF whatever the gate said).
      straight: { length: 4 },
    },
    levelId: 'loop-gate',
    seed: 0,
    // seat the ramp so the loop bottom lands on the y = 0 deck (the ramp's
    // total descent exceeds the release drop by the unused lead-in blend)
    start: new THREE.Matrix4().makeTranslation(
      0,
      releaseHeight + (blend * (1 - Math.cos(RELEASE_FRACTION * ((LOOP_RAMP_ANGLE * Math.PI) / 180)))) / ((LOOP_RAMP_ANGLE * Math.PI) / 180),
      0,
    ),
  });
  const rig = new KitRig(build, 10);
  const loopStart = rig.starts[1]!;
  rig.marks.start = RELEASE_FRACTION * blend;
  rig.marks.loopApex = loopStart + lead + Math.PI * radius;
  rig.marks.loopEnd = loopStart + 2 * lead + 2 * Math.PI * radius;
  return rig;
}
