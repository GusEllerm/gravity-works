/**
 * Level ↔ harness identity (stage 2, feel-track level): the World-side level
 * build (`FEELTRACK.placeholderBuild()`) and the build the feel harness
 * desugars (`feelTrackRig()`) must reify to the SAME track — the level is a
 * view of the feel module's data, not a copy of it.
 *
 * Two fingerprints, both derived purely from the reified splines:
 *  - the sample fingerprint (`rigFingerprint`: FNV over 32 fixed-t frames +
 *    arc lengths per spline);
 *  - a collider fingerprint: FNV over every collider-run range plus the ring
 *    vertices those runs consume — i.e. the exact vertex soup Rapier's
 *    convex hulls are built from.
 * If the Feel Engineer ever diverges the two routes (or the level copies a
 * stale number), one of these goes red.
 */
import { describe, expect, test } from 'vitest';
import { FEELTRACK, feelTrackBuild } from '../../src/world/levels/feeltrack.level.ts';
import { FEEL_PARAMS, FEEL_TRACK_KINDS, feelTrackRig } from '../../src/feel/feeltrack.ts';
import { reify, rigFingerprint, serialize, type Build } from '../../src/track/build.ts';
import { sectionRings, U_CHANNEL } from '../../src/track/cross-section.ts';

/** FNV-1a over the collider runs: ranges + the ring vertices they hull. */
function colliderFingerprint(build: Build): string {
  let h = 0x811c9dc5 >>> 0;
  const mix = (word: number): void => {
    h = ((h ^ (word >>> 0)) >>> 0);
    h = Math.imul(h, 0x01000193) >>> 0;
  };
  const quant = (x: number): void => mix(Math.round(x * 1e6) | 0);
  for (const spline of reify(build).splines) {
    const frames = spline.stationFrames();
    const rings = sectionRings(U_CHANNEL, frames, 1);
    mix(spline.colliderRuns(frames).length);
    for (const run of spline.colliderRuns(frames)) {
      mix(run.start);
      mix(run.end);
      for (let r = run.start; r <= run.end; r++) {
        for (const part of rings[r]!) {
          for (const p of part) {
            quant(p.x);
            quant(p.y);
            quant(p.z);
          }
        }
      }
    }
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

describe('feel-track level == feel-harness desugar', () => {
  test("the level lays exactly the feel module's piece kinds", () => {
    expect(feelTrackBuild().pieces.map((p) => p.def)).toEqual([...FEEL_TRACK_KINDS]);
  });

  test("piece params are the feel module's own objects, not copies", () => {
    for (const piece of feelTrackBuild().pieces) {
      expect(piece.params).toBe(FEEL_PARAMS[piece.def]);
    }
  });

  test('reified spline sample fingerprints match', () => {
    expect(rigFingerprint(FEELTRACK.placeholderBuild())).toBe(rigFingerprint(feelTrackRig().build));
  });

  test('collider run/ring fingerprints match', () => {
    expect(colliderFingerprint(FEELTRACK.placeholderBuild())).toBe(colliderFingerprint(feelTrackRig().build));
  });

  test('the only build-data difference is the level identity (id + seed)', () => {
    const level = feelTrackBuild();
    const harness = feelTrackRig().build;
    expect(serialize({ ...harness, levelId: level.levelId, seed: level.seed })).toBe(serialize(level));
  });
});
