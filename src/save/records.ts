/**
 * THE SAVE'S PERSONAL RECORDS (Freeplay program Lane B — THE TALLY's memory
 * and the sandbox's NAMED LINES). One object riding the v2 envelope inside
 * `settings.records`, by the SAME schema-tolerant technique as
 * `settings.sound` and `settings.ghosts`: an absent key means "nothing
 * earned yet", `SAVE_VERSION` stays 2 (the freeplay program moves no hash
 * and needs no migrade), and because `normalizeEnvelope` carries the
 * `settings` object through by reference the key survives every merge,
 * import, and quarantine path untouched. (Top-level would have been the
 * tidier shape and is the WRONG one: `normalizeEnvelope` rebuilds the
 * envelope key by key and would silently drop an unknown top-level record
 * on the next merge-write — under `settings` it cannot be dropped by a
 * writer that never learned the key exists.)
 *
 * THE DEVICE-HONESTY LAW: every number this module prints is a PERSONAL
 * best on THIS browser — no server, no leaderboard, the same claim the
 * daily already makes in its chip line. The tally tail reuses the daily's
 * honesty sentence VERBATIM (`RECORDS_HONESTY`), because a caveat that
 * drifts per surface is a caveat being hidden.
 *
 * Named lines are the sandbox's re-anchor (Lane B's acceptance): a cup the
 * PLAYER placed defines a line, and the line's record is (name, best
 * finished time, the build that ran it). The ghost is not stored — it is
 * DERIVED from the stored build by the shipped tape machinery
 * (`deriveGhostTrace`, TapeRecorder over a headless World): the record's
 * receipt is (level, build, seed) exactly like a share link's, so a named
 * line adds no new truth to verify — a save-schema statement, not a
 * physics one ([[Reference/Freeplay Feasibility]] §2).
 */
import { deserialize, serialize, type Build } from '../track/build.ts';
import type { BadgeKind } from '../tally/detectors.ts';
import { loadSave, saveSave, type SaveData, type StorageLike } from './save.ts';

/** The daily's device-honesty sentence, verbatim (see `dailyChipLine`) —
 *  one key keeps one wording. */
export const RECORDS_HONESTY = 'your own runs on this device only';

/** A named sandbox line: the player's OWN record on their OWN cup. */
export interface NamedLine {
  /** The player's name for the line ("the spillway"), trimmed, ≤ 48 chars. */
  name: string;
  /** Best FINISHED time on this line, world seconds. */
  best: number;
  /** The build that ran it — canonical `serialize` bytes, the share-link
   *  shape, so the ghost is a replay away. */
  build: string;
  /** Wall-clock ms of the record's latest write (the merge stamp's twin). */
  t: number;
}

/** The `settings.records` payload owned by this module. */
export interface PersonalRecords {
  /** Lifetime badge counts per kind — what "the sheet fills" means. */
  badges?: Partial<Record<BadgeKind, number>>;
  /** Named sandbox lines, keyed by `lineAnchorKey`. */
  lines?: Record<string, NamedLine>;
  /** THE CHAIN (Lane C): the links this device published or raced, as
   *  payloads. Owned by `src/share/chain.ts`; THIS module only guarantees
   *  the ride — `readRecords` passes the array through untouched so a
   *  badges/lines write cannot drop a chain the writer never read (the
   *  same by-reference law that put records under `settings` at all). */
  chain?: unknown[];
}

function recordsOf(data: SaveData): PersonalRecords | undefined {
  const r = data.settings.records;
  return r && typeof r === 'object' ? r : undefined;
}

/** VALIDATE on read (the save law): bytes may come from any older or
 *  mangled envelope; anything unusable reads as absent, never crashes. */
export function readRecords(data: SaveData): PersonalRecords {
  const raw = recordsOf(data);
  const out: PersonalRecords = {};
  if (raw?.badges && typeof raw.badges === 'object') {
    const badges: Partial<Record<BadgeKind, number>> = {};
    for (const [k, v] of Object.entries(raw.badges)) {
      if (typeof v === 'number' && Number.isInteger(v) && v >= 0) badges[k as BadgeKind] = v;
    }
    out.badges = badges;
  }
  if (raw?.lines && typeof raw.lines === 'object') {
    const lines: Record<string, NamedLine> = {};
    for (const [k, v] of Object.entries(raw.lines)) {
      if (
        typeof k === 'string' &&
        v &&
        typeof v === 'object' &&
        typeof v.name === 'string' &&
        v.name.length > 0 &&
        v.name.length <= 48 &&
        typeof v.best === 'number' &&
        Number.isFinite(v.best) &&
        v.best > 0 &&
        typeof v.build === 'string'
      ) {
        try {
          const b = deserialize(v.build);
          lines[k] = { name: v.name, best: v.best, build: serialize(b), t: typeof v.t === 'number' ? v.t : 0 };
        } catch {
          // an un-parseable build is not a line — the rest of the sheet stands
        }
      }
    }
    out.lines = lines;
  }
  // THE CHAIN RIDE (Lane C): the chain array passes through UNVALIDATED
  // and UNTOUCHED (validated where it is read, `src/share/chain.ts`) —
  // `accumulateBadges`/`recordNamedLine` write this object back whole, so
  // a key this module dropped would be a key every tally line-write
  // silently erased from the chain.
  if (Array.isArray(raw?.chain)) out.chain = raw.chain as unknown[];
  return out;
}

/** The line's identity: WHERE the player's cup sits (quantised to whole
 *  millimetres — the re-anchor is a seat, not a float). Same level, same
 *  cup seat = the same line, whoever rebuilt the decks in between. */
export function lineAnchorKey(levelId: string, cup: { x: number; y: number; z: number }): string {
  const mm = (m: number): number => Math.round(m * 1000);
  return `${levelId}@${mm(cup.x)},${mm(cup.y)},${mm(cup.z)}`;
}

/** Add this run's badges to the sheet. Returns the kinds the save had
 *  NEVER seen before — the "first X" words the result tail prints. */
export function accumulateBadges(
  counts: Partial<Record<BadgeKind, number>>,
  store: StorageLike | null | undefined = undefined,
): BadgeKind[] {
  const data = loadSave(store);
  const rec = readRecords(data);
  const badges = { ...rec.badges };
  const firsts: BadgeKind[] = [];
  for (const [kind, n] of Object.entries(counts) as [BadgeKind, number][]) {
    const before = badges[kind] ?? 0;
    if (before === 0 && n > 0) firsts.push(kind);
    badges[kind] = before + n;
  }
  rec.badges = badges;
  data.settings.records = rec;
  saveSave(data, store);
  return firsts;
}

/** The named line at this cup seat, if the player ever named it. */
export function readNamedLine(
  key: string,
  store: StorageLike | null | undefined = undefined,
): NamedLine | undefined {
  return readRecords(loadSave(store)).lines?.[key];
}

/**
 * Finish on a named line: mint or beat the record. A brand-new name always
 * writes; a run on an existing line replaces it only when it is FASTER
 * (failures never record — the `recordStars` law). Returns what happened
 * so the tail can say it: minted | beat | held.
 */
export function recordNamedLine(
  key: string,
  name: string,
  time: number,
  build: Build,
  store: StorageLike | null | undefined = undefined,
): { outcome: 'minted' | 'beat' | 'held'; line: NamedLine } {
  const data = loadSave(store);
  const rec = readRecords(data);
  const lines = { ...rec.lines };
  const prev = lines[key];
  const clean = name.trim().slice(0, 48);
  if (prev && prev.name === clean && prev.best <= time) {
    return { outcome: 'held', line: prev };
  }
  const line: NamedLine = {
    name: prev ? prev.name : clean,
    best: prev ? Math.min(prev.best, time) : time,
    build: serialize(build),
    t: Date.now(),
  };
  lines[key] = line;
  rec.lines = lines;
  data.settings.records = rec;
  saveSave(data, store);
  return { outcome: prev ? (line.best < prev.best ? 'beat' : 'held') : 'minted', line };
}
