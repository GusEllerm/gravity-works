---
livedocs: snapshot
tags: [session, stage-5, environment-artist]
---
# 2026-10-09 Stage 5 — the porch, ported to the production set

> [!abstract] Role
> Environment Artist ports the RATIFIED PORCH variant A (sunday morning, 15/15, `Reference/Review
> 2026-10-09 porch judging.md`) out of the throwaway exploration (`src/dev/scenes/porch.ts` porch-a,
> `origin/stage5-porch-explore` f252dcb) into the production set registry on branch `stage5-porch-set`.
> No levels — the ladder crew follows this set.

## Ground

Main at 371e9c4 (porch judging). The port is a migration, not a redesign: every number below is the
exploration's unless a judging port condition moved it. The light regime is the garden's, ported
indoors-by-half — `SUN` is a low (~14°) WARM directional key (`keyColor: '#FFE3B8'`, never the indoor
lamp key) and the flat `SKY` is the fill through `createLightingRig({ sky: SKY, … })` — plus the porch's
ONE addition, `porchFillFromRig`: `SHADOW_TINT_SKY_LIFT` 0.85, the exploration's round-3 finding
promoted from a scene-local override to set data (cast shade is a big soft share of this frame and the
rig's deepened-sky tint at census depth files in the BLACKISH channel-spread band). **No new shader
features shipped**: the weave is cast geometry, and the floor camera rides the existing
`fillShadeDepth`/`fillFromRig` vocabulary exactly as the garden round 1 did.

## What shipped

- `src/sets/porch/data.ts` + `src/sets/porch/index.ts` — the SetInstance (deck, house wall with flush
  clapboard seams, the door assembly with the CASTING 6 mm screen weave, no-cast ceiling, rails, flush
  stoam, downspout + deck-height gutter flume with its trickle, chime, dark lantern, two geranium
  planters, the resized sneakers, the doormat band). `PORCH_SET` is exported from `src/sets/index.ts`
  and mounted as `SETS.porch`; `porchSetPlacement` ships an EMPTY table (canonical-origin fallback).
- `src/dev/scenes/porch-set.ts` + the `'porch-set'` row in `src/dev/cameras.ts` — the set's own
  canonical rigs sourced from `CAMERAS` in the set data. The establishing row copies the PROVISIONAL
  kitchen numbers VERBATIM (the ratified establishing-a was shot through them; parity is proven below);
  the hero/floor rows are the new porch framings (port condition 6 — the hero RE-AIMED at the
  door-mouth + step: it stands past the stoam and looks back through the rail's step-break at the
  threshold, the lane running at the camera). The floor rig lives 45 mm over the 5 mm deck (the 35 mm
  law) looking up the lane into the door mouth.
- `tests/e2e/porch-set.spec.ts` — 3/3 green (E2E_PORT 4340).
- Frames at 1600×900 post-ON via `node tools/render.mjs` (ports 4340–4341, one build tree):
  `docs/explorations/porch/production-build.png` (establishing), `production-hero.png`,
  `production-low.png`.

## Parity deltas vs ratified A (the honest list)

1. The sneakers are RESIZED (0.62×; must-not-lose 4 — at the exploration's 30 mm they read as bricks
   at build camera; the scale joke now lands in the floor frame).
2. The hero rig is RE-AIMED (must-not-lose 6): the ratified hero-a framed decks; production-hero frames
   door-mouth + weave + lane + step-break in one story composition. Its census medTone is 155 against
   the ratified hero's 131 — the composition spends more sunlit wall, still inside the room's ratified
   131–155 high-key range.
3. The establishing frame is the ratified camera re-shot: census agrees — medTone 152, darks 0.000 %,
   blackish 0.000 %, blown 0.001 %, identical to establishing-a's row.
4. Everything else is carry-through: the weave parallelogram (must-not-lose 1) incl. the sky-lifted
   shadow tint (AD note-2 lineage), the in-band amber pair geraniums + doormat band (AD-2), the deck-
   height flume with its drip line, the warm planks.

## Census (`tools/census.mjs`, 1600×900)

| frame | px | dark<60 % | tinted % | blackish % | blown ≥243 % | outlier % | medTone |
|---|---:|---:|---:|---:|---:|---:|---:|
| production-build | 1 440 000 | 0.000 | 0.000 | 0.000 | 0.001 | 0.001 | 152 |
| production-hero | 1 440 000 | 0.003 | 0.000 | 0.003 | 0.001 | 0.004 | 155 |
| production-low | 1 440 000 | 0.001 | 0.000 | 0.001 | 0.000 | 0.078 | 134 |

No frame blows; blackish sits at ≤ 0.003 % (≈ 40 px of hall-pocket occlusion in the two re-aimed
frames, zero in the parity frame) — the sky-lift did its job; A stays a census-high-key room that
refuses soot.

## What the ladder crew gets

- Sockets `door.in` / `door.out` (the threshold pair, drawer/pipe convention) and `step.out` (the
  deck→yard seam at the stoam) — `PORCH_SOCKET_FRAMES`, all inside the `DECK` disc (r 0.62 at (0, 0.05),
  `DECK_Y` = 5 mm flush).
- A guard split that keeps the corridor buildable: door assembly + flume + stoam are SHELL (non-solid —
  a line may run through the door mouth and across the flume as the garden lane crosses the gravel);
  rails/posts/downspout/chime/lantern/planters/shoes are DRESS solids.
- `HAZARDS` ships EMPTY by ratification — the weave shadow is read-only rhythm and the flume trickle
  is a timing tell; a drown-off slick would be a level-authored `wetPatch` (bathroom ask #6 shape).
- Fixtures: the set carries the ROOM; built-in piece quotas stay per-level `fixtures` data through
  `fixtureQuota` like every other room. Placement rows are per-rung (`PORCH_ROWS`), yaw 0 recommended
  — the weave must keep crossing the lane exactly as ratified, so the room never rotates for a level.
- Callouts `prop:weaveShadow` / `prop:gutterFlume` are registered; the chime pendulum stays a Feel ask.

## Gates

- `npm run typecheck` clean; `npm run build` clean; vitest 606/606 (34 files — the registry row moves
  nothing: no rung references the porch and `boot-invariants` is untouched by an empty placement table).
- `E2E_PORT=4340 npx playwright test tests/e2e/porch-set.spec.ts` — 3/3 (kitchen01 unchanged, the
  harness post-ON with zero console errors, `?set=porch` mounting).
- Renders on ports 4340–4341 through the e2e's build tree.

## Session snapshot

The sixth room is the studio's first port with a BYTE-COMPARABLE claim: the ratified build camera, the
ratified census row, and the judge's must-not-lose list all read off one render command. The weave
parallelogram — the first key light in the house that IS a prop — survives the migration exactly as the
garden's trellis bars did, because the port changed the light's ADDRESS (data.ts), not its physics.
livedocs: this note is a snapshot of a tree whose engine code it does not change; the code it mentions
is the set it ships with.
