---
tags: [module]
---
# src/sets (the set registry + the production bedroom set)

> [!abstract] Role
> The stage-4 generalization of the stage-3 kitchen wiring: `src/sets/index.ts` resolves a set id to its builder, tokens, and per-level mount, so every later set (garden, garage, porch) mounts by data instead of by a new code path. Also the home note of the PRODUCTION bedroom set — variant B, lamp-lit dusk hardwood, ratified 13/13 at both canonical cameras — with the three mid-distance story props that answer the AD's "no single prop carries the frame" caveat.

## The SetInstance surface

`SETS` maps `"kitchen"` / `"bedroom"` (later: more) to a `SetRegistration`: `tokens`, `build(T, opts)` → `SetInstance`, and `placement(levelId)` → the mount transform (null = canonical origin). `SetInstance` is the kitchen's stage-3 export shape normalized: `{ group, sockets, hazardZones, bounds, staging }` — solid boxes for the builder guard are collected from the named props by the walker in `src/boot.ts`, sockets are named snap frames, `hazardZones` is plain data in the level hazard shape, `bounds` is the floor surface every socket/hazard must live inside.

The naming convention the guard depends on (documented at BOTH ends — `src/sets/index.ts` and `collectSetBoxes` in `src/boot.ts`): props live under a group named `dress`, the non-solid floor/wall shell lives OUTSIDE it (the kitchen's named `counter`, the bedroom's named `shell`), and anything named `*film*` is never a solid. A set that renames `dress` silently mounts invisible to the placement guard — this is the registry's sharpest edge and the friction named for the next three mounts.

Adapters kept honest: the kitchen's floor surface is named `counter` and its placement table is `kitchenSetPlacement` — the registry's kitchen row is the one translation (`counter` → `bounds`); the bedroom row places null until a bedroom level exists, at which point a placement row is data, not code.

## The bedroom set

`src/sets/bedroom/data.ts` is the pure-numbers half (no three import), migrated from the ratified exploration `src/dev/scenes/bedroom.ts` (variant B): `FLOOR` + `insideFloor`, `CARD_GAP` (a 0.856 m credit card at 1:64), `LAMP` (position, `bulb` point, `reach`/`intensity`/`decay` — tuned STEEP and SHORT, see the data note: r186 punctual scale washes a dusk room at gentler falloff), `DESK` (four visible legs + apron — the floating-slab material note, paid), `DRESSER` + `DRAWER_SOCKET_FRAMES` (`drawer.in` / `drawer.out`, bored cabinet, `boreY` hung one `CARD_GAP` under the opening's jaw), `BOOK_PYRAMID` (tiers, book dims, seeded lean), `BED`, `CABLE`, `HOMEWORK` (the lived-in detail moved INTO the floor band), `SEAMS`, `HAZARDS` (empty — variant B ratifies none, but the surface carries the field), `STAGING` (the one decorative run + the still's car parameter).

`buildBedroomSet(THREE, opts)` in `src/sets/bedroom/index.ts` returns `{ group, sockets, hazardZones, floor, staging, lampLight }`. The deliberate deviation from the kitchen's "no lights" contract: **the lamp is a practical** — a `THREE.PointLight` named `lamp-practical` inside the shade at `LAMP.bulb`, so the warm pool is lit, not painted; the render rig's shadow-casting key sits at the same origin (one direction explains every shadow). The shader-side guarantee is the punctual gate in `src/render/toon-material.ts` (see [[render]]): without it, the practical re-adds the key-strength tint everywhere it fails to reach and the frame washes like the stage-3 kitchen.

The three story props (AD caveat, engineered — no single prop carries the frame):

| prop | read | classes |
|---|---|---|
| book pyramid | cover-face + page-edge: a cream PAPER plate standing 1.5 mm proud of each cover (flat, grain 0 — the dither fringe has no grazing grain to live on), rows packed to a 2 mm page seam; one leaning ramp book welded to the deck | painted wood ×2 (cover grain 0.25, pages grain 0) |
| lamp practical | lit pool + ratified long key shadows from the same origin | die-cast brass, ceramic shade, flat glow disc |
| half-open drawer | pulled half out, hung one card under its rail — a card-sized daylight slit over indigo felt, bored cabinet, and a named socket pair for the future tunnel level | painted wood + fabric (felt) + die-cast pull |

plus the ported cable snake (variant A's, facing the track), the bed skirt with a visible mattress edge, dark slat gap and two brass spring coils (withdrawn variant C's spring ask, re-homed where a level can harvest it), the homework inside the floor camera's band, and a lost toy block.

## Canonical renders

`src/dev/scenes/bedroom-set.ts` stages the set (decorative run + the still's bluish-green car, focus on it). Production stills at 1280×720 post-ON (the stage-4 deliverable size; the art bible's 1600×900 still rules canonical reviews — the harness's `size=` param carries the smaller brief): docs/explorations/bedroom/production-hero.png (hero), production-side.png (establishing), production-low.png (floor). Histograms sit on the ratified band (means 136/131/129, ≥243 ≤ 4 %, sub-60 tinted — zero meaningful blackish, the never-list holds).

## Invariants

- The set is a pure function of its inputs; the drawer sockets are derived from `DRESSER` position/yaw/`boreY` so the slit and the frames cannot drift.
- `?set=bedroom` (game shell) and `scene=bedroom-set` (harness) both render without console errors — `tests/e2e/bedroom-set.spec.ts` smokes both plus the kitchen no-regression boot.
- The punctual gate is a directional no-op: every pre-bedroom frame must stay byte-identical (the kitchen's visual baselines are the gate).

## Depends on / used by

Both sets depend on `src/render` read-only. Consumed by `src/boot.ts` (mount, guard solids, camera solids, background, post tokens) and the two staging scenes. Session: `Sessions/2026-10-07 Stage 4 - bedroom set production.md`; kitchen note: [[sets-kitchen]].
