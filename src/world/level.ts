/**
 * The `Level` shape the world, builder and replay all read. Deliberately
 * minimal (docs/vault/Concepts/Track Kit.md): a start socket, a budget, a par,
 * a seed and whatever a placeholder build looks like until the Feel Engineer's
 * real track plugs in. Everything here is plain data — a level is serialisable
 * and a replay needs nothing more than (level, build, seed).
 */
import type { Socket } from '../track/socket.ts';
import type { Build } from '../track/build.ts';

export interface LevelPar {
  /** Reference piece count for the 2-star line. */
  pieces: number;
  /** Reference finish time in seconds for the 3-star line. */
  time: number;
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
   * The level's reference build as plain data. The feel track's real one is
   * the Feel Engineer's to replace — same signature, nothing else changes.
   */
  placeholderBuild(): Build;
}
