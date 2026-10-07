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
`src/feel/kittrack.ts` satisfies via `rail()` / `frameAt()`), an optional
`{ solids }` list of world-space AABBs (`RunCameraSolid`, the set's prop
boxes at leaf granularity — `setCameraSolids` in `src/boot.ts`, fed by
whichever set the level MOUNTS through the registry walk — a new set needs
no camera-code edit, which is how the stage-4 bathroom and garden dresses ride the
same clearing), and the
tuning object `RUN_CAMERA`: `LEAD_TIME` 0.4 s (how far AHEAD the AIM looks,
as the speed-scaled look-ahead `speed · LEAD_TIME`, sweep-clamped by
`TRAIL_MAX_SWEEP` 1.05 rad), `POS_LAG` 150 ms (the §7.3 number), `ROT_LAG`
350 ms — deliberately slower, because the gap between the two time constants
IS the anticipation beat (~0.2 s of "camera already turned, car arriving").
`HEIGHT` 0.022 m + `EYE_UP` 0.05 m put the eye just above the rail line (the
rail sits at wheel height, `RAIL_WHEEL_HEIGHT`); `TRAIL` 0.25 m is how far
of TRACK behind the car the EYE rides (stage 3 — see below).

## Stage 3: the beige-wall fix (playtests E/F/G, measured)

Measured on the L01–L04 PAR runs driven exactly as `boot.ts` drives them
(`World` → `KitRig.nearestArc` → `RunCamera.update` at `FIXED_DT`): the old
rail-lead eye sat at a rail point `speed · LEAD_TIME` ahead of the car, and
even with the shell's backward 12 cm offset the EYE was AHEAD of the car for
**67–72 % of every run** (car behind the camera plane) and out of the 35°
frustum in ~95 % of steps. That is the "mid-run beige blur / car off-screen"
finding — not a blur at all, an empty shot.

The class now splits the two jobs §7.3 names:

- **The AIM leads.** Orientation targets the rail point ~`LEAD_TIME` ahead
  (`railArc` keeps the old lead-arc filter unchanged — every legacy timing
  assertion holds). On near-level rays the YAW stays on that lead azimuth
  while the PITCH is set to pass through the car (so the airborne gap
  flight, a ramp descent, and a lifted eye all keep the car centred); on
  steep rays (loop walls, horizontal projection < 0.25) the full lead-point
  aim stays — "loops framed from the side". `AIM_Y_FOLLOW` 0.75 adds the
  car's height ABOVE its rail point (airborne over the gapLip→landing seam,
  where the car rides up to ~12 cm over the rail chord at t ≈ 1.4–1.8 s).
- **The EYE trails.** It rides the rail `TRAIL` 0.25 m of TRACK behind the
  car through the same `POS_LAG` filter (`eyeArc`). Trailing along the rail,
  not backward along the local tangent — measured: the lip→drop seam's 45°
  plunge turned a tangent-back offset into a 0.26 m one-step crane jump.
  The trail is sweep-clamped (`TRAIL_MAX_SWEEP` ≈ 60°): on the bowl rim's
  0.12 m radius (L03) an unclamped trail parked the eye on the FAR side of
  the bowl looking through it; near the rail start the trail clamps at 0
  and `LAUNCH_PEEP` (0.10 m, fading over `TRAIL`) + a distance-blended aim
  (`AIM_CAR_BLEND` 0.12 m) keep the release frame a view of the car.
- **It never touches the SET.** The eye point and the eye→car sightline are
  cleared every frame against the caller's solid AABBs (`CLEAR_MARGIN`
  0.04 m): whichever would be intersected lifts the eye above the tallest
  blocking box top, carried by a `LIFT_LAG` 0.25 s exponential (an ARC
  over, never a cut) with the unfiltered requirement as a hard floor — a
  true-intersection frame cannot exist even for one step. The sightline
  rule skips a box the CAR itself is inside (the L04 tap's leaf boxes sit
  over the sink lane the deck runs under — the car passes beneath; lifting
  would only crane the frame away). Leaf granularity matters: the TAP
  group's single AABB has a bottom face that cuts through the corridor
  (`setCameraSolids` vs the builder's coarser `setPlacementGuard`).

Measured after (same harness, `tests/unit/camera.test.ts` stage-3 block +
`.scratch/cam-probe.mjs` lineage): **0 of 1162 run steps** have the car out
of frame or the eye inside a solid, all four par runs; worst |ndc| ≤ 0.57,
eye→car distance band 0.15–0.51 m, L04 tap-window lift peaks 0.115 m. The
e2e filmstrip gate (`tests/e2e/filmstrip.spec.ts`, own port 4210) shoots an
L02 par run every 250 ms on the built page: 9 frames, worst-frame
dominance **41.6 %** single colour (bar 60 %).

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

`RunCamera` is built and headless-tested, and `src/boot.ts` drives it: each
rebuild builds a `KitRig` over the live build (the `RunCameraSource`) plus
the set's leaf boxes (`setCameraSolids` → the `solids` option) and, once a
run is released, the render loop updates the camera per fixed step
(`update(FIXED_DT, rig.nearestArc(carPos), speed, carPos)` — the car's
WORLD position enables the airborne vertical follow), so during a run the
rail camera leads the car (§7.3). Since stage 3 the EYE COMPOSITION lives
in the class (`EYE_UP`/`TRAIL`, promoted from the shell's old
`RUN_EYE_OFFSET`, which is deleted): the clearance and in-frame maths must
see the same point the renderer gets. The rail freeze-frame after a run
stays GONE: at a terminal status the loop hands the transform back to the
static track framing — the deployed "camera buried inside the floor" was
the run camera's final pose kept forever.

The static bounding-box framing owns the table between runs and at run
end: it boxes the TRACK group alone (named `track` in `buildTrackMeshes`),
never the whole scene, so the set and the ground plane cannot steal the
frame. Empty builds (no rail) stay on the static framing. The live-path
follow is asserted on the BUILT app through the `__gwCameraPose` seam
(`tests/e2e/loop.spec.ts`) — the e2e that should have caught this ran
dev-time only once.

## Guarded by

`tests/unit/camera.test.ts` — five timing tests on an analytic rail (lead
distance, step response with tau = 150 ms, rotation lags rotation aimed at
the lead frame, determinism of the filter over an input sequence, and the
`snap` cut landing the eye at `railPoint(carArc − TRAIL)`), the
straight-line drift regression on the REAL kit rig (`KitRig.railPointAt`
continuity + the `frameAt + up·h` identity to 1e-12), the seam-continuity
probe across every socket of two real builds, the §7.3 lead/63 %
measurements on the loop rig's real run-out rail, and the stage-3 proof:
every L01–L04 par run through the boot wiring asserts the car projects
inside the frustum on EVERY step (|ndc| ≤ 0.95, never behind the eye
plane) and the eye never sits inside a set solid — plus (stage 4 round 3)
the eye→car band SPLIT at the finish fade (cruise < 0.7 m unchanged,
finish window ≤ 0.85 m) and the goal-framing + end-hold proofs on
`frameCamera`. `tests/e2e/filmstrip.spec.ts`
(port 4210, `npm run test:e2e:filmstrip`) repeats the in-frame claim on the
BUILT page as the 250 ms filmstrip (≤ 60 % single-colour per frame) and the
dense final-second gate on L01/L04 and BOTH L02 lines (`build=par`+`alt`).

## Depends on / used by

Depends on `three` math only. Consumed by `tests/unit/camera.test.ts`; the
rail sources live in `src/feel/kittrack.ts` and `src/track/spline.ts`
(`railPoints`). See [[feel]] for the camera-side findings.

## Stage 4 round 2: the end-of-run bury (playtests J+K, measured)

Mid-run framing was fixed but J+K both hit the camera buried in a wall AT
the run's end — the trailing eye kept its launch altitude while the last
metres duck along the table edge INTO a set solid. The eye now carries a
`lift` state: `requiredLift()` is the smallest raise that keeps the eye out
of the corridor solids (filtered by `liftFiltered` so it never dips below
its recent maximum mid-run), a `LAUNCH_PEEP` blend lifts the aim over the
trail at release (distance-blended, `TRAIL`), and `FINISH_LIFT` (0.22)
fades in as the car crosses the finish witness so the terminal frames arc
OVER the end furniture instead of through it. The filmstrip gate
(`tests/e2e/filmstrip.spec.ts`, own config + port) samples EVERY 100 ms of
the FINAL second of the L01+L04 par runs — no frame may be >60 % single
colour — which is the assertion that was missing when "mid-run fixed"
still shipped a wall at the end.

## Stage 4 round 3: watchability resumed (playtests M+N, measured)

M/N could still not WATCH a failure: "the cup and death spot were NEVER
visible", "the whole far half of Two Ways stays off-frame", "the build
camera never frames the cup". Four fixes, all camera-side:

- **The fade keys the CUP, not the rail end.** boot projects the build's
  `finishCapture` centre onto the rail (`KitRig.nearestArcInfo`) and passes
  it as `RunCamera`'s `finishArc` option; `finishWeight` counts DOWN from
  that witness and stays 1 past it. L02's rail runs 0.84 m of visible
  curve PAST its cup, so the rail-end-keyed round-2 fade never fired on
  either L02 line at all — 0 % weight the whole run.
- **The finish pose is a finish CLIP**: `FINISH_ARC` 1.2 m (the last second
  at ladder speeds), `FINISH_LIFT` 0.22, `FINISH_TRAIL` 0.25 pull-back and
  `FINISH_SIDE` 0.25 off-rail step (direction matters: the yawed L04 mount
  measures 63 % dense-left / 43 % dense-right), `FINISH_LEAD_TAPER` 0.4
  aiming at the CAR by 40 % of the fade (the L04 sink drops the car ~35 cm
  mid-fade; a lead-point azimuth put it off the bottom edge), and the
  ROTATION lag tightening to 0.05 s across the same weight — anticipation
  is corner language, and a 350 ms rotation lag on a diving subject is the
  complaint itself. Lift target is `max(requiredLift, FINISH_LIFT·w)`: the
  crane does NOT stack on the clearance lift (stacking measured 1.5+ m
  eye→car and broke the distance contract at the tap).
- **The beige-wall proof splits at the fade** (`tests/unit/camera.test.ts`):
  OUTSIDE the finish window the cruise contract is unchanged (|ndc| ≤ 0.95
  every step, eye→car < 0.7 m, never inside a solid — measured cruise max
  0.47 m); INSIDE it the deliberate wide shot may widen to ≤ 0.85 m. The
  0.55 m trail / 0.5 m side a tuning pass briefly carried measured 1.15 m
  there and broke it on all four rungs.
- **THE GATE'S OWN METER was broken.** The dense sampler's bucket key
  shifted BLUE into the GREEN slot (`(b >> 4) << 4`), OR-ing the nibbles:
  every cream/gold family colour merged into one bucket, so a warm frame
  that measures 24–49 % on the 250 ms PNG sampler read 63–89 % on the
  dense one — the two halves of the gate were measuring different cameras,
  and a full-resolution tuning pass ("all frames ≤ 60 %") could not see
  either number. Fixed (key identical to the PNG sampler) and re-measured:
  shipped dense worst L01 40.1 %, L04 49.2 %, L02-par 40.2 %, L02-alt
  40.2 %, whole-run/post-terminal worst 50.4 %, bar 60 %. The dense gate
  now shoots BOTH L02 lines (`?build=alt` = `kitchen02ArcBuild`, addressed
  by boot's `ALT_LINES` table — level DATA untouched).

Framing lives with `frameCamera` (`src/boot.ts`, exported for the proof):
the static/table/load framing biases its look-at 35 % toward the cup's
capture centre (cup |ndc| ≤ 0.28 vs 0.43/0.46 cornering when N could not
find the goal; every track corner still ≤ 0.49) and the RUN-END (end-hold)
pass unions the car's FINAL position — clamped to the track's ±0.6 m
neighbourhood — into the subject, so the verdict panel lands over a frame
that CONTAINS the death spot (M item 6). Proved per-line in
`tests/unit/camera.test.ts` (goal-framing + end-hold block).
