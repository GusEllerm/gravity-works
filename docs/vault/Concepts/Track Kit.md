---
tags: [concept]
---
# Track Kit

> [!abstract] Role
> The contract every stage-2 role builds against: pieces are splines, and mesh, collider, camera rail and socket math all derive from the same spline. Written by the Director at stage-2 kickoff; the Systems Engineer elaborates and owns the code, the Documentarian keeps this true.

## Principle

A piece is **a centreline spline + banking curve + a cross-section profile**. Nothing else. The mesh is the profile swept along the spline; the collider is generated from the same samples (compound convexs — never chord-slab trimeshes, which the bake-off measured as deceleration lies); the camera rail is the same samples at wheel height; sockets are endpoints of the spline with frame. If two derived things disagree, it is a bug in the derivation, never a reason to author twice.

## Space

All authoring in **world metres** at 1:64 visual scale. Physics converts to sim space (×SIM_SCALE, see [[Feel]] §Physics scale factor) at collider-build time — kit code never sees sim units.

## Interfaces (the contract)

```
TrackSpline            src/track/spline.ts
  sample(t, out?):     { pos, tangent, up, banking, solid }  # t in [0,1]; solid=false inside a gap
  length: number                                           # metres
  stations: number; stationTs(): number[]; stationFrames(): TrackFrame[]
                                                          # the shared sample set (invariant 1)
  transformed(m: Mat4): TrackSpline                         # piece-local -> world, keeps samples analytic
  toMesh(o): BufferGeometry                                # sweep of CrossSection
  toColliderDescs(RAPIER, o): ColliderDesc[]                # convexs; smooth rolling deck
                                                          # o carries the length `scale` (kit stays unit-blind)
  railPoints(n, wheelHeight): Vec3[]                        # wheel-height centreline for the run camera
                                                          # (default RAIL_WHEEL_HEIGHT)

CrossSection           src/track/cross-section.ts           # the U channel + rail lips; one for all pieces
                                                          # stored as convex parts so each ring pair hulls

PieceDef               src/track/pieces.ts
  { kind, params, spline(params): TrackSpline, sockets(params): [SocketIn, SocketOut],
    extraGeometries(params): BufferGeometry[] }              # housings / spring / cup bowl
  kinds: straight | curve | bigCurve | sbend | bank | loop | drop | ramp | gapLip | landing
         | booster | springLauncher | finishCup
  booster/springLauncher also carry `power` and `applyImpulse(body, power, dir?)`:
    power is a velocity increment (Δv), so kit code never converts masses or units
  finishCup carries `captureVolume(params): { center, radius }`

Socket                 { pos, tangent, up }                 # a PieceDef endpoint; props may expose extras
                                                          # tangent = direction of travel, so a mated pair
                                                          # is parallel; banking is 0 at every socket

PlacedPiece            { def: kind, params, transform: Mat4, seq }
Build                  { levelId, pieces: PlacedPiece[], seed }   # share payload core; canonical order = seq

Snapping               src/track/snap.ts                    # socket↔socket within tolerance; pure, tested
  snapSocket(a, b): Mat4 | null                             # the gate (tolerances are constants)
  fitSocket(target, source): Mat4                           # exact seating, no tolerance: builder placement
  canonicalBuild(order): PlacedPiece[]                       # stable seq order, never mutates

Build tools            src/track/build.ts
  reify(build): { splines, pieces }                         # canonical order, transforms applied
  chain(kinds, opts): Build                                 # end-to-end placement, pure
  serialize / deserialize                                   # canonical JSON (keys sorted, no whitespace)
  rigFingerprint(build): string                             # FNV-1a of reified samples (NaN poisons)

World                  src/world/world.ts
  World.create(level, build, opts)  # async factory (awaits Rapier); owns scene+physics+track graph
  step(): void                      # fixed 1/120 baked in; systems in fixed order: inputs → car forces → physics → constraints
  state(): interpolable snapshot    # renderer lerps between last two states; never reads physics per frame
  hash(): number                    # FNV-1a of quantised body transforms every 10 steps  (NaN must poison, not zero)
```

## Invariants (tested)

1. `toColliderDescs` and `toMesh` consume the identical sample set — the visual and the hit surface cannot drift (guarded by a shared-samples test).
2. A loop piece of radius r in a build reified from a `Build` reproduces the analytic loop within the tessellation epsilon; the loop-threshold physics test runs on kit geometry, not slabs.
3. `Build` serialises losslessly (JSON round-trip → same hash).
4. Snapping is a pure function; a build is reproducible from (level, build, seed) alone — no hidden world state.

> [!note] Elaborated by the implementation (2026-10-04, systems engineer; interface lines re-verified against `src/track` at the stage-2 close, Documentarian)
> The interface sketch left things open, now fixed by the code — see
> [[Modules/track]] for the reasoning and `Sessions/2026-10-04 Stage 2 - track kit.md`:
> a `sample()` also reports whether the point is over solid track (gaps are part
> of a piece, so `drop` and `gapLip` can carry their own empty space — and after
> the 2026-10-06 landing fix the feel track's gap uses a `drop` **catch ramp**
> between lip and landing);
> `toColliderDescs` takes a length `scale` at build time, which is how the kit
> stays unit-blind while physics still gets sim-space convexs; a collider
> "segment" is the convex hull of *consecutive* rings, merged across rings that
> are collinear — that merging is what "deck quads large and few" means, and a
> straight 2 m deck becomes a handful of hulls rather than a seam per station;
> and `PieceDef.applyImpulse` expresses a launcher's `power` as a Δv.
> Two further deviations from this sketch, kept deliberately: the `World` is
> created through the async factory `World.create` (Rapier's wasm needs an
> await before any body exists), and the camera rail has TWO honest consumers —
> the run camera ([[camera]]) reads it through `KitRig.railPointAt`/`frameAt`
> (true-spacing, interpolated — the snap-to-sample version drifted), while
> `railPoints` remains the analytic kit form.

## Stage-2 acceptance hooks

Feel track = a `Build` on a kitchen-neutral grid using only kit pieces; a headless replay of it (Node, no GPU) finishes with a stable hash; the share link carries that hash and a browser replay matches it.
