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

/** Toy-plastic deck friction (Coulomb, Rapier collider friction coefficient). */
export const TRACK_FRICTION = 0.05;
