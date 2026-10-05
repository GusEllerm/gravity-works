---
tags: [reference, review]
livedocs: snapshot
---
# Review 2026-10-08 — Stage 4 bathroom + bedroom explorations (Art Director)

> [!abstract] Scope and method
> Sixteen committed renders viewed at full size — bathroom and bedroom hero-a/b/c and close-a/b/c — plus the standing battery: 400 px downscales for the silhouette and focal lines, full-frame luminance histograms (mean, p5, ≥243 coverage, sub-60 coverage), and a per-pixel min-luma/dark-tint audit against the never list. The concepts' claims (histograms, hazard reads, the fabric thesis, the glass wall) are treated as claims and re-measured. Rubric per Concepts/Art Bible §The rubric: eight lines, 0–2, pass = 12/16, any zero is an auto-fail. No code changed.

## Cross-cutting finding first: ramp-dither speckle is back, and it is set-wide

Speckled dither fringes — the exact rejection from stage 1 ("painterly softness 0.3 is rejected: dither speckle at grazing angles") — appear on grazing surfaces in **eleven of the sixteen frames**: the track's side walls in every frame that shows them, the tub flank in bathroom variant A, the mug flank in bedroom close-c (across roughly a fifth of that frame), and the shadow edges of mugs, books and the desk in bedroom A and B. This is not an Environment Artist fix; it belongs in the ramp/material registry next to the ratified steps/thresholds. Filed below as ticket TA-1 with the kitchen's own acceptance shape.

## Score tables

### Bathroom (docs/explorations/bathroom/)

| Line | hero-a | close-a | hero-b | close-b | hero-c | close-c |
|---|---:|---:|---:|---:|---:|---:|
| 1 Silhouette | 1 | 1 | 1 | 1 | 2 | 2 |
| 2 Focal point | 1 | 1 | 1 | 2 | 1 | 1 |
| 3 Scale cues | 2 | 2 | 2 | 2 | 2 | 2 |
| 4 Color | 1 | 1 | 2 | 2 | 1 | 1 |
| 5 Light | 1 | 1 | 1 | 1 | 1 | 1 |
| 6 Material | 1 | 1 | 1 | 1 | 1 | 1 |
| 7 Story | 1 | 1 | 1 | 1 | 1 | 1 |
| 8 Nothing default | 1 | **0** | 1 | 1 | 1 | 1 |
| **Total** | **9** | **8 + zero** | **10** | **11** | **10** | **10** |
| **Verdict** | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL |

### Bedroom (docs/explorations/bedroom/)

| Line | hero-a | close-a | hero-b | close-b | hero-c | close-c |
|---|---:|---:|---:|---:|---:|---:|
| 1 Silhouette | 2 | 1 | 2 | 2 | 1 | 1 |
| 2 Focal point | 2 | 1 | 2 | 2 | 1 | 2 |
| 3 Scale cues | 2 | 2 | 2 | 2 | 1 | 1 |
| 4 Color | 2 | 2 | 2 | 2 | 2 | 2 |
| 5 Light | 2 | 2 | 2 | 2 | 1 | 2 |
| 6 Material | 1 | 1 | 1 | 1 | 1 | 1 |
| 7 Story | 2 | **0** | 1 | 1 | 1 | 1 |
| 8 Nothing default | 1 | 1 | 1 | 1 | 1 | 1 |
| **Total** | **14** | **10 + zero** | **13** | **13** | **9** | **11** |
| **Verdict** | PASS | FAIL | **PASS** | **PASS** | FAIL | FAIL |

## The checks the studio asked for, by name

- **1:64 scale readability (props vs track width).** All three bathroom variants keep track width and prop volumes mutually consistent; the duck, monolith shampoo and cotton-boulder all read oversized without breaking the car's scale. Bedroom: the cable speed-bump in A is the best scale-true detail in the stage (a real 2 mm cable posing as a hump on a 14 mm deck); bedroom close-a is the one readability failure — at 400 px the toothbrush's blue head lying on the track line next to the blue car makes two blue blobs and the thumbnail cannot say which one is drivable.
- **Toy car reads as hero.** Best: bedroom close-b and bathroom close-b (sharp, high-chroma, on the track line, nothing else in the band competing). Weakest: bathroom hero-b (the duck's tail owns the frame and the car is a green dot) and bedroom close-a (blob confusion above). Car colours stay Okabe–Ito-clean everywhere — blue (bath-A, bed-A, bath-B second unit), bluish green (bath-B/C first units, bed-B), reddish purple (bath-C, bed-C) — none drifts into the track's orange family.
- **Kitchen palette collision in the bathroom.** Measured, not vibes: bathroom A and C (porcelain-aqua, steel-blue) have zero overlap with kitchen's gold-plus-mint. Bathroom B's hero is the collision risk — at thumbnail its warm tan walls, blown cream ceramic and yellow duck land within one grading decision of the kitchen hero; the teal mat is the only thing that names "bathroom," and a set cannot depend on one mat. A's cool strategy is the safe house; the art bible's cool-set clause is honoured without borrowing kitchen's gold.
- **Fabric softness in the bedroom.** B's floor is wood, C's duvet reads as a smooth mauve sheet with the quilting invisible, so the soft-fabric thesis lands in **A** — the low amber key raking comb through the pile and the shadowed ripples read as fabric at hero. At the floor camera A's fabric degrades to the bed-skirt's flat lavender slab. Verdict: fabric reads, but only in one camera of one variant; kept as a carry-forward ticket, not a blocker, because the carpet *is* in the ratified variant.
- **Tilt-shift still the signature.** Present and correctly banded in all sixteen frames; it does the miniature work everywhere, and it is the only thing holding the two washed bathroom-A frames up. Where the band falls across empty or featureless ground (bedroom close-a, bathroom close-a), the signature is visibly paying for the frame alone — the camera line stays at 2 nowhere, but the focal line is where empty bands cost points.
- **Hazard affordances.** Bedroom A's cable speed-bump: visible, correctly sized, on the racing line, pops the car — ship it. Bathroom: variant A's wet patch is the only hazard that *shows* at both cameras, but it shows *wrong* (a flat cyan rectangle, not a film — the stage-3 mug-ring disease reintroduced as liquid); variant B's mat hazard reads (it is the whole frame); variant C's puddle film is invisible at both cameras.
- **Never-list audit.** Zero blackish pixels in all sixteen frames (every sub-60 pixel carries hue: indigo in bedroom B/C, teal in bathroom B). The never list holds. The failures below are all *positive* violations — things rendered too bright or too speckled, not too dark.

## Histogram evidence (independent re-measurement)

| frame | mean | p5 | ≥243 % | <60 % (all tinted) |
|---|---:|---:|---:|---:|
| bathroom hero-a | 213 | 125 | **34.0** | 0.00 |
| bathroom close-a | 205 | 101 | **39.1** | 0.00 |
| bathroom hero-b | 165 | 113 | 1.1 | 0.02 |
| bathroom close-b | 166 | 109 | 2.3 | 0.02 |
| bathroom hero-c | 208 | 153 | 9.5 | 0.00 |
| bathroom close-c | 206 | 151 | **18.7** | 0.00 |
| bedroom hero-a | 163 | 116 | 0.3 | 0.03 |
| bedroom hero-b | 126 | 60 | 0.1 | 4.9 |
| bedroom hero-c | 123 | 55 | 0.1 | 5.4 |
| bedroom close-a | 172 | 136 | 0.1 | 0.01 |
| bedroom close-b | 123 | 59 | 0.2 | 5.5 |
| bedroom close-c | 111 | 43 | 0.1 | 16.0 |

Bathroom A's hero carries **2.2× the blown coverage that failed the stage-3 kitchen hero** (15.4 %), with an empty shadow band on top of it — the stage-3 lesson ("exposure is a systemic story; the bathroom will inherit the wash") arrived on schedule and un-mitigated. Every bathroom frame has effectively zero pixels below 60; every bedroom B/C frame earns its darks, tinted.

## Verdicts

### Bedroom — **variant B (hardwood, lamp-lit dusk) is chosen, 13/13, both cameras pass. No send-back spent.**

B is the only variant that passes at both canonical cameras, and it is the room's stated story told honestly: one lamp key, a warm pool, indigo shadows that carry the palette, the darkest histogram of the set with zero blackish pixels, the best car read in the stage, and the cable snake facing the track — the one prop that says someone lives here. It is not yet perfect, and the demerits are real but sub-12-proof: the book "pyramid" reads as a voxel blob whose white volume wears dither fringe (material 1), the floating desk slab is charming but its support is invisible (material note), and the homework detail the concept promised never reaches either frame (story 1 in both). These become carry-forward tickets with the production set, not a round.

A's hero (14) genuinely beats B's hero — the raked amber on carpet is the most beautiful frame of the stage and the cable bump is the best track ask — but close-a fails with a zero (nothing lived-in inside the band, and the blue car/blue toothbrush-head pair breaks the focal rule), so A cannot be the set without spending the round. C is withdrawn: the marshmallow mug sits *on* the racing line, the quilting is invisible, the duvet reads as a smooth sheet, and the variant whose whole thesis was "earn springs as a mechanic" never shows a crest. **The bed-spring mechanic survives independently of the variant — ask levels to source it in B via a mattress edge or an offered book-ramp onto a bed skirt.**

### Bathroom — **no variant passes (best is close-b at 11). Send-back round 1 of 2 spent, on variant A as the named contender.**

Rationale for nominating A rather than the highest scorer: B's 11 is closest to the bar, but B fails its own thesis (the mat — its hero material — renders as a mint foam slab with zero softness, the fabric softness the studio asked me to check does *not* read in variant B), it fails the hero camera on focal (the duck's tail is a coin, not a duck, at 400 px), and it is the only bathroom strategy with measured kitchen-collision risk. C's signature gimmick is not in the pixels: at both cameras the glass wall is invisible (its posts are thin strips; nothing reads as a sightline or a sound barrier), its puddle hazard is invisible too, and the concept itself defers the glass decision to the Technical Artist. A fails for exactly one reason — it is the stage-3 kitchen wash disease wearing porcelain: 34–39 % blown coverage, an empty shadow band, a hazard rendered as a decal, and a dither artifact on the tub flank. That disease has a known cure already ratified in the ceramic class. A keeps the things the others cannot give: the fastest deck story, a hazard that is *placed where a camera can see it*, and the cleanest scale discipline of the three.

**Send-back list, variant A re-render (all param/data-level, acceptance numbers attached — the standard send-back shape):**

1. **Ceramic exposure, class-level.** Drop ceramic base lightness 8–10 % or raise the upper ramp threshold so three bands land on the tub wall and sink — the ratified stage-3 fix, applied to bathroom scene values. Acceptance: hero ≥243 coverage 34 % → **under 8 %**; close 39 % → **under 10 %**; visible ramp bands on the tub flank and near wall in both frames.
2. **Shadow budget.** The bathroom must earn darks the bedroom just proved it can: fill pulled toward the aqua set hue so shadows tint and bite. Acceptance: p5 **below 120** and **≥ 1,000 sub-60 pixels, all tinted** (zero blackish — the audit must stay at zero) in both frames.
3. **Wet patch becomes a film, not a sticker.** Replace the flat cyan rectangle with the stainDecal/sheen treatment the mug ring already uses: tile base tone plus a specular sheen and a soft edge. Acceptance: patch-region pixels within ±25 luma of surrounding tile except a specular streak ≥ 240; hazard still *detectable* at hero (it is the only frame in the room where that is true today — do not fix it by shrinking it).
4. **Tub-flank band artifact.** The speckled bands down the flank are the ramp dither (ticket TA-1 below); scene-side, confirm the flank's normal range hits the same band as the rim. Acceptance: no speckle in a 300 % crop of the flank.
5. **Track side walls.** Same dither fuzz on the orange side walls in A's close. If TA-1 lands first this is free; otherwise lower the side-wall ramp softness — do not re-hue the track. Acceptance: no speckle in a 300 % crop of a track run in the focus band.

Re-render hero-a and close-a only. If the re-render lands both at ≥12 with no zero, variant A is ratified as the bathroom; if it does not, variant B returns as the temperature alternate with a two-line composition list (rotate the duck to profile or pull it out of the hero axis; fix the toothbrush's blown pink rim streak), and bathroom send-back 2 of 2 is spent.

## For the Director

1. **[AD] Bedroom ratified: variant B (13/13).** Carry-forwards with the production set, no round: book-stack silhouette + its dither fringe, one lived-in detail authored into the floor band (the stage-3 ticket, still unpaid), and desk-leg support lines. The bed-spring ask from withdrawn variant C should be re-homed in B's level geometry.
2. **[AD] Bathroom send-back 1 of 2 spent on variant A.** Five numbered fixes, all with acceptance numbers; the re-render is two frames. The temperature vote the concept asked for is answered with data: cool wins, warm-B carries the only kitchen-collision risk in either room.
3. **[AD] Ticket TA-1 (systemic, all sets): ramp-dither speckle on grazing faces** — track sides, prop shadow edges, mug and tub flanks — the rejected-painterly signature at ramp B's 0.03 softness. Candidate acceptance: 300 % crops of a track side wall and any grazing ceramic/mug flank show no high-frequency speckle. This must close before the *next* set's first still, or every future review opens with an eleven-frame demerit.
4. **[AD] The exposure warning from stage 3 came true verbatim** — bathroom A shipped the wash (34 % blown, zero darks) precisely because the rig fix stayed in kitchen stills. Whatever mechanism makes the ceramic/shadow fixes survive from a dev scene into a set template is cheaper than one more set's worth of histogram reviews.
5. **[AD] Self-score calibration, good news:** both Concept.md demerit sections volunteered exactly the flaws I scored down (bedroom: the empty A floor shot, the C marshmallow; bathroom: C's engine risk). Claims match pixels; keep the honesty notes coming and keep fresh-eyes AD per set.
6. **[AD] Hazard-affordance scoreboard for playtest:** cable bump (bedroom B inherits A's — port it) = ready; bathroom wet patch = A's is the only visible one, on the watch-list until the film lands; C's puddle is withdrawn with the variant.

## Round 2 — FINAL verdict, variant A re-render (2026-10-05, AD)

> [!abstract] Method
Measurement-first: the committed hero-a.png and close-a.png were re-measured with tools/histogram.mjs plus a
per-pixel tint/spread, region-mean and high-frequency speckle audit (mean absolute deviation from a 5x5 box
mean), each speckle metric run against the round-1 files from git for an old-vs-new comparison. Two 300 %
crops (track wall, tub flank) for the literal crop acceptance. b/c variants confirmed byte-identical.

### Fix-by-fix verification (measured, not prose)

1. **Ceramic exposure — VERIFIED.** ≥243 coverage 34 % → **1.0 %** hero (bar <8), 39 % → **4.24 %** close (bar <10). Tub flank, rim and wall tiles resolve into distinct ramp bands in both frames.
2. **Shadow budget — VERIFIED.** p5 **95** hero / **93** close (bar <120); sub-60 **4,240 / 4,958 px** (bar ≥1,000); blackish count **0** in both (min channel-spread 19/23 — every dark tinted; never-list audit stays clean).
3. **Wet patch film — VERIFIED.** Patch-region mean 225.8 vs adjacent tile 227.6 (Δ 1.8, inside ±25); no blown patch pixels; close-a floor band carries 115 specular pixels in [240,243) — streaks clear 240 without re-blowing. The artist's volunteered cap (~239 in hero) checks out: hero detectability rides on tint + soft edge + grout wash, which it does. Hazard still placed where the hero camera sees it.
4. **Tub flank — VERIFIED.** Speckle metric 0.29 (round-1 baseline 0.23 — flat); 300 % crop shows one contiguous band, no speckle. Caveat the artist volunteered and I confirm: the band edge is texel-staircased — a hard quantized edge, not the rejected signature; carry-forward, not a blocker.
5. **Track side walls — VERIFIED.** Speckle metric close 3.58 → **1.38** (−62 %), hero 1.46 → **0.78** (−47 %); the 300 % crop of the focus-band run shows flat banded orange, hard car shadows, no dither fuzz. Residual stairstepping at band joins is geometry aliasing, not TA-1 speckle.

### Rubric, variant A re-render

| Line | hero-a | close-a |
|---|---:|---:|
| 1 Silhouette | 1 | 2 |
| 2 Focal point | 2 | 2 |
| 3 Scale cues | 2 | 2 |
| 4 Color | 2 | 2 |
| 5 Light | 2 | 2 |
| 6 Material | 1 | 1 |
| 7 Story | 2 | 2 |
| 8 Nothing default | 2 | 2 |
| **Total** | **14** | **15** |
| **Verdict** | **PASS** | **PASS** |

Material stays at 1 in both cameras: the drain's chrome ring still flares as a blown donut at the track's far end (pre-existing, belongs to the TA's chrome class), the sink glaze is a single flat sheet at close, and the flank's staircased band edge is not yet mathematically smooth. Hero silhouette holds at 1 — the duck mass still outweighs the car in the upper frame, unchanged and not asked to change.

### Verdict: **variant A RATIFIED as the bathroom set. 14/15, both cameras pass, no zeros. No alternate invoked; send-back 2 of 2 unused.**

Every one of the five acceptance bars measures green — the stage-3 wash disease is cured at scene level, and A kept exactly what it was nominated for: the fastest deck story, a camera-visible hazard that now reads as a film, and the clean scale discipline. The kitchen-collision question stays answered: cool porcelain, zero measured overlap with kitchen gold-mint.

**The one thing production must not lose:** the exposure discipline that earned this ratification — the ceramic three-band ramp (upper threshold 0.72) with the deep tinted-aqua fill, entered at *material/registry level*, not scene values. This is the exact fix that died in stage-3 kitchen stills and reappeared as a 34 % wash; if the set template carries the porcelain bases without the bands and tinted fill, the wash is back by the first production still. Carry-forwards with the set, no round: chrome-ring flare (TA chrome class), tub-flank texel staircase, TA-1 speckle (still open, systemic), and the hero duck mass.
