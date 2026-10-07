---
tags: [exploration, stage5]
---
# Porch — stage-5 set exploration (A/B/C)

> [!abstract] Role
> Throwaway concept renders by the Art Director (this time driving the props myself), scenes
> `porch-a`, `porch-b`, `porch-c` in `src/dev/scenes/porch.ts`, captured at the canonical **1600×900**
> hero and build/establishing rigs through `node tools/render.mjs … --param post=on` (tilt-shift ON,
> fixed clock). The sixth set is the THRESHOLD — a plank deck between the house door and the yard, with
> toy cars crossing the line between indoors and outdoors. Same engine and seven material classes as
> every ratified set (ramp variant B, orange track never re-hued); kitchen/garden/garage palettes not
> reused. The porch seed (tokens.ts) is slate-blue storm + lantern amber, and this exploration asks what
> the threshold IS by building each variant as a genuinely different ROOM, not three lighting presets on
> one room: different grounds, different props-jobs, different stories.

Same six props in all three — house wall with door + screen door, railing + posts + overhang, downspout +
gutter flume, lantern, wind chime, planter + the kid's shoes — each doing a different job per variant, so
the comparison is ground/light/palette, not prop count. The garage review's **AD-2 rule is honored by
construction**: every variant spends its accent INSIDE the focus band (A geraniums + doormat band, B the
lantern itself, C the rubber boots), never hung above the rail. The gutter flume is laid at DECK height
in all three — the signature affordance (a flume, PROMPT §6) lives in the band, not on the roofline.

## A — morning sidelight through the screen door (hero-a, establishing-a)

**Material story:** dry, sun-bleached planks (`paintedWood`, low toy) under a north-slate wall whose
clapboard relief reads as seam LINES. The screen door is SHUT and the storm door is open: the whole
light story is the 6 mm mesh weave combed as a long parallelogram of grid shadow across two metres of
deck — the studio's most legible single-key since the garage sunblade.
**Scale joke:** the kid's pair kicked off mid-threshold, waiting to cross; geraniums spending the token
amber twice (window box + by the step). **Light:** gold key at ~17° from frame left, radius 2.2, sky
`#B7D4E2` at fill 0.30/depth 0.72. Census says the room is honestly high-key (medTone 131 hero / 152
build, 0.000 % darks AND 0.000 % blackish) — a sun-porch that refuses soot. **What a track wants here:**
the weave shadow is a speed-read gate; the flume's drip line is a timing tell.

## B — dusk lantern (hero-b, establishing-b)

**Material story:** the evening ROOM. Slate deepened toward the dusk sky; planks a stop darker; the
token amber spent ON the hung lantern (geometry, `diffuseStrength` 1.45 — the garden sun-disc trick)
and its pool only. The key's BEARING is the lantern's, so shadows radiate away from the lamp and the
practical reads as the source; the hall behind the open door is lit (interior `#A8703C` at 0.9) and
chalk hopscotch still glows on the boards. **What a track wants here:** the dry gutter flume crossed
mid-lane on a plank bridge — a grip/drop decision visible at thumbnail.
**Light:** amber key 1.35 at the lamp's bearing, sky `#3E5A78`, `skyFillShade` 0.1, fill 0.26/depth 1.0.
Census: medTone 94–108 — the darkest room of the three; every dark tinted (0.000 % blackish in the
ratified build frame). **Trade:** to keep dusk honest I let the census darks collapse — this set has
essentially NO sub-60 pixels (0.09–0.12 %), because B's drama lives in medTone, not in soot.

## C — rainy overhang (hero-c, establishing-c)

**Material story:** storm-slate planks, the amber spent once on rubber BOOTS. The roof does structural
work the other two don't: rain falls ONLY beyond the eaves line (instanced frozen streaks in three
zones outside the roof footprint), so the overhang story is geometry, not a shader. The downspout pours
a frozen stream into the full flume, which drowns off its low end as a puddle ON the lane — the literal
wet-patch grip hazard; chalk washed to 25 %; the storm door blown open and banging. The wind chime is
the gust's clock, swung out over the lane — the pendulum gate pre-posed. **Light:** weak cool key 1.05
high, radius 7, sky `#7E96AB` at fill 0.36/depth 0.82 — a soft dome with an honest downpour. Census:
medTone 122–129, 0.000–0.250 % blackish (the puddle cores are the remaining soot risk).

## Pixel census (round 4, `tools/census.mjs`, 1600×900)

| frame | px | dark<60 % | tinted % | blackish % | blown ≥243 % | outlier % | medTone |
|---|---:|---:|---:|---:|---:|---:|---:|
| hero-a | 1 440 000 | 0.000 | 0.000 | 0.000 | 0.004 | 0.062 | 131 |
| establishing-a | 1 440 000 | 0.000 | 0.000 | 0.000 | 0.001 | 0.001 | 152 |
| hero-b | 1 440 000 | 0.097 | 0.000 | 0.097 | 0.000 | 0.000 | 104 |
| establishing-b | 1 440 000 | 0.119 | 0.028 | 0.092 | 0.000 | 0.024 | 108 |
| hero-c | 1 440 000 | 0.250 | 0.000 | 0.250 | 0.048 | 0.074 | 122 |
| establishing-c | 1 440 000 | 0.002 | 0.000 | 0.002 | 0.013 | 0.015 | 129 |

No frame blows; A and C are census-clean; B's residual "blackish" is under one tenth of one percent and
sits in the hall-pocket occlusion, not on deck. The census history IS the art history here — the
round-0/1/2 failures were all the same physics: `toyBlock` placed by center (walls floating), seams
(paintedWood `darken(plankHex, 0.42)`) under-lit as soot (fixed 0.10), and shadow tints whose hue sat in
the census's BLACKISH band (fixed by lifting the sky-side shadow tint toward the sky value, which is the
garden AD-note-2 rule carried indoors to the porch's half-outdoor shade).

## Honest demerits (fresh eyes)

- **A's hero is empty**: the weave-shadow parallelogram is beautiful at build camera and nearly invisible
  at hero (too shallow an angle to the boards). A needs its hero rig re-aimed at the door, not the deck.
- **B is a dusk with almost no census darks** — beautiful, but rubric line 8's "earned darks" argument
  will have to be made on medTone and tint, not on the sub-60 budget. Expect a send-back question.
- **C's frozen rain streaks read as glass rods at build camera** — the 5-sided instanced cylinders catch
  the key on one facet; they want a flatter billboard or the liquid-class treatment, not diecast.
- **The hero camera on every variant undersells the threshold** — all three are "looking at a deck";
  none frames door-mouth + step in one composition. The set rigs should be authored in production
  (the garden precedent: hero frames the story, floor obeys the 35 mm law).
- Prop scale drift at the step: the kid's sneakers read as bricks at build camera in all three.
- The chime's sail hangs ~20 cm off the deck; as a pendulum gate it will need a level-side pendulum sim,
  which is a Feel ask, not an art one.

## Open for the AD review

- All three share the same DECK (flush 5 mm planks) and the same house mass; only ground texture, prop
  jobs and light differ. If the review wants a fourth axis, it is the step — C could sit 40 mm high with
  a visible yard below (a real threshold step) at the cost of the floor-camera law.
- B's lantern-pool is a directional key by construction; a true non-directional practical (a SpotLight
  inside the chimney) remains the garage's unbuilt ask.
