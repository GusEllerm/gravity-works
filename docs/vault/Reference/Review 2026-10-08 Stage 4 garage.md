---
tags: [reference, review]
livedocs: snapshot
---
# Review 2026-10-08 — Stage 4 garage explorations (Art Director)

> [!abstract] Scope and method
> Six committed renders (hero and floor cameras of `src/dev/scenes/garage.ts` variants a/b/c), screened as 400 px
> downscales for the silhouette and focal lines and at full size for the prop-specificity checks the studio named;
> plus the standing battery: `tools/histogram.mjs` luminance stats, a per-pixel dark-tint/blackish audit, a token-red
> chroma census, an isolated-bright-pixel (sparkle/speckle) census, and a 5x5 box-mean MAD for grazing speckle. The
> concept's claims are treated as claims and re-measured. Rubric per Concepts/Art Bible §The rubric: eight lines,
> 0–2, pass = 12/16, any zero is an auto-fail. No code changed.

## Cross-cutting finding first: the garage's accent is hung above the camera

The art bible's warning was "the garage gets generic without real toys", and the set answers it structurally — five real
toys as terrain. Measured, the failure is one floor higher than the terrain: **the accent never reaches a pixel.** In
five of six frames no pixel carries the token red's chroma (hue ≤ 22°, sat > 0.42, luma > 105 — census: 0.000 %; the
sixth, hero-b, is 0.059 %), because the tool wall that holds the red lives at y ≈ 0.44 m on the back wall, inside the
defocused top of a tilt-shift frame, and the toolbox that should spend it floor-scale renders without its chroma in
variant C. The tool wall appears in exactly one frame, hero-b, and there it is a blurry fringe — the concept volunteered
"a blurry constellation in the tilt-shift" and the pixels agree. A set whose law is *one dominant + one accent* cannot
pay the accent in a band the camera is contractually not allowed to focus on. This is ticket AD-2 below and it is not
an Environment Artist failing; it is a placement rule the set template must carry.

Second finding, and it is a shared-prop mesh bug, not a variant bug: **the bucket tunnel reads as a floating hoop.** In
variant A the bucket lies with its mouth to the camera (`rotation.x = PI/2`), and an open-ended cylinder seen mouth-on
shows only its rim — so the "tunnel mouth the last shot frames" renders as a bright ring with a bar across it at both
cameras, an unexplained object, not a passage. Variant C tips the same mesh and it works. Fix once in the bucket
constructor (back cap + shadowed interior, or never point a mouth dead-on) and every set that owns a tube benefits.

## Evidence

Histograms (`tools/histogram.mjs`) plus the tint, accent, sparkle and speckle censuses (per-pixel, this review):

| frame | mean | p5 | ≥243 % | <60 % (tinted) | blackish px | token-red % | isolated ≥240 in floor band | band MAD (speckle) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| hero-a | 141.8 | 62 | 3.29 | 3.49 | 0 | 0.000 | 0.006 % | 2.76 |
| close-a | 141.3 | 61 | 4.70 | 3.18 | 0 | 0.000 | 0.010 % | 2.51 |
| hero-b | 170.4 | 78 | 0.42 | **0.00 (2 px)** | 0 | 0.059 | 0.006 % | 1.94 |
| close-b | 141.6 | 72 | 0.20 | 0.03 | 0 | 0.000 | 0.004 % | 2.08 |
| hero-c | 162.5 | 45 | 2.36 | 7.23 | 0 | 0.000 | 0.032 % | 3.64 |
| close-c | 142.4 | 38 | 0.44 | 10.44 | 0 | 0.000 | **0.050 %** | 3.96 |

- **Never-list audit: clean in all six.** Zero blackish pixels; the minimum channel spread among sub-60 pixels is 16–30, so every dark carries hue (olive in A, cream in B, resin-olive in C). Nothing here is too dark; the two risks below are flatness and placement.
- **B has no darks at all.** hero-b's sub-60 count is *two pixels*, p5 78, mean 170 — not blown (0.42 % ≥243), simply high-key: the "flat, faintly cyan" tube story reads as lifted ambient, and the two tube fixtures the concept promised are above frame. This is the ambient-mush clause of line 8 measured, and it is why variant B cannot be ratified on this evidence.
- **C earns the darkest darks of the stage** (7.2 % / 10.4 %, p5 45 / 38) and pays for them with the highest speckle MAD of the three (3.64 / 3.96 against A's 2.5–2.8 and B's ~2.0). Some of that is the flake layer doing its job; some is TA-1 on grazing epoxy — the next review owes it a 300 % crop before the number is blamed on either.
- **C's flakes read as confetti, not glint:** 0.05 % isolated bright pixels in close-c's floor band (≈46 specks scattered across open shade, longest bright run 139 px) — sparse white dots *outside* the blade, which is how snow reads and sparkle does not.

## Score tables

### Variant A — sealed gloss, one hanging bulb

| Line | hero-a | close-a |
|---|---:|---:|
| 1 Silhouette | 1 | 1 |
| 2 Focal point | 1 | 1 |
| 3 Scale cues | 2 | 2 |
| 4 Color | 1 | 1 |
| 5 Light | 2 | 2 |
| 6 Material | 1 | 1 |
| 7 Story | 1 | 1 |
| 8 Nothing default | 1 | 1 |
| **Total** | **10** | **10** |
| **Verdict** | FAIL | FAIL |

### Variant B — broom finish, flat-cold tubes, the mezzanine

| Line | hero-b | close-b |
|---|---:|---:|
| 1 Silhouette | 1 | 1 |
| 2 Focal point | 1 | 1 |
| 3 Scale cues | 2 | 2 |
| 4 Color | 2 | 1 |
| 5 Light | 1 | 1 |
| 6 Material | 1 | 1 |
| 7 Story | 2 | 1 |
| 8 Nothing default | 1 | 1 |
| **Total** | **11** | **9** |
| **Verdict** | FAIL | FAIL |

### Variant C — epoxy sparkle, door-gap sunblade, wheel tunnel

| Line | hero-c | close-c |
|---|---:|---:|
| 1 Silhouette | 2 | 1 |
| 2 Focal point | 1 | 1 |
| 3 Scale cues | 2 | 2 |
| 4 Color | 1 | 1 |
| 5 Light | 2 | 2 |
| 6 Material | 1 | 1 |
| 7 Story | 2 | 1 |
| 8 Nothing default | 1 | 1 |
| **Total** | **12** | **10** |
| **Verdict** | **PASS** | FAIL |

## The three checks the studio asked for, by name

- **Is the oil stain readable as a grip hazard?** Only in the middle variant, and by accident of staging. **A** — the variant that puts the stain dead-centre in the room's only spotlight — renders it as a flat brown ellipse with a hard edge and no sheen sitting in a bright pool: at thumbnail it reads as a hole in the floor or a pooled shadow, and the car never touches it. That is the stage-3 mug-ring disease wearing a hazard: a decal where a film belongs, and the one prop in the set that must *bite* is the one prop that is painted on. **B**'s drip beside the upright bucket, with its satellite drips, is the only spill in the stage that reads as a spill at a glance. **C** places the stain at the blade's dark edge, where the contrast difference between slick and matte should do the work, but the flake noise around it out-shouts it and no specular streak measures above the floor. None of the three is ship-ready as a hazard; none is invisible either, so no zero.
- **Does the workbench mezzanine read as a level idea?** Half of it, in one frame. hero-b is the stage's most interesting *proposal*: a cardboard ramp runs up out of frame and a second car is parked halfway up it, engine-off, which is exactly how a level idea should be pitched in a still. But the destination is missing — the bench top is above frame, so the ramp climbs into nothing, and the under-bench "free low ground" the concept promised is not in either frame; close-b shows legs and a blurry wheel rim. Worse, the parked-flat wheel lands in the extreme foreground as a big defocused dark arc, the largest mass in the frame, and it is the wrong thing to look at. The mezzanine is a good idea that needs its end-point inside the frame and its wheel out of the lens.
- **Is the bike-wheel tunnel the goal line?** Yes, and it is the best prop read of the stage. hero-c is the only frame in the set that scores 2 on silhouette: a stood-up wheel dead-centre on the straight, spokes and tunnel mouth behind it, readable at thumbnail, and the histogram shows the room is built around it (7.2 % earned darks, everything else shade). It fails only on focal discipline — the blue witness car parked beside the pink hero splits the band in both cameras — which is a placement bug, not a design bug.
- **Tilt-shift still the signature.** Present and correctly banded in all six; it does the miniature work everywhere, and it is also the mechanism stealing the accent and the tool wall. The scale line is the one line every variant clears cleanly (2/2 in all six frames).

## Verdict — **no variant passes both cameras. Send-back round 1 of 2 spent, on variant C as the named contender.**

C is the only variant with a frame at the bar, and it is the only variant that already does what the art bible asked: the
real toys are the terrain, the room has a goal line, and the darks are earned and tinted. Its failures are all placement
and shader-class, the cheapest kind: an absent accent, a second car in the wrong place, flakes classed as pale paint
instead of metal, a sunblade that never reaches the floor camera, and a stain with no film. A is the **light alternate**
— the bulb pool is the most beautiful light in the set and the first non-directional key in the engine, but its
bucket-as-hoop and decal-stain mean two of its three advertised toys do not exist at either camera, and ratifying it
would ratify a hazard that is painted on. B is **not withdrawn but parked**: its mezzanine is the level idea the
campaign wants and it should be ported into C's geometry by levels, but a set with a two-pixel dark budget cannot be
ratified, and its foreground wheel is a framing fault line.

**Send-back list, variant C re-render (all param/data-level, acceptance numbers attached — the standard shape):**

1. **Spend the accent inside the focus band.** Put the token red on something floor-scale and sharp: the toolbox needs its chroma (it is currently shade-brown), plus a red-handled screwdriver leaning the bench leg or lying on the deck at car height. Acceptance: token-red chroma census **≥ 0.15 %** of pixels in each frame (today 0.000 %), with one red object unambiguously inside close-c's focus band and visible in a 400 px downscale.
2. **One car per focus band.** Move the blue witness car (currently parked look-at-the-wheel beside the hero) out of the band — behind the wheel, on the far side of the blade, or out of frame. Acceptance: at 400 px, exactly one car inside the focus band in both frames; any second car either out of frame or separated by **> 25 % of frame width**.
3. **Flakes glint, they do not snow.** Halve flake size and move them to a specular/metal treatment so they fire only where the blade and its mirror land, not as pale dots in open shade. Acceptance: isolated ≥240 pixels in the floor band **≤ 0.01 %** (today 0.050 % close-c / 0.032 % hero-c), and **≥ 60 %** of whatever bright flake pixels remain sit inside the blade band.
4. **The blade must reach the floor camera.** Widen or re-aim the sunblade strip so the light story is legifiable at the low rig, not just at hero. Acceptance: close-c contiguous bright floor coverage **≥ 1.5 %** with a bright run **≥ 300 px** (today 0.77 % / longest run 139 px), while p5 stays **below 60** (today 38) — a blade needs a dark room around it.
5. **The stain becomes a film at the blade's edge.** Apply the ratified bathroom wet-patch treatment (base tone + specular sheen + soft edge) rather than a dark decal. Acceptance: stain-region mean within **±25 luma** of adjacent epoxy except a specular streak ≥ 240 covering **≥ 15 %** of the stain area; the stain stays put at the blade's dark edge and stays detectable in hero-c.

Re-render hero-c and close-c only. If both land at **≥ 12 with no zero**, variant C is ratified as the garage. If not,
variant A returns as the alternate with a two-line list (angle the bucket mouth off-axis ~25° or cap its back so its
wall shows; give the stain the same film treatment), and garage send-back 2 of 2 is spent.

## For the Director

1. **[AD] Garage: no variant passes yet; send-back 1 of 2 spent on variant C**, five numbered fixes, all with acceptance numbers, two frames to re-render. Best frame of the stage is hero-c (12) — the bike-wheel tunnel is a real goal line and the darkest earned histogram in the house.
2. **[AD] Ticket AD-2 (systemic, all sets): props hung above the focus band do not exist.** The tool wall sits at ~0.44 m in all three variants and pays nothing — it is the mechanism behind the missing accent in every garage frame. Rule for the set template: every set must land at least one read-surface of its accent and of each anchor prop inside the tilt-shift band. Worth deciding before the porch set, whose whole story is a wall of things.
3. **[AD] Bucket-mesh ticket: an open-ended cylinder aimed at the camera is invisible.** A's tunnel mouth renders as a floating hoop. Cap it or never aim a mouth dead-on; the fix is shared with every future tunnel, drain and tube.
4. **[AD] Carry-forward to levels, independent of the verdict:** variant B's workbench mezzanine (ramp to bench shelf + claimable under-bench volume) is the best level idea in the exploration and should be ported into whichever variant is ratified — the geometry is already shared across the three skins, so it is a data-level ask. Also port B's drip-beside-the-bucket staging; it is the only spill in the stage that reads.
5. **[AD] TA-1 still open and now measurable per set:** band speckle MAD 3.64/3.96 (C), 2.51–2.76 (A), ~2.0 (B). Before the next set's first still, this needs a 300 % crop verdict distinguishing ramp dither from C's intended flake layer, or the garage review keeps opening with an ambiguous number.
6. **[AD] Self-score calibration:** the concept's own demerits — B's "blurry constellation" tool wall, C's flake count, A's bulb-as-drama-not-ambience — match the pixels on both counts volunteered. Claims continue to match renders; keep the honesty notes and fresh-eyes AD per set.
7. **[AD] Hazard-affordance scoreboard for playtest:** oil stain (all three) = not ready, film treatment is send-back item 5; garage mezzanine lip (B's cardboard-vs-concrete edge) = best candidate for the grip mechanic, port it; bike-wheel tunnel (C) = ready and should anchor the garage's goal-line levels.
