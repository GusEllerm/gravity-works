---
tags: [reference, review]
livedocs: snapshot
---
# Review 2026-10-07 — Stage 3 kitchen set, round 2 (Art Director)

> [!abstract] Scope and method
> The three re-shot canonicals (`docs/explorations/kitchen-set/{establishing,hero,floor}.png`) viewed at full size, plus the same battery as round 1: 200 px downscales of all three for the silhouette line; targeted 200–400 % crops (rim-car in hero and establishing, the floor focus car, the mug/toast junction, both track terminations, the floor's bowl dome as a region); full-frame and regional luminance histograms via `tools/histogram.mjs`; a per-pixel min-luma/dark-tint audit and a brand-hue histogram of orange pixels against `tokens.ts`'s `trackOrange: #FF7A1A`. No code changed. Rubric per PROMPT.md §5.9, never listed here; pass = 12/16, no zero. The Session note's acceptance numbers were re-measured independently and all three reproduce exactly.

## Fix-round verification (round 1's seven demands)

| Demand | Verdict | Evidence |
|---|---|---|
| 1 Ceramic bands, hero < 8 % / floor < 10 % blown | **Honoured** | Re-measured: hero ≥ 243 = 4.67 %, floor = 0.71 %. 400 % crops show three visible bands on the outer wall, the rim bevel, and the interior in all three frames. The egg is gone; it is a bowl. |
| 2 Liquids tinted, one highlight | **Coffee honoured / milk half-landed** | Coffee reads brown in both frames it shows. Milk: the set-tint base exists, but sampled at the hero's disc centre the surface sits at luma 248–251, `rgb(255,255,190)` — the specular is pushing the tinted base back to the clip. From the establishing camera the same disc measures a warm 210, so it is a hero-camera specular issue, not a palette regression. Non-blocking; see carry-forwards. |
| 3 Rim car clear of ceramic | **Honoured** | Cropped at 400 % in hero and establishing: wheels on the rim crown, body fully above the glaze line, a small warm contact shadow under the chassis. The `bowl.out` seat with the level tangent yaw is correct. The artist's refusal of `bowl.in` (car projects across the milk, "reads parked in the soup") is right from the hero height — geometry-correct but composition-wrong; the tangent yaw keeps the read. |
| 4 Car in the floor's focus band | **Honoured, with a better landing than I asked for** | My "near track run" + "middle third at 200 px" bars were mutually unsatisfiable from that camera — the artist says so and the projections bear them out. The centreline stand-in parked clear of the rim, with `focus` re-pointed at it, verifies on my own 200 px downscale: fully visible, sharp, at 48 % of frame width. §7.3's car-following band holds — the band follows the shot's car. Demanding track-run traffic in a floor shot is a preference I withdraw. |
| 5 Track end-cap grounded | **Honoured** | Floor and establishing crops: the final segment meets the counter with a welded contact shadow; no detached pool. Lowering the segment beats the fifth cube; either was fine. |
| 6 Toast contact + ring film | **Honoured** | Hero crop: soldier leans on the mug flank, bottom edge grounded, believable lean. The ring is a flat espresso-brown film hugging the mug's flank in both frames — a stain, not a washer. |
| 7 Spines out of track hue + earned darks | **Honoured** | Book stack is now putty/mint/cream; no orange mass beside the constant. Histogram: floor p5 = 106 with 2,254 sub-60 px, all tinted (min luma 43 = `rgb(66,40,0)`, deep umber; min-luma audit finds **zero** blackish sub-60 pixels in any frame). Hero 191 px, establishing 84 px — thin but non-zero and tinted. The "no black" never-list line is intact at the new depth. |

**Brand-constant audit (unsolicited, clean).** Orange-pixel hue histogram against `#FF7A1A` (hue ≈ 26°): the production floor's track samples a mean hue of 21.8° with 486 brand-band pixels — closer to the constant than the ratified tile-B references themselves (mean ≈ 45°, the golden key washing the lit top band yellow). The peach regression is dead and the track is the most brand-faithful object in the scene.

## Score tables

| Line | establishing | hero | floor |
|---|---:|---:|---:|
| 1 Silhouette | 2 | 2 | 2 |
| 2 Focal point | 2 | 2 | 2 |
| 3 Scale cues | 2 | 2 | 2 |
| 4 Color | 2 | 2 | 2 |
| 5 Light | 2 | 2 | 2 |
| 6 Material | 2 | **1** | 2 |
| 7 Story | 2 | 2 | **1** |
| 8 Nothing default | 2 | 2 | 2 |
| **Total** | **16** | **15** | **15** |
| **Verdict** | **PASS** | **PASS** | **PASS** |

**establishing — 16.** The frame that was "nothing is lit" is now the same painting with a key light. The bowl holds the middle with three visible bands and a cast-shadow base; the tap's L-shadow is a brushstroke again; the mug is banded ceramic with brown coffee and a flat brown ring film; pencil, crumbs, cubes, frozen drip all survive 200 px as the same clean diagonal. Milk at this distance samples a tinted 210 with one ring highlight — exactly what the liquid class asks for. The histogram's shadow band is still thin (p5 = 182), but the shadows that exist are directional, tinted deep umber, and explain their forms; the ratified references live at the same altitude and this frame now matches them line for line.

**hero — 15, pass.** The two round-1 failures are fixed in the only way that counts: the bowl is ceramic — bands on the wall, the rim, and the interior cove — and the rim car sits *on* the rim, casting a small shadow onto the glaze, the eye landing on the right part of the right object at full size and at thumbnail. The tap shadow, the leaning toast, the flat ring, the grounded run end all read. The demerit is the milk: its core samples 248–251, so the painting's centre of gravity is still, at the hero distance, a glare disc rather than a cream-tinted liquid. One class-level specular tweak keeps it from ever being worth a round again; it is not worth a round now.

**floor — 15, pass.** The zero is gone, and the frame is the canonical's own definition at last: low, close, a red car fully visible, sharp, dead-centre third, wheels-down with a real contact shadow. The dome behind it is now a defocused ceramic wall with a value ramp and a shadowed base (region: mean 216, 1.9 % ≥ 243), and the darks under the bowl foot are the deepest, best-tinted pixels in the game. The demerit is story: the car is parked on bare counter and the lived-in details — crumbs, the ring, the drip tell — all fall outside the band or in the blur, so the frame tells "a car at a bowl" and nothing about who lives here.

## The adjudicated disagreement: the floor's dome

The artist pushed back that the cream bowl dome still dominates the floor shot and that the round-1 fix list's own geometry made the requested car placement impossible. On the merits: **the artist wins, on both halves.** The impossibility claim is arithmetically correct (I checked the projections; both run landings project to the outer thirds), and the dome claim conflates *area* with *landing*: measured, the dome is no longer blown, it is defocused and banded, and at both full size and 200 px the eye lands on the car — the only sharp high-chroma object on axis. A large warm shape behind the focus subject is not a focal failure; it is depth. That said, the dome still owns roughly a third of the frame area above the car, and I own the canonical camera that lets it: the fix is a **camera property, not a data edit** — drop the floor camera ~10–15 mm toward counter level and add a slight upward tilt band so the bowl's rim line sits above the car's roofline and the counter plane carries more of the frame. That is calibration for set two's floor-camera template (where the set's hero prop should be *designed* to sit under that rim line), not a re-render of this set. The second send-back is **not** spent on it.

## Verdicts

- **establishing 16, hero 15, floor 15 — all PASS, no zero. The Stage 3 kitchen set is ratified.** Send-back 2 of 2 stays in reserve for playtest-surfaced issues.
- No fix list. Carry-forwards, as tuning tickets (no re-shot, no round):
  1. **Liquid specular ceiling (class-level, TA).** Cap the liquid class's specular contribution so a set-tinted base cannot be lifted above ~240 luma — the milk's hero-distance glare. Candidate acceptance: `histogram.mjs` over the hero's milk-disc crop reports 0 % ≥ 248.
  2. **Floor-shot story in-band (set-two template, not this set).** When a set's floor camera is authored, put one story detail inside the band's near third — a crumb trail that walks up to the focus car is four data points and one line-2 insurance policy.
  3. **Hazard legibility** stays on the playtest watch-list unchanged.

## For the Director

1. **[AD] Stage 3 kitchen visual slice CLOSED** — set ratified (16/15/15), references remain tile-B integration; no Art Bible change needed beyond recording the production canonicals as the regression baselines. Send-back 2 of 2 unspent, held for playtest.
2. **[AD] The disagreement is settled in the artist's favour** and produced a keeper: the floor-camera framing rule (prop-under-the-rim-line; lower camera + tilt band) should go into the set-two camera template, not into kitchen data.
3. **[AD] Process win worth codifying:** a send-back where every demand carries a measurable acceptance number came back verifiable and honest — all seven reproduced at my own keyboard. Adopt "acceptance-numbered fix list + re-measured histogram" as the standard send-back shape.
4. **[AD] Calibration converged.** Artist claims now sit within one point of my scores and the honesty notes led with the right flaws (they volunteered the milk I scored down). The histogram discipline is working; keep fresh-eyes AD per set.
5. **[AD] Brand-constant note, good news:** the floor's track measured *closer* to `#FF7A1A` than the ratified references do; the round-1 recommendation to gate track-orange hue in the material registry is now about protecting the references' wash, not just production — worth doing before bathroom.
6. **[AD] The bathroom question stands:** the shadow-budget lesson (fill never bites at cream tints) was fixed in the dev scene's stills only; gameplay defaults are untouched by design. The lighting-rig answer to round 1's question is: no drift, no debt — but set two's first still should ship with the darks budget visible in its histogram.
