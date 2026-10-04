---
livedocs: snapshot
tags: [session]
---
# 2026-10-03 Stage 1 — technical artist: render harness and ramps

## Goal

Stage 1 exploration infrastructure owned by the Technical Artist: the toon material skeleton (`src/render`), the deterministic render harness (`src/dev`, `tools/render.mjs`, `npm run render`), the canonical camera set, and three toon ramp variants (A/B/C) rendered at a material-review camera into `docs/explorations/materials/`.

## What was done

- `src/render/tokens.ts` — six set palettes (dominant + accent seeds; fill/shadow/ground/background derived by pure hex math), `GLOBAL_TOKENS` with the constant track orange `#FF7A1A`, `cssVars()` for the UI half. Guarded by golden-value unit tests.
- `src/render/toon-material.ts` — `ToonMaterial`: a `ShaderMaterial` with `lights: true` built on Three.js chunks (`lights_fragment_begin` drives the loop, a custom `RE_Direct_Toon` is the BRDF). Ramp (2–3 steps, thresholds, softness), spec size/strength, rim, toy/grain/liquid treatments, all procedural.
- `src/render/materials.ts` — the seven art-bible classes; `src/render/geometry.ts` — `toyBlock`, `bowlForm`, `trackChannel` shared generators.
- `src/dev/` — scene registry (`registry.ts`), `canonicalCamera()` + `material-review` shot (`cameras.ts`), one-frame fixed-clock harness (`harness.ts`) reached via `?harness=1` on the built page (lazy import from `src/main.ts`), and `scenes/material-ramp.ts` registering `materials-a/b/c`.
- `tools/render.mjs` + npm script `render` — builds, `vite preview`, headless chromium via Playwright, waits for `window.__sceneReady`, screenshots the canvas; fails on `__sceneError` or an all-black frame.
- Tests: token stability unit test; Playwright e2e asserting a harness scene renders nonblack pixels. `npm run typecheck`, `npm test`, `npx playwright test` all green.
- Renders committed: `docs/explorations/materials/ramp-a.png`, `ramp-b.png`, `ramp-c.png` at 1600×900 DPR 1.
- New devDependency: `@types/three` 0.186 (dev-only typings; three ships no types. No runtime dependency added).

## Decisions (for the Director to merge)

1. **Harness rides the production build** via `?harness=1` + dynamic import, not a separate `harness.html` entry. Alt: separate vite input or dev-server-only route. Reason: a render can never disagree with shipped code; zero extra build config; CI-simplest. The harness chunk is fetched only when the flag is present.
2. **Two-band material fill instead of AmbientLight** (`fillLow`/`fillHigh` from tokens, sampled by world-up). Alt: hemisphere light. Reason: rubric forbids uniform ambient; keeps fill per-set in tokens; scenes add exactly one key light.
3. **Shadow tint by key-length recovery**: Three folds shadow attenuation into `directLight.color`; the shader compares against `uKeyLength` (set via `ToonMaterial.setKeyLight`) and swaps in the set's `shadowTint` at 40% strength for fully shadowed faces. Alt: custom shadow sampling (dropped all chunk light support) or untinted darkening. Reason: keeps the chunk-driven light loop, satisfies "shadows tinted toward the hue, never black".
4. **Tokens stay dependency-free hex math** (no three.js import in `tokens.ts`). Alt: `THREE.Color` math. Reason: identical values in Node tests and browser; no color-management drift in the golden tests.
5. **Kitchen seeds**: dominant `#EFAF4B` gold / accent `#5FB49C` mint; track kept at exactly `#FF7A1A` (tested as the cross-set constant). Reason: mint keeps the accent off the orange hue family; gold matches breakfast light.
6. **`@types/three` added (dev)** — noted per the no-new-dependencies rule; zero bytes shipped.

## Gotchas learned (worth a Reference note later)

- `ExtrudeGeometry` bevels grow the outline by `bevelSize` and add `bevelThickness` at **both** z-ends — the seed shape must be inset or the block floats.
- Three 0.186 removed `PCFSoftShadowMap` (falls back with a console warning); the harness uses `PCFShadowMap`.
- Naive `fract`-hash noise degenerates at lattice coordinates ≳10⁴ (float precision) — grain coordinates wrap mod 64 m; keep set geometry within a couple of meters of the origin.
- GLSL has no `vec3 → vec4` implicit in `vec4(x,y,z)`; the `w` must be explicit.

## Next

- Art Director scores A/B/C; the winner's numbers move into the bible and become the production defaults in `materials.ts`.
- Stage 2: canonical cameras move into level files unchanged; `trackChannel` gets extruded along the real track spline; frame-budget counters land in `src/render`.
- Consider a tiny tilt-shift post pass in the harness once post stack lands — not this round.
