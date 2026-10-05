/**
 * Persistence: one localStorage key (`gravity-works.save`), versioned, with a
 * migration function from the first shape change onward (brief §8 "Save and
 * share"). The storage object is injectable (`StorageLike`) so the whole
 * module runs under Vitest without a DOM, and export/import move the same
 * JSON envelope through a file.
 *
 * `MIGRATIONS[i]` upgrades a save at version `i` to version `i + 1`; loading
 * runs every migrade between the stored version and `SAVE_VERSION`, so any
 * older blob — including "nothing at all", version 0 — lands at the current
 * shape. The v1→v2 migrade (stage 4) carries a kitchen-era save's per-level
 * build records into the campaign `progress.reached` record — see its doc.
 * Anything unparseable falls back to a fresh save rather than crashing the
 * game.
 */
import { deserialize, serialize, type Build } from '../track/build.ts';

export const SAVE_KEY = 'gravity-works.save';
/** v2 (stage 4): the `progress` record (per-level best stars + the legacy
 *  `reached` carry) joins the envelope; see `MIGRATIONS[1]`. */
export const SAVE_VERSION = 2;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveSettings {
  muted?: boolean;
  reducedMotion?: boolean;
  /**
   * Callout ids the player has already been shown (brief §9.3: every new
   * piece or prop gets a one-line callout the first time it appears).
   * Optional — an absent list means "nothing seen yet" — so the shape stays
   * v1 and needs no migration. `src/ui/callouts.ts` owns the read/write.
   */
  calloutsSeen?: string[];
}

/**
 * The campaign-progress record (stage 4) — the ONLY data the unlock rule
 * in `src/world/campaign.ts` reads:
 *
 * - `stars[levelId]` — the best star count ever EARNED on that level, written
 *   by `recordStars` at the end of a RUN (a finished run through any build;
 *   a 0-star failure records nothing). This is what opens the next rung.
 * - `reached[levelId]` — a LEGACY carry, written ONLY by the v1→v2 migrade:
 *   levels the player demonstrably stood in before progress was ever
 *   counted (their build autosave existed). Placing a piece in a v2-era save
 *   never adds to it — unlocks are earned by stars, not by visits.
 */
export interface SaveProgress {
  stars: Record<string, number>;
  reached: Record<string, true>;
}

export interface SaveData {
  v: number;
  /**
   * Best build so far per level, stored as canonical `serialize` JSON text —
   * the exact bytes a share link carries, so a Matrix4 cannot mangle itself
   * through a plain `JSON.stringify` on its way to localStorage.
   */
  builds: Record<string, string>;
  settings: SaveSettings;
  progress: SaveProgress;
}

type Migrade = (stored: unknown) => unknown;

/**
 * The migrade table. Index 0 (v0 -> v1) is the first one written: it starts
 * from *nothing* — no key, or any pre-version blob — and produces the v1
 * envelope, adopting a `builds` record if a legacy blob happens to carry one.
 */
export const MIGRATIONS: readonly Migrade[] = [
  (stored) => {
    const legacy = stored as { builds?: unknown } | null;
    const builds: Record<string, string> = {};
    if (legacy && typeof legacy.builds === 'object' && legacy.builds !== null) {
      for (const [k, val] of Object.entries(legacy.builds as Record<string, unknown>)) {
        const build = coerceBuild(val);
        if (build) {
          try {
            builds[k] = serialize(build);
          } catch {
            // unserialisable: better lost than corrupt
          }
        }
      }
    }
    return { v: 1, builds, settings: {} };
  },
  /**
   * v1 -> v2 (stage 4): the campaign era. A v1 save counted no stars — the
   * ladder's ONLY memory of where a player had been was the per-level build
   * autosave — so the migrade carries those bytes forward as the `reached`
   * record: a level whose build record existed is a level the player stood
   * in, and it must NOT relock after the upgrade (the kitchen-era finisher
   * would come back to a kitchen re-locked behind kitchen01). It unlocks
   * nothing that was not already reachable under v1: rooms the player never
   * opened (a kitchen-only save's bedrooms) gain no `reached` mark and stay
   * gated on kitchen05's star, exactly as in a fresh save. `stars` starts
   * empty — the migrade CANNOT know what a v1 run scored, and minting stars
   * from old build bytes would display trophies nobody earned; the rung
   * past the frontier is earned by playing, never by migration.
   */
  (stored) => {
    const v1 = stored as { builds?: unknown; settings?: unknown } | null;
    const reached: Record<string, true> = {};
    const builds =
      v1 && typeof v1.builds === 'object' && v1.builds !== null
        ? (v1.builds as Record<string, unknown>)
        : {};
    for (const levelId of Object.keys(builds)) reached[levelId] = true;
    return {
      v: 2,
      builds,
      settings: v1 && typeof v1.settings === 'object' && v1.settings !== null ? v1.settings : {},
      progress: { stars: {}, reached },
    };
  },
];

/** The browser's localStorage, or null off the browser. */
export function defaultStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null; // private mode / disabled storage
  }
}

/** A simple in-memory StorageLike for tests and headless runs. */
export function memoryStorage(initial: Record<string, string> = {}): StorageLike & { dump(): Record<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
    dump: () => Object.fromEntries(map),
  };
}

export function freshSave(): SaveData {
  return { v: SAVE_VERSION, builds: {}, settings: {}, progress: { stars: {}, reached: {} } };
}

function isBuild(value: unknown): value is Build {
  if (typeof value !== 'object' || value === null) return false;
  const b = value as Record<string, unknown>;
  return typeof b.levelId === 'string' && typeof b.seed === 'number' && Array.isArray(b.pieces);
}

/**
 * Materialise a legacy build object into one `deserialize` accepts. A build
 * that round-tripped through plain `JSON.stringify` lost its Matrix4s to
 * `{"elements":[...]}` shapes (or kept them as 16-number arrays); both forms
 * are normalised here, and anything structurally unsound returns null.
 */
function coerceBuild(value: unknown): Build | undefined {
  if (!isBuild(value)) return undefined;
  try {
    const normalised = JSON.stringify(value, (key, val) => {
      if (key === 'transform' && val && typeof val === 'object' && Array.isArray((val as { elements?: unknown }).elements)) {
        return (val as { elements: number[] }).elements;
      }
      return val;
    });
    return deserialize(normalised);
  } catch {
    return undefined;
  }
}

function isBuildJson(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    deserialize(value);
    return true;
  } catch {
    return false;
  }
}

function isSaveData(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  if (typeof s.v !== 'number' || !Number.isInteger(s.v)) return false;
  if (typeof s.builds !== 'object' || s.builds === null) return false;
  if (!Object.values(s.builds as Record<string, unknown>).every(isBuildJson)) return false;
  if (typeof s.settings !== 'object' || s.settings === null) return false;
  // The campaign-era progress record is part of the envelope (every blob
  // reaching this check has been migraded to v2): one missing or half-shaped
  // is garbage like any other — migrades always write it, so only
  // hand-edited or half-written saves land here.
  const p = s.progress as Record<string, unknown> | undefined;
  if (typeof p !== 'object' || p === null) return false;
  const stars = (p as { stars?: unknown }).stars;
  const reached = (p as { reached?: unknown }).reached;
  if (typeof stars !== 'object' || stars === null) return false;
  if (!Object.values(stars as Record<string, unknown>).every((n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 3)) {
    return false;
  }
  if (typeof reached !== 'object' || reached === null) return false;
  return Object.values(reached as Record<string, unknown>).every((t) => t === true);
}

/** Read, migrate and validate. Never throws — garbage becomes a fresh save. */
export function loadSave(store: StorageLike | null = defaultStorage()): SaveData {
  if (!store) return freshSave();
  let raw: string | null = null;
  try {
    raw = store.getItem(SAVE_KEY);
  } catch {
    return freshSave();
  }
  return migrateBlob(raw);
}

/** Shared by load and file import: bytes (or nothing) -> current SaveData. */
export function migrateBlob(raw: string | null): SaveData {
  let value: unknown = null;
  let version = 0; // "nothing at all" is version 0: the first migrade's input
  if (raw !== null) {
    try {
      value = JSON.parse(raw);
    } catch {
      return freshSave();
    }
    version =
      typeof value === 'object' && value !== null && typeof (value as { v?: unknown }).v === 'number'
        ? (value as { v: number }).v
        : 0;
  }
  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return freshSave(); // unknown gap: start clean
    value = step(value);
    version += 1;
  }
  if (version > SAVE_VERSION) return freshSave(); // from the future
  return isSaveData(value) ? value : freshSave();
}

export function saveSave(data: SaveData, store: StorageLike | null = defaultStorage()): void {
  if (!store) return;
  try {
    store.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // quota or private mode: losing the save is survivable, crashing is not
  }
}

export function clearSave(store: StorageLike | null = defaultStorage()): void {
  if (!store) return;
  try {
    store.removeItem(SAVE_KEY);
  } catch {
    // as above
  }
}

/** Remember the player's current build for a level (the game's autosave call). */
export function rememberBuild(build: Build, store: StorageLike | null = defaultStorage()): void {
  const data = loadSave(store);
  data.builds[build.levelId] = serialize(build);
  saveSave(data, store);
}

/**
 * Record the star line of a FINISHED-or-not run: the save keeps the BEST
 * count ever earned on the level and writes nothing when the run did not
 * beat it (a 0-star failure records nothing — failures are free to forget,
 * §9.2 gates on stars, not on trying). The one writer of `progress.stars`;
 * the unlock rule lives in `src/world/campaign.ts`, not here.
 */
export function recordStars(levelId: string, stars: number, store: StorageLike | null = defaultStorage()): void {
  const data = loadSave(store);
  const best = Math.min(3, Math.max(0, Math.trunc(stars)));
  if (best < 1) return; // a 0-star failure records nothing
  if ((data.progress.stars[levelId] ?? -1) >= best) return;
  data.progress.stars[levelId] = best;
  saveSave(data, store);
}

/** The saved build for a level, materialised — or undefined if none/invalid. */
export function savedBuild(levelId: string, store: StorageLike | null = defaultStorage()): Build | undefined {
  const raw = loadSave(store).builds[levelId];
  if (raw === undefined) return undefined;
  try {
    return deserialize(raw);
  } catch {
    return undefined;
  }
}

/** The export-file envelope (pretty-printed; the localStorage copy is not). */
export function saveFileJson(data: SaveData): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

/** Import a file the user picked (anything with an async text()). */
export async function importSaveFile(file: { text(): Promise<string> }): Promise<SaveData> {
  return migrateBlob(await file.text());
}

/** Browser-only: hand the user a `gravity-works-save.json` download. */
export function downloadSaveFile(data: SaveData): void {
  const blob = new Blob([saveFileJson(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gravity-works-save.json';
  a.click();
  URL.revokeObjectURL(url);
}
