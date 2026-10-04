---
livedocs: snapshot
tags: [session, stage-3, systems-engineer]
---
# 2026-10-07 Stage 3 — level↔set wiring

> [!abstract] Role
> Session snapshot for the Systems Engineer's last kitchen-slice seam: kitchen levels rendering inside the production set, the L04 tap↔wet-patch fix, L03 seating through the set's bowl sockets, the set-aware placement guard, the per-set canonical camera seam, plus the director's three deployed-page shell fixes.

## What shipped

- **`src/world/setPlacement.ts`** (new) — per-level MOUNT transforms for the kitchen set. The rule: the counter's top surface sits 5 mm below each level's finish deck, centred under the timed rail 0.45 m off its axis (pure translation), EXCEPT kitchen04, which also yaws the set −45° so `TAP.drip` maps exactly onto the ground build's decked-sink seam. Table literals, re-derived from live level + set data by `tests/unit/set-wiring.test.ts` (drift = red).
- **`src/boot.ts`** — the game resolves its level from `?level=` (registry), defaulting to **kitchen01** (the ladder's first rung; the feel track stays reachable as `?level=feeltrack`, which the stage-2 builder/result/perf specs now use). A level declaring `set: 'kitchen'` gets `buildKitchenSet` mounted into the world scene as a sibling of the track group — visual only, built once per boot, detached before `world.dispose()` so its materials survive rebuilds; the stage carries `data-set-mounted`. The result screen's `hazardsTouched` tally is now real (a grip sample < 1 during the run is a touch).
- **`src/ui/builder.ts`** — optional `solids` option: when the shell passes the set's solid-prop AABBs (a new `setPlacementGuard` in boot boxes the named props, excluding counter and FILM layers), a ghost whose piece box overlaps a solid reads `blocked` (red) instead of green. AABB-vs-AABB per ghost update; nothing per frame.
- **`src/world/levels/kitchen03.level.ts`** — the rim fixtures are no longer chained off the timed line; they are SEATED through the set's `bowl.in`/`bowl.out` frames (placed by the level's mount, `fitSocket` of each fixture's out-socket onto the placed frame). `propSockets` are the placed set frames. The timed chain's transforms are byte-identical, so every kitchen par hash is unchanged.
- **`src/dev/cameras.ts` / `src/dev/harness.ts` / `src/dev/registry.ts` / `src/dev/scenes/kitchen-set.ts`** — `setCameras(setId, shot)` / `setShotList(setId)`: the harness resolves its rig THROUGH the set; the set ships no camera data yet (the file is the EA's), so the provisional kitchen rig remains the fallback verbatim. `&level=<id>` on the harness mounts a registered level's par build inside the set (`scene=kitchen-set&level=kitchen03`).
- **`src/world/world.ts`** — a read-only `hazardZones` getter (the shell's hazard-status seam; physics reads the same field through `gripAt`).
- **Shell fixes the director flagged on the deployed page** — the help drawer now ships COLLAPSED (its inline `display: grid` was overriding the `hidden` attribute — both channels are driven together now); default boot is kitchen01; a ~25-line `src/ui/shell.css` (sans face, canvas height, tray row, visible status) imported by `src/main.ts`. No theming system; stage 6 owns the real UI pass.
- **Tests** — `tests/unit/set-wiring.test.ts` (14: pinned pre-wiring par hashes for all six kitchen levels, visuals-vs-headless World hash equality, placement-rule derivations, the L04 drip↔zone coordinate test, L03 socket seating to 1e-9, guard-box solidity and chain-clearance) and `tests/e2e/set-wiring.spec.ts` (5: kitchen01 finishes in its mounted set at the headless replay hash, kitchen04 par finishes with the hazard zone count live, the L03 rim-socket ghost goes `blocked`, the help drawer collapse, the harness level mount). Full suite 208/208 unit, 17/17 e2e, `pars --check` clean.
- **perf.spec B warm-up** — the stepping-only gate now steps 60 untimed chunks before measuring: on a contended box (measured: load average 137 from an unrelated benchmark) the Rapier wasm JIT/GC warm-up chunks were 150–260 ms and, at 60 samples, a single warm-up chunk decided p95. Same 16.7/25 ms gates, now measuring the steady-state loop the game pays. (HEAD was already borderline at p95 ≈ 25.7 on this box.)

## The seam: who calls whom

`boot.ts` reads `level.set`, calls `buildKitchenSet(THREE, { tokens })` ONCE, applies `kitchenSetPlacement(level.id)` from the new module, and adds the group to every rebuilt `World.scene` beside the track group. `kitchenSetPlacement` is a data table; the level files that need prop geometry in world space (L03's fixtures) compose it with `fitSocket` themselves. The builder gets the guard boxes from the same mounted group (`setPlacementGuard`). Nobody in `src/physics`, `src/world/world.ts` or `src/replay` imports anything set-side — the mount is a scene-graph event by construction.

## Tap verdict: geometry or zone?

**Neither file moved — the PROP is PLACED.** The EA measured the spout ~1.55 cm too low to drip over the deck; the honest reading is that L04's sink lives in the level's chain space while the tap lives in the set's canonical layout, and those two spaces had never been introduced to each other. Lifting the tap geometry would teleport a 22 cm prop ~1.9 m off the counter; re-seating the zone in level data would move it off the deck the ground line drives on (and would silently break the Feel Engineer's measured bite). Instead KITCHEN 04's MOUNT yaws/shifts the whole set so the tap's drip anchor lands exactly over the authored `sinkSplash` centre on the ground build's seam deck: the drips land IN the wet patch (coordinate-tested to 2.5 % of the radius), the zone stays on the deck the car drives (every hazards.test claim holds unchanged), and the set's `tapSplash` data, placed, equals the level's authored zone to the millimetre. The EA's module note is amended honestly: the export is now actually placed.

## L03 socket status

`parBuild` = timed chain + two DISCONNECTED fixture pieces seated at the placed `bowl.in`/`bowl.out` frames; `propSockets` are those frames. The bowl in L03 IS the set's bowl — the fixtures ride whatever world the level mounts the set in. Par hash unchanged (`2bf45e43`, pinned).

## Physics-neutrality proof

All six kitchen par replays produce the SAME status/time/hash as the pre-wiring tree (re-measured against the stashed tree, pinned as literals in `set-wiring.test.ts`); a `visuals: true` World hashes identically to a headless one; and in the BROWSER, kitchen01/kitchen04 with the set mounted finish at exactly the Node `replayRun` hash (`set-wiring.spec.ts`).

## Blockers / carry-ins

- **Ramp height vs book-stack height (EA's own note, now load-bearing):** every kitchen run's ramp start floats 12–32 cm above the counter/stack top because a 0.22–0.30 m kit drop needs ~1.2 m of 12° run. The set round is the EA's (stack count is a data edit); after that the per-level mount y is a one-number tweak.
- **Counter vs chain length:** kitchen02/05's lines (≈2.9 m) run past the 2.8 m counter diameter; their cups float off the counter's far edge in the game camera. LD staging or a wider counter next set.
- **Builder fixture model:** kitchen placeholder builds (fixtures included) already exceed the tray budget, so `#gw-place` arrives budget-disabled and the guard's refuse path is only exercisable via the ghost colour/Enter. The fixtures-vs-budget seam is a stage-4 UI task.
- **L03 rim pieces are targetable sockets** (`end of curve` = `bowl.out`): placing there is correctly GUARDED red this round; the day steering lands and a bank piece should seat there, that guard needs the socket-aware exemption Concepts/Levels already forecasts.
- **Set-side camera rigs** don't exist yet — `setCameras` is the seam; the EA round can fill `SET_SHOTS` without touching the harness.
