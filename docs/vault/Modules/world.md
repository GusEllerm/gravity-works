---
livedocs: module
tags: [module, world]
---
# Modules/world

> [!abstract] Role
> `World` — the contract's spine object (see [[Concepts/Track Kit|Track Kit]]): one object owning physics, scene and the track graph for one run attempt, plus the `Level` shape every role builds against. Owner: Systems Engineer.

## What it does

- `src/world/world.ts` — `World`: `constructor(level, build, opts)` (via `World.create`, which awaits `initRapier` first) reifies the `Build` into ONE fixed body carrying every `spline.toColliderDescs(RAPIER, { scale: SIM_SCALE })` hull (group `TRACK_GROUP` = `0x0001_ffff` — never the default all-ones group, see [[physics]] gotchas), builds plain-material meshes when `visuals` is on, and spawns the raycast-wheel car from `src/physics/car.ts` at the level's `startSocket`, advanced `SPAWN_ADVANCE` down the tangent (a car centred ON the socket hangs half its wheelbase over the deck edge and slides off backwards — measured, do not re-tune blindly).
- `step()` is the contract's fixed 1/120 s in the fixed order **inputs → car forces → physics → constraints**: launcher triggers (world `power` enters the sim as a sim-space Δv via `power * SIM_SCALE`) → `carStep` + `applyRollingResistance` → `stepWorld` → state hash every `HASH_INTERVAL` + `observe` (cup capture at `CUP_CAPTURE_FACTOR` radii, fall below the lowest socket − 0.75 m, stall, timeout).
- `state()` / `states()` are the renderer's ONLY read (positions converted to world metres); `carPose(alpha)` lerps the last two. `hash()` folds the run seed in (`seededHash`), so hash = f(level, build, seed); NaN poisons via `quant`'s distinct words in `src/physics`.
- `src/world/level.ts` — `Level` = `{ id, name, seed, startSocket, budget, par, maxTime, placeholderBuild() }`, plain data; `placeholderBuild()` is the seam the Feel Engineer's real feel track plugs into.
- `src/world/levels/feeltrack.level.ts` — the one stage-2 level and the registry (`LEVELS`, `getLevel`). Its placeholder is `ramp → straight ×3 → finishCup`, the ramp reverse-mounted (half turn about the start socket's up) so gravity runs it backwards as a downward launch — the same transform trick the builder's R-key performs.

## Invariants

- A World is constructed from `(level, build, opts)` and nothing else (Track Kit invariant 4). No hidden world state reaches physics; the seed rides in through `build.seed`.
- The renderer never reads physics per frame; the frame loop in `src/boot.ts` only decides how many fixed steps the elapsed time pays for.
- Termination is a function of the data: terminal `status` or a fixed step cap — so replays of equal data execute equal step sequences.

## Known quirk (measured)

Rapier's query pipeline does not see freshly created colliders until the first `world.step()` propagates the broad-phase — the car's first support ray deterministically misses and the car sinks ~0.3 mm at step 0. Same ordering as the `src/feel` rigs, deterministic on every machine; left as-is on purpose.

## Guarded by

`tests/unit/world.test.ts` (finish, snapshot-pair interpolation, fixed-rate stepping, seed-in-hash, terminal-on-empty-build, visuals) and `tests/unit/replay.test.ts` via `src/replay`.
