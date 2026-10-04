---
tags: [reference, review]
livedocs: snapshot
---
# Review 2026-10-07 — Stage 3 kitchen renders (Art Director)

> [!abstract] Scope and method
> Nine committed renders viewed at full size: the three tile-B integration finals (`docs/explorations/kitchen/*-b-integrated.png`) against their stage-1 originals, and the three production kitchen-set frames (`docs/explorations/kitchen-set/*.png`). Method as stage 1: 200 px downscales of all six new frames for the silhouette line, targeted crops (bowl walls, wet patch, mug/toast junctions, tyres, track terminations, focus-band sharpness), and full-frame luminance histograms to test the grading claims quantitatively. No code changed. Rubric 0–2 per line, pass = 12/16 and no zero. The Session note's self-scores are treated as claims; the floor's 13 was the only one within touching distance of my number.

## Send-back verification (stage 1's five demands, tile B integration)

| Demand | Verdict | Evidence |
|---|---|---|
| Grading to tile A's value range / gold density | **Honoured** | Book-stack crops: integrated frames carry warm core shadows under the stack and a gold key; histogram floor lifted off the old flat-bright wash. Deep band still thin (see For the Director). |
| Bowl interior glaze lift | **Honoured** | Hero crop: warm ramp band now rings the interior wall; the flat ivory plate is gone. |
| Wet patch cutout → film | **Honoured, barely** | The mint paper ellipse is gone; a soft sheen reads at the drip. At establishing distance it is nearly invisible — noted as a playtest legibility risk for the hazard, not a fix-back. |
| Mug pull-back (~6 cm, shadow off the bottom edge) | **Honoured** | The bottom-edge shadow pool is gone. Side effect: the toast soldier's contact was lost in the move — it now floats in the production hero. Filed in the production fix list, not a reference blocker. |
| Tyre/hub value off the black line | **Honoured** | Floor crops: tyres are warm brown, not black; no near-black pixels in any integrated frame. |

**Tilt-shift has landed.** The focus band is present and correctly placed in all six new frames; line 3 scores move 1→2 across the board exactly as the stage-1 decision forecast. The stage-1 blocking dependency is discharged.

## Score tables

### Tile B integration finals (candidates for the permanent reference)

| Line | establishing-b-int | hero-b-int | floor-b-int |
|---|---:|---:|---:|
| 1 Silhouette | 2 | 2 | 2 |
| 2 Focal point | 2 | 2 | 1 |
| 3 Scale cues | 2 | 2 | 2 |
| 4 Color | 2 | 2 | 2 |
| 5 Light | 2 | 2 | 2 |
| 6 Material | 2 | 1 | 1 |
| 7 Story | 2 | 2 | 1 |
| 8 Nothing default | 2 | 2 | 2 |
| **Total** | **16** | **15** | **13** |
| **Verdict** | PASS | PASS | PASS |

### Production kitchen set (`docs/explorations/kitchen-set/`)

| Line | establishing | hero | floor |
|---|---:|---:|---:|
| 1 Silhouette | 2 | 2 | 1 |
| 2 Focal point | 1 | 1 | **0** |
| 3 Scale cues | 2 | 2 | 2 |
| 4 Color | 1 | 1 | 1 |
| 5 Light | 1 | 1 | 2 |
| 6 Material | 1 | 1 | 1 |
| 7 Story | 2 | 1 | 1 |
| 8 Nothing default | 2 | 2 | 2 |
| **Total** | **12** | **11 FAIL** | **10 + zero FAIL** |
| **Artist claim** | 16 | 16 | 13 |
| **Verdict** | PASS (borderline — see note) | **RETURN** | **RETURN** |

The establishing's 12 is technically a pass, but it shares the hero's and floor's scene parameters, so it re-renders in the same round; its acceptance rides on the hero/floor re-scores, not a separate verdict.

## The six frames, honestly

**establishing-b-integrated** is the frame stage 1 promised: the tilt-shift band turns the counter into a miniature city, the gold now has A's density with B's discipline, the sugar cubes press, the cereal-box cliff catches the tap's shadow, and the pencil still does double duty as the kid's engineering. The 200 px downscale reads as a clean diagonal from book stack to bowl with the mug holding the near corner. It is the permanent establishing reference, full stop. The only quibbles are sub-perceptual: the deep value band is lifted off nothing (zero pixels below 60 anywhere in the frame — the range improved upward, not downward), and the wet-patch film is so quiet at this distance the hazard is a secret.

**hero-b-integrated** remains the painting. The glaze band is the fix that mattered — the bowl is fired ceramic now, and the car parked mid-bank reads at thumbnail with the rim tangent doing the compositional work. The mug pull-back worked: the bottom edge is clean. Its one honest demerit is material: the milk is a flat ivory disc where the liquid class asks for a tint and one highlight, and the exterior base still drifts near-white at the bottom; and the toast soldier is now a warm blur at the frame edge with no visible contact, a ghost of the mug-soldier story. This becomes the hero reference; the toast fix belongs to the production geometry pass.

**floor-b-integrated** is a solid 13 and the reference by default, not by glory. Tilt-shift gives it the miniature read for free and the book-ramp-to-bowl silhouette survives 200 px. But the canonical floor brief is "low, close, a car in the focus band," and the rim car is half-occluded by the near rim — the eye lands on the bowl, not the car (focal 1); the outer wall front goes near-white, losing its bands (material 1); and the story debris is either blurred out of the band or too small to read (story 1). Good enough to be the reference, honest enough to know it is the weakest of the trio.

**kitchen-set establishing** is the best-composed frame in the game — the diagonal, the sugar cubes, the frozen drip, the mug-ring-and-pencil grammar all survive — and it is also the brightest regression. The histogram says the whole scene lives above 243 across 3.6 percent of the frame with zero pixels below 60: no darks, no midtones, a key light posing as fill. The bowl is a single blown band; the mug's coffee is a grey disc (a liquid reading as plastic grey — never-list territory); the orange book spines put a second orange mass next to the brand's constant track; and the saturated cereal-box band pulls the eye left while the bowl, featureless and white, fails to hold it. Twelve of sixteen, no zero — it passes on paper because nothing is *broken*, only because nothing is *lit*.

**kitchen-set hero** fails, and it fails on the two things the reference nailed. The bowl — the reference's one painting-moment — is a blown white void, 15.4 percent of the frame near or above clipping, its wall a single band with no glaze, no roundness, no ceramic; and the rim car is *intersecting the rim geometry*, its body sunk into the ceramic like a failed 3D print, so the eye lands on the wrong part of the right object. The tap's L-shadow, the reference's second brushstroke, is a faint smear. The toast soldier floats free of the pulled-back mug, and the mug ring renders as a standing grey washer, not a stain film — both reference keeps lost in translation. Eleven. The self-score of 16 is not defensible against a histogram; the artist's own honesty note flagged the bowl and did not score it here.

**kitchen-set floor** fails with a zero and deserves it. Twenty-one percent of the frame is a glowing featureless dome — the bowl wall from below is an egg, not a bowl — the focus band falls across that void, and there is no car anywhere in it: the rim car is occluded behind the bowl and the right-edge car is fully defocused, so the canonical "car in the focus band" simply is not in the picture. The ramp termination floats a centimetre off the counter with a detached shadow, the track has been desaturated to peach (the brand constant must never go peach), and the story is pencil shadows and a grey smudge. Ten plus zero: the strongest silhouette-eligible frame is the emptiest.

## Verdicts and fix list

- **Tile B integration finals — PASS (16 / 15 / 13).** Ratified as the permanent set reference; Art Bible "Chosen references" updated. Stage 1's send-back is closed.
- **kitchen-set establishing — PASS (12, borderline); kitchen-set hero — RETURN (11); kitchen-set floor — RETURN (10 + zero).** Stage-3 send-back 1 of 2 used. One round. All fixes are data/param edits, not rebuilds:

1. **Ceramic exposure/band fix (all frames, class-level).** The bowl wall sits at 243–250 in a single band. Fix in `src/render/materials.ts` ceramic class, not per-scene (my own decision-5 discipline): drop ceramic base lightness ~8–10 % or raise the upper ramp threshold so three bands land on the key-facing wall. Acceptance is measurable: hero >=243 coverage from 15.4 % to under 8 %, floor from 21 % to under 10 %, with visible bands on the bowl wall in all three frames.
2. **Liquids stop being white and grey (hero, est).** Milk gets the liquid class for real: set-tinted base around 85 % brightness with one bright highlight; coffee gets a brown liquid tone — the grey disc in the mug currently violates the spirit of the never list.
3. **Seat the rim car on the rim (hero, est).** Place the rim car at a `BOWL_SOCKET_FRAMES` pose with wheels on the rim crown (mid-wall r = 0.12) and yaw along the rim tangent — the body must clear the ceramic. A body poking through a rim is the stage-1 tile-A disease reborn in one prop.
4. **Put a car in the floor shot's focus band (floor).** Canonical floor is failing its definition. Park a stand-in on the near track run between the book ramp and the bowl, inside the sharp band (band edge energy says the band crosses y≈300–450), or repoint `SceneEntry.focus` and re-aim the band at that car. Acceptance: car fully visible, sharp, in the middle third at 200 px.
5. **Land the floating track terminations (floor, est).** The ramp end-cap hangs ~1 cm off the counter with a detached shadow. Lower the final segment to ground contact or add the fifth sugar-cube support under the run end. One segment, one cube.
6. **Toast contact + mug-ring film (hero, est).** Lean the soldier against the mug flank with real contact (or lay it flat, bitten face up), and render the mug ring as the flat `stainDecal` film the inventory claims — in the frames it reads as a standing grey washer. Check the scene is drawing the film object, not a torus.
7. **Retire the orange book spines and settle the grade (all frames).** Book spines move out of the track's hue family (warm-neutral or a mint keep — one data edit in `bookStack`); and pull the key or drop the fill so the frame earns some darks — the reference's histogram has core shadows, this scene has none below 60.

Re-render all three canonicals; hero and floor are re-scored, establishing rides along.

## For the Director

1. **[AD] Tile B integration ratified as the permanent kitchen reference** — stage-1 send-back closed; Art Bible updated. Tilt-shift's arrival is confirmed in pixels, and the stage-1 line-3 cap is formally lifted.
2. **[AD] Stage-3 send-back 1 of 2 spent on the production set** — seven numbered fixes, all param/data-level. If the re-render lands hero and floor at 12+ with no zero, the kitchen's visual slice closes; the second send-back stays in reserve for playtest-surfaced issues.
3. **[AD] Risk for playtest: hazard legibility.** The wet patch is now honest film but nearly invisible at the establishing camera. If two playtesters fail to notice the drip means grip loss, the fix is a brighter splash-crown tell or a stronger film sheen, not a longer tutorial (brief §12).
4. **[AD] Risk: exposure is now a systemic story, not a kitchen bug.** Three production frames all average luminance 213–217 with an empty shadow band; the integrated reference does not. If the lighting rig is shared, the bathroom and beyond will inherit the wash. Ask the TA whether the rig's key/fill defaults drifted between the integration re-render and `buildKitchenSet`'s rig pass, and settle it before set two, not per-set thereafter.
5. **[AD] Self-score drift.** The artist claimed 16/16/16-13 against my 12/11/10. The honesty notes were accurate where they volunteered the bowl; the scores were not. A fresh-eyes AD re-score belongs at every set's first submission (already the protocol) — worth stating in the Session notes so future self-scores calibrate against a histogram, not intent.
6. **[AD] Rubric-relevant note for levels:** the orange book spines are the first non-track object to wear the brand hue. Recommend the tokens file reserve track orange for track-plastic class users only — enforceable in the material registry, cheap now, expensive after six sets.
