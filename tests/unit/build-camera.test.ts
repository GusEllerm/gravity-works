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

describe('death hold: the failure end-hold frames the death, never the wall', () => {
  it('the wall case: the same wide solve, wall ON, cannot bury the eye', async () => {
    const { frameCamera } = await import('../../src/boot.ts');
    const { frameDeathHold } = await import('../../src/camera/build-camera.ts');
    const scene = sceneOf();
    const raw = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 20);
    frameCamera(raw, scene, null, null);
    const death = { x: 1.6, y: -0.9, z: 0.4 }; // a fail in the sink corner
    const bare = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 20);
    const held = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 20);
    frameDeathHold(bare, scene, { death, solids: [], view: null });
    // THE PEACH WALL: a solid that contains the wide hold's own eye point
    // (what R's failure framing sat inside). The clearance rule MUST move
    // the eye out of it — the same solve with the wall reads legal.
    const wall = {
      min: [
        bare.position.x - 0.5,
        bare.position.y - 0.2,
        bare.position.z - 0.5,
      ] as [number, number, number],
      max: [
        bare.position.x + 0.5,
        bare.position.y + 0.6,
        bare.position.z + 0.5,
      ] as [number, number, number],
    };
    expect(boxHas(bare.position, wall)).toBe(true); // the raw pose is buried
    frameDeathHold(held, scene, { death, solids: [wall], view: null });
    expect(boxHas(held.position, wall)).toBe(false);
    expect(held.position.y).toBeGreaterThanOrEqual(wall.max[1] + 0.04 - 1e-6);
    // and the DEATH remains the subject of the lifted hold
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(held.quaternion);
    const toDeath = new THREE.Vector3(death.x, death.y, death.z).sub(held.position).normalize();
    expect(Math.acos(Math.min(1, fwd.dot(toDeath)))).toBeLessThan(0.6);
  });

  it('a flung-off-world death does not inflate the framing into the void', async () => {
    const { frameDeathHold } = await import('../../src/camera/build-camera.ts');
    const scene = sceneOf();
    const cam = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 20);
    frameDeathHold(cam, scene, { death: { x: 4000, y: -4000, z: 4000 }, solids: [], view: null });
    expect(Math.hypot(cam.position.x, cam.position.y, cam.position.z)).toBeLessThan(20);
  });

  it('no solids, no track: still a finite pose (an empty build cannot crash the hold)', async () => {
    const { frameDeathHold } = await import('../../src/camera/build-camera.ts');
    const cam = new THREE.PerspectiveCamera(35, 960 / 540, 0.01, 20);
    frameDeathHold(cam, new THREE.Scene(), { death: { x: 0.2, y: 0, z: 0.1 }, solids: [], view: null });
    expect(Number.isFinite(cam.position.x + cam.position.y + cam.position.z)).toBe(true);
    expect(Number.isFinite(cam.quaternion.x + cam.quaternion.y + cam.quaternion.z + cam.quaternion.w)).toBe(true);
  });
});

function boxHas(p: THREE.Vector3, b: { min: [number, number, number]; max: [number, number, number] }): boolean {
  return p.x > b.min[0] && p.x < b.max[0] && p.y > b.min[1] && p.y < b.max[1] && p.z > b.min[2] && p.z < b.max[2];
}
