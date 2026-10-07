---
livedocs: snapshot
---

# Stage 5 — the solid-red replay stage (feel engineer)

Playtest AA ([[Sessions/2026-10-10 Playtest AA stage5]]): the hand-forged `#s=` link played honestly — viewer, scrubber, 1×/2×/4×, verdict — but "replay stage rendered solid red" on the real deploy. Branch `stage5-replay-red`; this is the diagnosis and the fix.

## Reproduction

The deployed bundle is byte-identical to a local `npm run build` (md5 `5e0a6e12…` of `index-DaT-ISdb.js` both sides), so the deploy itself was never the difference. The playtest's own artifact — `playtest-aa/replay-click.png` — carries the fingerprint the prose didn't: the bar reads **0.7 s / 1.3 s**. `duration = trace.time + REPLAY_TAIL(0.9)`, so their tape was a **0.4 s run** — the runtime signature of a build with nothing under the release: the car free-falls and `World` reports `fell` at exactly 0.4 s. Rebuilding that payload (`{levelId: feeltrack, pieces: [], seed: 1}`, hash `7898ebbd`) against the built preview reproduces the report digit for digit: seek to 0.7 s → **98.4 %** of canvas pixels inside the car-chassis colour band (R>90, R−G>60, R−B>50). The playtest maroon, the gradient and all.

## Diagnosis

Not the material table, not a camera layer, not a post-stack uniform (all three were ruled out by A/B): with the replay page's `__gwPost` probe, bloom/tilt/grade toggles moved frame means ≤ 1.6/255, and a raw no-post render of the same scene matched the game page. The post stack and the GPU are innocent — the disease is **machine-independent geometry**:

- No cup → `ReplayDirector`'s fallback `finishTangent` = normalize(pos[steps−24] − pos[steps−1]). A car falling straight down has that vector exactly vertical.
- The finish pose: `eye = finishAt + tangent·(−0.45d) + UP·(0.42d) + right·(0.55d)`. With tangent = ±UP the first two terms **cancel to (0.45−0.42)·d**; measured eye−car gap: **0.0335 m** (dumped camera: [0.7429, −0.8545], car rest: [0.7429, −0.8210]). `finishRight` = cross(UP, tangent) = 0.
- The camera sits inside the `#d7263d` chassis (0.075×0.02×0.035 m, near plane 0.01): its red walls fill the frame, Lambert-lit maroon (top face brighter — the banding in AA's screenshot), post vignette adding the corner falloff. The whole 70 % of the tape that a 0.4 s run spends in its finish hold is red.

## Fix

`src/replay/cinematic.ts`: before `finishRight` is built, a near-vertical `finishTangent` (|y| > 0.95) is flattened onto the floor plane (analytic +x if the fall was dead straight down). Constructor-time only — `poseAt` stays a pure function of sim time, the seek law untouched. A cup line's rail tangent never exceeds the kit's steepest drop (~45°), so no game-framed shot changes.

## Proof numbers

- Reproduction pre-fix: 98.4 % chassis band at t=0.7 (99.9 % at t=1.2).
- Post-fix: **0.7 %** at t=0.7, ≤ 1.0 % every sampled time; eye−subject gap 0.0335 m → 0.68 m.
- Honest frames (kitchen01 par, wide/follow/finish): band ≤ 2.7 % — the censor threshold sits at 40 %.
- Shot distinctness (kitchen01 par, pixelmatch 0.1): wide↔follow **0.440**, follow↔finish **0.437**, wide↔finish **0.300** — all ≥ 0.1.
- e2e `tests/e2e/replay-red.spec.ts`: passes fixed, FAILS with the fix stashed (`solid red at t=0.70`) — the censor actually bites.
- Suites: 668/668 unit (5 in `cinematic.test.ts`, +1 nose-first pose test asserting gap > 0.4 and purity).

## Method notes

- Image-tool standing rule honoured: every census/repro script and the spec smoke-ran once under `tmp/wd` (a perl/sleep watchdog — macOS ships no `timeout`); first census batch returned in seconds, no hang.
- One false lead worth recording: autoplay made the spec's screenshots DRIFT (the screenshot RPC gap is wall time; a seek's `resumeAfterDrag` restarted playback), which had the follow frame captured mid-drift INTO the finish shot — the frame-diff assertion caught the drift before it could mask anything; the spec now pauses before every seek.
- Headless software-GL renders read paler than the GPU frames (linear-space quarter-res buffers + grade in the post stack); that wash is cosmetic, present identically game-side, and NOT the playtest's red — the census band separates them cleanly (pale wash never enters the chassis band).
