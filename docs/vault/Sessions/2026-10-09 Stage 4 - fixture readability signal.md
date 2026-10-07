---
livedocs: snapshot
---

# Stage 4 — fixture readability signal (deck-inlay) — environment artist

Handoff from [[2026-10-09 Stage 4 - K5 booster + fixture reading]] §3: pre-placed
FIXTURE pieces read as scenery (playtest Q ignored functional fixtures on K2/K3).
Fix is the data-level MATERIAL signal, not a repaint and not level data.

## The signal

ONE shared treatment on every fixture-piece occurrence across all five sets:

- `buildTrackMeshes(build, { fixtures })` (`src/world/world.ts`) — the level's
  `fixtures` table drives the render, classifying occurrences with the SAME
  `fixtureQuota` rule the boot mount uses (moved into `src/track/build.ts`,
  `src/boot.ts` re-exports, so mount/parity/counter/render can never disagree).
- Every fixture-piece material carries `userData.fixtureSignal = 'deck-inlay'`
  (`FIXTURE_SIGNAL` in `src/track/material.ts`) — the checkable half.
- The visible half is a narrow deck-centreline INLAY ribbon (`fixture-inlay`
  mesh): track orange lifted in lightness only (#FF7A1A → #fbb07a, Art
  Bible §Color — never a re-hue, never a repaint), on the running surface,
  solid runs only (never bridges a gap), 45 % of the deck width, +0.8 mm lift,
  DoubleSide + camera-facing polygonOffset (without the offset the coplanar
  deck wins the far pixels and the stripe vanished down the K2 chute).
- The table reaches every plain-material render path: `World` (game page)
  passes the level's table; the `kitchen-set` harness level seam passes it (so
  `&level=` wiring stills carry it); the share card resolves the registered
  level's table. No table → the exact old render (worldsmoke, unknown levels).
- `PlacedPiece`, `serialize`, `rigFingerprint` untouched: `npm run pars --
  --check` clean — every hash/par unchanged by construction.

COVERAGE PROOF: `tests/unit/fixture-signal.test.ts` (25 tests) — every campaign
rung's `fixtures` table × `parBuild` through `buildTrackMeshes`: all fixture-piece
mesh materials flagged, one inlay each, no tray-piece material flagged, flagged
count == quota sum, no-table renders plain, serialization carries nothing.
Unit suite 564 green; typecheck green; full e2e 74 green; filmstrip gate green.

CENSUS (one check, `tmp/fixture-signal/signal-census.mjs`): each dev frame is
compared against the SAME URL rendered from a HEAD worktree (no signal), so the
differing pixels are the signal's own footprint:

    kitchen02-signal.png     changed  842  lifted-orange 519  mean Δb 37.0   (hero harness, 1600x900)
    bedroom02-shell.png      changed  404  lifted-orange 257  mean Δb 39.2   (shell build=par, 960x540)

"lifted-orange" = pixels that moved deck→inlay (g and b UP; Δb ≈ 2/3 of the
deck→inlay blue span) — the orange band is measurably present. Coverage is
view-dependent by nature: the stripe lives on the RUNNING surface, so framings
that see a fixture's underside (the −29° K2 chute from the hero rig) show less
than top-down framings. `tmp/fixture-signal/crop-b02-after.png` vs `-before`
shows the stripe reads.

## Frames the AD must re-check (legitimate fixture re-skin — NOT re-baselined here)

- `shell-kitchen01-idle` (visual baseline): **215 differing px vs the committed
  baseline (0.0415 %, inside the ≤0.1 % AA gate — the suite still passes)**.
  The K1 ramp/cup decks now carry the stripe; re-shoot or ratify the delta.
- `canonical kitchen-set establishing / hero / floor` and the ratified
  exploration renders: **0 px changed — byte-identical**, verified on the
  final build after killing the stale reused 4173 preview (an earlier run's
  85 px number was the pre-winding-fix build).
- Everything else that mounts a level build moves with it, by design: the
  `?harness=1&scene=kitchen-set&level=<id>` wiring stills (K2's run-out curve
  and K3's bowl-rim pair are TABLE fixtures — they wear the signal too, the
  inverse-reading question from the handoff stays the Ladder-notes thread),
  every game shell page, and share cards whose level is registered.

## Housekeeping note (for the record)

The code commit landed as `b136e51 "stage 4: systems engineer - fixture
readability signal"` — a concurrent agent staged and committed this working
tree under its own label while this session was still verifying; the committed
diff was checked hunk-identical to the validated state (winding fix +
polygonOffset included), and its four Module-note updates are accurate, so no
revert/re-commit: only this log is added here. Frames + census tool live
alongside this note under `tmp/fixture-signal/`.
