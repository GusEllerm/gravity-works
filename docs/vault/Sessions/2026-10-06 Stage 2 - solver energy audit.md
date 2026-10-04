---
title: 2026-10-06 Stage 2 - solver energy audit
date: 2026-10-06
tags: [session, stage-2, feel]
---

# 2026-10-06 Stage 2 — solver energy audit

Brief: the loop threshold measured 2.01 R (pre-geometry-fix logs) against a
2.4–2.6 R target, and the deficit was attributed to ~1 J/kg of energy the
solver was injecting into the lap. Task: build a per-step energy audit, name
the mechanism with numbers, fix it properly (no band-widening, no track
edits that move the wall), re-run the bisect, and fix the unmeasurable
landing-impulse metric. All four landed; the route there had surprises.

## What the audit found (deliverable 1)

`node tools/feel.mjs audit [hR] [arc0 arc1]` steps the loop rig logging, per
step: total specific energy (KE including tensor-correct rotation + PE), the
work of every impulse site in `car.ts` (`WORK` table, gated by `WORK.on`,
zero-cost when off), and the unexplained remainder `res` (solver noise; it
never exceeded 5e-2 J/kg/step anywhere).

The injection is the ring-entry guide contact, ONE step, **+1.03 J/kg**: the
front ray reads the corner between the ramp run-out and the first rising
chord at toi ≈ 0.03 with a 59°-tilted normal, so the spring coordinate
`compression` = 0.13 is a GEOMETRY READING, NOT PENETRATION — and the guide
branch solved it with `alignImpulse`, a velocity-free position projection
that spends `k·u·dt` as pure new velocity, half of it along the track. Two
secondary channels ring per lap in the same ledger: damper −3.2 / wishbone
+1.9 J/kg circulating pump-and-burn through the rising chords (the damper
read `down`-axis rate while pushing along `n0` — cross-reading orbital speed
into "suspension heat"), and the wishbone's `2/dt` rate target, an old fit
against the EMA's spike-averaging that spins the chassis to twice the deck
rate from a level entry (the feel track's ring-bottom rotor: wz 30 against a
16 deck, and every riser thereafter a ~1 J/kg slam).

## The fixes (deliverable 2)

- **Guide branch = capped bump, not projection, not wall.** Same implicit
  strut spring as the aligned path, velocity term included, with the
  position push-out capped at the wheel's CLOSING rate (`min(u, dt·vClose)`
  — a suspension reclaims geometry at the rate it closes it; u/dt on a
  14 cm phantom reading is a 15 m/s wall-shove, which the audit showed as
  the −1.74 J/kg exit-junction slam on the far side of the ring). Guide's
  running total: +1.45 → −1.38 J/kg/run.
- **Damper work-conjugate:** force along `n0`, rate `v·n0`. Work is
  identically −m·j²-terms ≤ 0. The pump-and-burn loop is gone by
  construction, and straights/valleys are silent on the same grounds the
  old note only CLAIMED.
- **Wishbone: lead 2 → 1.5, plus a true-rate rotor damper** (0.15/step
  toward `rawTrue`, the un-led frame rate). Silent when the car tracks;
  removes exactly the over-rotation mode. Dead-link, BE-spring, force-
  couple, integral and speed-capped variants were all built and measured
  — every zero-lag formulation chatter-ratchets on the chord staircase
  (the ramp-start stall of the link laws is a RECTIFIER: attitude chatter
  + half-cycle guide contact converts it into a braking ratchet), so the
  compliant lead + honest damper is the shipped shape.

## What the numbers are now (deliverable 3)

Loop rig, honest gate, both variants: 2.2 R n / 2.4 R Y; bisect lands 2.4
(μ = 0) / 2.51 (shipped μ). The old 7 R "ceiling" was ALSO solver-made —
the same injection kicking the car off the deck at exit — and with it gone
the car holds the ring through 7 R; the physical up-stop ceiling is stated
as open, not as a pass. Mid-window dips (3.0/3.5 R fail on apexFloor) are
real bounce-phase losses and are documented in the test rather than
smoothed over: a dip row proves the gate can say no ABOVE the threshold,
which no gaming solver ever needed to do. Tests updated to the measured
bracket; the duplicated ceiling test is one honest test now.

## The feel track had to be rebalanced — and why that's honest

Removing the catapult un-finished the feel track: completion had been
PAYING for the ring's entry losses (+1 J/kg) out of the injection. The
drop now pays for them: FEEL_DROP_HEIGHT 0.45 → 0.52 m. Not a nerf — the
level's own energy budget, and 0.52 is deliberately the height where BOTH
driving lines complete: the world/replay route reifies colliders differently
enough to run ~0.2 s faster phase through the ring, at 0.50 the GAME line
stalls in the ring corner and at 0.54 the HARNESS line DNFs. That narrow
window is the state of the harness-vs-game collider seam and is written
down in [[feel]] rather than papered over; a real fix is a seam fix
(unify collider construction), not a constant.

## The landing impulse: zero for three stacked reasons (deliverable 4)

(1) the airborne window compared the wheel's WORLD X against an ARC length
— dead since the ring ate the difference; fixed to the gap's start x from
the rig pose. (2) the flight streak was checked on the step the car TOUCHED
DOWN, where `grounded` has just reset the streak — a step that cannot
exist; fixed to a running max. (3) the landing deck sat ABOVE the lip's
ballistic arc (chain continuity seats `landing` at the lip socket), so the
car rode the landing FACE and was never airborne to measure; fixed with the
kit's own `drop` piece between lip and landing — its empty span is the gap,
its 40° catch slope is the gap floor, its socket drops the landing 1.5 m.
Metric now reads 0.061 N·s off a real ~0.2 s flight, guarded by
`toBeGreaterThan(0)`.

## Numbers to keep honest

- audit at 2.4 R: no single step injects > 0.1 J/kg (pre-audit entry step:
  1.03); wishbone lap total is still mildly positive (+2.7 over the whole
  run incl. run-out) — it is the attitude-spring exchange through the deck
  frame, bounded per step; if it ever grows a > 0.1 J/kg single step, that
  is the relapse signature to bisect.
- feel track: FINISH 3.31 s both variants, apex 1.08 (floor 0.99), peak
  3.00, landing 0.061 N·s; world replay finished 361 steps, hash
  `099403c7`.
- roll 2.47 m (§7.1), threshold 2.4 R in band.
- Suite: 90/90; the deleted duplicate ceiling test accounts for 91 → 90.

## Files

`src/physics/car.ts` (guide bump, conj damper, wishbone lead+rotor damper,
WORK instrumentation), `src/feel/run.ts` (landing window x-from-pose,
streak max), `src/feel/feeltrack.ts` (drop piece in chain, FEEL_DROP 0.52,
LIP_LEN), `tools/feel.mjs` (audit mode), `tests/unit/feel.test.ts`
(measured bracket, ceiling honesty, landing guard), docs modules
feel/physics/world/replay.
