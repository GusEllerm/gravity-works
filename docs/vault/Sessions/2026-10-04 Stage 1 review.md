---
livedocs: snapshot
tags: [session, stage-1, review]
---
# 2026-10-04 Stage 1 review (reviewer, fresh eyes)

## Verdict

**PASS with findings.** Stage 1 acceptance (a chosen reference for set look, car
look, car physics, material ramp, each recorded in its bible with losing renders
kept under `docs/explorations/`) is met on the record: all 15 renders exist and are
referenced, the bibles and Decision Log carry the three choices plus the honest
"targets missed" note. Nothing found invalidates the *choices*; two findings mean the
*physics bake-off data* behind the car-physics choice is weaker and mislabeled relative
to what the code claims it measured, and Stage 2 must inherit it with open eyes.

## Findings

1. **major — the roll test does not measure "roll after a 30 cm drop"; both variants'
   numbers are artifacts.** `src/feel/run.ts:69-77` spawns via `spawnCar`, which always
   imparts a forward launch velocity (`src/physics/car.ts:131`, `v0 = 3` sim), so the
   "free drop" is actually a low launch. The start also sits `+2` **sim** units past
   `flatEnd` (0.2 m world, not the "2 m of deck" the comment at `src/feel/run.ts:71-72` claims),
   and `rollDistance` is measured from `flatEnd`, folding that 0.2 m into the result.
   Executed probe (same calls as `runScenario`, coef 0.02): wheelColliders drops and
   "stops" at sim-step 73 — 0.08 m of actual travel after release, reported as 0.28 m;
   raycastWheels sinks below the deck plane (chassis y ≈ deck − 0.04 sim) at ~sim-step 500
   and drags at v ≈ 0.31 until the 30 s timeout, so its reported 0.61 m is buried-car
   creep, not rolling. Failure scenario: Stage 2 tunes `ROLL_COEF` against 0.28/0.61 and
   discovers the ~2.5 m target was never observable on this rig. This is also the mechanism
   behind the recorded loop-threshold gap — the sink after the ramp landing is the same
   suspension failure the tests document at `tests/unit/feel.test.ts:8-12`.
2. **major — `wheelColliders` is not a wheel-collider model, and its own file says it is.**
   `src/physics/car.ts:123` gives the four wheel bodies collision group
   `0x0004_0000` — filter 0, they touch nothing — while the file header
   (`src/physics/car.ts:4`) claims "four cylinder colliders on free revolute joints" and
   `jointedStep` (`src/physics/car.ts:210`) claims "wheel-track contacts are REAL
   colliders"; there are no joints in the shipped code (PD impulses at
   `src/physics/car.ts:230-240`). Failure scenario: Stage 2 reads
   `Modules/physics.md` / `Feel.md` ("wheel-collider/revolute variants measured and
   rejected"), opens `car.ts` expecting a measured collider model, and either trusts a
   bake-off that never put wheels on the track or wastes a cycle "reviving" a variant whose
   shipped form is a sprung chassis with four inert telemetry masses. The bake-off verdict
   (raycast wins) may well be right — the probes say so — but the shipped code misrepresents
   what variant a *is*.
3. **major — the bake-off's own track never ran, so the physics choice has no loop/landing
   data.** `npm run feel` prints DNF for both variants, apex `n/a`, landing `0.000 Ns`,
   loop threshold `>` for both. §10 asks for two physics models compared on a provisional
   feel track; what was compared is two DNFs on a broken rig. PROMPT §12 permits recording
   the blocker instead of lowering the bar, and `Feel.md:12` does ("Stage 2 must beat the
   bake-off baseline"), so this is not a block — but the Decision Log phrasing "measured and
   rejected" overstates the evidence (see 2).
4. **minor — dead code on `main`:** `setRollCoef` (`src/feel/run.ts:40-42`) is exported and
   never called by `tools/feel.mjs` or any test; `RunOpts.startOffset`
   (`src/feel/run.ts:61`) is never passed. Quality bar §11 says no dead code; deferred work
   should be Home.md'd instead.
5. **minor — vacuous assertion:** `tests/unit/tokens.test.ts:28`
   `expect(SET_TOKENS.kitchen).toEqual(SET_TOKENS.kitchen)` compares one object to itself
   and can never fail; same at `:29` for `cssVars('kitchen')`. The golden-value pin above
   them does the real work; these two lines assert nothing.
6. **minor — tripwire inverted:** `tests/unit/feel.test.ts:49,55`
   `toBeLessThan(2.5)` on roll distance makes the suite go *red the day Stage 2 hits the
   target*. Documented as a regression floor, but as written it is a test that fails on
   success; it needs a deliberate flip, which belongs in the Decision Log, not a comment.
7. **minor — the hash silently tolerates NaN:** `quant` in `src/physics/sim.ts:145-147`
   maps NaN through `Math.round`/`|0` to 0, so two diverged-to-NaN runs hash equal and the
   determinism test passes on dead state. Only the separate `Number.isFinite(peakSpeed)`
   smoke at `tests/unit/feel.test.ts:62` currently catches this.

## Verified by execution

- `npm run typecheck` clean; `npm test` 10/10 pass (feel tests genuinely simulate —
  per-test timings 5-258 ms at 120 Hz steps, not skipped).
- `npx playwright test` 2/2 pass; harness scene `materials-a` renders non-black via the
  production build (confirms the `import.meta.glob` auto-discovery ships registered scenes).
- `npm run feel` twice in separate processes: identical hashes (`9203483e`, `20354e5a`,
  both `=repeat`) — same-machine cross-process determinism holds for this harness.
- Direct probe of the roll rig (see finding 1) reproducing the published metrics exactly.
- Read-only review: `hashBodies` is called every `HASH_INTERVAL = 10` steps
  (`src/physics/sim.ts:28`, `src/feel/run.ts:102`) as claimed, over chassis+wheel
  transforms with the documented quantization; no wall-time reads anywhere in `src/`
  (grep: `Date.now`/`performance.now`/`Math.random` appear only in `tools/render.mjs`
  server-wait code); harness renders exactly one frame at `FIXED_TIME = 0` and liquid
  wobble stays frozen because `uTime` is never advanced; `src/render/tokens.ts` imports
  nothing and its math is pure-numeric, so node/browser drift is not possible by
  construction (golden-value test pins it).
- Constraints: `git diff stage-0..HEAD` adds no runtime deps (only `@types/three` devDep;
  runtime remains three + rapier3d-compat, matching the Decision Log); no assets under
  `public/` or `src/` (`public/favicon.svg` unchanged since stage-0); the 15
  `docs/explorations/**/*.png` referenced in the bibles and Session notes all exist on
  disk; no TODO/FIXME markers in `src/`, `tests/`, `tools/`.
- CI (`ci.yml`) runs typecheck, vitest (incl. the determinism tests), playwright e2e
  against a fresh build, and `livedocs verify` — adequate coverage for this stage.

## Note for the Documentarian

Reconcile `Modules/physics.md` and `Concepts/Feel.md` against findings 1-3: the phrase
"wheel-collider … measured" should either describe the probes that were removed, or the
telemetry-only nature of the shipped variant a should be stated plainly.
