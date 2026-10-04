---
livedocs: snapshot
tags: [session, stage-2, fixes]
---
# 2026-10-06 Stage 2 - fix crew (systems engineer)

Clearing the stage-2 review BLOCK. Four findings, in the review's order.

## 1. Blocker: red builder e2e

`tests/e2e/builder.spec.ts` hand-mirrored the piece counters (8/16). Now it
imports `FEEL_TRACK_KINDS.length` and `FEELTRACK.budget` and DERIVES all
three assertions — the spec cannot go stale again when the chain grows.
Full `npx playwright test`: 9/9 green; pushed as its own commit first.

## 2. Major: the loop accept line is now asserted, not prose

- `LOOP_BAND_OVER_R = [2.25, 2.75]` and `LOOP_GATE_BRACKET_OVER_R =
  [2.2, 2.6]` are exported constants (the band used to live in a comment).
- `loopThreshold` takes an explicit bracket; `loopGateWings` probes the
  wings. `tests/unit/feel.test.ts` asserts per variant: low wing FAILS,
  high wing COMPLETES (monotone direction: higher release → completes),
  THEN bisects inside it and asserts the converged value in band. Measured
  convergence: **2.30 R, identical on both variants**.
- The three-way disagreement (3.03 / 2.51 / prose 2.4) is resolved to the
  one canonical rig — friction-aware loop rig at shipped `ROLL_COEF`.
  Provenance of the retired numbers is documented in `Modules/feel.md`
  §Loop threshold: 3.03 was coef-0, 2.51 was a naive-bracket bisect on a
  hardcoded 0.117 mirror (the mirror is gone; `tools/feel.mjs` imports
  `ROLL_COEF`), 2.4 was a coarse grid row. The table has ONE `loopGate`
  row now, showing the wing verdicts.
- Honest edges stated in the note: one isolated completing row at 2.15 R
  below the bracket floor, which the audit shows rides a wishbone rotor
  pump (+0.9–1.0 J/kg net where shipped heights show ≤ 0) — pinned by the
  bracket floor and by the ablations, not by faith; and the mid-window dip
  rows, which are suspension-phase physics the gate is allowed to show.

## 3. Major: one TRACK_FRICTION

New `src/track/material.ts` exports the single `TRACK_FRICTION = 0.05`;
`src/world/world.ts` (was 0.6 + a false "matches the rigs' boxes" comment)
and `src/feel/kittrack.ts` both import it. The value is inert for the
shipped contact filters, and the determinism e2e confirms: node↔node and
node↔browser still print `099403c7 => MATCH`, page verdict `verified`.

## 4. Major: crutch ablation matrix

`__ABLATE` (exported, test-only, env-var-free) in `car.ts`;
`tests/unit/ablation.test.ts` flips one crutch at a time and pins the
verdict on the feel track + the loop rig's 2.4 R row. Results table and
reading: `Modules/physics.md` §Crutch ablation. Load-bearing: wishbone
lead 1.5, rotor damper, conjugate damper law (on the LOOP metric). Inert
on every shipped rig today: the misalignment gate (bit-identical hash).

## 5. Minors swept

`carStep` doc (joints claim), `SPAWN_ADVANCE` "5 cm"→2 cm,
`FEEL_DROP_HEIGHT`/level-header 0.45→0.52 + `drop` piece in the chain
listing, dead stacked JSDoc on `FEEL_TRACK_KINDS`, `measured 教训` →
`measured lesson`, `addStaticTrimesh` deleted (nobody called it),
`MEASURED_DROP_ROLL_*` → `FREE_DROP_LAUNCH_TRIPWIRE_*`, perf note 8→9
pieces, Home.md Deferred records the determinism MATCH outcome.

## Execution log

| command | result |
|---|---|
| `npm run typecheck` | clean |
| `npm test` | 95/95 pass (12 files, ablation suite included) |
| `npx playwright test` (blocker commit) | 9/9 pass |
| `node tools/feel.mjs` | one `loopGate 2.30 r [n/Y]` row; provenance footer |
| bisect probe | both variants converge 2.30 R from [2.2, 2.6] in 7 iters |
| ablation probe | lead2 DNF / rotor-off DNF / naive +0.07 s (loop n) / gate bit-identical |
