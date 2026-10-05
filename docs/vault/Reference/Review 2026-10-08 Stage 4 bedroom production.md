---
tags: [reference, review]
livedocs: snapshot
---
# Review 2026-10-08 — Stage 4 bedroom PRODUCTION verdict (Art Director)

> [!abstract] Scope and method
> The three production stills (docs/explorations/bedroom/production-hero.png, production-side.png, production-low.png; 1280×720, post ON, fixed clock) judged against the ratified variant-B bar from the exploration review (hero-b/close-b, means 126/123), the AD caveats that rode with the ratification (book-pyramid blob + fringe, invisible desk supports, one-prop frame risk, the unpaid floor-band detail, variant C's spring ask), and the standing battery: histograms re-measured at this sitting, the per-pixel blackish audit recorded in the production session log (sub-60 pixels with channel spread < 16: hero 4, side 0, low 24, of 921 600 — effectively zero, every meaningful dark tinted), and the shipped code read alongside the frames. Rubric per Concepts/Art Bible §The rubric: eight lines, 0–2, pass = 12/16, any zero is an auto-fail. No code changed.

## What production was asked to prove, and did

1. **Three readable mid-distance story props so no single prop carries the frame.** Proven. The book pyramid reads cover-face + page-edge at all three cameras (paper plate flat at grain 0 — the exploration's dither-fringed voxel blob is gone); the lamp practical is a real point light whose pool is *lit* (the shader-side punctual gate, entered at registry level exactly where the stage-3 ceramic lesson said fixes must live); the dresser drawer is pulled half out with a card-sized daylight slit over tinted felt, and the bore carries a named socket pair (`drawer.in` / `drawer.out`) so the tunnel is DATA, not a promise. The cable snake remains, demoted to fourth voice.
2. **The AD caveats rode with the ratification and were paid.** Desk: four legs + apron rails, the top low enough to enter frames — the floating slab is gone (side camera shows the support story outright). Floor-band lived-in detail: the homework now sits inside the low camera's focus band (the stage-3 ticket, finally closed). Spring ask: mattress edge + dark slat gap + two brass coils at the bed skirt — visible at low, harvestable by a future level.
3. **The never-list holds in the darkest set of the game.** Sub-60 coverage 7.7 / 3.9 / 6.3 % where variant B earned 4.9 %, and the blackish audit is effectively zero (the two gap props' near-black BASE colors were lightened to tinted indigo at material level — darks built by light, not painted in the albedo, which is the correct direction of fix).

## Histogram evidence (re-measured at this sitting)

| frame | mean | p5 | ≥243 % | <60 % (tinted) |
|---|---:|---:|---:|---:|
| production-hero | 136 | 51 | 4.0 | 7.69 |
| production-side | 131 | 70 | 1.87 | 3.94 |
| production-low | 129 | 55 | 1.96 | 6.3 |

Ratified variant-B hero-b for comparison: mean 126, p5 60, ≥243 0.1 %, <60 4.9. The band is honored; two residuals to watch: the hero's blown share (4 % against the ratified 0.1 %) concentrates in the lamp's glow disc and shade glaze catching bloom, and the hero p5 sits nine points deeper than the ratified frame — both are grade/shade-value trims, not structural.

## Score tables

| Line | hero | side | low |
|---|---:|---:|---:|
| 1 Silhouette | 2 | 2 | 2 |
| 2 Focal point | 2 | 2 | 2 |
| 3 Scale cues | 2 | 2 | 2 |
| 4 Color | 2 | 2 | 2 |
| 5 Light | 1 | 2 | 2 |
| 6 Material | 1 | 1 | 1 |
| 7 Story | 2 | 2 | 2 |
| 8 Nothing default | 2 | 2 | 2 |
| **Total** | **14** | **15** | **15** |
| **Verdict** | **PASS** | **PASS** | **PASS** |

Line 5 loses the hero only: the lamp — the frame's stated light source — leaves the hero frame above its pole, and what remains reads as a blown column rather than an obvious lamp; the side camera proves the rig and the shade know how to read, so this is framing, not lighting. Line 6 stays at 1 everywhere on the known systemic grounds, not new damage: TA-1 grazing speckle still edges shadow boundaries (most visible in the low camera's wall streak), and the shade's ceramic glaze blows toward white wherever the practical hits it — the same shape of demerit that held material at 1 through the ratified exploration.

## Verdict: **RATIFIED as the production bedroom set. 14 / 15 / 15, all three cameras pass, no zeros, no send-back round spent.**

The caveats that accompanied the ratification are all resolved in pixels and in data, and the fix architecture is the durable kind: the punctual gate lives in the toon shader's light loop with the kitchen baselines as its byte-identity gate (measured 0.0000 % in the wiring suite), the practical's falloff lives in set DATA (steep and short — the session log records why: a gentler falloff re-lit the stage-3 wash to a +80-luma mean), and the drawer tunnel is sockets a level can chain, not geometry a level must hope at.

**What production must not lose:** the punctual gate and the practical's steep/short falloff numbers — if a future set "simplifies" the point light toward slow falloff, the dusk wash returns by the first still; the `drawer.*` socket convention, which is the second set proving the SetInstance surface carries real affordances; and the tinted-gap rule (no near-black base colors — the dark must be made by light).

**Must-fix with the next set's wave (carry-forwards, no round):**
1. Hero framing or shade height so the lamp's SHADE is in the hero frame and its glaze keeps a band (target: no blown disc pixels ≥ 243 in the hero's ≥243 budget — reclaim the 4 % → under 2 %).
2. Drawer readability at the low camera: the pyramid occludes the slit at the floor rig; a small dresser yaw is the whole fix.
3. TA-1 (speckle on grazing shadow edges) — open since the exploration review, systemic, must close before the NEXT set's first still or every review opens with it.
4. Harness contract friction filed for the Systems Engineer, not the artist: the stage-4 brief's 1280×720 stills rode the harness `size=` param the code comments mark perf-probe-only while §5.8 fixes 1600×900 for canonical renders — either §5.8 gains a per-brief size clause or the param graduates; do not let this become an unwritten second canonical size.
