---
livedocs: module
tags: [module, replay]
---
# Modules/replay

> [!abstract] Role
> The determinism harness of brief §7.1: replay (level, build, seed) through `World` in Node, no GPU, and read the state hash. Owner: Systems Engineer.

## What it does

`src/replay/replay.ts` — `replayRun(level, build, { maxSteps?, launchSpeed?, record? })`: create the World with `visuals: false`, `launch()`, step until a terminal status or the fixed cap (default 15 s of sim time), return `{ hash, hashValue, steps, time, status }` and free the physics world. Termination depends only on the data, so equal inputs execute equal step sequences and must hash equal — which is the whole point. Since stage 5 `record: true` additionally returns `trace`: the per-step car transforms (`TraceSample` — the `state()` snapshot after each step, exact doubles), the Node side of the seek proof below; a plain replay is byte-for-byte the stage-2 call.

`src/replay/cinematic.ts` (stage 5) is the record the replay PAGE renders: `stepAndRecord(world, build, {maxSteps?, solids?})` launches a (usually visual) World and steps it to the terminal status, storing every step's car state — the very same list `replayRun({record:true})` yields, because both read `World.state()` after the same step order (visuals never reach the solver) — plus the §7.3 `RunCamera` follow pose advanced at `FIXED_DT`. `deriveEvents(samples, status)` (pure, used from both sides) prints the beats — Launch, Top speed (skipped when it is the first/last sample), Big air (the longest airborne segment ≥ 0.15 s, takeoff not landing), and the terminal beat; `planShots` cuts ≥ 3 contiguous shots tiling `[0, time + 0.9 s]` — a WIDE establishing (track bbox fitted to the 28° replay fov, look-at biased to the start, slow lateral drift), the tracked FOLLOW shot (the recorded per-step rail poses), and a FINISH lock-off at `cupView`'s capture centre on the approach tangent — with the cuts ON the beats and `REPLAY_BLEND` 0.4 s of eased cross-shots. `ReplayDirector.poseAt(t)` is a pure function of sim time; inside the follow shot it IS the recorded pose of step `floor(t/dt)`.

The browser side of a replay is `src/boot.ts`'s shared-run page — since stage 5 it OPENS INTO THE REPLAY. Above the fold: "Watch this run", the canvas, and the replay bar (`#gw-replay-play`, `#gw-replay-time`, the `#gw-replay-timeline` scrub slider with event ticks, 1×/2×/4× `.gw-replay-speed`, and the `#gw-replay-build` "Build your own" exit to `?level=<id>`); below the fold the honest half — `parseShareUrl` → `getLevel` → `replayRun` → compare with the embedded hash → `verified`/`mismatch` in `#gw-replay-status` (the strings the specs read, unchanged), echoing the recomputed hash beside it, in `#gw-replay-verify` — and the stage-3 share-card wiring (`#gw-share-card`) rides along there. The player (`startReplayPlayer`) mounts the level's set + build in a visual World, records the whole run BEFORE the first frame (`stepAndRecord` — the fast-forward: playback never steps physics again), and renders the shot sequence through the house post stack (quarter-res tilt-shift, focus band on the car at the shown step). The seek law: the frame at t is the recorded SIM state at step `floor(t/dt)` — never a blend of two states; scrubbing cannot invent a state the sim did not produce. Autoplay starts on load (reduced-motion opens paused, blends collapse to cuts).

What the hash COVERS, stated precisely (playtest F's "different builds, same hash" finding): `hashBodies` folds the quantised transforms of the RUN'S CAR BODIES (chassis + wheels, `world.hashedBodies`) every `HASH_INTERVAL` steps into the seed-folded accumulator — static track bodies are never hashed directly. Two builds are therefore guaranteed equal-hash exactly when the car's sampled trajectory is equal; a piece that sits OFF the car's road (a static the run never touches) cannot perturb the hash, and the shell's panel may say so truthfully ("same run — your extra piece never touched the road", `#gw-hash-note`).

## Measured

Node and the built Chromium page produce the same hash for the real kit feel track — same-machine, same-engine verification holds with the shipped rapier3d-compat build (feel-audit retune 2026-10-06: `099403c7` / 361 steps from both sides, page verdict `verified`; earlier quoted runs `9decb4fb`/343 and `074b1ef6`/239 steps belonged to pre-retune constants and are retired). Since the stage-3 review CI-truth pass the equality is HARD-ASSERTED (`tests/e2e/determinism.spec.ts` node↔browser, promoted from REPORTED because every run since the stage-2 gate has been MATCH/`verified`; the §2.2 allowance is retired). The cross-platform claim (different CPU/OS) remains open — but the assert now runs wherever the suite runs, so a divergence on a CI runner fails the job loudly instead of printing a rumour ([[Home]] Deferred).

## The solid-red replay stage (playtest AA, 2026-10-10)

Playtest AA saw a hand-forged `#s=` link play with an honest verdict while the stage rendered SOLID RED. Diagnosis (`Sessions/2026-10-10 Stage 5 - replay red diagnosis`): the 1.3 s tape was a build with nothing under the release — status `fell` at 0.4 s — so the finish shot had no `cupView` and took `finishTangent` from the last 24 samples: exactly vertical. In `ReplayDirector`'s finish pose the terms `tangent*-0.45d + UP*0.42d` then cancel to (0.45−0.42)·d ≈ 3 cm — the eye INSIDE the red chassis (`#d7263d`), whose interior filled the frame maroon for the whole finish hold (measured: 98.4 % of pixels in the car-chassis colour band at the playtesters' playhead; machine-independent geometry, not a GPU bug). The guard: a near-vertical final tangent (|y| > 0.95) is flattened onto the floor plane before `finishRight` is built — a vertical vector is not a camera direction. The offset after the guard is d·|0.45,0.42| ≈ 0.68 m; the census re-runs at 0.7 %. Kitchen01 par frames sit at ≤ 2.7 % band-share (that is the car and track orange at honest framings), so the e2e censors at 40 %.

## Guarded by

`tests/unit/replay.test.ts` (the REAL feel track: same build twice → same hash; JSON round-trip → same hash; piece removed → different hash; ONE piece parameter changed → different hash — determinism is asserted to be sensitive, not just stable), `tests/unit/cinematic.test.ts` (the recorded trace equals the `replayRun({record})` trace exactly, step for step, zero difference; re-records are bit-identical; the event list matches the Node stream through the same pure derivation; the plan tiles ≥ 3 shots; the director pose is a pure function of sim time) and `tests/e2e/replay.spec.ts` (verified/mismatch in the real page on a feel-track `#s=` fragment), plus `tests/e2e/share-replay.spec.ts` (the seek proof: the page trace matches the Node `replayRun({record})` transforms EXACTLY and after a real tick-click the rendered state IS the node state at `floor(t/dt)`; play/pause/4× measured on the playhead; kitchen01: the finish shot frames the cup (|ndc| ≤ 0.8 at the timeline end) and the verification block sits below the player; and the game page grows no replay chrome — the build-view gesture path is untouched) — plus `tests/e2e/replay-red.spec.ts` (the solid-red censor: the playtest reproduction — an empty `fell` build, 1.3 s tape — is screenshot mid-shot through the real scrubber and censused: <40 % of pixels may read as car-chassis red, and the wide/follow/finish frames of the kitchen01 par link must pixelmatch-differ pairwise above a tenth of the frame, so neither a red stage nor a frozen one passes).

## Depends on / used by

`src/world`, `src/physics`, `src/track` — all headless-safe. Used by `src/boot.ts` and the tests.

## Replay-all gate (stage 5)

`npm run replay:all` (`tools/replay-all.mjs`) walks the campaign ladder IN ORDER and replays every
rung's `parBuild()` twice in Node — both runs must FINISH, hash EQUAL (that pair is the
determinism claim per rung, not just per rig), respect `pars.json` parTime, and place exactly
`parPieces` PLAYER pieces (fixtures excluded via the one `fixtureQuota` rule, the same arithmetic
`playerPieceCount` does in boot). All 26 rungs verified at landing; the table honestly shows
IDENTICAL hashes across rooms sharing a deck (bathroom/garden/garage 01 run on kitchen01's
physics — the port doctrine made decks reusable, hashes prove it) — the same fact that makes the
F6 save-stamp deferral matter. The step runs in CI after typecheck.
