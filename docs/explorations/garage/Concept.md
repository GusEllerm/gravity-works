---
tags: [exploration, stage4]
---
# Garage — stage-4 set exploration (A/B/C)

> [!abstract] Role
> Throwaway concept renders by the Environment Artist, scenes `garage-a`, `garage-b`, `garage-c` in
> `src/dev/scenes/garage.ts`, captured at 1280×720 through the canonical `hero` and `floor` rigs with
> tilt-shift post ON (node tools/render.mjs, params post=on, size=1280x720). Same engine, materials and
> toon ramp as the ratified kitchen (ramp variant B, three hard steps). The art bible's warning that the
> garage goes generic without real toys is answered structurally: all three variants share the same three
> anchors — concrete floor, one monumental workbench, one parked giant bicycle wheel — and the five real
> toys (oil stain, cardboard ramp, bucket tunnel, tool wall, hanging bulb) are the terrain. Kitchen and
> bathroom palette strategies deliberately NOT reused: the kitchen is one warm sun-key with the mint
> accent resting in shade, the bathroom variants hang accents on porcelain and bulbs; the garage seed is
> olive afternoon + red tool (tokens.ts), and the three variants vary MATERIAL STORY and LIGHT STORY —
> three concrete finishes, three lamps, three temperatures.

## A — sealed gloss, one hanging bulb (docs/explorations/garage/hero-a.png, close-a.png)

**Material story:** the token garage palette untouched. Sealed concrete — one big `ceramic` plane with a
broad hard glaze, control joints as the only relief, so the bulb's pool lies on the floor like spilled
butter. **Palette/light:** olive afternoon with the red tool accent spent once (toolbox + screwdriver
handle on the tool wall); the single key is a real `SpotLight` inside the bulb geometry, warm, cone
falling on the middle of the room so the workbench and wheel live in tinted olive shade — the bulb is
drama, not ambience, and the dust-free version of the art bible's one-lamp rule. **Scale joke:** the
parked bicycle wheel leans upper-right as a full moon; the hanging bulb is a chandelier for ants. **What
a track wants here:** the OIL STAIN sits dead-center in the bulb's pool, lit enough to read before it
bites — the slip-patch signature in the room's only spotlight — and the bucket lies down at the end of
the straight with a shaft behind it, the tunnel mouth the last shot frames.

## B — broom-finish concrete, flat-cold tubes (hero-b.png, close-b.png)

**Material story:** broom-finish — matte ceramic with wide squeegee arcs (flat ring geometry, not bump
maps) and instanced grit; every prop stays matte except the tires. **Palette/light:** the dominant lifted
toward dry putty-sage (cream-based, never grey) with the accent FLIPPED cool — shop-towel blue towels,
thermos and the blue car — the third room in the house where the inversion of kitchen's warm-room/cool-
thing is tried deliberately. Two emissive overhead tube fixtures (geometry only) and one broad cool sun
read as their light: flat, faintly cyan, shadows pooled directly under forms. **Scale joke:** the bench
top vanishes above frame — furniture as weather again (bedroom B's desk leg, differentiated: this is a
leg pair with a shelf), and the tool wall above it is a blurry constellation in the tilt-shift. **What a
track wants here:** the WORKBENCH MEZZANINE — a cardboard ramp ramps up to the bench shelf and the whole
under-bench half-room is low ground a builder claims for free; the grit arcs are visual grip lore, the
real grip puzzle is the ramp's cardboard-vs-concrete lip at its foot.

## C — epoxy sparkle, door-gap sunblade (hero-c.png, close-c.png)

**Material story:** poured epoxy — resin-dark olive `ceramic` with a strong glaze and a scatter of
instanced metallic flakes, the whole floor one dark mirror. **Palette/light:** the coldest read of the
three, cool white sun through a roller-door gap: one low strong key from behind-right plus a floor strip
as its visible blade, so the room is a lit diagonal and everything else is shade; the dead hanging bulb
hangs in the dark half as a joke about variant A. The token red appears exactly twice. **Scale joke:**
the bicycle wheel is stood up dead-center on the straight — spokes, hub and a shaft behind it — the
garage's own drain-tunnel, biggest tunnel mouth in the game. **What a track wants here:** the BIKE-WHEEL
TUNNEL as the goal line every straight aims at, the sparkles as speed-reading noise under the wheels,
and the sunblade as the one line in the room that free-play always routes a track along.

## Open for the AD

The three variants are one set with three interchangeable skins — anchor geometry (slab, bench, wheel) is
shared, so the vote is about finish + lamp, not layout. SpotLight-as-key (A) is the first non-directional
key in the engine; the TA should confirm the toon shader's shadow/unlit separation holds at the cone
edge before ratifying the bulb variant. C's floor flake layer is one InstancedMesh (~260 flakes) and
cheap; B's arcs are flat rings. None of these framings are set cameras yet — Canonical Cameras lists
garage as unassigned; the real rigs land with the production set.

## Round 2 — AD send-back of 2026-10-08 (numbered fixes, variant C only)

The two C frames were re-rendered against the five numbered fixes plus the two studio
notes; A and B were not re-saved (their renders are byte-identical to what HEAD produces —
note the committed A PNGs predate a shared-code stamp and do not re-render byte-identical at
HEAD itself, inherited, not introduced here).

1. **Bench reads as furniture at the close rig** — the top dropped into frame (`topY 0.185`)
   with its leg run, back rail and a grain-lit strip of top; measurable silhouette: the bench
   edge now runs continuously through rows 240-460 of close-c where round 1 showed a
   floating slab above frame.
2. **One tool cast aside, on the top** — the wrench moved onto the dropped top
   (`(-0.2, 0.2025, -0.31)`), the one hand-sized object in both rigs; nothing else is loose
   in C's focus band (the hung screwdriver's handle went steel so the accent lives on the
   toolbox only).
3. **Isolated-bright census at the floor rig** — the speck budget fell from **0.050 % to
   0.016 %** of frame (460 → 150 px; bar is 0.010 %). What actually fired, established by a
   probe raycast from the speck pixels at a corrected camera matrix: the glint quads at
   diffuse 2.4 (clamped white, now ~160 luma corridor-toned sparks), the wheel's chrome ring
   and spokes and the tire sidewall band (dimmed steel), the nail spill at (0.22, 0.1) (ten
   pins, chrome off), the parked car's cream roof stripe, the roller-door foot's clamped
   bottom band, and the epoxy's specular mirror of the corridor. Several materials that the
   removal tests kept exonerating (door, wall, ground, films, blade split) were given back
   their light after the probe identified the true sources; the residual ~150 px ride the
   tilt-shift CoC dither along the corridor-tail edges and belong to the open TA-1 ticket —
   the same class, adjudicated at 300 % crop as ramp dither on the sharp/blur ring, not a
   material. The 255-white band the census kept pointing at rows 393-438 triangulated onto
   geometry only after the probe's camera-matrix fix; every "innocent" verdict before that
   was cast against stale rays.
4. **The practical bulb is in both rigs** — hung at (−0.05, 0.145, −0.24), visible upper-left
   in hero-c and above the corridor in close-c, with the warm bounce disc under it keeping
   the honest-bounce read where the bulb itself crops out.
5. **Stain is a film, not a puddle** — the wet-patch treatment (bathroom-ratified) with the
   white×2.2 fill experiment removed; it grazes the corridor's dark side and never crosses
   the blade.

Instrumented (`tools/histogram.mjs`, 1280×720, post=on): hero-c mean 152.3, p5 41, ≥243
2.25 %, <60 10.05 %, token-red 0.50 %, iso 0.003 %, bright coverage 1.62 % of frame, longest
≥240 run 427 px. close-c mean 131.5, p5 45 (baseline 38), ≥243 0.95 % (baseline 0.44 %),
<60 17.9 %, token-red 0.44 %, iso 0.016 %, run 409 px (baseline 139). The <60 share rose
with the dropped bench — the extra shade is under and behind it; p5 says nothing new crushed
to black.

## Production pass (census, post-ON, 1280×720)

| frame | dark<60 % | tinted | blackish | blown | medTone |
|---|---:|---:|---:|---:|---:|
| production-hero | 6.720 | 6.651 | 0.069 | 2.193 | 153 |
| production-side | 2.779 | 2.764 | 0.014 | 0.846 | 121 |
| production-low | 6.186 | 5.901 | 0.285 | 0.915 | 122 |

The ratified look's earned tinted darks survive production (darkest room in the house holds: hero 6.7 % tinted, blackish ~0). Carried-forwards honored: bulb practical visible in hero framing, sunblade-as-ribbon shading on the slab, soft stain edge (film, not decal), B's mezzanine ported.
