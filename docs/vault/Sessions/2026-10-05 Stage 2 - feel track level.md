---
livedocs: snapshot
tags: [session, stage-2]
---
# 2026-10-05 Stage 2 — feel track level (systems engineer)

## Goal

Make the real kit feel track a data-driven level so World, replay, save and
share all run on it: express the Feel Engineer's desugared track as an actual
`Build` in `src/world/levels/feeltrack.level.ts` (piece kinds and parameters
IMPORTED from `src/feel/feeltrack.ts`, not copied), assert level ≡ harness by
fingerprints, extend the headless determinism test to replay the feel track
and prove the hash is *sensitive* to the data, and carry the share
`#s=` → verified e2e over to the real track. Branch `stage2-level`.

## What was done

- `src/world/levels/feeltrack.level.ts` — placeholder (reverse-mounted ramp +
  3 straights + cup) replaced by `feelTrackBuild()` =
  `chain(FEEL_TRACK_KINDS, { params: FEEL_PARAMS, levelId, seed })`: 8 pieces,
  `ramp → straight → loop → gapLip → landing → finishCup → bank → curve`,
  seated by pure `fitSocket` socket math. `startSocket` is derived from the
  first placed piece's in-socket — spawn is data too. `FEEL_PARAMS` exported
  from `src/feel/feeltrack.ts` (one-word change; single source of tuning).
- `src/world/world.ts` — `TRACK_GROUP` `0x0001_ffff` → `0x0001_fffd` (see
  Measurements).
- Tests: `tests/unit/feeltrack-level.test.ts` (piece kinds; param OBJECT
  identity, not equality; sample fingerprint `rigFingerprint`; collider
  fingerprint over `colliderRuns` + `sectionRings` vertex soup; `serialize`
  equality modulo levelId/seed); `replay.test.ts` extended (feel track
  replayed; hash stable twice + across the JSON round-trip; changes on seed
  change, piece removal, and ONE piece-parameter change); `world.test.ts`
  finish assertion now on the real track; `builder.spec.ts` counts 5→8/6→9;
  `playwright.config.ts` gains `E2E_PORT` so worktrees can run e2e in
  parallel (4197 here).

## Measurements / gotchas

- The feel track replays through `World` to `finished` in 239 steps (1.99 s),
  hash `074b1ef6`, identical from Node and the built Chromium page (the
  `#s=` e2e says `verified`).
- **`World`'s filter-all `TRACK_GROUP` did not survive the real track.**
  With the placeholder the chassis collider never found anything to grab; on
  the kit hulls it did — a 5.2 m/s² *linear* ramp-descent acceleration on a
  12° slope (measured linvel 8.9 m/s where energy allows 2.9) and an anchor
  at the loop bottom that never terminated. This is the `kittrack.ts`
  "hoovering the 3 mm chord risers" finding arriving in `World`: any group
  whose filter includes bit1 makes the raycast chassis a physical body
  against the track. Excluding bit1 (`0x0001_fffd`, the harness constant)
  changes nothing for the suspension rays (they are cast without a group
  filter; the wheel-exclusion predicate reads membership, not filter) and
  nothing for the `wheelColliders` variant (bit2 stays in). Same fix,
  second module — the vault entry in `Modules/feel.md` predates it.
- A replay of a build whose tail sits BEYOND the run's end is byte-identical
  with and without the tail (the run finishes at the cup before bank/curve):
  the old `pieces.slice(0, -1)` sensitivity test passed only by accident on
  the placeholder. It now cuts the track after the first straight, and a
  second test retunes one parameter (`ramp.level + 0.01`).

## Decisions

- `[systems engineer]` **The level imports the feel module's data instead of
  re-expressing it.** Alternatives: copy the numbers into the level file
  (drifts silently the first time Feel retunes) or import
  `feelTrackRig().build` wholesale (couples the level to sim-scale rigging
  and hides that the level is a piece list). Importing `FEEL_TRACK_KINDS` +
  `FEEL_PARAMS` and calling `chain` keeps the level plain data, picks up
  tuning automatically, and the fingerprint test turns any future divergence
  into a red test, not a silent hash difference.
- `[systems engineer]` **Spawn at the ramp in-socket, gravity release** — the
  harness releases at `0.9 × blend` inside the first blend; the socket is the
  data-expressible neighbour of that choice and `SPAWN_ADVANCE` lands the
  car in the same region (finished run, measured).
- `[systems engineer]` **`TRACK_GROUP` matches the harness constant** rather
  than a World-side re-tune — the hoovering finding is geometry-property of
  kit hulls, not a per-module parameter.

## Next (for other roles)

- Feel Engineer: retuning any `FEEL_PARAMS` number now moves the level and
  the replay hashes automatically — regenerate share fixtures after tuning
  landings. If the post-ramp linvel jitter (measured: 8.9 m/s linvel vs
  2.5 m/s actual progress on the ramp) matters for your metrics, it is a
  suspension-pump question in `src/physics/car.ts`, not a level question.
- QA: the `074b1ef6` claim is same-machine; the cross-platform matrix run
  over `replayRun` is still open.
- Art: the level's meshes are unchanged (`buildTrackMeshes` reads the same
  data); the banked run-out after the cup is now visible in the game page.
