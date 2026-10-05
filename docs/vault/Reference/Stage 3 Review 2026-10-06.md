---
tags: [reference, review]
livedocs: snapshot
---
# Stage 3 Review — 2026-10-06 (adversarial)

> [!abstract] Scope and method
> Eight claims that stage 3's own gates were weaker than the notes claimed, each attacked against
> the shipped code and the test rig on `main` before fixes: read the spec, run it, mutate it, and
> only then rule. Verdicts: **confirmed** (the claim was true — fixed), **plausible** (true in
> spirit, the mitigation is a record, not a patch), **rejected after attack** (the claim could not
> survive an instrumented probe). Every fix below is gate'd — a number that only prints is a rumour
> (Decision Log 2026-10-07, CI-truth pass). Fix round: `Sessions/2026-10-06 Stage 3 - review fixes`.

## The claims and the verdicts

| # | Claim | Verdict | Disposition + evidence |
|---|---|---|---|
| 1 | The visual suite silently SKIPS on any runner without a committed baseline — Linux CI never ran the ratified-render diff its own header promised | **CONFIRMED** | FIXED: `tests/e2e/visual.spec.ts` split — baseline comparison and exploration comparison are separate tests per shot; the exploration test contains NO skip path. Proven with `GQA_BASELINE_DIR` simulating a baseline-less platform: baseline tests SKIP, exploration tests RUN and PASS (0.0000 % diff, three shots). |
| 2 | `PostStack` leaks GPU objects per placement | **CONFIRMED on the rebuild path / REJECTED on the quality-toggle path** | Rebuild: `dispose()` omitted `stages.grade`; with `?post=on` every placed piece cycled the stack and pinned the grade program. FIXED: `stages.grade.dispose()` completed + `tests/e2e/post-dispose.spec.ts` — 20 build→one-frame→dispose cycles through the `__postCycle` seam must return `renderer.info` to baseline (programs 8→9 pinned PRE-fix, 8→8 POST-fix; textures/geometries flat both ways). Quality-toggle probe: REJECTED — `applyQuality` only flips `Pass.enabled` (no allocation, no rebuild); disposal of the disabled passes is the same gate as the rebuild path. |
| 3 | Node↔browser determinism is advisory-only — reported, never asserted | **CONFIRMED** | FIXED: `tests/e2e/determinism.spec.ts` hard-asserts equality + the page verdict `verified` (the §2.2 "reported until known" allowance is retired — every run since the stage-2 gate has been MATCH). Spawn-free wiring: the spec's own Node process is the node side; the browser recomputes independently against the hash in the share fragment. Hash `099403c7` verified on every run of the pass; the share-replay e2e also hard-asserts. |
| 4 | The shipped page's `?level=`, `?build=par`, `?launch=1` bypass the level ladder | **PLAUSIBLE** | RECORDED, documented debug-only. The whole e2e rig drives the PRODUCTION build through exactly these params, so stripping them outside DEV would blind the suite while shipping nothing new. None mints progress: `gateNext` gates what the player EARNED (≥ 1 star), not what a URL can ADDRESS — no param forges a star, a save, or a share (Decision Log 2026-10-07; `Modules/src`). |
| 5 | The perf "gates" are prose-adjacent — tables printed, nothing could fail | **PLAUSIBLE** | FIXED: measurement B's tier medians now run against documented ceilings (`TIER_CEILING_MS` — high 100 / medium 70 / low 55 ms) and the HTML report carries per-tier artefacts. The gate met reality on Linux: SwiftShader measured high 351 ms, so software GL is RECORD-ONLY (annotations, deferred to a hardware GPU — standing item in Home Deferred) while hardware GL keeps the ceilings hard (darwin calibrated with ANGLE Metal: 2.5/2.1/1.8 ms, rendered loop 16.70 ms keep-up 1.00). The post-OFF stage-2 stepping gate stays hard everywhere. |
| 6 | The stall-retune (`STALL_SPEED`/`STALL_SECONDS`) moved the sim, not just the verdict — hash-neutrality was claimed without instrumentation | **REJECTED after attack** | Instrumented: the retune is status-only — across the swap the feel-track hash and the finish step are bit-identical (`tests/unit/world.test.ts` runs the drive twice under the old and new pair); the verdict movement is bounded at a **2-step / 0.483 s** margin and the branch never opens on a finishing run. Every par hash regenerates byte-clean. |
| 7 | The hazard grip field broke bit identity on dry paths (old shares drift) | **REJECTED after attack** | Uniform grip is bit-identical by construction (`x * 1 === x`, exact — not approximately), and a zone-free level passes no callback into the physics at all. All pinned par/share hashes (including `099403c7`) hold; `npm run pars -- --check` is the drift gate. |
| 8 | The keyboard-parity e2e drives fake seams, not real keys | **REJECTED after attack** | `tests/e2e/shell-truth.spec.ts` dispatches real key events on the BUILT page (kitchen01 built end-to-end with arrows + Enter only); focused buttons keep native Enter (the handler never `preventDefault`s). The only seam, `__gwTargetSocket`, exists to prove the VISIBLE marker moves rather than a silent index — it asserts, it does not substitute. |

## Residual polish ledger (from playtests H + I, 2026-10-06 — fresh eyes, both ran post-fix)

Nothing below blocks the stage; all seven are stage-4 polish tickets. Condensed quotes; full
evidence in `Sessions/2026-10-06 Playtest H confirmation.md` and `Sessions/2026-10-06 Playtest I
confirmation.md`.

1. **Silent world-click-place misses** — H: "a world-click at bottom-right silently did nothing;
   only the Place button placed that piece"; I: "world-click to place does nothing even when the
   ghost says 'fits here'".
2. **L02 discoverability (one tester)** — H: "Level 2 entirely… every chain the aim offered lost to
   the gap. Never found the intended 3-par build" (I cleared it in one try — a discoverability
   spread, not a blocker).
3. **Camera wall-bury at run end** — H: the chase ends "buried in the grey wall/table-edge just as
   the verdict lands".
4. **3 s Retry dead time** — H: "After Retry, the car sat at the start ~3 s with no run and no
   message".
5. **Zoom-tight chase** — I: "snaps hard-zoomed onto the car and chase-pans through woodgrain and
   soup-fog so you can rarely tell where you are".
6. **✗-mark legibility** — I: "the ✗ next to '2.77 s — par 2.40 s' only made sense after reading
   the stars line twice".
7. **Stale target line after the panel** — I: "the results panel leaves a stale 'target: end of
   finishCup' line on screen".

## Where the fixes live

Code + notes: `Sessions/2026-10-06 Stage 3 - review fixes` (visual split, grade dispose + leak
gate, determinism hard assert, perf ceilings + artefacts, software-GL record-only branch) and
`Decision Log` 2026-10-07 (three entries: CI-truth pass, URL debug affordances, software-GL
records-and-defers). Reconciled notes: `Modules/src`, `Modules/dev`, `Modules/render`,
`Modules/replay`, `Concepts/Performance`, `Performance/stage-3`.
