import { describe, expect, test } from 'vitest';
import {
  MIGRATIONS,
  SAVE_KEY,
  SAVE_VERSION,
  clearSave,
  createBuildAutosave,
  freshSave,
  importSaveFile,
  loadSave,
  memoryStorage,
  migrateBlob,
  recordStars,
  rememberBuild,
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
});
