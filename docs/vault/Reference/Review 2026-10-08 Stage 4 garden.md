---
tags: [reference, review]
livedocs: snapshot
---
# Review 2026-10-08 — Stage 4 garden explorations (Art Director)

> [!abstract] Scope and method
Six committed renders (docs/explorations/garden/ — hero-a/b/c, close-a/b/c, 1280×720, tilt-shift post on) for the studio's first outdoor set. The question the concept puts is the light regime, so the battery is weighted toward light: full-frame luminance histograms via tools/histogram.mjs, a per-pixel dark-tint audit (sub-60 count, blackish = channel-spread < 10, min spread, average luma-band 40–90 RGB), a top-band sky-flatness probe (per-row luma means, top 12 % of frame), and 200 px downscales for the silhouette line. hero-a, hero-b, hero-c and close-b were viewed at full size; close-a and close-c are scored conservatively from evidence plus the artist's own demerits, and those two rows say so. Rubric per Concepts/Art Bible §The rubric: eight lines, 0–2, pass = 12/16, any zero is an auto-fail. No code changed, no bible edited.

## Histogram + tint evidence

| frame | mean | p5 | p95 | ≥243 % | <60 % (count) | blackish | min spread | shade RGB (40–90) | sky rows top→bot |
|---|---:|---:|---:|---:|---|---:|---:|---|---|
| hero-a | 178.4 | 124 | 214 | 0.17 | 0 % (0) | 0 | – | 133,70,0 | 207→156 (content) |
| close-a | 187.3 | 127 | 227 | 0.45 | 0 % (0) | 0 | – | 116,70,35 | flat (sd 3.2) |
| hero-b | 139.8 | 88 | 202 | 0.00 | 1.33 % (12,213) | 0 | 38 | 86,80,20 | 180→118 (hedge) |
| close-b | 155.2 | 90 | 218 | 0.00 | 2.44 % (22,441) | 0 | 36 | 98,85,23 | flat (sd 3.9) |
| hero-c | 124.6 | 87 | 203 | 0.13 | 0.09 % (827) | 0 | 27 | 97,81,59 | 189→147 (content) |
| close-c | 145.9 | 77 | 217 | 0.22 | 0.16 % (1,514) | 0 | 29 | 90,74,53 | flat (sd 5.3) |

- **Never list holds in all six**: zero blackish pixels everywhere; the darkest darks carry channel spreads of 27–38. No blown-high problem (nothing above 0.45 % ≥243) — the stage-3 wash disease did not follow the garden out the door.
- **A has no shadow budget at all**: 0 sub-60 pixels in both frames, p5 124/127. The whole variant floats in high key. Not a never-list violation (the darks that exist are tinted olive), but a bright outdoor set that never earns a dark is ambient mush by another name.
- **B's violet-shadow claim is not in the pixels.** The concept says B's long shadows "die toward violet" because shade is sky-lit. The measured 40–90 luma band is 86,80,20 / 98,85,23 — warm grey-olive, blue lowest, i.e. tinted toward the dominant, not toward the sky. The shadows are convincingly tinted and never black, so the rubric line passes, but the *mechanism the concept names is the one the bible should adopt, and B only demonstrates the old indoor rule.* Flag for production below.
- **Sky is flat everywhere it is just sky** (close frames sd 3–5); the hero-frame row gradients are hedge and prop content encroaching on the probe band, not gradient skies. No lens flare, no bloom. The flat-sky law holds outdoors.

## The light-regime question, answered by name

- **Sun direction legible?** B: emphatically yes — this is the studio's first backlit set and it works; shadow bars run the full depth of the patio toward the viewer, the sun disc sits on the hedge line inside the frame, and every form is explained by where its shadow goes. A: direction is *named* but quiet — short crisp shadows at ~32° do outline the can and gnome, but with zero darks they carry no weight; the frame says "noon" and nothing else. C: no — the direction survives only as a gradient of softness, exactly as the artist demurred; overcast as built here cannot carry line 5 above 1.
- **Shadows tinted not black?** Yes in all six by measurement, with the caveat above: only A and C's tints derive from their dominant, and B's claimed sky-derived tint is unmeasured-in-evidence. The outdoor tint rule is a *proposal the renders argue for but do not yet demonstrate*.
- **Sky presence without stealing the diorama?** B wins this cleanly: a flat pale sky band plus one chunky 4° sun disc gives more "outside" than any gradient could, and the tilt-shift band keeps the whole thing toy. A's sky is a competent blank; C's silver band is weather-correct but the flattest of the three.
- **Sun-disc verdict (bible flag):** keep it, with the rule the concept drafted: only a sun low enough to sit inside the canonical frame may be drawn as geometry — flat unlit disc, never-list clean, no flare. B proves the rule by being the best frames in the stage.

## Score tables

### Garden (docs/explorations/garden/)

| Line | hero-a | close-a | hero-b | close-b | hero-c | close-c |
|---|---:|---:|---:|---:|---:|---:|
| 1 Silhouette | 1 | 1* | 2 | 2 | 2 | 1* |
| 2 Focal point | 1 | 1* | 1 | 1 | 1 | 1* |
| 3 Scale cues | 2 | 2 | 2 | 2 | 2 | 2 |
| 4 Color | 2 | 2 | 2 | 2 | 1 | 1* |
| 5 Light | 1 | 1* | 2 | 2 | 1 | 1* |
| 6 Material | 1 | 1* | 1 | 1 | 1 | 1* |
| 7 Story | 1 | 1* | 1 | 1 | 1 | 1* |
| 8 Nothing default | 1 | 1* | 2 | 2 | 1 | 1* |
| **Total** | **10** | **10** | **13** | **13** | **10** | **9** |
| **Verdict** | FAIL | FAIL | **PASS** | **PASS** | FAIL | FAIL |

\* close-a and close-c were not viewed at full size (view budget); their rows are scored from histograms, the tint/sky audit, 200 px downscales, and the artist's volunteered demerits, and sit one notch under anything the evidence cannot confirm — where a line is uncertain I assumed the concept's own stated weakness (gravel-as-debris at floor blur, gnomes-as-hats at floor distance, the sun-facing culvert bore) rather than giving benefit of the doubt.

### Line notes (viewed frames)

- **A hero**: the gnome-on-plinth is a traffic cone with a burnt tip — the artist's own harshest demerit is true in the pixels. The gravel crossings read as scattered leaf litter, not a laid path, and the pots fall off the right edge. The mown stripes, the drips on the racing line, and the marble are genuinely good; the frame is 40 % lit lawn with no darks to organize it.
- **B hero/close**: the trellis shadow bars are the best single idea in the stage — a hazard-free rhythm the player reads instantly, and proof that shadows can be set architecture. The drain-pipe bore is the focal thief in both frames (a high-contrast dark disc outweighing the car), and the snail is a pink bead, not yet the slow motorist. The trellis lattice reads as floating planks in the upper left until you find its bars on the ground — the shadow does most of its grounding work. Materials are honest but the watering can sits as flat grey-green that flirts with the plastic-grey clause, and the pipe collar reads undifferentiated plastic.
- **C hero**: the gnome parade is the most *fun* frame in the stage and the hats survive the 200 px test, but the parade out-stages the car (three gnomes within a hand-width of the racing line), the mulch dominant is the steadiest drift toward muted this studio has shipped, and the overcast light cannot explain a single form. C's asked-for mechanic (ramps) needs a track-system decision the set cannot make for it.

## Verdict: **variant B (paving slabs at golden hour) is nominated, 13/13, both cameras pass, no zeros. No send-back spent.**

B is chosen not only on score: it is the only tile that *answers the brief's actual question* — an outdoor light regime that stays a diorama. It is also, per the concept, the cheapest build (one flat ground, one low key, no displacement), and it is the only variant whose track asks are free (pipe tunnel goal line, joint rhythm strips, shadow bars as read-only rhythm). A cannot be rescued below its zero-dark budget without becoming B's lighting; C is a photograph until the track system gains an elevation profile, and its mechanic should be re-homed like bedroom C's springs were.

**Carry-forwards with the production set (no round):**

1. **Focal discipline at the pipe mouth** — the bore disc outweighs the car in both B frames; angle the mouth further off-axis or shrink the rim contrast so the eye lands on the focus band first.
2. **Snail** — blob to character: a visible shell spiral, or lose it and keep the moss plugs as the deck's life.
3. **Moss plugs / joint accent** — claimed in the concept, invisible in the frames; author the joints with the chartreuse-moss accent at a size the hero camera can resolve.
4. **Watering can + pipe collar materials** — pull the can off flat grey-green (galvanized treatment with a ramp band, or the die-cast class), give the pipe collar its own class read.
5. **Trellis grounding** — one visible post foot or the bars read as floating.
6. **Garden cameras** — none of these are set rigs; the production set must ship establishing/hero/floor for the garden, and the hero should be the one framing the sun disc *and* the shadow bars together (both exist in hero-b; make that the ratified camera).

## For the Director

1. **[AD] Garden ratified-pending-production: variant B (13/13).** The token garden palette (magenta dusk / chartreuse firefly) loses its premise: B keeps chartreuse as its accent and needs no dusk. Recommend the tokens seed move to golden-hour stone + chartreuse for garden unless the studio explicitly wants an evening garden — that is a palette-file decision, not a pixels one.
2. **[AD] Bible §Light amendment, two sentences, endorsed by these renders:** outdoors the single key IS the sun, and a sun disc may be drawn only when low enough to sit inside the canonical frame (flat geometry, never-list clean — B is the proof frame). And: **outdoor shadow tint derives from the sky value, not the set dominant.** The second one is the rule B argues for rhetorically but contradicts in its own pixels (measured warm olive, not violet) — the production set must implement the sky-derived tint so the next histogram says so.
3. **[AD] Stone class:** the bible's seven classes cannot honestly host paving, pebbles, flags and culverts; widen ceramic to "ceramic/stone (specular near zero, saturation pre-cut)" rather than mint an eighth class — that is what these renders already do.
4. **[AD] Canonical Cameras: add the floor-rig set-design law the concept discovered** — the floor camera lives 35 mm off the ground, so every driveable surface must sit within a few millimetres of y = 0; raised patios are banned by geometry, not taste.
5. **[AD] Re-homed mechanics:** C's ramps join the Track Kit backlog (elevation profile) exactly as bedroom C's springs joined the level geometry; A's sprinkler pop-up gate is a good timed hazard for any garden build and costs one vertical tween — port it into B.
6. **[AD] Honest-demerit calibration holds again:** every one of the artist's six volunteered demerits that I could check in evidence (A's emptiness, the cone-gnome, gravel-as-debris, C's line-5 loss, the sun-facing bore rule) measured true. The garden concept is the most accurate self-report the studio has produced.
