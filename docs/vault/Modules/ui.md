---
livedocs: module
tags: [module, ui]
---
# Modules/ui

> [!abstract] Role
> The builder UI (brief §9.1): tray, socket snapping, ghost, budget counter. Plain accessible DOM so the stage-6 a11y pass extends rather than rebuilds it. Owner: Systems Engineer.

## What it does

`src/ui/builder.ts` — `createBuilder(host, { level, build, tray?, trayParams?, solids?, onChange })` renders `#gw-tray` (a real `<button>` per kit kind from `PIECE_KINDS`, `data-kind`, aria-pressed), `#gw-piece-count` ("n / budget pieces" — **n counts TRAY placements**, never built-in fixtures), `#gw-ghost-state` (EMPTY when nothing is held — the literal word "hidden" never reaches the screen), `#gw-target-label`, and the `#gw-place` / `#gw-rotate` / `#gw-remove-piece` / `#gw-launch` buttons. Tray gating (brief §9.3): with a `tray` map, kinds outside it are aria-disabled with a reason `title`, a kind's placements are capped at its tray count, `playerCount()` is the budget/result tally, Remove never deletes a fixture, and the held kind is SEATED with the level's tuned `trayParams` (derived in `src/boot.ts` from each kind's first `parBuild()` placement — kit DEFAULTS would build a different gap than the level was par'd on). It owns no physics: every mutation hands the canonical `Build` to `onChange`; the shell rebuilds the `World` (`src/boot.ts`).

Placement model: the track is a socket graph. `targets()` lists open sockets (unoccupied `startSocket` + piece exit sockets nothing is joined to within `JOIN_TOL`); arrows cycle targets and kinds, `R` toggles forward/reverse seating, Enter places, Delete removes. Forward seating is `fitSocket` (the contract's exact seating) and the `snapSocket` gate decides the ghost's colour — green `snapped`, amber `seated` (a reverse mount is a half turn about the target's up: deck lines still match, tangents deliberately do not, so the gate reports it honestly), red `invalid`. The ghost itself is a translucent mesh of `pieceGeometries(kind)` in the world's scene (`setScene`).

Set-aware guard (stage-3 wiring): an OPTIONAL `solids` option (an array of `THREE.Box3`s the shell extracts from the mounted set's solid dress via `setPlacementGuard` in boot — counter and FILM layers excluded). When the ghost's piece box intersects a solid (2 mm tolerance), the state reads `blocked` (red) and `place()` refuses. AABB-vs-AABB on ghost update only — nothing per frame, no raycasts. Kitchen03's bowl-rim socket is the reference case (`set-wiring.spec.ts`).

## Stage 3 additions (result screen, callouts, help drawer — brief §9.1, §9.3)

`src/ui/result.ts` — the end-of-run panel, shown by `src/boot.ts` ONLY on a terminal status (§5.11: no panels over the set during a run). `createRunRecorder()` samples the `WorldState` stream and keeps five witnesses — apex (highest point + speed there), touchdown pitch, final airtime, last-grounded pitch, last speed-gain time — all derived from state `World` already reports; `physicsNote(result, evidence)` prints the one-line failure note (§9.1) and `resultModel` pairs it with `starsFor` (see `Modules/world`); `starGlyphs` is the one ★/☆ readout shared with the share card. A finished run gets no note. `createResultPanel(host)` builds `#gw-result` (`#gw-result-stars` — a `role=img` ★/☆ readout — `#gw-result-time`, `#gw-result-pieces`, `#gw-result-note`) inside `#gw-stage`.

The note's coverage map — every line is a function of evidence that exists today; `World` reports `finished`/`fell`/`stalled`/`timeout` and `hazard` joins with the kitchen props (the `hazardsTouched` field and its line exist now so the note cannot lie when it does):

| failure | witness that fires | line |
|---|---|---|
| any + `hazardsTouched > 0` | the count itself | "a hazard took the run" (which one, once props name themselves) |
| `fell` | touchdown pitch < −20° (`pitchOfQuat` at the air→ground transition) | "landed nose first" |
| `fell`/`stalled` | climb > 2 cm AND apex speed < `sqrt(g · climb/2)` — the contact-at-apex floor with the ring radius read off the climb: a computed bound, not a tuned knob | "too slow at the top of the loop" |
| `fell` | final airtime > 0.35 s | "flew off after a long jump — the gap outran the landing" |
| `fell` otherwise | — | "fell off the set" |
| `stalled` | last-grounded pitch > +10° | "ran out going uphill" |
| `stalled` | a recorded speed gain exists (the last-force-locates witness: the last time speed rose) | "ran out of speed after its last push" |
| `stalled` otherwise | — | "ran out of speed on the flat — friction won" |
| `timeout` | — | "never made it — past the time limit" |
| anything unexplained | — | the catch-all; the note never guesses (§11) |

`src/ui/callouts.ts` — the §9.3 first-sight system: `PIECE_CALLOUTS` (one line per kit kind — the physics job the picture cannot show) plus `PROP_CALLOUTS` keyed `prop:<name>` for set prop modules to register into; `firstSight(id, store)` returns the line exactly once per player, recording the id in `SaveSettings.calloutsSeen` (`src/save`). `src/boot.ts` fires it with the kind of the first piece ever placed of that kind.

`src/ui/help.ts` — `createHelpDrawer(host, { unlocked?, reducedMotion? })`: `#gw-help-toggle` opens `#gw-help-list`, one `li#gw-help-entry-<id>` per unlocked manifest entry (title + the same one-liner), and ONE shared mini-harness canvas (`#gw-help-canvas`, `preserveDrawingBuffer` so QA can read its pixels) draws every entry's mesh spinning in its own cell via per-cell scissor/viewport — not a renderer per row. The spin rides the fixed 12 Hz stop-motion clock (§5.7): `spinAngle(t) = floor(t·12) · SPIN_STEP`; `reducedMotion` (save setting or the media query) renders one still frame at `STILL_ANGLE` and starts no loop. The renderer is created lazily on first open, and a no-WebGL browser degrades to the text list rather than erroring. The COLLAPSED state ships `hidden` AND `display: none` together — the inline `display: grid` used to override the UA's `[hidden]` rule, so the drawer rendered permanently expanded on the deployed page (deployed-page fix, 2026-10-07; the e2e asserts the collapsed style, not just the attribute).

`src/ui/shell.css` — the interim shell skin (deployed-page fix 2026-10-07, ~25 lines, imported by `src/main.ts`): sans system face, canvas full-width/height-auto, tray as one flex row, visible run-status line. Deliberately not a theming system — the stage-6 UI pass replaces it.

## Guarded by

`tests/e2e/builder.spec.ts` (13 tray buttons, hover→ghost, place/remove move the counter, rotate reports `seated`/`snapped`, zero console errors). The expected piece counts in that spec are DERIVED — `FEEL_TRACK_KINDS.length` and `FEELTRACK.budget` — not hand-mirrored, so adding a piece to the feel chain can no longer leave the e2e stale (stage-2 review blocker: a hardcoded `8 / 16` broke CI when the chain grew to 9). Budget overflow refuses placement; keyboard focus rings are stage 6, roles/labels are already real.

Stage 3: `tests/unit/stars.test.ts` (the three star lines + every row of the note's coverage map + the recorder deriving witnesses from a sample stream), `tests/unit/callouts.test.ts` (manifest covers all 13 kinds one-line-each; `firstSight` goes quiet through the save), `tests/e2e/result.spec.ts` (`/?launch=1` finishes the feel track — panel hidden DURING the run, visible after with `★★★` and the time; the help drawer opens, lists ≥ 5 pieces and its canvas renders track-orange pixels, not black), `tests/e2e/shell.spec.ts` (kitchen01 boots EMPTY of tray pieces with the tray gated to its three kinds and no literal "hidden" on the page; building all three through the real UI finishes the level and the result panel lands IN THE VIEWPORT with a star).

## Depends on / used by

`src/track` only (snap/pieces/socket) — never `src/physics`. Used by `src/boot.ts`.
