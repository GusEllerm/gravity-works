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
drift growing along the track). `KitRig.rail()` reports TRUE spacing (the
cache now serves only the `nearestArcInfo` projection scan), and — stage 3 —
`railPointAt` evaluates `frameAt(s) + up · RAIL_WHEEL_HEIGHT` **directly**.

## Seams (stage 3: the residual snap, measured out)

Interpolating the cache linearly fixed the drift but cut every piece
SOCKET's curvature discontinuity with a 1 cm chord: measured on the feel
track, `railPointAt` sat up to **1.8 mm off the frame-derived path AT
seams** (≈10× the smooth stretch, peaking at the gapLip/landing junctions)
— positionally small, but a kink in the derivative exactly where a run
camera reads a velocity hitch. Direct evaluation kills it by construction:
the rail IS `frameAt`, `fitSocket` makes the chain C0 with matching socket
tangents, so the rail is continuous and C1 across every socket — asserted
probe-by-probe at 1 µm across all seams of the feel track and the KITCHEN
04 par build (`tests/unit/camera.test.ts`; measured floors: seam gap 2.1 µm
at 1 µm probes, tangent/up jump 0.0005°). The §7.3 numbers are now also
measured end-to-end on a REAL kit rail (the loop rig's 4 m run-out): the
settled lead gap equals `v·(LEAD_TIME − POS_LAG)` and the step response
crosses 63 % within one sample of `POS_LAG`.

See [[feel]] (rail-projection honesty) and
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
lead frame, determinism of the filter over an input sequence), the
straight-line drift regression on the REAL kit rig (`KitRig.railPointAt`
continuity + the `frameAt + up·h` identity to 1e-12), the seam-continuity
probe across every socket of two real builds, and the §7.3 lead/63 %
measurements on the loop rig's real run-out rail.

## Depends on / used by

Depends on `three` math only. Consumed by `tests/unit/camera.test.ts`; the
rail sources live in `src/feel/kittrack.ts` and `src/track/spline.ts`
(`railPoints`). See [[feel]] for the camera-side findings.
