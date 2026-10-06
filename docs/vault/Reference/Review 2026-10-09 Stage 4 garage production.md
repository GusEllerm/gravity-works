---
tags: [reference, review]
livedocs: snapshot
---
# Review 2026-10-09 — Stage 4 garage production renders (Art Director)

> [!abstract] Scope and method
> Three production renders — docs/explorations/garage/production-hero.png, production-side.png and production-low.png
> — judged against ratified variant C (Review 2026-10-08 Stage 4 garage). Battery: one census run (tools/census.mjs
> darks/tinted/blackish/blown, tools/histogram.mjs, plus an inline token-red chroma census, floor-band bright
> coverage, longest bright run and isolated-bright-pixel count over the lower 45 % of the frame), then one view per
> frame. Rubric per the Art Bible: eight lines, 0–2, per camera; pass = 12/16, any zero is an auto-fail.

## Must-not-lose checklist, measured

- **Earned tinted darks: CARRIED.** Census darks below 60 are 6.72 / 2.78 / 6.19 % (hero / side / low), matching the
  artist's figures; tinted share is 98–99 % of them and blackish is near-zero (0.069 / 0.014 / 0.285 %, i.e. hundreds
  of pixels, not none — a thin crust under the toolbox and bench legs that reads as contact shade, not crush). hero
  p5 33 and low p5 35 are in the ratified range (close-c was 45); side p5 59–74 is the one flat frame, flagged below.
- **Token-red accent in band: CARRIED and paid everywhere.** 0.479 / 0.791 / 0.239 % — all three frames clear the
  ratified 0.15 % bar; the toolbox is sharp in the band at every rig. AD-2 holds in production.
- **Bike-wheel tunnel at thumbnail: carried in hero and side, LOST in low.** In low the wheel is a blown, fully
  defocused wash — the rim vanishes and the tunnel reads only as an unexplained dark mass behind the toolbox. The
  goal line exists at two of three production cameras.
- **One tool: CARRIED.** The red toolbox is the single tool read in all three frames; no tool-wall regression.
- **Bulb practical in hero: NOT CARRIED at hero.** The hero frame's top band is bench planks — no bulb, no cord. The
  side frame shows the hang (cord + fixture upper frame) and low shows a defocused disc, so the practical exists in
  the set, but the ratified carry-forward ("bulb clears the hub at the hero rig") is exactly the thing that was lost.
  This is the single largest gap against the ratified still.
- **Carry-forwards.** Ribbon blade: present at all three, but still an orange *track* — the side steps and the saturated
  chroma carry-forward from round 2 was not applied, and in low the blade is a solid ribbon with a visible stair-step
  near-side edge. Soft stain: carried — hero and side show soft-edged pale pools (side's under the tipped bucket is the
  best film read in the stage); in low there is none in frame. Mezzanine: carried — the bench is a furnished slab with
  volume and a claimable under-bench stage at all three rigs; side's ramp patch pitches the level idea.

## Evidence

| frame | mean | p5 | darks <60 % | tinted % | blackish px % | token-red % | floor-band bright % | max run px | iso ≥240 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| production-hero | 148.9 | 33 | 6.72 | 6.65 | 0.069 | 0.479 | 3.61 | 414 | 0 |
| production-side | 145.8 | 74 | 2.78 | 2.76 | 0.014 | 0.791 | **0.00** | 0 | 0 |
| production-low | 128.6 | 35 | 6.19 | 5.90 | 0.285 | 0.239 | 1.99 | 409 | 3 px |

- Blade-at-floor rigor: hero (run 414) and low (run 409, 2.0 % coverage) match the ratified close-c exactly (409).
- Flake discipline held: isolated bright pixels in the floor band are 0 / 0 / 3 — the confetti disease is gone from
  the floor bands. **But** side carries a mid-frame flake cluster right of the blade (visible in a single view) that
  sits above the floor-band window the census measures; it reads as scattered pale confetti on green.
- One car per band: the blue witness sits beyond the 25 % separation at all three rigs; the pink hero is alone in the
  sharp band. Clean.

## Score tables (8 lines × 0–2, pass ≥ 12, no zeros)

### production-hero

| Line | Score |
|---|---:|
| 1 Silhouette (wheel tunnel + toolbox + blade on the straight) | 2 |
| 2 Focal point (pink car + toolbox in the sharp band) | 2 |
| 3 Scale cues (bucket foreground, bench legs, oversized wheel) | 2 |
| 4 Color | 1 |
| 5 Light (blade legible; bulb practical absent at this rig) | 1 |
| 6 Material (stain is a film; floor flat, blade painted-on) | 1 |
| 7 Story (one car, one road, tunnel goal, witness parked under the bench) | 2 |
| 8 Nothing default | 1 |
| **Total** | **12** |
| **Verdict** | **PASS** |

### production-side

| Line | Score |
|---|---:|
| 1 Silhouette (tunnel-under-wheel reads best of the three; left cluster is busy) | 2 |
| 2 Focal point (wheel + toolbox sharp, foreground defocused) | 2 |
| 3 Scale cues (box, bucket, bench all legible) | 2 |
| 4 Color (red census strongest, but blade-orange competes with it) | 1 |
| 5 Light (no blade floor-touch in band, p5 59, darkest darks thinnest here) | 1 |
| 6 Material (mid-frame flake cluster reads confetti; stain a pale disc) | 1 |
| 7 Story (still-life left; goal line not on a path from this angle) | 1 |
| 8 Nothing default | 1 |
| **Total** | **10** |
| **Verdict** | **FAIL** |

### production-low

| Line | Score |
|---|---:|
| 1 Silhouette (wheel blown out; tunnel not readable at thumbnail) | 1 |
| 2 Focal point (car + toolbox in band) | 2 |
| 3 Scale cues (bucket rim, bench ceiling, distant witness) | 2 |
| 4 Color | 1 |
| 5 Light (blade run 409 + p5 35 — the ratified floor-rig light story intact) | 2 |
| 6 Material (blade stair-step visible; floor flat) | 1 |
| 7 Story (ribbon leads to the tunnel, witness on the far side) | 2 |
| 8 Nothing default | 1 |
| **Total** | **12** |
| **Verdict** | **PASS** |

## Verdict — **2 of 3 cameras pass with no zeros; production is NOT accepted on side alone.**

hero and low preserve the ratified content: earned tinted darks, the accent paid in band, the blade story at the floor
rig, one car per band, flake discipline. side fails on totals only — it is the flat frame (p5 59–74, 2.78 % darks,
zero blade floor-contact in the band) with the last confetti cluster. One knob, no set-level send-back:

1. **Knob: re-aim/expose the side rig** so the blade's floor contact enters its band and the dark budget comes down to
   p5 < 50 (match the other two), and thin the mid-frame flake cluster right of the blade. Re-render production-side
   only.
2. **[AD carry-forward, unchanged] Bulb practical at hero** — round-2's one-line data move was lost in production;
   the hang exists (visible at side) but the hero frame must show it. Accept at the next hero still.
3. **[AD carry-forward, unchanged] Ribbon blade polish** — soften the sides, drop chroma a notch, kill the stair-step
   on the near edge; it is now the main line-4/line-6 tax at all three rigs.
