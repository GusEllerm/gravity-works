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
  sample(t: number):   { pos, tangent, up, banking }        # t in [0,1]
  length: number                                           # metres
  toMesh(o): BufferGeometry                                # sweep of CrossSection
  toColliderDescs(RAPIER): ColliderDesc[]                  # convexs; smooth rolling deck
  railPoints(n): Vec3[]                                    # wheel-height centreline for the run camera

CrossSection           src/track/cross-section.ts           # the U channel + rail lips; one for all pieces

PieceDef               src/track/pieces.ts
  { kind, params, spline(params): TrackSpline, sockets(params): [SocketIn, SocketOut] }
  kinds: straight | curve | bigCurve | sbend | bank | loop | drop | ramp | gapLip | landing
         | booster | springLauncher | finishCup

Socket                 { pos, tangent, up }                 # a PieceDef endpoint; props may expose extras

PlacedPiece            { def: kind, params, transform: Mat4, seq }
Build                  { levelId, pieces: PlacedPiece[], seed }   # share payload core; canonical order = seq

Snapping               src/track/snap.ts                    # socket↔socket within tolerance; pure, tested

World                  src/world/world.ts
  constructor(level, build, opts)   # owns scene+physics+track graph
  step(dt fixed 1/120): void        # systems in fixed order: inputs → car forces → physics → constraints
  state(): interpolable snapshot    # renderer lerps between last two states; never reads physics per frame
  hash(): number                    # FNV-1a of quantised body transforms every 10 steps  (NaN must poison, not zero)
```

## Invariants (tested)

1. `toColliderDescs` and `toMesh` consume the identical sample set — the visual and the hit surface cannot drift (guarded by a shared-samples test).
2. A loop piece of radius r in a build reified from a `Build` reproduces the analytic loop within the tessellation epsilon; the loop-threshold physics test runs on kit geometry, not slabs.
3. `Build` serialises losslessly (JSON round-trip → same hash).
4. Snapping is a pure function; a build is reproducible from (level, build, seed) alone — no hidden world state.

## Stage-2 acceptance hooks

Feel track = a `Build` on a kitchen-neutral grid using only kit pieces; a headless replay of it (Node, no GPU) finishes with a stable hash; the share link carries that hash and a browser replay matches it.
