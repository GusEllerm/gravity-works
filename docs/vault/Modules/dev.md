---
tags: [module]
---
# src/dev (render harness)

> [!abstract] Role
> The deterministic render harness: a scene registry, the canonical cameras, and exploration scenes driven by URL. This is the studio's eye — every render review starts here.

## What it does

`src/dev/harness.ts` runs when a built page carries `?harness=1` (`src/main.ts` lazily imports it, so production never pays for it). URL params: `scene` (registry name) and `shot` (a `CanonicalShot`). It creates one WebGL renderer (1600×900, DPR 1, `preserveDrawingBuffer` for readback), asks the registry for the scene, renders exactly one frame inside one `requestAnimationFrame`, then flips `window.__sceneReady` and exposes `window.__pixelStats()` (a `readPixels` nonblack count for CI). `FIXED_TIME` is the clock: 0, never advancing — nothing animates unless a scene opts in. A factory failure sets `window.__sceneError` so tooling fails fast with a message.

`src/dev/registry.ts` is the scene registry: `registerScene(name, factory)` where the factory receives `{ rig, time }` and returns `{ scene, camera }`.

`src/dev/cameras.ts` holds `canonicalCamera(shot)` for `establishing` / `hero` / `floor` / `material-review` in one place — provisional kitchen framings that move into level files at stage 2 — plus `RENDER_WIDTH`/`RENDER_HEIGHT`/`RENDER_DPR`.

`src/dev/scenes/*.ts` modules self-register on import; the harness pulls them all in with `import.meta.glob` (eager), so **adding a scene is dropping a file in `src/dev/scenes/`** — no edit to `src/dev/harness.ts` is ever needed (parallel-safe for exploration rounds). The stage-1 roster: `src/dev/scenes/material-ramp.ts` registers `materials-a`, `materials-b`, `materials-c` — three `RAMP_VARIANTS` (hard cel / three hard steps / painterly) shown on the same three props (die-cast beveled car with stripe, ceramic bowl lathe form, orange track channel) over a painted-wood turntable under one key light; `src/dev/scenes/kitchen-a.ts`, `src/dev/scenes/kitchen-b.ts`, `src/dev/scenes/kitchen-c.ts` register the three competing kitchen tiles `kitchen-a` / `kitchen-b` / `kitchen-c` (tile B is the chosen reference); `src/dev/scenes/cars.ts` registers the three car looks `car-a` / `car-b` / `car-c` (car-a is the chosen reference).

`tools/render.mjs` (npm script `render`) builds, serves with `vite preview`, drives headless chromium through Playwright and screenshots the canvas: `npm run render -- --scene materials-a --shot material-review --out out.png`. Headless-safe for CI.

## How it works

Determinism: one rAF → one render, fixed clock, fixed DPR and viewport, no animations, no time reads. The harness lives behind a dynamic import in the shipped bundle but runs on the exact production build, so a render can never disagree with what deploys.

Guarded by `tests/e2e/harness.spec.ts` (a registered scene renders >0 nonblack pixels headlessly, with `__sceneError` checked).

## Depends on / used by

Depends on `src/render` and `three`. Used by `tools/render.mjs`, `tests/e2e/harness.spec.ts`, and the Director/Art Director render-review loop.
