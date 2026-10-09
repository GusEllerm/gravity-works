---
livedocs: snapshot
tags: [reference, determinism, stage-6]
---
# Cross-platform determinism 2026-10-09 (the atlas run)

> [!abstract] Role
> The first REAL data on the Final Report's "next" #2 — does the share-hash claim survive the hop to another OS/CPU, or is verification only ever same-machine? Answer, as measured: **yes where measured — 37/37 reference-build hashes match on linux-x64, and 37/37 on a second darwin-arm64 machine.** The claim is upgraded to "verified on linux-x64 + darwin-arm64; every other platform remains unproven", and the job that measures it REPORTS, gating nothing. Snapshot note: the experiment, the table, the machine facts.

## The experiment

The caveat said the physics hash is only proven SAME-MACHINE (Rapier is CPU WASM over IEEE-754 doubles, so cross-CPU equality was *plausible* — but plausible is not measured, and the software GL rasterizer in CI cannot touch physics, so the experiment costs one headless derive per runner). Harness:

- `tools/hash-atlas.mjs` — replays EVERY registered level's reference build (`Level.parBuild`, falling back to `placeholderBuild`) once through the headless `replayRun` and derives the atlas: `{ levelId, hash, steps, time, parPieces, parTime }` per level, plus a provenance header (`platform`, `node`, `rapier`). Committed to `docs/vault/Reference/hash-atlas.json`; `npm run atlas` regenerates, `--check` re-derives and diffs (hashes + piece counts only — the header and raw `time` differ by design and are reported as context, never as mismatches).
- `.github/workflows/ci.yml` job `determinism-atlas` — the SAME derive on ubuntu-latest (the experiment) and macos-latest (the cheap self-check), Node 22, `continue-on-error`: a MISMATCH prints per-level `::warning::` annotations + the full table into the step summary and changes no gate anywhere. Experiment first, gate later — the promotion decision is stage 7's.

The committed atlas was derived on the reference machine (`darwin-arm64`, node v22.22.1, rapier 0.21.0 — the shipped `@dimforge/rapier3d-compat` build) and its piece/par lines cross-check byte-identically against `src/world/pars.json`; its campaign anchors are the known ones (kitchen02 `0b4dbab2`, kitchen03 `a1a50d05`, the encore pair's `1f99683a`).

## The match table (PR #2, run 37872992852, 2026-10-09)

| Derive | Platform | Node | rapier | Levels | Hash matches vs committed atlas |
| --- | --- | --- | --- | --- | --- |
| reference machine (atlas source) | darwin-arm64 | v22.22.1 | 0.21.0 | 37 | — (source) |
| ubuntu-latest runner | linux-x64 | v22.23.3 | 0.21.0 | 37 | **37/37 MATCH** |
| macos-latest runner | darwin-arm64 | v22.23.2 | 0.21.0 | 37 | **37/37 MATCH** |

WHERE nothing diverges is itself the finding: no rung's hash drifted, no step count differed, no piece count moved — this is not "most rungs match and the float-sensitive ones don't"; every contact-heavy bowl, every encore rail, every sandbox lap reproduced bit-exactly on x86-64 Linux. The same PR run's `check` job also ran the suite ON linux — its node↔browser `determinism.spec.ts` HARD-ASSERT (page verdict `verified`) passing there is the browser-engine half of the same result.

## The honest claim, upgraded

- **VERIFIED**: the terminal state hash of all 37 registered reference builds is identical on **linux-x64** (Intel/AMD, glibc) and **darwin-arm64** (Apple silicon), across Node minor/patch drift (v22.22.1 ↔ v22.23.x), wasm-inlined rapier 0.21.0 — same engine in node and browser (the long-standing hard assert).
- **UNPROVEN**: Windows, iOS/Android wasm hosts, arm-linux, x86-32, and any engine build with different fast-math or FMA contraction. Nothing measured says those match; nothing measured says they don't. The share UI says exactly this — the verification NOTE names the machines the claim covers, while the badge stays machine-local ("verified on this machine" is what the page itself proves, `src/boot.ts`).
- Why this is unsurprising in hindsight and still worth doing: the hash folds QUANTISED transforms (`hashBodies`, `HASH_INTERVAL`) into an FNV accumulator, so sub-ULP solver differences below the quantisation grid cannot show up even in principle — the real risk was a solver-branch divergence (FMA contraction flipping a contact decision), and it did not appear in 37 diverse runs across the two dominant wasm/CPU shapes.

## Guards and reproduction

- Local: `npm run atlas` regenerates the atlas; `node tools/hash-atlas.mjs --check` is the same diff CI runs (all-match locally at landing).
- CI: every push/PR runs `determinism-atlas` on both OSes and reports — future re-anchors (any par-hash re-derivation) MUST regenerate the atlas in the same commit or the job prints the drift table.
- Promotion to a GATE is a deliberate stage-7 decision: until then a mismatch is knowledge printed in warnings, never a red pipeline. If a future run DOES diverge, the table localises it — same-rung different-hash = float divergence; only some rungs = a solver-branch story worth a stage-7 investigation.

Decision Log 2026-10-09 (atlas upgrade of the same-machine caveat) · `Modules/replay` (harness law) · `Modules/share` (the UI wording law) · [[Home]] Deferred.
