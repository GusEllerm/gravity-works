---
livedocs: snapshot
tags: [session, stage-2, qa]
---
# 2026-10-05 Stage 2 — qa gates (QA Engineer)

Role: QA Engineer. Branch `qa2` (worktree off `main` @ 7dc464b). Files owned: `tests/e2e/perf.spec.ts`, `tests/e2e/determinism.spec.ts`, `docs/vault/Reference/Performance Baselines.md`, `docs/vault/Performance/`, this note. Nothing else was touched.

## What was run

- Full suite in the worktree: `npm run typecheck` clean; `vitest run` **91/91 passed** (11 files); `playwright test` **9/9 passed** (4 e2e files incl. the two new specs).
- New `perf.spec.ts`: mode A = real game shell (`/`, feel-track placeholder build, plain materials, no post stack exists yet) stepping + rendering for ≥5 s simulated (relaunch at terminal status), rAF `performance.now()` deltas; mode B = same `World` with `visuals: false` in Node, timed per 10-step (one 60 Hz frame) chunk.
- New `determinism.spec.ts`: one (level, build, seed) hashed by `replayRun` in Node twice, and the same run replayed by the built page's `#s=` shared-run page carrying the Node hash.

## Numbers (Apple M5 Pro iGPU box; headless Chromium = SwiftShader software GL)

- Rendered: median **16.70 ms**, p95 16.70–16.80 ms, mean 16.67 ms, max 16.80 ms — **vsync-pinned ~59.9 fps, zero dropped frames, sim/wall keep-up 1.00**. Meaningful as "fits the budget on this machine even under software GL"; a vsync-pinned median is a ceiling, not a cost.
- Stepping-only: median **0.70–1.07 ms** per 10-step frame, p95 2.70–3.90 ms → **15–24× headroom** under 16.7 ms. This is the portable, CI-hard-asserted number. Details: [[stage-2]].

## Determinism matrix (feel track, seed 1)

| pair | result | hard-asserted? |
|---|---|---|
| node ↔ node | `9decb4fb` = `9decb4fb`, 343 steps, `finished` both — **MATCH** | yes |
| node ↔ browser | node `9decb4fb`, page recomputed `9decb4fb`, page verdict **verified** — **MATCH** | **reported, not asserted** (per brief §2.2, until the cross-platform story is known; promote at stage 3) |

Cross-platform (different CPU/OS) remains unproven — CI runner data needed; feeds the Decision Log honesty claim.

## Verdict per Stage 2 accept line (PROMPT §10), by execution only

1. **a car completes the feel track** — **PROVEN.** Every headless replay this session ended `finished` in 343 steps / 2.86 s; the 5 s rendered loop ran the same build to `finished` twice + partial with zero page errors.
2. **loop threshold within 10% of theory** — **GREEN, ownership elsewhere.** `tests/unit/feel.test.ts`'s loop-threshold test passes; the honesty of the number itself is the Feel Engineer's standing claim (see their loop-gate notes), not re-derived here.
3. **headless determinism test passes** — **PROVEN** same-machine, same-engine: node↔node asserted equal; unit sensitivity tests (`replay.test.ts`) green.
4. **a share link replays to the same hash** — **PROVEN** on this machine/engine: page verdict `verified` against the Node-computed hash embedded in the fragment (`9decb4fb`).
5. **60 fps with the post stack off** — **PROVEN at the level CI can honestly measure** (stepping gate passes with 15–24× headroom; rendered loop holds vsync 60 with 0 drops here). Integrated-laptop-GPU confirmation is deferred to stage 3 when post + a real set exist; the gate then must be re-measured, not assumed.

No blockers from QA. Stage-2 tag is not blocked by anything in my file set.

## Pre-existing issues found (not fixed — outside my file set)

- **`docs/vault/Modules/world.md` is committed to `main` with unresolved merge-conflict markers** (`<<<<<<< HEAD` / `>>>>>>> origin/stage2-level`) — present in `git show HEAD` at 7dc464b. `livedocs verify` still passes (it counts it `unknown`), but the note is malformed; Documentarian/Director fix.
- **Vault drift:** `Modules/replay.md` and `Modules/world.md` still quote the pre-loop-geometry-fix run (`074b1ef6`, 239 steps / 1.99 s). Measured now: `9decb4fb`, 343 steps / 2.86 s. The numbers are stale, not wrong-looking — worth a stamp pass.
