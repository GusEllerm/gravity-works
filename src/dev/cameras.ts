// Canonical cameras, in exactly one place. These are provisional kitchen
// framings (art bible §Canonical cameras); at stage 2 they move into level
// files unchanged in spirit — do not fork these numbers elsewhere.

export type CanonicalShot = 'establishing' | 'hero' | 'floor' | 'material-review'

export interface CameraRig {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  near: number
  far: number
}

export const RENDER_WIDTH = 1600
export const RENDER_HEIGHT = 900
export const RENDER_DPR = 1

const SHOTS: Record<CanonicalShot, CameraRig> = {
  // whole set, track visible — pulled up and back over the counter
  establishing: { position: [0.62, 0.42, 0.78], target: [0, 0.05, 0], fov: 35, near: 0.01, far: 12 },
  // the set's signature affordance in use (provisional: the bowl turn)
  hero: { position: [0.3, 0.15, 0.36], target: [0.02, 0.05, -0.02], fov: 35, near: 0.01, far: 12 },
  // low, close, a car in the focus band
  floor: { position: [0.16, 0.035, 0.26], target: [0.0, 0.04, 0.0], fov: 35, near: 0.005, far: 12 },
  // material review: flat even three-quarter on a turntable of test props
  'material-review': { position: [0.16, 0.145, 0.5], target: [0, 0.028, 0.01], fov: 30, near: 0.008, far: 12 },
}

const SHOT_NAMES = Object.keys(SHOTS) as CanonicalShot[]

export function canonicalCamera(shot: CanonicalShot): CameraRig {
  return SHOTS[shot]
}

export function isCanonicalShot(value: string): value is CanonicalShot {
  return (SHOT_NAMES as string[]).includes(value)
}

/**
 * PER-SET canonical camera data. A set that ships its own framings registers
 * them here (sourced FROM the set, so `scene=<set>&level=<id>` renders and
 * the game camera list read one list of shots). The production kitchen has
 * no camera data of its own yet — `src/sets/kitchen` owns props, sockets and
 * hazard data, deliberately not cameras — so `setCameras('kitchen-set', …)`
 * falls back to the provisional kitchen rig above, which stays the shipped
 * framing until the Environment Artist's next round ships set-side rigs.
 */
const SET_SHOTS: Record<string, Partial<Record<CanonicalShot, CameraRig>>> = {}

/** The canonical camera for one set's shot — the set's own rig when the set
 *  ships one, else the provisional kitchen rig (never a forked number). */
export function setCameras(setId: string, shot: CanonicalShot): CameraRig {
  return SET_SHOTS[setId]?.[shot] ?? canonicalCamera(shot)
}

/** The set's canonical shot list — its own keys when it has them, else the
 *  shared canonical list. This is the harness's one shot list per set. */
export function setShotList(setId: string): CanonicalShot[] {
  const own = Object.keys(SET_SHOTS[setId] ?? {}) as CanonicalShot[]
  return own.length > 0 ? own : SHOT_NAMES
}
