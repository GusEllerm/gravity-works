---
tags: [reference, evaluation]
livedocs: snapshot
---
# Evaluation 2026-10-13 — engineering round 4: the house era's laws under a crowbar, and what the freeform program grew on the shell

> [!abstract] Scope and method
> ROUND FOUR, paid to distrust everything since `940f57f` (the round-2 anchor, 8/10) — the freeform
> program (`src/tally/`, payload v2 in share/save, `settings.records`), the house (`house.level`,
> `house-frame`, `house-camera`, the pages/house front door), the camera v1/v2 hand-offs, the
> input-law wind productized into `World`, and the pixel-gate CI. Branch `eval-h4-eng` at `97c6a6b`.
> Method: 6 law mutations applied to `src/` (unit-side built by vitest; page-side by `npm run build`
> + targeted spec), each reverted (`git status` clean at close); 5 vacuity mutations of the NEW specs
> (spec-file only); a CDP 20-run downhill tour + a 20 re-release in-document tour; a node probe bench;
> a URL-juggling camera torture; a save-key write probe; `node scripts/gen-pars.mjs --check` (FAILS:
> 1 of 38 rows) with worktree replays at `dae6938` and `74f8ed7` for the root cause. Unit baseline:
> 55 files, 1016 passed. No repo code changed; this note is the only file added.

## Verdict: 8 / 10 robustness

Every one of the six mandated laws turned RED when re-broken — the house era's gates are REAL, not
HOLLOW, and the two biggest round-2 debts (N1 the CI-vacuous pixel gate, N4 the re-winding par) are
closed with teeth: the enforced-view list makes a missing linux baseline LOUD (mutation proves the
silent-skip hole it replaced), and 20 cross-document downhill runs sit at 16.9 MB heap / 109 DOM
nodes / receipt `6caea49b` TWENTY times with zero pageerrors. What keeps this at 8, not 9: the shell
re-learned the 1298-line lesson the wrong way — `boot.ts` is **2603** (+34% in 40 commits, the
`bootGame` closure ~2170 lines, 23 `__gw*` seams) — and the NEW front door repeats round-2's N3
verbatim: `bootHouse`'s frame loop never checks `boundaryStopped()`, the law `errors.ts` states, on
the surface every cold visitor now lands on (N1 below). One truth bug shipped: `pars.json` carries a
bedroom-sandbox par no build of the tree ever ran (3.15 vs 2.75 recomputed, root-caused to a
dirty-tree regeneration at `74f8ed7`), and the check gate that would have caught it is still not in
CI — the script's own docstring claims otherwise (N2).

## 1. Mutation ledger — the six laws' teeth (each applied → run → RED → reverted)

| Law | Guardian(s) | Mutation | Result | Verdict |
|---|---|---|---|---|
| THE INPUT LAW (wind as data) | `house-levels.test.ts` canonical row + wind-off probe | wind never resolves (`level.inputs && … && false` in `World` ctor) | **RED** — the canonical run approves fewer than 4 rooms; the wind-off probe stays green BY DESIGN (the other tooth) | **REAL** |
| Tally hash-neutrality | `tally.test.ts` §"hash neutrality" (atlas receipt `d32417dc` with/without the tape) | "cheap hash-on-read" — `state()` also folds the hash (the class of reach the law names) | **RED** — the tape-mounted run's hash leaves the plain replay | **REAL** |
| v1 links verify forever | `share-v1.test.ts` × `tests/fixtures/share-v1.json` | writer always stamps `"v":2` (retire the v1 writer — the plausible one-way door) | **RED ×4** — every fixture's now→v1 byte-stability fails | **REAL** |
| THE SEATING LAW | `seating.test.ts` (handle bits incl. generation) | drop the sim free+rebuild from `reset()` — the exact pre-fix remove/re-add shape | **RED ×5** of 6 | **REAL** |
| Ghost-mounting referee | node `ghost.test.ts` + page `ghosts.spec` / `downhill.spec` | a 0.02 impulse at the coupling line — the boot shell's `ghost.sync` seam, and separately the HOUSE page's | **RED** — shell mutation: 4 `ghosts.spec` tests RED; house mutation: the downhill's two hash tests RED. Honest nuance: the boot-seam edit left downhill GREEN — the page referees are surface-specific, and the NODE tests are structurally unreachable from page seams (they pin the wind's purity, which is real) | **REAL** (layered per surface) |
| Pixel-gate enforced-view | `visual.spec.ts` `CI_ENFORCED_VIEWS` + the `linux-baselines` bootstrap job | run the two enforced views with `CI=1` and NO baseline: **RED ×2** ("CI PIXEL TRUTH MISSING"); then empty the enforced set | mutated set: **GREEN via silent SKIP** — the exact darwin-clobber hole round 2 named, proven still reachable only by editing the list | **REAL** |

## 2. Vacuity probes — 5 NEW specs, one assert each (could the suite go green with a broken feature?)

| Spec | Assert gutted | Result | Reading |
|---|---|---|---|
| `tally.spec` | `granted.length >= 2` → `>= 0` | GREEN in-test | the badge-COUNT claim of the tail is one line; the word-asserts (`earned —`, `first `) survive it |
| `downhill.spec` | `s.hash === REF.hash` → `toBe(s.hash)` | GREEN in-test | but the same file's seating test compares `REF.hash` again — suite-level redundancy exists here |
| `chain.spec` | `toHaveCount(30)` → `count >= 0` | GREEN | the click-to-board test still requires a working first row; the 30 itself is one line |
| `front-door.spec` | tour `href` equality → `typeof h === 'string'` | GREEN | the TOURS-byte-compatible law hangs on ONE line, over a HARD-CODED room list (not derived from `CAMPAIGN`) — the weakest line found |
| `chain.test.ts` | wrong-game sweep asserts REMOVED **and** the foreign-refusal feature broken | **RED** — the sibling "honest refusal" test still catches the broken feature | LAYERED — this is what honest looks like |

Suite floor: 3 conditional skips in 66 spec files; the N8 drifters (`ghosts.spec`, `scratch-census`)
now ride `goto.ts` (zero raw `page.goto`); atlas still explicitly report-only; deploy still
main-only. `pars --check`: NOT in CI (see §4).

## 3. The house's runtime edges (measured, not asserted)

- **Memory, 20 downhill runs (CDP):** cross-document ×20 — heap 16.9 MB FLAT (first = last to the
  tenth), DOM 109 constant, hash-set size 1 (`6caea49b`), rooms 4 every run, 0 pageerrors.
  In-document ×20 re-releases: 15.9 → 18.0 MB — the bounded `traceCache` Map plus GC slack, not a
  monotone drift; the save stayed 143 B. No seam accumulates.
- **Parcel-probe cost:** node bench of the page's exact per-step probe over the canonical run —
  bare 0.0697 ms/step vs probed 0.0705 ms/step (**≈ +1.1%, ~0.6 ms for the whole 807-step run**),
  step counts identical (807 = 807, read-only confirmed by the run itself). Free.
- **Camera hand-offs, re-entry mid-flight (URL juggling):** launch → `?room=` → bare → launch →
  `?room=garage` bounced at ~2 s into live runs: every pose finite, fog finite, `status`/`steps`
  never bleed across documents, 0 pageerrors. The plan is pure over approval time, so a re-entry
  CANNOT corrupt it — and in-document, a mid-flight re-release advances exactly 120 steps/s (no
  double rAF through the `ended` restart). The windows are hidden during a run, so `openWindow` is
  unreachable while the camera owns the frame. This is the strongest surface audited.
- **Save keys (house + daily + chain):** no collisions — `settings.records` splits into `badges` /
  `lines` (`levelId@mm,mm,mm`) / `chain` / `houses` with distinct namespaces; every records writer
  fresh-reads before its merge-write (no long-lived snapshots found in `src/`); daily
  (`gravity-works.daily`) and premiere (`gravity-works.premiere.seen`) stay OUTSIDE the envelope by
  law; the house best round-trips a reload byte-identical. Residual (N3): `settings` is
  last-writer-wins BY LAW and the journal covers only the stamped maps — in a genuine sub-ms
  two-surface race a records object can transiently bury and NO journal restores it (builds/stars
  recover; `houses`/`lines`/`chain` do not).

## 4. The pars.json / gen-pars drift at bedroom-sandbox — root cause (item d)

`gen-pars --check` FAILS on exactly one row: shipped `parTime` **3.15** vs recomputed **2.75**
(51-level replay says 2.733 s, hash `63b8e23e`). The archaeology: the row was born CORRECT at
`dae6938` (committed 2.75, and that commit's own tree replays 2.733 — verified in a worktree);
`74f8ed7` (round-2 encore death-clock) regenerated the WHOLE file and shipped **3.15** — yet
`74f8ed7`'s own committed tree also replays 2.733 (worktree-verified). So the regeneration ran
against a DIRTY working tree mid-tune (the sandbox shares `kitchenRamp`/`BEDROOM_STRAIGHT`/
`KITCHEN_GAP` with the encore being retuned in that same session), and the commit bundled the stale
row. `448b47c` then "appended the house pars row" WITHOUT regenerating, inheriting the lie. The
drift survived four program waves because: (i) **`pars --check` is in NO workflow** (`ci.yml` runs
`replay:all`, `tally:sweep`, unit, e2e — the script's header claims "the check is run in CI"; that
sentence is FALSE today), and (ii) **no test consumes the sandbox row** — `stars.ts` reads it, but
no spec ever scores a sandbox run against pars, so a 3-star line that is 0.4 s too generous ships
silent. THE GATE: add `npm run pars -- --check` to the `check` job (same runner image as the
determinism tests, 0.05 ceil absorbs jitter — exactly the contract the script already states), AND
one unit tripwire: for every registered level, a declared inline `Level.par` must equal its
`pars.json` row (the level file's own comment said "measured 2.733" while the JSON said 3.15 — the
two claims of ONE truth were never compared).

## 5. Risk register (ranked: scenario → likelihood → what the player loses)

| # | Scenario | Likelihood | The player loses |
|---|---|---|---|
| N1 | **The front door ignores the freeze law.** `bootHouse`'s `frame` reschedules rAF with NO `boundaryStopped()` check — `farewell.ts:551` (round-2 N3's fix) and `share.ts:796` have the line, the shell's loop has it, the HOUSE page does not, and `error-boundary.spec` covers shell + farewell only. A throw behind the home screen re-throws every frame WHILE the reload face shows — the exact stutter shape the boundary exists to stop, now on the surface every cold visitor lands on. Law 4 shipped the beat on a disposed second `World` (records nothing — verified: `recordHouseRun` never sees a beat), so the beat itself is clean. | Low (any throw on home) | A stuttering error face on the front door. One line, mirror `farewell.ts:551`. |
| N2 | **`pars.json` can drift silent again.** The bedroom-sandbox row (3.15 vs 2.75) shipped through FOUR programs undetected; the regeneration-from-dirty-tree mechanism is a studio habit, not a physics event, and the check still gates nothing. Players get a too-generous 3-star line on one sandbox; the honesty cost is the disclosed-then-carried truth bug. | Certain (next retune wave, until CI'd) | Sandbox star truth + the audit's own receipts. |
| N3 | **The shell re-inflated.** `boot.ts` 1298 → 1949 (round 2) → **2603** — the extraction held at pages (3027 lines across 7 pages, `house.ts` a genuine 720-line page), but tally's run-end tail (`accumulateBadges` at 2128, the records reads at 1661/2151), the ghost/chain seams and the verdict wiring ALL landed inside `bootGame` (~2170 closure lines, 44 closure `let`s, 23 `__gw*` seams). Churn: most-touched src file in BOTH windows (10 of 119 since the anchor; 6 of 53 since 2026-10-12). THE FILE THE NEXT PROGRAM WILL HATE: the run-end tail block of `src/boot.ts` — the house result bar grows a tally tail, the chain grows a receipt, and each edit is a line inside the same 3,000-line closure. | Certain (trend) | Studio-side; the exit (`pages/*`, `ui/result.ts` 1249) exists — the run-end half has never been moved. |
| N4 | **Records are the un-journalable settings.** `settings.records` rides `settings` for the by-reference merge law, but `settings` is last-writer by law and OUTSIDE the journal's stamped recovery: a true simultaneous two-surface write (e.g. the sound flush merging while the house mints a best) can bury the other's whole `records` object transiently with no recovery path — builds/stars recover via the journal; houses/lines/chain do not. Defense-in-depth gap, same class as round-2's CAS honesty. | Low (sub-ms window) | A personal best, invisibly, in a two-tab minute. |
| N5 | **Single-tooth asserts on the new laws.** The tours-bytes law is ONE line over a hard-coded room list (not derived from `CAMPAIGN`); the tally badge-count, the chain's 30, and the in-test downhill hash each hang on one unbacked line (vacuity table). The wrong-game law is the model (layered); these are the same habit round 2's N7, narrowed. | Medium (a quiet edit) | One URL-byte compatibility or count claim, silently. |
| N6 | **The node ghost proof is page-blind.** The mounting law's node tests pin wind/rig purity but CANNOT see page-seam mutations (verified: a shell-seam leak is caught only by the right surface's spec). The referee family is honest per surface, but "mounting is neutral" now depends on the per-page coupling line staying one call — house, shell, share, farewell each have their own. | Low | Physics neutrality drifting on one unmapped surface. |

## 6. What is strong (evidence, not vibes)

- All six laws bit — including the one round 2 could not fully close (N1's CI pixel truth now REDS
  on a missing baseline on ANY runner OS, with the bootstrap job's committed `linux/` PNGs making
  the assert non-vacuous; `shell-home-idle` puts the NEW front door itself under enforcement).
- The house's architecture is the best in the repo: `house-frame`/`house-camera` are pure over the
  layout (the camera torture found nothing to find), the parcel probe is read-only AND free
  (measured), the beat is a stepped `World` of declared data disposed without touching a record,
  and the 51-piece append-only `house` level left the 37 anchors byte-identical (`replay:all` green
  at baseline).
- Records/chain/house-best save ergonomics are genuinely careful: validate-on-read everywhere, the
  chain rides untouched through tally writes, every writer fresh-reads, and the honesty sentence
  stays verbatim across four surfaces.
- The round-2 asks were all honored and verified here: farewell's boundary line (N3), the trace
  cache (N4), the `goto.ts` drifters (N8) — the program LISTENS.

## 7. The cheap fixes (not applied — evaluator does not fix)

1. `if (boundaryStopped()) return;` at the top of `bootHouse`'s `frame` (N1), + one error-boundary
   case on the bare route.
2. `npm run pars -- --check` in the `check` job + the inline-`par`-vs-`pars.json` unit tripwire
   (N2); regenerate the bedroom-sandbox row in the same commit.
3. Move `boot.ts`'s run-end tail (the result/tally/records block, ~2050–2160) into a module the
   way `pages/*` did for launches — start the shell-half extraction the 1298 lesson demands (N3).
4. Derive `front-door.spec`'s href list from `CAMPAIGN` and add one backing assert to the tally
   count and the chain 30 (N5).
5. Put the records maps under the journal's stamp law (`settings.records` as stamped sub-maps), or
   state the residual in `save.ts`'s law block so the next merge edit sees it (N4).
