---
tags: [module]
---
# src/feel (track builders and scenario runners)

> [!abstract] Role
> The headless feel track: procedural track colliders and the physics-only scenario runners that measure cars against the Feel bible's targets. Provisional stage-1 track — the real feel track lands at stage 2.

## What it does

`src/feel/feeltrack.ts` builds tracks as chord-slab box colliders: `buildTrack(segs)` sweeps a U-channel along a frame-integrated centreline and emits, per pose pair, one floor slab plus two wall slabs (the brief's sanctioned "compound convex colliders" — trimesh edges in rapier3d-compat 0.21 grip rolling bodies). Three products: `buildFeelTrack()` (drop → straight → banked turn → loop at threshold radius → gap jump → landing ramp → finish cup), `buildRollTrack()` (30 cm drop ramp onto a long flat deck, for the two roll rigs), and `buildLoopTrack(releaseHeight, radius)` (release-ramp + loop for the 2.5 r threshold bisect). Geometry constants (`DROP_HEIGHT`, `LOOP_RADIUS`, `TURN_RADIUS`, ...) are exported here and are the single source for scenario numbers.

`src/feel/run.ts` runs those tracks headless — no rendering, no Three.js — so it behaves identically under Vitest (node), `tools/feel.mjs` and later the browser: `runScenario(opts)` steps the fixed 120 Hz world with one car and returns a `RunResult` (time to finish, peak speed, apex speed vs theoretical minimum, landing impulse, roll distance, FNV-1a state hash); `feelTrackRun(variant)`, `rollRun(variant)`, `rampRollRun(variant)` and `loopThreshold(variant, radius, opts)` are the canned measurements. Rolling resistance is the constant `ROLL_COEF` (the stage-1 `setRollCoef` setter was dead code and is gone; re-tuning the constant is an open stage-2 item — it was tuned against the broken stage-1 rig).

`tools/feel.mjs` (npm script `feel`) runs both car variants from `src/physics/car.ts` through all the measurements and prints the bake-off comparison table, including a determinism check (same run twice → equal hashes).

## How it works

Everything is in sim space via `src/physics/sim.ts` helpers (`SIM_SCALE = 10`, see [[Feel#Physics scale factor]]); results are converted back to world metres with `toWorldDist` / `toWorldSpeed`. Two honest roll rigs (stage-2 review fixes): `rollRun` free-drops the car from rest 0.3 m world above the flat deck, 2 m of true world-metre deck down-deck of the ramp run-out, and reports wheel-centre travel after touchdown — which for a symmetric vertical drop is ~0.00 m by momentum conservation, for any collider; `rampRollRun` measures the brief §7.1 metric — released from rest at the top of the 30 cm drop ramp, wheel-centre travel to stop (5.87/8.46 m measured vs ≈ 2.5 m target; ROLL_COEF re-tuning + stitched track-kit colliders are the open items). Known provisional flaws carried into stage 2: chord-slab seam stitching, real-wheel plough on slab end faces, and post-ramp landing sink — the sink still blocks the loop bisect — see [[physics]] for the measured table.

Guarded by `tests/unit/feel.test.ts` (run-twice determinism, roll smoke, scenario smoke).

## Depends on / used by

Depends on `src/physics` only. Used by `tools/feel.mjs`, `tests/unit/feel.test.ts`, and the Feel Engineer's tuning loop; stage 2 replaces the provisional track here.

## Stage 2 — the kit track, first blood (2026-10-04)

The provisional track is gone from the feel rigs. `src/feel/feeltrack.ts`
builds the feel track as a `PieceDef` **chain** through
`src/track/desugar.ts`, and `src/feel/kittrack.ts` (`KitRig`) owns the
world: one **merged** static collider per piece (a mesh *union*, never a
family of overlapping boxes — a compound is an island farm for the CCD
raycasts), collision-group bit discipline, deck friction IMPORTED from
`src/track/material.ts` (one constant with the game world, no mirror), an arc-indexed centreline for
metrics, and the uniform-arc **camera rail**.

Measured on this geometry (sim constants of the day: `suspK` 12000,
`suspC` 550, droop tether 90000/0.15/6000 @ droopC 1050, `RAIL_K` 30000 @ `RAIL_SLACK`
3.5 mm, `ALIGN_GRIP` 0.15, `ROLL_COEF` 0.12), re-measured 2026-10-05 after
the loop-gate audit and the SIM_SCALE velocity-mapping fix:

| metric | raycast variant | wheel-collider variant |
|---|---|---|
| roll from 0.3 m drop-ramp (§7.1) | **2.47 m** — target 2.5 m MET | 2.47 m ✓ |
| feel-track completion | **completes, 3.31 s** (world replay finishes 3.01 s) | 3.31 s ✓ |
| min loop height / radius, honest gate | **2.30 R** — bracketed bisect on the friction-aware loop rig at shipped `ROLL_COEF`, band [2.25, 2.75] R asserted (`LOOP_BAND_OVER_R`); no solver-made ceiling — the audited car holds the ring through 7 R | 2.30 R ✓ (identical) |
| apex speed / floor | 1.08 / 0.99 m/s (1.09×) | same ✓ |
| peak speed | 3.00 m/s | 3.00 m/s ✓ |
| landing impulse across the gap jump | **0.061 N·s** after a real ~0.2 s flight | same ✓ |

The 2026-10-06 energy audit ("node tools/feel.mjs audit [hR] [arc0 arc1]")
closed the injection this table used to carry an apology for. The mechanism,
named with numbers: the ring-entry contact is UNALIGNED (the ray reads the
corner between run-out and first rising chord at toi ~ 0.03 with a 59°-tilted
normal), and the old guide branch solved that geometry reading as a velocity-
free position projection — k·u·dt spent as pure new velocity, half of it along
the track. ONE step of it measured **+1.03 J/kg**, which is the whole ~1 J/kg
the threshold was short by. Three solver changes and one rebalance followed;
the threshold is now what the drop honestly pays for (2.30 R bisected vs theory 2.5),
and no single step anywhere injects more than 0.1 J/kg. See
[[2026-10-06 Stage 2 - solver energy audit]] for the mechanism-by-mechanism
story; the older [[2026-10-05 Stage 2 - loop geometry fix]] remains accurate
about the geometry and the scale-mapping fix.

### Loop threshold — one canonical rig (2026-10-06, stage-2 fix crew)

The stage-2 review caught THREE numbers for one metric. They had three
different provenances, and only one was a shipped-car measurement:

| number | what it actually was |
|---|---|
| 3.03 R (`loopH` table row) | the same bisect at **coef 0** — a frictionless run-in the shipped car does not have. Never a shipped metric; the row is gone |
| 2.51 R (`loopHfric` table row) | the shipped predicate bisected over the naive [1.4, 4.5] R bracket with the coefficient **mirrored as a hardcoded 0.117** instead of importing `ROLL_COEF = 0.12`; on the known non-monotone dip structure its landing spot was bracket luck, not a threshold. Row gone, mirror gone |
| "sits at 2.4 r" (footer prose) | the coarse-grid edge row — one sample, not a bisect |

**Canonical measurement (the only one that counts now):** the friction-aware
loop rig (`loopRig`, steep release ramp, kit loop at `LOOP_RADIUS`) at the
shipped `ROLL_COEF = 0.12`; predicate = completion per the apex witnesses
(inverted + deck loaded + sqrt(gr)·1.02 floor + exit witness); a TRUE
bisection inside the bracket `LOOP_GATE_BRACKET_OVER_R = [2.2, 2.6] R`,
whose wings are probed EVERY run by `loopGateWings` — low wing FAILS, high
wing COMPLETES (monotone direction: higher release → completes). The
converged value is **2.30 R** on both variants, asserted inside the
[2.25, 2.75] R band (`LOOP_BAND_OVER_R`, §7.1 = theory 2.5 R ±10%) in
`tests/unit/feel.test.ts`. The predicate is monotone only IN PRACTICE —
mid-window dip rows (2.5, 3.0 R fail while 2.4/2.6 pass) are real
bounce-phase physics; the bracketed wings are what stop a dip from being
bisected as if it were the threshold.

Stated honestly, two edges of the bracket structure: (1) there is ONE
isolated completing row BELOW the low wing, at 2.15 R, on both variants —
the audit at those heights shows the wishbone term doing +0.9 to +1.0 J/kg
of NET work in that phase window (vs ≤ 0 from 2.5 R up), i.e. that spike
rides a rotor pump, not the drop's money; it is exactly what the lead/rotor
ablations in `tests/unit/ablation.test.ts` exist to catch, and it is why
the bracket floor sits above it and in the theory band rather than hunting
spikes. (2) the dip rows above the threshold are suspension-phase
lottery — a dip row proving the gate can say NO above the threshold is
evidence the gate is honest, not evidence the threshold moved.

The 2026-10-04 table's numbers (2.65 m roll, 1.41 R / 2.85 R loop
thresholds) were measured through two lies: `toWorldSpeed` divided by
`sqrt(S)` in `src/physics/sim.ts` instead of `S` (velocity scales at S when
time is scale-free; every speed inflated 3.16x, so the apex speed floor was
trivially met and mu was tuned in the wrong regime — fixed in this commit),
and a
completion gate that trusted the global rail projection (see the loop-gate
findings below). The honest gate rejects every one of those "laps".

Findings that cost real debugging and must not be re-learned:

- **The chassis is physically inert against the track.** The raycast car may
  only touch the deck with its four wheel colliders; while `TRACK_GROUP`'s
  filter mask included the chassis bit, the hull-vs-chassis contacts were
  silently carrying the car through loop chords and ramps ("hoovering") and
  every suspension number measured a lie. `0x0001_fffd` is the load-bearing
  constant of this module.
- **Channel rails steer; tyre scrub doesn't.** A feeler ray per wheel mount
  at the **lip mid-band height** (0.020 m — one at deck level reaches
  nothing, the deck side faces sit *below* the lips) applies a progressive
  spring + fraction dashpot along the wall normal, with outward-velocity
  damping, and a friction-circle-budgeted self-aligning axle torque. Tuning
  the band height was worth more than two hours of controller work.
- **Bump stops need a speed gate.** The loop is a 19-step chord staircase
  (3 mm risers); a full-stop catcher firing on every gentle chord climb
  dumps forward KE inelastically and stalls the car mid-loop. The stop now
  claims the contact only for fast impacts (impact speed > 6.6 sim) or deep
  compression; the suspension spring alone carries slow sustained climbs.
- **The old loop gate was fake, and the fake it passed is instructive.**
  Completion trusted the GLOBAL nearest-rail projection: any state whose
  projection came out past `exitAt` was a lap. At 1.41 R the car flies
  ballistically through the LOOP INTERIOR — never inverted, never touching
  the deck — and the projection teleports its arc under the loop and past
  the exit. Telemetry at the “apex” read x = 0.218, y = 0.051, upY = +1
  (upright!) while `s` advanced past `exitAt`. The hardened gate demands
  witnesses AT the apex: chassis inverted (upY ≤ −0.5), deck structurally
  loaded (support force ≥ 400 sim N, not ray proximity), apex speed ≥
  √(g·r)·(1+ε) measured at the slowest sample inside an adaptive
  ±(arc window + 2·step travel) window — a fixed window was NARROWER than
  one step’s travel at threshold speed and missed every real apex.
- **Speed scaling was wrong by √S** (see the table above): `toWorldSpeed`
  ÷√S with `g_sim = S·g` is dimensionally impossible — time is scale-
  invariant, velocity scales at S. Fixing it is what moved the roll metric
  onto the §7.1 target (2.49 m) and un-faked the apex floor simultaneously.
- **A lap has been driven and it nearly passes.** At r = 0.09, release
  2.8 R, k = 30000, ζ 0.7 (sweep knobs only — the shipped defaults are the
  table’s), the raycast car posts a genuine lap: contact + inversion at
  ph 163 (upY −0.91, deck load 31.7 kN-sim, v above the floor), arc
  advancing through the descending side. It launches off the loop tail
  ~5 cm short of the old exit line and tumbles out. So the completion
  witness lives at the APEX and the exit counts arc advance (a car that
  truly held the apex and then goes airborne over the exit tangent has
  driven the loop; faking that arc requires skipping the apex witnesses).
- **The loop is a suspension SLEW-RATE problem, and that is why the
  threshold is currently DNF.** At threshold the loop bottom demands ≈ 6g
  centripetal in one step; a spring’s capacity is k·suspRest (5040 sim N
  @ k 12000 = 5.1g on this chassis) and its authority is ω = √(4k/m) —
  at k 30000, 55 rad/s against a 20–30 rad/s orbit rate, the suspension
  completes barely one force cycle per lap. Higher k fixes the slew and
  breaks attitude (below). Nothing in the swept k ∈ [12000…120000],
  r ∈ {0.06, 0.09}, ζ ∈ [0.5…0.9] grid passes the honest gate.
  `node tools/loop-audit.mjs <h/r> [k] [zeta]` prints the per-mechanism
  energy budget (damp/catch/guide/roll) of a trial — the entry quadrant
  eats 40–60% of the kinetic energy at threshold, and with the constant-
  force RR law (μ = 0.12) theory puts the loss-free lap floor near 3 R
  even with zero suspension leaks, ABOVE the brief’s [2.25, 2.75] band.
  Closing that is the next suspension work item, not a gate relaxation.
- **Droop is a tether, and both failure modes are traps.** Compression-
  only suspension free-falls the chassis through the loop’s upper half —
  the toy axle carries tension, so the strut must pull (droop stop).
  But: a slack zone beyond the stop’s travel is an ESCAPE HATCH (make the
  force cap arrive WITHIN the travel: droopK·droopMax > droopMaxForce),
  and an UNDAMPED hard stop is a CATAPULT — the axle-grade 400 kN/m stop
  bounced a genuinely inverted car clean off the deck at the apex; the
  tension side needs ζ ≈ 0.4 at ITS OWN spring rate (`droopC`, not
  `suspC`).
- **Attitude authority must respect the inertia TENSOR.** A deck-frame
  torque law sized by one scalar inertia overdrives the axis with the
  smallest one — this chassis rolls at Ix ≈ 0.55 against Iz ≈ 2.0 pitch —
  and the roll mode exploded to −58 rad/s about the apex, throwing the
  car sideways off a lap that was otherwise holding. The fix transforms
  Δω to the chassis frame, scales per-principal-axis, and clamps the
  impulse to the contact force × structural arm (the wishbone’s honest
  moment limit, not a friction-circle fraction).
- **Filtered (wall) contacts must still count as deck witnesses.** The
  push-only guide branch (steep loop-wall incidences, n·up < 0.7) that
  excludes its contacts from the deck-frame vote switches attitude
  tracking off exactly in the wall quadrants where recovery needs it.
  Guide contacts now feed the frame average.
- **Rail projection honesty is camera honesty too.** The same
  `nearestArc`-without-distance mistake passed the loop exploit; on the
  camera side, `railPointAt` snapped to the nearest 1 cm cache sample
  (5 mm stick-slip → visible drift on straights) and the cache rescaled
  arc by the requested-vs-true spacing ratio (a drift GROWING along the
  track, ~40% near the feel track’s x = −1). `rail()` now reports TRUE
  spacing, `railPointAt` interpolates, and `nearestArcInfo` returns the
  distance so the gate can refuse to trust the projection it computes.
- **Banked yaw arcs are the open boundary.** Mid-run yawed arcs (bank/curve
  at 1–1.5 m/s) defeat every pure-raycast lateral model tried — tyre scrub,
  caster trail, weathervane, wall springs — by ploughing or ring-roll. The
  feel track therefore builds the 9° bank + mirrored counter-curve as the
  post-cup run-out (built, colliding, railable; the timed run ends at the
  cup), and crossing banked arcs is the acceptance question for the
  wheel-collider variant, whose tyres physically touch the lips.
- **Layout**: `ramp → straight → loop → gapLip → drop → landing → finishCup →
  bank → curve`, drop 0.52 m. The kit `drop` piece between lip and landing is
  the gap's CATCH: its empty span is the flight, its 40° descending ramp is
  the gap floor, and its exit socket puts the landing 1.5 m below the deck —
  a chain-connected `landing` alone can only sit AT lip height, so the car
  rode the landing face instead of flying to it and the landing impulse could
  never measure (see the metric bullet below). The 0.52 m drop is an honest
  rebalance, not a nerf: until the audit closed the ring-entry injection the
  CATAPULT was paying for the lap (the +1 J/kg above); with the honest solver
  the drop has to pay for it, and 0.45 m no longer feeds both the loop gate
  and the gap jump. It is also deliberately the height where BOTH driving
  lines complete — the harness line and the world/replay line, whose collider
  reification route runs ~0.2 s faster phase through the ring; at 0.50 m the
  game line stalls in the ring corner, at 0.54 m the harness line DNFs. That
  two-line window is the honest state of the seam, and it is narrow.
- **A velocity-free position projection is an energy source, full stop.**
  The guide-branch `alignImpulse` solved `k·u` into a one-step position
  correction with no velocity feedback; wherever `u` was a GEOMETRY reading
  (a tilted face inside ray range) it minted KE at the rate k²·u²·dt²/2m —
  +1.03 J/kg in the single ring-entry step the whole threshold hinged on.
  The fix is not a smaller gain: the guide contact is now the same implicit
  strut spring as the aligned path with its push-out CAPPED at the wheel's
  closing rate (inelastic bump, bounded by the KE present), and the audit
  column for `guide` went from +1.45 J/kg to −1.38 over a full run.
- **A damper may only damp its own coordinate.** The strut damper read the
  extension rate along the chassis `down` axis while pushing along the
  contact normal; anywhere attitude lagged the deck on a rising chord that
  cross-reading charged orbital speed into "suspension heat" (−3.2 J/kg/lap)
  while the wishbone pumped +1.9 back — a pump-and-burn loop the per-step
  audit saw as damp/strut columns ringing 5× per lap. Force and rate on the
  SAME LINE (the normal) makes the work identically ≤ 0; the lap got slower
  and the car faster.
- **The wishbone's `2/dt` rate trick was a rotor waiting to misfire.** It
  hid the law's tracking lag on the loop rig's pitched run-in; from a LEVEL
  entry (the feel track's ring bottom) it spun the chassis to twice the
  deck rate — a 23 J rotor that every riser then billed at ~1 J/kg. Lead is
  now 1.5 (the compliance lead a soft link legitimately needs) with a true-
  rate damper beside it that removes exactly the over-rotation mode and is
  silent when the car tracks.
- **The landing-impulse metric read zero for three separate reasons.**
  (1) its airborne window compared the wheel's WORLD X to an ARC length —
  never true once a ring shared the track; (2) it demanded a flight streak
  on the step the car TOUCHED DOWN, where the streak had just reset — a step
  that cannot exist; (3) the landing deck sat ABOVE the lip's ballistic arc,
  so there was no flight to measure. Fixed in this order: gap-start x from
  the rig pose, a running max over the streak, and the `drop` catch piece.
  It now reports 0.061 N·s off a real ~0.2 s flight, and `expect(
  landingImpulse).toBeGreaterThan(0)` guards all three relapses.
- **Harness and game drive different lines.** `simulate()` and `World` build
  the same track two ways (kit slab colliders vs reified compound hull) and
  the trajectories part by ~0.2 s of phase by the first ramp run-out. Before
  the audit this was invisible — the injection completed laps from any
  phase. Afterwards the phase became the metric, and the feel-drop constant
  is where that seam is paid for (Layout bullet). If a future retune makes
  one route DNF while the other finishes, check THIS before suspecting the
  solver.

`src/camera/run-camera.ts` is the §7.3 run camera: pure class over the rail,
0.4 s speed-scaled lead, 150 ms positional lag, ~350 ms rotational lag aimed
at the *lead* frame — the turn is begun before the eye arrives. Every filter
is the step-independent exponential form; guarded by `tests/unit/camera.test.ts`,
which now pins the straight-line drift regression on the REAL kit rig
(continuity + arc-faithfulness of `KitRig.railPointAt`), not just the
analytic rail.

### Cross-reference (systems engineer, 2026-10-05)

The world level registry (`src/world/levels/feeltrack.level.ts`) now desugars
`FEEL_TRACK_KINDS` + `FEEL_PARAMS` from this module directly (both exported)
instead of duplicating geometry, so retuning a constant here moves the
level, its replay hash and the share links automatically;
`tests/unit/feeltrack-level.test.ts` asserts the two routes reify to
identical splines and collider hulls.
