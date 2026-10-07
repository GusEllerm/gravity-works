---
livedocs: snapshot
tags: [session, stage-5, art-director]
---
# 2026-10-09 Stage 5 — the PORCH, explored (A/B/C)

> [!abstract] Role
> Art Director drives the props directly for the sixth set's exploration, per the established ritual
> (kitchen/garden/garage did theirs in stage 1/4): one dev scene with three variants
> (`src/dev/scenes/porch.ts`, scenes `porch-a`/`porch-b`/`porch-c`), six committed frames at the
> canonical 1600×900 hero and build/establishing rigs with tilt-shift post ON, census-cleaned, and
> `docs/explorations/porch/Concept.md`. Throwaway code — no production set, no registry row, no camera
> rows, no bible edits.

## Ground

The porch is the THRESHOLD — plank deck between house door and yard, toy cars crossing it. The token
seed is slate-blue storm + lantern amber. The brief's lighting regimes were morning screen-door
sidelight, dusk lantern, rainy overhang. The ritual's demand is that A/B/C be **three different rooms,
not one room at three times of day**, so each variant changes ground story, prop jobs and structure
(the overhang roof exists only in C; only B lights the hall; only A shuts the screen door) as well as
light. All six props identical inventory, different jobs, AD-2 honored (accent inside the band).

## The three pitches

- **A — morning sidelight through the screen door.** Dry sun-porch; the 6 mm screen weave combs a long
  grid shadow across bleached planks; geraniums and a doormat band spend the amber; census-high-key with
  zero soot anywhere (0.000 % dark, 0.000 % blackish, medTone 131–152). **Trades away** the threshold
  DRAMA — nothing threatens the car; it's the calmest room in the house, and its hero frame wastes the
  weave shadow.
- **B — dusk lantern.** The evening ROOM: hung lantern as the only amber (geometry, not flare), shadows
  radiating from its bearing, lit hall behind the open door, chalk hopscotch glowing, the dry flume
  crossed mid-lane on a plank bridge. Darkest medTone (94–108) and the strongest build-camera picture.
  **Trades away** the census dark budget — dusk-by-medTone keeps blackish near zero by giving up sub-60
  shadow depth; expect a rubric-line-8 conversation.
- **C — rainy overhang.** The storm shelter: the roof does structural work (rain falls only beyond the
  eaves line — the boundary is geometry), the flume runs full and drowns a wet patch onto the lane, the
  chime is the gust's pendulum clock, boots are the one warm thing. **Trades away** the warm end of the
  seed entirely (coldest frame, 0.25 % residual soot in puddle cores) and needs a gust sim to pay off.

## Provisional favorite

**B, the dusk lantern** — it is the only variant where the THRESHOLD itself is the subject (lit hall
behind, dark yard beyond, the deck between is the pool), it owns the amber, and its build-camera frame
is the only one that is a painting. A is the light alternate (cheapest build, safest, most legible
light); C is the boldest set mechanic (the overhang rain-boundary is a real set rule) and the most
expensive to ship — carry its wet-patch flume and gust chime into whichever wins, the way B's mezzanine
was carried in the garage.

## What the census round cost (the art history IS the physics history)

Round 0 shipped `toyBlock` placed by center (walls, doors, posts floating — the "porch floating in a
field" frames); round 1 fixed placement by bottom face; round 2 found the soot sources systemic —
paintedWood seam bed at `darken(plankHex, 0.42)` and hedge masses in the census's BLACKISH band; round
3 lifted the sky-side shadow tint toward the sky value (the garden AD-note-2 rule, here applied to the
porch's half-outdoor shade) — the single knob that took B from 4.4 % blackish to 0.1 %. Round 4 de-
saturated B's key (a slate wall × a fully-amber key multiplies to orange — the wall-slab lesson) and
planked the door. Final: no frame blows, no frame soots; table in `docs/explorations/porch/Concept.md`.

## Demerits owned

The canonical hero rig undersells all three rooms (it frames decks, not the door mouth + step) — the set
rigs must be authored in production, garden precedent. C's rain rods catch a facet; the kid's shoes read
as bricks at build distance; the chime gate needs a pendulum sim (Feel ask, not art). All in the note.

## Gates

- `npm run typecheck` clean; `npm run build` clean; harness scenes registered through the registry
  pattern only (`registerScene` — no engine, camera, or tokens edits; the three scenes reuse
  `createLightingRig`/`applyKeyLight`/materials/tokens verbatim).
- Renders: `node tools/render.mjs --scene porch-X --shot hero|establishing --param post=on` at 1600×900.
- livedocs: this note is a snapshot of a tree whose engine code it does not change; the only code it
  mentions are the new scene files it ships with.
