/**
 * `src/juice` — the §7.4 juice hooks: a PURE, STATE-DRIVEN trigger layer.
 *
 * The rule of this module: **physics is the clock, juice is the echo.**
 * Nothing here feeds back into the simulation — the feed only READS
 * consecutive `WorldState` snapshots (plus one builder-side call for piece
 * snaps) and emits events that carry the physical numbers behind them, so
 * the renderer animates from the event's numbers and the audio gets the
 * same values. That makes juice hash-neutral by construction: juice on ==
 * juice off, bit for bit (asserted in `tests/unit/juice.test.ts`).
 *
 * What each §7.4 hook is driven by, and its number:
 *
 * | hook              | trigger (from state)                         | numbers carried                       |
 * |-------------------|----------------------------------------------|---------------------------------------|
 * | tyre squeal       | grounded slip angle > 0.17 rad, > 1 m/s      | slip rad, speed, intensity 0..1       |
 * | landing squash    | airborne -> grounded, approach vy            | impulse N·s, peak scale, 120 ms       |
 * | dust puff         | same, above a higher impulse floor           | impulse N·s, puff radius, 120 ms      |
 * | piece snap settle | builder calls `pieceSnapped()`               | settle ms 250, displacement hint      |
 * | hazard tell       | projected arrival at a zone face within 350ms | lead ms, gripFactor, zone position    |
 * | finish chime      | running -> terminal status                           | time s, speed m/s                     |
 *
 * Reduced motion (`reducedMotion: true`) collapses every ANIMATED effect
 * to nothing and every instantaneous one to an instant marker: squeal,
 * squash and dust emit nothing at all; the hazard tell and the chime (pure
 * information, no motion) still fire with `durationMs: 0`.
 *
 * DETERMINISM: the feed is a deterministic function of the state sequence
 * — same run, same events, same order. It has no clocks, no randomness,
 * and no Rapier access.
 */

import type { Vec } from '../physics/sim.ts';
import type { RunStatus, WorldState } from '../world/world.ts';
import type { HazardZone } from '../world/hazards.ts';

/** Nominal chassis mass in WORLD kg — `CAR_MASS` (40 kg sim) converted at
 *  `SIM_SCALE³` per `toWorldImpulse`'s S⁴ rule; the landing impulse the
 *  feel harness measures (≈0.06 N·s) is consistent with it. */
export const JUICE_CAR_MASS_KG = 0.04;

/** All §7.4 tuning numbers in one place (the "with numbers" contract). */
export const JUICE = {
  /** Tyre squeal: slip angle above which rubber squeals (rad ≈ 9.7°).
   *  Measured floors: rolling runs top out at 8.5° of re-align slip and
   *  average ~3°; a par landing skids to 44° while the wheels re-align —
   *  the threshold sits between so clean rolls are silent. */
  SQUEAL_SLIP_MIN_RAD: 0.17,
  /** Squeal needs speed — a parked creep is silent (world m/s). */
  SQUEAL_SPEED_MIN: 1.0,
  /** Squeal re-triggers at most every 50 ms while the condition holds. */
  SQUEAL_RETRIGGER_MS: 50,
  /** Slip angle at which squeal reaches full intensity (rad ≈ 20°). */
  SQUEAL_FULL_SLIP_RAD: 0.35,
  /** Landing squash + dust: the impact-impulse curve runs this long (ms,
   *  the §7.4 "~120 ms squash"). */
  SQUASH_MS: 120,
  /** Below this world impulse (N·s) a landing is a settling roll, not a
   *  squash — 0.002 N·s is a 5 cm/s drop of the 40 g chassis. */
  SQUASH_IMPULSE_MIN_NS: 0.002,
  /** Peak squash scale per N·s (0.067 N·s — L04's par landing — squashes
   *  to 0.65; clamped by SQUASH_MAX so it never inverts the chassis). */
  SQUASH_PER_NS: 5.2,
  SQUASH_MAX: 0.4,
  /** Dust needs a real thud: above this impulse (N·s) the puff rides with
   *  the squash. */
  DUST_IMPULSE_MIN_NS: 0.02,
  /** Puff ground radius per N·s (metres; clamped). */
  DUST_RADIUS_PER_NS: 0.25,
  DUST_RADIUS_MAX_M: 0.12,
  /** A snapped piece visibly settles over this window (ms, §7.4 "a quarter
   *  second"): it pops on with an overshoot and eases home. */
  SNAP_SETTLE_MS: 250,
  /** Overshoot amplitude at snap (fraction of piece size, 0 = instant). */
  SNAP_OVERSHOOT: 0.06,
  /** How far ahead the hazard tell looks (s): the drip must be visibly
   *  alive BEFORE the wheel feels the grip change. At the L04 launch
   *  speed (≈2.3 m/s world) 0.35 s is ~0.8 m — a third of the deck. */
  HAZARD_TELL_LEAD_S: 0.35,
  /** Lateral forgiveness for the projection (m): the tell fires when the
   *  velocity ray passes within this of the zone box, so a straight run
   *  at a patch edge still tells. */
  HAZARD_TELL_MARGIN_M: 0.04,
  /** Chime duration hint (ms) — audio is the audio designer's, the number
   *  is shared. */
  CHIME_MS: 400,
} as const;

export type JuiceEvent =
  | {
      kind: 'squeal';
      at: Vec;
      slipRad: number;
      speedMs: number;
      /** 0..1 loudness mapping — renderer/audio both scale by this. */
      intensity: number;
      durationMs: number;
    }
  | {
      kind: 'landingSquash';
      at: Vec;
      /** World impulse behind the landing (N·s). */
      impulseNs: number;
      /** Peak vertical squash scale (1 = none). */
      peakScale: number;
      durationMs: number;
    }
  | {
      kind: 'dustPuff';
      at: Vec;
      impulseNs: number;
      radiusM: number;
      durationMs: number;
    }
  | {
      kind: 'snapSettle';
      at: Vec;
      pieceDef: string;
      overshoot: number;
      durationMs: number;
    }
  | {
      kind: 'hazardTell';
      /** The hazard's own position (where the drip lives), not the car's. */
      at: Vec;
      zoneId: string;
      gripFactor: number;
      /** Milliseconds until the wheel reaches the zone face at current
       *  velocity (the "before the grip change" budget). */
      leadMs: number;
      durationMs: number;
    }
  | {
      kind: 'chime';
      at: Vec;
      /** Which terminal state — audio picks the flavour (finish rings,
       *  fell/stalled get the muted variant). */
      outcome: Exclude<RunStatus, 'idle' | 'running'>;
      timeS: number;
      speedMs: number;
      durationMs: number;
    };

export interface JuiceOptions {
  /** Collapse animated juice to nothing, informational markers to instant
   *  (§7.4 reduced-motion contract). */
  reducedMotion?: boolean;
  /** Override the world-mass assumption (kg). */
  carMassKg?: number;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * The feed: `step(prev, next)` after every sim step, `pieceSnapped()` from
 * the builder UI, nothing else. One feed per run; `reset()` between runs.
 */
export class JuiceFeed {
  private readonly zones: readonly HazardZone[];
  private readonly opts: Required<JuiceOptions>;
  /** ms clock (state-driven, never wall time). */
  private clockMs = 0;
  private squealUntilMs = -1;
  private airborneSteps = 0;
  private prevVy = 0;
  /** Zone tells already fired this run (one drip per zone, not a loop). */
  private toldZones = new Set<string>();
  private prevStatus: RunStatus = 'idle';

  constructor(zones: readonly HazardZone[] = [], opts: JuiceOptions = {}) {
    this.zones = zones;
    this.opts = { reducedMotion: false, carMassKg: JUICE_CAR_MASS_KG, ...opts };
  }

  reset(): void {
    this.clockMs = 0;
    this.squealUntilMs = -1;
    this.airborneSteps = 0;
    this.prevVy = 0;
    this.toldZones.clear();
    this.prevStatus = 'idle';
  }

  /** Feed the pair of consecutive states around one sim step. The FIRST
   *  call primes the feed (returns []). */
  step(prev: WorldState, next: WorldState): JuiceEvent[] {
    this.clockMs = next.time * 1000;
    const events: JuiceEvent[] = [];
    const c = next.car;

    // --- airborne tracking (the landing's approach velocity) -------------
    if (!c.grounded) {
      this.airborneSteps++;
      this.prevVy = c.velocity.y; // still falling — keep the last approach vy
    }

    // --- squeal ----------------------------------------------------------
    if (
      !this.opts.reducedMotion &&
      c.grounded &&
      c.speed > JUICE.SQUEAL_SPEED_MIN &&
      c.slip > JUICE.SQUEAL_SLIP_MIN_RAD &&
      this.clockMs >= this.squealUntilMs
    ) {
      this.squealUntilMs = this.clockMs + JUICE.SQUEAL_RETRIGGER_MS;
      events.push({
        kind: 'squeal',
        at: c.pos,
        slipRad: c.slip,
        speedMs: c.speed,
        intensity: clamp01(
          (c.slip - JUICE.SQUEAL_SLIP_MIN_RAD) /
            (JUICE.SQUEAL_FULL_SLIP_RAD - JUICE.SQUEAL_SLIP_MIN_RAD),
        ),
        // duration = until the next possible re-trigger; the renderer
        // stops early the moment slip drops below the floor
        durationMs: JUICE.SQUEAL_RETRIGGER_MS,
      });
    }

    // --- landing squash + dust -------------------------------------------
    if (prev.car.grounded === false && c.grounded && this.airborneSteps >= 3) {
      const impactVy = Math.max(0, -this.prevVy); // approach speed downward
      const impulseNs = this.opts.carMassKg * impactVy;
      if (impulseNs > JUICE.SQUASH_IMPULSE_MIN_NS) {
        if (!this.opts.reducedMotion) {
          events.push({
            kind: 'landingSquash',
            at: c.pos,
            impulseNs,
            peakScale: Math.min(
              JUICE.SQUASH_PER_NS * impulseNs,
              JUICE.SQUASH_MAX,
            ),
            durationMs: JUICE.SQUASH_MS,
          });
          if (impulseNs > JUICE.DUST_IMPULSE_MIN_NS) {
            events.push({
              kind: 'dustPuff',
              at: { x: c.pos.x, y: c.pos.y - 0.004, z: c.pos.z },
              impulseNs,
              radiusM: Math.min(
                JUICE.DUST_RADIUS_PER_NS * impulseNs,
                JUICE.DUST_RADIUS_MAX_M,
              ),
              durationMs: JUICE.SQUASH_MS,
            });
          }
        }
      }
      this.airborneSteps = 0;
    } else if (c.grounded) {
      this.airborneSteps = 0;
    }

    // --- hazard tell ------------------------------------------------------
    // Project the car forward along its velocity; a zone face reached
    // within HAZARD_TELL_LEAD_S gets one drip. Works at zero grip — it is
    // a property of the LEVEL, told by the tap, not by the tyre.
    if (c.speed > 0.2) {
      const inv = 1 / c.speed;
      const vhat = { x: c.velocity.x * inv, y: c.velocity.y * inv, z: c.velocity.z * inv };
      for (const zone of this.zones) {
        if (this.toldZones.has(zone.id)) continue;
        const c0 = zone.shape.center;
        const rel = { x: c0.x - c.pos.x, y: c0.y - c.pos.y, z: c0.z - c.pos.z };
        const ahead = rel.x * vhat.x + rel.y * vhat.y + rel.z * vhat.z;
        if (ahead <= 0) continue; // already beside/behind — too late to tell
        const lateral2 =
          rel.x * rel.x + rel.y * rel.y + rel.z * rel.z - ahead * ahead;
        const rBox = Math.max(zone.shape.half.x, zone.shape.half.z) +
          JUICE.HAZARD_TELL_MARGIN_M;
        if (lateral2 > rBox * rBox) continue; // will miss the box
        const leadMs = ahead * inv * 1000;
        if (leadMs > JUICE.HAZARD_TELL_LEAD_S * 1000) continue;
        this.toldZones.add(zone.id);
        events.push({
          kind: 'hazardTell',
          at: { x: c0.x, y: c0.y, z: c0.z },
          zoneId: zone.id,
          gripFactor: zone.frictionFactor,
          leadMs,
          durationMs: this.opts.reducedMotion ? 0 : Math.round(leadMs),
        });
      }
    }

    // --- finish chime -----------------------------------------------------
    if (
      this.prevStatus === 'running' &&
      next.status !== 'running' &&
      next.status !== 'idle'
    ) {
      events.push({
        kind: 'chime',
        at: c.pos,
        outcome: next.status,
        timeS: next.time,
        speedMs: c.speed,
        durationMs: this.opts.reducedMotion ? 0 : JUICE.CHIME_MS,
      });
    }
    this.prevStatus = next.status;
    return events;
  }

  /** Builder-side hook: the moment a piece snaps into a socket. Not a sim
   *  event — the editor calls this; the settle animation is pure juice. */
  pieceSnapped(at: Vec, pieceDef: string): JuiceEvent[] {
    if (this.opts.reducedMotion) return [];
    return [
      {
        kind: 'snapSettle',
        at,
        pieceDef,
        overshoot: JUICE.SNAP_OVERSHOOT,
        durationMs: JUICE.SNAP_SETTLE_MS,
      },
    ];
  }
}
