/**
 * THE CAMPAIGN (stage 4): the ordered set of rooms a player walks, and the
 * one unlock rule every surface (level select, Next, boot) reads.
 *
 * The model is the flat ladder the shell already walked — kitchen01..05 →
 * bedroom01..04 — grouped by ROOM for the level select. Rooms are ORDERED
 * GROUPS, not a second axis of state: a level belongs to exactly one room
 * (its `set` declaration is scenery; the campaign table is progression), and
 * `CAMPAIGN_LADDER` is the rooms' levelIds concatenated — the SAME sequence
 * `nextLevelId` walked before the level select existed, so the Next button
 * and the page cannot disagree. Importing the level modules is what
 * REGISTERS them (the registry convention); boot keeps importing them too.
 *
 * The unlock rule is §9.2's, stated once: a rung is unlocked when it is the
 * campaign's first rung, when the PREVIOUS rung earned at least one star
 * (the rule `gateNext` already applies to the Next button), or when the
 * save's LEGACY `reached` record names it — the v1→v2 migrade's carry of
 * where a kitchen-era player had demonstrably been (a saved build existed).
 * `reached` is written ONLY by that migrade: placing a piece in a v2 save
 * never opens a door, because unlocks are EARNED by stars, not by touching
 * a level (brief §9.2; the honesty pass' "no dead affordances" sibling —
 * nothing that LOOKS unlocked may secretly be locked, and nothing locked
 * may dangle as if live).
 *
 * What a URL can ADDRESS stays the debug doctrine (Decision Log
 * 2026-10-07): `?level=<id>` opens any REGISTERED level, on or off the
 * campaign; the unlock rule gates what the PLAYER-FACING surfaces offer,
 * and only a finished RUN (whatever build ran it) mints a star.
 */
import type { SaveProgress } from '../save/save.ts';
import { KITCHEN01_ID } from './levels/kitchen01.level.ts';
import { KITCHEN02_ID } from './levels/kitchen02.level.ts';
import { KITCHEN03_ID } from './levels/kitchen03.level.ts';
import { KITCHEN04_ID } from './levels/kitchen04.level.ts';
import { KITCHEN05_ID } from './levels/kitchen05.level.ts';
import { BEDROOM01_ID } from './levels/bedroom01.level.ts';
import { BEDROOM02_ID } from './levels/bedroom02.level.ts';
import { BEDROOM03_ID } from './levels/bedroom03.level.ts';
import { BEDROOM04_ID } from './levels/bedroom04.level.ts';
import { BATHROOM01_ID } from './levels/bathroom01.level.ts';
import { BATHROOM02_ID } from './levels/bathroom02.level.ts';
import { BATHROOM03_ID } from './levels/bathroom03.level.ts';
import { BATHROOM04_ID } from './levels/bathroom04.level.ts';
import { GARDEN01_ID } from './levels/garden01.level.ts';
import { GARDEN02_ID } from './levels/garden02.level.ts';
import { GARDEN03_ID } from './levels/garden03.level.ts';
import { GARDEN04_ID } from './levels/garden04.level.ts';

/** One room of the campaign: an ordered run of rung ids under a heading. */
export interface CampaignRoom {
  id: string;
  /** The heading the level select prints. */
  label: string;
  levelIds: readonly string[];
}

/** The campaign, in play order. Levels outside the table (the sandbox, the
 *  feel rig) are addressable by `?level=` but are nobody's rung. */
export const CAMPAIGN: readonly CampaignRoom[] = [
  {
    id: 'kitchen',
    label: 'Kitchen',
    levelIds: [KITCHEN01_ID, KITCHEN02_ID, KITCHEN03_ID, KITCHEN04_ID, KITCHEN05_ID],
  },
  {
    id: 'bedroom',
    label: 'Bedroom',
    levelIds: [BEDROOM01_ID, BEDROOM02_ID, BEDROOM03_ID, BEDROOM04_ID],
  },
  {
    id: 'bathroom',
    label: 'Bathroom',
    levelIds: [BATHROOM01_ID, BATHROOM02_ID, BATHROOM03_ID, BATHROOM04_ID],
  },
  {
    id: 'garden',
    label: 'Garden',
    levelIds: [GARDEN01_ID, GARDEN02_ID, GARDEN03_ID, GARDEN04_ID],
  },
];

/** The flat ladder, in order: the rooms' rungs concatenated. This is the
 *  sequence `nextLevelId` walks and the level select flattens — one table,
 *  so the Next button and the page cannot disagree about the boundary. */
export const CAMPAIGN_LADDER: readonly string[] = CAMPAIGN.flatMap((r) => [...r.levelIds]);

/** Position of `id` on the ladder, or -1 (off-campaign). */
export function campaignIndex(id: string): number {
  return CAMPAIGN_LADDER.indexOf(id);
}

/** The rung after `id`, or null (last rung / not on the ladder). */
export function nextInCampaign(id: string): string | null {
  const i = campaignIndex(id);
  return i >= 0 && i < CAMPAIGN_LADDER.length - 1 ? CAMPAIGN_LADDER[i + 1]! : null;
}

/** The rung before `id`, or null (first rung / not on the ladder). The
 *  unlock rule's subject and the locked-reason copy's object. */
export function previousInCampaign(id: string): string | null {
  const i = campaignIndex(id);
  return i > 0 ? CAMPAIGN_LADDER[i - 1]! : null;
}

/** The room a level belongs to (null = off-campaign). */
export function campaignRoomOf(id: string): CampaignRoom | null {
  return CAMPAIGN.find((r) => r.levelIds.includes(id)) ?? null;
}

export interface LevelLock {
  unlocked: boolean;
  /** The rung whose star opens this one (null when unlocked or first). */
  requires: string | null;
}

/**
 * §9.2's unlock rule over the save's progress record — the ONLY place the
 * rule is stated. An off-ladder id reports unlocked (it is not offered by
 * any player-facing surface; `?level=` addressing is the recorded debug
 * doctrine, not this function's business).
 */
export function levelUnlock(progress: SaveProgress, id: string): LevelLock {
  const i = campaignIndex(id);
  if (i < 0) return { unlocked: true, requires: null };
  if (i === 0) return { unlocked: true, requires: null };
  const prev = CAMPAIGN_LADDER[i - 1]!;
  if ((progress.stars[prev] ?? 0) >= 1) return { unlocked: true, requires: null };
  if (progress.reached[id] === true) return { unlocked: true, requires: null };
  return { unlocked: false, requires: prev };
}
