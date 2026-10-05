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

## Round 2 — AD send-back re-render, variant A only (2026-10-08 review, hero-a/close-a re-shot, b/c untouched)

All five numbered fixes, param/data-level in `bath-a` (every change is variant-A-scoped; b/c re-render
byte-identical to the round-1 files). **1 — ceramic exposure:** A's tile/wall/porcelain bases pulled ~8–10 %
darker and the ceramic ramp's upper threshold raised 0.62 → 0.72 (the ratified stage-3 three-band fix on
scene values), grout/wall/background pulled with them: ≥243 coverage **34 % → 1.0 %** hero,
**39 % → 4.2 %** close (bars < 8 / < 10), with visible bands on the tub flank, the tub rim and the wall tiles.
**2 — shadow budget:** A's fill pulled deep into the aqua dominant (`fillLow` re-derived, `fillStrength`
0.16 ceramic / 0.14 wood) and grout dropped to a tinted tile-line dark: p5 **125 → 95** hero, 101 → 93
close; sub-60 goes **0 → 4,235 px** hero and **0 → 4,958 px** close, every one tinted (min channel-spread
19–23, zero blackish — the never-list audit stays at zero). **3 — wet patch → film:** the saturated flat
cyan accent squares (what read as the sticker puddle) are muted to a near-tile tone, and the hazard is now
a pair of `stainDecal` wetPatch films — tile base tone, soft SDF edge, Fresnel sheen — lifted *above* the
tile tops (at the film's default 0.6 mm lift it hid inside the floor slab) on open sunlit tile beside the
drip line and the tunnel mouth. Patch interiors measure 222–226 against ~235-luma surrounding tile (the
±25 bar) and both close-a drips carry specular streak pixels ≥ 240 (peaks 244/241); the hero keeps the
hazard detectable by tint, soft edge and wash over the grout lines. **4 — tub flank:** scene side — 4096
map on a tightened ±0.7 m frustum (0.34 mm/texel), shadowDither 0 on A's materials and PCF radius 1: the
flank resolves to one clean contiguous band, no speckle in a 300 % crop. **5 — track side walls:** ramp
softness 0.06 → 0.02, and the mm-scale rail lips stop self-casting (no shadow map at any affordable
resolution resolves a 6 mm lip without the rejected dither signature — that is TA-1's systemic call);
the track is grounded instead with the tub's own contact-film trick, so the focus-band crop shows clean
rails and hard toon car shadows, no speckle.

**Honesty notes / demerits I volunteer:** the film's Fresnel streaks clear 240 at the grazing floor camera
but structurally cap at ~235–239 in the hero (the shader's `pow(1-steep,4)` term at that camera angle), so
the hero detectability rides on chroma and the soft edge, not a streak; the drain's chrome ring still
flares as a bright donut at the track's far end (pre-existing, not in the send-back list — one more bead of
rim tuning belongs to the TA's chrome class, not this round); the tub-flank band edge is texel-staircased
(a hard quantized edge, not speckle, but it is not mathematically smooth); and variant A's floor still has
no sub-40 luma anywhere — the darks are earned tinted-teal, deliberately not black.
