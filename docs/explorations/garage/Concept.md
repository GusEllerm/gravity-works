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
