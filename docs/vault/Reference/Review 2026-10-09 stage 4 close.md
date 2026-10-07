# Review 2026-10-09 — stage 4 close

Scope: `git log stage-3..HEAD` (the four new rooms, cross-room campaign + save v2,
campaign unlocks, input/camera hardening, edit-side autosave, note phrasing,
short-window layout, fixture signal, stripe fix). Read-only review — nothing fixed.

## Verdict: **ship-with-follow-ups**, with one item to fix before the stage is
called green (F1). No blocker to the *product*; one blocker to the *evidence*.

F1 is a blocker on the claim, not on the build: the click-differential cells that
"pin the tooling laws as assertions" cannot fail. Everything else is a follow-up.

---

### F1 — Eight click-differential cells assert inside a `.catch()` that only logs; they pass when the click is inert
- WHERE: tests/e2e/playtest-y-clickdiff.spec.ts:208 (T0), :221 (T1), :236 (T2), :255 (T3), :277 (T4), :356 (T5), :383 (T6), :434 (T11)
- FAILS WHEN: the release path stops placing. `await expect(count(page), '…').toHaveText('1 of 3 pieces used', { timeout: 5_000 }).catch(async () => { await dump(page, …) })` — the `.catch` handler is `console.log` only, so a rejected `toHaveText` is *handled* and the test is reported green. Reproduced: `E2E_PORT=4331 npx playwright test playtest-y-clickdiff.spec.ts -g "T0|T11"` → `1 passed, 1 skipped`, and a minimal `.catch(() => console.log())` probe over a deliberately-wrong `toHaveText` reports `✓ passed` with the dump printed. Break `window`-level release routing, or `overCanvasAt`, and the whole matrix stays green. The commit message's "pinned as assertions" is true only for T9 and T10 (which assert event counts directly).
- FIX DIRECTION (not applied): rethrow after the dump — `dump(); throw err`.
- CONFIDENCE: high

### F2 — T11, the only cell guarding the below-fold release fix, is dead by construction
- WHERE: tests/e2e/playtest-y-clickdiff.spec.ts:414-441 (`test.skip(y <= 633, …)`)
- FAILS WHEN: the below-fold release path regresses and the cell never notices — it never runs. The shipped
  compact variant (`@media (max-height: 700px)` → `max-width: min(960px, (100vh-380px)*960/540)`)
  makes the canvas fit inside the fold at 1280x633, so `box.y + height - 10 <= 633`
  and the cell skips — verified in the run above (`- 1 skipped`). The
  coordinates-not-identity guard in `src/camera/build-camera.ts:overCanvasAt`
  (the X-round6 fix) therefore has **no test that can ever exercise it**.
- ALSO FAILS WHEN (product): any viewport where the canvas still runs past the fold
  (>700 px tall and a toolbar tall enough to push the canvas down) — the guard is
  live there and untested.
- CONFIDENCE: high (skip is observed, not inferred)

### F3 — A press that starts anywhere off the canvas and releases inside it places a piece
- WHERE: src/camera/build-camera.ts:509-521 (the `!press` branch of `release`) + `overCanvasAt` at :462
- FAILS WHEN: hold a piece, press **Launch / Rotate / Remove / a tray button**,
  drag into the world, release. The canvas never saw `pointerdown` (it is a canvas
  listener), so `press` is null, `overCanvasAt` sees `target === canvas` at a
  canvas point, and the release is classified as FRESH INTENT → `clickPlaceAt`
  places at the release point. No `click` fires in that sequence (down and up
  targets differ), so nothing else can veto it. It is the Q-item-6 class of bug
  ("left-drag places") arriving through a door the guard opened: the guard checks
  whether the *release* landed on a control, never whether the *press* began on one.
- CONFIDENCE: medium (mechanism read in code; not exercised in a browser)

### F4 — Panel `z-index: 6` puts the verdict panel's buttons over the sticky toolbar, in the one regime where the page scrolls
- WHERE: src/ui/shell.css:78 (with `#gw-builder-host` sticky at :31, `#gw-result-buttons { pointer-events: auto }` at :94)
- FAILS WHEN: a window taller than 700 px (compact variant off) with a toolbar
  tall enough to wrap the tray to extra rows: the page scrolls, the sticky toolbar
  rides over the stage, and the panel's Retry/Next row — the only part of the panel
  that takes pointers — sits on top of Launch/Remove, eating those clicks. My
  geometry for 1280x720 (panel button row ≈ viewport y 250 vs toolbar bottom ≈ 160)
  says it does *not* collide there, so this is the mirror image of the Z-round7 bug,
  reachable only with a narrow/wrapped toolbar or a very tall page. The short-window
  regime (≤700 px) is safe: `docHeight == viewport`, so the sticky bar never moves.
- CONFIDENCE: low (stated as a shape to check, not an observed failure)

### F5 — The panel's Next and the level select's unlock disagree for a returning player
- WHERE: src/boot.ts:1053 (`gateNext(model.stars)`) vs src/world/campaign.ts:133-139 and src/ui/levelselect.ts:118
- FAILS WHEN: replay a level whose star is already in the save (so the next rung
  IS unlocked on `?levels=1`), fail this run (0 stars), and the panel shows Retry
  only. Same save, two surfaces, two answers about whether bedroom01 is open. The
  save already carries the answer at :1017 (`bestStarsBefore`) and it is not used
  for the gate.
- CONFIDENCE: medium (deterministic from the code; cosmetic, not a bypass)

### F6 — Autosaved builds are restored on level geometry that has since moved
- WHERE: src/boot.ts:261-272 (`startBuildFor` checks `saved.levelId === level.id` and nothing else)
- FAILS WHEN: this stage itself re-tuned geometry under existing saves — bedroom02's
  B2 redesign (`9ca66c9`) and the L02 fail-timing re-cut (`588f1b4`) moved decks and
  tray/quota shape on levels a returning player has build bytes for. `builds[id]`
  carries no level-data stamp, so the stale piece transforms restore verbatim onto
  the new deck: the counters can read over the new tray allowance and the run is a
  build the current level cannot produce from the tray. Not corruption (the run is
  still deterministic) and `Remove` always unwinds it, but the restore path and the
  re-tuning landed in the same stage.
- CONFIDENCE: medium

---

## Hunted and found clean
- **Determinism.** The tray/notes plumbing (`actionableKindsFor`, `placedKindsFor`,
  boot.ts:398/:418) is read only where `resultModel` is built; nothing on the
  physics/hash path reads tray, save, `reducedMotion`, camera pose, or canvas size
  (`renderer.setSize(960, 540, false)` keeps the buffer fixed under the compact
  width cap, so the short-window layout cannot perturb the sim or the aim math).
- **Save v1→v2.** `MIGRATIONS[1]` passes `builds` and `settings` through untouched
  and only *adds* `progress`; garbage still degrades to a fresh save exactly as at v1;
  `stars` is deliberately empty (no minted trophies). `version > SAVE_VERSION` →
  fresh; unknown intermediate → fresh. No data-loss path found.
- **Unlock-rule bypass.** `reached` is written by the migrade only (grep confirms a
  single writer, save.ts:116); `rememberBuild` never touches it; `levelUnlock` is the
  single statement of the rule and `gateNext`/the level select both read it (modulo
  F5). `?level=` staying open is the recorded Decision-Log doctrine, not a leak.
- **Listener leaks across the 21-level tour.** Every level change is a
  cross-document search swap (boot.ts Next, levelselect.ts:118), so the per-boot
  listeners (`attachBuildView`'s 6 window listeners, the builder keydown, the two
  autosave flush hooks, the flip-animation rAF) are one-per-document, not
  one-per-level. `attachBuildView` is called exactly once per canvas (boot.ts:641)
  and `builder.attachCanvas` only stores references — no double-attach, no capture leak.
- **Vacuous new specs (other than F1/F2).** result.spec.ts hit-tests
  `elementFromPoint` per control and drives a real Next click; viewport-aim.spec.ts
  guards its sweeps with `expect(onScreen.length).toBeGreaterThan(0)` and its
  parity test fails when both targets are null; T9/T10 assert real event counts.
- **Fixture signal / stripe.** `buildTrackMeshes` signal path adds meshes and material
  clones only; `fixtureQuota` is the one classifier shared with boot; hashes untouched.

## Follow-up list
1. F1 — rethrow in the eight `.catch` handlers (or drop the catch and keep the dump in `testInfo.annotations`). *before green*
2. F2 — give `overCanvasAt` a viewport where the canvas still crosses the fold, or delete the guard's claim.
3. F3 — remember where the press began; an untracked release whose press began on a control is not place intent.
4. F4 — hit-test the toolbar's Launch/Remove with the panel open at a wrapped-toolbar width.
5. F5 — gate Next on `max(model.stars, bestStarsBefore)`, or hide the level-select unlock claim.
6. F6 — stamp `builds[id]` with the level's geometry revision (or the par hash) and refuse a mismatch.
