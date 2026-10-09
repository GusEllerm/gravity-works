/**
 * The campaign table and the ONE unlock rule. The pure side of the room
 * picker: the FLAT WEAVED ladder (stage-6 T3.1 — the order re-weave treats
 * the player evaluation's "rung 8 is rung 1 with different wallpaper" by
 * interleaving the rooms' grammar rungs), the weave LAWS the Decision Log
 * 2026-10-09 (T3.1) entry states (grammar gap, prerequisite table, room arcs,
 * rising curve, beginner walk), the room grouping the level select prints,
 * and `levelUnlock`'s three doors (first rung / previous rung's star / the
 * legacy `reached` carry) — including the two the level select must never
 * get wrong: a kitchen-only legacy save keeps its kitchen and does NOT open
 * the next rung, and a migrated mark from an old `?level=` visit is the only
 * thing besides stars that may open one. Because the save records IDS (stars
 * and `reached`), a mid-campaign save crosses the re-weave sanely: the next
 * rung is resolved from ids, never an index — asserted below.
 */
import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
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

/** pars.json, for the curve law. */
const pars = new Map<string, number>(
  JSON.parse(readFileSync(new URL('../../src/world/pars.json', import.meta.url), 'utf8')).map(
    (p: { levelId: string; parPieces: number }) => [p.levelId, p.parPieces],
  ),
);

/** The rung's GRAMMAR = its lesson family, keyed by the room's rung number
 *  (every room note names it: 01 the intro/gap lesson, 02 the CHOICE, 03 the
 *  TRADE-OFF/order rung, 04 the capstone, 05 the encore/finale two-crosser). */
const grammarOf = (id: string): string => id.slice(-2);

describe('campaign table', () => {
  test('the ladder is the re-woven flat order — rooms interleaved, arcs preserved', () => {
    expect(CAMPAIGN.map((r) => r.id)).toEqual(['kitchen', 'bedroom', 'bathroom', 'garden', 'garage', 'porch']);
    expect(CAMPAIGN_LADDER).toEqual([
      'kitchen01',
      'kitchen02',
      'kitchen03',
      'bedroom01',
      'bedroom02',
      'kitchen04',
      'kitchen05',
      'bedroom03',
      'bathroom01',
      'bathroom02',
      'bathroom03',
      'bathroom05',
      'bathroom04',
      'garden01',
      'garden02',
      'bedroom05',
      'bedroom04',
      'garden03',
      'garden05',
      'garden04',
      'garage01',
      'garage02',
      'garage03',
      'garage05',
      'garage04',
      'porch01',
      'porch02',
      'porch03',
      'porch04',
      'porch05',
    ]);
    expect(CAMPAIGN.flatMap((r) => [...r.levelIds])).toHaveLength(CAMPAIGN_LADDER.length);
    // The rooms are a PROJECTION of the ladder, grouped for the select
    for (const room of CAMPAIGN) {
      expect(room.levelIds).toEqual(CAMPAIGN_LADDER.filter((id) => campaignRoomOf(id)!.id === room.id));
    }
    // The rooms stay VISUALLY grouped in house order (dev-select grouping
    // unchanged) and the campaign ends in the yard light
    expect(CAMPAIGN.at(-1)!.id).toBe('porch');
    expect(CAMPAIGN_LADDER.at(-1)).toBe('porch05');
  });

  test('the boundaries are normal steps: Next/Previous walk the woven ladder', () => {
    expect(nextInCampaign('kitchen03')).toBe('bedroom01'); // the bedroom ramp opens
    expect(previousInCampaign('bedroom01')).toBe('kitchen03');
    expect(nextInCampaign('bedroom02')).toBe('kitchen04'); // back to the kitchen's tap
    expect(previousInCampaign('kitchen04')).toBe('bedroom02');
    expect(nextInCampaign('kitchen05')).toBe('bedroom03'); // the booster lesson hands to the pyramid
    expect(previousInCampaign('bedroom03')).toBe('kitchen05');
    expect(nextInCampaign('bedroom03')).toBe('bathroom01'); // the bedroom era hands off to the bathroom
    expect(previousInCampaign('bathroom01')).toBe('bedroom03');
    expect(nextInCampaign('bedroom05')).toBe('bedroom04'); // the ENCORE lands on its room's finale
    expect(nextInCampaign('bedroom04')).toBe('garden03');
    expect(previousInCampaign('garden03')).toBe('bedroom04');
    expect(nextInCampaign('bathroom03')).toBe('bathroom05');
    expect(nextInCampaign('bathroom05')).toBe('bathroom04');
    expect(nextInCampaign('bathroom04')).toBe('garden01');
    expect(previousInCampaign('garden01')).toBe('bathroom04');
    expect(nextInCampaign('garden02')).toBe('bedroom05'); // the bedroom finale rides the garden's wake
    expect(nextInCampaign('garden04')).toBe('garage01');
    expect(previousInCampaign('garage01')).toBe('garden04');
    expect(nextInCampaign('garage04')).toBe('porch01'); // the garage closes and the porch OPENS
    expect(previousInCampaign('porch01')).toBe('garage04');
    expect(nextInCampaign('porch05')).toBeNull(); // the campaign ends on the porch, in the yard light
    expect(previousInCampaign('kitchen01')).toBeNull();
    expect(nextInCampaign('feeltrack')).toBeNull();
    expect(campaignIndex('kitchen-sandbox')).toBe(-1);
    expect(campaignRoomOf('bedroom03')!.id).toBe('bedroom');
    expect(campaignRoomOf('bathroom03')!.id).toBe('bathroom');
    expect(campaignRoomOf('garden01')!.id).toBe('garden');
    expect(campaignRoomOf('garage01')!.id).toBe('garage');
    expect(campaignRoomOf('porch01')!.id).toBe('porch');
    expect(campaignRoomOf('porch05')!.id).toBe('porch');
    expect(campaignRoomOf('feeltrack')).toBeNull();
  });
});

describe('the weave laws (T3.1 — Decision Log 2026-10-09)', () => {
  test('same-grammar rungs sit >= 3 apart (the deja vu law)', () => {
    const seen = new Map<string, number>();
    CAMPAIGN_LADDER.forEach((id, i) => {
      const g = grammarOf(id);
      if (seen.has(g)!) expect(i - seen.get(g)!, `${g} at ${i} (${id})`).toBeGreaterThanOrEqual(3);
      seen.set(g, i);
    });
  });

  test('the prerequisite table holds: nothing is assumed before it is taught', () => {
    // Derived from the shipped level notes (see the Decision Log entry):
    // (a) a capstone spends its room's verbs, so X04 follows X01, X02, X03;
    // (b) kitchen05 is "everything together" — the whole kitchen ladder;
    //     porch05 is the house's last word — the whole porch ladder;
    // (c) every encore DOUBLES its room's founding sentence (X05 <- X01)
    //     and spends the catcher its TRADE-OFF taught (X05 <- X03);
    // (d) every live grip zone presumes the tap: the wet-patch lesson is
    //     kitchen04's (the hazards system ships ONE kind; the level files'
    //     own `hazards` declarations are the source — the 01 rungs of the
    //     wet rooms carry the live patch INTO their intro rung too);
    // (e) every encore's tray carries a booster TEMPTATION — the booster is
    //     kitchen05's lesson (bedroom05: "the room's first speed purchase");
    // (f) bedroom01 reframes the LAUNCH verb the kitchen tutorial taught.
    const prereqs: Record<string, string[]> = {};
    const add = (id: string, ps: string[]) => (prereqs[id] = [...(prereqs[id] ?? []), ...ps]);
    for (const room of ['kitchen', 'bedroom', 'bathroom', 'garden', 'garage', 'porch']) {
      add(`${room}04`, [`${room}01`, `${room}02`, `${room}03`]);
    }
    add('kitchen05', ['kitchen01', 'kitchen02', 'kitchen03', 'kitchen04']);
    add('porch05', ['porch01', 'porch02', 'porch03', 'porch04']);
    for (const room of ['bedroom', 'bathroom', 'garden', 'garage']) {
      add(`${room}05`, [`${room}01`, `${room}03`, 'kitchen05']);
    }
    for (const id of [
      'bathroom01', 'bathroom03', 'bathroom04', 'bathroom05', // drain splash / tub / full bath / twin drains
      'garage01', 'garage03', 'garage04', 'garage05', // stain / tunnel / lap / spill
      'garden03', 'garden04', 'garden05', // sprinkler sprawl + film
    ]) {
      add(id, ['kitchen04']);
    }
    add('bedroom01', ['kitchen01']);
    for (const [id, ps] of Object.entries(prereqs)) {
      for (const p of ps) {
        expect(campaignIndex(p), `${p} before ${id}`).toBeLessThan(campaignIndex(id));
      }
    }
    // The law's edge cases, pinned as DATA (the hazards and tray declarations
    // these edges derive from must not silently change under it):
    // - garden01's shadow is NOT a grip zone (no live hazards) — exempt;
    // - porch rungs ship no live zone and no booster — exempt (except by
    //   room arc); geometry citations (the encoures' PORCH_THRESHOLD dip
    //   lead) are rung-local authoring references, NOT player lessons.
    expect(CAMPAIGN_LADDER).toHaveLength(30);
  });

  test("room arcs survive: each room rungs play in the room's own order, encore onto finale", () => {
    for (const room of CAMPAIGN) {
      const authored =
        room.id === 'kitchen' || room.id === 'porch'
          ? [1, 2, 3, 4, 5]
          : [1, 2, 3, 5, 4]; // encore before capstone: the shipped room arc
      expect(room.levelIds).toEqual(authored.map((n) => `${room.id}${String(n).padStart(2, '0')}`));
      const idx = room.levelIds.map((id) => campaignIndex(id));
      expect(idx).toEqual([...idx].sort((a, b) => a - b)); // ascending on the flat ladder
    }
    // The finale still feels like the finale: every encore lands DIRECTLY on
    // its room's capstone, and each room's 04 is that room's LAST rung.
    for (const room of ['bedroom', 'bathroom', 'garden', 'garage']) {
      expect(nextInCampaign(`${room}05`)).toBe(`${room}04`);
    }
  });

  test('difficulty stays a rising curve and the walk in is gentle', () => {
    const pieces = CAMPAIGN_LADDER.map((id) => pars.get(id)!);
    // (d) the beginner walk: the kitchen ramp into the bedroom's ride-over
    expect(CAMPAIGN_LADDER.slice(0, 5)).toEqual(['kitchen01', 'kitchen02', 'kitchen03', 'bedroom01', 'bedroom02']);
    expect(Math.max(...pieces.slice(0, 5))).toBeLessThanOrEqual(5);
    // No cliff: no rung's tray is more than TWO pieces smaller than its
    // predecessor's (the room-intro rungs reset the felt difficulty gently,
    // never the ladder's shape).
    for (let i = 1; i < pieces.length; i++) {
      expect(pieces[i - 1]! - pieces[i]!).toBeLessThanOrEqual(2);
    }
    // Second half is not easier than the first.
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(pieces.slice(15))).toBeGreaterThanOrEqual(mean(pieces.slice(0, 15)));
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
    const p = P({ stars: { kitchen03: 1 } });
    expect(levelUnlock(p, 'bedroom01').unlocked).toBe(true);
    // the rung after bedroom01 still needs bedroom01's own star
    expect(levelUnlock(p, 'bedroom02').unlocked).toBe(false);
    const q = P({ stars: { kitchen01: 3 } });
    expect(levelUnlock(q, 'kitchen02').unlocked).toBe(true);
    expect(levelUnlock(q, 'kitchen03').unlocked).toBe(false);
  });

  test('a zero-star record opens nothing (§9.2: stars, not trying)', () => {
    const p = P({ stars: { kitchen03: 0 } });
    expect(levelUnlock(p, 'bedroom01').unlocked).toBe(false);
  });

  test('a mid-campaign save crosses the re-weave sanely: ids, never indices', () => {
    // The save of a player who had just starred bathroom03 under the OLD
    // order: the stars/reached records name LEVEL IDS, so the re-woven
    // ladder resolves their frontier from the ids alone — the next rung is
    // whatever the new order says follows the star they actually earned.
    const p = P({ stars: { bathroom03: 1 }, reached: { kitchen01: true, bathroom01: true } });
    expect(levelUnlock(p, 'bathroom05').unlocked).toBe(true); // the woven rung after bathroom03
    expect(levelUnlock(p, 'bathroom04').unlocked).toBe(false); // behind the encore's star
    expect(levelUnlock(p, 'bathroom04').requires).toBe('bathroom05');
    expect(levelUnlock(p, 'kitchen01').unlocked).toBe(true); // the reached carry still reads
    expect(nextInCampaign('bathroom03')).toBe('bathroom05'); // Next resolves from ids
  });

  test('the legacy reached carry opens where a v1 player stood — and only there', () => {
    // a kitchen-only v1 save, migrated: the kitchen stands unlocked (no
    // re-locking a finisher behind kitchen01), the next rung does NOT open
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
    // the woven ladder's first step out of the kitchen is the bedroom RAMP
    expect(levelUnlock(save.progress, 'bedroom01').unlocked).toBe(false);
    expect(levelUnlock(save.progress, 'bedroom01').requires).toBe('kitchen03');
    // and neither the bathroom nor the rest: the rule is ONE rule, not a
    // per-room rule, and every era handoff stays star-gated
    expect(levelUnlock(save.progress, 'bathroom01').unlocked).toBe(false);
    expect(levelUnlock(save.progress, 'bathroom01').requires).toBe('bedroom03');
    expect(levelUnlock(save.progress, 'garden01').unlocked).toBe(false);
    expect(levelUnlock(save.progress, 'garden01').requires).toBe('bathroom04');
    expect(levelUnlock(save.progress, 'garage01').unlocked).toBe(false);
    expect(levelUnlock(save.progress, 'garage01').requires).toBe('garden04');
    // and neither the porch, the campaign's last room (the rule is
    // ONE rule — the sixth room is opened by the garage's last star)
    expect(levelUnlock(save.progress, 'porch01').unlocked).toBe(false);
    expect(levelUnlock(save.progress, 'porch01').requires).toBe('garage04');
  });

  test('off-campaign ids are outside the rule (debug addressing is recorded elsewhere)', () => {
    expect(levelUnlock(P(), 'feeltrack').unlocked).toBe(true);
    expect(levelUnlock(P(), 'feeltrack').requires).toBeNull();
  });
});
