---
tags: [module]
---
# src/dev (render harness)

> [!abstract] Role
> The deterministic render harness: a scene registry, the canonical cameras, and exploration scenes driven by URL. This is the studio's eye — every render review starts here.

## What it does

`src/dev/harness.ts` runs when a built page carries `?harness=1` (`src/main.ts` lazily imports it, so production never pays for it). URL params: `scene` (registry name) and `shot` (a `CanonicalShot`). It creates one WebGL renderer (1600×900, DPR 1, `preserveDrawingBuffer` for readback), asks the registry for the scene, renders exactly one frame inside one `requestAnimationFrame`, then flips `window.__sceneReady` and exposes `window.__pixelStats()` (a `readPixels` nonblack count for CI). `FIXED_TIME` is the clock: 0, never advancing — nothing animates unless a scene opts in. A factory failure sets `window.__sceneError` so tooling fails fast with a message. Stage 3 adds the post-stack params, all defaulting off so every pre-stage-3 URL renders byte-identically: `post=on|off` runs the frame through `src/render/post`, `quality=high|medium|low` sets its ladder, `focus=(x,y,z)` moves the tilt-shift focus point (falling back to the scene's own `SceneEntry.focus`, parsed by `src/dev/post-params.ts`), and `perf=N` times N extra post-ready frames — each serialised with a blocking `readPixels` (under SwiftShader `gl.finish()` alone returns before the draw has rasterised) — into `window.__perfStats()`, the frame-cost probe; `size=WxH` is its companion knob, rendering at a non-canonical resolution (e.g. the game canvas's 960×540) for budget measurement only — canonical renders stay 1600×900 per §5.8.

`src/dev/registry.ts` is the scene registry: `registerScene(name, factory)` where the factory receives `{ rig, time }` and returns `{ scene, camera }`, optionally plus `focus` (world-space tilt-shift subject) and `tokens` (set for the color grade).

`src/dev/cameras.ts` holds `canonicalCamera(shot)` for `establishing` / `hero` / `floor` / `material-review` in one place — provisional kitchen framings (numbers in [[Reference/Canonical Cameras|Canonical Cameras]]) that the harness hands every scene as `rig` — plus `RENDER_WIDTH`/`RENDER_HEIGHT`/`RENDER_DPR` (1600×900 @ DPR 1, which `harness.ts` sizes the renderer and the `readPixels` buffer with). The stage-2 feel-track level is a kitchen-neutral test track, so no level file has claimed these framings yet; moving them into set/level files is a stage-3 job (do not fork the numbers).

`src/dev/scenes/*.ts` modules self-register on import; the harness pulls them all in with `import.meta.glob` (eager), so **adding a scene is dropping a file in `src/dev/scenes/`** — no edit to `src/dev/harness.ts` is ever needed (parallel-safe for exploration rounds). The current roster: `src/dev/scenes/material-ramp.ts` registers `materials-a`, `materials-b`, `materials-c` — three `RAMP_VARIANTS` (hard cel / three hard steps / painterly) shown on the same three props (die-cast beveled car with stripe, ceramic bowl lathe form, orange track channel) over a painted-wood turntable under one key light; `src/dev/scenes/kitchen-a.ts`, `src/dev/scenes/kitchen-b.ts`, `src/dev/scenes/kitchen-c.ts` register the three competing kitchen tiles `kitchen-a` / `kitchen-b` / `kitchen-c` (tile B is the chosen reference); `src/dev/scenes/post-preview.ts` registers `kitchen-b-integrated` — the tile-B integration re-render (the stage-1 send-back: lighting rig with accent-reachable fill, stain films for the wet patch and mug ring, ceramic saturation lift, lightness-floored tyres, mug pulled back), with the focus point carried in its `SceneEntry`; `src/dev/scenes/cars.ts` registers the three car looks `car-a` / `car-b` / `car-c` (car-a is the chosen reference); `src/dev/scenes/trackkit.ts` registers `trackkit` — the stage-2 track kit's establishing shot, all 13 pieces chained end to end by `chain`/`fitSocket` from `src/track`, every mesh a `TrackSpline.toMesh()` of the spline its colliders come from, the display group uniformly scaled to fit the establishing frustum; `src/dev/scenes/worldsmoke.ts` registers `worldsmoke` — the `World` module's reify-to-mesh path with no physics and no clock (the feel-track build through `buildTrackMeshes`, plain materials, the car proxy parked at the level start socket), proving the world's geometry half in the built page while the physics half stays guarded headlessly; `src/dev/scenes/kitchen-set.ts` registers `kitchen-set` — the PRODUCTION kitchen set (`buildKitchenSet` from `src/sets/kitchen`) under the lighting rig with the reference's three parked stand-in cars and two decorative runs, its `SceneEntry.focus` the car riding the bowl rim (the canonical stage-3 set renders run it with `post=on`).

`tools/render.mjs` (npm script `render`) builds, serves with `vite preview`, drives headless chromium through Playwright and screenshots the canvas: `npm run render -- --scene materials-a --shot material-review --out out.png`; `--param k=v` (repeatable) appends extra harness params, e.g. `--param post=on --param quality=medium`. Headless-safe for CI.

`src/dev/post-params.ts` parses the harness URL overrides for the post stack — `isPostQuality` accepts only the `high|medium|low` ladder names from `src/render/post/index.ts`, `parseFocusParam` accepts a `focus=x,y,z` world point (parens optional) and rejects anything that is not exactly three finite numbers, so a typo'd param falls back to the scene default instead of guessing. Pure parsing, no DOM, so `tests/unit/render-post.test.ts` guards the contract. (Stage-3 note: the post-stack commit landed these tests without this file — `tsc` was red at that commit; the helper was reconstructed to the test's contract as the first integration fix on `stage3-hazards`.)

`tools/render.mjs` (npm script `render`) builds, serves with `vite preview`, drives headless chromium through Playwright and screenshots the canvas: `npm run render -- --scene materials-a --shot material-review --out out.png`. Headless-safe for CI.

## How it works

Determinism: one rAF → one render, fixed clock, fixed DPR and viewport, no animations, no time reads. The harness lives behind a dynamic import in the shipped bundle but runs on the exact production build, so a render can never disagree with what deploys.

Guarded by `tests/e2e/harness.spec.ts` (a registered scene renders >0 nonblack pixels headlessly, with `__sceneError` checked — including the `post=on` path, so the tilt-shift/bloom/grade shaders must compile in a real browser, not just Node).

## Stage-3 wiring

`setCameras(setId, shot)` / `setShotList(setId)` resolve the harness rig THROUGH the set: a set that ships its own camera data wins, and until the kitchen set does (the file is the EA's; it ships none yet), the provisional kitchen rig in `SHOTS` is the fallback verbatim. The harness accepts `&level=<id>` beside `scene=kitchen-set`: a registered level id mounts the set in that level's own placement (`placeSet(level.parBuild(), level.id)`) plus the level's par build and a car parked at its start socket — the level-in-context render shot the EA needs; no id (or an unknown one) keeps the decorative tile-B staging runs.

## Depends on / used by

Depends on `src/render` and `three`. Used by `tools/render.mjs`, `tests/e2e/harness.spec.ts`, and the Director/Art Director render-review loop.
