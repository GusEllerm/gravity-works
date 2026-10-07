/**
 * BUILD-VIEW tests (playtest Q: "built 4 levels from ONE FIXED ANGLE — no
 * orbit at all, left-drag PLACES"). The class is pure math: the proofs are
 * (1) the zero state is BIT-IDENTICAL to `frameCamera`'s direct pose (every
 * visual baseline and framing proof stands on this), (2) the clamps hold
 * (yaw is the table's hemisphere, never beyond; pan never leaves the table;
 * vertical drag moves NOTHING — yaw-only), (3) the response is the damped
 * exponential family (63 % in one tau), (4) the composition never zooms:
 * eye distance and elevation are invariant under yaw.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { BuildCamera, BUILD_VIEW } from '../../src/camera/build-camera.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';

let buildTrackMeshes: (b: any) => THREE.Group;
beforeAll(async () => {
  buildTrackMeshes = (await import('../../src/world/world.ts')).buildTrackMeshes;
});

const sceneOf = (): THREE.Scene => {
  const s = new THREE.Scene();
  s.add(buildTrackMeshes(KITCHEN01.placeholderBuild()));
  return s;
};

describe('build view: the zero state is the static framing, bit for bit', () => {
  it('frameCamera with a BuildCamera equals frameCamera without one', async () => {
    const { frameCamera } = await import('../../src/boot.ts');
    const scene = sceneOf();
    const a = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 20);
    const b = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 20);
    const focus = new THREE.Vector3(0.4, 0.1, -0.2);
    const extra = { x: 0.9, y: -0.5, z: 0.2 };
    frameCamera(a, scene, focus, extra);
    frameCamera(b, scene, focus, extra, new BuildCamera());
    expect(b.position.x).toBe(a.position.x);
    expect(b.position.y).toBe(a.position.y);
    expect(b.position.z).toBe(a.position.z);
    expect(b.quaternion.equals(a.quaternion)).toBe(true);
  });
});

describe('build view: clamps — the table stays in its sensible hemisphere', () => {
  it('yaw target and pose clamp at YAW_MAX either way (60° hemisphere arc)', () => {
    const v = new BuildCamera();
    v.setFraming(new THREE.Vector3(), 1.5, 0.8);
    v.orbit(1e6, 0);
    expect(v.yawTarget).toBeLessThanOrEqual(BUILD_VIEW.YAW_MAX);
    for (let i = 0; i < 400; i++) v.step(1 / 60);
    expect(v.yaw).toBeLessThanOrEqual(BUILD_VIEW.YAW_MAX + 1e-9);
    v.orbit(-2e6, 0);
    for (let i = 0; i < 400; i++) v.step(1 / 60);
    expect(Math.abs(v.yaw)).toBeLessThanOrEqual(BUILD_VIEW.YAW_MAX + 1e-9);
  });

  it('yaw-only: vertical drag moves NOTHING (no pitch degree of freedom)', () => {
    const v = new BuildCamera();
    v.setFraming(new THREE.Vector3(), 1.5, 0.8);
    v.orbit(0, 1e6);
    expect(v.yawTarget).toBe(0);
  });

  it('pan clamps to PAN_MAX × span — the centre can leave the box, not the table', () => {
    const v = new BuildCamera();
    const span = 0.8;
    v.setFraming(new THREE.Vector3(), 1.5, span);
    for (let i = 0; i < 50; i++) v.pan(1e4, 1e4);
    expect(Math.hypot(v.panTargetX, v.panTargetY)).toBeLessThanOrEqual(
      BUILD_VIEW.PAN_MAX * span + 1e-12,
    );
  });

  it('reset brings the framing home (targets zero)', () => {
    const v = new BuildCamera();
    v.setFraming(new THREE.Vector3(0.2, 0, -0.1), 1.5, 0.8);
    v.orbit(300, 0);
    v.pan(200, 200);
    v.reset();
    expect(v.yawTarget).toBe(0);
    expect(v.panTargetX).toBe(0);
    expect(v.panTargetY).toBe(0);
  });
});

describe('build view: damped, never a cut', () => {
  it('a 60-px orbit crosses 63 % of its target within one tau', () => {
    const v = new BuildCamera();
    v.setFraming(new THREE.Vector3(), 1.5, 0.8);
    v.orbit(60, 0);
    const target = v.yawTarget;
    let t = 0;
    let crossed = -1;
    let prev = 0;
    for (let i = 0; i < 1000; i++) {
      v.step(1 / 240);
      t += 1 / 240;
      expect(v.yaw).toBeGreaterThanOrEqual(prev - 1e-12); // monotonic, no overshoot cut
      prev = v.yaw;
      if (crossed < 0 && v.yaw >= 0.63 * target) crossed = t;
    }
    expect(crossed).toBeGreaterThan(0);
    expect(crossed).toBeLessThanOrEqual(BUILD_VIEW.TAU * 1.15);
    expect(prev).toBeCloseTo(target, 4);
  });

  it('a still camera costs nothing: step returns false at rest', () => {
    const v = new BuildCamera();
    v.setFraming(new THREE.Vector3(), 1.5, 0.8);
    expect(v.step(1 / 60)).toBe(false);
    v.orbit(5, 0);
    expect(v.step(1 / 60)).toBe(true);
  });
});

describe('build view: yaw-only geometry — no zoom, no roll, no pitch', () => {
  it('eye distance and elevation are invariant under yaw; the right axis stays horizontal', () => {
    const center = new THREE.Vector3(0.3, 0.12, -0.05);
    const view = new BuildCamera();
    view.setFraming(center, 1.5, 0.8);
    const cam = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 20);
    view.apply(cam);
    const baseDist = cam.position.distanceTo(center);
    const elev0 = cam.position.clone().sub(center).normalize().y;

    view.orbit(1e6, 0); // hard against the clamp
    for (let i = 0; i < 400; i++) view.step(1 / 60);
    view.apply(cam);
    expect(cam.position.distanceTo(center)).toBeCloseTo(baseDist, 9); // NO zoom lives here
    expect(cam.position.clone().sub(center).normalize().y).toBeCloseTo(elev0, 9); // elevation frozen
    // lookAt with world up: the screen-right axis is exactly horizontal —
    // zero roll about the view axis at every yaw
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    expect(Math.abs(right.y)).toBeLessThan(1e-9);
  });

  it('pan is a pure screen-plane translation: quaternion unchanged, shift = pan magnitude', () => {
    const view = new BuildCamera();
    view.setFraming(new THREE.Vector3(0.3, 0.12, -0.05), 1.5, 0.8);
    const cam = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 20);
    view.apply(cam);
    const q0 = cam.quaternion.clone();
    const p0 = cam.position.clone();
    view.pan(400, 300);
    for (let i = 0; i < 600; i++) view.step(1 / 60);
    view.apply(cam);
    // the eye-to-centre offset is the SAME vector before and after, so the
    // ORIENTATION cannot change — pan turns, it never tilts or zooms
    expect(cam.quaternion.angleTo(q0)).toBeLessThan(1e-9);
    expect(cam.position.distanceTo(p0)).toBeCloseTo(Math.hypot(view.panX, view.panY), 9);
  });
});
