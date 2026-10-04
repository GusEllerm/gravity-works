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
 * shape. Anything unparseable falls back to a fresh save rather than
 * crashing the game.
 */
import { deserialize, serialize, type Build } from '../track/build.ts';

export const SAVE_KEY = 'gravity-works.save';
export const SAVE_VERSION = 1;

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

export interface SaveData {
  v: number;
  /**
   * Best build so far per level, stored as canonical `serialize` JSON text —
   * the exact bytes a share link carries, so a Matrix4 cannot mangle itself
   * through a plain `JSON.stringify` on its way to localStorage.
   */
  builds: Record<string, string>;
  settings: SaveSettings;
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
  return { v: SAVE_VERSION, builds: {}, settings: {} };
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
  return typeof s.settings === 'object' && s.settings !== null;
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
