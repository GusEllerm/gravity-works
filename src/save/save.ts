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
 * Anything unusable falls back to a fresh save rather than crashing the
 * game — but since T0.3 (R1) it is NEVER silent: raw bytes the migrade
 * cannot take at face value are QUARANTINED outside the envelope under
 * `gravity-works.save.corrupt-<n>` (deduped, capped), so a damaged save is
 * recoverable through Settings instead of erased. Writes merge per key
 * since T0.6 (R9): `builds`/`progress.stars` entries may carry a wall-clock
 * stamp (`{t, s}` / `{t, n}` records INSIDE the v2 envelope — schema-
 * tolerant, `SAVE_VERSION` stays 2, v3 stays reserved for F6), and a
 * `saveSave` merges the on-disk records with the incoming ones instead of
 * last-writer-wins-the-whole-envelope.
 */
import { deserialize, serialize, type Build } from '../track/build.ts';

export const SAVE_KEY = 'gravity-works.save';
/** v2 (stage 4): the `progress` record (per-level best stars + the legacy
 *  `reached` carry) joins the envelope; see `MIGRATIONS[1]`. T0.3/T0.6
 *  deliberately did NOT bump this: quarantine lives in sibling keys and the
 *  cross-tab records ride the optional-record shape — v3 stays reserved for
 *  F6's geometry-revision migrade (Evaluation 2026-10-09 engineering R1,
 *  Recommendations 2026-10-09 technical §2). */
export const SAVE_VERSION = 2;

/**
 * T0.3 / R1 — the QUARANTINE. Raw bytes that parse-but-migrate-cannot-use
 * (or do not parse at all) are stashed OUTSIDE the envelope under
 * `gravity-works.save.corrupt-<n>` before the game continues on a fresh
 * envelope. The corrupt bytes leaving the envelope is the whole trick: no
 * schema change, no version bump, nothing destroyed — Settings lists the
 * copies and restores anything the salvage path can validate.
 */
export const CORRUPT_KEY_PREFIX = 'gravity-works.save.corrupt';
const CORRUPT_SEQ_KEY = 'gravity-works.save.corrupt-seq';
/** A handful of copies is the whole archive; a boot loop must never fill
 *  localStorage with the same broken blob. */
export const QUARANTINE_CAP = 5;

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
  /**
   * Sound mix (stage 5): mute flag and volume (0..1) for `src/sound`.
   * Same optional-field technique as `calloutsSeen` — `isSaveData` validates
   * `settings` as an object and passes unknown keys through, so an absent
   * `sound` means "defaults" (sound on, default volume) and the envelope
   * stays v2: no schema bump, no migrade (the stage-5 brief reserves the
   * version bump for F6's lane; the autosave-revision migration F6 wants can
   * still take v3 without colliding with this key).
   */
  sound?: SoundSettings;
}

/** The `settings.sound` payload owned by `src/sound/sound.ts`. */
export interface SoundSettings {
  muted?: boolean;
  /** Master volume, 0..1, riding UNDER the -12 dBFS mix ceiling. */
  volume?: number;
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

// ---- T0.6 / R9: per-key timestamped records inside the envelope -------------

/** A per-key record INSIDE the v2 envelope (`{t, s}` for a build,
 *  `{t, n}` for a star count). `t` is a wall-clock ms stamp. A plain
 *  string/number is the SAME record with stamp 0 — every reader accepts
 *  both shapes (schema-tolerant, no v3 bump). */
export interface Stamped<T> {
  t: number;
  v: T;
}

function unwrapBuildEntry(entry: unknown): Stamped<string> | null {
  if (typeof entry === 'string') return isBuildJson(entry) ? { t: 0, v: entry } : null;
  if (typeof entry === 'object' && entry !== null) {
    const r = entry as { t?: unknown; s?: unknown };
    if (
      typeof r.t === 'number' &&
      Number.isFinite(r.t) &&
      typeof r.s === 'string' &&
      isBuildJson(r.s)
    )
      return { t: r.t, v: r.s };
  }
  return null;
}

function unwrapStarEntry(entry: unknown): Stamped<number> | null {
  const ok = (n: unknown): n is number =>
    typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 3;
  if (ok(entry)) return { t: 0, v: entry };
  if (typeof entry === 'object' && entry !== null) {
    const r = entry as { t?: unknown; n?: unknown };
    if (typeof r.t === 'number' && Number.isFinite(r.t) && ok(r.n)) return { t: r.t, v: r.n };
  }
  return null;
}

interface EnvelopeView {
  data: SaveData;
  buildStamps: Record<string, number>;
  starStamps: Record<string, number>;
  /** True when anything had to be DROPPED or REPAIRED to make the envelope
   *  readable — the honest flag behind the quarantine + the Settings line. */
  dropped: boolean;
}

/**
 * Walk a v2-shaped envelope PER KEY, keeping everything that validates and
 * flagging anything dropped — the R1 law that a save is never wiped whole
 * because one entry is bad, and the R9 reader for stamped records.
 */
function normalizeEnvelope(value: unknown): EnvelopeView | null {
  if (typeof value !== 'object' || value === null) return null;
  const s = value as Record<string, unknown>;
  let dropped = false;
  const builds: Record<string, string> = {};
  const buildStamps: Record<string, number> = {};
  if (typeof s.builds === 'object' && s.builds !== null) {
    for (const [k, entry] of Object.entries(s.builds as Record<string, unknown>)) {
      const rec = unwrapBuildEntry(entry);
      if (rec) {
        builds[k] = rec.v;
        buildStamps[k] = rec.t;
      } else dropped = true;
    }
  } else dropped = true;
  const settings = (typeof s.settings === 'object' && s.settings !== null ? s.settings : {}) as SaveSettings;
  if (typeof s.settings !== 'object' || s.settings === null) dropped = true;
  const stars: Record<string, number> = {};
  const starStamps: Record<string, number> = {};
  const reached: Record<string, true> = {};
  const p = s.progress as Record<string, unknown> | undefined;
  if (typeof p === 'object' && p !== null) {
    if (typeof p.stars === 'object' && p.stars !== null) {
      for (const [k, entry] of Object.entries(p.stars as Record<string, unknown>)) {
        const rec = unwrapStarEntry(entry);
        if (rec) {
          stars[k] = rec.v;
          starStamps[k] = rec.t;
        } else dropped = true;
      }
    } else dropped = true;
    if (typeof p.reached === 'object' && p.reached !== null) {
      for (const [k, t] of Object.entries(p.reached as Record<string, unknown>)) {
        if (t === true) reached[k] = true;
        else dropped = true;
      }
    } else dropped = true;
  } else dropped = true; // a v2 envelope without progress is half-written (stage-4 law)
  return { data: { v: SAVE_VERSION, builds, settings, progress: { stars, reached } }, buildStamps, starStamps, dropped };
}

/**
 * Strict shape check: TRUE iff the value is a whole, well-shaped envelope
 * taken at FACE VALUE (nothing dropped, nothing repaired; stamped records
 * count as well-shaped). `normalizeEnvelope` does the per-key repair.
 */
export function isSaveData(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const v = (value as { v?: unknown }).v;
  if (typeof v !== 'number' || !Number.isInteger(v)) return false;
  const view = normalizeEnvelope(value);
  return view !== null && !view.dropped;
}

/** Read, migrate and validate. Never throws — an unusable blob becomes a
 *  fresh save AFTER its bytes are quarantined (T0.3/R1): the wipe is only
 *  ever a RENAME now, never an erasure. */
export function loadSave(store: StorageLike | null = defaultStorage()): SaveData {
  if (!store) return freshSave();
  let raw: string | null = null;
  try {
    raw = store.getItem(SAVE_KEY);
  } catch {
    return freshSave();
  }
  const outcome = migrateDetailed(raw);
  if (raw !== null && outcome.damaged) quarantineRaw(raw, store);
  return outcome.data;
}

export interface MigrationOutcome {
  data: SaveData;
  /** True when the raw bytes could NOT be taken at face value (broken
   *  shape, dropped entries, a from-the-future envelope). The signal that
   *  QUARANTINES the raw bytes and surfaces the Settings line. */
  damaged: boolean;
  /** False when NOTHING was salvageable — a reject, not a repair. File
   *  import refuses exactly these (validate before accepting). */
  usable: boolean;
  buildStamps: Record<string, number>;
  starStamps: Record<string, number>;
}

const brokenOutcome = (): MigrationOutcome => ({
  data: freshSave(),
  damaged: true,
  usable: false,
  buildStamps: {},
  starStamps: {},
});

const nullOutcome = (): MigrationOutcome => ({
  data: freshSave(),
  damaged: false,
  usable: true,
  buildStamps: {},
  starStamps: {},
});

/** The migrate/validate machinery behind load, import and restore. */
export function migrateDetailed(
  raw: string | null,
  opts: { tolerateFuture?: boolean } = {},
): MigrationOutcome {
  if (raw === null) return nullOutcome();
  let value: unknown = null;
  try {
    value = JSON.parse(raw);
  } catch {
    return brokenOutcome(); // unparseable: nothing to repair, quarantine the bytes
  }
  let version =
    typeof value === 'object' && value !== null && Number.isFinite((value as { v?: unknown }).v)
      ? (value as { v: number }).v
      : 0; // "nothing at all" is version 0: the first migrade's input
  if (version > SAVE_VERSION) {
    // From the future. The LIVE game refuses (v3 is RESERVED — F6's shape,
    // not ours to guess) but salvage (import / restore-from-quarantine)
    // takes the envelope at face value IF it validates: bytes the player
    // can inspect are recoverable, and the reserved-version law holds.
    const view = opts.tolerateFuture ? normalizeEnvelope(value) : null;
    if (view)
      return { data: view.data, damaged: true, usable: true, buildStamps: view.buildStamps, starStamps: view.starStamps };
    return brokenOutcome();
  }
  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return brokenOutcome(); // unknown gap: start clean (quarantined)
    value = step(value);
    version += 1;
  }
  const view = normalizeEnvelope(value);
  if (!view) return brokenOutcome();
  return {
    data: view.data,
    damaged: view.dropped,
    usable: true,
    buildStamps: view.buildStamps,
    starStamps: view.starStamps,
  };
}

/** Shared by load and file import: bytes (or nothing) -> current SaveData. */
export function migrateBlob(raw: string | null): SaveData {
  return migrateDetailed(raw).data;
}

/**
 * The game-side write, since T0.6/R9: LOAD-MERGE-WRITE done at WRITE time.
 * The on-disk records are re-read and merged key by key — a caller whose
 * view went stale between its load and this write (a second tab racing
 * placements, R9's exact scenario) lands its own changed keys WITHOUT
 * erasing records it never saw; per key, the newest stamp wins. Deleting a
 * record is NOT this function's vocabulary (that is `clearSave` /
 * `replaceSave`) — no production code ever dropped a build key, and a
 * key missing from the incoming envelope is treated as STALE VIEW, not
 * delete intent. Settings stay last-writer (the per-key law is builds and
 * stars, the two that race). Sound against the law this is written for:
 * every game-side writer loads IMMEDIATELY before writing (a synchronous
 * load-merge-write), so a key whose value differs really is this writer's
 * fresh edit, and a key it never saw really is another tab's.
 */
export function saveSave(data: SaveData, store: StorageLike | null = defaultStorage()): void {
  if (!store) return;
  try {
    let raw: string | null = null;
    try {
      raw = store.getItem(SAVE_KEY);
    } catch {
      raw = null;
    }
    // localStorage reads are not atomic AS A GROUP across processes — a
    // second tab's write can land between our read and our write. Verify
    // the view right before installing it and re-merge once if the disk
    // moved meanwhile (Recommendations §5: "refuse the write when the
    // on-disk state moved since the load — retry once by re-merge"; the
    // cheap shape of that, no lease, no rev bookkeeping).
    for (let attempt = 0; attempt < 2; attempt++) {
      const envelope = mergeEnvelope(raw, data);
      let current: string | null;
      try {
        current = store.getItem(SAVE_KEY);
      } catch {
        current = null;
      }
      if (current === raw) {
        store.setItem(SAVE_KEY, envelope);
        return;
      }
      raw = current;
    }
    store.setItem(SAVE_KEY, mergeEnvelope(raw, data));
  } catch {
    // quota or private mode: losing the save is survivable, crashing is not
  }
}

/** Merge the on-disk envelope's records with the incoming save — the body
 *  of `saveSave`, factored for the re-merge retry. */
function mergeEnvelope(raw: string | null, data: SaveData): string {
  const now = Date.now();
  const base = raw === null ? null : migrateDetailed(raw);
  const builds: Record<string, Stamped<string>> = {};
  const stars: Record<string, Stamped<number>> = {};
  const reached: Record<string, true> = {};
  if (base) {
    for (const [k, v] of Object.entries(base.data.builds)) builds[k] = { t: base.buildStamps[k] ?? 0, v };
    for (const [k, v] of Object.entries(base.data.progress.stars))
      stars[k] = { t: base.starStamps[k] ?? 0, v };
    Object.assign(reached, base.data.progress.reached);
  }
  for (const [k, v] of Object.entries(data.builds)) if (builds[k]?.v !== v) builds[k] = { t: now, v };
  for (const [k, v] of Object.entries(data.progress.stars))
    if (stars[k]?.v !== v) stars[k] = { t: now, v };
  Object.assign(reached, data.progress.reached); // monotone by design — union
  const outBuilds: Record<string, string | { t: number; s: string }> = {};
  for (const [k, r] of Object.entries(builds)) outBuilds[k] = r.t === 0 ? r.v : { t: r.t, s: r.v };
  const outStars: Record<string, number | { t: number; n: number }> = {};
  for (const [k, r] of Object.entries(stars)) outStars[k] = r.t === 0 ? r.v : { t: r.t, n: r.v };
  return JSON.stringify({
    v: SAVE_VERSION,
    builds: outBuilds,
    settings: data.settings,
    progress: { stars: outStars, reached },
  });
}

/** The deliberate INSTALL write: the incoming envelope REPLACES the save
 *  wholesale — import and restore-from-quarantine only. Everyday game
 *  writes go through the merging `saveSave`. */
export function replaceSave(data: SaveData, store: StorageLike | null = defaultStorage()): void {
  if (!store) return;
  try {
    store.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // as above
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

// ---- T0.3 / R1: the quarantine store ------------------------------------------

const corruptSeq = (store: StorageLike): number => {
  const n = Number.parseInt(store.getItem(CORRUPT_SEQ_KEY) ?? '0', 10);
  return Number.isInteger(n) && n > 0 ? Math.min(n, QUARANTINE_CAP) : 0;
};

/**
 * Stash raw bytes that `loadSave` could not use, under
 * `gravity-works.save.corrupt-<n>` — BEFORE the game continues on a fresh
 * envelope, so the next `saveSave` of fresh state renames the danger
 * instead of committing it. Deduped against the copies already held (a
 * damaged blob on disk is re-read by every `loadSave` of the boot; it must
 * quarantine exactly once) and capped at `QUARANTINE_CAP`.
 */
export function quarantineRaw(raw: string, store: StorageLike | null = defaultStorage()): void {
  if (!store) return;
  try {
    const seq = corruptSeq(store);
    for (let i = 0; i < seq; i++) {
      if (store.getItem(`${CORRUPT_KEY_PREFIX}-${i}`) === raw) return;
    }
    if (seq >= QUARANTINE_CAP) return;
    store.setItem(`${CORRUPT_KEY_PREFIX}-${seq}`, raw);
    store.setItem(CORRUPT_SEQ_KEY, String(seq + 1));
  } catch {
    // storage full: the ORIGINAL key still holds the bytes — nothing gained
    // by crashing the game over the insurance copy
  }
}

export interface QuarantinedSave {
  key: string;
  raw: string;
}

/** The copies set aside, oldest first — what the Settings row lists. */
export function listQuarantined(store: StorageLike | null = defaultStorage()): QuarantinedSave[] {
  const out: QuarantinedSave[] = [];
  if (!store) return out;
  try {
    const seq = corruptSeq(store);
    for (let i = 0; i < seq; i++) {
      const key = `${CORRUPT_KEY_PREFIX}-${i}`;
      const raw = store.getItem(key);
      if (raw !== null) out.push({ key, raw });
    }
  } catch {
    // unreadable storage shows an empty list, never a crash
  }
  return out;
}

/** Remember the player's current build for a level (the game's autosave
 *  call). A synchronous load-merge-write — see `saveSave` for the R9 law. */
export function rememberBuild(build: Build, store: StorageLike | null = defaultStorage()): void {
  const data = loadSave(store);
  data.builds[build.levelId] = serialize(build);
  saveSave(data, store);
}

/** The edit-side autosave scheduler: see `createBuildAutosave`. */
export interface BuildAutosave {
  /** Note the latest build and restart the debounce window. */
  edit(build: Build): void;
  /** Write any not-yet-written edit immediately (no-op when clean). */
  flush(): void;
}

/**
 * The AUTOSAVE the GAME uses while the player edits (playtest T round4:
 * "reload kept the build — 1 of 3 survived"). `rememberBuild` is the write;
 * this scheduler decides WHEN the shell calls it: one write per EDIT BURST
 * rather than a full envelope rewrite per mutation — every place/remove
 * replaces the pending build and restarts the `delayMs` trailing timer, and
 * the latest build is written once when the window closes.
 *
 * The debounce must never BECOME the data-loss path it is scheduling
 * around, so `flush()` is the guarantee, not a nicety: the shell calls it
 * on `pagehide` and on `visibilitychange → hidden` (a reload or a tab-put-
 * away inside the window still stores the last edit), and a level change is
 * a cross-document navigation (`?level=` swaps reload the page), which
 * fires `pagehide` on the way out — no pending edit ever survives a boot.
 *
 * Cross-level isolation is NOT this scheduler's business and unchanged by
 * it: a session edits exactly ONE level, the write is the level-keyed
 * `rememberBuild` (a kitchen burst writes `builds.kitchen01` and touches
 * nothing else), and `startBuildFor` refuses a record naming another
 * level — so a kitchen edit can never restore onto a bedroom level.
 */
export function createBuildAutosave(
  remember: (build: Build) => void,
  delayMs = 350,
  clock: { schedule(fn: () => void, ms: number): unknown; cancel(handle: unknown): void } = {
    schedule: (fn, ms) => setTimeout(fn, ms),
    cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  },
): BuildAutosave {
  let pending: Build | null = null;
  let handle: unknown = null;
  const write = (): void => {
    if (handle !== null) {
      clock.cancel(handle);
      handle = null;
    }
    if (pending === null) return;
    const build = pending;
    pending = null;
    remember(build);
  };
  return {
    edit: (build) => {
      pending = build;
      if (handle !== null) clock.cancel(handle);
      handle = clock.schedule(() => {
        handle = null;
        write();
      }, delayMs);
    },
    flush: write,
  };
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

/** Import a file the user picked (anything with an async text()).
 *  VALIDATED BEFORE ACCEPTED (T0.3/R1): the bytes run through the same
 *  migrate machinery as a load, with the salvage allowance for a from-the-
 *  future envelope whose shape validates; an unusable file THROWS and the
 *  live save is never touched — an import that cannot be read must not
 *  become the wipe it is meant to undo. */
export async function importSaveFile(file: { text(): Promise<string> }): Promise<SaveData> {
  const salvaged = salvageBlob(await file.text());
  if (!salvaged.ok) throw new Error('importSaveFile: not a usable save');
  return salvaged.data;
}

/** Import/restore validation: run the migrate machinery with the SALVAGE
 *  allowance (a future-version envelope whose shape validates is taken at
 *  face value — v3 bytes the player can inspect are recoverable while v3
 *  stays RESERVED: the live game never auto-loads them, see
 *  `migrateDetailed`). `ok:false` = a reject, never a silent fresh. */
export function salvageBlob(raw: string): { ok: boolean; data: SaveData } {
  const outcome = migrateDetailed(raw, { tolerateFuture: true });
  return { ok: outcome.usable, data: outcome.data };
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
