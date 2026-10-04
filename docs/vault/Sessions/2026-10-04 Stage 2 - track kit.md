---
livedocs: snapshot
tags: [session, stage-2]
---
# 2026-10-04 Stage 2 — track kit (systems engineer)

## Goal

Build the track kit against `docs/vault/Concepts/Track Kit.md`: centreline
splines with parallel-transported frames and a banking curve, one U-channel
cross-section swept into meshes and compound convex colliders from the *same*
samples, the 13 piece kinds, socket snapping, `Build` reify + canonical
serialisation, the `trackkit` harness scene with one record render, and the four
contract invariants as headless tests. Borrowed chore: make the two vacuous
self-equal assertions in `tests/unit/tokens.test.ts` say something real.

## What was done

- `src/track/spline.ts` — `TrackSpline` as a piecewise-arc curve: every segment
  turns its tangent at a constant rate about a fixed world axis (pitch toward the
  frame's up, yaw toward `tangent x up`), so `t` *is* arc length, and rotating
  the frame by that same rotation is parallel transport (axis perpendicular to
  the tangent ⇒ no twist). A vertical loop therefore stays upright and comes out
  inverted at the apex instead of corkscrewing. Banking is separate
  piecewise-linear data composed onto the transported up vector.
- `src/track/cross-section.ts` — `U_CHANNEL` as five **convex** parts (deck, two
  rails, two lips) that tile the section. That decomposition is what makes the
  collider generator possible: the convex hull of two consecutive rings of a
  convex part is a legal Rapier convex.
- `src/track/pieces.ts` — the 13 `PieceDef`s, piece-local (spline starts at the
  origin heading +x). `drop` and `gapLip` carry their own empty span
  (`solid: false`), so the gap is data, not an absence of a piece.
  `booster`/`springLauncher` carry `power` and the shared `applyImpulse` stub;
  `finishCup` carries a `captureVolume` and a lathe bowl.
- `src/track/socket.ts`, `src/track/snap.ts`, `src/track/build.ts` — socket
  frames, `snapSocket` (gate) / `fitSocket` (seating) / `canonicalBuild`, and
  `reify` / `chain` / `serialize` / `deserialize` / `rigFingerprint`.
- `src/dev/scenes/trackkit.ts` — all 13 pieces end to end, each seated by the
  same socket math the builder will use. Record render:
  docs/explorations/trackkit.png (establishing, port 4196).
- `tests/unit/track.test.ts` (25 tests) and `tests/unit/track-rolling.test.ts`
  (5 tests). `tests/unit/tokens.test.ts`: the two `expect(x).toEqual(x)` lines
  are now a CSS/token drift guard, a fresh-object check, a "derived values are
  actually derived" check and colour-math endpoints/symmetry.

## Measurements worth keeping

- Collider runs: a 2 m straight is **6 hulls per part** (5 parts), not 40. The
  merge rule is "while the accumulated turn stays under `colliderRunMaxTurn`",
  so straight deck is one flat box and bends degrade to one hull per ring pair.
- A sphere given 1.2 m/s on a flat kit deck rolls 0.579 m; the same sphere on one
  perfect cuboid rolls 0.611 m. **The deck adds ~5 %, not 150 %.**
- Chord-slab bake-off (in the *contract's* words): 12 chord slabs of the same
  5° incline, built locally in the test exactly as stage 1 emitted them (chord
  boxes with the 20 % stitch overlap) → sphere 2.154 m vs kit 1.832 m, and the
  stage-1 car on the same two decks 3.590 m vs 3.675 m. **The ≥3× roll-distance
  gap the kickoff note asked for does not exist for a rigid body**, and the
  reason is geometric: 12 chords spread over ≤5° of pitch deviate from the swept
  surface by fractions of a millimetre, and a rolling body cannot feel a seam it
  never has to cross. Where chords *do* fail, the test measures that instead: 12
  chords of a kit loop cut 2.7 mm into the running surface where the kit's own
  hulls cut 0.44 mm (6×). Conclusion recorded in the Decision Log: the stage-1
  "2.5× false deceleration" lived in the suspension's contact normals at slab
  seams, not in the surface — the Feel Engineer's rigs are where that number can
  move.
- Chaining all 13 pieces: every joint seats to < 1e-12 m and passes the
  `snapSocket` gate, including the joint after a launch lip (the exit arc of a
  `gapLip` flattens inside the empty span, so the socket is still level).
- Display build: ~510 collider hulls and ~5k triangles for the whole 13-piece
  kit; the display group is uniformly scaled to fit the establishing frustum
  because 13 end-to-end pieces are longer than the canonical framing covers.

## Decisions

- `[systems engineer]` **Piecewise arcs, not centripetal Catmull-Rom.** The
  contract allowed either. Arcs give an exact arc-length parameter, an exact
  loop (invariant 2 holds to 1e-17, not to tessellation error) and exact
  parallel transport; the cost is that a tangent angle can only be entered
  through a blend arc, which every pitch piece does anyway.
- `[systems engineer]` **Colliders merge collinear rings into one hull**
  (still a hull of consecutive rings) rather than one hull per station pair.
  Alternatives: one hull per pair (a seam every 5 cm — the thing the deck is
  supposed to avoid) or one box per chord (that is the slab geometry we are not
  doing).
- `[systems engineer]` **`power` on launchers is a Δv, not a N·s.** The hook
  reads mass and velocity off the body it is given, so kit code stays
  scale-blind; the caller converts once via `SQRT_SIM_SCALE`.
- `[systems engineer]` **`toColliderDescs(rapier, { scale })`** instead of the
  kit importing `SIM_SCALE`. The contract says collider-build time is where the
  conversion happens and that kit code never sees sim units; a parameter is the
  only way to satisfy both.
- `[systems engineer]` **Gaps belong to pieces** via `SegmentSpec.solid`.
  Alternative: a dedicated gap piece, which would have made `drop`/`gapLip`
  unchainable and put socket bookkeeping in the builder.

## Next (for other roles)

- `src/world/world.ts` should build one fixed body per build and attach
  `spline.toColliderDescs(RAPIER, { scale: SIM_SCALE, friction })`; nothing else
  in the game needs the collider generator.
- The Feel Engineer's feel track can now be a `Build`: `chain(kinds, { params })`
  + `reify` gives the same geometry this scene renders, and `rigFingerprint`
  gives a cheap pre-hash to compare against the replay's state hash.
- Builder UI: use `fitSocket` to seat, `snapSocket` to decide whether a ghost is
  legal. `chainJoints`-style legality is just `snapSocket` on world-space sockets.
- Technical Artist: `pieceGeometries` is the seam where swept channel geometry
  and prop-shaped extras meet; triangle budget is ~1k per straight, ~1.5k per
  loop, ~5k for the whole 13-piece kit.

## Addendum — session 2 on the branch (later the same day): feel track completes

Picked up from the handoff block. What moved, and what it took:

- The `TRACK_GROUP` filter mask still admitted the chassis body: the raycast
  car was being physically carried by hull-vs-track contacts through ramps
  and loop chords ("hoovering") while the suspension measured fiction.
  Track group is now `0x0001_fffd`. This one change exposed the real
  dynamics and invalidated several tuned-on-top-of-nothing numbers.
- Straight-line stability turned out to be a **geometry** problem, not a
  controller problem: the channel's lower block leaves its inner wall
  0.5 mm proud of the wheel side face, and the wheel never reached the lip
  face where the real clearance lives. Feel rays now ride the **lip mid-band
  height** (0.020 m) with 3.5 mm total slack; the rails became the steering
  of record and four successive controller designs (scrub, caster,
  weathervane, COM-cancel) retired gracefully in favour of geometry.
- The loop was never a speed problem — it was the **bump stop eating the
  car**: 19 chord risers × a full-stop catcher on every gentle climb.
  Speed-gated (`vdot < 6.6` sim or deep compression), the car sails through.
- Layout: bank + counter-curve moved after the finish cup as run-out —
  mid-run banked yaw arcs are the honest boundary of the pure-raycast model
  (four lateral models, same plough/ring-roll wall; the variant-a question
  for stage 3).
- **Raycast variant completes the kit feel track headless: 3.07 s,
  deterministic.** Roll metric at 2.65 m (2.5 ±10% ✓). Loop gates: H/R =
  1.41 (raycast) / 2.85 (wheel colliders) at R = 0.03.
- Run camera shipped as a pure class with five timing tests (§7.3 numbers
  verified: 150 ms positional τ, ~350 ms rotational τ aimed at the lead
  frame; steady-state straight-line gap = v·(lead − τ), which the test
  documents rather than hand-waves).
- All 48 tests green; physics.md reconciled and stamped; pushed as
  `stage2-feel-b`.

Open for the next session: variant-a completion (its wheels touching lips
should cross the bank; the same feeler model then retires), game.ts wiring
of RunCamera into the feel scene, and the PD-vs-rail trade for wheel-collide
contacts at the cup approach.
