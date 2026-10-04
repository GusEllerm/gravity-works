/**
 * Hazard zones — the deck-grip regions the Level Designer authors as level
 * DATA (Concepts/Levels §Hazards as data; ask #2a) and the physics consumes
 * per wheel contact.
 *
 * The contract: a zone is a world-space axis-aligned CUBOID with a
 * `frictionFactor` (the tap's wet patch is `0.5` — "a wet patch halves
 * grip", PROMPT §6). While a car's wheel contact sits inside a zone, that
 * wheel's deck friction scales by the factor; between zones it is exactly
 * `1`. The car module samples this field at each aligned contact point
 * (`GripField` in `src/physics/car.ts`) and the friction-circle-budgeted
 * deck forces plus the rolling-resistance impulse are the consumers — see
 * `Modules/physics` §Hazard zones.
 *
 * Determinism: a pure point-in-cuboid test over plain data, sampled inside
 * the fixed-step loop — same (level, build, seed), same verdicts, same
 * hash. A zone-free level is BIT-IDENTICAL to the pre-hazard solver: with
 * no callback the car never multiplies anything, and with zones it has not
 * touched, every factor is `1` and `x * 1 === x` exactly (`tests/unit/
 * hazards.test.ts` pins both directions).
 *
 * Kitchen04's `WetPatch` (centre + radius on the deck, `gripFactor`) is
 * normalised to the cuboid form: a square circumscribing the drip circle
 * and one contact band tall. The square is the LD contract ("one
 * collider-material region hook" is a box test in the world's space); the
 * disc→box normalisation widens the patch only at its diagonal corners,
 * which no authored line drives through.
 */
import type { Vec } from '../physics/sim.ts';
import type { Level } from './level.ts';

/** Axis-aligned world-space box (metres). `center` is the deck point the
 *  hazard sits on (for a wet patch: the splash centre), `half.y` the
 *  contact band above/below it that a wheel touch must fall inside. */
export interface CuboidShape {
  kind: 'cuboid';
  center: Vec;
  half: Vec;
}

/** A hazard zone after normalisation: geometry + the friction multiplier
 *  it applies to wheel contacts inside it (1 = no-op; 0.5 = the wet patch). */
export interface HazardZone {
  id: string;
  shape: CuboidShape;
  /** Deck friction multiplier inside the zone (the brief's grip factor). */
  frictionFactor: number;
  /** The prop that makes the hazard (art tells — the tap drips at
   *  `shape.center` upstream of the grip change; §7.4's hazard tell). */
  source?: string;
}

/** The `WetPatch` shape `kitchen01.level.ts` authors (world metres). */
export interface WetPatchData {
  id?: string;
  kind: 'wetPatch';
  center: Vec;
  radius: number;
  gripFactor: number;
  source?: string;
}

/** A level may also carry a cuboid zone directly (the LD's ask-#2 shape). */
export interface CuboidHazardData {
  id?: string;
  kind?: 'zone';
  shape: CuboidShape;
  frictionFactor: number;
  source?: string;
}

export type HazardData = WetPatchData | CuboidHazardData;

/** Anything carrying authored hazards — `KitchenLevel` does via its
 *  `hazards?: readonly WetPatch[]`; the contract `Level` may adopt the
 *  field itself when the next set's levels need it. */
export interface HazardCarrier {
  hazards?: readonly HazardData[];
}

/** Vertical half-band (world m) around a wet patch's deck plane within
 *  which a wheel contact counts as ON the patch. Wheel contacts ride the
 *  deck surface ± suspension sag; 2 cm covers sag and chord micro-steps
 *  without catching a car that is FLYING over the patch (the airborne
 *  wheels report no aligned contact at all, and a touchdown contact above
 *  the band belongs to the landing slope, not the patch). */
export const WET_ZONE_HALF_HEIGHT = 0.02;

/** Normalise one authored hazard row to the zone form. */
export function zoneFromHazard(h: HazardData, index: number): HazardZone {
  if (h.kind === 'wetPatch') {
    return {
      id: h.id ?? `wetPatch${index}`,
      shape: {
        kind: 'cuboid',
        center: { x: h.center.x, y: h.center.y, z: h.center.z },
        half: { x: h.radius, y: WET_ZONE_HALF_HEIGHT, z: h.radius },
      },
      frictionFactor: h.gripFactor,
      source: h.source,
    };
  }
  return {
    id: h.id ?? `zone${index}`,
    shape: { kind: 'cuboid', center: h.shape.center, half: h.shape.half },
    frictionFactor: h.frictionFactor,
    source: h.source,
  };
}

/** The zones a level ships (empty for every level that authors none). */
export function zonesFromLevel(level: Level & Partial<HazardCarrier>): HazardZone[] {
  return (level.hazards ?? []).map(zoneFromHazard);
}

/**
 * A level's hazard zones as a per-contact query. Immutable plain data —
 * build one per `World`, never per step.
 */
export class HazardField {
  readonly zones: readonly HazardZone[];

  constructor(zones: readonly HazardZone[]) {
    this.zones = zones;
  }

  static fromLevel(level: Level & Partial<HazardCarrier>): HazardField {
    return new HazardField(zonesFromLevel(level));
  }

  /** True iff world point `p` is strictly inside zone `z`. */
  static contains(z: HazardZone, p: Vec): boolean {
    const s = z.shape;
    return (
      Math.abs(p.x - s.center.x) < s.half.x &&
      Math.abs(p.y - s.center.y) < s.half.y &&
      Math.abs(p.z - s.center.z) < s.half.z
    );
  }

  /** Friction multiplier at a world-space point: the PRODUCT of the
   *  factors of every zone containing it (overlapping wet patches are
   *  wetter; nothing in the shipped ladder overlaps). 1 outside all zones. */
  factorAt(p: Vec): number {
    let f = 1;
    for (const z of this.zones) if (HazardField.contains(z, p)) f *= z.frictionFactor;
    return f;
  }
}
