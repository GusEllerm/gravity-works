---
livedocs: snapshot
tags: [session]
---
# 2026-10-03 Stage 1 — car designer: car look variants

## Goal

Three distinct car looks for the Stage 1 exploration (brief §4.3: the car starts as three variants
at the canonical cameras), all plausible 1:64 procedural toy track cars, each on a short orange
`trackChannel` segment over a neutral warm floor so scale reads. One purpose per variant:

- **car-a "sedan blocky"** — prove the chunky beveled-toy idiom carries a whole car at thumbnail size: fat `toyBlock` body and raked cabin, roof-rack cross bars, thick wheels riding outside the flanks.
- **car-b "streamliner"** — prove one continuous turned form can read as a car: a single lathe teardrop (blunt quarter-ellipse nose, needle tail), flat-cut underside, tucked wheels, a phi-limited lathe shell as the speedster stripe.
- **car-c "haulback"** — the tall hatch/wagon silhouette carrying the studio's "one small surprising detail" rule: a tiny cast roof ladder nobody needs.

## What was done

- `src/dev/scenes/cars.ts` registers `car-a` / `car-b` / `car-c` via the auto-discovered scene
  registry; each scene is one key light + two-band token fill + painted-wood floor (same light
  contract as `scenes/material-ramp.ts`), a 0.42 m track segment, the car seated in the channel,
  and three toast crumbs for the "someone lives here" rubric line.
- Materials are the existing classes unchanged: `dieCastPaint` bodies and stripes, `fabric` tyres
  with cream cast hubs, `glass` greenhouse band and canopy, `trackPlastic` track, `paintedWood`
  floor. Stripes are thin proud geometry — a flank band (A, C) or a 0.5 mm-offset raised lathe
  shell (B) — never decals.
- **Palette** (colorblind-safe, none in the track's hue family): the three Okabe–Ito seeds pushed
  through the `tokens.ts` `shiftHex` machinery — blue (A), bluish green (B), reddish purple (C).
  Stripes are one warm cream `#EFDCB8`; tyres dark warm brown, never black.
- Renders committed at 1600×900 DPR 1 via `npm run render` (port 4194):
  `docs/explorations/cars/hero-a.png`, `floor-a.png`, `hero-b.png`, `floor-b.png`, `hero-c.png`, `floor-c.png`.
- `npm run typecheck` and `npm test` green; renders verified visually and iterated twice
  (stripe bands re-proportioned, streamliner profile made directional, stripe shell fixed — below).

## Rubric self-scores (0–2 per line; 16 max)

| line | hero-a | floor-a | hero-b | floor-b | hero-c | floor-c |
|---|---|---|---|---|---|---|
| 1 silhouette | 2 | 2 | 1 | 2 | 2 | 2 |
| 2 focal point | 2 | 2 | 2 | 2 | 2 | 2 |
| 3 scale cues | 1 | 2 | 1 | 2 | 1 | 2 |
| 4 color | 2 | 2 | 2 | 2 | 2 | 2 |
| 5 light | 2 | 1 | 2 | 1 | 2 | 1 |
| 6 material | 2 | 2 | 2 | 2 | 2 | 2 |
| 7 story | 1 | 1 | 1 | 1 | 1 | 1 |
| 8 nothing default | 2 | 2 | 2 | 2 | 2 | 2 |
| **total** | **14** | **14** | **13** | **14** | **14** | **14** |

Notes on the sub-2s: no tilt-shift post exists yet, so scale leans on the track walls and crumbs
(line 3); at floor height the car sits inside the channel walls and its own cast shadow hides the
wheel line (line 5, worst in `floor-b`); the crumbs are the only lived-in cue (line 7).
`hero-b`'s silhouette lost a point before the nose/tail rework and one still goes to the low
camera where the teardrop foreshortens into a blob.

## Recommendation

**Carry car-a forward as the reference silhouette** — it is the only variant that names its type
at 200 px in both cameras, and its chunky-bevel idiom is exactly the bible's "chunky over
detailed"; the roof rack is the affordable one-detail on it. Take two things from the losers into
the winner: the **ladder rule** from car-c (every trim level gets one small absurd cast detail)
and the **lathe stripe trick** from car-b (stripes as raised geometry falls out of a turned body
for free). Car-b is the weakest base — its silhouette is a blob at hero distance and its wheels
nearly vanish in the channel — but it is the natural evolution for a later speed set. Car-c is a
strong second for a utility/wagon character car, not the hero.

## Decisions (for the Director's Decision Log, tagged [car designer])

1. **Car hues = Okabe–Ito seeds through `shiftHex`** (blue `#0072B2`→, green `#009E73`→, reddish
   purple `#CC79A7`→), not red/yellow/green. Alt: high-chroma reds and yellows. Reason: must stay
   distinguishable for colorblind players *and* off the orange track's hue family; red and yellow
   both collide with orange under protanopia/deuteranopia.
2. **Stripes are geometry** (proud bands / raised shells), not textures — keeps "no image
   textures" trivially true and lets a stripe catch the toon spec.
3. **Wheels are the `fabric` class** with die-cast hubs. Alt: `trackPlastic`. Reason: matte, no
   specular, strong rim reads as rubber at this scale; the toy classes have no dedicated rubber.

## Gotchas learned

- `LatheGeometry` starts `phi` at **+z** (`x = r·sin φ`), so after tilting the spin axis onto x the
  crown of the turned form sits at φ = 3π/2 — a phi-limited "top stripe" aimed at φ = π lands on
  the far flank (silent failure: it renders, invisibly).
- A phi-limited lathe **shell** is one-sided: needs `side = DoubleSide` like `bowlForm`, or
  front-face culling deletes the stripe.
- A stripe *band* wider than the body + shorter than its straight flank reads as a floating
  skateboard deck at floor height — keep bands ≤1 mm proud and inside the straight section.
- A lathe body with a flat-clamped underside makes any end taper below the floor line into a
  plank; the quarter-ellipse nose / needle-tail split keeps direction readable anyway.

## Next

- Art Director scores the six renders; winner's silhouette numbers move into the Art Bible's
  "Car look" reference slot; the ladder rule and lathe stripe ride along if car-a wins.
- When the tilt-shift post pass lands, re-render the floor shots — the scale line should move 1→2.
