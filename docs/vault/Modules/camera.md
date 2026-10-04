---
livedocs: module
tags: [module, camera]
---
# Modules/camera

> [!abstract] Role
> The §7.3 run camera: a pure filter over the track's camera rail that LEADS
> the car and begins each turn before the frame arrives. Owner: Feel Engineer
> (delivered on `stage2-feel-b`).

## What it does

`src/camera/run-camera.ts` — `RunCamera`, constructed from a `RunCameraSource`
(`railPointAt(s)`, `frameAt(s)`, `length` — the interface `KitRig` in
`src/feel/kittrack.ts` satisfies via `rail()` / `frameAt()`), and the tuning
object `RUN_CAMERA`: `LEAD_TIME` 0.4 s (rail distance the camera sits ahead,
as a speed-scaled look-ahead `speed * LEAD_TIME`), `POS_LAG` 150 ms (the §7.3
number), `ROT_LAG` 350 ms — deliberately slower, because the gap between the
two time constants IS the anticipation beat (~0.2 s of "camera already turned,
car arriving"). `HEIGHT` 0.022 m puts the eye just above the rail line (the
rail itself sits at wheel height, `RAIL_WHEEL_HEIGHT`).

## How it works

No renderer, no clocks, no globals: `update(dt, carArc, speed)` is fed the
same fixed `dt` as the simulation, so a headless replay frames identically to
the live game. Both filters use the step-independent exponential form
`1 − e^(−dt/τ)` (never the `(1 − dt/τ)` shortcut), so filter response does not
depend on the step count. Orientation slerps toward the frame built at the
*lead* arc — the position target before positional smoothing — which is what
"the turn is begun before the eye arrives" means mechanically. Steady state on
a straight is analytic: the camera sits `v·(LEAD_TIME − POS_LAG)` ahead of the
car, and the test asserts that formula rather than a hand-waved gap.

The §7.3 "camera drifts sideways on straights" bug lived in the SOURCE, not
the filter: `railPointAt` used to snap `s` to the nearest 1 cm cache sample
(5 mm stick-slip) and rescale arc by the requested-vs-true spacing ratio (a
drift growing along the track). `KitRig.rail()` reports TRUE spacing and
`railPointAt` interpolates — see [[feel]] (rail-projection honesty) and
`TrackSpline.railPoints(n, wheelHeight)` for the analytic rail.

## Integration status (honest)

`RunCamera` is built and headless-tested, but the game shell in `src/boot.ts`
does NOT drive it yet — the live frame loop still uses a static framing
derived from the build's bounding box. Wiring the run camera into the shell
(set scene plus a `RunCameraSource` over the world's track) is a stage-3
integration item; the class and its source contract are proven, the wiring is
not.

## Guarded by

`tests/unit/camera.test.ts` — five timing tests on an analytic rail (lead
distance, step response with tau = 150 ms, rotation lags rotation aimed at the
lead frame, determinism of the filter over an input sequence) plus the
straight-line drift regression on the REAL kit rig (`KitRig.railPointAt`
continuity + arc-faithfulness), which the analytic rail cannot express.

## Depends on / used by

Depends on `three` math only. Consumed by `tests/unit/camera.test.ts`; the
rail sources live in `src/feel/kittrack.ts` and `src/track/spline.ts`
(`railPoints`). See [[feel]] for the camera-side findings.
