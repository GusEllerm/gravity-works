---
livedocs: snapshot
tags: [session, program, stage-7, foundations, extraction]
---

# Program T0 extraction (feel engineer) — tracks T0.1 + T0.2 + T0.4 + R7

Worktree `gw-x1`, branch `p1-extract`, from `4fe0b9e`. The Track-0 foundation batch of
[[Action Plan 2026-10-09]]: extraction and honesty, zero player-visible change except the
new failure face. Gates held at EVERY step: `replay:all` 30/30, unit 791/791, full e2e
green (the suite grew 2 specs; no assert's meaning moved — only import paths did).
Preview lane port 4560/4561 (`E2E_PORT`).

## T0.1 — `src/ui/advice.ts` (the eight pure advice-data derivations)

`actionableKindsFor`, `placedKindsFor`, `flippedKindsFor`, `goalNounFor`, `stockedKindsFor`
+ the tray plumbing they stand on (`levelTray`, `levelTrayParams`) and `playerPieceCount`
left `src/boot.ts` VERBATIM (bodies and law comments byte-moved, header added). The unit
pins moved with them: `tests/unit/result.test.ts` and the six ladder tests now import from
`src/ui/advice.ts`; the assertions are untouched, and all 791 pass on the move. `bootGame`
and `trayParityBuild` import the derivations; the notes' "`in src/boot.ts`" bindings were
re-pointed (`Modules/ui`, `Modules/src`, `Modules/replay`, `Concepts/Levels`).

## T0.2 — `src/pages/share.ts` + `src/pages/select.ts` (+ `mount.ts`, `ui/dom.ts`)

The shared-run page (`bootSharedRun`, `wireShareCard`, `startReplayPlayer`, the chunked-wind
constants) and the level-select page left boot — the R6 "merge-war" file stops being the
only file. Behavior-preserving by construction: the SAME seams (`__gwReplayWind/Phases/
Trace/State/Pace/CarNdc/GoalNdc`), the SAME URL routing (`#s=`, `?levels`), the SAME
`verified`/`mismatch`/winding strings — the whole share/replay/select e2e lane went green
without a single spec edit. Two support moves keep the module graph acyclic: the set-mount
helpers the pages share (`levelSet`, `buildGameSet`, the `collectSetBoxes` guard walkers —
`setPlacementGuard`/`setCameraSolids` RE-EXPORTED from boot so their unit pin's import path
and documented surface are unchanged) live in `src/pages/mount.ts`, and the one-line live-
region factory `paragraph` moved to `src/ui/dom.ts`. boot.ts stood at 2153 → 1263 lines after this move alone.

## T0.4 — the error boundary + boot retry (R2/R3, ONE affordance)

`src/ui/errors.ts`: `window` `error`/`unhandledrejection` (NON-capture, so resource noise
never trips it) → flush the edit autosave FIRST (`registerAutosaveFlush` wired to the
game page's `createBuildAutosave`), freeze honestly (both frame loops check
`boundaryStopped()` before scheduling the next rAF — the R2 "silently stuttering world"
is structurally impossible now), and show one `#gw-error` overlay with Reload. Boot routes
every page through ONE `startPage` starter: a rejected set-chunk import or any throw before
the builder exists shows the SAME face with RETRY — never a half-page. The one design
truth learned on the way: a failed chunk fetch is cached as an errored module by the
browser's module map, so an in-page re-import can only reject again — Retry honestly
re-enters the DOCUMENT instead of pretending an in-page re-run could re-fetch.
`tests/e2e/error-boundary.spec.ts` is the proof: an `addInitScript` deferred throw lands
on the overlay with the status line FROZEN underneath (identical text across a gap — not
a stuck-ticking canvas), and an aborted `kitchen-*.js` chunk shows the Retry face (no
`#gw-builder` half-boot) and retries onto a live `ready` page. The `webglcontextlost`
hiccup stays the separate recoverable face it was.

## R7 — the ghost/ring lift

`Builder.liftFromScene()` (new seam) + one call in `rebuild` BEFORE `world?.dispose()`,
mirroring the set group's `removeFromParent` law: `World.dispose` disposes every mesh
material it finds, and the ghost and the target ring are the BUILDER's, created once —
left in place, every placement paid a shader recompile + re-upload for them.

## boot.ts line delta (honest)

2153 → 1298 lines (−855; T0.1 −142, T0.2 −748, T0.4 +31 for the starter/boundary wiring,
R7 +4, plus import churn). The file is now: registry addressing, build-derivation rules,
the campaign-nav glue, the router, and the game shell — the pages and the advice-data are
file-additions for every future feature.
