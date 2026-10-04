---
livedocs: snapshot
tags: [session, stage-3, technical-artist]
---
# 2026-10-06 Stage 3 — post stack and material backlog

> [!abstract] Role
> Session snapshot for the Technical Artist's stage-3 wave: the post stack landing, the seven-item material backlog verdicts, the tile-B integration re-renders, and the first frame-cost table with post ON.

## What shipped

- **Post stack** in src/render/post/ — `RenderPass → TiltShiftPass → SoftBloomPass → grade(+vignette, terminal)` on an EffectComposer. Harness params: `post=on|off` (off = the stage-2 render path, nothing constructed), `quality=high|medium|low`, `focus=(x,y,z)`, plus measurement knobs `perf=N` and (perf-only) `size=WxH`. Scenes may carry a default focus point via `SceneEntry.focus`. `src/boot.ts` gained its sanctioned minimal hook: the game renders through the stack only under `?post=on`, dynamically imported, focus band following the car per §7.3.
- **Tilt-shift**: two-pass separable gaussian (H then V) in quarter-res internal buffers + a full-frame circle-of-confusion composite. Band centred on the projected world focus point, height 20 % of frame (§7.3); defocus strength rises with the focus point's distance from the set floor. `tiltShiftParams` is pure and unit-tested.
- **Bloom**: custom one-Pass quarter-res pipeline, strength hard-clamped to `BLOOM_SOFT_CEILING = 0.22` — the never-list cap is a constant in code, tested. Not UnrealBloomPass (cost, and the mip pyramid outruns "soft").
- **Grade**: LUT-lite numbers derived from set tokens (`gradeFromTokens`), carrying the vignette term and the sRGB encode as the terminal pass. Kitchen grade tuned toward tile A's value range (mids down, warm blacks on the shadow tint, saturation +12 %).
- **Quality ladder**: high → everything; medium → bloom off, tilt taps 6→3; low → tilt off, grade only. Resolution is never dropped — documented drop order, stage drop first, in code and tests.
- **Lighting rig** src/render/lighting.ts: one shadowed key with tuned bias pair, accent-reachable fill (accentMix 0.4 on the kitchen scene), `applyKeyLight` (key-length recovery), `dustMotes()` hook returning an empty group — §5.5 particles deliberately not built this round.
- **Integration scene** src/dev/scenes/post-preview.ts registers `kitchen-b-integrated` — a fork of the tile-B set reference (the stage-1 file is untouched so the before-frames stay reproducible) carrying the send-back fixes; its `SceneEntry.focus` is the car riding the bowl.

## Backlog verdicts (Decision Log 2026-10-04, all seven)

1. **Grain frequency per surface size** — FIXED. `grainScale` uniform on ToonMaterial; ground/wall at 0.05 (long lazy streaks), props keep 1.
2. **Fill light reaches the set accent** — FIXED. Shader constant 0.25 → `uFillStrength` material parameter; the rig derives fill bands mixed toward the accent (accentMix) at gain 0.32. The mint cloth and mint book cover read cool-green in shade now.
3. **Stain/decal capability** — FIXED as FILM. src/render/film.ts `stainDecal`: mug ring, wet patch, splash ring are SDF shapes on a flat quad (transparent, depthWrite off, polygon-offset), never cutout geometry. Iterations fixed two artifacts: ungated Fresnel whitened the film at the floor camera (now a streaky, halved glint), and the patch sits value-dark under the tap shadow.
4. **Ceramic saturation lift** — FIXED. +10 % chroma (+ a hair of lightness) in the ceramic class; the bowl glaze reads glazed, and the backface fix makes the interior glaze real, not a ramp hack.
5. **Shadow-dither budget at grazing angles** — FIXED (twice; the honest story). First cut (snap-at-0.5 with a fine world-space weave) smeared bright patches in the tap's floor penumbra; second cut (snap biased to shadow, full light needs ≥70 % coverage) plus rig normalBias 0.006 killed both the penumbra smear and the bowl self-shadow blocks. Budget uniform `uShadowDither` default 0.3, tested.
6. **Warm-brown lightness floor for tyres** — FIXED. `clampLightness` + `CONTACT_LIGHTNESS_FLOOR = 0.3` in tokens (pure hex math); the fork's tyres keep a readable edge in all three rigs.
7. **Grain only on painted-wood/toy classes** — FIXED at the factory level: `fromClass` zeroes any grain on classes that are neither wood nor toy-treated; unit test holds it.

## Frame cost table (the honest one)

Machine: Apple M5 Pro, headless Chromium — **WebGL via SwiftShader (software GL)**; `WEBGL_debug_renderer_info` prints the SwiftShader driver, so every number below is a software-rasteriser cost, several times worse than the integrated-GPU class the brief names. Timed by the harness `perf=N` hook; per-frame cost = render call + a blocking 1×1 readPixels (`gl.finish()` alone under-reports — it returned 0.4 ms for frames verifiably costing 30+). A parallel agent's dev server was running during measurement; treat single rows as ±20 %.

**Tile-B integrated scene, 1600×900 (canonical §5.8), establishing, medians:**

| Config | block ms | delta = stage cost |
|---|---:|---:|
| post off (scene + shadows) | 30.8 | — |
| post on, low (grade+vignette+encode) | 31.3 | grade ≈ +1–3 ms |
| post on, medium (+ tilt-shift) | 39.3 | tilt-shift ≈ +8 ms |
| post on, high (+ bloom) | 51.7 | bloom ≈ +12 ms |

Per-shot high: hero 55.3 (off 38.8), floor 61.3 (off 30.9 — the floor camera pays the most blur: widest CoC on screen).

**Same scene at 960×540 (what the game canvas actually pays), establishing:** off 18.4 / low 18.3 / medium 21.7 / high 25.0 ms block; rAF median stays vsync-pinned at 16.70 ms through medium and 33.3 at high.

**60 fps claim, stated honestly:** under SwiftShader I cannot *prove* median ≤ 16.7 ms with post high at full frame — the software rasteriser is over budget even with post off at 1600×900 (this table), and at game resolution the blocking cost at high (~25 ms) exceeds the budget even though the rAF loop keeps its pacing (the medium tier stays rAF-pinned at 16.7). The stage-2 game-shell measurement (feel-track, real rAF loop, vsync-pinned median 16.70, sim/wall 1.00) remains the keep-up evidence for the shipped path; post there is opt-in per URL. The budget architecture — one always-on full-frame draw, quarter-res blur buffers, byte glow targets — was driven by these measurements (the naive full-frame version cost 2× more). **Integrated/hardware-GPU re-measurement is the open item for QA**, alongside the stage-2 hardware caveat already in Performance/stage-2.md.

## Renders (the stage's first provisional finals)

Before (stage 1, unchanged): docs/explorations/kitchen/establishing-b.png, hero-b.png, floor-b.png.
After (this session, post=on quality=high): docs/explorations/kitchen/establishing-b-integrated.png, hero-b-integrated.png, floor-b-integrated.png.

## For the Art Director to look at

1. **Scale cue line 3 is finally earned**: the tilt-shift band is real, centred on the bowl-rim car; check the establishing shot's top/bottom fall-away reads miniature, not screensaver.
2. **Value range**: the grade should land tile B inside tile A's range. The bowl outer is still the brightest thing in frame — the AD may want the bowl band tuned down in the scene, not the grade.
3. **Wet patch as film** under the tap, and the mug ring beside the pulled-back mug: are they film now, convincingly? (They were the send-back's headline.)
4. **Tyres**: the floor shot's rim car should read brown, not a hole.
5. **The mug** sits deeper right in hero/floor; the toast soldier still grazes the handle in hero — composition call is the AD's, geometry is a one-line change.
6. Car-a's red body through the kitchen grade still reads red, not tomato (Decision Log car-palette rule) — the fork reuses tile B's car body only because tile B predates the car-a ratification; the car scene re-render is the proper test.

## Deferrals (recorded here, not hidden)

- Dust motes: hook exists, particles deliberately not built (no-particles rule this round).
- Bloom threshold/knee are stack constants, not per-set.
- Cross-set grade validation (kitchen-only evidence this wave).
- Hardware-GPU 60 fps re-measure (QA).
- Fork note: kitchen-b-integrated duplicates the tile-B staging on purpose; if tile B is ever re-dressed, the fork must be refreshed — the stage-1 file is the before-image source and is byte-frozen.
