#!/usr/bin/env node
/**
 * SPIKE INSTRUMENT (eng-free lineage) — the `FreeHouse` stepper, extracted
 * verbatim from tools/spike-freehouse.mjs so the downhill spike
 * (tools/spike-downhill.mjs, branch fp-downhill) can EXTEND the proven
 * instrument instead of rebuilding it. Behaviour-identical: the T0 honesty
 * check (kitchen01's par hash reproduced bit-for-bit) passes from this file.
 *
 * FreeHouse steps EXACTLY the World's system order (launchers -> car forces
 * -> physics -> hash) with (a) no cup/fall/stall outcomes — a free world
 * never ends — and (b) an optional deterministic WIND (a launcher-shaped
 * impulse every `windEvery` steps along the car's heading: the spike's
 * stand-in for player throttle; keyed to step count, so replay stays exact —
 * THE INPUT LAW from Reference/Freeplay Feasibility).
 */
import * as THREE from 'three';
import {
  HASH_INTERVAL,
  SIM_SCALE,
  createWorld as createSimWorld,
  hashBodies,
  hashHex,
  initRapier,
  stepWorld,
  v,
} from '../src/physics/sim.ts';
import {
  applyRollingResistance,
  carStep,
  spawnCar,
} from '../src/physics/car.ts';
import { reify } from '../src/track/build.ts';
import { PIECES, applyImpulse } from '../src/track/pieces.ts';
import { TRACK_FRICTION } from '../src/track/material.ts';
import { LAUNCHER_RADIUS, SPAWN_ADVANCE, TRACK_GROUP, WORLD_ROLL_COEF } from '../src/world/world.ts';
import { transformSocket } from '../src/track/socket.ts';

let RAPIER0 = null;

/** Initialise Rapier and capture the module handle (the spike files' pattern). */
export async function initSim() {
  await initRapier();
  RAPIER0 = (await import('../src/physics/sim.ts')).RAPIER;
}

/** The Rapier module (valid after initSim). */
export function rapier() {
  return RAPIER0;
}

export class FreeHouse {
  constructor(builds, { startSocket, windEvery = 0, windPower = 0, windTargets = null, windTour = 3600, launchSpeed = 0, seed = 0, floor = null }) {
    this.sim = createSimWorld();
    this.launchers = [];
    this.bodies = 0;
    this.colliders = 0;
    for (const build of builds) {
      const { splines, pieces } = reify(build);
      const body = this.sim.createRigidBody(RAPIER0.RigidBodyDesc.fixed());
      this.bodies++;
      for (const s of splines) {
        for (const d of s.toColliderDescs(RAPIER0, { scale: SIM_SCALE, friction: TRACK_FRICTION })) {
          d.setCollisionGroups(TRACK_GROUP);
          this.sim.createCollider(d, body);
          this.colliders++;
        }
      }
      for (const piece of pieces) {
        const def = PIECES[piece.def];
        if (def.applyImpulse && def.power !== undefined) {
          const [, out] = def.sockets(piece.params);
          const w = transformSocket(out, piece.transform);
          this.launchers.push({
            pos: { x: w.pos.x, y: w.pos.y, z: w.pos.z },
            dir: { x: w.tangent.x, y: w.tangent.y, z: w.tangent.z },
            power: def.power * SIM_SCALE,
            fire: def.applyImpulse,
            fired: false,
          });
        }
      }
    }
    if (floor) {
      // FLOOR is declared in WORLD metres — the sim wants SIM units (the kit
      // splines arrive pre-scaled via toColliderDescs({scale: SIM_SCALE})).
      const body = this.sim.createRigidBody(RAPIER0.RigidBodyDesc.fixed());
      this.bodies++;
      const d = RAPIER0.ColliderDesc.cuboid(floor.half[0] * SIM_SCALE, floor.half[1] * SIM_SCALE, floor.half[2] * SIM_SCALE)
        .setTranslation(floor.center[0] * SIM_SCALE, floor.center[1] * SIM_SCALE, floor.center[2] * SIM_SCALE)
        .setFriction(TRACK_FRICTION)
        .setRestitution(0)
        // NOT TRACK_GROUP: the raycast chassis is excluded from track-family
        // groups by design, so a fast-falling car (per-step travel > the 0.26
        // sim suspension reach) would tunnel straight through a track-group
        // floor. The floor must also be a physical body for the chassis — the
        // `addStaticBoxes` group (member bit0, filter all).
        .setCollisionGroups(0x0001_ffff);
      this.sim.createCollider(d, body);
      this.colliders++;
    }
    const pose = {
      p: v(
        (startSocket.pos.x + startSocket.tangent.x * SPAWN_ADVANCE) * SIM_SCALE,
        (startSocket.pos.y + startSocket.tangent.y * SPAWN_ADVANCE) * SIM_SCALE,
        (startSocket.pos.z + startSocket.tangent.z * SPAWN_ADVANCE) * SIM_SCALE,
      ),
      f: v(startSocket.tangent.x, startSocket.tangent.y, startSocket.tangent.z),
      u: v(startSocket.up.x, startSocket.up.y, startSocket.up.z),
    };
    this.car = spawnCar(this.sim, 'raycastWheels', pose, { launchSpeed });
    this.hashValue = seededHash(seed);
    this.steps = 0;
    this.windEvery = windEvery;
    this.windPower = windPower;
    this.windTargets = windTargets;
    this.windTour = windTour;
  }
  step() {
    const t = this.car.chassis.translation();
    const carPos = v(t.x / SIM_SCALE, t.y / SIM_SCALE, t.z / SIM_SCALE);
    for (const l of this.launchers) {
      if (l.fired) continue;
      const dx = carPos.x - l.pos.x, dy = carPos.y - l.pos.y, dz = carPos.z - l.pos.z;
      if (dx * dx + dy * dy + dz * dz < LAUNCHER_RADIUS * LAUNCHER_RADIUS) {
        l.fire(this.car.chassis, l.power, l.dir);
        l.fired = true;
      }
    }
    const support = carStep(this.sim, this.car, undefined);
    this.grounded = support.grounded;
    applyRollingResistance(this.car, support.grounded, WORLD_ROLL_COEF, support);
    if (this.windEvery && this.steps % this.windEvery === 0 && this.windPower) {
      const t0 = this.car.chassis.translation();
      const lv = this.car.chassis.linvel();
      let d;
      if (this.windTargets) {
        // scripted tour: steer toward the parcel that owns this time window
        const [tx, tz] = this.windTargets[Math.floor(this.steps / this.windTour) % this.windTargets.length];
        const dx = tx - t0.x / SIM_SCALE, dz = tz - t0.z / SIM_SCALE;
        const n = Math.hypot(dx, dz) || 1;
        d = { x: dx / n, y: 0.15, z: dz / n };
      } else {
        const n = Math.hypot(lv.x, lv.y, lv.z);
        d = n > 1e-6 ? { x: lv.x / n, y: Math.max(lv.y / n, 0), z: lv.z / n } : { x: 1, y: 0, z: 0 };
      }
      // governor: the wind is a stand-in for throttle, not a slingshot — it
      // stays off above ~2.5 m/s world (keeps the car in contact-limited
      // speeds, where the solver's tunnelling regime is never entered)
      const hSpeed = Math.hypot(lv.x, lv.z);
      if (hSpeed < 2.5 * SIM_SCALE) applyImpulse(this.car.chassis, this.windPower, d);
    }
    stepWorld(this.sim);
    this.steps++;
    if (this.steps % HASH_INTERVAL === 0) this.hashValue = hashBodies([this.car.chassis, ...this.car.wheels], this.hashValue);
  }
  hash() { return hashHex(this.hashValue); }
  pos() {
    const t = this.car.chassis.translation();
    return v(t.x / SIM_SCALE, t.y / SIM_SCALE, t.z / SIM_SCALE);
  }
  free() { this.sim.free(); }
}

export function seededHash(seed) {
  // the exact two-word fold World.seededHash performs
  let h = 0x811c9dc5 >>> 0;
  h = Math.imul(h ^ (seed >>> 0), 0x01000193) >>> 0;
  h = Math.imul(h ^ (Math.floor(Math.abs(seed) / 0x100000000) >>> 0), 0x01000193) >>> 0;
  return h;
}

/** Translate a build's piece transforms (house placement; NEVER a campaign
 *  re-author — a translation re-mints a receipt, see Feasibility §4). */
export function shifted(build, dx, dy = 0, dz = 0) {
  const T = new THREE.Matrix4().makeTranslation(dx, dy, dz);
  return {
    ...build,
    pieces: build.pieces.map((p) => ({ ...p, transform: T.clone().multiply(p.transform) })),
  };
}

/** The world AABB of a build's spline station frames. */
export function buildAabb(build) {
  const box = new THREE.Box3();
  for (const p of build.pieces) {
    const s = PIECES[p.def].spline(p.params);
    for (const f of s.stationFrames()) box.expandByPoint(f.pos.clone().applyMatrix4(p.transform));
  }
  return box;
}
