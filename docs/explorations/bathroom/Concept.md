---
tags: [exploration, stage4]
---
# Bathroom — stage-4 set exploration (A/B/C)

> [!abstract] Role
> Throwaway concept renders by the Environment Artist, scenes `bath-a`, `bath-b`, `bath-c` in
> `src/dev/scenes/bathroom.ts`, captured at 1280×720 through the canonical `hero` and `floor` rigs with
> tilt-shift post ON (node tools/render.mjs, param post=on, size=1280x720). Same engine, materials and toon
> ramp as the ratified kitchen (ramp variant B, three hard steps) — deliberately NOT kitchen's palette
> strategy: the kitchen is one gold sun-key with the mint accent resting in the shade; each bathroom variant
> hangs its accent somewhere else and two of the three rooms run cool, which the art bible allows when the
> set's story says so (Concepts/Art Bible §Light).

## A — porcelain cathedral (docs/explorations/bathroom/hero-a.png, close-a.png)

**Material story:** the token bathroom palette untouched — `ceramic` everywhere, a real tile grid (instanced
squares over a grout plane, checker accent tile every third one) on floor and the one wall, straight-walled
straight-sided tub, `liquid` film water with frozen ripple rings. **Palette/light:** cool north window — a
near-white key at 45° with an aqua-tinted fill, so the porcelain never goes grey because the shade band IS
the hue. **Scale joke:** the rubber duck floats at tub-water level like a yellow airship over the focus band,
and the toothbrush props against the wall as a 20 cm ladder nobody climbs. **What a car track wants here:**
hard porcelain acoustics — a U-channel on glossy tile is the fastest, loudest deck in the house; the wet
patch below the tub rim is a grip hazard that reads before it bites, and the chrome drain at the wall end is
the tunnel the straight line ends in.

## B — the warm bathmat (hero-b.png, close-b.png)

**Material story:** `fabric` is the hero — a plush step-edge bathmat spilling across the track line, the only
soft deck in the game (a rug section should roll the suspension visibly); pedestal sink and a four-bulb
vanity bar in `ceramic` and `dieCastPaint` chrome. **Palette/light:** clay-oak dominant lit by bulbs, not sun
— the inversion of kitchen's strategy: warm room, COOL accent (teal towels, teal mat), and the duck stays
classic yellow because a teal duck names nothing. **Scale joke:** the giant pink toothbrush leans off the
pedestal like a gangplank and a cotton ball sits foreground like a boulder. **What a track wants here:**
the mat is the room's grip puzzle — half a wheel on pile, half on plank is a built-in yaw test — and the
drain under the vanity is the tunnel a fast line picks instead of the bridge over the mat.

## C — glass shower wall (hero-c.png, close-c.png)

**Material story:** one big `glass` plane on chrome posts splitting the room into wet and dry halves — the
set's single transparent plane, and the only place the glass class ships in a set. Big-format cool tile,
tub under a frozen three-droplet shower beat (stop-motion cadence, Concepts/Feel). **Palette/light:** the
coldest read of the three, steel-blue dominant, a raking key through a high window; the duck yellow appears
exactly twice (the duck, the shampoo cap). **Scale joke:** the shampoo bottle is a leaning monolith billboard
and the toothbrush lies flat across the tile as a fallen tree. **What a track wants here:** the glass wall is
a sightline and a sound barrier — the run under the top rail reads as diving into the wet room, the puddle
film past the door is the hazard, and the drain sits ON the shower floor dead-center of the straight, making
the tunnel mouth the goal line.

## Open for the AD

A vs B is a temperature vote; C's glass wall is an engine risk (one transparent plane, depthWrite off,
sorting against the tilt-shift) and should be decided with the Technical Artist before anything is ratified.
None of these framings are set cameras yet — Canonical Cameras lists bathroom as unassigned; the real rigs
land with the production set.
