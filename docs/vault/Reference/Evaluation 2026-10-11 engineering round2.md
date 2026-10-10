---
tags: [reference, evaluation]
livedocs: snapshot
---
# Evaluation 2026-10-11 — engineering round 2: did the program's fixes survive contact, and what did the NEW code rot?

> [!abstract] Scope and method
> ROUND TWO of the eval-eng program, paid to distrust the close note (`Sessions/2026-10-10 Program close.md`),
> which claims R1/R2/R3/R5/R7/R8/R9 fixed. Branch `eval-eng-r2` at `940f57f`. Method: 15 mutations applied to
> `src/`, `npm run build` (each verified in `dist/` by the resulting RED), targeted spec runs, all reverted
> (`git status` clean at close); the FULL local suite as baseline (unit **883 passed**, e2e **242 passed / 1 skipped
> / 0 failed**, 3.0 min); a CDP 30-level ghost tour for the memory profile;
> `node tools/hash-atlas.mjs --check` (37/37 MATCH); churn numbers from `git log`. No repo code changed; this
> note is the only file added.

## Verdict: 8 / 10 robustness

Every claimed fix is REAL, not HOLLOW — each of the five mandated mutation probes (quarantine, error boundary,
CAS/merge, leak gate, visibility proxy) turned its spec RED, including the two mutations that stayed GREEN across
the whole suite in round 1 (M2 the visibility flush, M8 the gutted `World.dispose`). The new code
(`src/pages/*`, `src/ui/advice.ts`, `src/render/car-rig.ts`, `src/juice`) is materially better than what it
replaced: pure where it claims pure, the R7 lift law honored at every rebuild, listeners removed on the paths
that need removal, the ghost trace demonstrated RELEASABLE (30-level tour: DOM 162–172 constant, heap
13–62 MB oscillating with NO monotone drift — every rung is a fresh document; 15× toggle re-winds: 30.3 →
24.7 MB post-GC; 20× place with the ghost mounted: → 9.1 MB). Zero new data-loss findings. What keeps this at
8, not 9: the default-ON play-post stack's game-shell pixels are asserted NOWHERE on Linux CI (N1), the
`bootGame` closure has regrown almost to the old file's mass (N2), and the new specs keep a habit round 1 had —
a couple of single-edge mutations stay green where the doc claims an edge (`save-volume`, the `farewell=1`
forcing clause; N7), and one honest law-proof binds the exported merge, not the production one (N5).

## 1. Claimed-fix verification (mutation ledger, each applied → built → spec-run → reverted)

| Claim | Mutation | Result | Verdict |
|---|---|---|---|
| R1 quarantine (`p1-save`) | neuter the `quarantineRaw` call in `loadSave` (`&& raw.length < 0`) | `save-quarantine.spec` **"R1 repro: a parseable v3 save … quarantined, not silently wiped" RED** (unit quarantine trio also present) | **REAL** |
| R2/R3 error boundary (`p1-extract`) | delete the `window` `error` listener in `installErrorBoundary` | `error-boundary.spec` test 1 RED (no `#gw-error-reload` after a deferred throw); the Retry face (test 2) stayed green = untouched by this cut, as designed | **REAL** |
| R9 CAS + merge (`p3-crosstab`) | (a) `saveSave` installs FLAT (`JSON.stringify(data)`, the pre-fix envelope) | `cross-tab-save.spec` race (i) **RED** + 3 unit RED — exactly the spec's stated mutation proof | **REAL** |
| " | (b) drop `base`+`journal` from the production `mergeEnvelope` | e2e GREEN (the disk re-read covers the deterministic race) but **2 unit RED** (`stale-tab race`, `saveSave MERGES`) | REAL (layered) |
| " | (c) CAS-loop bypass (`if (current === raw \|\| attempt === 0)`) | **GREEN** — honest: nothing deterministically opens the sub-ms read→write hop; the retry loop is defense-in-depth with no test of its OWN, and the commutativity unit law binds `mergeEnvelopes` (the exported disk-disk merge), NOT production `mergeEnvelope` (N5) | REAL, with a proof-gap |
| R5 gate 1 — visibility proxy (`p1-gates`) | delete the `visibilitychange→hidden` autosave flush in `boot` (round-1 M2, then BLIND) | **`lifecycle-kill.spec` RED** ("a REAL background (app-switch, no pagehide) flushes the pending edit") — the mutation round 1 could not see is now seen | **REAL** |
| R5 gate 2 — leak gate (`p1-gates`) | gut `World.dispose`'s scene traversal (round-1 M8, then whole-suite BLIND) | **`shell-leak.spec` RED** (real shell place→remove cycles, renderer.info counters); `post-dispose` correctly stays green (post-stack-only, as its own doc says) — the exact hole is closed | **REAL** |
| R7 ghost lift | code audit + the leak gate green | `rebuild` lifts set, tray, car rig, **ghost** and juice before `world?.dispose()` (`ghost.liftFromScene()`, `attachScene(next.scene)` after); trace survives as data — verified in the tour | **REAL** |
| R8 volume debounce | remove the sound engine's `pagehide` persist flush (alone) → **GREEN**; remove BOTH lifecycle edges → **RED** | law guarded and durable, but via a redundant edge the spec's prose doesn't credit (N7) | **REAL** (edge-blind spot noted) |

## 2. New e2e specs — 6 sampled, one assert mutation-tested each (the vacuity probe)

| Spec | Assert probed (mutation) | Result |
|---|---|---|
| `ghosts.spec` | daily seed law: `dailySeed()` → `+1` in the boot wiring | **RED** (page hash ≠ Node hash at the day's seed) |
| `farewell.spec` | chip sweep: sweep list trimmed to `['gw-save']` | **RED** (`#gw-sound` survives the crane — the exact P4 leak) |
| `farewell.spec` | the `farewell=1` FORCING clause (`'1'` → `'one'`) | **GREEN** — masked by the unset-flag path in a fresh context; the forcing itself is unproven (N7) |
| `intro.spec` | the `intro=1` forcing clause | **RED** (2 tests — the beat never plays) |
| `p4-words-where.spec` | `placedWhereFor`: anchor-phrase assignment → `null` | **RED** (bedroom02's WHERE line loses its site) |
| `p4-chrome.spec` | compact canvas calc `(100vh − 310px)` → `200px` | **RED** (chrome rects ride the chip band at 633) |
| `save-volume.spec` | sound flush edges (both) | **RED**; pagehide alone GREEN (see R8 row) |

Suite floor unchanged and still honest: pageerror collectors everywhere, 1 conditional `test.skip` in 59 spec
files (viewport-conditional), atlas job explicitly report-only (`continue-on-error`, tee to the step summary —
read, 37/37 MATCH locally), deploy gated to `main` push only (no PR deploys).

## 3. New-code risk register (ranked: scenario → likelihood → what the player loses)

| # | Scenario | Likelihood | The player loses |
|---|---|---|---|
| N1 | **Linux CI never sees the game shell's post-ON pixels.** `post` is DEFAULT ON since T1.2, but `tests/visual/` commits a `darwin` baseline ONLY — the one game-shell pixel test (`shell-kitchen01-idle`, `?post=on`) hits `againstBaseline` → LOUD SKIP on ubuntu; the always-runs `againstExploration` trio captures the DEV HARNESS (`?harness=1&post=on`), which exercises the same `src/render/post` modules but NOT the shell's `createPlayPostStack` wiring (focus point, set-floor datum, per-set tokens, quality tier). A pass-through or mis-tuned PLAY stack is green on CI; `filmstrip` (the only other pixel sampler) has its own config and runs in NO workflow. Round-1 class ("green with a broken feature") — narrowed, not eliminated. | Medium (any play-post tuning wave) | The look every player gets, undetected until a mac human opens the page. |
| N2 | **`bootGame` regrew.** The 2153→1298 number is HONEST (measured 1298 at the extraction merge), but `src/boot.ts` is **1949** again 36 commits later and `bootGame` is still the ~1600-line closure (33 closure `let`s, 19 `__gw*` seams). Churn: **10 of the last 30** commits touch it (was 30/30; 18 of the 47 post-extraction commits). The pages extraction converted the WAR into skirmishes — daily/farewell/ghost each still landed 2–4 lines inside the shell closure, and nothing structurally stops 2153 by spring. | Certain (trend) | Studio-side: serialization continues on the shell's edge; the pages/advice/mount extractions show the exit exists — the SHELL half was never moved. |
| N3 | **The farewell crane is outside the freeze law.** `loop` in `src/pages/farewell.ts` reschedules rAF BEFORE its body and never checks `boundaryStopped()` — the law `errors.ts` states ("the frame loops of the game and the replay check THIS") is honored at `boot.ts:1429` and `share.ts:766` and MISSED here: a throw behind the farewell overlay re-throws every frame, exactly the R2 stutter shape. (Also: the crane builds SIX full sets in one document — the tour showed the ~60 MB transient peaks are survivable and freed by navigation, but the crane set geometries have no `dispose` beyond `renderer.dispose`.) | Low | A second, stuttering instance of the failure the boundary exists to stop; on weak GPUs, the 6-set peak. |
| N4 | **The par trace re-winds from zero on every toggle off→on** (`onToggle → ensureParGhost`, no cache), and first-launch pays the wind latency. Memory is PROVEN clean (15 re-winds GC back below the start; traces are plain typed arrays, released by cross-document nav — the 30-level tour showed zero accumulation); it is pure CPU, one full headless run per flip. | Medium (curious players) | Frames, not truth. |
| N5 | **The commutativity proof binds the wrong function.** Units prove `mergeEnvelopes` (exported disk-disk) commutative/idempotent; production writes go through `mergeEnvelope(raw, data, journal)` (3-input) — the shared `mergeStampedMaps` algebra is pinned, the PRODUCTION merge's composition order is not; mutation (b) above went e2e-green precisely because the two are not the same code. | Low (a future merge edit) | R9's algebra guarantee drifting from the code that ships. |
| N6 | **Flag/save edges.** The premiere/farewell/daily flags live OUTSIDE the envelope BY DESIGN (never ride export/import, never touch a hash — verified: zero call-site interaction with `saveSave`'s merge). Consequences: a device hop replays premieres; importing a finished save still ends in a one-shot farewell at the next porch05 clear; and the ghosts daily ASSERT computes the seed on two clocks (Node + page) — a UTC midnight crossing between the two `new Date()` calls flakes the seed law (streak/min laws are unit-pinned with injected clocks, so this is the ONE unguarded seam). | Low | A nagging ending on a new device; one theoretical midnight flake. |
| N7 | **Single-edge spec blinds, same old habit.** `save-volume`'s pagehide clause is masked by the visibilitychange edge (mutation GREEN); `farewell.spec`'s `?farewell=1` forcing clause is masked by the fresh-flag path (mutation GREEN). Both LAWS are guarded by adjacent mutations — these are the residue, not holes, but they are the same class the round-1 ledger named. | — | Future regression doorway, narrow. |
| N8 | **URL-family discipline drifts.** `goto.ts`'s rule ("specs that test the cinematic never import the door; non-visual riders all do") has two silent drifters: `ghosts.spec` (6 raw `page.goto`, so it rides the **post-ON** composer + SwiftShader with NO `test.slow` — every other run-completing spec got the 2026-10-10 CI-starve budget) and `scratch-census.spec`; `specUrl` also passes absolute URLs default-less (unused today). Also `farewell.spec` proves its reveal-order via a mutation latch (the right instinct) but its crane asserts never see the boundary law (N3). | Medium (CI load) | The ghosts specs as the next starve-red; a widened default-drift surface. |

## 4. Ghost memory profile (the tour the brief demanded)

30 rungs in ONE tab, each: load → `l` launch → par wind lands (`gw-ghost-ready`) → cross-document leave.
DOM nodes 162–172 CONSTANT; heap oscillates 13.5–62.5 MB with no monotone trend (bathroom02's NO-TRACE row was
a 15 s wind under evaluator load, not a leak). In-document: toggle re-wind ×15 → 30.3 → 24.7 MB after GC;
20 tray placements with the ghost mounted (trace survives rebuilds per the R7 lift) → 9.1 MB. The traces
DERIVE per level and RELEASE — per document by unload, in-document by replacing the typed arrays the moment a
new trace mounts (`setTrace` overwrites `this.trace`). No seam found where a 30-rung session accumulates.

## 5. What is strong (evidence, not vibes)

- The close note's claims all verified: every one of the seven claimed fixes turned RED when re-broken; the
  two round-1 blind spots are now mutation-caught gates with stated budgets; the R9 write path is
  merge+stamp+journal+re-read, and the deterministic race spec does its stated mutation honestly.
- The extracted modules are genuinely good: `advice.ts` imports neither renderer nor sim (the purity law is
  true by grep); `car-rig.ts` keeps the hashed-set law (the fallback box stays hidden in the graph);
  `daily.ts`/`farewell.ts` flags stay OUT of the envelope honestly and their laws are unit-pinned on injected
  clocks; `mount.ts`/`select.ts` are 100% extractions with the boot's surface unchanged.
- CI honesty mostly improved: atlas report-only BY POLICY (mismatch ≠ pass — it lands in the step summary),
  no deploy from PRs, one conditional skip in 59 files, the goto-family unit-tested and parameter-not-mutation.

## 6. The cheap fixes (not applied — evaluator does not fix)

1. Commit a `linux` visual baseline dir OR add one Linux-runs game-shell pixel assert through the EXPLORATION
   idiom (`/?level=kitchen01&post=on` vs a committed render, no skip path) — one shot closes N1.
2. One `if (boundaryStopped()) return;` at the top of `farewell.ts`'s `loop` (N3), mirroring `share.ts:766`.
3. Cache the par trace per (level, build) in the shell so the toggle flips are O(1) (N4).
4. Route `ghosts.spec`/`scratch-census` through `goto.ts` or add the documented `test.slow()` — finish the
   P3 audit's own list (N8).
5. Add a unit that proves `saveSave`'s PRODUCTION merge (`mergeEnvelope`) against the same algebra table
   `mergeEnvelopes` is proved with (N5), and, in the daily e2e, pass the day's `utcDateKey()` to BOTH sides
   of the seed computation (N6).
