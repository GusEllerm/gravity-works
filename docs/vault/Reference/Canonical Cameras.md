---
tags: [reference]
---
# Canonical Cameras

> [!abstract] Role
> The fixed review cameras. Every render review and every visual-regression baseline is taken through these — never an ad-hoc camera.

## Convention

- **1600×900, device pixel ratio 1.**
- **Deterministic**: fixed time of day, fixed ambient-motion phase, no animation running during the capture (harness drives a fixed clock).
- Each set defines its three cameras **in its level file**; until then the provisional kitchen framings live in `src/dev/cameras.ts`. Stage 2 grew one level (`feeltrack`), but it is a kitchen-neutral test track, so no level file has claimed the framings yet — moving them is a stage-3 job with the kitchen set.

## The three shots (every set)

| Shot | Frames | Purpose |
|---|---|---|
| `establishing` | whole set, the track line visible | layout reads; lighting direction visible |
| `hero` | the set's signature affordance in use | the money shot; rubric focal-point check |
| `floor` | low, close, a car inside the tilt-shift focus band | scale and miniature cues |

Plus one system-level shot for material review:

| Shot | Frames | Purpose |
|---|---|---|
| `material-review` | three neutral test props (die-cast beveled car with stripe, lathe bowl, orange track segment) on a neutral set floor | ramp/material comparison only |

## Current numbers (verbatim from `src/dev/cameras.ts`)

| Shot | position | target | fov | near / far |
|---|---|---|---|---|
| `establishing` | 0.62, 0.42, 0.78 | 0, 0.05, 0 | 35° | 0.01 / 12 |
| `hero` | 0.3, 0.15, 0.36 | 0.02, 0.05, −0.02 | 35° | 0.01 / 12 |
| `floor` | 0.16, 0.035, 0.26 | 0.0, 0.04, 0.0 | 35° | 0.005 / 12 |
| `material-review` | 0.16, 0.145, 0.5 | 0, 0.028, 0.01 | 30° | 0.008 / 12 |

All in world metres at 1:64 set scale; `RENDER_WIDTH` 1600 × `RENDER_HEIGHT`
900 @ `RENDER_DPR` 1 are exported from the same file and the harness sizes the
renderer and its `readPixels` buffer with them. `canonicalCamera(shot)` is the
only read path, and `isCanonicalShot` gates the `?shot=` URL param — do not
fork these numbers elsewhere.

## Per-set status

- Kitchen (hero set): defined provisionally in `src/dev/cameras.ts` (numbers above); moves into the kitchen level file with the stage-3 art slice.
- Bathroom, bedroom, garden, porch: unassigned — each Environment Artist adds them with their set (stage 4/5).
- Garage: ships a single `establishing` (side) row in `SET_SHOTS` in `src/dev/cameras.ts` (stage 4 production side-rig round, Review 2026-10-09); its hero/floor shots ride the provisional fallback so the ratified stills re-render byte-identical.
