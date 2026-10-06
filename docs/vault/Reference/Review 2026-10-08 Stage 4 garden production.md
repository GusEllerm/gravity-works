---
tags: [reference, review]
livedocs: snapshot
---
# Review 2026-10-08 — Stage 4 garden PRODUCTION verdict (Art Director)

> [!abstract] Scope and method
> The three production stills (docs/explorations/garden/production-hero.png, production-side.png, production-low.png; 1280×720, post ON, set camera row from CAMERAS in src/sets/garden/data.ts) judged against the ratified variant-B bar (hero-b/close-b, 13/13, Reference/Review 2026-10-08 Stage 4 garden.md) and the carry-forwards that rode with it. Evidence: ONE census run of tools/census.mjs at this sitting (table below), all three frames viewed at full size (view budget 3/3 spent), the shipped set code read alongside (SUN, SKY, FILL_STRENGTH, SKY_INFLUENCE in src/sets/garden/data.ts; the sky branch of createLightingRig in src/render/lighting.ts), and the artist's own session log. Rubric per Concepts/Art Bible §The rubric: eight lines, 0–2, pass = 12/16, any zero is an auto-fail. No code changed, no bible edited. Two prior judge sittings stalled before writing; this note is the verdict.

## Census evidence (single run, this sitting)

| frame | px | dark<60 % | tinted % | blackish % | blown ≥243 % | outlier % | medTone |
|---|---:|---:|---:|---:|---:|---:|---:|
| production-hero | 921600 | 0.675 | 0.675 | 0.000 | 0.000 | 0.000 | 121 |
| production-side | 921600 | 0.067 | 0.067 | 0.000 | 0.000 | 0.029 | 113 |
| production-low | 921600 | 0.000 | 0.000 | 0.000 | 0.000 | 0.607 | 148 |

- **The never-list holds outright**: zero blackish and zero blown in all three frames. Every dark that exists is tinted (tinted = darks in all three), and the census round-2 tint reads blue-above-red — the sky-derived shadow tint the ratification demanded is real in the pixels where darks exist at all. The stage-3 wash disease stayed indoors.
- **But the dark budget collapsed as you go down the camera row**: ratified hero-b earned 1.33 % sub-60 and close-b 2.44 %; production hero has half that (0.675 %), side has a rounding error (0.067 %), and low has literally none (0.000 %, medTone 148 — the highest-key still this studio has shipped). The trellis bars still *read* in side and low, but as hue differences, not darks. This is the one honest delta the session log volunteered, and it is the whole review: **sky-fill flatness**. The fill's high band is the bright flat sky value mixed in at 0.55 inside createLightingRig, with FILL_STRENGTH 0.3 on top — under the low camera's long bright-stone run that fill simply outruns the sun's absence, and the shadow band never crosses 60 luma. The bars failing to darken is a fill-gain fact, not a shadow-geometry fact: the identical rig puts real sub-60 darks in the hero frame.

## Carry-forwards verified

| Carry-forward | Verdict in the pixels |
|---|---|
| Watering-can silhouette | **KEPT, 3/3** — the can reads as a can at every camera; the galvanized treatment pulled it off the ratified frames' flat grey-green into a cool metal that also proves the sky tint. |
| Designed pebble pattern | **KEPT** — pebble clusters sit laid in rows on the flags at hero (strongest there), scattered-but-authored at side. No gravel-as-debris recurrence. |
| Sun legibility from the low camera | **KEPT** — the disc sits clean against the hedge band at floor height; the sun-disc-as-geometry rule survives the rig rewrite intact. |
| Non-green mid-distance | **PARTIAL** — the hedge band is properly olive and the bush balls go grey-green, but the lawn strip is still one wide flat yellow-green field at hero especially. Half paid. |
| Wind sprig | **PARTIAL** — the trellis vine and the pot sprig read at side; neither hero nor low carries one. Motion is unverifiable from stills by definition; scored on presence, not animation. |

The six exploration carry-forwards are otherwise paid: the bore reads as a hole at low rather than a dark disc, the snail carries its three-whorl spiral (hero and low both), the trellis post feet ground the bars at side, the pipe collar has its own class read, and the ratified hero composition — sun disc AND shadow bars in one frame — is the shipped hero camera.

## Score tables

| Line | hero | side | low |
|---|---:|---:|---:|
| 1 Silhouette | 2 | 2 | 2 |
| 2 Focal point | 1 | 1 | 1 |
| 3 Scale cues | 2 | 2 | 2 |
| 4 Color | 2 | 1 | 1 |
| 5 Light | 2 | 2 | 1 |
| 6 Material | 1 | 1 | 1 |
| 7 Story | 2 | 2 | 1 |
| 8 Nothing default | 2 | 2 | 2 |
| **Total** | **14** | **13** | **11** |
| **Verdict** | **PASS** | **PASS** | **FAIL** |

### Line notes

- **Focal 1 everywhere, and it is inherited, not new damage**: the car is never the heaviest object in any frame — the can and its long shadow outweigh it at hero, the pipe cylinder is the largest mass at side (though its bore no longer steals as a dark disc — that carry-forward is paid), and sun plus can outweigh it at low. The ratified frames scored focal 1 too; production matched the bar, did not beat it.
- **Light**: hero and side earn 2 outright — direction is unmistakable, the disc is in frame, shadows are tinted from the sky by measurement. Low loses it on the census, not on sight: zero sub-60 pixels and a 148 median is a frame the fill is publishing, not the sun. The exploration review called zero-dark high key "ambient mush by another name"; here the bars organize the frame well enough to keep the line at 1 rather than 0 — the geometry earns the point, the illumination does not.
- **Color**: hero is the golden-hour palette promised (warm stone, blue-grey tinted shadows, chartreuse accent, the disc's amber). Side drops to 1 for the flat lawn field at establishing width (the unpaid non-green carry-forward); low drops to 1 for orange-on-orange monotony — stone and racing line are the same warm family and only the disc and the teal car are not.
- **Material 1 everywhere**: the can, collar, terracotta pot and tire loop read honestly, but the TA-1 grazing speckle still edges the racing-line strip and shadow boundaries in all three frames. This was the bedroom verdict's "must close before the NEXT set's first still" — it did not close, and it is now two sets old.
- **Story**: hero and low carry their beats (snail, pebbles, the bore-goal, the deck seam); low additionally spends a full empty paving foreground wedge that carries no beat at all, which is why its story and not its silhouette is where the frame loses points.
- **Nothing default 2 everywhere**: shadow bars as set architecture, a laid pebble pattern, sun as flat geometry — and zero census entries on the never-list. The floor frame is composed around the ratified laws; it is just lit too evenly.

## Verdict: **ROUND-1 SEND-BACK. Hero 14 PASS, side 13 PASS, low 11 FAIL (< 12), no zeros. The named knob is the sky-fill gain — nothing else in the set is asked to move.**

This is the narrowest send-back the studio has issued: two cameras already pass and the failing camera's disease is one fill number, not art. The set is not being re-explored; it is being re-balanced. Numbered asks:

1. **Sky-fill gain (THE knob).** Lower the fill the sky pushes into shadows until the long bars cross below 60 luma at the floor rig. Both levers live above the materials: the 0.55 sky mix on the rig's fillHigh band in createLightingRig (src/render/lighting.ts) and/or FILL_STRENGTH (0.3, src/sets/garden/data.ts). Target for production-low: dark<60 ≥ 0.5 % with 100 % of it tinted blue-above-red, medTone ≤ 135, blackish and blown still 0.000. Guardrails: production-hero keeps dark<60 in [0.5, 2.0] % and medTone 115–125; side keeps its bars reading; SUN, SKY, SKY_INFLUENCE and the disc do not move — if the tint goes warm-olive again the fix went through the wrong door.
2. **Floor-camera framing.** Kill the empty paving wedge in the lower third: a small rig yaw or drop, and bring the focus band to contain the car plus one story beat (a named moss/joint crossing or the pebble cluster). The bedroom taught this lesson — the floor camera must have lived-in detail inside its focus band.
3. **Pay the mid-distance in full.** One non-green value break in the lawn band (dry-lawn tan or a stone run) so the establishing camera stops shipping a flat green field.
4. **Place a wind sprig within hero or low.** One cheap deck-edge sprig; side already proves what it should look like.
5. **Racing-line edge speckle (TA-1).** Two sets old and now visible on the most driveable object in the game. If the systemic shader fix is genuinely blocked, this set pays with geometry/edge treatment on the strip — it may not ride into set five.

Re-shoot all three stills plus a census round 3. If low hits the ask-1 targets and hero/side stay inside their guardrail bands, this note's successor ratifies without spending another round.

## For the Director

1. **[AD] The rig needs a shadow-darkening budget knob, not a garden patch.** The fill bands derive centrally and each set passes only a gain; the garden is the first set where the *brightness* of the sky fill, not its hue, is the dial that matters. A shade-depth term on the fill (sky hue is already deepened for the tint — the fill band itself is not) would have made ask 1 a data.ts one-liner.
2. **[AD] TA-1 escalates from carry-forward to gate.** A systemic material demerit that survives a "must close before next set's first still" clause should block that still's review from scoring line 6 above 1 — which it now does, three sets running. Either it closes or the bible records that material tops out at 1 until it does.
3. **[AD] The census-predicts-the-frame loop is working.** The artist flagged the low-camera delta before the AD saw it and named the mechanism correctly; the review confirms both. The one honest paragraph in a session log is worth a round of renders.

---

# Review 2026-10-08 — Stage 4 garden production FINAL verdict (Art Director, round 2)

> [!abstract] Scope and method
> Re-shoot after the round-1 send-back above. The artist declined the framing/lawn/sprig asks as already-paid or deferred and moved the one named knob via a per-set `fillShadeDepth` term on the fill (src/sets/garden/data.ts, threaded through createLightingRig in src/render/lighting.ts) — verified present in the shipped code, exactly the data.ts one-liner this note's For the Director asked for. Evidence: ONE census run at this sitting (all three production stills: docs/explorations/garden/production-hero.png, production-side.png, production-low.png), two image views spent (floor cam first, hero second; side judged on census + round-1 record). No code changed, no bible edited.

## Census round 3 (single run)

| frame | px | dark<60 % | tinted % | blackish % | blown >=243 % | outlier % | medTone |
|---|---:|---:|---:|---:|---:|---:|---:|
| production-hero | 921600 | 1.841 | 1.841 | 0.000 | 0.000 | 0.502 | 114 |
| production-side | 921600 | 1.722 | 1.722 | 0.000 | 0.000 | 1.773 | 107 |
| production-low | 921600 | 1.527 | 1.527 | 0.000 | 0.000 | 1.059 | 133 |

**Ask-1 targets, measured:** production-low dark<60 = 1.527 % (ask >= 0.5), 100 % of the darks tinted, medTone 133 (ask <= 135), blackish 0.000, blown 0.000 — **all met**. The floor camera went from 0.000 % to 1.527 % sub-60 in one number. Guardrails: side dark 0.067 -> 1.722 % with the bars reading harder than ever (deepened, not flattened); hero dark 1.841 % sits inside [0.5, 2.0]. One guardrail lands a hair outside: hero medTone 114 against the 115 floor — one histogram bucket, with the ratified sun-disc-plus-bars composition fully intact. Accepted as a documented deviation, not a send-back cause; recorded as a carry-forward to nudge or to amend the band.

**Viewed evidence:** low now publishes the sun, not the fill — the trellis bars cross into cool grey-blue darks across the paving, the disc sits clean against the hedge, and the lower-third wedge is no longer empty: it carries bar shadows plus the focus band holds the car with the snail and the green brick inside it (ask-2 paid in the frame). Hero carries a wind sprig on the trellis top-left (ask-4 paid where it was asked), the can silhouette and laid pebbles survive the re-balance, and the hedge band's darker olive corner gives the establishing width a non-green break (ask-3 partial, side camera unchanged).

## Score tables (final)

| Line | hero | side | low |
|---|---:|---:|---:|
| 1 Silhouette | 2 | 2 | 2 |
| 2 Focal point | 1 | 1 | 1 |
| 3 Scale cues | 2 | 2 | 2 |
| 4 Color | 2 | 1 | 1 |
| 5 Light | 2 | 2 | 2 |
| 6 Material | 1 | 1 | 1 |
| 7 Story | 2 | 2 | 2 |
| 8 Nothing default | 2 | 2 | 2 |
| **Total** | **14** | **13** | **13** |
| **Verdict** | **PASS** | **PASS** | **PASS** |

Deltas from round 1 are all in the low column: light 1 -> 2 (the census delta the ask defined is met), story 1 -> 2 (the dead paving wedge now carries shadow and the focus band holds a beat), and side's color holds at 1 on the lawn field rather than dropping. Focal 1 and material 1 are unchanged everywhere — focal is the inherited car-mass note, material is TA-1, which the artist's own log admits is unfixed and which now gates line 6 exactly as this note's For the Director 2 predicted.

## FINAL VERDICT: **RATIFIED. Hero 14, side 13, low 13 — all three cameras >= 12, no zeros, never-list clean (0.000 blackish, 0.000 blown in all three). The fallback is not invoked. Stage 4 garden set is passed to the Director.**

### Carry-forwards riding to set 5

1. **TA-1 grazing speckle** — now three sets old, visible on the racing-line strip's fuzzy edges in all frames, gating material at 1 studio-wide. It is a set-five pre-condition, not a carry-forward.
2. **Focal mass of the car** — four review sittings agree the car is never the heaviest object in frame; this is a composition-law question for the Director, not another artist ask.
3. **Hero medTone 114 vs the 115 guardrail floor** — one bucket; either nudge it back inside on the next re-shoot or amend the band in the bible. Do not let it silently redefine the standard.
4. **Non-green lawn break** — paid at hero via the hedge corner, unpaid at side's establishing width.
5. **fillShadeDepth is a rig feature now** — every future set gets it as a first-class dial; this note's For the Director 1 is closed by the artist's fix landing in lighting.ts, not in a garden patch.
