---
tags: [session, program, stage-7]
livedocs: snapshot
---

# Program T0 gates — 2026-10-09 (Systems Engineer, T0.5 blindness gates)

T0.5 of the Action Plan 2026-10-09 landed the two mutation-BLIND spots [[Reference/Evaluation 2026-10-09 engineering]]
named (R5, ledger M2/M8), gates-first, with the teeth the old specs lacked. **Gate 1 — the lifecycle kill**
(`tests/e2e/lifecycle-kill.spec.ts` + unit half `tests/unit/lifecycle.test.ts`): the honest CDP probe on this
surface (Chromium 153) found `Emulation.setVisibilityStateOverride`/`Page.setPageVisibility` ABSENT,
`Page.setWebLifecycleState` limited to frozen/active, `Browser.setWindowBounds` minimize inert, and Playwright's
multi-window tab model never reporting hidden — headed included — so NO automation-reachable real page→hidden
transition exists, confirming the pacing crew's finding; the gate therefore drives the closest REAL-kill proxy
(`document.visibilityState` → 'hidden' plus a genuine `visibilitychange` dispatched at boot's own listener —
never a synthetic `pagehide`, whose absence the spec asserts) with the residual stated: the dispatch is
untrusted and the state getter is an own-property shim; only the deleted LINE is exercised faithfully, and a
startup probe upgrades to the real second-tab steal wherever one exists. Mutation proof: deleting boot's
`visibilitychange → hidden` flush turned the spec RED at the flush assertion (the pending remove stayed lost,
"1 of 3" never reached) and green again on revert. **Gate 2 — the game-shell leak gate**
(`tests/e2e/shell-leak.spec.ts`): 4 real place-all/remove-all rounds on kitchen01 (24 `rebuild()` →
`world.dispose()` cycles, every world drawn before the next edit so uploads are honest) measured through the
one-line WebGL-boundary seam `__gwRendererInfo` (`renderer.info` triple) added to boot beside the other seams;
green drift is EXACTLY zero on all counters (programs 8→8, geometries 47→47, textures 0→0 warm), budget +1/+2/+1
stated as one notch of slack; the mutation that gutted `World.dispose`'s traversal ran it RED at geometries
98→251 (+153 over baseline) while the OLD `post-dispose` gate stayed green under the same mutation — the exact
blindness R5 measured. Suite: vitest 792/792 (incl. the new unit lifecycle contract), `replay:all` 30/30
verified, full Playwright suite green; src touch is the one seam line (flush law and `rebuild()` unchanged —
extraction-crew coordination by commit note, not by restructuring boot).
