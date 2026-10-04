---
tags: [module]
---
# src (app root)

> [!abstract] Role
> The browser entry point and shell of Gravity Works. Stage 2 replaced the placeholder with the real game shell: a fixed-timestep loop around the `World`, the builder tray, and a share-replay verification page.

## What it does

`src/main.ts` queries `#app` and hands it to `src/boot.ts` — unless the URL carries `?harness=1`, in which case it lazily imports `src/dev/harness.ts` instead (the deterministic render harness; see the dev module note). `src/boot.ts` then branches on the URL fragment: a `#s=` share fragment opens the shared-run page, which replays the payload headlessly through `src/replay` and prints `verified`/`mismatch` against the embedded hash; anything else boots the game — the level's placeholder build in a `World`, an accumulator-driven 120 Hz loop whose renderer reads only `states()` + alpha, the builder UI (autosaved via `rememberBuild`), and `runStatusLine` as the aria-live run copy. The stage-3 post hook is a no-op unless `?post=on`: only then does the shell dynamically import `createPostStack` and render the frame through the composer with the focus band centred on the car; the default page keeps the stage-2 `renderer.render` line. Level resolution for shares goes through `getLevel`.

## How it works

No router, no framework (per the brief's "small entity model, not a framework"). The fixed step lives in physics (`World.step`); the frame loop only decides *how many* fixed steps the elapsed time pays for (capped, so a background tab cannot fast-forward a run). Pure bits of the shell (`runStatusLine`) are unit-guarded by `tests/unit/boot.test.ts`; the DOM/canvas half by `tests/e2e/smoke.spec.ts`, `tests/e2e/builder.spec.ts` (whose expected piece counts import the level data — `FEEL_TRACK_KINDS.length`, `FEELTRACK.budget` — instead of mirroring it) and the share-verified e2e.

## Depends on / used by

Depends on `src/world`, `src/ui`, `src/save`, `src/share`, `src/replay`, `src/physics` (via world). Used by `index.html` only. Future modules (`src/sets/*`) will be created stage by stage, each with its own note here. Created so far: `src/render`, `src/dev`, `src/physics`, `src/feel`, `src/track`, `src/world`, `src/ui`, `src/camera`, `src/save`, `src/share`, `src/replay`. The shell's frame camera is still the static bounding-box framing — the §7.3 `RunCamera` ([[camera]]) is built and headless-tested but not yet wired into the loop (stage-3 integration item).
