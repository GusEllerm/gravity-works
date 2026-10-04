/**
 * The level registry + the one stage-2 level: `feeltrack`.
 *
 * The build here is the REAL kit feel track — the same piece chain the feel
 * harness desugars in `src/feel/feeltrack.ts` (`feelTrackRig()`), laid out by
 * pure socket math through `chain`/`fitSocket`:
 *
 *   ramp (-12° blend, the 0.45 m drop) -> straight -> loop (threshold radius)
 *   -> gapLip (the empty arc IS the gap) -> landing -> finishCup
 *   -> bank -> curve            (the banked S run-out sits AFTER the cup)
 *
 * Nothing is copied: the piece order is `FEEL_TRACK_KINDS` and every
 * parameter comes from `FEEL_PARAMS` (plus `rampLevelForDrop` sizing inside
 * the feel module), so when the Feel Engineer retunes a constant the level
 * follows it for free. `tests/unit/feeltrack-level.test.ts` asserts the two
 * routes still reify to identical splines and identical collider rings —
 * that test is the seam, not a formality.
 *
 * The car is released at the harness's own release pose (`marks.start`, on the
 * ramp's descending slope — see `startSocketOf` for why the entry socket will
 * not do) from rest under gravity, so the game and the metrics drive the same
 * car. No hidden state: reify the data and the world is fully determined.
 */
import { chain, type Build } from '../../track/build.ts';
import * as THREE from 'three';
import type { Socket } from '../../track/socket.ts';
import { FEEL_PARAMS, FEEL_TRACK_KINDS, feelTrackRig } from '../../feel/feeltrack.ts';
import type { Level } from '../level.ts';

export const FEELTRACK_ID = 'feeltrack';
const SEED = 1;

/** The feel track as a `Build`: fresh data every call, identical bytes. */
export function feelTrackBuild(): Build {
  return chain(FEEL_TRACK_KINDS, { params: FEEL_PARAMS, levelId: FEELTRACK_ID, seed: SEED });
}

/** The car's release: the SAME pose the feel harness releases from. */
function startSocketOf(): Socket {
  // This used to be "the in-socket of the first placed piece", which sounds
  // equivalent to the harness release and is not: the ramp's first 7 cm is its
  // pitch BLEND, so its entry socket is a LEVEL patch of deck. A car released
  // there with the tuned Coulomb rolling resistance never starts — friction
  // (mu * m * g, ~53 N against a downhill component of zero on level ground)
  // outranks gravity on the flat and the run is a `stalled` car in the grass.
  // The feel rigs release at `marks.start`, 0.9 of the blend along the ramp,
  // where the deck is already tilted. Taking the level's release from the same
  // rig makes the game and the metrics agree by construction instead of by
  // somebody remembering to mirror a constant.
  const rig = feelTrackRig();
  const pose = rig.poseAt(rig.marks.start);
  return {
    pos: new THREE.Vector3(pose.p.x, pose.p.y, pose.p.z),
    tangent: new THREE.Vector3(pose.f.x, pose.f.y, pose.f.z),
    up: new THREE.Vector3(pose.u.x, pose.u.y, pose.u.z),
  };
}

/** The registry. `getLevel` is what share links and replays resolve against. */
export const LEVELS: Record<string, Level> = {};

export function registerLevel(level: Level): Level {
  LEVELS[level.id] = level;
  return level;
}

export function getLevel(id: string): Level {
  const level = LEVELS[id];
  if (!level) throw new Error(`unknown level "${id}"`);
  return level;
}

export const FEELTRACK: Level = registerLevel({
  id: FEELTRACK_ID,
  name: 'Feel track',
  seed: SEED,
  startSocket: startSocketOf(),
  budget: 16,
  par: { pieces: FEEL_TRACK_KINDS.length, time: 5 },
  maxTime: 20,
  placeholderBuild: feelTrackBuild,
});
