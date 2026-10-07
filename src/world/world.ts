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
  CAR,
  carSpeed,
  carStep,
  spawnCar,
  type Car,
  type CarVariant,
  type Pose,
  type WheelSupport,
} from '../physics/car.ts';
import { reify, fixtureQuota, type Build, type PlacedPiece } from '../track/build.ts';
import { ROLL_COEF } from '../feel/run.ts';
import { HazardField, type HazardZone } from './hazards.ts';
import { PIECES, type PieceDef, type PieceKind } from '../track/pieces.ts';
import { FIXTURE_SIGNAL, TRACK_FRICTION } from '../track/material.ts';
import { DECK_HALF_WIDTH } from '../track/cross-section.ts';
import { TrackSpline } from '../track/spline.ts';
import { transformSocket } from '../track/socket.ts';
import { GLOBAL_TOKENS } from '../render/tokens.ts';
import type { Level } from './level.ts';

/** Toy-plastic deck friction: the SHARED constant from
 * `src/track/material.ts`, imported above — the game and every feel rig
 * build their colliders with the same rubber (stage-2 review MAJOR: this
 * file used to export its own 0.6 beside a comment claiming it matched the
 * rigs' boxes, which no longer exist). */
/** Explicit track collision group (bit0 member) — never the default all-ones
 * group, which the suspension rays' wheel-exclusion predicate would match and
 * silently filter the deck out of (see docs/vault/Modules/physics.md gotchas).
 * The FILTER excludes bit1 (the chassis), matching `src/feel/kittrack.ts`
 * (0x0001_fffd): a raycast chassis is a pure-ray body — the moment it can
 * physically touch the kit hulls it hoovers the loop's ~3 mm chord risers and
 * anchors on them (measured on the feel track: energy-pumped ramp descent +
 * inelastic stall at the loop bottom). Physical wheels (bit2, the
 * wheelColliders bake-off variant) still hit the track. Support rays are
 * unaffected: `castRay` is called without a group filter, so a collider's
 * filter mask never hides the deck from suspension. */
export const TRACK_GROUP = 0x0001_fffd;
/** Rolling-resistance coefficient the game plays with.
 *
 * This used to be 0.02 — "until the Feel Engineer retunes ROLL_COEF" — and
 * ROLL_COEF in src/feel/run.ts was 0.12, so the shipped game and the metric
 * harness were driving TWO DIFFERENT CARS off one level file. The loop made the
 * split impossible to keep: at 0.02 the car arrives at the ring with so much
 * surplus that it leaves the deck inside the ring and drops out of the sky
 * (measured: the feel track's own replay status `fell` at t=2.49 s, x=2.76 m,
 * while the harness run of the SAME track completes in 3.21 s). The coefficient
 * is one physical property and now has one value, imported rather than
 * mirrored. */
export const WORLD_ROLL_COEF = ROLL_COEF;
/** A finish cup captures when the chassis centre comes within this many
 * cup radii (the chassis rides above the deck, so 1x never triggers).
 *
 * STAGE 3 (playtest G, the "car sits IN the cup, scored 0" finding): a
 * car RESTING at the bowl mouth — nose visibly in the cup, centre at the
 * rim — sits just OUTSIDE the 2x centre sphere (measured: 0.084 m against
 * a 0.072 m radius in the capture regression below) and was ending the
 * run `stalled` while the picture said made-it. The stall branch of
 * `observe` therefore gets a second, half-a-car-length-wider capture test
 * (`CUP_CAPTURE_FACTOR`·r + the chassis half-length): a STOPPED car whose
 * nose reaches the cup is in the cup. The moving capture test is
 * untouched, so every run that finishes in motion — every par line and
 * the feel track — ends on the exact same step with the exact same hash
 * (`tests/unit/world.test.ts` pins it). */
export const CUP_CAPTURE_FACTOR = 2;
/** Below this world speed, grounded, for `STALL_SECONDS` -> `stalled`.
 *
 * Stage 3 latency tune (playtest E: "the result panel appeared only seconds
 * later" — the panel only shows on a TERMINAL status, and the stall window
 * was the last mile of every dead run). Measured against the old pair
 * (0.02 m/s held for a flat 2 s), a parked car did not conclude in 2 s at
 * ALL: the contact corrector's jitter keeps a RESTING chassis reading
 * 0.02–0.05 m/s of phantom speed (tests/unit/world.test.ts reproduces it),
 * so the sub-0.02 counter never filled and a dead-on-the-deck car rode to
 * the 12 s TIMEOUT — the playtest's "seconds" was up to twelve. Measured
 * at 1:10 toy scale, 0.05 m/s is 0.67
 * car-lengths per second — below anything a player reads as motion; 0.02
 * was 0.27 lengths/s, a snail nobody can tell from parked. The speed gate
 * is deliberately not simply "0": contact-corrector jitter on a resting
 * chassis reads a few mm/s, and a real (if crawl) roll down a real slope
 * must not be cut — the DURATION does that job instead of a lower number.
 * The pair now concludes a dead run ≤ 0.5 s of the car's real stop —
 * asserted in `tests/unit/world.test.ts` (`≤ 1.0 s` ledger bar with one
 * full filter window of headroom). A genuine crest-crossing dip below
 * 0.05 lasts ≪ 0.5 s and never trips the window: every par run of L01–L05
 * and the feel track finish with their terminal step UNCHANGED (the same
 * test pins the feel-track hash bit-for-bit across the constant swap —
 * these are outcome-only reads; no force in the solver touches them). */
export const STALL_SPEED = 0.05;
/** Grounded-slow seconds before `observe` concludes `stalled` (see
 *  `STALL_SPEED`). 0.5 s ≈ 60 steps of the 120 Hz stall counter. */
export const STALL_SECONDS = 0.5;
/** Below this world speed, NOT grounded, for `SLOW_AIR_SECONDS` -> `stalled`.
 *
 * STAGE 4 CAMERA/LATENCY ROUND 2 (playtest J+K: "the result lands 2-3 s
 * after the failure is visible"). The stage-3 stall window reads
 * `grounded && speed < STALL_SPEED` — a car WEDGED off the deck (resting
 * against a prop-side wall, wheels hanging just off the deck edge, the
 * suspension rays finding nothing) reads grounded FALSE and speed ~0
 * forever, so the counter never fills and the dead run rides the 12 s
 * TIMEOUT: the exact "timeout wait" suspect the J+K reopen named. The
 * window is outcome-only like the stage-3 pair, and deliberately slower
 * (1.0 s vs 0.5 s): a genuine launch, hop or gap flight passes 0.05 m/s in
 * well under 0.1 s (measured: every airborne sample of every L01-L05 and
 * feel-track par run reads >= 0.3 m/s), so no real run's terminal step
 * moves — the feel-track and par-run hashes are pinned unchanged in
 * `tests/unit/world.test.ts`. The 1.0 s bar is the same ≤ 1 s ledger
 * promise a resting car already meets on the grounded path. */
export const SLOW_AIR_SPEED = 0.05;
/** Slow-while-airborne seconds before `observe` concludes `stalled` (see
 *  `SLOW_AIR_SPEED`). 1.0 s ≈ 120 steps of the 120 Hz airborne-slow counter. */
export const SLOW_AIR_SECONDS = 1.0;
/** How far down the start socket's tangent the chassis centre spawns — a
 * car centred exactly on the start socket hangs half its wheelbase over
 * the deck edge and slides off backwards (measured, 2026-10-04).
 *
 * It is kept deliberately short: the release pose now comes from the feel rig's
 * own `marks.start`, so every extra centimetre here moves the GAME's release
 * away from the one the METRICS measure. The feel rigs advance along the
 * RIG's arc, which already puts the car's whole wheelbase on the deck, so the
 * two agree to within this 2 cm of a 2.5 m track. */
export const SPAWN_ADVANCE = 0.02;
/** A launcher fires when the chassis centre passes within this (world m). */
export const LAUNCHER_RADIUS = 0.05;

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
    /** World m/s — the juice hooks' derivation input (landing vy for the
     *  squash, forward projection for the hazard tell's lead time). */
    velocity: Vec;
    grounded: boolean;
    /** Mean deck grip over the last step's wheel contacts (1 = dry; the
     *  hazard tell's numeric companion — see `src/world/hazards.ts`). */
    grip: number;
    /** Largest |lateral slip angle| (rad) across the wheels last step
     *  (the squeal hook's number; 0 while no wheel is in deck contact). */
    slip: number;
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
 * worldsmoke harness scene). One group, world metres, no lights baked in.
 *
 * FIXTURE READABILITY SIGNAL (stage 4, playtest Q handoff): pass the level's
 * `fixtures` table and every fixture-piece occurrence (same quota rule the
 * boot mount uses, `fixtureQuota`) wears the shared treatment — its deck/
 * shell materials carry `userData[FIXTURE_SIGNAL.key]` and its deck gets a
 * narrow lighter-orange centreline inlay. Geometry, hashes and tray pieces
 * are untouched; without the table (share cards, worldsmoke) the build
 * renders exactly as before. */
export interface TrackMeshOptions {
  fixtures?: Partial<Record<PieceKind, number>>;
}

/** Half-width of the deck inlay stripe — a narrow inlay (45 % of the deck's
 *  running surface), never a repaint (Art Bible §Color: one accent read per
 *  surface; the signal must not fight the room palette). */
const INLAY_HALF_WIDTH = DECK_HALF_WIDTH * 0.45;
/** Inlay lift above the deck surface, metres — clear of z-fighting at the
 *  canonical cameras' depth range, low enough to read as flush plastic. */
const INLAY_LIFT = 0.0008;

/** The inlay ribbon for one piece spline (piece-local space): a flat strip
 *  along the centreline over every solid run — gaps stay empty, the stripe
 *  never bridges a void the car flies. */
function deckInlayGeometry(spline: TrackSpline): THREE.BufferGeometry {
  const frames = spline.stationFrames();
  const pos: number[] = [];
  const side = new THREE.Vector3();
  const edge = (f: { pos: THREE.Vector3; tangent: THREE.Vector3; up: THREE.Vector3 }, sign: number) =>
    f.pos
      .clone()
      .addScaledVector(f.up, INLAY_LIFT)
      .addScaledVector(side.crossVectors(f.tangent, f.up).normalize(), sign * INLAY_HALF_WIDTH);
  for (const run of spline.solidRuns()) {
    for (let r = run.start; r < run.end; r++) {
      const a0 = edge(frames[r]!, -1);
      const a1 = edge(frames[r]!, 1);
      const b0 = edge(frames[r + 1]!, -1);
      const b1 = edge(frames[r + 1]!, 1);
      pos.push(a0.x, a0.y, a0.z, b1.x, b1.y, b1.z, b0.x, b0.y, b0.z);
      pos.push(a0.x, a0.y, a0.z, a1.x, a1.y, a1.z, b1.x, b1.y, b1.z);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.computeVertexNormals();
  return geo;
}

/** A clone of a shared plain material carrying the fixture signal flag (and
 *  optionally the inlay color + flat-sheet double side). `userData` is the
 *  unit-testable half. */
function signalized(base: THREE.Material, color?: string): THREE.Material {
  const mat = base.clone();
  if (color !== undefined) {
    (mat as THREE.MeshLambertMaterial).color.set(color);
    mat.side = THREE.DoubleSide; // the ribbon is a flat sheet — never a culled face
    // bias the inlay's depth toward the camera so it always wins over the
    // coplanar deck it sits 0.8 mm above (depth precision, not lift, decides
    // which one a far pixel sees)
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -1;
    mat.polygonOffsetUnits = -1;
  }
  mat.userData[FIXTURE_SIGNAL.key] = 'deck-inlay';
  return mat;
}

export function buildTrackMeshes(build: Build, options: TrackMeshOptions = {}): THREE.Group {
  const group = new THREE.Group();
  // named so the shell's static framing can box the TRACK alone (never the
  // set or the ground plane the scene also carries) — see boot.frameCamera
  group.name = 'track';
  const deck = new THREE.MeshLambertMaterial({ color: GLOBAL_TOKENS.trackOrange });
  const shell = new THREE.MeshLambertMaterial({ color: '#dce6ea', side: THREE.DoubleSide });
  const isFixture = fixtureQuota(options.fixtures ?? {});
  for (const piece of reify(build).pieces) {
    const placed = new THREE.Group();
    placed.applyMatrix4(piece.transform);
    const def = PIECES[piece.def];
    const fixture = isFixture(piece.def);
    const deckMat = fixture ? signalized(deck) : deck;
    const shellMat = fixture ? signalized(shell) : shell;
    const sweep = new THREE.Mesh(def.spline(piece.params).toMesh(), deckMat);
    placed.add(sweep);
    for (const extra of def.extraGeometries(piece.params)) placed.add(new THREE.Mesh(extra, shellMat));
    if (fixture) {
      const inlay = new THREE.Mesh(
        deckInlayGeometry(def.spline(piece.params)),
        signalized(deck, FIXTURE_SIGNAL.inlayColor),
      );
      inlay.name = 'fixture-inlay';
      placed.add(inlay);
    }
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
  private readonly slowAirLimit: number;
  private readonly launchSpeed: number;
  private readonly variant: CarVariant;
  /** The level's hazard zones (empty for hazard-free levels — the common
   *  case, and the hash-identical case: no callback is even passed to
   *  `carStep` then). */
  private readonly hazards: HazardField;
  private readonly gripAt?: (contactSimPos: Vec) => number;

  private hashValue: number;
  private steps: number;
  private runStatus: RunStatus;
  private stallRun: number;
  private slowAirRun: number;
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
    this.stallSpeed = options.stallSpeed ?? STALL_SPEED;
    this.stallLimit = Math.round((options.stallSeconds ?? STALL_SECONDS) / FIXED_DT);
    this.slowAirLimit = Math.round(SLOW_AIR_SECONDS / FIXED_DT);
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
          power: def.power * SIM_SCALE, // world Δv -> sim Δv (v scales at S)
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

    // Hazard zones are level data (Concepts/Levels §Hazards as data, ask
    // #2a): a world-space grip field the car samples per wheel contact.
    this.hazards = HazardField.fromLevel(level);
    if (this.hazards.zones.length > 0) {
      this.gripAt = (p) => this.hazards.factorAt({ x: p.x / SIM_SCALE, y: p.y / SIM_SCALE, z: p.z / SIM_SCALE });
    }

    if (options.visuals ?? true) {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color('#efe0c8');
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.85));
      const key = new THREE.DirectionalLight(0xffffff, 1.1);
      key.position.set(1, 2, 1.5);
      this.scene.add(key);
      this.scene.add(
        buildTrackMeshes(build, {
          fixtures: (level as unknown as { fixtures?: Partial<Record<PieceKind, number>> }).fixtures,
        }),
      );
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
    this.slowAirRun = 0;
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
    this.slowAirRun = 0;
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

    // car forces: suspension support, then the one tuned loss term.
    // `support.grip` is the mean hazard grip over the wheel contacts (1 =
    // dry, exactly, so a hazard-free level rolls bit-for-bit as before).
    const support = carStep(this.sim, this.car, this.gripAt);
    applyRollingResistance(this.car, support.grounded, this.rollCoef, support);

    // physics
    stepWorld(this.sim);
    this.steps += 1;

    // constraints: the state hash on its interval, then the run outcome
    if (this.steps % HASH_INTERVAL === 0) this.hashValue = hashBodies(this.hashedBodies, this.hashValue);
    this.observe(support.grounded);
    this.prev = this.current;
    this.current = this.snapshot(support.grounded, support);
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

  /** The level's hazard zones after normalisation (world-space cuboids).
   *  Read-only surface for the shell's hazard-status path (the e2e seam and
   *  any future HUD tell); physics reads the same field through `gripAt`. */
  get hazardZones(): readonly HazardZone[] {
    return this.hazards.zones;
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

  private snapshot(grounded = false, support?: WheelSupport): WorldState {
    const t = this.car.chassis.translation();
    const r = this.car.chassis.rotation();
    const lv = this.car.chassis.linvel();
    return {
      step: this.steps,
      time: this.steps * FIXED_DT,
      status: this.runStatus,
      car: {
        pos: v(t.x / SIM_SCALE, t.y / SIM_SCALE, t.z / SIM_SCALE),
        quat: { w: r.w, x: r.x, y: r.y, z: r.z },
        speed: carSpeed(this.car) / SIM_SCALE,
        velocity: v(lv.x / SIM_SCALE, lv.y / SIM_SCALE, lv.z / SIM_SCALE),
        grounded,
        grip: support?.grip ?? 1,
        slip: support ? Math.max(...support.slipPerWheel.map(Math.abs)) : 0,
      },
    };
  }

  /** Outcome checks after the physics step (the contract's "constraints"). */
  private observe(grounded: boolean): void {
    const p = this.carWorldPos();
    let cupD2 = Infinity;
    if (this.cup) {
      const dx = p.x - this.cup.center.x;
      const dy = p.y - this.cup.center.y;
      const dz = p.z - this.cup.center.z;
      cupD2 = dx * dx + dy * dy + dz * dz;
      if (cupD2 < this.cup.radius * this.cup.radius) {
        this.runStatus = 'finished';
        return;
      }
    }
    if (p.y < this.floorY) {
      this.runStatus = 'fell';
      return;
    }
    const speed = carSpeed(this.car) / SIM_SCALE;
    if (grounded && speed < this.stallSpeed) this.stallRun += 1;
    else this.stallRun = 0;
    // stage-4 (J+K): a wedged car whose rays find no deck reads "airborne"
    // forever — a 12 s timeout is the wrong verdict for a car that is
    // visibly resting off-track; 1.0 s of airborne-slow concludes `stalled`
    // (see SLOW_AIR_SPEED; launches/hops stay far outside the window).
    if (!grounded && speed < SLOW_AIR_SPEED) this.slowAirRun += 1;
    else this.slowAirRun = 0;
    if (this.stallRun > this.stallLimit) {
      // Playtest G's contradiction, resolved by physics: a car that STOPS
      // with its nose in the bowl — centre up to a half-car-length beyond
      // the capture sphere — is CAPTURED, not stalled (see
      // CUP_CAPTURE_FACTOR). Measured: centre 0.084 m from the cup centre
      // at the rim-stall step; the pure-centre radius is 0.072 m.
      if (this.cup) {
        const reach = this.cup.radius + CAR.halfL / SIM_SCALE;
        if (cupD2 < reach * reach) {
          this.runStatus = 'finished';
          return;
        }
      }
      this.runStatus = 'stalled';
      return;
    }
    if (this.slowAirRun > this.slowAirLimit) {
      this.runStatus = 'stalled';
      return;
    }
    if (this.time >= this.maxTime) this.runStatus = 'timeout';
  }
}
