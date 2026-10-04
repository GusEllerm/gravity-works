/**
 * Run-camera tests (PROMPT §7.3 numbers, pure-math class). The source is a
 * hand-rolled analytic rail (a line that turns 90° at arc 10) instead of a
 * KitRig — the camera only consumes {railPointAt, frameAt, length}, so this
 * keeps the timing assertions exact and the test fast.
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { RunCamera, RUN_CAMERA } from '../../src/camera/run-camera.ts';
import type { RunCameraSource } from '../../src/camera/run-camera.ts';

const R = 4; // corner radius of the bend
const L = 10; // arc where the bend starts

class Rail implements RunCameraSource {
  readonly length = L + Math.PI * R * 0.5 + 10;

  frameAt(s: number): { pos: THREE.Vector3; tangent: THREE.Vector3; up: THREE.Vector3 } {
    const c = THREE.MathUtils.clamp(s, 0, this.length - 1e-9);
    if (c <= L) {
      return { pos: new THREE.Vector3(c, 0, 0), tangent: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
    }
    const inBend = Math.min(c - L, Math.PI * R * 0.5);
    const th = inBend / R; // 0..90deg
    const theta = th;
    const center = new THREE.Vector3(L, 0, -R);
    const dir = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));
    const pos = new THREE.Vector3(L + R * Math.sin(theta), 0, -R * (1 - Math.cos(theta)));
    void center;
    return { pos, tangent: dir, up: new THREE.Vector3(0, 1, 0) };
  }

  railPointAt(s: number): THREE.Vector3 {
    return this.frameAt(s).pos.clone();
  }
}

const DT = 1 / 120;

function drive(cam: RunCamera, steps: number, carAt: (t: number) => number, speed: number): void {
  for (let i = 0; i < steps; i++) cam.update(DT, carAt((i + 1) * DT), speed);
}

describe('run camera (§7.3: leads ~0.4 s, 150 ms positional lag, slower rotation)', () => {
  const rail = new Rail();

  it('on a straight, settles 0.4 s of rail ahead of the car', () => {
    const cam = new RunCamera(rail, 0);
    const v = 2;
    drive(cam, 480, (t) => Math.min(v * t, L - 0.5), v);
    const carArc = Math.min(v * (480 * DT), L - 0.5);
    expect(cam.railArc).toBeGreaterThan(carArc);
    // Steady state of a ramp target through the positional filter sits one
    // tau behind the lead point: gap = v * (LEAD_TIME - POS_LAG).
    expect(cam.railArc - carArc).toBeCloseTo(v * (RUN_CAMERA.LEAD_TIME - RUN_CAMERA.POS_LAG), 1);
  });

  it('positional response to a step advance is exponential with tau = 150 ms', () => {
    const cam = new RunCamera(rail, 0);
    cam.snap(0);
    // Hold the car at a fixed arc and let the lead target settle, then step
    // the car 1 m forward and watch the 63 % crossing time.
    drive(cam, 240, () => 0, 0);
    const before = cam.railArc;
    let crossed = -1;
    for (let i = 0; i < 120; i++) {
      cam.update(DT, 1, 0); // target jumps by exactly 1 m (speed 0 lead)
      if (crossed < 0 && cam.railArc - before > (1 - Math.exp(-1)) * 1) crossed = (i + 1) * DT;
    }
    expect(crossed).toBeGreaterThan(0);
    expect(crossed).toBeCloseTo(RUN_CAMERA.POS_LAG, 2);
  });

  it('rotational response is a slower exponential than the positional one', () => {
    const v = 3;
    const cam = new RunCamera(rail, 0);
    // Park the lead target a fixed distance INSIDE the corner: the target
    // orientation then makes one clean step (straight -> corner tangent) and
    // the 63 % crossing time measures ROT_LAG directly.
    cam.snap(L - 0.6 - v * RUN_CAMERA.LEAD_TIME + v * RUN_CAMERA.LEAD_TIME); // arc = L - 0.6
    const carArc = L - 0.6; // lead = L - 0.6 + 0.4v ~ inside the bend
    const yawAt = (c: RunCamera): number => {
      // the camera's actual facing
      const z = new THREE.Vector3(0, 0, -1).applyQuaternion(c.rotation);
      return Math.atan2(-z.z, z.x) === 0 ? Math.atan2(z.z, z.x) : Math.atan2(z.z, z.x);
    };
    const yawTarget = Math.atan2(-rail.frameAt(carArc + v * RUN_CAMERA.LEAD_TIME).tangent.z, rail.frameAt(carArc + v * RUN_CAMERA.LEAD_TIME).tangent.x);
    const yaw0 = yawAt(cam);
    let t63 = -1;
    for (let i = 0; i < 240; i++) {
      cam.update(DT, carArc, v);
      if (t63 < 0 && Math.abs(yawAt(cam) - yaw0) >= 0.63 * Math.abs(yawTarget - yaw0)) t63 = (i + 1) * DT;
    }
    expect(t63).toBeGreaterThan(RUN_CAMERA.POS_LAG); // strictly slower than position
    expect(t63).toBeGreaterThan(RUN_CAMERA.ROT_LAG * 0.8);
    expect(t63).toBeLessThan(RUN_CAMERA.ROT_LAG * 1.4);
  });

  it('snap cuts the filters instantly (reset/cut scene)', () => {
    const cam = new RunCamera(rail, 0);
    cam.snap(5, 0);
    expect(cam.railArc).toBeCloseTo(5, 6);
    expect(cam.position.x).toBeCloseTo(5, 6);
  });

  it('deterministic: identical inputs frame identically', () => {
    const mk = (): number => {
      const cam = new RunCamera(rail, 0);
      drive(cam, 600, (t) => Math.min(2.2 * t, L + 2), 2.2);
      return cam.position.x + 7919 * cam.position.z + 104729 * cam.rotation.w;
    };
    expect(mk()).toBe(mk());
  });
});

