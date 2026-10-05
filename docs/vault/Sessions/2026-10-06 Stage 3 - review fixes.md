---
livedocs: snapshot
tags: [session, stage-3, systems-engineer]
---
# 2026-10-06 Stage 3 — review fixes (systems engineer)

> [!abstract] Role
> Session snapshot for the stage-3 adversarial-review fix pass on `main`: the three confirmed defects
> (silent visual skip, per-placement post-stack leak, unasserted determinism) plus the two CI-truth
> items (perf numbers as gates, dev params on the shipped page). Gate philosophy: a printed number
> that cannot fail is a rumour; every gate below can fail, loudly.

## 1 — Visual suite: the exploration diff can no longer be skipped away

`tests/e2e/visual.spec.ts` ran baseline + ratified-render comparison in ONE test body per shot; the
platform-missing `test.skip` inside `againstBaseline` ABORTS the body, so on a Linux CI (only
`tests/visual/darwin/` committed) `againstExploration` — the platform-independent diff the header
promised runs everywhere — never executed. Split into two tests per shot: `…matches its committed
baseline` (skips loudly per platform) and `…matches the ratified exploration render` (contains NO
skip path). New `GQA_BASELINE_DIR` env override points the baseline dir elsewhere to simulate a
baseline-less platform. Proof on this box (`GQA_BASELINE_DIR=tests/visual/linux-nonexistent`):
**4 baseline tests SKIPPED, 3 exploration tests RAN and PASSED** (0.0000 % diff, all three shots).
Unset, all 7 pass (4 baseline + 3 exploration + shell).

## 2 — Post-stack grade leak: disposal completed + gated

`src/render/post/index.ts` `dispose()` omitted `stages.grade` — boot's `rebuild()` cycles the stack
per placement, so every piece placed with `?post=on` leaked the grade pass's GPU objects (the pass
is a plain `ShaderPass`; its `dispose()` releases material + program + fullscreen quad — three.js
r186 does both halves). New leak gate `tests/e2e/post-dispose.spec.ts` runs 20 build→one-frame→
dispose cycles through the new harness seam `window.__postCycle` (blank scene on purpose: real-set
renders make SCENE materials compile one-time linear-output program variants that belong to the
materials, not to the stack — kept out so the assertion is exact).

**Leak-test numbers** (20 cycles, `renderer.info`): **before the fix programs 8 → 9** (the grade
program pinned from cycle 1, flat trace — the test FAILS), **after: 8 → 8**, trace flat at 8 (the
test PASSES). Textures 2→2 and geometries 53→53 in both states (composer/tilt/bloom render targets
were already disposed correctly — those assertions guard regressions there). Note the programs count
is per UNIQUE program, so the leak shows as a constant +1 pin, not +1/cycle; growth across cycles
would be a different (geometry/texture) leak, also covered.

## 3 — Determinism: node↔browser is now a hard gate

`tests/e2e/determinism.spec.ts` node↔browser promoted from REPORTED to **asserted**
(`expect(match).toBe(true)` + page verdict `verified`); the §2.2 "until the outcome is known"
allowance is retired — every recorded run since the stage-2 gate has been MATCH (`099403c7`, 361
steps). Wiring choice: **in-test, spawn-free** — the spec's own Node process IS the node side (same
`replayRun` import the tools use), the browser recomputes independently and compares against the
hash embedded in the share fragment; no committed fixture hash file to drift (the `099403c7` pin
already lives in `Modules/replay` prose). No browser nondeterminism surfaced — MATCH on every run
of this pass. A mismatch on a future runner is a real cross-engine finding: the job fails, no skip.

## 4 — Perf: tier medians became ceilings + artefacts

`tests/e2e/perf-stage3.spec.ts` measurement B: replaced the stall-only `≤ 250 ms` with documented
`TIER_CEILING_MS` — **high ≤ 100 / medium ≤ 70 / low ≤ 55 ms** (≈ 3.5× the clean M5 SwiftShader
medians measured this pass — 27.9 / 21.6 / 16.6 ms — and ≥ 1.5× the worst contention row QA ever
recorded, the high-tier 65.5 ms in [[stage-3]]). Each tier's human table now attaches to the HTML
report (artefact + annotation), not just stdout. Calibrating run green: 27.9 / 21.6 / 16.6 ms.

## 5 — Dev params on the shipped page: RECORDED, not stripped

Chose the DOCUMENT option over the DEV-gate: the entire e2e rig drives the PRODUCTION build
(`vite preview`, `import.meta.env.DEV === false`) through `?level=`, `?build=par`, `?launch=1`, so
stripping them outside DEV would blind the whole suite for zero shipped-code gain. Recorded as
deliberate debug affordances — Decision Log 2026-10-07 ("The shipped page keeps its URL debug
affordances") and `Modules/src` (debug-only wording). None mints progress: the ladder gates EARNED
stars (`gateNext`), not URL addressability.

## Gate status this session

`tsc --noEmit` clean; vitest 23 files / 259 tests green; full e2e suite green on port 4213 (plus
the filmstrip gate on its own config); targeted proofs in the sections above. Notes reconciled:
`Modules/src`, `Modules/dev`, `Modules/render`, `Modules/replay`, `Home`, `Performance/stage-3`,
`Decision Log` (two new entries + one reconciliation).
