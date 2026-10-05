---
livedocs: snapshot
tags: [session, stage-4, environment-artist]
---
# 2026-10-07 Stage 4 — the production bedroom set

> [!abstract] Role
> Session snapshot for the Environment Artist's stage-4 wave: the RATIFIED bedroom variant B (lamp-lit dusk hardwood, 13/13 at both canonical cameras) migrated from the throwaway exploration into a production set, the kitchen's set architecture generalized into a registry the next three sets will reuse, and the AD's one-prop caveat engineered away with three readable mid-distance story props.

## Ground

Started by fast-forwarding `main` to the stage-4 exploration branch (`161fe4b`) — main was a strict ancestor; the ratified review note and the exploration code are the inputs this wave reads.

## What shipped

- **src/sets/index.ts** — the SET REGISTRY. `SETS` resolves id → `{ tokens, build, placement }`; the `SetInstance` surface is the kitchen's stage-3 shape normalized (`{ group, sockets, hazardZones, bounds, staging }`), with the kitchen's `counter` adapted to `bounds` in the registry row (the only translation). The builder-guard walker in `boot.ts` identifies the dress by the NAME `dress` and the non-solid shell by name (`counter`/`shell`) — a naming convention, documented at both ends; it is the registry's sharpest edge for the next three mounts.
- **src/sets/bedroom/** — the set, data + generators, mirroring the kitchen's architecture. `data.ts` (no three import): `FLOOR`+`insideFloor`, `CARD_GAP` (a credit card at 1:64), `LAMP` with the `bulb` point and steep/short practical falloff, `DESK` (4 legs + apron), `DRESSER` + `DRAWER_SOCKET_FRAMES` (`drawer.in`/`drawer.out`), `BOOK_PYRAMID`, `BED`, `CABLE`, `HOMEWORK`, `SEAMS`, empty `HAZARDS` (variant B ratifies none; the surface carries the field anyway), `STAGING`. `buildBedroomSet(THREE, opts)` returns the SetInstance plus `lampLight`.
- **src/boot.ts** — mounts through the registry; `?set=<id>` is the game-shell dev entry (renders the bedroom through any level's physics); the warm frame, mounted background and post tokens read the registration's tokens (kitchen unchanged as fallback); `data-set-mounted` now carries the SET id (kitchen value unchanged).
- **src/dev/scenes/bedroom-set.ts** — the staging scene (dusk rig key at the lamp bulb, decorative run, the still's bluish-green car).
- **src/render/toon-material.ts** — the punctual gate. `#include <lights_fragment_begin>` replaced by a verbatim copy of its point/directional sections that flips a flag around `RE_Direct_Toon`; for punctual lights the BRDF adds `directLight.color` only, never the key's shadow-tint term. Without this a mounted PointLight re-adds a key-strength tinted fill wherever it can't reach — the stage-3 wash returns the moment a practical is installed (measured: +80 mean luma, 44 % blown). Directional-only scenes take identical math (kitchen visual baselines gate that).
- **tests/e2e/bedroom-set.spec.ts** — the smoke: kitchen01 boots unchanged through the registry (no regression), `scene=bedroom-set` renders post-ON with zero console errors (the punctual variant compiles here and nowhere else), `?set=bedroom` mounts the bedroom in the game shell.

## The three story props (no single prop carries the frame)

1. **Book pyramid with visible page bands** — each book a cover block (grain 0.25, down from the exploration's 0.45 — TA-1 mitigation) plus a cream paper PLATE standing 1.5 mm proud of the cover silhouette (grain 0: the fringe has no grazing grain to live on; a plate INSIDE the beveled cover pokes its corners through — the checkerboard-cube misread caught in review renders). Rows packed to a 2 mm page seam; one leaning ramp book welded to the deck.
2. **Lamp practical** — a real `THREE.PointLight` inside the shade at `LAMP.bulb` (`intensity` 0.1, `decay` 2.4, `reach` 0.6 m; r186 punctual scale has no 4π normalization and gentler falloff washed the room), the rig's shadow-casting key at the same origin so one direction explains every shadow.
3. **Half-open drawer** — dresser pulled half out, hung one `CARD_GAP` under the opening's jaw: a card-sized daylight slit over indigo felt, bored cabinet, and the named `drawer.in`/`drawer.out` socket pair for the future tunnel level.
   Ported: the cable snake facing the track; the bed skirt now carries a mattress edge + dark slat gap + two brass spring coils (variant C's spring ask re-homed per the AD); the homework moved INTO the floor camera's band (the stage-3 carry-forward); the desk grew four visible legs and apron rails (the floating-slab material note).

## Renders (1280×720, post ON, fixed clock)

- `docs/explorations/bedroom/production-hero.png` — shot `hero` — mean 136, p5 51, ≥243 4.0 %, sub-60 7.7 %
- `docs/explorations/bedroom/production-side.png` — shot `establishing` — mean 131, p5 70, ≥243 1.9 %, sub-60 3.9 %
- `docs/explorations/bedroom/production-low.png` — shot `floor` — mean 129, p5 55, ≥243 2.0 %, sub-60 6.3 %

Ratified hero-b's band for comparison: mean 126, p5 60, sub-60 4.9 %. Blackish audit (<60 luma, channel spread <16): hero 4 px / side 0 px / low 24 px of 921 600 — the fix pass lightened the felt/slat base colors from `darken(dominant, 0.55)` to `0.35`, because a near-black BASE color turns black under fill-only illumination in the gaps; the never-list wants dark BUILT BY LIGHT, not painted in the albedo. The `size=1280x720` param the harness marks "perf-probe only" is what carries the stage-4 deliverable size — flagged as harness-contract friction (§5.8 fixes 1600×900 for canonical renders; a per-brief size parameter should become a first-class flag).

## Contract friction in the SetInstance surface (for the next three mounts)

- **Naming as contract**: the guard collects from a group named `dress` and skips shells by NAME (`counter`, `shell`, `*film*`). A set that names things differently is silently invisible to the placement guard. Should become `userData` flags on the SetInstance.
- **`bounds` vs `counter` vs `floor`**: normalized in the registry, but each set's data module keeps its own name; `insideCounter`/`insideFloor` are per-set functions the registry cannot name-normalize.
- **Empty fields are still contract**: a hazard-free set must still export the `hazardZones` shape; fine, but the type should allow omission.
- **Lights are not on the surface**: the bedroom returns `lampLight` OUT OF BAND because the kitchen's "set contains no lights" clause has no place for a practical; the registry should carry an optional `lights` list so the garden firefly and porch lantern don't each invent their own field.
- **`placement(levelId)` returning null = "canonical origin"** conflates "no levels yet" with "mount at origin"; the first garden level will want a table row, which is at least data.

## Gates

`npm run typecheck` clean; `vitest` 259/259; `npm run test:e2e` per final commit (report below).
