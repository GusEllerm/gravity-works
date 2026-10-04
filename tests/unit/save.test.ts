import { describe, expect, test } from 'vitest';
import {
  MIGRATIONS,
  SAVE_KEY,
  SAVE_VERSION,
  clearSave,
  freshSave,
  importSaveFile,
  loadSave,
  memoryStorage,
  migrateBlob,
  rememberBuild,
  saveFileJson,
  saveSave,
  savedBuild,
} from '../../src/save/save.ts';
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts';
import { deserialize, serialize } from '../../src/track/build.ts';

describe('save', () => {
  test('nothing stored migrades v0 -> v1 into a fresh envelope', () => {
    const store = memoryStorage();
    const data = loadSave(store);
    expect(data.v).toBe(SAVE_VERSION);
    expect(data.builds).toEqual({});
    expect(data.settings).toEqual({});
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
    expect(data.v).toBe(1);
    expect(Object.keys(data.builds)).toEqual(['feeltrack']);
    expect(data.builds.feeltrack).toBe(serialize(build));
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
    expect(MIGRATIONS.length).toBe(SAVE_VERSION); // v0 -> v1 is the first
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
});
