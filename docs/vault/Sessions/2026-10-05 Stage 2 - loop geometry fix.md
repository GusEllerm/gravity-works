# Stage 2 — loop geometry fix (the trap, the leash, and a third car)

Date: 2026-10-05. Follows [[2026-10-05 Stage 2 - loop gate honesty]].
Role: Feel Engineer. Brief: the loop must be *completable* and the threshold must
be an honest number in [2.25, 2.75] R, with both car variants agreeing and the
feel track finishing under 10 s.

## What was wrong, in the order it was found

### 1. The loop was geometrically impossible to fail — which is worse than impossible to pass

The loop piece was one `pitchArc` over a full `2·pi·r`: a **tangent circle**. A
tangent circle hands the car back *its own entry point*, so a lap that runs out
of speed on the descent re-enters the chords it just climbed, rising at ~11° per
4 mm step. The suspension ray skips a step, re-attaches a chord higher up, and
the car **orbits the bottom corner** — five, six laps, with the apex witnesses
green the whole time because the car really is inverted and really is loaded
each time it whips past the top.

The fix is geometric, not physical. The ring is now **two half-arcs** whose
radii differ by half the exit lift (`pieces.ts loopGeometry`), so the exit deck
returns `LOOP_EXIT_LIFT` **below** the entry, which is what a real toy loop does
— it comes out under its own entry ramp. Level in *and* out was the trap: it
forces the ring to meet its own deck plane at exactly one point.

Why `LOOP_EXIT_LIFT = 0.05`: the car's own envelope. Chassis centre sits 0.04 m
above the deck plus `halfH` 0.01 = **5 cm** of world clearance. At 3 cm the car
still orbits (its roof catches the entry deck's leading edge); at 5 cm every
release height tried exits cleanly. It is derived from `CAR`, not chosen.

And the radius rule the session was sent to record — the loop must be big
enough that the car's *wheelbase* fits the chord without the chassis bridging
the deck:

    R ≥ 1.25 × wheelbase + slab ≈ 0.074 m world   → LOOP_RADIUS = 0.10

`LOOP_RADIUS` was 0.08 and is now 0.10 (`src/feel/feeltrack.ts`), with the
derivation in a comment next to it. `tests/unit/track.test.ts` invariant 2 used
to read "the loop piece IS the analytic circle"; it now asserts the *new*
invariant (front half is the circle of r, back half is an arc of r + lift/2 by
circumscribed-circle curvature, exit level/forward/lift-below, apex at 2r and
inverted) and says out loud that the old wording is false by design.

### 2. The droop tether — a crutch, removed, then re-added at an honest length

`droopMax` was 0.15 sim (5.7 cm on this car): a *leash* that let a genuinely
inverted car free-fall away from the deck through the apex and land back on the
track. That is how "laps" were being completed with the apex witnesses green.
The bump catcher was deleted and the tether went with it.

But 0.03 (3 mm) — the other extreme — is also wrong, and I found that the hard
way: over any **convex crest** (a gap lip, a chord joint) the deck curves away
from the strut axis, the strut goes **slack**, the chassis drops onto its own
floor and chatters (`force 0, 0, 0, 22122, 0` in the trace), and the feel
track's car rode the rest of the course on its underside. **0.08** is the value
that is short enough not to be an escape hatch and long enough to be the clip's
flex plus the tyre's squash.

Related: `suspRest` was **0.42** — a fictional "virtual wheel" radius that had
nothing to do with the geometry. The axle line is `CAR.wheelY = −0.25` with
`wheelR = 0.15`, so the deck sits ~0.4 below the chassis centre and the strut's
rest length is `0.16`. `ATTACH_LOCAL` moved onto the real axle line. The two
variants now agree to the digit because they are describing the same wheel.

### 3. A third car in the house — the live game was driving a different vehicle

`WORLD_ROLL_COEF` was **0.02** with the comment "until the Feel Engineer retunes
ROLL_COEF", while `src/feel/run.ts` shipped **0.12**. One physical property, two
values, so the game and the metrics were simulating different toys and nobody
noticed for a stage. At 0.02 the car reaches the ring with so much surplus that
it *leaves the deck inside the ring* and falls out of the sky — the feel track's
own replay reported `fell` at t = 2.49 s, x = 2.76 m while the harness run of the
same track finished in 3.21 s. `WORLD_ROLL_COEF` now imports `ROLL_COEF`.

While chasing that, a second split: the level's `startSocket` was "the in-socket
of the first placed piece", which the file's own comment called *the same honest
release the feel rigs use*. It is not. The ramp's first 7 cm is its pitch
**blend**, so that socket is a LEVEL patch of deck, and a released car there is
held by Coulomb friction (μ·m·g ≈ 53 N against a downhill component of exactly
zero) forever. The level now takes its release from `rig.poseAt(rig.marks.start)`
— the harness's own pose — so game and metrics agree *by construction* instead
of by somebody remembering to mirror a constant. `SPAWN_ADVANCE` came down to
0.02 for the same reason: every extra centimetre moves the game's release away
from the one the tests measure.

### 4. Telemetry that lied in two directions

- **`wheelRef`**: variant a's physical wheel bodies wedge in the chord staircase
  (0.76 m of lag behind the chassis) and corrupt every distance witness. The
  reference point is now geometric — chassis plus the axle offset rotated into
  world — for both variants.
- **The apex witness** used the projected arc, and the projection is genuinely
  jumpy: a car on the ascent has two decks roughly equidistant (its own chord and
  the run-in it came in on) and the nearest-point search flips between them. An
  arc window therefore opened and closed at random. It is now attitude-based.
- Attitude alone is not enough either — a car tumbling end-over-end in the
  ring's bottom corner reads inverted there too, at near-zero speed, which sinks
  the apex floor of a lap that genuinely went over the top. The partner
  condition first tried a **height band**, which had to be paid for out of sag
  and ride height and then missed the feel track's apex by **2 mm** while the
  identical lap on the loop rig witnessed fine. The shipped condition is the
  **deck's own attitude** at the nearest rail point (`frameAt(arc).up.y ≤
  −cos45`) — scale-free, and it cannot be satisfied by the ring's floor.
- The cup-capture return path reported `apexSpeed` from a **variable nobody
  assigns any more** — so the feel table printed `apex n/a` on a lap whose
  witnesses had fired perfectly. One stale identifier, one whole telemetry
  column missing.

## Measured, at the end of the session

Both variants, `npm run feel`, deterministic (hash-repeat verified):

| metric | value |
|---|---|
| feel track finish | **3.21 s** (was DNF/`fell`) — live replay 2.86 s |
| peak speed | 2.28 m/s |
| apex speed / floor | 1.47 / 0.99 m/s (1.49×) |
| roll from 30 cm ramp (§7.1) | **2.48 m** (target ~2.5) |
| loop threshold, shipped μ | 2.45 R |
| loop threshold, loop rig | **2.01 R** |
| loop ceiling | above ~6 R the car leaves the deck inside the ring |

Suite: **11 files, 91 tests, all green, no `it.fails` anywhere.**

## The threshold is NOT in the target band, and here is the number that says why

The band was [2.25, 2.75] R. The loop rig measures **2.01 R**. Not a search
artefact — a measured energy audit:

Released at 2.0 R of drop (0.20 m), the car reaches the apex — which sits at
2 R, i.e. the *same height it started at* — still carrying **1.55 m/s**. That is
2.97 J/kg of specific energy against the **1.96 J/kg** the drop can pay for.
The lap *gains* about half again the energy gravity provides, concentrated in
the first few steps of the ring, where the chassis attitude still lags the deck
(the ramp's transition is −52° and the alignment torque is slow) and the
implicit springs are asked to absorb a geometry error rather than a bump.

So the honest claim today is: **the gate proves the right things** (inverted +
loaded + above the sqrt(gr) floor + exit witness, all co-occurring, asserted in
`tests/unit/feel.test.ts`) **but the wall is low** because the solver pays for
part of the lap. 2.0 R with true witnesses beats 2.5 R bought with injection.

## Next session, in priority order

1. **The injection.** Trace energy per step through the ring entry at 2.0 R and
   find where ~1 J/kg appears. Candidates ranked: implicit spring doing net work
   on a strut whose *mount* is moving faster than the contact patch (the ray
   reads the far deck when the chassis is pitched); the rail-lip impulse doing
   work along the track rather than across it; damping applied after the
   position solve. The `solid: true` ray already takes the nearest hit, so
   "it hit the far deck" is *not* the explanation — that was checked.
2. Re-run the band assertion once (1) lands. Expect 2.4–2.6 R; the test's
   bracket pair (1.95 fails / 2.0 completes) will need moving with it.
3. The window's **ceiling** is real physics with a missing component: up-stop
   wheels. Either model them or state in the brief that a loop has a speed
   window by design.
4. `rampRollRun`'s landing impulse still reads 0.000 Ns on the feel track — the
   feel track's gap is now short enough that the car never fully leaves the
   deck, so the metric is measuring nothing there. Move it to a rig with a gap
   worth the name.

## Files that changed

`src/track/pieces.ts` (two-arc loop + `loopGeometry` + `LOOP_EXIT_LIFT`),
`src/feel/feeltrack.ts` (`LOOP_RADIUS` 0.10, marks through `loopGeometry`),
`src/physics/car.ts` (axle-line mounts, `suspRest` 0.16, `droopMax` 0.08,
back-face rejection, variant-a coupling rewritten as free-rolling in-plane
velocity match + axial spring), `src/feel/run.ts` (`wheelRef`, apex witness as
attitude + deck attitude, exit witness position-based, `RunResult.witnesses`,
stale `apexSpeed` in the capture path), `src/world/world.ts` (`WORLD_ROLL_COEF`
imports `ROLL_COEF`, `SPAWN_ADVANCE` 0.02), `src/world/levels/feeltrack.level.ts`
(release from the rig), `tests/unit/feel.test.ts` (`it.fails` → real assertions),
`tests/unit/track.test.ts` + `track-rolling.test.ts` (invariants restated for
the egg), `tools/feel.mjs` (footer prose).
