---
livedocs: snapshot
tags: [session, stage-5, feel, replay]
---
# 2026-10-09 — Stage 5 · cinematic replay (Feel Engineer)

## Goal

Stage 5 brief: "the replay camera shots and scrubber, the share link opening into replay".
Accept line owned here: *a playtester describes a replay as something they would send to a
friend*. Branch `stage5-replay` (worktree `gw-feel14`); the share page already verified the
hash headlessly — this note covers what turned that page into a replay worth watching.

## What was done

- **Share link opens INTO replay.** `bootSharedRun` (`src/boot.ts`) now renders the replay
  player first: h1 "Watch this run", a tagline with no hash word above the fold, a verified
  badge (the word, not the hex), and the `#gw-replay-build` "Build your own" exit to
  `?level=<id>`. The honest verification block moved BELOW the player (`#gw-replay-verify`)
  with the exact `#gw-replay-status` / `#gw-replay-hash` / `#gw-replay-embedded` strings the
  stage-2/3/4 specs read, and the share-card button rides along there. Garbage/mismatch paths
  unchanged.
- **Shot grammar** (`src/replay/cinematic.ts`, new): `stepAndRecord` steps the page's visual
  World ONCE, storing every step's `state()` (identical to the Node harness's list) and the
  §7.3 `RunCamera` follow pose advanced at `FIXED_DT`. `deriveEvents` → Launch / Top speed /
  Big air (longest airborne ≥ 0.15 s, takeoff) / terminal beat. `planShots` cuts three
  contiguous shots tiling `[0, time + 0.9 s]`: **WIDE** establish (track bbox fitted to the
  28° replay fov, look-at biased 30 % toward the start, slow drift), **FOLLOW** (the recorded
  per-step rail camera — the tracked corner shot, not a chase: leads the car, clears set
  solids), **FINISH** (lock-off at the cup's capture centre on the rail tangent, ~1.2 m out,
  gentle push-in, held through the tail). Cuts sit ON the beats; each crosses with a 0.4 s
  eased blend; reduced-motion collapses blends to cuts and opens paused. The post stack rides
  along (quarter-res tilt-shift, focus band on the car at the shown step).
- **Scrubber**: `#gw-replay-timeline` — role=slider, pointer drag + keyboard (←/→ 0.25 s,
  Home/End), event ticks clickable, play/pause button, 1×/2×/4×. The seek law: the frame at t
  is the recorded sim state at step `floor(t/dt)` — the whole run was fast-forwarded before
  the first painted frame, so no state between two steps exists to cheat with. Playback speed
  never rescales the follow camera (its poses were recorded at sim cadence).
- **Seek proof**: `replayRun` grew `record: true` → `TraceSample[]` (per-step pos/quat/speed/
  grounded, exact doubles). `tests/unit/cinematic.test.ts` — Node trace == page-side record,
  step for step, **difference zero**; director pose a pure function of sim time.
  `tests/e2e/share-replay.spec.ts` — real share URL → `verified` → browser trace equals the
  Node `replayRun({record})` transforms at sampled steps AND the hash matches (the visuals-
  on world steps like the headless one); pause holds, play advances, 4× advances ≥ 0.6 s per
  0.3 s wall; a click on the Big-air tick lands within 0.06 s of the beat and the rendered
  state EQUALS the node state at that step; kitchen01's finish shot keeps the cup at
  |ndc| ≤ 0.8 at the timeline end; the game page grows no replay chrome.
- Renders (e2e-captured, committed under `docs/explorations/replay/`): kitchen01 wide /
  follow / finish + the feel-track finish. Feel-track finish shot: cup, deck and run-out read
  crisp through the tilt-shift band; kitchen01 needed the finish lock-off widened (the first
  build framed a defocused slab of deck — the distance law is now `clamp(0.9 + span·0.35,
  1.1, 2.4)`).

Full gates: `vitest run` 588/588, `playwright test` 133 pass / 1 pre-existing skip, `tsc`
clean. One spec flake fixed (the play-button restart race in `ensurePaused`).

## Decisions

- Record-then-render over step-on-seek (see Decision Log 2026-10-09 entry; the Decision Log
  is the canonical statement).
- `replayRun`'s `record` option is additive and default-off; the share page verifies with the
  UNCHANGED headless call and records the visual run separately — the two agreeing step-for-
  step is itself the proof, asserted in the new e2e.
- Stayed entirely in the replay path: no build-camera, gesture-gate or game-page edits
  (`tests/e2e/build-view.spec.ts` and friends pass untouched).

## Next

- Fresh playtesters on the deployed share URL for the "send it to a friend" accept line.
- AD render review of the three kitchen shots at the canonical shape (the finish lock-off is
  the shot most likely to come back).
- If a run ever exceeds the 15 s cap on a long set, the tail shot framing wants a look.
