---
livedocs: snapshot
tags: [session, stage-4, environment-artist]
---
# 2026-10-08 Stage 4 — the production garden set, finished

> [!abstract] Role
> Finish pass on main for the Environment Artist's garden wave: the committed production set (194dbbc) gets its
> three canonical renders, the census evidence paragraph the AD's verdict asked for, and a green e2e. No set
> code changed — this session only proves it.

## Ground

Main at 194dbbc (set, lighting regime, registry row, dev scene, spec). The AD ratified variant B — golden-hour
paving, 13/13 both exploration cameras, no send-back — with six carry-forwards (Reference/Review 2026-10-08
Stage 4 garden.md). The garage agent works in parallel in src/sets/garage; nothing here touches it.

## What shipped (this finish)

- **Canonical renders** — the garden's own camera row (CAMERAS in src/sets/garden/data.ts, copied through
  src/dev/cameras.ts) shot through `?harness=1&scene=garden-set` with `post=on size=1280x720`:
  docs/explorations/garden/production-hero.png (shot hero — the ratified composition: sun disc AND trellis
  shadow bars in one frame), docs/explorations/garden/production-side.png (shot establishing),
  docs/explorations/garden/production-low.png (shot floor, 35 mm over the flush deck).
- **Census round 2** — node tools/census.mjs on the three frames, recorded in a round-2 paragraph of
  docs/explorations/garden/Concept.md: blackish 0.000 % and blown 0.000 % in all three (never-list holds),
  and the census darks measure blue-above-red (48,58,19 / 50,59,20) where the ratified hero-b darks measured
  warm olive with blue lowest — the sky-derived shadow tint the AD's note 2 demanded is now in the pixels
  via `sky: SKY` in the scene's createLightingRig call.

## Carry-forwards, verified in the renders

All six of the AD's must-not-lose items are in src/sets/garden as committed: off-axis dark-reading pipe mouth
(floors shows the bore as a hole), snail with a three-whorl spiral on the deck, joint moss at named crossings
(chartreuse clumps resolve at hero), galvanized can + die-cast pipe collar, trellis post feet, and the set-side
camera row. The one honest delta from the ratified stills: the floor frame has no census sub-60 pixels at all —
long shadows on bright stone under sky fill stay high-key by illumination; the bars still read.

## Gates

- tests/e2e/garden-set.spec.ts — 3/3 green (E2E_PORT 4220): kitchen01 unchanged through the garden registry
  row, the harness scene post-ON with zero console errors, `?set=garden` mounting in the game shell.
- npm run typecheck clean; vitest 399/399 (27 files).
- Renders via node tools/render.mjs on ports 4221–4223 against the e2e's build (byte-identical tree, no code
  edits this session).

## Session snapshot

First outdoor set's production frames are evidence, not just art: the two claims the studio never could
measure indoors — tinted-not-black darks and now sky-derived-not-dominant tint — both read off a census line.
The `size=` param is still the perf-probe-only escape hatch carrying the stage-4 deliverable size (bedroom's
harness-friction flag stands). livedocs: this note is a snapshot of a tree whose set code it does not change.
