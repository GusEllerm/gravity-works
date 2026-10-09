---
tags: [reference, evaluation]
livedocs: snapshot
---
# Evaluation 2026-10-09 — engineering: the shipped code's real robustness (eval-eng)

> [!abstract] Scope and method
> Independent adversarial read of the SHIPPED code, paid to distrust the green badge. Read whole:
> `src/boot.ts` (2153 lines), `src/world/world.ts`, `src/ui/builder.ts`, `src/replay/cinematic.ts`,
> `src/sound/sound.ts`, `src/save/save.ts`, plus all 45 spec files under `tests/e2e/` surveyed and
> eight mutation tests run. Everything below was MEASURED on branch `eval-eng` at `50102b3`:
> live probes through Chromium/CDP against a `vite preview` build (corruption matrix, real reloads,
> back/forward, heap sampling, blocked-chunk boot, offline reload, 390x844), and mutations applied
> to `src/`, built, spec-run, reverted (each verified present in `dist/` before the run). No repo
> code changed; this note is the only file added.

## Verdict: 6 / 10 robustness

The determinism spine is genuinely hard to break — `saveSave`/`loadSave` never throw, `World` disposes
its wasm, the context-loss hiccup overlay is real recovery, autosave survives a REAL reload (probe-verified,
not just spec-verified), back/forward through the share page lands honestly, memory is FLAT across 15
rebuild+launch cycles (10.7 MB → 11.8 MB plateau, DOM node count constant), and the 390x844 mobile viewport is
error-free. But the code is robust where its TESTS LOOK, and silent where they don't: the two failure
classes a shipped browser game actually meets — hostile storage and uncaught exceptions — have no
player-facing surface at all. One garbage byte in the save key silently deletes a thirty-rung career and
PERMANENTLY commits the wipe on the next mute click (`migrateBlob` → `freshSave` → the next `saveSave`).
An exception anywhere in the frame loop leaves a frozen canvas and a status line stuck at "running" —
no overlay, no message, console only. The suite's own honesty is high (6 of 8 mutations went RED in the
specs that claim the law), but its coverage map has holes exactly where leaks and mobile lifecycle live:
gut `World.dispose` and the whole e2e suite stays green.

## 1. The risk register (ranked: scenario → likelihood → what the player loses)

| # | Scenario (measured) | Likelihood | The player loses |
|---|---|---|---|
| R1 | **Silent total wipe of the save.** Any parse error, any unknown shape, any future `v` — `migrateBlob` returns `freshSave()` for the WHOLE envelope (measured: truncated JSON, a string `builds`, one bad build among good, `v:3`, a string `settings`, star `9`, array-builds — ALL → zero builds, zero stars). The next interaction (`saveSave` from `rememberBuild`/`persist`) commits the wipe. Verified live: a v3 save holding two banked stars was v2-fresh after ONE click of `#gw-sound-toggle`. No warning line, no backup key, and `downloadSaveFile`/`importSaveFile` — the designed escape hatch — are called by NO UI at all (grep: zero call sites outside `src/save/save.ts`). | Medium (one iOS storage kill, one beta-version visit, one Safari iDrive sync tussle) | All 30 rungs' stars + every saved build. Forever. With zero message. |
| R2 | **Uncaught exception mid-run = dead canvas, no honest state.** Zero `window.onerror`/`unhandledrejection`/error-boundary in `src/` (grep). Probe: an exception thrown in the rAF chain → ONE console error, then the loop is gone; canvas frozen, `#gw-status` stuck at "running — 1.05s", no panel, no overlay, nothing clickable about it. `frame()` schedules the next rAF on its FIRST line, so a PERSISTENT throw re-throws every frame — a silently stuttering world. The `webglcontextlost` path is the only error that wears a face. | Low-Medium (any one-shot NaN, a disposed resource, a driver quirk) | The run, the session's trust; the tab, if they reload mid-run without a build edit (stars only persist at the terminal edge, and the terminal edge is the throwing code). |
| R3 | **Boot data failure = half-page.** Probe: block the `bedroom-*.js` set chunk (flaky CDN / offline mid-open on a first visit) — the dynamic `import` in `buildGameSet` rejects, the `bootGame` promise rejects unobserved. The player gets: `h1`, an empty status line, a canvas with the warm frame, and NO builder, NO Launch button, no message. Same shape for any throw before `createBuilder` (e.g. a corrupt-but-parseable build reaching `canonicalBuild`). | Low-Medium (bad network on first paint — commutes) | The whole level, invisibly; there is no retry affordance to even learn a load failed. |
| R4 | **Offline = browser error page.** No service worker (grep). Reload a verified share page with the plane landed: `ERR_INTERNET_DISCONNECTED`. The autosave survives (localStorage), but nothing in the game opens offline, including the replay the share link PROMISES. | Medium (travel) | The share page promise itself; the session (not the save). |
| R5 | **Suite blindness where lifecycle/teardown live.** Mutations that stayed GREEN: deleting the `visibilitychange→hidden` autosave flush (12/12 `playtest-tu` green — spec T dispatches a SYNTHETIC `pagehide`; an app-switch kill on mobile is not exercised), and gutting `World.dispose`'s scene traversal (post-dispose + perf green — the leak gate only covers the POST STACK via the harness seam, never the game shell's per-edit `world?.dispose()`). Partial: the dev-preview mint gate is RED in `playtest-bb` but all 7 `campaign.spec` tests pass with the gate deleted. | — | Every one of these is a FUTURE regression doorway: the mobile-tab-kill data loss the flush exists to stop, and a per-place GPU leak, both ship invisibly. |
| R6 | **`boot.ts` merge-war gravity.** 2153 lines, ~10 responsibilities (registry, set mount, build-derivation rules, advice-data, campaign nav, router, share page, replay player, game shell, framing, status copy), and the number that indicts it: **30 of the last 30 commits touched it** (63/278 all-time; every boot-touching commit also averages 4.2 `src/` files — the cross-cut is the norm). `bootGame` alone is ~1000 lines with ~25 closure variables and 24 `__gw*` seam registrations inline. A 200-line feature has nowhere to live that does not edit this file in 3–6 places — and 53 of its `playtest`-citing comments show it is where every fix lands. The blame answer to "who fears this file": anyone who has ever opened the game page. | Certain (already the status quo) | Not the player's — the studio's: every concurrent staffing wave serializes through one closure. |
| R7 | **The builder's ghost is disposed by the physics world on every edit.** `setScene` adds `ghostGroup`+`marker` INTO the world's scene; `rebuild` calls `world?.dispose()` on that scene — `THREE.Mesh` traversal hits the ghost and the target ring and disposes their geometry+material once per placed piece. It works (three lazily re-uploads/recompiles) but pays a shader recompile + re-upload per placement. | Certain | A placement-time hitch budget on weak GPUs; no correctness loss (measured flat heap). |
| R8 | **Volume slider = a full save write per input event.** `setVolume` → `persist()` → `loadSave`+`saveSave` per `input` event while dragging — dozens of serialize-validate-stringify round trips per second, undebounced (mute correctly persists once per press). | Certain (when used) | Frames while dragging; no data loss. |
| R9 | **Cross-tab overwrite.** `rememberBuild`/`persist` are load-merge-write with no lease; two tabs on different levels racing bursts can drop one tab's record (last writer wins the envelope). | Low | One tab's latest build, silently. |

## 2. What is actually strong (evidence, not vibes)

- `save.ts` NEVER throws: `loadSave`, `saveSave`, `migrateBlob`, `deserialize` round-trip validated against seven hostile blobs live; the v1→v2 migrades are honest archaeology; `rememberBuild` refuses garbage rather than storing it.
- Autosave law holds on REAL navigation: probe B — keyboard-place, 60 ms, real `reload()` — "1 of 3 pieces used" restored; mid-run reload restores the build ("ready — 1 of 3"). `pagehide` is real, not just spec-synthetic.
- Back/forward: game → share (verified) → back lands on a live game page (running, canvas, Launch), forward re-verifies the hash. The `hashchange`→reload rule is guarded by a red-mutation-proofed spec (M7 red).
- Memory: CDP `Runtime.getHeapUsage` per cycle — boot 10.73 MB → 5 cyc+5 runs 11.69 → 10+10 11.80 → 15+15 11.81 MB, plateau, DOM nodes flat at 144. `World.dispose` frees the Rapier world; the replay page's trace is bounded typed arrays. Level switches are cross-document navigations by design, so the 30-rung tour cannot accumulate at all.
- The context-loss contract (`webglcontextlost` preventDefault + overlay + `forceContextRestore`) is the right shape for the one failure mode browser games genuinely cannot prevent.
- Share verification stays honest under every hostile input tried (bad fragment → "invalid share link"; WebGL failure → headless fallback settles the verdict).

## 3. Mutation ledger (8 mutations, built + spec-run + reverted on this branch)

| # | Mutation (src) | Spec run | Result |
|---|---|---|---|
| M1 | `startBuildFor`: drop the `saved.levelId === level.id` guard | `playtest-tu` no-leak | **GREEN** — the guard is dead code behind `savedBuild`'s keying; defense-in-depth with no test of its own (harmless today, a hole if a loader ever bypasses the key) |
| M1b | `savedBuild`: return any record instead of the keyed one | `playtest-tu` no-leak | **RED** — cross-level restore caught |
| M2 | delete the `visibilitychange→hidden` autosave flush | `playtest-tu` 12 tests | **GREEN — blind** (synthetic `pagehide` only) |
| M3 | `setMuted`: drop `persist()` | `sound.spec` mute-across-reload | **RED** |
| M4 | `clickPlaceAt`: neuter the aim-or-speak reach law | `stage5-bb-feel` item 3 | **RED** |
| M6 | delete the dev-preview no-mint gate | `campaign.spec` 7 tests, then `playtest-bb` | **GREEN there / RED in bb** — guarded, but not by the spec whose header claims the law |
| M7 | delete the `hashchange`→reload rule | `share` + `replay` | **RED** |
| M8 | gut `World.dispose`'s scene disposal | `post-dispose` + `perf` | **GREEN — blind** (leak gate is post-stack-only) |

Suite philosophy, positively: the pageerror-collector idiom is near-universal (34/45 specs fail on ANY console error — an honest floor), the `waitForTimeout` count is low (33 across 190 tests), and the feel-suite mutations the studio ran on itself (HOVER_PX, queued-click) show the mutation discipline exists — it just stops at the teardown and lifecycle edges.

## 4. The cheap fixes the evidence points at (not applied — evaluator does not fix)

1. A 40-line `window.addEventListener('error'/'unhandledrejection')` in `boot`: freeze honestly — one overlay, "something broke — reload", flush the autosave first. (R2, R3.)
2. `migrateBlob`: before returning `freshSave` for a parseable-but-unusable blob, stash the raw string under `gravity-works.save.corrupt-<n>`; surface ONE line ("old save moved aside — import from Settings"). The export/import functions already exist; they need a settings row, not a rewrite. (R1.)
3. One e2e that kills the page for real (`Browser.setPageVisibility` via CDP, or a two-context app-switch analogue) and one game-shell leak gate reusing the post-stack counter idiom around `rebuild()`. (R5.)
4. The `rebuild` dispose order: lift `ghostGroup`+`marker` out of the scene before `world?.dispose()`, exactly like `setInstance?.group.removeFromParent()` already does for the set. One line, mirrors an existing law. (R7.)
5. Debounce `setVolume`'s persist like the build autosave already does. (R8.)
6. The extraction that ends the merge war is already visible in the file: the three pages (`bootSharedRun`/`startReplayPlayer`, `bootGame`, level select) into `src/pages/`, and the eight `*KindsFor`/`goalNounFor` advice-data derivations (pure, standalone, unit-pinned) into `src/ui/advice.ts`. Neither move touches behavior; both turn most future features into file-additions instead of `boot.ts` line wars. (R6.)
