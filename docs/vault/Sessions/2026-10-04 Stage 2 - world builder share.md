---
livedocs: snapshot
tags: [session, stage-2]
---
# 2026-10-04 Stage 2 — world, builder, save, share, replay (systems engineer)

## Goal

The spine's right half, against `docs/vault/Concepts/Track Kit.md`:
`World` + `Level` (`src/world`), the browser game shell (`src/boot.ts`),
the DOM builder (`src/ui/builder.ts`), save (`src/save`), share
(`src/share`), the headless replay harness (`src/replay`), the
`worldsmoke` scene, and the tests that prove determinism and the
share→replay→verified round trip. `src/physics`, `src/feel`, `src/camera`
and `src/track` untouched (Feel Engineer runs parallel).

## What was done

- `src/world/world.ts` — `World` per contract: one fixed body of
  compound convex colliders from `TrackSpline.toColliderDescs` (explicit
  `TRACK_GROUP`, never the default group), the raycast car, fixed 120 Hz
  steps in the order inputs → car forces → physics → constraints,
  interpolable `state()`/`states()`/`carPose(alpha)`, and a seed-folded
  FNV state hash (every `HASH_INTERVAL`, NaN poisons).
- `src/world/level.ts` + `src/world/levels/feeltrack.level.ts` — the
  minimal `Level` data shape and the registry; the one level's
  `placeholderBuild()` is a straight+ramp run (`ramp → straight ×3 →
  finishCup`) whose ramp is reverse-mounted so gravity launches the car.
  Real feel track plugs into the same `placeholderBuild()` seam.
- `src/boot.ts` — real shell: fixed-timestep loop with accumulator +
  interpolation (renderer reads only last two states + alpha), builder
  wiring, autosave, a `#s=` shared-run page printing
  verified/mismatch; `?harness=1` path untouched; `hashchange` reloads.
- `src/ui/builder.ts` — 13-button tray, open-socket targets, ghost via
  `fitSocket` with the `snapSocket` gate reported in colour, remove, live
  counter, keyboard (arrows/R/Enter/Delete) and real buttons with roles.
- `src/save/save.ts` — one key, `{v:1,…}`, `MIGRATIONS` from v0→v1
  (builds stored as canonical `serialize` strings).
- `src/share/share.ts` — canonical JSON → raw DEFLATE (injectable codec)
  → base64url `#s=`; garbage refused at fragment and payload level.
- `src/replay/replay.ts` + `src/dev/scenes/worldsmoke.ts`.
- Tests: `tests/unit/{world,replay,save,share,boot}.test.ts`,
  `tests/e2e/builder.spec.ts`, `tests/e2e/replay.spec.ts`.

## Measurements / gotchas

- The placeholder build finishes in ~1.8 s (217 steps), hash
  `77b6cfc3`, identical from Node replay and the built Chromium page.
- Spawning a car centred exactly on the start socket drops half its
  wheelbase off the deck end-face; it slides backwards off the ramp.
  `SPAWN_ADVANCE` (0.05 m down-tangent) is the fix.
- Rapier 0.21's query pipeline ignores fresh colliders until the first
  `world.step()`: step 0's support ray deterministically misses (≈0.3 mm
  sink). Same in the feel rigs; left deterministic rather than papered over.
- A `THREE.Matrix4` saved via `JSON.stringify` becomes `{"elements":[…]}`
  — why the save envelope stores canonical build JSON strings instead.
- Fragment-only navigation never re-runs boot (same-document) — the shell
  reloads on `hashchange` so replay links are shareable by copy-paste.

## Decisions

- `[systems engineer]` **The level placeholder is a reverse-mounted ramp,
  not a launcher.** Alternatives: launch speed (hides gravity's role) or a
  drop gap (needs entry speed to clear); the reverse mount is pure
  socket-math, runs on gravity alone, and exercises the same
  half-turn-about-up transform the builder's R-key produces.
- `[systems engineer]` **`power` stays world Δv in `World`, converted once
  via `SQRT_S`** — the kit's launcher hook contract, honoured at the only
  place that knows both spaces.
- `[systems engineer]` **Save stores canonical build JSON, not objects**
  (see Matrix4 gotcha; also makes save and share byte-comparable).
- `[systems engineer]` **Codec injection instead of importing `node:zlib`
  in `share.ts`** — keeps the browser bundle warning-free; tests and the
  e2e pass the zlib codec explicitly to prove interop.
- `[systems engineer]` **Cup capture at 2× radius** — the chassis centre
  rides ~1.2 cup-radii above the cup centre, so 1× could never fire
  (measured on the placeholder run).

## Next (for other roles)

- Feel Engineer: replace `FEELTRACK.placeholderBuild()` with the real
  track; par/time budget fields are in `src/world/levels/feeltrack.level.ts`.
  `World` reads nothing else. If the retuned `ROLL_COEF` moves off 0.02,
  change `WORLD_ROLL_COEF` or pass `rollCoef` in `WorldOptions`.
- Level Designer: levels are data + one `placeholderBuild()` factory;
  `getLevel` resolves share links, so new levels need only registration.
- Art: swap the plain materials in `buildTrackMeshes`/`World` visuals for
  toon classes; the collider path is independent.
- QA: cross-platform hash claim still open — the harness exists
  (`replayRun`) for CI runs on other matrices.
