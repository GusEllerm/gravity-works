---
tags: [concept]
---
# Performance

> [!abstract] Role
> The 60-fps-with-post-ON accept line (§10, §2.4 "a gate, not a goal"), what `tests/e2e/perf-stage3.spec.ts`
> can and cannot prove on each runner, and the ceiling table it enforces. Dated measurement tables live in
> `docs/vault/Performance/` ([[stage-2]], [[stage-3]]); this note is the gate's contract.

## Principle: software GL records, hardware GL gates

A frame time measured on a software rasteriser is a statement about the rasteriser, not the game. The
Linux CI runner (ubuntu-latest) renders headless Chromium with SwiftShader — software GL cannot prove a
hardware 60 fps line, and a ceiling inflated until it passes there (high-tier median 351 ms measured
2026-10-05, CI run 37274913120) would catch no render-cost regression anywhere. So the post-ON gates in
`tests/e2e/perf-stage3.spec.ts` ask WebGL who is drawing and branch:

- **Detection** (`detectGl` in the spec): `WEBGL_debug_renderer_info` → `UNMASKED_RENDERER_WEBGL`;
  `SOFTWARE_RENDERER_RE` matches SwiftShader / llvmpipe / Mesa-llvmpipe. `GQA_FORCE_SOFTWARE_GL=1`
  forces the software branch on any box (the simulation knob).
- **On software GL:** the post-ON measurements (rendered-loop keep-up and the tier probe) still RUN,
  their tables still ATTACH as artefacts + annotations in the HTML report, and every ceiling/keep-up
  result is reported via `testInfo.annotations` as `RECORDED (software GL — deferred to hardware GPU)`.
  The tests pass. This is a record, not a green claim.
- **On hardware GL:** hard gates — measurement A's keep-up > 0.8 and stall ceiling, and measurement B's
  per-tier medians against the ceiling table below.
- **Everywhere, hard:** the post-OFF stage-2 gates — measurement C (GPU-free `World` stepping keep-up
  ≥ 1.00 + 60 Hz chunk budgets) never enters a browser and never relaxes.

On darwin the spec launches Chromium with `--use-angle=metal` (per-file `test.use`), so the local box
reports `ANGLE (Apple, ANGLE Metal Renderer: Apple M5 Pro, …)` and gates the HARDWARE path; the default
headless launch on any platform reports SwiftShader, which is why the flag exists — without it the
local box would take the software branch it is calibrated to escape.

## Ceiling table (hardware GL, hard)

`TIER_CEILING_MS` is the calibrated row; `HARDWARE_TIER_CEILINGS_MS` maps it per platform (an
unlisted hardware platform falls back to the calibrated row until its own row is added with its own
documented measurement). Render cost at 960×540, post stack ON, harness kitchen-set, blocking
1-px readPixels per frame:

| tier | ceiling | rationale (calibrated 2026-10-07, Apple M5 Pro) |
|---|---:|---|
| high | 100 ms | ~3.5× the clean SwiftShader median (27.9 ms) and ≥ 1.5× the worst full-suite-contention row (65.5 ms); hardware Metal measures 2.5 ms |
| medium | 70 ms | same ratio on 21.6 ms clean / hardware 2.1 ms |
| low | 55 ms | same ratio on 16.6 ms clean / hardware 1.8 ms |

Rationale in full: loose enough that a slow hardware GL driver is no false alarm, tight enough that a
stage multiplying its per-pixel cost fails the job. Re-measure and re-document in the commit that
changes the ladder's shape.

## Recorded deferred measurements (software GL)

- **Linux CI, SwiftShader (LLVM 10.0.0), run 37274913120 (commit `de855b9`, before this branch):**
  tier **high median 351.00 ms** (p95 476.8 / mean 364.1 / max 510.6 / rAF median 350.0 ms, blocking
  total 32 767 ms over 90 frames) against the 100 ms ceiling; medium/low never ran in that job (high
  failed first). Rendered loop A: median 250.00 ms, keep-up **0.63** against the > 0.8 gate. These are
  the known deferred numbers — recorded, not gated, from this branch on.
- **macOS box, ANGLE Metal (hardware, hard-gated):** tiers 2.5 / 2.1 / 1.8 ms medians; rendered loop
  median 16.70 ms / p95 16.70 ms / keep-up 1.00 — the 60-fps-with-post-ON line asserted hard there.

## Standing open item

**60 fps with post ON on a hardware GPU is not provable by current CI** (software rasterizers only) —
software GL records and defers; the hardware measurement is a standing open item, Home Deferred, and
the target of the stage-6 performance pass. The darwin local runs gate it today; a hardware-GPU CI
runner would light up the same branch with its own table row.
