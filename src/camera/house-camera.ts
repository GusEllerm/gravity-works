/**
 * THE HOUSE CAMERA v1 (build 1 of "THE DOWNHILL greenlit"; the spec is
 * [[Reference/Downhill Spike]] §3 — kept HONEST, not beautiful).
 *
 * The farewell crane's DWELL→MOVE plan (`CRANE_DWELL`/`CRANE_MOVE`,
 * `CRANE_HAZE`, imported — one plan law, not a copy) made SPATIAL: the
 * farewell's `craneRoomX` is a flat ROW; the house's is a STAIR — the
 * nodes are the deck centres and altitudes of `roomGraph` (from the set
 * parcels), the edges are the connector legs, and the haze rides the leg's
 * own lift sine exactly as the farewell's does. Two grammars:
 *
 * - `menuPose` — THE MENU CAMERA = the crane PARKED at the porch (the
 *   dwell grammar stood still on the world's floor deck: the house's
 *   "crane path parked as the menu camera it always was", stated here as
 *   data; the home screen adopts it in build 2);
 * - `houseRunPose` — the downhill follows the hand-off study: dwell on the
 *   deck where a parcel was just APPROVED, then one lift-and-walk along the
 *   leg while the haze breathes, docking into the next room as its parcel
 *   approves. The plan is a pure function of the approval timeline
 *   (`houseRunPlan`), so a canonical 4-room run hand-offs THREE times —
 *   the two-hand-off minimum is a theorem of ≥3 rooms, not a tuning fact.
 *
 * Deliberately NOT here (the spike named these as later, per-room focused
 * passes): the six sets' `shots` re-aimed per deck, `setCameraSolids`
 * house-wide, the cross-section dressing. No filters chase a car — every
 * pose is a function of plan time.
 */
import * as THREE from 'three';
import { CRANE_DWELL, CRANE_MOVE, CRANE_HAZE } from '../pages/farewell.ts';
import { roomGraph, type FrameRoom, type HouseLayout } from '../world/house-frame.ts';

export interface HousePose {
  eye: [number, number, number];
  target: [number, number, number];
  /** Exponential fog density to ride (0 = clear). */
  fog: number;
}

/** The dwell grammar, lifted from the farewell's ratified stills band. */
export const HOUSE_FRAMING = {
  gazeHeight: 1.45,
  distance: 3.1,
  /** How long the camera keeps showing a crossing before the leg starts. */
  crossHold: 0.15,
  /** The compressed-leg floor (a fast double-crossing never teleports). */
  minLeg: 0.2,
} as const;

const smoothstep = (u: number): number => {
  const k = Math.min(1, Math.max(0, u));
  return k * k * (3 - 2 * k);
};

/** A parcel event the plan reads: a room APPROVED at run-time `time`. */
export interface ParcelEvent {
  room: FrameRoom;
  time: number;
}

export interface HouseSegment {
  kind: 'dwell' | 'leg';
  /** Room shown (dwell) or room departed (leg). */
  room: FrameRoom;
  /** Room arrived at (leg only). */
  to?: FrameRoom;
  from: number;
  to_t: number;
}

/** THE PLAN — pure over the approvals: dwell where the crossing happened,
 *  leg toward the next approval, arrive no later than its crossing, never
 *  sooner than `minLeg` of lift. Zero approvals = one dwell on the launch
 *  deck; N approvals = N−1 hand-offs. */
export function houseRunPlan(events: readonly ParcelEvent[]): HouseSegment[] {
  const segs: HouseSegment[] = [];
  if (events.length === 0) return segs;
  const legStart = (i: number): number => events[i]!.time + HOUSE_FRAMING.crossHold;
  for (let i = 0; i < events.length - 1; i++) {
    const s = legStart(i);
    const next = legStart(i + 1);
    const e = Math.max(s + HOUSE_FRAMING.minLeg, Math.min(s + CRANE_MOVE, next));
    segs.push({ kind: 'dwell', room: events[i]!.room, from: i === 0 ? 0 : segs.at(-1)!.to_t, to_t: s });
    segs.push({ kind: 'leg', room: events[i]!.room, to: events[i + 1]!.room, from: s, to_t: e });
  }
  const last = events[events.length - 1]!;
  segs.push({ kind: 'dwell', room: last.room, from: segs.at(-1)?.to_t ?? 0, to_t: Infinity });
  return segs;
}

/** Hand-off count of a plan (the e2e/unit claim: ≥ 2 hand-offs for ≥ 3
 *  rooms — the spike's camera section as an assertion). */
export const houseHandoffs = (plan: readonly HouseSegment[]): number =>
  plan.filter((s) => s.kind === 'leg').length;

/** The MENU pose: the crane parked at a room's deck (porch by default —
 *  the floor of the world, the house's front door). */
export function menuPose(layout: HouseLayout, room: FrameRoom = 'porch'): HousePose {
  const node = roomGraph(layout).nodes.find((n) => n.room === room)!;
  const [cx, cy] = node.center;
  return {
    eye: [cx, cy + HOUSE_FRAMING.gazeHeight, HOUSE_FRAMING.distance + 0.6],
    target: [cx, cy + 0.05, 0],
    fog: 0,
  };
}

/** THE RUN POSE at run-time `t` over the plan — a pure function of plan
 *  time, deterministic on every machine like the farewell's crane. */
export function houseRunPose(layout: HouseLayout, plan: readonly HouseSegment[], t: number): HousePose {
  const nodes = new Map(roomGraph(layout).nodes.map((n) => [n.room, n]));
  const node = (r: FrameRoom) => nodes.get(r)!;
  const dwellPose = (r: FrameRoom, u: number): HousePose => {
    const n = node(r);
    const x = n.center[0] + (u - 0.5) * 0.7;
    return { eye: [x, n.center[1] + HOUSE_FRAMING.gazeHeight, HOUSE_FRAMING.distance], target: [n.center[0], n.center[1] + 0.05, 0], fog: 0 };
  };
  // before the first segment (the launch beat): dwell on the first shown room
  const first = plan[0];
  if (!first || t < first.from) return dwellPose(plan[0]?.room ?? 'garage', 0);
  for (const seg of plan) {
    if (t >= seg.to_t) continue;
    if (seg.kind === 'dwell') return dwellPose(seg.room, Math.min(1, (t - seg.from) / CRANE_DWELL));
    const a = node(seg.room);
    const b = node(seg.to!);
    const u = smoothstep((t - seg.from) / (seg.to_t - seg.from));
    const lift = Math.sin(Math.PI * Math.min(1, (t - seg.from) / (seg.to_t - seg.from)));
    const x = a.center[0] + 0.35 + (b.center[0] - 0.35 - (a.center[0] + 0.35)) * u;
    const y = a.center[1] + HOUSE_FRAMING.gazeHeight + Math.max(0, b.center[1] - a.center[1]) * u + 0.85 * lift;
    return {
      eye: [x, y, HOUSE_FRAMING.distance + 1.3 * lift],
      target: [a.center[0] + (b.center[0] - a.center[0]) * u, a.center[1] + 0.05 + (b.center[1] - a.center[1]) * u, 0],
      fog: CRANE_HAZE.density * Math.sin(Math.PI * Math.min(1, (t - seg.from) / (seg.to_t - seg.from))),
    };
  }
  const lastSeg = plan.at(-1)!;
  return dwellPose(lastSeg.room, 1);
}

/** The live wrapper the page drives: approvals arrive from the parcel
 *  probe; the pose is recomputed from the (monotone) plan each frame. */
export class HouseCamera {
  readonly layout: HouseLayout;
  private events: ParcelEvent[] = [];
  private plan: HouseSegment[] = [];

  constructor(layout: HouseLayout) {
    this.layout = layout;
  }

  /** Start a new run: the plan is rebuilt from THIS run's crossings. */
  reset(): void {
    this.events = [];
    this.plan = [];
  }

  /** The parcel probe reports an approval (physics already did the work). */
  approved(room: FrameRoom, time: number): void {
    this.events.push({ room, time });
    this.plan = houseRunPlan(this.events);
  }

  pose(t: number): HousePose {
    if (this.events.length === 0) return menuPose(this.layout, 'garage');
    return houseRunPose(this.layout, this.plan, t);
  }

  /** Apply a pose to a live camera + fog (the page's one renderer touch). */
  apply(cam: THREE.Camera, t: number, fog: THREE.FogExp2 | null): void {
    const p = this.pose(t);
    cam.position.set(p.eye[0], p.eye[1], p.eye[2]);
    cam.lookAt(p.target[0], p.target[1], p.target[2]);
    if (fog) fog.density = p.fog;
  }
}
