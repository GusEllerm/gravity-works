---
tags: [reference, review]
livedocs: snapshot
---
# Review 2026-10-04 — Stage 1 explorations (Art Director)

> [!abstract] Scope and method
> All twenty-one committed renders viewed at full size, plus 200 px downscales of all fifteen kitchen and car frames to test the silhouette line honestly, plus close crops of ambiguous areas (tile A's bowl/track junction, tile B's mug shadow, tile C's grain, car-b's stripe shell). Because the committed ramp renders predate the backface-normal fix in `toon-material.ts`, I re-rendered `materials-a/b/c` with current code and scored the fixed versions; the fix is real — the bowl's grey-mud interior is gone, and the bowl is now the ceramic it claims to be. No code was changed for this review. Rubric: 0–2 per line, pass = 12/16 and no zero (`PROMPT.md` §5.9), scored adversarially against the never list (§5.10).

## Score tables

### Kitchen tiles (three shots each)

| Line | est-A | hero-A | floor-A | est-B | hero-B | floor-B | est-C | hero-C | floor-C |
|---|---|---|---|---|---|---|---|---|---|
| 1 Silhouette | 2 | 1 | 1 | 2 | 2 | 2 | 2 | 2 | 2 |
| 2 Focal point | 2 | 2 | **0** | 1 | 2 | 2 | 1 | 1 | 2 |
| 3 Scale cues | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 2 |
| 4 Color | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 1 |
| 5 Light | 2 | 2 | 2 | 1 | 2 | 1 | 2 | 2 | 2 |
| 6 Material | 1 | 1 | 1 | 2 | 1 | 1 | 1 | 1 | 1 |
| 7 Story | 2 | 2 | 1 | 2 | 2 | 2 | 1 | 1 | 1 |
| 8 Nothing default | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 2 |
| **Total** | **15** | **14** | **11 + zero** | **14** | **15** | **13** | **11** | **11** | **12** |
| **Verdict** | pass | pass | **FAIL (zero)** | pass | pass | pass | FAIL | FAIL | bare pass |

### Toon ramps (one frame each, scored on the post-backface-fix re-renders)

| Line | ramp-A hard cel | ramp-B three steps | ramp-C painterly |
|---|---|---|---|
| 1 Silhouette | 2 | 2 | 2 |
| 2 Focal point | 1 | 1 | 1 |
| 3 Scale cues | 1 | 1 | 1 |
| 4 Color | 2 | 2 | 2 |
| 5 Light | 2 | 2 | 2 |
| 6 Material | 1 | 2 | 1 |
| 7 Story | 1 | 1 | 1 |
| 8 Nothing default | 2 | 2 | 1 |
| **Total** | **12** | **13** | **11 (FAIL)** |

(The material-review frame cannot carry story or miniature cues by construction — line 3 and 7 are capped at 1 for all three; that is the harness, not the variants.)

### Car looks (two shots each)

| Line | hero-A | floor-A | hero-B | floor-B | hero-C | floor-C |
|---|---|---|---|---|---|---|
| 1 Silhouette | 2 | 2 | 1 | 1 | 2 | 2 |
| 2 Focal point | 2 | 2 | 2 | 2 | 2 | 2 |
| 3 Scale cues | 1 | 2 | 1 | 2 | 1 | 2 |
| 4 Color | 2 | 2 | 2 | 2 | 2 | 2 |
| 5 Light | 2 | 1 | 2 | 1 | 2 | 1 |
| 6 Material | 2 | 2 | 1 | 1 | 2 | 1 |
| 7 Story | 1 | 1 | 1 | 1 | 1 | 1 |
| 8 Nothing default | 2 | 2 | 2 | 2 | 2 | 2 |
| **Total** | **14** | **14** | **12** | **12** | **14** | **13** |

## The submissions, honestly

**Kitchen tile A** is the most *painterly* of the three tiles and, in the establishing frame, the most alive: the cereal-box cliff, the book-stack ramp catching the key, the interrupted breakfast (bitten toast, crumb trail to a dropped pencil), and the sugar-cube track engineering — the best single idea in the whole round, breakfast food doing structural work, exactly the "one small surprising detail" the bible asks for. The gold is richer than B's and the thumbnail silhouette genuinely reads. But the tile carries a real geometry disease: the banked ribbon is a wide flat slab that buries the bowl in the hero frame (line 1 drops — at 200 px the bowl disappears under its own turn), and in the floor frame the disease becomes visible damage — the ribbon floats off the bowl rim with daylight through the gap, the bowl wall reads as crushed foil rather than ceramic, the sugar-cube support pokes through the track floor, and the car is a red sliver at the frame edge, outside the focus band the canonical floor shot exists to show. That is a focal zero. A heavy grain speckle also films over the ceramics in every frame; it reads as dirt on the lens, not as the toy dip-paint treatment. Beautiful palette, broken load-bearing geometry.

**Kitchen tile B** is the director's tile: the only one whose hero frame is the game I want to sell — the car parked mid-bank in the good cereal bowl, the tap's L-shadow drawing itself on the wall, the pencil doing double duty as the kid's engineering. The bowl-wrap at rim height reads at thumbnail in every frame, the six-class budget is worn lightly, and the story is the most human (toast still in the mug; three cars stopped where Sunday stopped them). Its weakness is exposure, not hue: the key sits high enough that most faces live in the bright ramp band, so the establishing and floor frames read flatter than A's — the value range collapses and the mint accent is present but whisper-quiet (one book, one cloth, one wet patch). The wet patch reads as a paper cutout rather than a film of water, the bowl interior is flat ivory where it wants glaze, and the tyres sit so dark they brush the no-black line at floor height. Nothing broken, nothing faked — a strong base that needs a grading pass and three named fixes. It is the winner.

**Kitchen tile C** did exactly what it set out to do: it proved the system can carry silhouette, color discipline, tinted shadows and class legibility with almost no artistry, and it left its weaknesses visible instead of faking around them. Visually it cannot win: the frames are sparse where the brief asks for lived-in, the mug-ring torus is a hula hoop, the car reads as a straight red that drifts into the orange track's hue family — against the standing decision to keep car hues out of orange entirely — and the streaky low-frequency grain makes the counter read as wet plaster. Its establishing and hero frames score 11, below pass. Its real contribution is the audit, which is the sharpest document of the round: the backface fix it landed, the tilt-shift gap that caps rubric line 3 for every tile, and the four system asks (grain frequency, accent-to-light, stain/decal, shadow dither) that I have converted into Decision Log items. Nobody will build a kitchen from tile C; everyone building the kitchen should read it.

**Ramp variants.** The re-rendered trio shows the backface fix worked — the bowl interior is warm. Hard cel (A) is crisp but binary: on the lathe bowl it gives one hard split and the ceramic loses all roundness; its hot chrome rim is a treat for die-cast metal only. Painterly (C) is a fail — its 0.3 softness dithers into speckled gradients at grazing angles, which looks less like hand-painted light and more like the compression artifacts this studio exists to avoid, and its 0.6 floor lifts shadows and flattens the value range that makes the toy read. Three hard steps (B) is the winner and it is not close once you look at the curved props: the middle band is what makes the bowl read as fired and round, the car body models itself in three moves, and it stays chunky — hard edges, no mush. This matches the two-band-with-mid-band look already working in the kitchen tiles. Carry its exact numbers to production; keep A's hotter rim as a die-cast-only exception.

**Car looks.** Car A, the blocky sedan, is the reference: at 200 px it is the only variant that *names its type* — a chunky beveled toy with fat wheels outside the flanks and a cream flank stripe, both cameras. Its roof-rack bars float a hair and its floor-frame wheels drown in the channel's shadow, but the idiom is the bible's own preference pair made object. Car B, the streamliner, is a green blob at hero distance and its raised lathe stripe clips through the rear tyres in the floor frame like a garland nobody asked for — the engineering is admired, the car is not ready. Car C, the haulback, reads cleanly as a tall wagon and its little cast roof ladder is the right kind of absurd, but the ladder floats and the flank surfaces dither at floor distance. A wins; the ladder rule and the lathe-stripe trick move into the winner's kit exactly as the car designer recommended, with one addition I saw and they didn't: **stripe geometry must never intersect the wheel envelope** — car-b's clipping is the cautionary render.

## The three choices

1. **Kitchen set look — Tile B** (`docs/explorations/kitchen/*-b.png`), after one integration pass (see Send-backs). One-line why: it is the only tile whose hero shot is a painting and whose track is a reader's path, with nothing broken in any frame.
   **Keeps from A:** the *saturation standard* — A's gold key and value range (A's establishing is more Sunday morning than B's); the sugar-cube track supports and the bitten-toast/crumb-trail/dropped-pencil story props; the cereal-box cliff in the establishing layout; the idea of the diagonal sweep from props to bowl.
   **Keeps from C:** no pixels, all process — the backface fix stands, and C's system-gap list becomes the stage-2 material backlog. Composition and light from C: nothing; its audit already gave the honest reason.
2. **Car look — Car A "sedan blocky"** (`docs/explorations/cars/hero-a.png`, `floor-a.png`). Rule: the reference car is chunky beveled-toy geometry — fat wheels outside the flanks, one cream stripe as raised geometry, one small absurd cast detail per trim level (the ladder rule, from C), the whole silhouette identifiable at 200 px in both canonical cameras. Stripes and details clear the wheel envelope (from B's failure).
3. **Material ramp — Variant B, three hard steps**, production params: ramp steps `[0.42, 0.7, 1.0]`, thresholds `[0.25, 0.62]`, softness `0.03`, rim `1.0×`, toy `0.3` — with the die-cast class permitted the harder A-style rim (≈1.4×, chrome read). Carry into `src/render/materials.ts` as the defaults.

## Send-backs (one of two used)

- **Kitchen tile B — integration re-render.** Raise the key-to-fill contrast so the bright ramp band stops eating the midtones (match A's value range and gold density); give the bowl interior a glaze lift (fill lift or normal-driven band bias per TA audit); convert the wet patch from cutout to film; pull the hero mug back ~6 cm so its shadow stops pooling in the bottom frame edge; lift tyre/hub value off the black line. Re-render all three canonical shots. This becomes the permanent set reference.
- No second send-back needed. Car B's stripe clipping and tile A's bowl-ribbon junction are geometry bugs filed as technical-artist tickets (shared `bowlForm`/`trackChannel` behavior), not creative returns — the losing variants themselves are not going forward.

## For the Decision Log

1. **[AD] Stage 1 choices ratified:** kitchen = tile B (post-integration), car = car-a with the ladder rule and geometry-stripe rule, ramp = variant B numbers above. Recorded in `Concepts/Art Bible` → Chosen references.
2. **[AD] Tilt-shift is now a blocking dependency.** The signature miniature cue does not exist in `src/render`, so rubric line 3 is capped at 1 for every render in the game. The focus-band post pass must land before the stage-3 kitchen slice review, and canonical renders should be re-taken when it does (several line-3 scores move 1→2).
3. **[AD] Car hues:** re-affirm the colorblind-safe Okabe–Ito seeds, and tighten the rule to *car hue must not read as any orange-family color at floor camera* — kitchen-c's `shiftHex` reddish-purple drifted to tomato red on camera. Either constrain the shift or pick per-set seeds; scenes may not freelance.
4. **[AD] Material-system backlog (from tile C's audit + this review), for stage-2 scheduling:** per-surface grain frequency (`uGrainScale`); accent reachable in the fill light (gain owned by tokens, not scenes); a stain/decal capability for wet patches and mug rings (trace, not object); ceramic base saturation lift or per-class fill lift so the class stops going taupe-grey on curved exteriors; shadow dither budget conversation.
5. **[AD] Floor-contact value floor:** tyres, hubs and any dark contact part get a minimum warm-brown lightness — the never list says no black, and at 200 px several wheels currently qualify as black. Encode in `materials.ts` class params, not per scene.
6. **[AD] Grain over-ceramics:** the speckle in tile A's frames reads as lens dirt; grain amount belongs to the painted-wood/toy treatment only unless a class opts in.
