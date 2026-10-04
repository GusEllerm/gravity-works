/**
 * Post-stack contract, headless: the tilt-shift focus-band math (world point
 * → band centre, floor distance → defocus strength), the quality ladder
 * (stages drop before resolution), the bloom soft ceiling, the token-derived
 * grade numbers, and the harness `focus=` param parsing. The GPU side of the
 * same stack is exercised by the harness e2e with post=on.
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { tiltShiftParams, DEFAULT_BAND_HEIGHT } from '../../src/render/post/tilt-shift.ts';
import { applyQuality, buildPostStages } from '../../src/render/post/index.ts';
import { BLOOM_SOFT_CEILING, SoftBloomPass } from '../../src/render/post/bloom.ts';
import { gradeFromTokens } from '../../src/render/post/grade.ts';
import { SET_TOKENS } from '../../src/render/tokens.ts';
import { isPostQuality, parseFocusParam } from '../../src/dev/post-params.ts';

function rig(): THREE.PerspectiveCamera {
  const cam = new THREE.PerspectiveCamera(35, 16 / 9, 0.01, 12);
  cam.position.set(0.16, 0.035, 0.26);
  cam.lookAt(0, 0.04, 0);
  cam.updateMatrixWorld();
  return cam;
}

describe('tilt-shift (§5.6/§7.3)', () => {
  it('centres the band on the projected world focus point', () => {
    const cam = rig();
    const onTarget = tiltShiftParams(new THREE.Vector3(0, 0.04, 0), cam);
    // the focus point sits on the look-at ray → the band centres the frame
    expect(Math.abs(onTarget.bandCenter - 0.5)).toBeLessThan(0.02);
    const raised = tiltShiftParams(new THREE.Vector3(0, 0.3, 0), cam);
    expect(raised.bandCenter).toBeGreaterThan(onTarget.bandCenter + 0.05); // up in the world = up in frame
    expect(raised.bandCenter).toBeLessThanOrEqual(1);
  });

  it('band height is ~20 % of the frame, split into halves for the shader', () => {
    const p = tiltShiftParams(new THREE.Vector3(0, 0, 0), rig());
    expect(p.bandHalf).toBeCloseTo(DEFAULT_BAND_HEIGHT / 2, 6);
  });

  it('defocus strength rises with the focus point distance from the set floor', () => {
    const cam = rig();
    const floor = tiltShiftParams(new THREE.Vector3(0, 0, 0), cam, { floorY: 0 });
    const rim = tiltShiftParams(new THREE.Vector3(0, 0.05, 0), cam, { floorY: 0 });
    const top = tiltShiftParams(new THREE.Vector3(0, 0.6, 0), cam, { floorY: 0 });
    expect(rim.radiusPx).toBeGreaterThan(floor.radiusPx);
    expect(top.radiusPx).toBeGreaterThan(rim.radiusPx - 1e-9);
    expect(top.radiusPx).toBeLessThanOrEqual(20 + 1e-9); // capped at the frame-edge radius
    expect(floor.radiusPx).toBeGreaterThan(0);
  });
});

describe('quality ladder — stages drop before resolution', () => {
  const tapsOf = (stages: ReturnType<typeof buildPostStages>): number =>
    stages.tilt.passes[0]!.material.uniforms.uTaps!.value as number;

  it('high runs every stage', () => {
    const s = buildPostStages();
    applyQuality(s, 'high');
    expect(s.bloom.enabled).toBe(true);
    expect(s.tilt.passes.every((p) => p.enabled)).toBe(true);
    expect(tapsOf(s)).toBe(6);
  });

  it('medium drops bloom first, then halves tilt taps — resolution untouched', () => {
    const s = buildPostStages();
    applyQuality(s, 'medium');
    expect(s.bloom.enabled).toBe(false);
    expect(s.tilt.passes.every((p) => p.enabled)).toBe(true);
    expect(tapsOf(s)).toBe(3);
    expect(s.grade.enabled).toBe(true);
    expect(s.vignette.enabled).toBe(true);
  });

  it('low keeps only the two one-tap stages', () => {
    const s = buildPostStages();
    applyQuality(s, 'low');
    expect(s.bloom.enabled).toBe(false);
    expect(s.tilt.passes.every((p) => !p.enabled)).toBe(true);
    expect(s.grade.enabled).toBe(true);
    expect(s.vignette.enabled).toBe(true);
  });
});

describe('bloom soft ceiling (never-list)', () => {
  it('clamps any requested strength to the soft ceiling', () => {
    const b = new SoftBloomPass({ strength: 42 });
    expect(b.strength).toBe(BLOOM_SOFT_CEILING);
    expect(BLOOM_SOFT_CEILING).toBeLessThanOrEqual(0.25);
    b.dispose();
  });
});

describe('per-set grade from tokens (LUT-lite)', () => {
  it('the kitchen grade sinks mids, warms the gain, lifts blacks off black', () => {
    const g = gradeFromTokens(SET_TOKENS.kitchen);
    expect(g.gamma).toBeGreaterThan(1); // mids down toward tile A's range
    expect(g.contrast).toBeGreaterThan(1);
    expect(g.saturation).toBeGreaterThan(1);
    expect(g.gain[0]).toBeGreaterThan(g.gain[2]); // warm: red above blue
    for (const l of g.lift) {
      expect(l).toBeGreaterThan(0); // no black
      expect(l).toBeLessThan(0.08); // and no milky haze
    }
  });
});

describe('harness focus= parsing', () => {
  it('accepts bare and paren-wrapped triples, rejects garbage', () => {
    expect(parseFocusParam('0.1,0.05,-0.2')).toEqual([0.1, 0.05, -0.2]);
    expect(parseFocusParam('(0.1, 0.05, -0.2)')).toEqual([0.1, 0.05, -0.2]);
    expect(parseFocusParam(null)).toBeNull();
    expect(parseFocusParam('0.1,0.2')).toBeNull();
    expect(parseFocusParam('0.1,x,0.2')).toBeNull();
    expect(isPostQuality('medium')).toBe(true);
    expect(isPostQuality('ultra')).toBe(false);
    expect(isPostQuality(null)).toBe(false);
  });
});
