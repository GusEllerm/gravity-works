/**
 * THE SET REGISTRY — one place where a set id resolves to its builder, its
 * tokens, and its per-level mount (Environment Artist, stage 4: the kitchen
 * wiring of stage 3 generalized so the next sets mount the same way).
 *
 * The `SetInstance` surface is the kitchen's export shape, unchanged in
 * spirit: `{ group, sockets, hazardZones, bounds, staging }` — solid boxes
 * for the placement guard come from the named props under the group's
 * `dress`; `sockets` are the named snap frames a level may chain through;
 * `hazardZones` are plain data in the level hazard shape; `bounds` is the
 * set's floor surface every socket and hazard is tested against.
 *
 * Two deliberate generalizations over the stage-3 kitchen code paths, and
 * two frictions kept honest:
 * - the kitchen's floor surface is called `counter`; the registry
 *   normalizes it to `bounds` (the adapter below is the only translation);
 * - the kitchen places per level via `kitchenSetPlacement`; a set without
 *   level placements returns null and mounts at the set's canonical origin.
 * - the guard-box walker in `src/boot.ts` still identifies the non-solid
 *   shell by NAME (`counter`, `shell`) and the dress group by the name
 *   `dress` — a naming convention, not data. It is documented at both ends
 *   and every future set must read this paragraph.
 */
import type * as THREE_NS from 'three'
import type { SetTokens } from '../render/tokens.ts'
import type { SetPlacement } from '../world/setPlacement.ts'
import { buildKitchenSet } from './kitchen/index.ts'
import { kitchenSetPlacement } from '../world/setPlacement.ts'
import { SET_TOKENS } from '../render/tokens.ts'
import { buildBedroomSet } from './bedroom/index.ts'
import { bedroomSetPlacement } from '../world/setPlacement.ts'
import { buildBathroomSet, BATHROOM_TOKENS } from './bathroom/index.ts'
import { bathroomSetPlacement } from '../world/setPlacement.ts'
import { buildGardenSet } from './garden/index.ts'
import { gardenSetPlacement } from '../world/setPlacement.ts'

export interface SetInstanceSocket {
  pos: THREE_NS.Vector3
  tangent: THREE_NS.Vector3
  up: THREE_NS.Vector3
}

export interface SetInstanceHazard {
  id: string
  kind: string
  center: { x: number; y: number; z: number }
  radius: number
  gripFactor: number
  source: string
}

/** The one surface the shell and the harness consume from every set. */
export interface SetInstance {
  group: THREE_NS.Group
  sockets: Record<string, SetInstanceSocket>
  hazardZones: Record<string, SetInstanceHazard>
  /** The set's floor bounds (kitchen `counter`, bedroom `floor`). */
  bounds: { shape: 'circle'; center: { x: number; z: number }; radius: number }
  staging: unknown
}

export interface SetRegistration {
  id: string
  /** The set's tokens — the shell's background and post grade read these. */
  tokens: SetTokens
  /** Build the set. Pure function of its inputs, like every set builder. */
  build(T: typeof THREE_NS, opts?: { rig?: import('../render/lighting.ts').LightingRig }): SetInstance
  /** Where the set mounts for one level id (null = canonical origin). */
  placement(levelId: string): SetPlacement | null
}

export const SETS: Record<string, SetRegistration> = {
  kitchen: {
    id: 'kitchen',
    tokens: SET_TOKENS.kitchen,
    build(T, opts = {}) {
      const set = buildKitchenSet(T, opts)
      // the one adapter: kitchen's floor surface is the counter
      return { group: set.group, sockets: set.sockets, hazardZones: set.hazardZones, bounds: set.counter, staging: set.staging }
    },
    placement: kitchenSetPlacement,
  },
  bedroom: {
    id: 'bedroom',
    tokens: SET_TOKENS.bedroom,
    build(T, opts = {}) {
      const set = buildBedroomSet(T, opts)
      return { group: set.group, sockets: set.sockets, hazardZones: set.hazardZones, bounds: set.floor, staging: set.staging }
    },
    // the bedroom rungs mount through the stage-4 placement table
    // (`bedroomSetPlacement`): the set slides behind/below the level's +x
    // chain so the corridor and the floor-band detail clear the track line.
    placement: bedroomSetPlacement,
  },
  garden: {
    id: 'garden',
    tokens: SET_TOKENS.garden,
    build(T, opts = {}) {
      const set = buildGardenSet(T, opts)
      return { group: set.group, sockets: set.sockets, hazardZones: set.hazardZones, bounds: set.ground, staging: set.staging }
    },
    // the garden rungs mount through the stage-4 garden table
    // (`gardenSetPlacement`): the patio disc centres on the run, 45 cm back
    // (the widest offset of the four sets — the hose coil stands forward of
    // the set origin in a sun stripe), the flush paving 5 mm under the
    // LOWEST authored deck, yaw 0 (the set's own off-axis bore yaw is the
    // ratified focal fix; the shadow bars must keep crossing the lane).
    placement: gardenSetPlacement,
  },
  bathroom: {
    id: 'bathroom',
    // the RATIFIED variant-A tokens (the deep tinted-aqua fill is token
    // data — `src/sets/bathroom/data.ts`; the shell's background reads it)
    tokens: BATHROOM_TOKENS,
    build(T, opts = {}) {
      const set = buildBathroomSet(T, opts)
      return { group: set.group, sockets: set.sockets, hazardZones: set.hazardZones, bounds: set.floor, staging: set.staging }
    },
    // the bathroom rungs mount through the stage-4 bathroom table
    // (`bathroomSetPlacement`): the disc centres on the run, 25 cm behind
    // the corridor, floor under the lowest authored deck.
    placement: bathroomSetPlacement,
  },
}

export function isRegisteredSet(id: string | null): id is string {
  return id !== null && id in SETS
}
