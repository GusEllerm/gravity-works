---
tags: [module]
---
# src/render (material system)

> [!abstract] Role
> The Gravity Works toon material system: one shader-driven material, the seven art-bible classes built on it, the shared procedural mesh generators, and the palette tokens that keep CSS and materials from drifting.

## What it does

`src/render/toon-material.ts` defines `ToonMaterial`, a `THREE.ShaderMaterial` (with `lights: true`) assembled from Three.js shader chunks — `lights_pars_begin` and `lights_fragment_begin` drive the light loop and `RE_Direct_Toon` supplies the toon BRDF. It is deliberately not `MeshToonMaterial`. Parameters follow the art bible: base color, a 2–3 step ramp (`steps` / `thresholds` / `softness`), specular size/strength, rim strength/size, and optional treatments: `toy` (dip-paint gradient), `grain` (procedural painted-wood grain), `liquid` (time-driven normal wobble). No image textures anywhere.

`src/render/materials.ts` exports the seven classes as factories taking the set's `SetTokens`: `dieCastPaint`, `trackPlastic`, `paintedWood`, `ceramic`, `fabric`, `glass`, `liquid`.

`src/render/tokens.ts` is the single color source: `SET_TOKENS` (six sets, dominant + accent seeds, with `fillHigh`/`fillLow`/`shadowTint`/`ground`/`background` derived by pure hex math) plus `GLOBAL_TOKENS` (the constant `trackOrange` `#FF7A1A`, cream neutral, key-light color) and `cssVars()` for the UI half. The math is dependency-free so Node tests and the browser see identical values.

`src/render/geometry.ts` holds the shared generators the sets will reuse: `toyBlock` (beveled rounded block — the footprint is inset by the bevel because `ExtrudeGeometry` grows the outline by `bevelSize` and the depth by `bevelThickness` at both ends), `bowlForm` (lathe), `trackChannel` (U-channel extrusion; later stages extrude the same cross-section along the track spline).

## How it works

Lighting contract: there is no `AmbientLight` anywhere — fill is the two-band `uFillLow`/`uFillHigh` sampled by world-up (rubric forbids uniform ambient). Shadow attenuation arrives folded into `directLight.color` by the Three chunk; the shader recovers it against `uKeyLength` (set once per scene via `ToonMaterial.setKeyLight()`) so fully-shadowed faces swap in the set's `shadowTint` at 40% key strength instead of collapsing to ambient black. The specular mask is a half-vector threshold on `specSize` clamped against a hot key (`min(color, 1)`) so highlights cannot blow to white. Backfacing fragments flip the interpolated normal by `gl_FrontFacing` (matching Three's `normal_fragment_begin`), which is what lets a two-sided lathe form — a cereal bowl — shade its inner wall by its true facing instead of sticking in the darkest band.

Scene units are meters at real scale (a 1:64 car is ~0.07 m).

Guarded by `tests/unit/tokens.test.ts` (golden kitchen derivation, hex math). Rendered evidence: docs/explorations/materials/ramp-a.png (hard cel), ramp-b.png (three hard steps), ramp-c.png (painterly) from the stage-1 exploration. Binary renders are intentionally not named in backticks: the drift binder treats a mention as a file anchor and the text-diff checker cannot read binaries.

## Depends on / used by

Depends on `three` only. Used by every exploration scene — `src/dev/scenes/material-ramp.ts`, `src/dev/scenes/kitchen-a.ts`, `src/dev/scenes/kitchen-b.ts`, `src/dev/scenes/kitchen-c.ts`, `src/dev/scenes/cars.ts` — and, from stage 3, the set directories. The frame budget (draw calls, tris, post cost) will also live here.
