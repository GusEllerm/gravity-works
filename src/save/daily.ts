/**
 * THE DAILY RUNG (program T3.4 riding the T3.2 rails, Action Plan
 * "only after T3.2 proves the ghost cheap" — the ghost proved cheap, and
 * the daily is the same level wearing the SAME rails plus one localStorage
 * line). The smallest honest shape, stated by its parts:
 *
 * - `seed = hash(UTC date)` — `dailySeed()` is the day's number; the game
 *   page takes it as `?seed=<dailySeed()>` (`?daily=1` is the same page at
 *   that seed, spelled as an intent). The seed rides the build's existing
 *   `seed` field, so it folds into the state hash EXACTLY the way every
 *   other seed does and touches NOTHING else — no level data moved, no
 *   shipped hash moved, no new physics input (the sim never reads it).
 * - A "race today" chip on the result screen records today's best FINISHED
 *   time in localStorage and a streak count (today ≥ one finished run
 *   extends the streak across consecutive UTC days; a skipped day resets
 *   it to 1).
 *
 * THE SINGLE-MACHINE HONESTY LINE, stated where the number is shown: this
 * is a PERSONAL best on THIS browser — there is no server and no leaderboard,
 * the determinism only promises that the same seed runs the same HERE. That
 * sentence is UI copy the player sees next to the number, not a footnote.
 */

/** The one localStorage key the daily layer owns (deliberately OUTSIDE the
 *  save envelope — like the premiere flag, it is a UI fact, not game data,
 *  and it never rides export/import). */
export const DAILY_KEY = 'gravity-works.daily';

export interface DailyRecord {
  /** The UTC day this record belongs to, `YYYY-MM-DD`. */
  date: string;
  /** Best FINISHED time today, seconds (0 has never been a run time). */
  best: number;
  /** Consecutive-UTC-day streak ending today (>= 1 once recorded). */
  streak: number;
}

/** FNV-1a over the UTC date — the "hash(UTC date)" of the plan. 32-bit,
 *  pure, and portable to any future board with the same one-line rule. */
export function dailySeed(date: Date = new Date()): number {
  const day = utcDateKey(date);
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** The UTC day key the record and the seed agree on. */
export function utcDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Yesterday's UTC day key (the streak's only adjacency question). */
function yesterdayKey(todayKey: string): string {
  const d = new Date(`${todayKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDateKey(d);
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStore(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // blocked storage: the daily chip degrades to "no record"
  }
}

function parse(raw: string | null): DailyRecord | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Partial<DailyRecord>;
    if (
      typeof j.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(j.date) &&
      typeof j.best === 'number' &&
      Number.isFinite(j.best) &&
      j.best > 0 &&
      typeof j.streak === 'number' &&
      Number.isInteger(j.streak) &&
      j.streak >= 1
    ) {
      return { date: j.date, best: j.best, streak: j.streak };
    }
  } catch {
    // garbage is simply no record; the daily must never brick a page
  }
  return null;
}

/** The stored record, or null. A record from an older day stays readable
 *  (the chip can say "last: 3.21 s on <date>") — whether it is TODAY'S
 *  record is the caller's `utcDateKey()` comparison, and a new day's first
 *  finished run starts its own line (`recordDailyBest`). */
export function readDaily(store = defaultStore()): DailyRecord | null {
  if (!store) return null;
  return parse(store.getItem(DAILY_KEY));
}

/**
 * A FINISHED run on the daily page lands here. The rules are the whole
 * file: same day -> best is the min; yesterday -> the streak EXTENDS and
 * today's best starts at this run; anything older (or none) -> the streak
 * restarts at 1. Failures never record (the caller only calls on finished).
 */
export function recordDailyBest(
  timeSeconds: number,
  now: Date = new Date(),
  store = defaultStore(),
): DailyRecord | null {
  if (!store || !(timeSeconds > 0) || !Number.isFinite(timeSeconds)) return null;
  const today = utcDateKey(now);
  const prev = parse(store.getItem(DAILY_KEY));
  const rec: DailyRecord =
    prev && prev.date === today
      ? { date: today, best: Math.min(prev.best, timeSeconds), streak: prev.streak }
      : prev && prev.date === yesterdayKey(today)
        ? { date: today, best: timeSeconds, streak: prev.streak + 1 }
        : { date: today, best: timeSeconds, streak: 1 };
  try {
    store.setItem(DAILY_KEY, JSON.stringify(rec));
  } catch {
    // storage refused the write: the chip honestly shows no record
  }
  return rec;
}

/** The chip's line, ONE sentence with the honesty clause inside it, so the
 *  claim and the caveat are never separated by a fold. */
export function dailyChipLine(rec: DailyRecord, today: string): string {
  if (rec.date === today) {
    return `race today — best ${rec.best.toFixed(2)} s · streak ${rec.streak} day${rec.streak === 1 ? '' : 's'} · your own runs on this device only`;
  }
  return `race today — not yet today (last: ${rec.best.toFixed(2)} s on ${rec.date}) · your own runs on this device only`;
}
