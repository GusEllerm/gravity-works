---
livedocs: snapshot
tags: [session, stage-2, feel, physics, loop-gate]
---
# 2026-10-05 Stage 2 - feel engineer: loop gate honesty

Scope: the loop-completion gate. The reported honest threshold of 1.41 R
(theoretical dry minimum 2.5 R) was audited, the exploit named, the gate
hardened, both variants re-bisected, the run-camera straight-line drift
fixed with a regression test, and the cup completion changed to demand
contact. Files: `src/feel/run.ts`, `src/feel/kittrack.ts`,
`src/feel/feeltrack.ts`, `src/physics/car.ts`, `src/physics/sim.ts`,
`src/world/world.ts`, `src/track/pieces.ts`, `tools/feel.mjs`,
new `tools/loop-audit.mjs`, `tests/unit/feel.test.ts`,
`tests/unit/camera.test.ts`, [[feel]].

## The exploit, named

The old gate's exit test was `proj.arc > exitAt` on a GLOBAL nearest-rail
projection, with an "apex proximity" check that merely required a ray to
reach the deck. A car released at 1.41 R at r = 0.09 flies ballistically
through the loop INTERIOR — it skips the chord staircase of the entry
(every chord contact was a guide/seam hit that the old support model
dropped), passes UNDER the apex deck upright, and the global projection
teleports its arc past the exit. Telemetry at the "apex" step 33:
x = 0.218, y = 0.051 (airborne above the low deck), upY = +1 — the car was
UPRIGHT, and `s` read 0.4328 > exitAt 0.4284. The gate called it a lap at
1.41 R; the theory says ≥ 2.5 R. Both the old 1.41 R (raycast) and 2.85 R
(wheel colliders) numbers were this family of artifact.

## The gate, hardened

`simulate()` now runs a loop-state machine whose witnesses are all AT the
apex, none of them arc-projection alone:

- **inverted**: chassis up-vector `upY <= APEX_UP_MAX` (−0.5),
- **deck loaded**: `support.force >= APEX_FORCE_MIN` (400 sim N — the sum
  of spring forces actually applied, not ray proximity; a settled car
  idles at m·g_sim ≈ 98),
- **speed floor**: slowest sample inside the tight apex window ≥
  √(g·r)·(1 + `APEX_SPEED_EPS`), window adaptive
  (`APEX_ARC_WINDOW` + 2·step travel — a fixed window was narrower than
  one step's travel at threshold speed and missed every real apex),
- **rail distance** from `nearestArcInfo` gates both the apex
  (`APEX_PROX` 0.05, droop sag included) and the exit (`RAIL_PROX` 0.04,
  rolling pitch included) — the projection is only trusted when the car
  is where the projection says it is,
- the exit then counts only ARC ADVANCE past `exitAt`: a car that held
  the apex and launches off the loop tail (measured in a genuine lap)
  has driven the loop; faking that arc without the apex witnesses means
  skipping them, which is the exploit.

## The scale bug underneath everything

`toWorldSpeed` divided by √S instead of S. With `g_sim = S·g` and time
scale-invariant, velocity scales at S — every reported speed was inflated
3.16×, so the old apex floor √(g·r) was trivially satisfied at ANY
completion, and ROLL_COEF had been tuned in the wrong regime. Fixed in
`sim.ts` (`toWorldImpulse` at that too), propagated through `world.ts`.
Side effect: the §7.1 drop-ramp roll metric, measured honestly for the
first time, lands at **2.49 m — the 2.5 m target, met**.

## Honest measurements (before → after)

| metric | before (fake gate) | after (honest gate) |
|---|---|---|
| loop threshold, raycast | 1.41 R | **DNF** — exploit rejected; no release height completes yet |
| loop threshold, wheel colliders | 2.85 R | **DNF** |
| feel-track completion, raycast | completes 3.07 s (proximity cup) | **completes 2.92 s** with contact-at-cup demanded |
| roll §7.1 | 2.65 m (√S-inflated mu) | **2.49 m** (target met) |
| determinism | pass | pass (`406e494c` / `9bc90540`, both =repeat) |

The threshold band assertion in `tests/unit/feel.test.ts` is an
`it.fails` marker: green while the bisect DNFs, turns red (and must be
replaced with an in-band assertion) the day a lap passes. The
exploit-closed test is plain-green today: `loopTry` at 1.41·R is false
on both variants.

## Why DNF, physically (the open item)

A genuine lap HAS been driven under the honest gate — r = 0.09, release
2.8 R, k = 30000, ζ 0.7 (sweep knobs): contact + inversion through the
apex (ph 163: upY −0.91, deck load 31.7 kN-sim, apex v straddling the
floor), arc advancing on the descending side — and it launches off the
loop tail ~5 cm short of the exit line. The wall is the suspension's
slew rate: the loop bottom demands ≈ 6g centripetal inside one step, a
spring's force capacity is k·suspRest (5.1g at the shipped k 12000) and
its authority ω = √(4k/m) gives barely one force cycle per lap at k
30000 against the 20–30 rad/s orbit. Swept k ∈ [12000…120000] × ζ ∈
[0.5…0.9] × r ∈ {0.06, 0.09} × h/R ∈ [2.5…5]: nothing passes. Higher k
fixes the slew and currently breaks attitude; entry-quadrant losses
(damper + chord-catch, `tools/loop-audit.mjs`) eat 40–60% of KE at
threshold; and with the constant-force RR law the loss-free floor is
already ≈ 3 R at μ = 0.12 — the [2.25, 2.75] band likely needs the ROLL
suspension/loss re-tuning the brief lists as permitted honesty work.
Findings along the way (full list in [[feel]]): droop must be a TETHER
with the force cap arriving within its travel (slack = escape hatch) and
damped at its own rate (undamped hard stop = catapult); attitude
authority must respect the inertia TENSOR (scalar-I overdrives roll ~4×,
measured −58 rad/s about the apex); filtered wall contacts must still
vote on the deck frame.

## Camera drift

`KitRig.railPointAt` snapped to the nearest 1 cm cache sample (5 mm
stick-slip) and the sample cache rescaled arc by the requested-vs-true
spacing ratio (systematic drift growing along the track, the ~40% at
x = −1). True spacing + linear interpolation now; two regression tests
run on the REAL kit rig (continuity, arc-faithfulness vs `frameAt`).
