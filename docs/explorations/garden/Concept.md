---
tags: [exploration, stage4]
---
# Garden — stage-4 set exploration (A/B/C)

> [!abstract] Role
> Throwaway concept renders by the Environment Artist, scenes `garden-a`, `garden-b`, `garden-c` in
> `src/dev/scenes/garden.ts`, captured at 1280×720 through the canonical `hero` and `floor` rigs with
> tilt-shift post ON (node tools/render.mjs, param post=on, size=1280x720). Kitchen conventions kept: the
> seven material classes and the three-step ramp, one key with a two-band fill, flat non-gradient
> backdrop, orange track never re-hued, the ratified car trim at 46 mm. Kitchen, bathroom and bedroom
> palettes deliberately not reused — and the garden's own token seed is treated as a hypothesis, not an
> order (see Open for the AD). This is the studio's first OUTDOOR set, so what is being tested is the
> light regime, not the furniture: a SUN and a SKY instead of a window and a wall.

Same five giant props in all three — watering can, trellis panel, drain pipe, gnome, pebble path — each
doing a different job, so the comparison is about ground, light and palette rather than prop inventory.
No birdbath bowl turn anywhere: the bowl-with-a-car-parked-in-it is the ratified kitchen hero
(Reference/Review 2026-10-04 Stage 1 explorations.md) and repeating it would spend the garden's one
signature on the kitchen's.

## A — lawn under a high sun (hero-a, close-a)

**Material story:** grass. `fabric` with the toy treatment plus low-frequency grain for the mown sward,
instanced blades (8 mm — a taller blade is a wheat field at this scale and swallows the car) kept out of
the deck corridor, and mown stripes only in the mowable middle of the set: stripes at 9 cm pitch running
to the horizon moiré into zebra banding under a 35 mm-high camera. Pebble crossing = the `ceramic`/stone
class at 3 mm, read as gravel rather than boulders.
**Scale joke:** the watering can is an ARCH — its spout reaches 14 cm over the deck, four times the car's
height, and the rose drips on the racing line; the gnome is a statue on a plinth nobody polishes; a glass
marble in the sward is the child who was here.
**Light:** sun at ~32°, near-white key, shadow radius 0.4 — short crisp-edged shadows that name every
prop's footprint. No sun disc: at the canonical floor camera a high sun is far outside the 35° frame, so a
noon garden carries its sun in the SHADOW EDGE. That is a finding, not an omission.
**What a track WANTS here:** the sprinkler. A pop-up head one hand-width off the line, frozen mid-pop, is a
timing gate the player can see and a hazard that is pure vertical motion in a set of straights. Also: the
gravel crossing as a visible grip change (loose stone either side of the deck), and the can's arch as a
gate whose drips mark the beat.

## B — paving slabs at golden hour (hero-b, close-b)

**Material story:** paving. Slabs as the `ceramic` class with the specular turned off and the saturation
pre-cut (stone is not one of the seven classes — flagged below); sand bed and 11 mm joints; moss plugs in
the joints as the ground's own accent and a grip patch. The slab lies FLUSH with the lawn, 6 mm proud: a
raised patio puts the floor camera inside the floor — the canonical floor rig lives 35 mm off the ground,
which is a hard constraint on set geometry nobody had written down.
**Scale joke:** the trellis is a palisade that throws bars as long as the patio is wide; the drain pipe is
the tunnel the straight ends in, lying beyond the deck end with its mouth facing back up-track so the sun
never enters the bore and the hole reads as a hole; the snail is a slow motorist in the middle of the deck.
**Light:** sun at ~10° from frame left, amber key, the disc IN shot just above the hedge — the only sun a
floor camera can photograph. Shadows run toward the viewer. This is the studio's first backlit set.
**Palette:** rose-gold dominant, deliberately not kitchen's butter gold, with the token garden chartreuse
kept as the accent (vine, hose). Shadows die toward violet rather than toward the dominant hue, because
outdoors the shade is sky-lit — the deviation described under Bible flags.
**What a track WANTS here:** the drain-pipe tunnel as the goal line of every straight (and a real surface
change — stone to pipe interior is a sound and grip cut), the slab joints as rhythm strips the car ticks
over, the 6 mm patio curb as a step-up, and the trellis bars as rhythm the player READS but the car
ignores (a shadow must never be a hazard).

## C — mulch bed under overcast (hero-c, close-c)

**Material story:** mulch. A displaced bark bed (soft-body LOOK only, static plane plus 1100 instanced
flakes, same trick the bedroom duvet used) flattened under the track so the deck stays straight and
driveable, stepping stones as dry flags, mushrooms and a worm for the small life.
**Scale joke:** driving through a gnome parade — five gnomes march the stone path and the third one is
crooked; the drain pipe is a CULVERT lying in the bed, so the same prop that is B's goal line is here the
alternate line a braver line takes; the watering can has been left on its side, story finished.
**Light:** no sun disc and no honest shadow edge — a high weak key with a 6-texel radius and a strong
two-band fill. The direction survives only as a gradient of softness across the ground, which is the
weakest point of this tile and the price of the overcast brief.
**Palette:** dusty sage dominant, silver-green sky, and the token garden MAGENTA reduced to gnome hats and
mushroom caps — the only saturated thing in the frame, which is where the firefly seed survives.
**What a track WANTS here:** hill ramps. The bed banks up behind the track and a plank lies offered against
it, but the berm is a LOOK — a straight `trackChannel` cannot bend, so a real ramp needs the track system
to gain an elevation profile (Track Kit). This is the variant that should earn ramps as a level mechanic,
and the one that will cost the most to build.

## Bible flags (raised, not applied — no bible was edited here)

- **§Light has no sky and no sun.** Every sentence in it is about a key through a window. Outdoors the
  single key IS the sun, and the backdrop is a flat sky VALUE, not a wall. The never-list still holds —
  one flat color, no gradient, no lens flare — but the bible has no line licensing a sun as geometry.
  Variant B shows a chunky sun disc (4° across, unlit geometry, never-list clean) and it is the best
  frame in the set. If a sun disc is allowed, it belongs in the bible's §Light with a rule: only a sun low
  enough to sit inside the canonical frame may be drawn.
- **"Soft fill from the set's dominant hue" is an indoor rule.** Outdoors the fill is SKY, so shade is
  sky-lit: in these three scenes the sky-side band and the shadow tint are pulled toward the sky value
  (0.22–0.6), which is why B's long shadows read violet instead of rose. Outdoors, shadow tint should be
  derived from the sky, not the dominant — otherwise an outdoor set's shade goes the wrong colour and
  rubric line 8 (no uniform ambient, no untinted shadow) is satisfied by accident.
- **Stone is not a class.** Paving, pebbles, stepping stones and the pipe all want stone; the closest is
  `ceramic` with the specular near zero and the saturation pre-cut, which is what these renders use.
  Either widen the ceramic class to "ceramic/stone" or add an eighth class.
- **Canonical Cameras still has no garden rig**, and the floor camera sets a hard set-design rule: it
  lives 35 mm above the ground, so any driveable surface must be within a few millimetres of y = 0. A
  raised patio (tried and reverted here) makes the floor shot unreadable.

## Open for the AD

- **The token garden palette presumes dusk.** tokens.ts seeds garden as magenta dusk / chartreuse firefly
  and Concepts/Art Bible §Light says garden = dusk. Both were guesses made while every set was a room.
  Outdoors at midday the garden is green or stone or bark. B keeps the chartreuse as its accent and C
  wears the magenta as gnome-hat paint; A ignores both. If the dusk garden is real, none of these three is
  it and the set should be an evening garden with fireflies — a different exploration.
- C's sage dominant sits close to the unused garage seed; if garage keeps that olive, C's sage needs to
  move toward grey-green-blue or the two sets will read as one room in different weather.
- B is the strongest frame and the cheapest build (one flat ground, one low key, no displacement); A needs
  the instanced-blade budget checked by the Technical Artist; C needs a track-system decision before it
  can be anything but a photograph.
- None of these framings are set cameras. The garden's own rigs — especially a hero that shows the sun
  disc and the shadow bars together — should land with the production set.

## Honest demerits (for the AD's fresh eyes)

- A is the emptiest of the three: half the hero frame is lit lawn, the pots keep falling off the right
  edge, and the gnome statue reads as a traffic cone at hero distance (the plinth made it worse; removing
  it helped but did not fix it).
- The gravel crossings in A read as scattered debris rather than a laid path — density at 3 mm is not
  enough at floor-camera blur. Real gravel wants either a textureless denser flake field or a flagstone
  read.
- C's soft light loses rubric line 5: the shadows barely explain the forms. It is the honest overcast
  look, and it is the weakest of the six renders because of it.
- Prop silhouettes at floor distance are the recurring weakness of my sets (bedroom's demerits said the
  same): a gnome's beard only reads from the hero camera, and from the floor camera gnomes read as hats.
- The pipe's bore only reads dark when its mouth faces away from the key; in C the culvert's mouth faces
  the sun and the bore is lighter than it should be. Rule worth keeping: author tunnel mouths to face
  up-track and check them against the sun bearing, not the camera.
