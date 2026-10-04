---
livedocs: snapshot
tags: [session, stage-2]
---
# 2026-10-04 Stage 2 — kit integration (feel engineer, on `stage2-feel-b`)

> **Reconstruction note.** This session log was written *after the fact* by
> the **Documentarian** at the stage-2 close sweep (commits `67d05c4`..HEAD),
> from `git show` of the branch commits `970ad0f` / `e4dae31` / `5e9daf2` and
> their merge `8608a27`, plus what `Modules/feel.md` and `Modules/physics.md`
> absorbed in that round. The kit-integration round merged module-note updates
> but **no session note** — this file closes that gap. Every number and claim
> below is quoted from those commits; nothing here is memory. The addendum the
> round *did* write lives inside `Sessions/2026-10-04 Stage 2 - track kit.md`.

## Goal (from the round's work)

Make the feel rigs drive the **track kit** instead of the retired chord-slab
provisional track — first blood of the kit's left half — and get the raycast
car to complete the kit feel track headless. Delivered on
`origin/stage2-feel-b`, merged as `8608a27`.

## What was done (from `git show` of the branch)

- `src/feel/kittrack.ts` — new `KitRig`: one **merged** static collider per
  piece from the `PieceDef` chain (a mesh *union*, never a family of
  overlapping boxes — a compound is an island farm for the CCD raycasts),
  collision-group bit discipline, arc-indexed centreline, uniform-arc camera
  rail.
- **The hoovering fix:** the `TRACK_GROUP` filter mask still admitted the
  chassis bit; the raycast car was being physically carried by hull-vs-track
  contacts through ramps and loop chords while the suspension measured
  fiction. Track group became `0x0001_fffd` — the load-bearing constant of
  the module.
- **Channel-rail steering:** per-mount feeler rays at the **lip mid-band
  height** (0.020 m), band slack 3.5 mm, progressive spring + fraction
  dashpot along the wall normal, plus a friction-circle-budgeted
  self-aligning axle torque. Four successive controller designs (tyre scrub,
  caster, weathervane, COM-cancel) retired in favour of geometry — straight
  -line stability was a *geometry* problem, not a controller problem.
- **Bump stops speed-gated** (impact speed > 6.6 sim or deep compression):
  the loop's 19-step chord staircase of ~3 mm risers no longer eats the car
  on gentle climbs. `suspC` 550; anti-roll torque channel with roll-plunge
  cutoff; wheel PD 1400/60, wheelFriction 0.35.
- **Feel track rebuilt on kit pieces:** `ramp → straight → loop → gapLip →
  landing → finishCup → bank → curve`, drop 0.45 m, `RELEASE_FRACTION` 0.9;
  bank + counter-curve moved *after* the finish cup as run-out — mid-run
  banked yaw arcs are the documented boundary of the pure-raycast model.
  (Layout and drop height both moved again later in stage 2 — the `drop`
  catch piece and the 0.52 m rebalance came with the 2026-10-06 landing
  fix.)
- `src/camera/run-camera.ts` — the §7.3 run camera shipped as a pure class:
  0.4 s speed-scaled lead, 150 ms positional lag, ~350 ms rotational lag
  aimed at the *lead* frame; five timing tests (`tests/unit/camera.test.ts`)
  pinning the exponential filters and the analytic steady-state gap. Now
  documented in its own note, [[camera]].
- Vault in the same commit: `Modules/physics.md` reconciled (explicit groups,
  the three new stage-2 channels), `Modules/feel.md` grew the
  "Stage 2 — the kit track, first blood" section; `e4dae31` added the session
  addendum to the track-kit note; `5e9daf2` carried the drift.lock.

## Measurements (as quoted in `970ad0f`)

- **Raycast variant completes the kit feel track headless: 3.07 s,
  deterministic.** (The world/replay route later finished 3.01 s; the
  harness-vs-game ~0.2 s phase seam is documented in [[feel]].)
- Roll from the 30 cm drop ramp: **2.65 m** (2.5 m ±10 % ✓).
- Loop gates: H/R = **1.41** raycast / **2.85** wheel-collider at R = 0.03 —
  both values were later invalidated (the first by the honest-gate audit,
  the second by the two-arc loop geometry fix); see
  [[2026-10-05 Stage 2 - loop gate honesty]] and
  [[2026-10-05 Stage 2 - loop geometry fix]].
- All 48 tests green.

## Open questions carried out of the round (verbatim intent)

- Wheel-collider variant still DNFs on rails — the bank-crossing question
  (its tyres physically touch the lips) is the acceptance test for it.
- Game-shell wiring of `RunCamera` into the run view (still open at stage-2
  close — see [[camera]] Integration status).
- PD-vs-rail trade for wheel-collider contacts at the cup approach.
