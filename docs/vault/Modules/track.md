---
livedocs: module
tags: [module, track]
---
# Modules/track

> [!abstract] Role
> The track kit: pieces are splines, and mesh, colliders, camera rail and socket
> math all derive from the same samples. Contract in
> [[Concepts/Track Kit|Track Kit]]; owner: Systems Engineer.

## What it does

Thirteen piece kinds (`PIECE_KINDS`) become centreline splines (`TrackSpline`),
which become a swept U-channel mesh (`toMesh`), a compound of convex colliders
(`toColliderDescs`), a camera rail (`railPoints`) and two sockets
(`splineSockets`). Placed pieces (`PlacedPiece`) form a `Build`, which reifies
(`reify`) back into splines and serialises to canonical JSON (`serialize`) — the
share-payload core. Nothing in this directory reads the world, the physics
solver, or a scene graph: it is pure data and pure functions, so the same code
runs in the builder, the renderer and a headless Node replay.

## Files

- `src/track/spline.ts` — `TrackSpline`, `SegmentSpec`, `TESSELLATION`,
  `TrackFrame`. A piecewise-arc centreline: each segment turns its tangent at a
  constant rate about a fixed world axis (a pitch rate toward the frame's up and
  a yaw rate toward `tangent x up`), which makes `t` an exact arc-length
  parameter and straights, arcs, pitched runs, helices and full vertical loops
  the same primitive. Frames are carried by that same rotation — the axis is
  always perpendicular to the tangent, so there is no twist about it: parallel
  transport, minimal twist, a loop stays upright and comes out inverted at the
  apex. Banking is separate data (piecewise-linear between `bankFrom` and
  `bankTo`) composed onto the transported up vector, and `solid: false` marks a
  gap segment that carries neither mesh nor collider.
- `src/track/cross-section.ts` — `U_CHANNEL`, the one profile every piece
  sweeps, stored as five *convex* parts (`deck`, `rail-left`, `lip-left`,
  `rail-right`, `lip-right`) whose union is the U-channel. Parameters are named
  constants (`DECK_HALF_WIDTH`, `TRACK_HALF_WIDTH`, `DECK_THICKNESS`,
  `RAIL_HEIGHT`, `RAIL_LIP_REACH`, `RAIL_LIP_THICKNESS`); the deck's running
  surface is at section `y = 0`, so the centreline *is* the surface the wheels
  touch. `sectionRings()` is the single place section geometry becomes world
  geometry.
- `src/track/pieces.ts` — `PieceDef`, `PIECES`, `PIECE_KINDS`,
  `pieceSpline`, `pieceSegments`, `pieceGeometries`, `applyImpulse`,
  `captureVolume`, `resolveParams`, `defaultParams`, segment sugar
  (`straight`, `pitchArc`, `yawArc`, `empty`). Piece-local space: the spline
  starts at the origin heading +x with up +y. The `loop` piece is NOT a single
  circle: `loopGeometry(radius, exitLift, lead)` splits the ring into an ascent
  half of radius r and a descent half of r + exitLift/2, so the exit deck comes
  out LOOP_EXIT_LIFT (5 cm, the car's own envelope height) BELOW the entry. A
  tangent circle returns the car onto the rising chords it just climbed, and a
  car without lap energy then orbits the bottom corner indefinitely — see
  [[2026-10-05 Stage 2 - loop geometry fix]].
- `src/track/socket.ts` — `Socket` plus the frame maths (`socketMatrix`,
  `socketAt`, `splineSockets`, `transformSocket`, `socketGap`, `tangentAngle`,
  `rollAngle`). A socket's `tangent` is the *direction of travel*, so mated
  sockets are parallel rather than facing each other; every piece is designed to
  start and end flat and unbanked, which is what lets a banked piece mate with a
  flat one.
- `src/track/snap.ts` — `snapSocket` (the gate: within `SNAP_TRANSLATION_TOL`,
  `SNAP_ANGLE_TOL`, `SNAP_ROLL_TOL`, returns the corrective `Mat4` or null),
  `fitSocket` (exact seating, used to hang a piece's local in-socket on a world
  target) and `canonicalBuild` (stable `seq` order). Both are pure.
- `src/track/build.ts` — `Build`, `PlacedPiece`, `reify`, `chain`, `serialize`,
  `deserialize`, `rigFingerprint`.

## How it works

**Stations are the shared currency.** `stationTs()` is `i / stations`, and both
generators go through `stationFrames()`, which calls `sample()` exactly once per
station; `TESSELLATION` picks the count from the length *and* the total turn
(≤ 0.05 m and ≤ 10° per station), so a loop stays round while a straight stays
cheap. `toMesh` and `toColliderDescs` therefore consume a bit-identical sample
set — that is invariant 1, and `tests/unit/track.test.ts` proves it with a
spline subclass that records every `sample()` call.

**Colliders are hulls of consecutive rings, merged while straight.** For each
convex part and each run of consecutive rings whose accumulated turn stays under
`TESSELLATION.colliderRunMaxTurn` (and under the length/ring caps) the generator
emits one `convexHull` of those rings' section points. On a straight stretch
that collapses the whole deck into a handful of large flat boxes — no seam every
5 cm — which is what "deck quads stay large and few" means in practice; on a
bend it degenerates to the hull of each consecutive ring pair. A null hull is
treated as a bug, not skipped, because a silently missing deck panel is exactly
the kind of lie this module exists to prevent. Scale is a *parameter*
(`toColliderDescs(RAPIER, { scale: SIM_SCALE })`): the kit stays unit-blind and
never sees sim space.

**Pieces.** All 13 kinds are flat and unbanked at both sockets, so a chain of
them (`chain`) seats every joint exactly and every joint passes `snapSocket`
(asserted per joint in `tests/unit/track.test.ts`). Gaps are part of a piece:
`drop` (a vertical step whose empty span follows a ballistic-ish path) and
`gapLip` (rise to the launch angle, then an empty flattening arc) carry their
own empty space via `empty()`, which emits neither mesh nor collider and leaves
the centreline continuous for the camera rail. `booster` and `springLauncher`
carry a `power` param and the same `applyImpulse` hook, where power is a
**velocity increment** (Δv along a direction, default the body's own velocity)
rather than a Newton-second — mass and velocity are read from the body it is
applied to, which keeps kit code scale-blind; a world Δv becomes a sim Δv via
`SIM_SCALE` (velocity scales at S, time being
scale-free — `SQRT_SIM_SCALE` was a dimensional bug and is gone). `finishCup` adds a bowl to
`pieceGeometries` and a `captureVolume` sphere.

**Builds are data.** `serialize` writes canonical JSON (keys in ascending
alphabetical order at every level, no whitespace, matrices as their 16 float64
elements), so two equal builds are byte-identical and `deserialize` →
`serialize` is stable. `rigFingerprint` is an FNV-1a over 32 quantised samples
per reified spline — a NaN poisons the hash with a distinct word instead of
folding into zero.

## Invariants and the tests that guard them

| Track Kit invariant | Test |
|---|---|
| 1 — mesh and colliders consume the identical sample set | `tests/unit/track.test.ts` › *invariant 1* — recording spline: same `t` list, same frames, hull vertices are the swept section points; plus *a straight piece merges its deck into a handful of large quads* |
| 2 — a loop piece: front circle, dropped exit, no trap | *invariant 2* — the ascent half lies on the circle of radius r within tessellation epsilon; the descent half's radius is recovered from three samples by circumscribed circle and is r + LOOP_EXIT_LIFT/2; apex at 2r with `up` inverted and banking 0; entry level and forward, exit level, forward and LOOP_EXIT_LIFT BELOW the entry |
| 3 — a `Build` serialises losslessly | *invariant 3* — `rigFingerprint(deserialize(serialize(b))) === rigFingerprint(b)`, byte-identical canonical output for reordered input, malformed payloads rejected |
| 4 — snapping is pure, builds are reproducible | *invariant 4* — purity/no-mutation, tolerance edges on all three tolerances, `canonicalBuild` stability, `reify` seats every joint of a chained build |

Deck quality lives in `tests/unit/track-rolling.test.ts`: a sphere rolls within
10 % of the distance it rolls on a single perfect cuboid (measured 0.579 m vs
0.611 m — the deck adds no false deceleration), the collider surface deviates
from the centreline no further than the mesh does, and 12 chord slabs of a kit
loop cut 6× deeper into the running surface than the kit's hulls (3.6 mm vs
0.56 mm — the hull figure grew when the loop became two arcs of different radius
joined at the apex; a curvature step leaves a deviation of its own). It also
records the honest result of the chord-slab bake-off described
in [[Decision Log|2026-10-04 (systems engineer)]]: on a 5° incline a *rigid*
sphere rolls about the same distance on kit hulls and on a faithful 12-chord
slab rebuild (1.83 m vs 2.15 m; the stage-1 car on the same two decks measured
3.68 m vs 3.59 m), so the stage-1 "2.5× false deceleration" is not a surface
effect — the 3× roll-distance assertion the kickoff note asked for is not
physically reachable and was replaced by the deviation measurement above.

## Depends on / used by

Depends only on `three` (math and `BufferGeometry`). Colliders are built against
a caller-supplied Rapier namespace (`RapierColliderFactory`), so this directory
imports no physics. Consumed by `src/world` (mesh + colliders per piece), the
builder UI (`snapSocket`, `fitSocket`, `chain`), the run camera (`railPoints`)
and the share/replay harness (`serialize`, `deserialize`, `rigFingerprint`).
Exercised in the browser by the `trackkit` harness scene
(`src/dev/scenes/trackkit.ts`).
