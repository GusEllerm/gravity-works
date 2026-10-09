/**
 * `src/juice/layer.ts` — the shell-side CONSUMER of the `JuiceFeed`
 * (program T1.1: the written-and-judged juice had no consumer; the feed
 * emitted squash/dust and NOTHING imported it).
 *
 * THE WIRING LAW (the same firewall the sound mix lives behind, stated for
 * juice): the layer READS pose-delta snapshots handed to it from the render
 * loop — `step(prev, next)` with the two `WorldState`s the frame sink
 * already exposes (`World.states()`) — and emits nothing back. It never
 * touches the colliders or `hashedBodies`: juice stays hash-neutral by
 * construction, and worse, it must not even branch on sim state. The
 * numbers that scale the effects ride on the feed's events
 * (`Modules/juice`), so the layer holds no thresholds of its own.
 *
 * WHAT IT MOUNTS:
 * - `landingSquash` — the car rig's squash envelope on a 120 ms WALL clock
 *   (the envelope is a render artifact; the sim never sees it), plus the
 *   `onLanding` hook the shell routes to the landing THUD (audio is not
 *   motion — it survives reduced-motion exactly like the feed's own
 *   informational markers do).
 * - `dustPuff` — a pooled puff film at the event position.
 * - `snapSettle` — the placed piece's overshoot pop (the builder hook calls
 *   `snap`, the shell hands the layer the piece's rebuilt group).
 * - `squeal` / `hazardTell` / `chime` — passed to `onEvent` for the shell
 *   (the squeal voice and the drip-tell voice are not in this delivery;
 *   the events are already there when they come).
 *
 * REDUCED MOTION (`src/ui/motion.ts` law via `reducedMotionActive`): every
 * ANIMATED presentation snaps to its still frame — no squash, no puff, no
 * pop (the shell owns the matching wheel-spin gate). The feed itself is
 * constructed UNreduced so the landing's SOUND hook keeps firing; this flag
 * decides the pixels only.
 */
import * as THREE from 'three';
import type { WorldState } from '../world/world.ts';
import type { HazardZone } from '../world/hazards.ts';
import type { JuiceEvent, JuiceFeed } from './juice.ts';

/** Pooled puffs: landings never stack more than a couple deep in one
 *  120 ms window; a ring of 4 covers the pathological case without a pool
 *  allocator. */
const PUFFS = 4;
/** Puff film colour — the warm dust of a toy scale (the stills' crumb hue;
 *  deliberately not the track orange: the puff is scenery, not brand). */
const PUFF_COLOR = '#e8d9bd';

export interface JuiceLayerOptions {
  /** Stills for every animated effect (motion.ts law). Sound hooks stay
   *  live — a thud is not a motion. */
  reducedMotion?: boolean;
  /** Puff colour override (tests / per-set dust tint). */
  puffColor?: string;
  /** Landing hook: the shell fires the THUD off this (impulse N·s scales
   *  the loudness; the position picks the surface voice). */
  onLanding?: (e: Extract<JuiceEvent, { kind: 'landingSquash' }>) => void;
  /** Pass-through for the events the layer does not present (squeal,
   *  hazard tell, chime). */
  onEvent?: (e: JuiceEvent) => void;
}

export interface JuiceLayer {
  /** Mount the puff pool into the current scene (a rebuild re-mounts —
   *  the pool itself is created once per boot). */
  attachScene(scene: THREE.Scene): void;
  /** Lift the pool out of the outgoing scene BEFORE `World.dispose`
   *  traverses it (the set-group law, R7). */
  liftFromScene(): void;
  /** Hand the layer the rig's squash pivot (the car-space root). */
  setCarBody(body: THREE.Object3D | null): void;
  /** The current run's feed (null between runs); zones ride with it. */
  setFeed(feed: JuiceFeed | null): void;
  /** One render-frame read of the frame sink's last two snapshots. */
  step(prev: WorldState, next: WorldState): void;
  /** The builder's snap hook (the feed call + the pop arming). */
  snap(at: { x: number; y: number; z: number }, pieceDef: string): void;
  /** Hand over the group the snapped piece's meshes landed on (the
   *  rebuild's `track` child). null = nothing pops. */
  popPlacedPiece(group: THREE.Object3D | null): void;
  /** Advance the wall-clock envelopes (ms). */
  frame(dtMs: number): void;
  /** Drop every envelope and hide the pool (run reset). */
  reset(): void;
  dispose(): void;
}

/** The zone a world point sits inside, or null — the landing/landing-sound
 *  surface read: a plain point-in-box test over the level's plain zone
 *  data, the same data the e2e seam `__gwHazardZones` reports. */
export function zoneAt(zones: readonly HazardZone[], p: { x: number; y: number; z: number }): HazardZone | null {
  for (const z of zones) {
    const c = z.shape.center;
    const h = z.shape.half;
    if (Math.abs(p.x - c.x) <= h.x && Math.abs(p.y - c.y) <= h.y && Math.abs(p.z - c.z) <= h.z) {
      return z;
    }
  }
  return null;
}

interface Puff {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  /** remaining / total ms, ground radius m */
  life: number;
  dur: number;
  r: number;
}

/**
 * The layer. One per boot; the scene/feed/car-body are re-handed across
 * rebuilds exactly like the mounted set group (created once, lifted before
 * `World.dispose`, re-added to the new scene — the leak gate idiom the
 * shell already proves against).
 */
export function createJuiceLayer(opts: JuiceLayerOptions = {}): JuiceLayer {
  const reduced = opts.reducedMotion ?? false;
  const puffGeo = new THREE.SphereGeometry(1, 10, 6);
  const puffs: Puff[] = [];
  for (let i = 0; i < PUFFS; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: opts.puffColor ?? PUFF_COLOR,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(puffGeo, mat);
    mesh.visible = false;
    mesh.name = 'juice-puff';
    mesh.renderOrder = 2; // over the deck; the panels are DOM, always above
    puffs.push({ mesh, mat, life: 0, dur: 1, r: 0.02 });
  }
  let carBody: THREE.Object3D | null = null;
  let feed: JuiceFeed | null = null;
  /** squash envelope: remaining ms, duration ms, peak depth */
  let squashMs = 0;
  let squashDur = 120;
  let squashPeak = 0;
  /** snap pop envelope on the handed group */
  let popGroup: THREE.Object3D | null = null;
  let popMs = 0;
  let popDur = 250;
  let popOver = 0.06;
  let snapQueued = false;
  let puffCursor = 0;

  const still = (o: THREE.Object3D | null): void => {
    if (o) o.scale.setScalar(1);
  };

  const present = (events: JuiceEvent[]): void => {
    for (const e of events) {
      switch (e.kind) {
        case 'landingSquash': {
          opts.onLanding?.(e); // sound is not motion: fires either way
          if (!reduced) {
            squashPeak = e.peakScale;
            squashDur = Math.max(1, e.durationMs);
            squashMs = squashDur;
          }
          break;
        }
        case 'dustPuff': {
          if (!reduced) {
            const p = puffs[puffCursor % PUFFS]!;
            puffCursor++;
            p.mesh.position.set(e.at.x, e.at.y, e.at.z);
            p.r = Math.max(0.005, e.radiusM);
            p.dur = Math.max(1, e.durationMs);
            p.life = p.dur;
            p.mesh.visible = true;
          }
          break;
        }
        case 'snapSettle': {
          if (!reduced) {
            popDur = Math.max(1, e.durationMs);
            popOver = e.overshoot;
          }
          break;
        }
        default:
          opts.onEvent?.(e);
      }
    }
  };

  return {
    attachScene(scene) {
      for (const p of puffs) if (!p.mesh.parent) scene.add(p.mesh);
    },
    liftFromScene() {
      for (const p of puffs) p.mesh.removeFromParent();
    },
    setCarBody(body) {
      still(carBody);
      carBody = body;
    },
    setFeed(f) {
      feed = f;
    },
    step(prev, next) {
      if (feed) present(feed.step(prev, next));
    },
    snap(at, pieceDef) {
      if (feed) present(feed.pieceSnapped(at, pieceDef));
      snapQueued = true;
    },
    popPlacedPiece(group) {
      still(popGroup);
      popGroup = group;
      if (group && snapQueued && !reduced) {
        popMs = popDur;
        group.scale.setScalar(1 + popOver); // the pop STARTS proud
      } else {
        still(group);
      }
      snapQueued = false;
    },
    frame(dtMs) {
      const dt = Math.max(0, dtMs);
      if (squashMs > 0 && carBody) {
        squashMs = Math.max(0, squashMs - dt);
        const e = squashMs / squashDur; // 1 at impact, 0 at rest
        const k = e * e; // fast out, ease home
        carBody.scale.set(1 + squashPeak * 0.5 * k, 1 - squashPeak * k, 1 + squashPeak * 0.5 * k);
        if (squashMs === 0) still(carBody);
      }
      if (popMs > 0 && popGroup) {
        popMs = Math.max(0, popMs - dt);
        popGroup.scale.setScalar(1 + popOver * (popMs / popDur));
        if (popMs === 0) still(popGroup);
      }
      for (const p of puffs) {
        if (p.life <= 0) continue;
        p.life = Math.max(0, p.life - dt);
        const e = p.life / p.dur;
        p.mesh.scale.setScalar(p.r * (1.05 - 0.45 * e)); // blooms outward as it fades
        p.mat.opacity = 0.5 * e;
        if (p.life <= 0) p.mesh.visible = false;
      }
    },
    reset() {
      squashMs = 0;
      popMs = 0;
      snapQueued = false;
      still(carBody);
      still(popGroup);
      popGroup = null;
      for (const p of puffs) {
        p.life = 0;
        p.mesh.visible = false;
        p.mat.opacity = 0;
      }
    },
    dispose() {
      for (const p of puffs) {
        p.mesh.removeFromParent();
        p.mat.dispose();
      }
      puffGeo.dispose();
    },
  };
}
