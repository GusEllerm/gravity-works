---
livedocs: module
tags: [module, replay]
---
# Modules/replay

> [!abstract] Role
> The determinism harness of brief §7.1: replay (level, build, seed) through `World` in Node, no GPU, and read the state hash. Owner: Systems Engineer.

## What it does

`src/replay/replay.ts` — `replayRun(level, build, { maxSteps?, launchSpeed? })`: create the World with `visuals: false`, `launch()`, step until a terminal status or the fixed cap (default 15 s of sim time), return `{ hash, hashValue, steps, time, status }` and free the physics world. Termination depends only on the data, so equal inputs execute equal step sequences and must hash equal — which is the whole point.

The browser side of a replay is `src/boot.ts`'s shared-run page: `parseShareUrl` → `getLevel` → `replayRun` → compare with the embedded hash → `verified`/`mismatch` in `#gw-replay-status`, echoing the recomputed hash beside it. Since stage 3 the page also wires `#gw-share-card` — a share-card PNG of the replayed run through `src/share/card.ts`, its stars scored from the replay time and the regenerated pars (`Modules/world`).

## Measured

Node and the built Chromium page produce the same hash for the real kit feel track — same-machine, same-engine verification holds with the shipped rapier3d-compat build (feel-audit retune 2026-10-06: `099403c7` / 361 steps from both sides, page verdict `verified`; earlier quoted runs `9decb4fb`/343 and `074b1ef6`/239 steps belonged to pre-retune constants and are retired). The cross-platform claim (different CPU/OS) is still open ([[Home]] Deferred; QA owns the stage-3 gate).

## Guarded by

`tests/unit/replay.test.ts` (the REAL feel track: same build twice → same hash; JSON round-trip → same hash; piece removed → different hash; ONE piece parameter changed → different hash — determinism is asserted to be sensitive, not just stable) and `tests/e2e/replay.spec.ts` (verified/mismatch in the real page on a feel-track `#s=` fragment).

## Depends on / used by

`src/world`, `src/physics`, `src/track` — all headless-safe. Used by `src/boot.ts` and the tests.
