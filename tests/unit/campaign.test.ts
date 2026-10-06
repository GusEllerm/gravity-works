/**
 * The campaign table and the ONE unlock rule (stage 4). The pure side of
 * the room picker: the ladder order across the room boundary, the room
 * grouping the level select prints, and `levelUnlock`'s three doors
 * (first rung / previous rung's star / the legacy `reached` carry) —
 * including the two the level select must never get wrong: a kitchen-only
 * legacy save keeps its kitchen and does NOT open the bedroom, and a
 * migrated bedroom mark from an old `?level=` visit is the only thing
 * besides stars that may open one.
 */
import { describe, expect, test } from 'vitest';
import {
  CAMPAIGN,
  CAMPAIGN_LADDER,
  campaignIndex,
  campaignRoomOf,
  levelUnlock,
  nextInCampaign,
  previousInCampaign,
} from '../../src/world/campaign.ts';
import { freshSave, migrateBlob, type SaveProgress } from '../../src/save/save.ts';
import { serialize } from '../../src/track/build.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';

const build = serialize(KITCHEN01.placeholderBuild());

const P = (over: Partial<SaveProgress> = {}): SaveProgress => ({
  ...freshSave().progress,
  ...over,
});

describe('campaign table', () => {
  test('the ladder is the rooms concatenated: kitchen01..05, bedroom01..04, bathroom01..04, then garden01..04', () => {
    expect(CAMPAIGN.map((r) => r.id)).toEqual(['kitchen', 'bedroom', 'bathroom', 'garden']);
    expect(CAMPAIGN_LADDER).toEqual([
      'kitchen01',
      'kitchen02',
      'kitchen03',
      'kitchen04',
      'kitchen05',
      'bedroom01',
      'bedroom02',
      'bedroom03',
      'bedroom04',
      'bathroom01',
      'bathroom02',
      'bathroom03',
      'bathroom04',
      'garden01',
      'garden02',
      'garden03',
      'garden04',
    ]);
    expect(CAMPAIGN.flatMap((r) => [...r.levelIds])).toEqual([...CAMPAIGN_LADDER]);
  });

  test('the boundary is a normal step: next after kitchen05 is bedroom01, none after garden04', () => {
    expect(nextInCampaign('kitchen05')).toBe('bedroom01');
    expect(previousInCampaign('bedroom01')).toBe('kitchen05');
    expect(nextInCampaign('bedroom04')).toBe('bathroom01'); // the bedroom era hands off to the bathroom
    expect(previousInCampaign('bathroom01')).toBe('bedroom04');
    expect(nextInCampaign('bathroom04')).toBe('garden01'); // the bathroom era hands off to the garden
    expect(previousInCampaign('garden01')).toBe('bathroom04');
    expect(nextInCampaign('garden04')).toBeNull();
    expect(previousInCampaign('kitchen01')).toBeNull();
    expect(nextInCampaign('feeltrack')).toBeNull();
    expect(campaignIndex('kitchen-sandbox')).toBe(-1);
    expect(campaignRoomOf('bedroom03')!.id).toBe('bedroom');
    expect(campaignRoomOf('bathroom03')!.id).toBe('bathroom');
    expect(campaignRoomOf('garden01')!.id).toBe('garden');
    expect(campaignRoomOf('feeltrack')).toBeNull();
  });
});

describe('levelUnlock — the rule surfaces share', () => {
  test('a fresh save: only the first rung is open', () => {
    const p = P();
    expect(levelUnlock(p, 'kitchen01').unlocked).toBe(true);
    for (const id of CAMPAIGN_LADDER.slice(1)) {
      const lock = levelUnlock(p, id);
      expect(lock.unlocked, id).toBe(false);
      expect(lock.requires, id).toBe(previousInCampaign(id));
    }
  });

  test('a star on the previous rung opens exactly the next one', () => {
    const p = P({ stars: { kitchen05: 1 } });
    expect(levelUnlock(p, 'bedroom01').unlocked).toBe(true);
    // the rung after bedroom01 still needs bedroom01's own star
    expect(levelUnlock(p, 'bedroom02').unlocked).toBe(false);
    const q = P({ stars: { kitchen01: 3 } });
    expect(levelUnlock(q, 'kitchen02').unlocked).toBe(true);
    expect(levelUnlock(q, 'kitchen03').unlocked).toBe(false);
  });

  test('a zero-star record opens nothing (§9.2: stars, not trying)', () => {
    const p = P({ stars: { kitchen05: 0 } });
    expect(levelUnlock(p, 'bedroom01').unlocked).toBe(false);
  });

  test('the legacy reached carry opens where a v1 player stood — and only there', () => {
    // a kitchen-only v1 save, migrated: the kitchen stands unlocked (no
    // re-locking a finisher behind kitchen01), the bedroom does NOT open
    const v1 = JSON.stringify({
      v: 1,
      builds: {
        kitchen01: build,
        kitchen02: build,
        kitchen03: build,
        kitchen04: build,
        kitchen05: build,
      },
      settings: {},
    });
    const save = migrateBlob(v1);
    expect(save.v).toBe(2);
    for (const id of ['kitchen01', 'kitchen02', 'kitchen03', 'kitchen04', 'kitchen05']) {
      expect(levelUnlock(save.progress, id).unlocked, id).toBe(true);
    }
    expect(levelUnlock(save.progress, 'bedroom01').unlocked).toBe(false);
    expect(levelUnlock(save.progress, 'bedroom01').requires).toBe('kitchen05');
    // and neither does the bathroom: the ladder past bedroom04 is still
    // star-gated the same way (the rule is ONE rule, not a per-room rule)
    expect(levelUnlock(save.progress, 'bathroom01').unlocked).toBe(false);
    expect(levelUnlock(save.progress, 'bathroom01').requires).toBe('bedroom04');
    // and neither does the garden: the rule is ONE rule, not a per-room rule
    expect(levelUnlock(save.progress, 'garden01').unlocked).toBe(false);
    expect(levelUnlock(save.progress, 'garden01').requires).toBe('bathroom04');
  });

  test('off-campaign ids are outside the rule (debug addressing is recorded elsewhere)', () => {
    expect(levelUnlock(P(), 'feeltrack').unlocked).toBe(true);
    expect(levelUnlock(P(), 'feeltrack').requires).toBeNull();
  });
});
