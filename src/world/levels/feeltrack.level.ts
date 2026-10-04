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
 * The car spawns at the ramp's in-socket (the level's `startSocket`) and
 * rolls from rest under gravity — the same honest release the feel rigs
 * use, no launch velocity. No hidden state: reify the data and the world is
 * fully determined.
 */
import { chain, type Build } from '../../track/build.ts';
import { PIECES } from '../../track/pieces.ts';
import { transformSocket, type Socket } from '../../track/socket.ts';
import { FEEL_PARAMS, FEEL_TRACK_KINDS } from '../../feel/feeltrack.ts';
import type { Level } from '../level.ts';

export const FEELTRACK_ID = 'feeltrack';
const SEED = 1;

/** The feel track as a `Build`: fresh data every call, identical bytes. */
export function feelTrackBuild(): Build {
  return chain(FEEL_TRACK_KINDS, { params: FEEL_PARAMS, levelId: FEELTRACK_ID, seed: SEED });
}

/** The in-socket of a build's first placed piece — the spawn frame. */
function startSocketOf(build: Build): Socket {
  const first = build.pieces[0]!;
  const [inSocket] = PIECES[first.def].sockets(first.params);
  return transformSocket(inSocket, first.transform);
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
  startSocket: startSocketOf(feelTrackBuild()),
  budget: 16,
  par: { pieces: FEEL_TRACK_KINDS.length, time: 5 },
  maxTime: 20,
  placeholderBuild: feelTrackBuild,
});
