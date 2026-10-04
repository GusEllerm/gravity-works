---
tags: [session]
livedocs: snapshot
---
# Stage 1 — kitchen tile B (Environment Artist B)

## The story, in two sentences

Sunday morning on the toy table: a kid built a track out of the good cereal bowl, three library books and the pencil that shims the ramp book — and parked a car mid-bank in the bowl's rim while the tap hangs, frozen, over its wet patch. Nobody is home; the toast is still in the mug, the milk is still in the bowl, and three cars are stopped wherever Sunday stopped them.

## Palette, light, materials

- **Palette** straight from `src/render/tokens.ts` kitchen tokens: gold dominant `#EFAF4B`, mint accent (one book cover, the folded cloth, the wet patch), orange track constant `#FF7A1A` as the reader's path books → bowl → mug.
- **Light**: one low gold key (`GLOBAL_TOKENS.keyLight`, intensity 1.3) from camera-right, elevation ~28°, long shadows that fly left/back and climb the flat cream wall — the tap's L-shadow is a second drawing of the tap. The material fill is nudged ~30 % toward the mint accent so every shadow breathes cool-gold instead of grey; every `ToonMaterial` is told the key via `setKeyLight`, so dark bands tint toward gold.
- **Materials** — exactly six of the seven classes, no new shaders: ceramic (bowl, mug), painted wood (counter, books, toast, pencil, floor), die-cast paint (brass tap, car bodies, pencil ferrule), track plastic (orange runs), fabric (cloth, tyres, cereal rings), liquid (milk, coffee, drip, wet patch, mug ring). Repeated props (crumbs, cereal rings) are `InstancedMesh`; the car factory is reused three times.
- **Generators**: `toyBlock` and `trackChannel` from `src/render/geometry.ts`; the bowl is a local lathe (the shared `bowlForm` dome touches the floor at one point and read as floating — a flat foot ring at y ≈ 1 mm fixes grounding; also a local `trackRun(a, b)` places a channel along any segment by `lookAt`).

## The one surprising detail

The pencil. It is doing double duty: one end is the shim propping the ramp book — the kid's engineering — and its twin lies on the counter where the eye lands first. A toy track held up by school supplies is the whole premise in one object. (Runner-up detail: the tap's own shadow drawing the tap on the wall.)

## Self-scored rubric (honest)

| # | Line | Score | Why |
|---|---|---|---|
| 1 | Silhouette at 200 px | 2 | Bowl, book stack, track lines, mug-with-toast all read in the thumbnail establishing shot. |
| 2 | Focal point | 2 | Hero lands on the bowl with the car on the bank; every rig points at it. |
| 3 | Scale cues | 2 | Oversized tap and bowl, pencil, book spines, crumbs — four cues; no tilt-shift available in the harness. |
| 4 | Color | 2 | Gold dominant, mint accent, orange constant; nothing fights (droplet is mint-adjacent — quiet). |
| 5 | Light | 2 | One direction, long shadows that explain bowl, books and tap; the tap shadow doubles the form. |
| 6 | Material | 1 | Every object is a named class, but the bowl interior still reads flat-ivory in hero rather than glazed, and the frozen drip is small. |
| 7 | Story | 2 | Toast in the mug, mug ring, crumbs, pencil shim — someone lives here and played here. |
| 8 | Nothing default | 2 | No stock look, shadows gold-tinted, flat wall (no gradient), no ambient mush. |
| | **Total** | **13/16, no zero** | |

## What I learned for the tile review

The toon shader never flips normals on backfaces, so any DoubleSide lathe lights one side wrongly — sets that need bowl interiors should carry a grounded, front-side local profile (as done here) rather than the shared `bowlForm`. Worth a technical-artist ticket on a `flipNormals` option or a two-sided-aware shader.

## Files

- Scene: `src/dev/scenes/kitchen-b.ts` (registered as `kitchen-b`)
- Renders: `docs/explorations/kitchen/establishing-b.png`, `hero-b.png`, `floor-b.png` (1600×900, DPR 1, fixed clock)
