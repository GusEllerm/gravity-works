---
tags: [reference]
---
# Canonical Cameras

> [!abstract] Role
> The fixed review cameras. Every render review and every visual-regression baseline is taken through these — never an ad-hoc camera.

## Convention

- **1600×900, device pixel ratio 1.**
- **Deterministic**: fixed time of day, fixed ambient-motion phase, no animation running during the capture (harness drives a fixed clock).
- Each set defines its three cameras **in its level file**; until levels exist, the provisional kitchen framings live in `src/dev/cameras.ts`.

## The three shots (every set)

| Shot | Frames | Purpose |
|---|---|---|
| `establishing` | whole set, the track line visible | layout reads; lighting direction visible |
| `hero` | the set's signature affordance in use | the money shot; rubric focal-point check |
| `floor` | low, close, a car inside the tilt-shift focus band | scale and miniature cues |

Plus one system-level shot for material review:

| Shot | Frames | Purpose |
|---|---|---|
| `material-review` | three neutral test props (die-cast beveled box, lathe bowl, orange track segment) on a neutral set floor | ramp/material comparison only |

## Per-set status

- Kitchen (hero set): defined provisionally in `src/dev/cameras.ts`.
- Bathroom, bedroom, garden, garage, porch: unassigned — each Environment Artist adds them with their set (stage 4/5).
