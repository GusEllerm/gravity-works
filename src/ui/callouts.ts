/**
 * First-time piece/prop callouts (brief §9.3: "Every new piece or prop in
 * every set gets a one-line callout the first time it appears in the tray or
 * on the set"). One manifest of one-liners, keyed by callout id; the seen set
 * lives in the save (`SaveSettings.calloutsSeen`, optional field — no
 * migration).
 *
 * Ids: a piece's id is its `PieceKind`; a prop's is `prop:<name>` — props
 * register here when the kitchen set's prop modules land later in stage 3
 * (the manifest is per-set by construction: `PROP_CALLOUTS` gets entries
 * from each set's file, exactly like the level registry).
 *
 * Copy rule (§11): short, concrete, never explains what the tray already
 * shows. The line names the PHYSICS job of the piece, because that is the
 * one thing the picture cannot say.
 */
import { PIECE_KINDS, type PieceKind } from '../track/pieces.ts';
import { defaultStorage, loadSave, saveSave, type StorageLike } from '../save/save.ts';

/** One line per kit piece — the piece an unseen line exists for. */
export const PIECE_CALLOUTS: Record<PieceKind, string> = {
  straight: 'Flat deck — it keeps speed, it never adds any.',
  curve: 'A tight turn: carry less speed in or it scrapes the wall.',
  bigCurve: 'The wide turn — the same 90 degrees at a speed you can keep.',
  sbend: 'Two turns that cancel — the line shifts, the heading does not.',
  bank: 'A banked turn: the tilted wall does the steering, not friction.',
  loop: 'Up, over, down — arrive too slow and it drops at the top.',
  drop: 'A gap with a catch ramp — the line crosses where the drop is.',
  ramp: 'Turns height into speed — the engine of every track.',
  gapLip: 'A launch lip sets the angle of the jump, never its speed.',
  landing: 'A sloped catcher — match it to the flight, not to the floor.',
  booster: 'One push, paid from the budget, in the middle of a run.',
  springLauncher: 'A stored shove at the start — a cold car’s engine.',
  finishCup: 'Roll in and the run is scored: this is the finish.',
};

/** Prop callouts, keyed by full id (`prop:<name>`), registered by each set's
 * prop module when it lands. */
export const PROP_CALLOUTS: Record<string, string> = {};

/** The callout text for an id (a piece kind or `prop:<name>`), or undefined. */
export function calloutText(id: string): string | undefined {
  if (id in PROP_CALLOUTS) return PROP_CALLOUTS[id];
  return (PIECE_CALLOUTS as Record<string, string>)[id];
}

/** The whole manifest in list order: pieces in kit order, then props. */
export function calloutManifest(): { id: string; text: string }[] {
  return [
    ...PIECE_KINDS.map((k) => ({ id: k as string, text: PIECE_CALLOUTS[k] })),
    ...Object.entries(PROP_CALLOUTS).map(([id, text]) => ({ id, text })),
  ];
}

// ---- seen tracking (save-backed) ---------------------------------------------

export function seenCallouts(store: StorageLike | null = defaultStorage()): string[] {
  return loadSave(store).settings.calloutsSeen ?? [];
}

export function markCalloutSeen(id: string, store: StorageLike | null = defaultStorage()): void {
  const data = loadSave(store);
  const seen = data.settings.calloutsSeen ?? [];
  if (seen.includes(id)) return;
  data.settings.calloutsSeen = [...seen, id];
  saveSave(data, store);
}

/**
 * The callout line for `id` IF the player has not seen it yet — and records
 * it as seen. The shell's whole callout API:
 * `const line = firstSight('loop'); if (line) calloutLine.textContent = line`.
 */
export function firstSight(id: string, store: StorageLike | null = defaultStorage()): string | null {
  const text = calloutText(id);
  if (text === undefined) return null;
  if (seenCallouts(store).includes(id)) return null;
  markCalloutSeen(id, store);
  return text;
}

/**
 * The same once-ever discipline for a NON-piece teaching line the caller
 * supplies (the level's star-rules one-liner, playtest N: "teaching
 * precedes failure"). The seen set is shared with the piece callouts under
 * a namespaced id (`rules:<levelId>`), so the save shape does not move.
 */
export function firstLesson(id: string, text: string, store: StorageLike | null = defaultStorage()): string | null {
  if (seenCallouts(store).includes(id)) return null;
  markCalloutSeen(id, store);
  return text;
}
