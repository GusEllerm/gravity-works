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
  firstSetAppearance,
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

  describe('the set-appearance moment (P4 item 5)', () => {
    test('a rung shipping a banked rim says its lines once, ever, in kit order', () => {
      const store = memoryStorage();
      const k03 = { fixtures: { ramp: 1, finishCup: 1, bank: 1, curve: 1 } };
      // one line per boot, kit order: `curve` before `bank` (pieces.ts order)
      expect(firstSetAppearance(k03, store)).toBe(PIECE_CALLOUTS.curve);
      expect(firstSetAppearance(k03, store)).toBe(PIECE_CALLOUTS.bank);
      expect(firstSetAppearance(k03, store)).toBeNull();
      expect(seenCallouts(store).sort()).toEqual(['bank', 'curve']);
    });

    test('the universal bookends never speak — a plain rung stays quiet', () => {
      const store = memoryStorage();
      expect(firstSetAppearance({ fixtures: { ramp: 1, finishCup: 1 } }, store)).toBeNull();
      // and a quiet walk spends nothing: the seen set stays empty
      expect(seenCallouts(store)).toEqual([]);
    });

    test('the real rungs match the census: kitchen02 curve; kitchen03 bank; nothing else', async () => {
      const store = memoryStorage();
      const { KITCHEN02 } = await import('../../src/world/levels/kitchen02.level.ts');
      const { KITCHEN03 } = await import('../../src/world/levels/kitchen03.level.ts');
      expect(firstSetAppearance(KITCHEN02, store)).toBe(PIECE_CALLOUTS.curve);
      expect(firstSetAppearance(KITCHEN02, store)).toBeNull(); // curve spent
      expect(firstSetAppearance(KITCHEN03, store)).toBe(PIECE_CALLOUTS.bank); // curve already spent
      expect(firstSetAppearance(KITCHEN03, store)).toBeNull();
      // a rung with no shipped-but-unstocked kind says nothing at all
      const { KITCHEN04 } = await import('../../src/world/levels/kitchen04.level.ts');
      expect(firstSetAppearance(KITCHEN04, store)).toBeNull();
    });

    test('a kind the TRAY stocks is never double-taught by the set half', () => {
      const store = memoryStorage();
      // a future rung that ships a `straight` fixture AND sells straights:
      // the placement line owns the straight lesson, the set half is silent
      const rung = { fixtures: { ramp: 1, finishCup: 1, straight: 1 }, tray: { straight: 3 } };
      expect(firstSetAppearance(rung, store)).toBeNull();
      expect(seenCallouts(store)).toEqual([]); // and it spends nothing
    });

    test('a placed kind and a shipped kind share ONE seen set (no double lesson)', () => {
      const store = memoryStorage();
      // a player who met the bank in a sandbox tray needs no second line
      expect(firstSight('bank', store)).toBe(PIECE_CALLOUTS.bank);
      expect(firstSetAppearance({ fixtures: { ramp: 1, bank: 1 } }, store)).toBeNull();
    });
  });
});
