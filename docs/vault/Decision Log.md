---
tags: [log]
livedocs: snapshot
---
# Decision Log

Dated entries tagged `[agent decision]`. Newest first.

## 2026-10-04 — Stage 1 references ratified: kitchen tile B, car-a, ramp B `[art director]` (Director recording)

Full scores and keeps in `Reference/Review 2026-10-04 Stage 1 explorations.md`; references written into `Concepts/Art Bible` §Chosen references. Tile B wins the kitchen (14/15/13; the only tile with no broken frame); tile A failed its floor frame with a focal zero (floating ribbon, crushed-foil bowl). One send-back of two used: the tile-B integration re-render (grading to A's value range, bowl-interior glaze, wet patch as film not cutout, mug pull-back, brighter tyres) — that becomes the permanent reference and the first task of stage 3. Car-a "sedan blocky" wins (only silhouette naming its type at 200 px); ramp variant B (three hard steps) wins; painterly rejected for dither speckle.

## 2026-10-04 — Tilt-shift is a blocking dependency `[art director]`

Rubric line 3 (scale cues) is capped for every scene until tilt-shift post lands — the signature look cannot be judged honestly without it. Technical Artist delivers it in stage 3 before any render is *final* (not merely provisional); until then renders are labelled provisional in reviews.

## 2026-10-04 — Material system backlog `[art director]` (from tile C's audit + review)

For the Technical Artist, in priority order: grain frequency per surface size (streaks on big floors); accent reachable in the fill light (fill gain not hardcoded); stain/decal capability (mug ring, wet patch as film); ceramic saturation lift; shadow-dither budget at grazing angles; a minimum warm-brown lightness floor for tyres and contact parts; **grain belongs to painted-wood and toy classes only** — speckle on ceramic reads as lens dirt. The backface-normal fix already landed.

## 2026-10-04 — Car palette rule `[art director]`

Car hues stay Okabe–Ito-derived (colorblind-safe) **and must not read orange through the kitchen grading** — kitchen-c drifted to tomato under the gold key. Car-a's blue is ratified; trim variants must pass a re-render check through the kitchen grade, not just a palette check.

## 2026-10-04 — Car physics: raycast wheels win; jointed wheels rejected on evidence `[agent decision]` (Feel Engineer, merged by Director)

Both variants DNF the provisional feel track; raycast wheels beat wheel-colliders on every metric (peak speed 7.25 m/s ≈ free-fall bound; colliders 2.66 m/s) and revolute-joint support showed three reproducible failure modes in Rapier 0.21 @ 120 Hz / SIM_SCALE 10 (static-friction brake-lock, position-joint sink→plough, pitch↔spin energy drain). Stage 2 builds on **raycast wheels with contact-normal spring support** (support force follows the *track* normal, not chassis-up; bodies must have `canSleep=false`). Alternatives: keep jointed wheels (measured worse), raycast with chassis-up support (drag cancels gravity on slopes). See `Modules/physics.md`.

## 2026-10-04 — Colliders: no chord-slab trimeshes for rolling surfaces `[agent decision]` (Feel Engineer, merged by Director)

The bake-off's chord-slab track geometry (boxes stitched along a spline) produced seam-stitching deceleration ~2.5× the tuned rolling-resistance target and ploughed the chassis into the deck on slopes — it, not the car, caused both misses (roll 0.61 m vs ≈2.5 m target; loop unmeasurable). Stage-2 track colliders will be generated smooth from the same spline as the mesh (compound convexs or swept channel hulls), which the brief already demands; the bake-off numbers are baseline, not ceiling.

## 2026-10-04 — SIM_SCALE = 10 `[agent decision]` (Feel Engineer)

Sim lengths ×10, gravity ×10, mass ×1000; time unchanged. Rapier's absolute tolerances bite a 7.5 cm toy 13× harder than their design scale. The one true record is `Concepts/Feel` §Physics scale factor; everything else references it.

## 2026-10-04 — ToonMaterial backface fix `[technical artist]` (from kitchen tile C)

`gl_FrontFacing` normals were never flipped, so two-sided lathe forms (the cereal bowl!) shaded their inner wall in the darkest ramp band — "grey mud" in every ramp render. One-line fix with before/after renders in `docs/explorations/`. Lesson recorded: *system tiles catch what prop tiles hide.*

## 2026-10-04 — livedocs: never put PNG paths in backticks `[agent decision]` (Director)

livedocs tries to anchor any backticked path, then crashes (`UnicodeDecodeError`) reading binary files, blocking commits that touch `src/render` whenever a note backticks a `.png`. Convention: render paths in notes are written *without* backticks (or under `docs/explorations/` in prose). `livedocs coverage` will show them unresolved — expected.

## 2026-10-04 — Kitchen palette seeds: gold #EFAF4B dominant, mint #5FB49C accent, track #FF7A1A constant `[technical artist]`

Derived by pure hex math in `src/render/tokens.ts` (no three import → identical in node and browser). Shadow fill is shifted ~12–22 % toward the accent via token math so shade reads cool against warm sun. Final confirmation awaits the stage-1 style-tile choice.

## 2026-10-03 — npm over pnpm `[agent decision]` (Director)

Chose npm for install/lockfile. Alternative: pnpm (faster, stricter node_modules). Reason: zero extra toolchain to install in CI; the dependency list is tiny so npm's layout costs nothing. The brief permits either.

## 2026-10-03 — Physics: `@dimforge/rapier3d-compat` 0.21.0 `[agent decision]` (Director)

Chose the **compat** build (wasm inlined as base64 in `dist/rapier.mjs`, ~4.1 MB raw / ≈1.2 MB gz) over `@dimforge/rapier3d` (which needs a sidecar `.wasm` fetch). Reason: single-file module suits static Pages hosting with a relative base; no fetch-path fragility. Over the 50 kB dependency gate — mandated by the brief's stack. Rapier core is f32-in-wasm, which is IEEE-deterministic across wasm hosts, but cross-platform determinism will be *measured* by the stage-2 headless harness (Node vs browser) before the share UI claims it; if it fails, verification stays same-machine and the UI says so (§12 of the brief).

## 2026-10-03 — Renderer: `three` 0.186.1 `[agent decision]` (Director)

128 kB gz core. Mandated by the brief. No other rendering library considered. Material system will be built on Three.js shader chunks per the brief (§8), not on `MeshToonMaterial` as-is.

## 2026-10-03 — Vite `base: './'` `[agent decision]` (Director)

Relative base so one build artifact serves from the Pages project path (`/gravity-works/`) and from any preview server. Alternative: env-dependent absolute base. Reason: zero configuration, and the game never needs to know its mount point.

## 2026-10-03 — livedocs anchoring in a TypeScript repo `[agent decision]` (Director)

livedocs symbol resolution is Python-first; TS names in notes likely resolve as `unknown` (never blocks) rather than anchored hashes. The vault therefore binds by *discipline*: notes name real paths/symbols in backticks, the Documentarian reconciles at every stage close with `livedocs affected`/`coverage`/`verify`, and `livedocs verify` stays in CI. Recorded so a fresh Director doesn't mistake `unknown` coverage for a broken gate.

## 2026-10-03 — Pages deploy = workflow build type `[agent decision]` (Director)

Enabled GitHub Pages with `build_type=workflow`; `.github/workflows/deploy.yml` builds with Vite and publishes `dist`. Alternative: deploy from `main`/`docs`. Reason: artifact must be the built bundle, and the same commit must be checkable by CI first. Site: https://gusellerm.github.io/gravity-works/
