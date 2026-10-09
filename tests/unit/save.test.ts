import { describe, expect, test } from 'vitest';
import {
  MIGRATIONS,
  QUARANTINE_CAP,
  SAVE_KEY,
  SAVE_VERSION,
  clearSave,
  createBuildAutosave,
  freshSave,
  importSaveFile,
  listQuarantined,
  loadSave,
  memoryStorage,
  mergeEnvelopes,
  migrateBlob,
  recordStars,
  rememberBuild,
  replaceSave,
  salvageBlob,
  saveFileJson,
  saveSave,
  savedBuild,
} from '../../src/save/save.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts';
import { deserialize, serialize } from '../../src/track/build.ts';

describe('save', () => {
  test('nothing stored migrades through every version into a fresh envelope', () => {
    const store = memoryStorage();
    const data = loadSave(store);
    expect(data.v).toBe(SAVE_VERSION);
    expect(data.builds).toEqual({});
    expect(data.settings).toEqual({});
    expect(data.progress).toEqual({ stars: {}, reached: {} });
  });

  test('a versioned save round-trips through storage', () => {
    const store = memoryStorage();
    const data = freshSave();
    data.builds[FEELTRACK.id] = serialize(FEELTRACK.placeholderBuild());
    saveSave(data, store);
    expect(store.getItem(SAVE_KEY)).not.toBeNull();
    const back = loadSave(store);
    expect(back.v).toBe(SAVE_VERSION);
    expect(back.builds[FEELTRACK.id]).toBe(data.builds[FEELTRACK.id]);
  });

  test('garbage in the key becomes a fresh save, not a crash', () => {
    const store = memoryStorage({ [SAVE_KEY]: '{{{ not json' });
    expect(loadSave(store).v).toBe(SAVE_VERSION);
    expect(loadSave(store).builds).toEqual({});
  });

  test('a v0 blob is migrated and adopts any builds it carries', () => {
    const build = FEELTRACK.placeholderBuild();
    const legacy = JSON.stringify({ builds: { feeltrack: build, junk: 42 } });
    const data = migrateBlob(legacy);
    expect(data.v).toBe(SAVE_VERSION);
    expect(Object.keys(data.builds)).toEqual(['feeltrack']);
    expect(data.builds.feeltrack).toBe(serialize(build));
    // the adopted builds also carry the v1-era `reached` mark (v1 -> v2)
    expect(data.progress.reached).toEqual({ feeltrack: true });
  });

  test('a future version starts clean rather than corrupting', () => {
    expect(migrateBlob(JSON.stringify({ v: 99, builds: {}, settings: {} })).v).toBe(SAVE_VERSION);
  });

  test('clear removes the key', () => {
    const store = memoryStorage();
    saveSave(freshSave(), store);
    clearSave(store);
    expect(store.getItem(SAVE_KEY)).toBeNull();
  });

  test('export/import moves the same data through a file', async () => {
    const data = freshSave();
    data.builds[FEELTRACK.id] = serialize(FEELTRACK.placeholderBuild());
    const file = { text: async () => saveFileJson(data) };
    const back = await importSaveFile(file);
    expect(back.builds[FEELTRACK.id]).toBe(data.builds[FEELTRACK.id]);
  });

  test('rememberBuild/savedBuild are the game-facing pair', () => {
    const store = memoryStorage();
    const build = FEELTRACK.placeholderBuild();
    rememberBuild(build, store);
    const back = savedBuild(FEELTRACK.id, store);
    expect(serialize(back!)).toBe(serialize(build));
    expect(savedBuild('nope', store)).toBeUndefined();
  });

  test('there is exactly one migrade per version bump', () => {
    expect(MIGRATIONS.length).toBe(SAVE_VERSION); // v0 -> v1 and v1 -> v2
  });

  // ---- stage 4: the v1 -> v2 campaign migrade ------------------------------

  test('a v1 kitchen-only save migrades to v2 WITHOUT relocking the kitchen or opening the bedroom', () => {
    const build = serialize(KITCHEN01.placeholderBuild());
    const v1 = JSON.stringify({
      v: 1,
      builds: {
        kitchen01: build,
        kitchen02: build,
        kitchen03: build,
        kitchen04: build,
        kitchen05: build,
      },
      settings: { reducedMotion: true },
    });
    const data = migrateBlob(v1);
    expect(data.v).toBe(2);
    // every kitchen level the player stood in keeps its build AND its place
    expect(Object.keys(data.builds).sort()).toEqual([
      'kitchen01',
      'kitchen02',
      'kitchen03',
      'kitchen04',
      'kitchen05',
    ]);
    expect(data.settings).toEqual({ reducedMotion: true });
    // `reached` = exactly the levels that HAD a build record — no more
    expect(data.progress.reached).toEqual({
      kitchen01: true,
      kitchen02: true,
      kitchen03: true,
      kitchen04: true,
      kitchen05: true,
    });
    // and NO stars are minted from old bytes: the bedroom frontier is
    // re-earned by finishing kitchen05, never forged by a migration
    expect(data.progress.stars).toEqual({});
  });

  test('a v1 save with one kitchen build reached exactly one kitchen level', () => {
    const v1 = JSON.stringify({
      v: 1,
      builds: { kitchen01: serialize(KITCHEN01.placeholderBuild()) },
      settings: {},
    });
    expect(migrateBlob(v1).progress.reached).toEqual({ kitchen01: true });
  });

  test('a v2 blob without a well-shaped progress record is garbage like any other', () => {
    const noProgress = JSON.stringify({ v: 2, builds: {}, settings: {} });
    expect(migrateBlob(noProgress).v).toBe(SAVE_VERSION);
    expect(migrateBlob(noProgress).progress).toEqual({ stars: {}, reached: {} });
    const badStars = JSON.stringify({
      v: 2,
      builds: {},
      settings: {},
      progress: { stars: { kitchen01: 9 }, reached: {} },
    });
    expect(migrateBlob(badStars).progress.stars).toEqual({});
  });

  test('recordStars keeps the best per level, ignores failures, and persists', () => {
    const store = memoryStorage();
    recordStars('kitchen01', 2, store);
    expect(loadSave(store).progress.stars).toEqual({ kitchen01: 2 });
    recordStars('kitchen01', 1, store); // a worse rerun does not lower the best
    expect(loadSave(store).progress.stars).toEqual({ kitchen01: 2 });
    recordStars('kitchen01', 3, store);
    expect(loadSave(store).progress.stars).toEqual({ kitchen01: 3 });
    recordStars('kitchen02', 0, store); // a 0-star failure records NOTHING
    expect(loadSave(store).progress.stars).toEqual({ kitchen01: 3 });
    // and writing stars never touches the legacy reached record
    expect(loadSave(store).progress.reached).toEqual({});
  });

  test('builds that do not structurally validate are dropped on load', () => {
    const store = memoryStorage({
      [SAVE_KEY]: JSON.stringify({ v: 1, builds: { bad: '{{{' }, settings: {} }),
    });
    expect(loadSave(store).builds).toEqual({}); // fails validation -> fresh
  });

  test('deserialize validates what a save file claims about a build', () => {
    expect(() => deserialize('{"levelId":"x","seed":1,"pieces":[{"def":"nope","transform":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"seq":0}]}')).toThrow();
  });

  // ---- edit-side autosave (playtest T round4: "reload kept 1 of 3") ------

  test('the autosave writes ONCE per edit burst — the latest build, on the real store', () => {
    // a manual clock keeps the debounce window exact: no timers in the test
    const jobs = new Map<number, () => void>();
    let nextId = 1;
    const clock = {
      schedule: (fn: () => void, _ms: number) => {
        const id = nextId++;
        jobs.set(id, fn);
        return id;
      },
      cancel: (handle: unknown) => {
        jobs.delete(handle as number);
      },
    };
    const fire = () => {
      const all = [...jobs.values()];
      jobs.clear();
      for (const fn of all) fn();
    };
    const store = memoryStorage();
    const saved: string[] = [];
    const autosave = createBuildAutosave((b) => rememberBuild(b, store), 350, clock);

    // three edits in one burst: nothing is written while the window is open
    const b1 = KITCHEN01.parBuild();
    const b2 = { ...b1, pieces: b1.pieces.slice(0, 2) };
    const b3 = { ...b1, pieces: b1.pieces.slice(0, 3) };
    autosave.edit(b1);
    autosave.edit(b2);
    autosave.edit(b3);
    expect(saved.length).toBe(0);
    expect(Object.keys(loadSave(store).builds)).toEqual([]); // nothing stored YET
    fire(); // the window closes: ONE write, carrying the LATEST build
    expect(savedBuild(KITCHEN01.id, store)!.pieces.length).toBe(3);
    // a closed window stays closed: firing again with no edits writes nothing
    const bytes = loadSave(store).builds[KITCHEN01.id];
    fire();
    autosave.flush();
    expect(loadSave(store).builds[KITCHEN01.id]).toBe(bytes);
  });

  test('flush stores a pending edit immediately, exactly once — the before-unload guarantee', () => {
    const jobs = new Map<number, () => void>();
    const clock = {
      schedule: (fn: () => void, _ms: number) => {
        const id = jobs.size + 1;
        jobs.set(id, fn);
        return id;
      },
      cancel: (handle: unknown) => {
        jobs.delete(handle as number);
      },
    };
    const store = memoryStorage();
    const writes: number[] = [];
    const autosave = createBuildAutosave(
      (b) => {
        writes.push(b.pieces.length);
        rememberBuild(b, store);
      },
      350,
      clock,
    );
    autosave.flush(); // clean: flush of nothing writes nothing
    expect(writes).toEqual([]);
    const build = KITCHEN01.parBuild();
    autosave.edit(build);
    autosave.flush(); // the reload-inside-the-window case
    expect(writes).toEqual([build.pieces.length]);
    expect(savedBuild(KITCHEN01.id, store)!.pieces.length).toBe(build.pieces.length);
    autosave.flush(); // and the timer that still fires afterwards writes nothing
    for (const fn of [...jobs.values()]) fn();
    autosave.flush();
    expect(writes).toEqual([build.pieces.length]);
  });

  test('an autosaved kitchen build is keyed to ITS level — a bedroom read sees nothing (no-leak)', () => {
    const store = memoryStorage();
    rememberBuild(KITCHEN01.parBuild(), store); // the store-level fact the shell relies on
    expect(savedBuild('bedroom01', store)).toBeUndefined();
    expect(savedBuild(KITCHEN01.id, store)!.pieces.length).toBe(KITCHEN01.parBuild().pieces.length);
  });

  // ---- T0.3 / R1: QUARANTINE — the corruption matrix (evaluator, red→green) --
  //
  // Every hostile shape the engineering evaluation measured live (truncated
  // JSON, a string `builds`, one bad build among good, `v:3`, a string
  // `settings`, star `9`, array-builds), each asserting the three claims the
  // recommendation demanded: (i) the quarantine key NOW HOLDS the raw bytes,
  // (ii) the game keeps playing on a live envelope, (iii) a subsequent
  // `saveSave` of fresh state does NOT destroy recoverability. Mutation
  // proof: delete the quarantine call in `loadSave` and every row goes RED.

  const goodBuild = serialize(KITCHEN01.parBuild());
  const CORRUPTION_MATRIX: Record<string, string> = {
    'truncated JSON': '{"v":2,"builds":{"kitchen01":',
    'string builds': JSON.stringify({ v: 2, builds: 'nope', settings: {}, progress: { stars: {}, reached: {} } }),
    'one bad build among good': JSON.stringify({
      v: 2,
      builds: { kitchen01: goodBuild, kitchen02: '{{{' },
      settings: {},
      progress: { stars: { kitchen01: 2 }, reached: {} },
    }),
    'v:3 (the reserved version)': JSON.stringify({
      v: 3,
      builds: { kitchen01: goodBuild },
      settings: {},
      progress: { stars: { kitchen01: 3, kitchen02: 2 }, reached: {} },
    }),
    'string settings': JSON.stringify({ v: 2, builds: { kitchen01: goodBuild }, settings: 'loud', progress: { stars: {}, reached: {} } }),
    'star 9': JSON.stringify({ v: 2, builds: {}, settings: {}, progress: { stars: { kitchen01: 9 }, reached: {} } }),
    'array builds': JSON.stringify({ v: 2, builds: ['a', 'b'], settings: {}, progress: { stars: {}, reached: {} } }),
  };

  for (const [name, raw] of Object.entries(CORRUPTION_MATRIX)) {
    test(`R1 matrix — ${name}: quarantined, playable, recoverable`, () => {
      const store = memoryStorage({ [SAVE_KEY]: raw });
      const data = loadSave(store);
      // (i) the raw bytes moved OUTSIDE the envelope, under corrupt-<n>
      expect(listQuarantined(store).map((q) => q.raw)).toContain(raw);
      // the game keeps playing on a live v2 envelope
      expect(data.v).toBe(SAVE_VERSION);
      // (iii) a saveSave of FRESH state (the mute-click that used to commit
      // the wipe forever) must not touch the quarantined copy
      saveSave(freshSave(), store);
      expect(listQuarantined(store).map((q) => q.raw)).toContain(raw);
      // and the copy stays VALIDATABLE through the same migrate machinery
      // (salvage: bytes the player can inspect are recoverable bytes —
      // everything PARSEABLE can be salvaged; unparseable rows keep their
      // bytes for archaeology but cannot self-describe)
      const copy = listQuarantined(store).find((q) => q.raw === raw)!;
      let parseable = true;
      try {
        JSON.parse(raw);
      } catch {
        parseable = false;
      }
      expect(salvageBlob(copy.raw).ok).toBe(parseable);
    });
  }

  test('R1: the salvage keeps the GOOD entries — one bad build is not a whole-save wipe', () => {
    const store = memoryStorage({
      [SAVE_KEY]: JSON.stringify({
        v: 2,
        builds: { kitchen01: goodBuild, kitchen02: '{{{' },
        settings: {},
        progress: { stars: { kitchen01: 2 }, reached: {} },
      }),
    });
    const data = loadSave(store);
    expect(Object.keys(data.builds)).toEqual(['kitchen01']); // the good build SURVIVES
    expect(data.progress.stars.kitchen01).toBe(2);
    expect(listQuarantined(store).length).toBe(1); // and the raw is set aside
  });

  test('R1: quarantine dedupes — a damaged blob on disk quarantines exactly once', () => {
    const raw = JSON.stringify({ v: 3, builds: {}, settings: {}, progress: { stars: {}, reached: {} } });
    const store = memoryStorage({ [SAVE_KEY]: raw });
    for (let i = 0; i < 10; i++) loadSave(store); // every boot reads the same blob many times
    expect(listQuarantined(store).length).toBe(1);
  });

  test('R1: the quarantine is capped (a boot loop cannot fill localStorage)', () => {
    const store = memoryStorage();
    for (let i = 0; i < QUARANTINE_CAP + 5; i++) {
      store.setItem(SAVE_KEY, JSON.stringify({ v: 42, junk: i }));
      loadSave(store);
    }
    expect(listQuarantined(store).length).toBe(QUARANTINE_CAP);
  });

  test('R1: a HEALTHY save quarantines nothing — ordinary boots stay ordinary', () => {
    const store = memoryStorage();
    rememberBuild(KITCHEN01.parBuild(), store);
    recordStars('kitchen01', 3, store);
    loadSave(store);
    expect(listQuarantined(store)).toEqual([]);
  });

  test('R1: import validates through migrate — an unusable file THROWS, a future-shape file is salvaged', async () => {
    await expect(importSaveFile({ text: async () => '{{{ not json' })).rejects.toThrow(/not a usable save/);
    const v3 = JSON.stringify({
      v: 3,
      builds: { kitchen01: goodBuild },
      settings: {},
      progress: { stars: { kitchen01: 3, kitchen02: 2 }, reached: {} },
    });
    const back = await importSaveFile({ text: async () => v3 });
    expect(back.v).toBe(SAVE_VERSION); // clamped into the live shape
    expect(back.progress.stars).toEqual({ kitchen01: 3, kitchen02: 2 }); // TWO BANKED STARS, recovered
    // v3 stays RESERVED: the LIVE migrate never auto-loads a future blob
    expect(migrateBlob(v3).progress.stars).toEqual({});
  });

  test('R1: SAVE_VERSION is STILL 2 — quarantine and records bought no schema bump', () => {
    expect(SAVE_VERSION).toBe(2);
    expect(MIGRATIONS.length).toBe(2);
  });

  // ---- T0.6 / R9: newest-wins MERGE on the builds/stars maps -----------------

  test('R9: game writes store per-key timestamped records INSIDE the v2 envelope', () => {
    const store = memoryStorage();
    rememberBuild(KITCHEN01.parBuild(), store);
    recordStars('kitchen01', 2, store);
    const env = JSON.parse(store.getItem(SAVE_KEY)!);
    expect(env.v).toBe(2);
    expect(env.builds.kitchen01.t).toBeTypeOf('number');
    expect(env.builds.kitchen01.s).toBe(goodBuild);
    expect(env.progress.stars.kitchen01.n).toBe(2);
  });

  test('R9: schema-tolerant — plain (old-shape) entries still read, at stamp 0', () => {
    const store = memoryStorage({
      [SAVE_KEY]: JSON.stringify({
        v: 2,
        builds: { kitchen01: goodBuild },
        settings: {},
        progress: { stars: { kitchen01: 1 }, reached: { kitchen01: true } },
      }),
    });
    const data = loadSave(store);
    expect(data.builds.kitchen01).toBe(goodBuild);
    expect(data.progress.stars.kitchen01).toBe(1);
    expect(listQuarantined(store)).toEqual([]); // plain v2 is HEALTHY, not damaged
  });

  test('R9: the stale-tab race — a write whose view went stale MERGES, never clobbers', () => {
    const store = memoryStorage();
    const stale = loadSave(store); // tab B reads the envelope
    rememberBuild(KITCHEN01.parBuild(), store); // tab A writes a build
    stale.progress.stars.kitchen02 = 3; // tab B edits its OWN view…
    saveSave(stale, store); // …and writes late (the racing save-side)
    const saved = loadSave(store);
    expect(saved.builds.kitchen01).toBe(goodBuild); // tab A's record SURVIVED
    expect(saved.progress.stars.kitchen02).toBe(3); // tab B's change landed
  });

  test('R9: unchanged keys keep their on-disk stamp — a settings write is byte-stable', () => {
    const store = memoryStorage();
    rememberBuild(KITCHEN01.parBuild(), store);
    const before = JSON.parse(store.getItem(SAVE_KEY)!);
    const d = loadSave(store);
    d.settings.reducedMotion = true;
    saveSave(d, store);
    const after = JSON.parse(store.getItem(SAVE_KEY)!);
    expect(after.builds.kitchen01.t).toBe(before.builds.kitchen01.t);
    expect(after.settings.reducedMotion).toBe(true);
  });

  test('R9/restore: replaceSave INSTALLS (import semantics), saveSave MERGES', () => {
    const store = memoryStorage();
    rememberBuild(KITCHEN01.parBuild(), store);
    saveSave(freshSave(), store); // a merge-writer never deletes by omission
    expect(loadSave(store).builds.kitchen01).toBe(goodBuild);
    replaceSave(freshSave(), store); // the deliberate install path does
    expect(loadSave(store).builds).toEqual({});
  });

  // The ORDER-INDEPENDENCE PROOF of the per-key merge: whoever asks first,
  // and however often a re-merge retries, the same two envelopes land on
  // the SAME bytes. Same-ms stamp ties are broken by the CONTENT, never by
  // argument order — this is what makes the cross-tab heal converge.
  test('R9: the per-key merge is COMMUTATIVE — merge(a,b) and merge(b,a) are the same bytes', () => {
    const env = (
      builds: Record<string, string | { t: number; s: string }>,
      stars: Record<string, number | { t: number; n: number }>,
      reached: Record<string, true> = {},
    ) => JSON.stringify({ v: 2, builds, settings: {}, progress: { stars, reached } });
    const build = (levelId: string, seed: number) => serialize({ levelId, seed, pieces: [] });
    // a hostile pair: disjoint keys, SAME-MS stamp ties on the SAME key
    // with DIFFERENT content (builds AND stars), one-sided keys, a plain
    // (stamp-0) entry vs a stamped one, equal values at different stamps,
    // and reached sets that overlap without nesting.
    const a = env(
      {
        kitchen01: { t: 5, s: build('kitchen01', 1) },
        kitchen02: { t: 9, s: build('kitchen02', 1) }, // same content, older stamp than b
        kitchen03: build('kitchen03', 0), // plain = stamp 0, one-sided
      },
      { kitchen01: { t: 7, n: 2 }, kitchen02: { t: 1, n: 1 } },
      { kitchen01: true, kitchen02: true },
    );
    const b = env(
      {
        kitchen01: { t: 5, s: build('kitchen01', 2) }, // SAME stamp, DIFFERENT bytes — content tie-break
        kitchen02: { t: 3, s: build('kitchen02', 1) },
        kitchen04: { t: 8, s: build('kitchen04', 1) },
      },
      { kitchen01: { t: 7, n: 1 }, kitchen03: { t: 2, n: 3 } }, // stamp tie on a star too
      { kitchen02: true, kitchen03: true },
    );
    expect(mergeEnvelopes(a, b)).toBe(mergeEnvelopes(b, a));
    // …and IDEMPOTENT: healing the merged result against either input
    // again is a no-op — the heal-write poll converges, it cannot ping-pong
    expect(mergeEnvelopes(mergeEnvelopes(a, b), b)).toBe(mergeEnvelopes(a, b));
    expect(mergeEnvelopes(mergeEnvelopes(a, b), a)).toBe(mergeEnvelopes(a, b));
    // the union actually LANDED (not just "same bytes" by degenerate loss)
    const merged = JSON.parse(mergeEnvelopes(a, b));
    expect(Object.keys(merged.builds).sort()).toEqual(['kitchen01', 'kitchen02', 'kitchen03', 'kitchen04']);
    expect(merged.builds.kitchen01.s).toBe(build('kitchen01', 2)); // content tie-break is stable
    expect(merged.builds.kitchen02.t).toBe(9); // equal values keep the NEWER stamp
    expect(merged.builds.kitchen03).toBe(build('kitchen03', 0)); // stamp 0 stays the plain shape
    expect(merged.progress.stars.kitchen01.n).toBe(2); // star tie broken by content, once
    expect(merged.progress.stars.kitchen03.n).toBe(3);
    expect(Object.keys(merged.progress.reached).sort()).toEqual(['kitchen01', 'kitchen02', 'kitchen03']);
  });
});
