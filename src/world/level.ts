/**
 * The `Level` shape the world, builder and replay all read. Deliberately
 * minimal (docs/vault/Concepts/Track Kit.md): a start socket, a budget, a par,
 * a seed and whatever a placeholder build looks like until the Feel Engineer's
 * real track plugs in. Everything here is plain data — a level is serialisable
 * and a replay needs nothing more than (level, build, seed).
 */
import type { Socket } from '../track/socket.ts';
import type { Build } from '../track/build.ts';

/** One declared rim: the object's player name (`stoam`, `door mouth` —
 *  words `solidWord` renders into the refusal) and its world-space box. */
export interface BlockedRim {
  name: string;
  min: readonly [number, number, number];
  max: readonly [number, number, number];
}

export interface LevelPar {
  /** Reference piece count for the 2-star line. */
  pieces: number;
  /** Reference finish time in seconds for the 3-star line. */
  time: number;
}

/** A static world box in WORLD metres (colliders scale it by `SIM_SCALE`).
 *  Declared by levels whose floor is part of the world (the house slab of
 *  `src/world/house-frame.ts`), NOT a placeable piece: it joins the sim as
 *  one physical (non-track-group) body, because a raycast chassis tunnels
 *  a track-family floor at fast fall speeds (the tunnel law). */
export interface StaticBox {
  center: readonly [number, number, number];
  half: readonly [number, number, number];
}

/** THE INPUT LAW made product (Decision Log 2026-10-12, THE DOWNHILL): every
 *  force that can move the car lives in the REPLAYED data, step-keyed. A
 *  wind is a launcher-shaped impulse applied every `windEvery` steps along
 *  the car's velocity, GOVERNED off above `governor` m/s of horizontal
 *  speed — the existence-proof throttle of the freeplay spike, now level
 *  data, so the run's hash covers it and replay stays exact. `launchSpeed`
 *  (world m/s) is the release speed the level asks the car to leave the
 *  start socket with — also data, also replayed by every caller. */
export interface StepKeyedInputs {
  /** Impulse every N steps (0/absent = no wind). */
  windEvery?: number;
  /** Impulse strength as a world Δv (m/s), like a launcher's `power`. */
  windDeltaV?: number;
  /** Horizontal speed cap (world m/s) above which the wind stays off. */
  governor?: number;
  /** Forward release speed (world m/s). */
  launchSpeed?: number;
}

/** A parcel threshold: a named room's capture volume the downhill run can
 *  APPROVE by crossing (physics under the shipped capture law). The probe
 *  is READ-ONLY — approving a parcel never ends a run and never moves a
 *  hash; the outcome law stays the last `finishCup`'s alone. */
export interface ParcelThreshold {
  room: string;
  center: readonly [number, number, number];
  radius: number;
}

export interface Level {
  id: string;
  name: string;
  /** Run seed. Folded into the state hash so (level, build, seed) is complete. */
  seed: number;
  /** Where the car spawns and where the builder's first open socket lives. */
  startSocket: Socket;
  /** Total pieces the player may place (sandbox levels use a big number). */
  budget: number;
  par: LevelPar;
  /** Hard run cap in seconds; beyond it the run ends as `timeout`. */
  maxTime: number;
  /**
   * The level's reference build as plain data. For `feeltrack` this is now
   * the REAL kit feel track (laid from `src/feel/feeltrack.ts`'s constants);
   * the seam is unchanged — same signature, nothing else changes.
   */
  placeholderBuild(): Build;
  /**
   * THE BLOCKED-RIM ASK (P4 shortlist item 1, the kitchen02 truth): when
   * true, a seat that overlaps the GOAL object's own body is refused — the
   * ghost goes red and names the goal ("blocked — the cup is in the way"),
   * and the Place button will not seat there. On a CHOICE rung whose tray is
   * the union of two lines, the whole-tray dump's tail piece always lands at
   * the goal's rim (reach-sum invariance: union = par + one piece, always
   * PAST the cup), so the guard is what makes "place everything" an
   * un-buildable line — the union dump must CHOOSE, and can die choosing.
   * Since the 2026-10-11 round-2 pass the ask is ORDER-INDEPENDENT at the
   * ring too: on a guarded rung every seat whose open end carries the goal
   * tell (the goal's own exit, or any end past its mouth plane — the
   * stage-6 K3 tell) is REFUSED, not just warned, so the run-out seat the
   * shipped ring aimed a dump's 4th ask at cannot be built in ANY order.
   * Placement-layer only: it adds no geometry, no collider and no physics
   * read, so every par replay hash is byte-identical with the flag set
   * (proved in `tests/unit/goal-guard.test.ts` + `replay:all`).
   */
  blockedGoalSeat?: boolean;
  /**
   * THE DECLARED RIMS (round 3 — the finale's last gap; the same
   * blocked-rim LAW as `blockedGoalSeat`, pointed at a threshold instead of
   * the cup). Each entry is a NAMED world box — a threshold's void column —
   * that joins the builder's guard solids exactly as the goal body does
   * (`blockedRimGuards` in `src/ui/builder.ts`): a seat whose (2 mm-shrunk)
   * piece box overlaps a rim is refused and the refusal NAMES the obstacle
   * ("blocked — the stoam is in the way"), the one blocked-rung copy law
   * the goal guard and the set props already speak. Where `blockedGoalSeat`
   * derives its box from the goal fixture's geometry, a rung declares its
   * rims as literal data (the `setPlacement` precedent: numbers easier to
   * eyeball than a solver at load time), and the level's ladder test
   * re-measures them against the live authored seatings — every authored
   * seating must clear every rim by ≥ 2 mm and every refused dump seating
   * must overlap by ≥ 2 mm, the k02 margin law. Placement-layer only, like
   * the goal guard: no geometry, no collider, no physics read — every replay
   * hash is byte-identical with the rims set (`tests/unit/porch-guard.test.ts`
   * pins porch05's par hash `1e367c94` across the change).
   */
  blockedRims?: readonly BlockedRim[];
  /**
   * The level's REFERENCE build for pars (brief §9.2: "a level's par is set
   * by the Level Designer's reference build and regenerated by script").
   * `scripts/gen-pars.mjs` replays THIS build headless and writes the
   * measured time and piece count into `src/world/pars.json`. Optional until
   * a level ships one: the pars script falls back to `placeholderBuild`, so
   * the feel track's real-kit chain is its own reference until the Level
   * Designer authors a better one.
   */
  parBuild?(): Build;
  /**
   * A static world floor (the house slab). Absent = the campaign law,
   * byte-identical: no collider, the decorative catch plane at `floorY +
   * 0.55`. Declared = the slab joins the sim as a PHYSICAL body (group
   * `0x0001_ffff`, never the track family — the tunnel law) and the FELL
   * line becomes the spike's departure law: `floorTop − 0.05` (a car that
   * goes 5 cm below the world's own floor has left the world; a car
   * ROLLING on it has not). `src/world/world.ts`.
   */
  floor?: StaticBox;
  /**
   * THE INPUT LAW as data: step-keyed field forces + the release speed.
   * Absent = no force beyond the launchers and gravity, byte-identical.
   * Everything here rides the replay — the run's hash is its receipt.
   */
  inputs?: StepKeyedInputs;
  /**
   * The room thresholds a run can APPROVE without ending (rooms-collected
   * machinery; `approveParcels` in `src/world/house-frame.ts` folds them
   * over a run's samples). Read-only: presentation and receipts, never
   * physics.
   */
  parcels?: readonly ParcelThreshold[];
  /**
   * The statuses that count as this level's reference build having RUN —
   * for the surfaces where a run ENDS without a cup (the downhill: its
   * verdict is rooms, and a stalled or gone-off-the-edge line is a
   * COMPLETE run of the house). Absent = the campaign law: `finished`
   * only, and `npm run pars` errors on anything else.
   */
  parStatuses?: readonly string[];
}
