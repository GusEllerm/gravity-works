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
 * - the guard-box walker in `src/pages/mount.ts` still identifies the non-solid
 *   shell by NAME (`counter`, `shell`) and the dress group by the name
 *   `dress` — a naming convention, not data. It is documented at both ends
 *   and every future set must read this paragraph.
 *
 * LAZY BUILDERS (stage 4 payload fix): `build` is async and imports the
 * set's builder module DYNAMICALLY. The eager chain — every `buildXSet`
 * imported at the top of this file — put all five geometry modules into
 * boot's module graph, so EVERY page load evaluated them even though
 * exactly one set mounts per boot; the CI boot-time diff (every boot-heavy
 * e2e ~2x slower once the garage row landed) is the player-side first-paint
 * regression the same fix pays for. Tokens and placement tables stay
 * static (small, data-only); the mounted set's module fetch rides the
 * already-async boot (after the warm frame, before `World.create`).
 */
import type * as THREE_NS from 'three'
import type { SetTokens } from '../render/tokens.ts'
import type { SetPlacement } from '../world/setPlacement.ts'
import { SET_TOKENS } from '../render/tokens.ts'
// the token rows stay STATIC imports: they live in the sets' data-only
// modules (no three import, no geometry) so the warm first frame and the
// post grade read them before the mounted set's module has even fetched
import { BATHROOM_TOKENS } from './bathroom/data.ts'
import { GARAGE_TOKENS } from './garage/data.ts'
import {
  kitchenSetPlacement,
  bedroomSetPlacement,
  bathroomSetPlacement,
  gardenSetPlacement,
  garageSetPlacement,
  porchSetPlacement,
} from '../world/setPlacement.ts'

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
  /** Build the set. Pure function of its inputs, like every set builder.
   *  Async by design: the builder module is dynamically imported inside,
   *  keeping the four unmounted sets out of boot's module graph (header). */
  build(T: typeof THREE_NS, opts?: { rig?: import('../render/lighting.ts').LightingRig }): Promise<SetInstance>
  /** Where the set mounts for one level id (null = canonical origin). */
  placement(levelId: string): SetPlacement | null
}

/** The PORCH registration (stage 5, Environment Artist — the sixth room and
 *  the campaign's THRESHOLD). Exported as a named row (the task's `PORCH_SET`
 *  handle: the ladder crew and any future wiring address it directly) and
 *  mounted in `SETS.porch` like every other room. No levels yet — the
 *  placement table is empty and every mount is the canonical-origin
 *  fallback until the porch rungs land (the ladder crew follows this set);
 *  the handover (sockets `door.in`/`door.out`/`step.out`, the shell/dress
 *  split that keeps the door mouth buildable, the empty hazard table, and
 *  the fixtures-quota recommendation) is stated once in
 *  `src/sets/porch/data.ts` and in the stage-5 session log. */
export const PORCH_SET: SetRegistration = {
  id: 'porch',
  // the RATIFIED variant-A tokens (the slate-storm dominant + lantern amber
  // are the token row the exploration judged against — `src/render/tokens.ts`;
  // the shell's background reads this row; the renders' flat SKY value is
  // set data, the garden pattern)
  tokens: SET_TOKENS.porch,
  async build(T, opts = {}) {
    const { buildPorchSet } = await import('./porch/index.ts')
    const set = buildPorchSet(T, opts)
    return { group: set.group, sockets: set.sockets, hazardZones: set.hazardZones, bounds: set.ground, staging: set.staging }
  },
  // no porch rungs exist yet: every level id returns null (the canonical-
  // origin mount the `?set=porch` inspection entry uses), and the table
  // fills per rung exactly as the other five rooms'
  placement: porchSetPlacement,
}

export const SETS: Record<string, SetRegistration> = {
  kitchen: {
    id: 'kitchen',
    tokens: SET_TOKENS.kitchen,
    async build(T, opts = {}) {
      const { buildKitchenSet } = await import('./kitchen/index.ts')
      const set = buildKitchenSet(T, opts)
      // the one adapter: kitchen's floor surface is the counter
      return { group: set.group, sockets: set.sockets, hazardZones: set.hazardZones, bounds: set.counter, staging: set.staging }
    },
    placement: kitchenSetPlacement,
  },
  bedroom: {
    id: 'bedroom',
    tokens: SET_TOKENS.bedroom,
    async build(T, opts = {}) {
      const { buildBedroomSet } = await import('./bedroom/index.ts')
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
    async build(T, opts = {}) {
      const { buildGardenSet } = await import('./garden/index.ts')
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
    async build(T, opts = {}) {
      const { buildBathroomSet } = await import('./bathroom/index.ts')
      const set = buildBathroomSet(T, opts)
      return { group: set.group, sockets: set.sockets, hazardZones: set.hazardZones, bounds: set.floor, staging: set.staging }
    },
    // the bathroom rungs mount through the stage-4 bathroom table
    // (`bathroomSetPlacement`): the disc centres on the run, 25 cm behind
    // the corridor, floor under the lowest authored deck.
    placement: bathroomSetPlacement,
  },
  garage: {
    id: 'garage',
    // the RATIFIED variant-C tokens (resin-olive dominant, the red spent
    // twice — token data in `src/sets/garage/data.ts`; the shell's
    // background reads this row, the bathroom pattern for a variant palette)
    tokens: GARAGE_TOKENS,
    async build(T, opts = {}) {
      const { buildGarageSet } = await import('./garage/index.ts')
      const set = buildGarageSet(T, opts)
      return { group: set.group, sockets: set.sockets, hazardZones: set.hazardZones, bounds: set.floor, staging: set.staging }
    },
    // the garage rungs mount through the stage-4 garage table
    // (`garageSetPlacement`): the slab/ground disc centres on the run,
    // 37 cm behind the corridor (the family-tightest offset that still
    // clears the cardboard/lid dress), slab 5 mm under the LOWEST authored
    // deck, yaw 0 (the ratified wheel, blade and films all sit behind the
    // set-origin line). The `?set=garage` inspection entry still gets the
    // canonical-origin fallback.
    placement: garageSetPlacement,
  },
  porch: PORCH_SET,
}

export function isRegisteredSet(id: string | null): id is string {
  return id !== null && id in SETS
}
