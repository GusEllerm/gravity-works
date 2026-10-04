---
tags: [log]
livedocs: snapshot
---
# Decision Log

Dated entries tagged `[agent decision]`. Newest first.

## 2026-10-06 — Kitchen rungs with an undrivable yaw half ship as done-but-BLOCKED-rung, not blocked levels `[agent decision]` `[level designer]`

L02 (curve choice) and L03 (bowl bank line) were specced around mid-run yaw geometry, and no yaw piece is drivable by either shipped car at any swept radius/speed/bank (probe table in `Sessions/2026-10-06 Stage 3 - level ladder`). Options: mark the levels BLOCKED (starves stage 3 of content and hides the one-line fix), or fake drivability with a par build that fails (forbidden by the playability gate). Chose: ship both levels with par lines that finish (proved headless), keep the yaw geometry as fixture run-out past the cup (the feel track's own precedent), and mark the RUNG BLOCKED with a one-paragraph piece request (`Concepts/Levels` ask #1). Alternatives rejected: par builds containing the yaw piece (test-red = ship-red, and it would be honest only by being useless), and a steering hack inside the level files (physics is not the level designer's file).

## 2026-10-06 — Levels carry `tray` + `parBuild`; `budget` = tray total; the contract `Level` is not touched `[agent decision]` `[level designer]`

The ladder needs per-kind budgets and a replayable reference build, and `Level` (`src/world/level.ts`) has neither seam and is not the level designer's file. Chose: `KitchenLevel extends Level` in `src/world/levels/kitchen01.level.ts` with `tray` (its total IS `budget`, so tray contents = budget by construction), `fixtures`, and `parBuild()` also wired as `placeholderBuild()` so share/replay/the builder see zero new seams; the pars script will read the same fields. Alternative rejected: editing `Level` directly (would collide with the Systems Engineer's file set mid-stage, and the extension is strictly additive).

## 2026-10-04 — Chord slabs are not the reason the roll test lied `[agent decision]` `[systems engineer]`

The stage-2 brief asked for a test in which a sphere rolls **≥ 3× farther** down a 5° kit incline than down the same incline rebuilt from 12 chord slabs, on the strength of the entry below ("colliders"). It is not true, and the test in `tests/unit/track-rolling.test.ts` says what is instead: kit 1.83 m vs 12-chord slabs **2.15 m** (the slabs win slightly, because a chord cuts a fraction of a millimetre *inside* the blend and so drops the ball fractionally further), and the stage-1 car on the same two decks 3.675 m vs 3.590 m. Reason: 12 chords spread over ≤ 5° of pitch deviate from the swept surface by well under a millimetre, and a seam a rigid body never has to cross cannot decelerate it. What *is* true and now gated: a sphere on a kit deck covers 95 % of what it covers on a single perfect cuboid (0.579 m vs 0.611 m), the collider surface never deviates from the centreline further than the mesh does, and 12 chords of a kit **loop** cut 2.7 mm into the running surface where the kit's hulls cut 0.44 mm (6×) — which is why invariant 2's loop-threshold test must run on kit geometry. Consequence for the Feel Engineer: the 2.5× false deceleration in the entry below lived in the suspension's contact normals at slab seams, not in the surface, so re-tuning `ROLL_COEF` against kit geometry is the open item, not "smoother colliders". Alternatives considered and rejected: quietly asserting a weaker ratio (hides nothing useful), and asserting the 3× against a strawman slab rig (a lie). See `Modules/track`.

## 2026-10-04 — Track kit shape: arc segments, convex-part profile, merged hulls, Δv launchers `[agent decision]` `[systems engineer]`

Four choices the [[Concepts/Track Kit|Track Kit]] contract left open, taken in the code and elaborated back into its interface section: (1) centrelines are **piecewise arcs** (constant pitch/yaw rate per segment) rather than centripetal Catmull-Rom — the contract allowed either; arcs give exact arc length, an exact analytic loop (invariant 2 holds to 1e-17) and parallel transport for free, and cost nothing because every pitch change in the kit is a blend anyway. (2) The one U-channel profile is stored as a **union of convex parts** (deck, two rails, two lips) instead of one concave polygon, because a hull of a concave ring is a solid slab that would bury the channel. (3) A collider segment is the hull of **consecutive** rings, merged while the accumulated turn stays under two degrees — the alternatives were a seam every 5 cm (the deck problem we are solving) or one box per chord (the geometry we are not doing again). (4) `applyImpulse` expresses launcher `power` as a **Δv** read against the target body's own mass, so kit code stays unit-blind; and `toColliderDescs` takes a length `scale` parameter, which is the only way to honour both halves of the contract's "physics converts at collider-build time" and "kit code never sees sim units". Gap pieces (`drop`, `gapLip`) carry their empty span as `solid: false` data rather than being two pieces, which keeps every joint a socket joint. Details: `Modules/track`, `Sessions/2026-10-04 Stage 2 - track kit.md`.


## 2026-10-04 — The §7.1 roll metric is a drop-**ramp** metric `[feel engineer]` (Director recording)

The honest rig revealed the bible line was ambiguous: vertical free-drop onto flat deck measures **0.00 m** for *any* car (no horizontal momentum) — stage-1's 0.28/0.61 m were launch-velocity and buried-car-creep artifacts. The metric is now precisely: release from rest, 30 cm of ramp drop, flat deck, measure wheel-centre travel after touchdown. Also landed: variant-a's wheels now have real colliders (they silently never hit the track — a collision-group bug; fixing it moved its peak speed 2.66→12.57 m/s), `quant()` NaN/∞ now poisons the hash instead of mapping to zero. Open with kit geometry: `ROLL_COEF` re-tune (currently overshoots 2.5 m by 2.3–3.4×), loop-landing sink.

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

**Correction at stage-1 review (reviewer finding, 2026-10-04):** the "wheel colliders" variant never gave its wheels collision — so jointed support was measured honestly, but a *proper wheel-collider model* was not. And since both variants DNF'd, no loop/landing data backs the choice. Carried into stage 2 as a standing gate: the track kit must produce loop/landing data for both a corrected wheel-collider variant **and** the raycast base before any tuning is locked; if the corrected variant wins on the real track, stage 2 switches base (recorded then, not silently).

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
