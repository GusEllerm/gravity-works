# 2026-10-10 Program P3 — the final reds (SE lane, branch `p3-finalreds`)

Two CI reds at `af9d18c` (run 2026-10-10T02:31Z, 226 passed / 2 failed):
`tests/e2e/a11y.spec.ts:65` (Tab-walk, `keyboard.press` 30 s) and
`tests/e2e/cross-tab-save.spec.ts:75` (R9 race, page wedged).

## Root causes (measured, not assumed)

1. **The par ghost's wind was an EAGER boot tax.** `src/boot.ts` wound the
   level's par trace at level-load on EVERY game page (default ON), and
   re-armed a fresh full headless wind whenever a friend ghost was lifted.
   The slices ride `MessageChannel` tasks — clamp-proof for a backgrounded
   tab, but on CI's 4-core SwiftShader box every page boot across the suite
   fed the main-thread message queue, starving input/actionability round
   trips for specs (a11y's Tab-walk, R9's places) that never LOOK at the
   ghost. Reproduction needed CPU hogs + `E2E_SWIFTSHADER=1` + 4 workers;
   on an idle box the same pages finish the tape in milliseconds.
2. **The R9 race spec guessed the settling time.** The `waitForTimeout(800)`
   "let A's trailing writes land" wait raced a second, stranger interleaving
   the merge law does NOT cover: localStorage's cross-process
   read-after-write visibility inside one browser context (measured red
   ~1 run in 8 under contention: B's stale WRITE installed a merge whose
   DISK READ was blind to A's record — a different experiment than the
   stale INCOMING DATA the spec is named for).
3. **The farewell suspicion was checked and cleared**: the `FAREWELL_KEY`
   write is at the crane's FIRE inside `startFarewell` — once per ending,
   never per frame — and the result edge it rides is transition-guarded
   (`lastStatus === 'running'`). No change needed.

## Fixes

- **Lazy wind** (`armParGhost`/`ensureParGhost` in `src/boot.ts`): level-load
  ARMS; the tape turns at the first moment the car could be seen — first
  launch, explicit toggle, the premise beat's terminal edge — and lands
  mid-run via the existing `resumeRace` path. The bar says
  `winding the par line…` while it turns (`winding` joins the
  `__gwGhostState()` seam), and the finish dispatches `gw-ghost-ready`.
- **The save-write seam** (`noteSaveWrite` in `saveSave`): `__gwSaveWrites`,
  `__gwSaveWriteAt`, `gw-save-written` at every install. The race spec
  settles A's writer on the FACT (one+ writes past the placement, then
  silence) and then waits until B's OWN read carries A's record before the
  stale write — event/state-driven, no guessed window.
- **The race test's budget**: `test.slow()`, the burst twin's precedent
  (program 685461d) — CI's first attempt at this lane stayed 29.8 s: not a
  wedge (the visibility poll was live), just two software-GL boots + the
  debounce windows + visibility settle not fitting 30 s of wall-clock.
  The event waits were untouched.
- `winding` on `GhostState`; specs' budgets otherwise untouched.

## Proofs

- Both flaky specs + ghosts ×6 under CPU-hog contention + SwiftShader: green
  (the same combo went red 1-in-8 BEFORE the visibility fix).
- Unit suite 865 green; `replay:all` 30/30 byte-identical; full local e2e
  suite green under contention; branch CI green.
