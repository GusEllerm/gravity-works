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
// The GARDEN ships its own canonical rigs (stage 4, Environment Artist —
// the AD's carry-forward that none of the exploration frames were set
// rigs). The numbers live in the SET (`src/sets/garden/data.ts CAMERAS`)
// so this row is a copy-through, not a fork: hero frames the sun disc AND
// the trellis shadow bars, establishing takes the whole patio to the hedge
// horizon, floor lives 35 mm over the flush deck (the floor-rig law).
import { CAMERAS as GARDEN_CAMERAS } from '../sets/garden/data.ts'

const SET_SHOTS: Record<string, Partial<Record<CanonicalShot, CameraRig>>> = {
  // The GARAGE ships only its SIDE rig (stage 4 production round — the AD's
  // one knob on Review 2026-10-09: re-aim the establishing rig). The old rig
  // was the borrowed kitchen establishing (pos 0.62/0.42/0.78, flat p5 74,
  // zero blade floor-contact in the census band). This one drops to floor
  // height a hand-span nearer the same corner and pitches UP onto the bench
  // line, so the
  // blade's white floor contact runs INTO the lower-45 % band (2.3 % cover,
  // run 276), the wheel's tunnel mass and the bench silhouette re-enter as
  // darks (p5 47, inside the ratified band), and the mid-frame flake
  // cluster slides off the bottom edge into defocus instead of sitting
  // confetti-bright mid-frame. hero/floor deliberately stay on the
  // canonical fallback — the ratified hero/low stills re-render byte-
  // identical; only this row moves.
  'garage-set': {
    establishing: { position: [0.56, 0.17, 0.4], target: [0, 0.14, -0.14], fov: 35, near: 0.01, far: 12 },
  },
  'garden-set': {
    establishing: { ...GARDEN_CAMERAS.establishing, position: [...GARDEN_CAMERAS.establishing.position], target: [...GARDEN_CAMERAS.establishing.target] },
    hero: { ...GARDEN_CAMERAS.hero, position: [...GARDEN_CAMERAS.hero.position], target: [...GARDEN_CAMERAS.hero.target] },
    floor: { ...GARDEN_CAMERAS.floor, position: [...GARDEN_CAMERAS.floor.position], target: [...GARDEN_CAMERAS.floor.target] },
  },
}

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
