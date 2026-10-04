/**
 * The determinism harness (brief §7.1 / §8): a replay of (level, build, seed)
 * in Node, no GPU — twice the same data must hash the same, and the build's
 * canonical JSON round-trip must not move the hash (Track Kit invariant 3).
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
    const edited = await replayRun(FEELTRACK, { ...build, pieces: build.pieces.slice(0, -1) });
    expect(edited.hash).not.toBe(original.hash);
  });
});
