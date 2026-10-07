/**
 * Shared track-surface material constants — the single home both the game
 * world (`src/world/world.ts`) and the headless feel rigs
 * (`src/feel/kittrack.ts`) import, so the game and every measured number
 * drive the SAME rubber. (Stage-2 review MAJOR: this value used to be two
 * exported `TRACK_FRICTION` constants — 0.6 in world, 0.05 in the rigs —
 * with a comment claiming they matched. 0.05 is the value every published
 * metric was produced with; nothing contacts the deck differently today,
 * so unifying at 0.05 changes no measured number.)
 */

import { GLOBAL_TOKENS, lighten } from '../render/tokens.ts';

/** Toy-plastic deck friction (Coulomb, Rapier collider friction coefficient). */
export const TRACK_FRICTION = 0.05;

/**
 * The FIXTURE READABILITY SIGNAL (stage 4, playtest Q handoff): pre-placed
 * fixture pieces read as scenery when they wear exactly what decorative
 * plastic wears. Every fixture piece's materials therefore carry ONE shared,
 * checkable mark: a `userData` flag (this object's `key`) plus a narrow deck
 * inlay stripe drawn along the piece's centreline by `buildTrackMeshes`
 * (`src/world/world.ts`). It is deliberately NOT a repaint — the deck keeps
 * the brand's never-re-hued track orange (Art Bible §Color) and the inlay is
 * the same hue family lifted in lightness only, so the signal cannot fight a
 * room palette. The flag is render-side data derived from the level's
 * `fixtures` table (the same occurrence quota `initialBuild` mounts with —
 * `fixtureQuota` in `src/track/build.ts`); `PlacedPiece` and `serialize` are
 * untouched, so every build hash and par is unchanged by construction.
 */
export const FIXTURE_SIGNAL = {
  /** The `Material.userData` key every fixture-piece material carries. */
  key: 'fixtureSignal',
  /** The inlay stripe: track orange lifted 18 % lightness (saturation pulled
   *  with it by `lighten`), so it reads as a lit lane line IN the orange
   *  deck — clearly above the deck tone, still below the blown-high bar. */
  inlayColor: lighten(GLOBAL_TOKENS.trackOrange, 0.18),
} as const;
