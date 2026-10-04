---
livedocs: snapshot
tags: [session, stage-3, environment-artist]
---
# 2026-10-07 Stage 3 — the production kitchen set

> [!abstract] Role
> Session snapshot for the Environment Artist's stage-3 wave: tile B made permanent inside the material system, with the tile-A keeps installed, the socket/hazard data the levels will consume, canonical renders at post ON, and the set's slice of the frame budget.

## What shipped

- **src/sets/kitchen/** — the set as data + generators. `src/sets/kitchen/data.ts` is the pure-numbers half (no three import): `SET_SCALE`, `COUNTER` + `insideCounter`, `BOWL` / `BOWL_ARC` / `BOWL_SOCKET_FRAMES`, `TAP` with its world `drip` anchor, `HAZARDS.tapSplash`, the decorative `STAGING` runs. `buildKitchenSet(THREE, opts)` in `src/sets/kitchen/index.ts` returns `{ group, sockets, hazardZones, counter, staging }` — pure (two calls, byte-identical geometry).
- **src/dev/scenes/kitchen-set.ts** — registers `kitchen-set`: the set under the lighting rig with the reference's three parked stand-in cars and two decorative runs; `SceneEntry.focus` is the rim car (the `focus=car` URL value parses to null and falls back here — deliberately, that is the car-following band of §7.3).
- **Canonical renders** (post ON, quality high, 1600×900, fixed clock): `docs/explorations/kitchen-set/establishing.png`, `hero.png`, `floor.png`.
- **tests/unit/kitchen-set.test.ts** — purity hash, socket/hazard finiteness + counter bounds, the rim-arc convention checked against the L03 bank constants and the kit's tangent frame (including "the mesh passes through both socket poses" via the real transform graph), the L04 hazard-shape/numbers cross-check, and the budget caps. Full suite 194/194, e2e 12/12 at the final commit.

## Prop inventory → material class

Counter floor + splashback painted wood (`grainScale` 0.05, the TA's big-surface frequency) · cereal bowl ceramic (DoubleSide, warm shade band — the tile-B lathe profile) · milk liquid / cereal rings fabric (instanced) · book stack + ramp book painted wood (cream cover = paper read at low grain) · pencils ×2 die-cast shaft / wood tip / fabric lead / ceramic eraser · tap die-cast, frozen drip liquid · wet patch + hazard-radius spread + splash crown + mug ring FILM (`stainDecal`, never cutout geometry) · mug ceramic + coffee liquid · bitten toast painted wood ×2 · crumb trail painted wood instanced ×16 (seeded LCG) · sugar-cube supports (tile-A keep) instanced ×5 — four pressing under the ramp run, one fallen by the toast · cereal-box cliff (tile-A keep) painted wood + ceramic mint band, up-left rear where it catches the tap's long shadow · folded cloth fabric (mint) · **teaspoon** (my added lived-in detail, rubric line 7) die-cast, laid beside the mug ring pointing at the toast.

## Rubric self-scores (honest; the AD re-scores)

| line | establishing | hero | floor |
|---|---:|---:|---:|
| 1 silhouette | 2 | 2 | 2 |
| 2 focal point | 2 | 2 | 2 |
| 3 scale cues | 2 | 2 | 2 |
| 4 color | 2 | 2 | 2 |
| 5 light | 2 | 2 | 2 |
| 6 material | 2 | 2 | **1** |
| 7 story | 2 | 2 | **1** |
| 8 nothing default | 2 | 2 | 2 |
| **total** | **16** | **16** | **13** |

Honesty notes: the floor shot's bowl outer is blown white (the TA's own standing flag — the value range matches the reference's floor frame, but matching a weakness is still a weakness; a scene-side bowl-band trim is a one-line change if the AD calls it); floor story is thin by construction — it frames the bowl, not the debris. The establishing's cereal-box cliff is the largest saturated mass after the bowl — if it reads as fighting, it moves back-left, not down.

## Budget (this set vs the TA's tile-B-integrated table)

Set alone: **39 draw calls, ~16.7k triangles**, 3 instanced meshes (cubes, crumbs, rings); staged for the canonical renders (3 stand-in cars + 2 runs): **~59 draws**. Statics are grouped per prop, not cross-prop merged — props keep their own transforms so the socket wiring never unmerges a mesh; at <60 draws a merge would buy nothing measurable and cost the sockets story.

`perf=24` probe on this scene, establishing, Apple M5 Pro headless Chromium — **SwiftShader (software GL), same caveats as the TA table, single-digit confidence ±20 %** (parallel agents were on the box): 1600×900 post high **block median 48.2 ms** (reference scene: 51.7); 960×540 post high **23.8 ms** (reference: 25.0), post medium 23.4, rAF pinned 33.3 at high. The set is inside ±10 % of the tile-B-integrated frame cost at every tier — within the TA's existing budget envelope; no drop ordered. The post-off 53.1 ms row is measurement noise from a contended machine (it exceeds its own post-on row); the post-on rows and the 960×540 rows are the ones to trust.

## Decisions

- **[environment artist] The bowl grew 18 % to obey the socket convention.** `Concepts/Levels` says the artist's mesh is built TO the rim numbers (radius 0.12, 120°, flat sockets at the kit's tangent frame); the reference bowl's rim centreline was 0.101. The lathe profile (exact tile-B curve) is scaled so the rim crown's mid-wall circle lands on 0.12 exactly — profile shape unchanged, silhouette slightly wider. Alternatives: fake sockets off a smaller bowl (mesh wouldn't pass through the poses — the convention's whole point) or scaling only the rim (breaks the profile). The rim arc runs bowl.in(45°) → bowl.out(−75°) with travel (sin a, 0, −cos a), reproducing the level-derived L03 poses' tangent convention sign-for-sign; the hero's rim car faces the reference's direction (parked, not committed).
- **[environment artist] The wet-patch film now has three layers.** The dense 0.045 core is the reference's patch untouched; a wide low-alpha film reaches the full 0.14 hazard radius so the DATA and the pixels agree on how big the splash is; the splash crown stays the drip's frozen tell. Alternative rejected: shrinking the hazard radius to the visible puddle (the L04 number is the level designer's, not mine).
- **[environment artist] Sockets/hazards are exported in the level's own shapes** (`Socket`-shaped frames, the `WetPatch` record) so wiring is an import, not an adapter; the tap position and the hazard centre are derived from one constant (`TAP.drip`), so they cannot drift.
- **[environment artist] Decorative runs + cars stayed out of the set** (they live in the dev scene): the built track is the kit, the cars are the car system's. The set exports only the run midpoints the sugar cubes lean on.
- **[environment artist] Mug pulled 1.5 cm into frame** (0.24→0.225 x, 0.05→0.062 z) with the toast soldier following it: the production hero camera frames a wider bowl than the tile's, and the reference's "soldier leaning on the mug" read as a floating slab when the mug slid off-frame. The ring film stayed where the reference put it.

## Carry-ins / for the Art Director and the Systems Engineer

- The set is the first code under `src/sets/` — `Modules/sets-kitchen.md` is new; `Modules/src.md` / `Modules/dev.md` roster lines updated with it.
- **Wiring asks (Systems Engineer, as briefed):** the kitchen levels consume `sockets` + `hazardZones` from `buildKitchenSet`; L03's bowl sits wherever the set puts the bowl, so a future bank piece seats by importing `sockets['bowl.in']`/`['bowl.out']` instead of re-deriving from the fixture chain; L04's tap hazard is `hazardZones.tapSplash` (same shape and numbers as its authored entry). The level chains currently start at the world origin and the set is a canonical layout — prop placement per level is the SE's call; the data is position-complete for it.
- **Book-stack height note:** the levels' start `ramp` fixtures drop 0.22–0.30 m; the visible book stack decks ~0.08 m. If the SE wants the prop to carry the fixture height, stack count is a data edit (`bookStack` covers array) — flagging, not blocking.
- **Process note:** commit `6a1cf52` (a director's conflict-marker dedupe run with `git add -A`) swept this set's work-in-progress files into `main` mid-round, including a pre-fix rim-car render. Everything was re-rendered and re-committed by this session on top; no half-state survives, but the director may want to avoid `add -A` while other roles are live in the same worktree.
