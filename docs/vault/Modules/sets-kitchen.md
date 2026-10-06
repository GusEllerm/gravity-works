---
tags: [module]
---
# src/sets/kitchen (the production kitchen set)

> [!abstract] Role
> The hero set as data + generators: the counter floor, the monumental cereal bowl (the banked turn), the book-stack ramp, the dripping tap over its wet patch, and the lived-in debris of breakfast — built to the chosen tile-B reference with the tile-A keeps, inside the material system and never touching it. Owns: prop geometry, the bowl rim sockets, the wet-patch hazard data. Not: lights (lighting rig), cars, track pieces, materials.

## What it does

`src/sets/kitchen/data.ts` is the set as pure numbers (no three import — Node-testable bytes): `SET_SCALE` (the tile's 1.06 dress scale baked into world constants), `COUNTER` (the round warm-wood bounds every socket and hazard is tested against, via `insideCounter`), `BOWL` + `BOWL_RIM_RADIUS` + `BOWL_ARC` + `BOWL_SOCKET_FRAMES` (`bowl.in` / `bowl.out`), `TAP` (with the world `drip` anchor), `HAZARDS` (the `tapSplash` wet patch in the exact `WetPatch` shape `KitchenLevel.hazards` consumes), and `STAGING` (the two decorative orange runs — the ramp run's `b` end GROUNDED at counter level after the stage-3 review flagged a floating end-cap with a detached shadow — plus the rim-car still angle documenting where the canonical renders park it: AT the `bowl.out` socket on the crown, level, no bank, since a banked centreline pose drove the body through the ceramic; never sockets, never built by the game). The bowl profile carries one deliberate deviation from the tile: the lathe is scaled so the rim crown's mid-wall circle lands exactly on the L03 bank radius (0.12), because Concepts/Levels says the artist's mesh is built TO the socket numbers — the reference bowl (~0.104) was ~15 % narrower.

`buildKitchenSet(THREE, opts)` in `src/sets/kitchen/index.ts` returns `{ group, sockets, hazardZones, counter, staging }` — a pure function (two calls, byte-identical geometry; hash-tested), no lights, no cars, no time reads. `opts` takes `tokens` and a `LightingRig`; with a rig the materials ride its fill bands and `applyKeyLight` is called on the group. The prop inventory and each prop's material class:

| prop | class(es) |
|---|---|
| counter floor + splashback | painted wood (`grainScale` 0.05 — the big-surface frequency) |
| cereal bowl | ceramic (DoubleSide, warm shade band) |
| milk / cereal rings | liquid / fabric (rings instanced) |
| book stack + ramp book | painted wood (cream cover = the paper read, low grain; the terracotta spine is out of the track's orange hue family — putty now, track orange reserved for track-plastic) |
| pencils ×2 (ramp shim + lazy) | die-cast toy shaft, wood tip, fabric lead, ceramic eraser |
| tap + frozen drip | die-cast paint / liquid |
| wet patch + spread + splash crown + mug ring | FILM (`stainDecal`, never cutout geometry); the spread film reaches the full 0.14 hazard radius at low alpha; the mug ring sits at the mug's flank in espresso brown so it reads as a stain, not a standing washer |
| mug + coffee | ceramic / liquid (coffee a deep brown liquid tone, not grey; mug yawed so the handle leaves the canonical sightlines) |
| bitten toast soldier | painted wood ×2 (crumb-colour bite patch) — LEANING on the mug flank, bottom edge grounded (the stage-3 contact fix) |
| crumb trail | painted wood, `InstancedMesh` ×16, seeded LCG |
| sugar-cube supports (tile-A keep) | painted wood, `InstancedMesh` ×5 — a stack pressing under the ramp run (reads `STAGING.trackRuns[0]`), one fallen by the toast |
| cereal-box cliff (tile-A keep) | painted wood carton + ceramic mint band, up-left rear where it catches the tap's long shadow |
| folded cloth | fabric (the mint accent) |
| teaspoon (the new lived-in detail) | die-cast paint, laid beside the mug ring pointing at the toast |

Budget: 39 draw calls, ~16.7k triangles set-only (instanced repeats: cubes, crumbs, rings); ~59 draws staged with the render scene's three stand-in cars and two runs. Statics are merged by prop group, not cross-prop — props keep their own transforms so future socket wiring never has to unmerge a mesh.

## Invariants

- The rim mesh passes through both socket poses, the arc is planar at radius `BOWL_RIM_RADIUS`, swept 120° with flat unbanked sockets, and the tangent frame matches the kit's (tangent = up × radius) — checked against `KITCHEN03_BOWL`'s numbers, not prose.
- The `tapSplash` zone is the L04 hazard shape with the L04 numbers (`radius` 0.14, `gripFactor` 0.5, `source` "tap"), centred exactly under the frozen drip's world position, and inside the counter bounds; `World` reads grip fields per the stage-3 hazard wiring, so this data is what a level hands it.
- Everything is deterministic: seeded LCGs only, fixed clock, no wall time.

Guarded by `tests/unit/kitchen-set.test.ts` (purity hash, socket/hazard finiteness + bounds, the rim-arc convention vs the level constants, mesh-through-sockets, budget caps).

## Depends on / used by

Depends on `src/render` (materials, geometry, film, lighting, tokens) read-only. Used by `src/dev/scenes/kitchen-set.ts` (canonical renders) and, from the stage-3 wiring onward, by the kitchen level files for `sockets` / `hazardZones`, and by `src/world/setPlacement.ts` / `src/boot.ts` for the per-level MOUNT. Honest amendment (2026-10-07): the set is now actually PLACED — per level, via `kitchenSetPlacement`; the export geometry itself is untouched. In particular the tap↔L04-zone reconciliation happened in the MOUNT (kitchen04 yaws the set so `TAP.drip` lands over the authored zone), not in `data.ts` — the `tapSplash` invariant above still holds verbatim. Stage-4 amendment (2026-10-07): `src/boot.ts` no longer imports the kitchen directly — it mounts through the registry in `src/sets/index.ts` ([[sets]]), whose kitchen row wraps `buildKitchenSet` and calls `kitchenSetPlacement` verbatim (the counter surface is merely renamed `bounds` at the boundary); no kitchen number moved. Bathroom-pass amendment (2026-10-08): the registry grew a `bathroom` row and `src/boot.ts`/`src/world/setPlacement.ts` grew its imports and table — nothing kitchen moved: the kitchen row, mount rows, and socket/hazard exports are byte-identical through the pass (`tests/unit/set-wiring.test.ts` still re-derives every kitchen literal, and the `pars.json` regeneration diff is pure-addition — no kitchen or bedroom cell moved). Garden-pass amendment (2026-10-08): the registry garden row flipped from its documented `placement: () => null` to `gardenSetPlacement` and `src/boot.ts`/`scripts/gen-pars.mjs` grew the four garden imports — nothing kitchen moved again (`pars.json` pure-addition; the set-wiring re-derivation still passes on every kitchen literal). Session: `Sessions/2026-10-07 Stage 3 - kitchen set.md`; wiring session: `Sessions/2026-10-07 Stage 3 - level set wiring.md`.
