/**
 * First-time callouts (brief §9.3): the manifest covers every kit kind with
 * one line, and "seen" is recorded in the save so a line shows exactly once
 * across sessions — through the versioned save, not a side key.
 */
import { describe, expect, test } from 'vitest';
import {
  PIECE_CALLOUTS,
  PROP_CALLOUTS,
  calloutManifest,
  calloutText,
  firstSight,
  markCalloutSeen,
  seenCallouts,
} from '../../src/ui/callouts.ts';
import { PIECE_KINDS } from '../../src/track/pieces.ts';
import { SAVE_KEY, SAVE_VERSION, loadSave, memoryStorage } from '../../src/save/save.ts';

describe('callout manifest', () => {
  test('every kit piece has a one-line callout', () => {
    for (const kind of PIECE_KINDS) {
      const line = PIECE_CALLOUTS[kind];
      expect(line, `no callout for ${kind}`).toBeTruthy();
      expect(line).not.toContain('\n');
      expect(line!.length).toBeLessThanOrEqual(90); // §11: short and concrete
    }
  });

  test('the manifest lists pieces in kit order, then props', () => {
    const ids = calloutManifest().map((e) => e.id);
    expect(ids.slice(0, PIECE_KINDS.length)).toEqual([...PIECE_KINDS]);
    PROP_CALLOUTS['prop:tap'] = 'The tap wets the deck — wet halves grip.';
    expect(calloutManifest().at(-1)!.id).toBe('prop:tap');
    expect(calloutText('prop:tap')).toContain('grip');
    delete PROP_CALLOUTS['prop:tap'];
  });

  test('unknown ids have no line', () => {
    expect(calloutText('no-such-piece')).toBeUndefined();
  });
});

describe('seen tracking in the save', () => {
  test('firstSight returns the line once and then goes quiet', () => {
    const store = memoryStorage();
    expect(firstSight('loop', store)).toBe(PIECE_CALLOUTS.loop);
    expect(firstSight('loop', store)).toBeNull();
    expect(seenCallouts(store)).toEqual(['loop']);
  });

  test('unknown ids never touch the save', () => {
    const store = memoryStorage();
    expect(firstSight('nope', store)).toBeNull();
    expect(store.dump()[SAVE_KEY]).toBeUndefined();
    expect(seenCallouts(store)).toEqual([]);
  });

  test('seen ids live in settings.calloutsSeen of the versioned envelope', () => {
    const store = memoryStorage();
    markCalloutSeen('bank', store);
    markCalloutSeen('bank', store); // idempotent
    const data = loadSave(store);
    expect(data.v).toBe(SAVE_VERSION);
    expect(data.settings.calloutsSeen).toEqual(['bank']);
  });

  test('a save with other settings round-trips the seen list', () => {
    const store = memoryStorage();
    const seed = { v: 1, builds: {}, settings: { muted: true, calloutsSeen: ['ramp'] } };
    store.setItem(SAVE_KEY, JSON.stringify(seed));
    expect(firstSight('ramp', store)).toBeNull();
    expect(firstSight('straight', store)).toBe(PIECE_CALLOUTS.straight);
    expect(loadSave(store).settings.muted).toBe(true);
  });
});
