/**
 * The determinism harness (brief §7.1 / §8): a replay of the REAL feel track
 * — (level, build, seed) from `FEELTRACK` — run in Node, no GPU. Twice the
 * same data must hash the same, the build's canonical JSON round-trip must
 * not move the hash (Track Kit invariant 3), and the hash must be SENSITIVE
 * to the data: a changed seed, a removed piece or even one retuned piece
 * parameter must change it. A hash that ignores its inputs is as useless as
 * one that can't be reproduced.
 */
import { describe, expect, test } from 'vitest';
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts';
import { deserialize, serialize } from '../../src/track/build.ts';
import { replayRun } from '../../src/replay/replay.ts';

describe('replay determinism', () => {
  test('the same build replayed twice produces the same hash', async () => {
    const build = FEELTRACK.placeholderBuild();
    const first = await replayRun(FEELTRACK, build);
    const second = await replayRun(FEELTRACK, build);
    expect(first.hash).toBe(second.hash);
    expect(first.hash).toMatch(/^[0-9a-f]{8}$/);
    expect(first.steps).toBe(second.steps);
  });

  test('a build JSON round-trip replays with the same hash', async () => {
    const build = FEELTRACK.placeholderBuild();
    const original = await replayRun(FEELTRACK, build);
    const roundTripped = deserialize(serialize(build));
    const replayed = await replayRun(FEELTRACK, roundTripped);
    expect(replayed.hash).toBe(original.hash);
    expect(serialize(roundTripped)).toBe(serialize(build)); // canonical bytes, too
  });

  test('a build edit changes the hash', async () => {
    const build = FEELTRACK.placeholderBuild();
    const original = await replayRun(FEELTRACK, build);
    // cut the track after the first straight: the car leaves the deck instead
    // of running the loop section, so the trajectory (and hash) must move.
    const edited = await replayRun(FEELTRACK, { ...build, pieces: build.pieces.slice(0, 2) });
    expect(edited.hash).not.toBe(original.hash);
  });

  test('changing one piece parameter changes the hash (determinism sensitivity)', async () => {
    const build = FEELTRACK.placeholderBuild();
    const original = await replayRun(FEELTRACK, build);
    const retuned = await replayRun(FEELTRACK, {
      ...build,
      pieces: build.pieces.map((p) =>
        p.def === 'ramp' ? { ...p, params: { ...p.params, level: (p.params.level ?? 0) + 0.01 } } : p,
      ),
    });
    expect(retuned.hash).not.toBe(original.hash);
  });
});
