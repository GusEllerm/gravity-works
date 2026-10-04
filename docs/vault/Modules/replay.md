---
livedocs: module
tags: [module, replay]
---
# Modules/replay

> [!abstract] Role
> The determinism harness of brief §7.1: replay (level, build, seed) through `World` in Node, no GPU, and read the state hash. Owner: Systems Engineer.

## What it does

`src/replay/replay.ts` — `replayRun(level, build, { maxSteps?, launchSpeed? })`: create the World with `visuals: false`, `launch()`, step until a terminal status or the fixed cap (default 15 s of sim time), return `{ hash, hashValue, steps, time, status }` and free the physics world. Termination depends only on the data, so equal inputs execute equal step sequences and must hash equal — which is the whole point.

The browser side of a replay is `src/boot.ts`'s shared-run page: `parseShareUrl` → `getLevel` → `replayRun` → compare with the embedded hash → `verified`/`mismatch` in `#gw-replay-status`, echoing the recomputed hash beside it.

## Measured

Node and the built Chromium page produce the same hash for the placeholder feel track (`77b6cfc3` seen from both sides) — same-machine and same-engine verification holds with the shipped rapier3d-compat build. The cross-platform claim is still open ([[Home]] Deferred; QA owns the stage gate).

## Guarded by

`tests/unit/replay.test.ts` (same build twice → same hash; JSON round-trip → same hash; a piece removed → different hash) and `tests/e2e/replay.spec.ts` (verified/mismatch in the real page).

## Depends on / used by

`src/world`, `src/physics`, `src/track` — all headless-safe. Used by `src/boot.ts` and the tests.
