/**
 * `World` — the contract's spine object (docs/vault/Concepts/Track Kit.md):
 * one object owning physics, scene and the track graph for one run attempt.
 *
 * A World is constructed from (level, build, options) and nothing else — the
 * Track Kit invariant 4 — reifying the build into one fixed body of compound
 * convex colliders (generated from the same splines the meshes come from)
 * plus plain-material meshes for the renderer. The car is the raycast-wheel
 * variant from `src/physics/car.ts` (the stage-1 bake-off winner).
 *
 * Stepping is a fixed 1/120 s (never variable) in a fixed system order:
 *
 *   inputs (launcher triggers) -> car forces (suspension + rolling
 *   resistance) -> physics step -> constraints (state hash, capture/fall/
 *   stall/timeout outcomes)
 *
 * The renderer must read ONLY the last two `state()` snapshots and an alpha —
 * never physics per frame — so determinism tests can run this file headless
 * in Node without a GPU (`visuals: false` skips the scene entirely).
 *
 * Spaces: colliders are built at `SIM_SCALE` (kit code stays unit-blind);
 * car poses live in sim space inside physics and leave `state()` converted to
 * world metres (÷ SIM_SCALE). Rotations are scale-free.
 */
import * as THREE from 'three';
import {
  FIXED_DT,
  HASH_INTERVAL,
  initRapier,
  RAPIER,
  SIM_SCALE,
  SQRT_S,
  createWorld as createSimWorld,
  hashBodies,
  hashHex,
  stepWorld,
  v,
  type Quat,
  type Vec,
} from '../physics/sim.ts';
import {
  applyRollingResistance,
  carSpeed,
  carStep,
  spawnCar,
  type Car,
  type CarVariant,
  type Pose,
} from '../physics/car.ts';
import { reify, type Build, type PlacedPiece } from '../track/build.ts';
import { PIECES, type PieceDef } from '../track/pieces.ts';
import { transformSocket } from '../track/socket.ts';
import { GLOBAL_TOKENS } from '../render/tokens.ts';
import type { Level } from './level.ts';

/** Toy-plastic deck friction; same constant the feel rigs' boxes use. */
export const TRACK_FRICTION = 0.6;
/** Explicit track collision group (bit0 member, filter all) — never the
 * default all-ones group, which the suspension rays' wheel-exclusion
 * predicate would match and silently filter the deck out of (see
 * docs/vault/Modules/physics.md gotchas). */
export const TRACK_GROUP = 0x0001_ffff;
/** Rolling-resistance coefficient used until the Feel Engineer retunes
 * `src/feel` ROLL_COEF on the real feel track (mirror of 0.02, 2026-10-04). */
export const WORLD_ROLL_COEF = 0.02;
/** A finish cup captures when the chassis centre comes within this many
 * cup radii (the chassis rides above the deck, so 1x never triggers). */
export const CUP_CAPTURE_FACTOR = 2;
/** A launcher fires when the chassis centre passes within this (world m). */
export const LAUNCHER_RADIUS = 0.05;
/** How far down the start socket's tangent the chassis centre spawns — a
 * car centred exactly on the start socket hangs half its wheelbase over
 * the deck edge and slides off backwards (measured, 2026-10-04). */
export const SPAWN_ADVANCE = 0.05;

export type RunStatus = 'idle' | 'running' | 'finished' | 'fell' | 'stalled' | 'timeout';

/** One interpolable snapshot. The renderer lerps between the last two. */
export interface WorldState {
  step: number;
  time: number;
  status: RunStatus;
  car: {
    /** World metres (sim translation / SIM_SCALE). */
    pos: Vec;
    quat: Quat;
    /** m/s world. */
    speed: number;
    grounded: boolean;
  };
}

export interface WorldOptions {
  variant?: CarVariant;
  rollCoef?: number;
  /** Build the THREE.Scene + meshes. False for headless replay/tests. */
  visuals?: boolean;
  /** Forward release speed in SIM units. 0 = pure gravity release. */
  launchSpeed?: number;
  /** Below this world speed, grounded, for `stallSeconds` -> `stalled`. */
  stallSpeed?: number;
  stallSeconds?: number;
  /** Seconds; overrides the level's maxTime when given. */
  maxTime?: number;
}

interface LauncherTrigger {
  pos: Vec;
  dir: Vec;
  power: number;
  fire: NonNullable<PieceDef['applyImpulse']>;
  fired: boolean;
}

function mixWord(h: number, word: number): number {
  let x = (h ^ (word >>> 0)) >>> 0;
  x = Math.imul(x, 0x01000193) >>> 0;
  return x;
}

/** The hash seed folds the run seed in, so hash == f(level, build, seed). */
function seededHash(seed: number): number {
  let h = 0x811c9dc5 >>> 0;
  h = mixWord(h, seed >>> 0);
  h = mixWord(h, Math.floor(Math.abs(seed) / 0x100000000) >>> 0);
  return h;
}

/** Plain-material swept meshes for a build (shared by the scene and the
 * worldsmoke harness scene). One group, world metres, no lights baked in. */
export function buildTrackMeshes(build: Build): THREE.Group {
  const group = new THREE.Group();
  const deck = new THREE.MeshLambertMaterial({ color: GLOBAL_TOKENS.trackOrange });
  const shell = new THREE.MeshLambertMaterial({ color: '#dce6ea', side: THREE.DoubleSide });
  for (const piece of reify(build).pieces) {
    const placed = new THREE.Group();
    placed.applyMatrix4(piece.transform);
    const def = PIECES[piece.def];
    const sweep = new THREE.Mesh(def.spline(piece.params).toMesh(), deck);
    placed.add(sweep);
    for (const extra of def.extraGeometries(piece.params)) placed.add(new THREE.Mesh(extra, shell));
    group.add(placed);
  }
  return group;
}

/**
 * The run world. Create it through `World.create` (async — Rapier's wasm
 * must be initialised first); the constructor itself is the contract's
 * `constructor(level, build, opts)`.
 */
export class World {
  readonly level: Level;
  readonly build: Build;
  readonly scene: THREE.Scene | null;
  readonly carMesh: THREE.Mesh | null;

  private readonly sim: RAPIER.World;
  private readonly physicsPieces: PlacedPiece[];
  private readonly hashedBodies: RAPIER.RigidBody[] = [];
  private car: Car;
  private readonly launchers: LauncherTrigger[] = [];
  private readonly cup: { center: Vec; radius: number } | null;
  private readonly floorY: number;
  private readonly rollCoef: number;
  private readonly maxTime: number;
  private readonly stallSpeed: number;
  private readonly stallLimit: number;
  private readonly launchSpeed: number;
  private readonly variant: CarVariant;

  private hashValue: number;
  private steps: number;
  private runStatus: RunStatus;
  private stallRun: number;
  private prev: WorldState;
  private current: WorldState;

  static async create(level: Level, build: Build, options: WorldOptions = {}): Promise<World> {
    await initRapier();
    return new World(level, build, options);
  }

  constructor(level: Level, build: Build, options: WorldOptions = {}) {
    this.level = level;
    this.build = build;
    this.variant = options.variant ?? 'raycastWheels';
    this.rollCoef = options.rollCoef ?? WORLD_ROLL_COEF;
    this.maxTime = options.maxTime ?? level.maxTime;
    this.stallSpeed = options.stallSpeed ?? 0.02;
    this.stallLimit = Math.round((options.stallSeconds ?? 2) / FIXED_DT);
    this.launchSpeed = options.launchSpeed ?? 0;

    const { splines, pieces } = reify(build);
    this.physicsPieces = pieces;
    this.sim = createSimWorld();

    // One fixed body carries every collider of the build. The kit generates
    // the descs from the same samples the meshes sweep (invariant 1).
    const trackBody = this.sim.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    for (const spline of splines) {
      const descs = spline.toColliderDescs(RAPIER, { scale: SIM_SCALE, friction: TRACK_FRICTION });
      for (const desc of descs) {
        (desc as RAPIER.ColliderDesc).setCollisionGroups(TRACK_GROUP);
        this.sim.createCollider(desc as RAPIER.ColliderDesc, trackBody);
      }
    }

    // Launchers and the finish cup, resolved to world-metre anchor points.
    let cup: { center: Vec; radius: number } | null = null;
    let lowest = level.startSocket.pos.y;
    for (const piece of this.physicsPieces) {
      const def = PIECES[piece.def];
      const [, out] = def.sockets(piece.params);
      const world = transformSocket(out, piece.transform);
      lowest = Math.min(lowest, world.pos.y);
      if (def.applyImpulse && def.power !== undefined) {
        this.launchers.push({
          pos: { x: world.pos.x, y: world.pos.y, z: world.pos.z },
          dir: { x: world.tangent.x, y: world.tangent.y, z: world.tangent.z },
          power: def.power * SQRT_S, // world Δv -> sim Δv
          fire: def.applyImpulse,
          fired: false,
        });
      }
      if (def.captureVolume) {
        const cv = def.captureVolume(piece.params);
        const center = new THREE.Vector3(cv.center.x, cv.center.y, cv.center.z).applyMatrix4(piece.transform);
        cup = { center: { x: center.x, y: center.y, z: center.z }, radius: cv.radius * CUP_CAPTURE_FACTOR };
      }
    }
    this.cup = cup;
    this.floorY = lowest - 0.75;

    if (options.visuals ?? true) {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color('#efe0c8');
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.85));
      const key = new THREE.DirectionalLight(0xffffff, 1.1);
      key.position.set(1, 2, 1.5);
      this.scene.add(key);
      this.scene.add(buildTrackMeshes(build));
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshLambertMaterial({ color: '#e6d3b3' }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = this.floorY + 0.55;
      this.scene.add(ground);
      // plain blocky proxy at the chassis box's world size (sim half-extents
      // 0.375 x 0.1 x 0.175 -> 0.075 x 0.02 x 0.035 m at 1:64)
      this.carMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.02, 0.035),
        new THREE.MeshLambertMaterial({ color: '#d7263d' }),
      );
      this.scene.add(this.carMesh);
    } else {
      this.scene = null;
      this.carMesh = null;
    }

    this.hashValue = seededHash(build.seed);
    this.steps = 0;
    this.runStatus = 'idle';
    this.stallRun = 0;
    this.car = this.spawnCar();
    this.prev = this.snapshot();
    this.current = this.prev;
  }

  /** Launch-gate release: start (or restart after a run) from second zero. */
  launch(): void {
    if (this.runStatus === 'idle' && this.steps === 0) {
      this.runStatus = 'running';
      return;
    }
    this.reset();
    this.runStatus = 'running';
  }

  /** Back to the spawn pose, hash reseeded, step zero. */
  reset(): void {
    this.sim.removeRigidBody(this.car.chassis);
    for (const wheel of this.car.wheels) this.sim.removeRigidBody(wheel);
    this.car = this.spawnCar();
    for (const l of this.launchers) l.fired = false;
    this.hashValue = seededHash(this.build.seed);
    this.steps = 0;
    this.stallRun = 0;
    this.runStatus = 'idle';
    this.prev = this.snapshot();
    this.current = this.prev;
  }

  /** One fixed step in the contract's system order. No-op unless running. */
  step(): void {
    if (this.runStatus !== 'running') return;

    // inputs: launcher triggers armed against the pre-step position
    const carPos = this.carWorldPos();
    for (const l of this.launchers) {
      if (l.fired) continue;
      const dx = carPos.x - l.pos.x;
      const dy = carPos.y - l.pos.y;
      const dz = carPos.z - l.pos.z;
      if (dx * dx + dy * dy + dz * dz < LAUNCHER_RADIUS * LAUNCHER_RADIUS) {
        l.fire(this.car.chassis, l.power, l.dir);
        l.fired = true;
      }
    }

    // car forces: suspension support, then the one tuned loss term
    const support = carStep(this.sim, this.car);
    applyRollingResistance(this.car, support.grounded, this.rollCoef);

    // physics
    stepWorld(this.sim);
    this.steps += 1;

    // constraints: the state hash on its interval, then the run outcome
    if (this.steps % HASH_INTERVAL === 0) this.hashValue = hashBodies(this.hashedBodies, this.hashValue);
    this.observe(support.grounded);
    this.prev = this.current;
    this.current = this.snapshot(support.grounded);
  }

  /** The latest interpolable snapshot. */
  state(): WorldState {
    return this.current;
  }

  /** The last two snapshots, [older, newer] — all the renderer may read. */
  states(): [WorldState, WorldState] {
    return [this.prev, this.current];
  }

  /** Interpolated car pose in world metres for frame alpha in [0, 1]. */
  carPose(alpha: number): { pos: Vec; quat: Quat } {
    const a = this.prev.car;
    const b = this.current.car;
    const pos = v(
      a.pos.x + (b.pos.x - a.pos.x) * alpha,
      a.pos.y + (b.pos.y - a.pos.y) * alpha,
      a.pos.z + (b.pos.z - a.pos.z) * alpha,
    );
    // nlerp is enough at 120 Hz; a full slerp would be ceremony
    const s =
      a.quat.x * b.quat.x + a.quat.y * b.quat.y + a.quat.z * b.quat.z + a.quat.w * b.quat.w < 0 ? -1 : 1;
    const w = a.quat.w + alpha * (s * b.quat.w - a.quat.w);
    const x = a.quat.x + alpha * (s * b.quat.x - a.quat.x);
    const y = a.quat.y + alpha * (s * b.quat.y - a.quat.y);
    const z = a.quat.z + alpha * (s * b.quat.z - a.quat.z);
    const n = Math.hypot(w, x, y, z) || 1;
    return { pos, quat: { w: w / n, x: x / n, y: y / n, z: z / n } };
  }

  /** FNV-1a accumulator over quantised body transforms, every HASH_INTERVAL
   * steps; NaN poisons via `quant`'s distinct words (never folds to 0). */
  hash(): number {
    return this.hashValue >>> 0;
  }

  hashHex(): string {
    return hashHex(this.hashValue);
  }

  get status(): RunStatus {
    return this.runStatus;
  }

  get stepCount(): number {
    return this.steps;
  }

  get time(): number {
    return this.steps * FIXED_DT;
  }

  /** Free the physics world and scene resources when the run is done. */
  dispose(): void {
    this.sim.free();
    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) m.dispose();
        }
      });
    }
  }

  // ---- internals -----------------------------------------------------------

  private spawnCar(): Car {
    const s = this.level.startSocket;
    const pose: Pose = {
      p: v(
        (s.pos.x + s.tangent.x * SPAWN_ADVANCE) * SIM_SCALE,
        (s.pos.y + s.tangent.y * SPAWN_ADVANCE) * SIM_SCALE,
        (s.pos.z + s.tangent.z * SPAWN_ADVANCE) * SIM_SCALE,
      ),
      f: v(s.tangent.x, s.tangent.y, s.tangent.z),
      u: v(s.up.x, s.up.y, s.up.z),
    };
    this.car = spawnCar(this.sim, this.variant, pose, { launchSpeed: this.launchSpeed });
    this.hashedBodies.length = 0;
    this.hashedBodies.push(this.car.chassis, ...this.car.wheels);
    return this.car;
  }

  private carWorldPos(): Vec {
    const t = this.car.chassis.translation();
    return v(t.x / SIM_SCALE, t.y / SIM_SCALE, t.z / SIM_SCALE);
  }

  private snapshot(grounded = false): WorldState {
    const t = this.car.chassis.translation();
    const r = this.car.chassis.rotation();
    return {
      step: this.steps,
      time: this.steps * FIXED_DT,
      status: this.runStatus,
      car: {
        pos: v(t.x / SIM_SCALE, t.y / SIM_SCALE, t.z / SIM_SCALE),
        quat: { w: r.w, x: r.x, y: r.y, z: r.z },
        speed: carSpeed(this.car) / SQRT_S,
        grounded,
      },
    };
  }

  /** Outcome checks after the physics step (the contract's "constraints"). */
  private observe(grounded: boolean): void {
    const p = this.carWorldPos();
    if (this.cup) {
      const dx = p.x - this.cup.center.x;
      const dy = p.y - this.cup.center.y;
      const dz = p.z - this.cup.center.z;
      if (dx * dx + dy * dy + dz * dz < this.cup.radius * this.cup.radius) {
        this.runStatus = 'finished';
        return;
      }
    }
    if (p.y < this.floorY) {
      this.runStatus = 'fell';
      return;
    }
    const speed = carSpeed(this.car) / SQRT_S;
    if (grounded && speed < this.stallSpeed) this.stallRun += 1;
    else this.stallRun = 0;
    if (this.stallRun > this.stallLimit) {
      this.runStatus = 'stalled';
      return;
    }
    if (this.time >= this.maxTime) this.runStatus = 'timeout';
  }
}
