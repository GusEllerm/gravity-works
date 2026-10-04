---
livedocs: snapshot
tags: [session]
---
# 2026-10-03 Stage 1 — kitchen style tile C (Technical Artist draft)

## Goal

Prove or break the thesis that the *system* — tokens, the seven material classes, the two-band fill,
the key-length shadow tinting and the shared generators — can carry the kitchen brief's row (gold /
breakfast; books-as-ramp; bowl off the track; a lived-in detail) with almost no artistry, and mark
exactly where it cannot. Deliberate contrast with the two Environment Artist tiles: no prop modeling,
no bespoke shapes beyond one primitive; composition, light and materials do all the work. What the
system cannot express is **left out and listed**, not hand-rolled around.

## What was built

`src/dev/scenes/kitchen-c.ts` registering `kitchen-c`, built 100% from `toyBlock`, `bowlForm`,
`trackChannel` and the seven classes in `materials.ts`, plus one bespoke primitive (a `TorusGeometry`
mug ring). A yawed world group puts one `trackChannel` run diagonally across all three canonical
frames; a three-book `toyBlock` stack with a fourth tilted as the ramp hands over to the track;
a large two-sided `bowlForm` in ceramic stands off the run as the oversized scale cue; a
die-cast/block car sits mid-track for the floor focus band; a mug-ring torus and two crumb blocks
carry the story line. One gold `keyLight` at a low angle for long tinted shadows; fill mixed toward
the mint accent with `mixHex` at scene level (the only way to get accent into the light — see gaps).
Fully deterministic: fixed clock, no time uniforms.

Renders (1600x900 DPR1): docs/explorations/kitchen/establishing-c.png, hero-c.png, floor-c.png —
all from the shared generators, via the standard render tool at the canonical cameras, port 4193.

## Material-system fix (for the Decision Log)

**Backface normals were never flipped in `ToonMaterial`'s fragment `main()`.** Three's own materials
flip via `normal_fragment_begin` (`gl_FrontFacing`) but the custom main did not, so every two-sided
lathe form — the cereal bowl, the set's *signature affordance* — shaded its inner wall with inverted
normals: stuck in the darkest ramp band with the fill gradient upside down. Visible in the stage-1
ramp renders as the grey-mud bowl interior (docs/explorations/materials/ramp-a.png). One-line fix
in `toon-material.ts`: `normal *= gl_FrontFacing ? 1.0 : -1.0` (equivalent in GLSL). Alt considered:
forcing `side: FrontSide` and modeling bowl walls as closed shells — rejected, the lathe double-sided
form is the cheap prop the sets need. Existing tests (token units, harness e2e) pass unchanged; the
fix is visible in every bowl render including the kitchen-c shots.

## System audit

Carries well, with near-zero artistry:

- **Tinted long shadows** — key-length recovery (`setKeyLight`) works as designed on a real
  composition: shadow fields read gold, never black, and at the breakfast sun angle they do most of
  the form-explaining the rubric asks of light.
- **Silhouette-first composition** — chunky beveled blocks + one lathe + one channel are instantly
  readable as book stack / ramp / bowl / track at thumbnail. The "three materials per set" budget
  was never close to breaking.
- **Class legibility** — die-cast car, ceramic bowl, track plastic, painted wood: no object reads as
  default plastic grey; the toy dip-paint treatment is what makes the block car read as a toy.
- **Two-band fill** — no ambient mush; shadowed faces keep modeling.

Cannot express yet (each left out of the tile rather than faked):

- **The tap, the drip, the wet patch, the toast.** The kitchen row's hazard and one story detail are
  geometry/feature gaps: no droplet or thin-film-on-plane generator, and no decal/stain material to
  put a wet patch (or any marking) *on* an existing surface — `liquid` needs its own mesh standing in
  the world. A future "grip hazard" needs a system feature, not a prop.
- **Tilt-shift** — the post stack does not exist, so the signature miniature cue is absent; the tile
  can only carry scale cues of the "oversized prop / low angle" kind. Rubric line 3 is capped at 1
  for any tile until a focus-band pass lands in `src/render`.
- **Grime as trace** — the mug ring can only be an object (a torus), so it reads as a hula hoop
  someone dropped, not as a ring a mug left. Needs a flat plane decal or a stain term.
- **Grain has no per-surface frequency** — `grainWave` consumes raw `vModelPos`, so on a 1.2 m disc
  the painted-wood class resolves into big low-frequency streaks, not grain. On small blocks it
  behaves. A `uGrainScale` (or object-space scale channel) is a two-line change with real payoff.
- **Accent cannot reach the light** — `fillHigh/fillLow` derive from dominant only, and the shader's
  fill gain is hardcoded (`* 0.25`). The mint half of the kitchen palette enters the lighting only
  through scene-side `mixHex` overrides that then get diluted by that gain. If the art bible means
  "soft fill from the set's hue" with accent visible, tokens or the gain should own it, not scenes.
- **Bowl-interior shading is still flat** — the backface fix makes the interior structurally correct,
  but an inward-facing parabola sits in one ramp band with near-constant upness; interior shading
  wants either a normal-driven band bias or per-class fill lift.
- **Shadow dither at grazing angles** — PCF + `radius` still speckles along the thin track-wall shadows;
  a 4k map with `radius 4` softens it at real cost. A budget conversation for stage 2.
- No shadow-color control distinct from `shadowTint` × fixed 0.4 — fine for kitchen, will bite the
  bedroom (nightlight) exploration.

## Rubric self-score (honest, 0–2)

1. Silhouette **2** — stack, ramp, bowl, diagonal run read at thumbnail in all three frames.
2. Focal point **1** — establishing/floor land on the car or the ramp; the hero frame should land on
   the bowl but lands near the ramp foot, the bowl sits peripheral.
3. Scale cues **1** — oversized bowl + low floor camera say miniature; no tilt-shift band exists.
4. Color **2** — gold dominant, mint accent (book + fill), orange constant, nothing fighting.
5. Light **2** — one direction, long tinted shadows explain every form.
6. Materials **1** — all class-legible, but the floor's grain reads as streaky wash and the bowl
   interior is flat banding.
7. Story **1** — ring + crumbs say breakfast in the establishing; the ring misreads as an object.
8. Nothing default **2** — no untinted shadow, no uniform ambient, flat token background, no
   stock-Three look.

Total **12/16, no zeros** — a bare pass, and it passes on the *system's* lines (1, 4, 5, 8), not on
artistry (2, 3, 6, 7 are exactly where a system-only tile is weak). That split is the point of tile C.

## Decisions made (tag: technical artist)

1. Tile built from shared generators only + one torus; tap/drip/toast omitted per the audit rule.
2. Mint fill mixed from tokens at scene level (`mixHex`) instead of editing `tokens.ts` — an
   exploration may not re-derive the production palette; recorded as a gap instead.
3. `grain` raised to 0.7 on the floor after 0.4 read as bare plastic; left in honestly-streaky state
   rather than adding a grain hack — the frequency gap is the finding.
4. Backface normal flip landed in `toon-material.ts` as the round's only render-code change (small,
   test-passing, fixes a rubric-line bug, visible in every bowl render); shadow dither left unfixed
pending the budget discussion.

## Next

- If tilt-shift lands in `src/render` before stage-1 review, re-render `kitchen-c` — line 3 is the
  cheapest point the system can win back.
- Grain scale + fill-gain uniforms: two-line candidates for the winner-tile integration round.
