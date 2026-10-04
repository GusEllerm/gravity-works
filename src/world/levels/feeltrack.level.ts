/**
 * The level registry + the one stage-2 level: `feeltrack`.
 *
 * The build here is the placeholder the spine runs until the Feel Engineer's
 * real feel track plugs in (same `Level` interface, same `placeholderBuild()`
 * seam — see `src/world/level.ts`). It is a straight-plus-ramp run made only
 * of kit pieces, laid by pure socket math:
 *
 *   ramp (reverse-mounted, a downward launch) -> straight x3 -> finishCup
 *
 * The ramp is seated by rotating it half a turn about the start socket's up
 * axis, so the car enters its exit socket and runs the geometry backwards: a
 * 12-degree launch drop into a level deck. Reverse seating is exactly what
 * the builder's R-key does, so the placeholder exercises the same transform
 * path a player build would take. No hidden state: reify the data and the
 * world is fully determined.
 */
import * as THREE from 'three';
import { chain, type Build } from '../../track/build.ts';
import { defaultParams, PIECES } from '../../track/pieces.ts';
import { socketMatrix, transformSocket, type Socket } from '../../track/socket.ts';
import type { Level } from '../level.ts';

export const FEELTRACK_ID = 'feeltrack';
const SEED = 1;
/** Height of the launch point above the deck plane (world metres). */
export const LAUNCH_HEIGHT = 0.18;

/** Seat a socket's travel backwards (a reverse-mounted piece departs this way). */
function reverseSocket(s: Socket): Socket {
  return { pos: s.pos.clone(), tangent: s.tangent.clone().negate(), up: s.up.clone() };
}

/** Transform that mounts `piece`'s OUT socket at `at`, running it in reverse. */
function reverseMount(outPos: THREE.Vector3, at: THREE.Vector3): THREE.Matrix4 {
  const flip = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI);
  return new THREE.Matrix4()
    .makeTranslation(at.x, at.y, at.z)
    .multiply(flip)
    .multiply(new THREE.Matrix4().makeTranslation(-outPos.x, -outPos.y, -outPos.z));
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

const RAMP_PARAMS = defaultParams('ramp');
const [RAMP_IN, RAMP_OUT] = PIECES.ramp.sockets(RAMP_PARAMS);
/** The launch piece: the ramp, reverse-mounted at the start point. */
const RAMP_LAUNCH = reverseMount(RAMP_OUT.pos, new THREE.Vector3(0, LAUNCH_HEIGHT, 0));

function buildPlaceholder(): Build {
  const tail = chain(['straight', 'straight', 'straight', 'finishCup'], {
    start: socketMatrix(reverseSocket(transformSocket(RAMP_IN, RAMP_LAUNCH))),
    levelId: FEELTRACK_ID,
    seed: SEED,
  });
  return {
    levelId: FEELTRACK_ID,
    seed: SEED,
    pieces: [
      { def: 'ramp', params: RAMP_PARAMS, transform: RAMP_LAUNCH, seq: 0 },
      ...tail.pieces.map((p, i) => ({ ...p, seq: i + 1 })),
    ],
  };
}

export const FEELTRACK: Level = registerLevel({
  id: FEELTRACK_ID,
  name: 'Feel track (placeholder)',
  seed: SEED,
  startSocket: reverseSocket(transformSocket(RAMP_OUT, RAMP_LAUNCH)),
  budget: 16,
  par: { pieces: 5, time: 4 },
  maxTime: 20,
  placeholderBuild: buildPlaceholder,
});
