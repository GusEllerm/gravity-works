---
livedocs: snapshot
tags: [session, stage-3, systems-engineer]
---
# 2026-10-07 Stage 3 — shell readiness

> [!abstract] Role
> Session snapshot for the Systems Engineer's playtest-readiness pass on the
> deployed game shell (`https://gusellerm.github.io/gravity-works/`): the
> camera that framed the counter instead of the track, the tray that ignored
> the level budget, the result panel that "never appeared", the literal
> "hidden" in the status area, and the empty-vs-par-build question — which
> was the root finding: the shell SHIPPED THE TUTORIAL PRE-BUILT.

## What shipped

- **`src/boot.ts`** — the game's starting build is now `initialBuild(level)`:
  the level's built-in FIXTURES only (ramp, cup, the L03 rim pair — filtered
  from `parBuild()`), tray pieces loose in the tray (the deployed page mounted
  `placeholderBuild()`, i.e. the whole par build — the tutorial came pre-played
  and the counter said "5 / 3 pieces"). `?build=par` re-mounts the reference
  build for the test rigs (the `?launch=1` hook is unchanged). Static framing
  boxes the TRACK group alone (`frameCamera` + a new `group.name = 'track'`
  in `buildTrackMeshes`) — the scene-wide box centred on the mounted set and
  the 6 m ground plane, which is how a small kitchen line became a cream
  void. The builder DOM moved ABOVE the canvas: a focused Launch button
  below the fold scrolls the whole world — and the result panel over it —
  off-screen, which is the actual cause of the "panel never appeared" report
  (the show/hide wiring was correct; `?launch=1` never triggered the scroll,
  which is why the e2e passed while the deployed page "failed"). Result and
  status piece counts go through `builder.playerCount()`; tray placements
  are seated with the LEVEL's tuned params (`trayParams`, derived from each
  kind's first `parBuild()` placement — kit defaults built a DIFFERENT gap
  than the level was par'd on: the built-it-and-it-fell finding); the game
  renderer got `preserveDrawingBuffer` (the QA pixel-probe convention the
  help drawer and harness already use); the §7.3 run camera is wired (§7.3
  below).
- **`src/ui/builder.ts`** — tray gating: with `tray` the non-tray kinds are
  aria-disabled with a reason `title` ("not in this level's tray"), per-kind
  stock is capped (`no drop left in the tray`), the counter reads TRAY
  placements over budget, Remove never deletes a fixture, ArrowUp/Down skip
  locked kinds, and the ghost-state line reads EMPTY instead of the literal
  word "hidden" (finding 4 — that was the string). `playerCount()` is the
  new tally seam; `place` refuses per-kind and budget with concrete copy.
  `GhostState` keeps its internal `'hidden'` value (unit-tested vocabulary);
  only the DOM readout stopped printing it.
- **`src/world/world.ts`** — the track mesh group is named `track` (framing
  seam, nothing else reads it).
- **Tests** — `tests/e2e/shell.spec.ts` (2: boots framed with a pixel probe
  > 1 % non-background, empty of tray pieces, exactly the 3 tray kinds
  enabled + 10 disabled with reasons, no "hidden" text anywhere; then
  places lip→drop→landing through the real builder, CLICKS launch (the
  focus-scroll regression), and asserts the result panel lands inside the
  viewport with ≥ 1 star and the tray-piece tally "3 pieces"). `builder.spec`
  ghost copy updated (`hidden` → empty); `set-wiring.spec`'s two finish
  tests now pin `&build=par` (they test the reference build), and the L03
  guard test drives the new fixture-only default boot (3 ArrowRights to the
  rim socket, ghost still `blocked`). `tests/unit/boot.test.ts` grows the
  `initialBuild` claim (fixtures-only for kitchens, full build for the feel
  rig). Suite: 209/209 unit, 19/19 e2e (`E2E_PORT=4205`), typecheck and
  `pars --check` clean.
- **Notes reconciled**: `Modules/camera.md` (integration status flipped —
  wired), `Modules/src.md` (default-boot semantics), `Modules/ui.md` (builder
  signature + tray gating + shell.spec guard lines).

## Verdicts on the five findings

1. **Camera / cream void — real, fixed.** The `center`/`span` included the
   mounted set and the ground plane; now the static camera frames the track
   bbox with margin, and during a run the RunCamera follows the rail
   (screenshots: idle frames ramp→cup over the counter; mid-run is the toy-
   canyon rail view leading the car). The set is visible scenery, not the
   subject.
2. **Tray ignoring the budget — real, fixed.** Gating + counter as above;
   verified live (10 disabled with reasons, "0 / 3 pieces" at boot).
3. **Result panel never appeared — misdiagnosed upstream.** The wiring and
   the DOM were fine; the button-click focus scroll moved the canvas out of
   the viewport. Fixed by the layout order + asserted in-view in shell.spec.
   Stars render (pars exist; a built kitchen01 shows `★★★`).
4. **Literal "hidden" — real, fixed.** Sole source was `#gw-ghost-state`
   printing its state word; empty now. No other site (grep-clean, and the
   spec asserts the page contains no "hidden").
5. **Empty-vs-par build — the big one, confirmed.** boot mounted
   `placeholderBuild()` (= `parBuild` for kitchens) as the STARTING build;
   per Concepts/Levels ("the player places them"; fixtures are BUILT-IN) the
   game now boots fixtures-only with a full tray, keeping `?build=par` for
   rigs. Player-built kitchen01 finishes (2.13 s, `★★★`).

## RunCamera decision

WIRED, not deferred. It was ~30 lines of shell: `KitRig` per rebuild is
already a `RunCameraSource`; the loop calls
`runCam.update(FIXED_DT, rig.nearestArc(state.car.pos), state.car.speed)`
per fixed step, `snap`s at launch, and the run cam owns the camera transform
during the run and its freeze-frame; static track-framing owns the table
between runs; empty builds (no rail) stay static. `Modules/camera.md`'s
"does NOT drive it yet" paragraph is flipped to match.

## Blockers / carry-outs

- **Physics hash is collider-ORDER-sensitive** (measured): the player-built
  kitchen01 is geometrically the par line but hashes `c97b86b6` vs the par
  build's `b4d7c637` (different pieces-array order), and a relaunch after
  `reset()` can drift a few steps (2.15 s vs 2.21 s) — Rapier body/collider
  allocation order. Both FINISH identically; shares/replays of the same
  build array stay bit-exact (all pinned-hash tests hold with `?build=par`).
  Flagging for the Feel Engineer — canonicalise build order in `World.reify`
  if any hash claim ever depends on build-order equality.
- **`trayParams` takes each kind's FIRST par placement** — L03's second
  `straight` (0.2 m) would seat with 0.1 m params; per-SOCKET tray params
  are a level-shape question for the LD (kitchen01/02/04/05 are unaffected —
  one param set per kind).
- Set-side camera rigs (`setCameras` data) remain the EA's seam; the help
  drawer, callouts and share pages were untouched.
