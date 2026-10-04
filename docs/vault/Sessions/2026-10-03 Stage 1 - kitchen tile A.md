---
tags: [log]
livedocs: snapshot
---
# Stage 1 — kitchen style tile A (Environment Artist A)

## The story, in two sentences

Sunday morning on the toy table: someone's breakfast got interrupted by a track show — the cereal bowl is now the banked turn of a hot-rod orange circuit that launches off a stack of books, and three sugar cubes have been pressed into service as a track support with one more parked on the landing straight as a checkpoint. The mug was refilled twice, the toast lost two bites, and a pencil was dropped mid-drawing and never picked up.

## Palette / light / materials

- Dominant gold `#EFAF4B`, accent mint `#5FB49C`, track orange constant `#FF7A1A` — all from `src/render/tokens.ts`, nothing hand-picked except warm neutrals (terracotta/ochre/cream book spines, tan toast, graphite-brown rings).
- **One gold key** (`GLOBAL_TOKENS.keyLight`, intensity 1.25, low at ~20° elevation) casting long shadows from frame-left across the counter; shadow bands tint toward gold via the token `shadowTint` + `setKeyLight`, never grey.
- **Mint-leaning fill** is the one deliberate deviation from the ramp scene: every material receives `fillHigh`/`fillLow` nudged 12–22% toward the mint accent (generated with `mixHex` from tokens, not hand-picked), so the cool side of every form reads against the warm key by hue, not just value. Shadows on the floor stay warm; shadows on mint-facing surfaces go faintly cool — breakfast sun against a fridge-colored room.
- Material classes (5, all from `src/render/materials.ts`): **ceramic** (bowl, mug, cereal-box band), **painted wood** (counter, books, toast, pencil, sugar cubes, mug rings, crumbs, loops), **track plastic** (the whole orange circuit), **die-cast paint** (tap, pencil ferrule), **liquid** (frozen drip, wet patch, coffee). No new shaders, no image textures.
- Local generators (kept in the scene file, not promoted): `bankedChannel` — the shared U-channel hull swept along a path with a per-point bank angle, used for the bowl wrap **and** both straights so the whole circuit is one continuous swept ribbon with eased bank ramps; `toastForm` (bite scallops carved into one edge of an extruded rounded square), `mugForm` (lathe with a recessed floor), `dripForm` (teardrop lathe), `straight` (path lerp). Instanced: sugar cubes, crumbs, cereal loops.

## The surprising detail

The **sugar cubes**: a stack of three holding up the exit ramp and one parked on the track as a checkpoint — breakfast food doing track construction. It says the same kid built this circuit and ate this breakfast, and it doubles as the miniature-cue scale reference next to the tap puddle.

## Honest rubric self-score

| # | Line | Score | Why |
|---|---|---|---|
| 1 | Silhouette @200px | 2 | Bowl+ring, book stack, cereal-box cliff, tap gooseneck all read small. |
| 2 | Focal point | 1 | Establishing and floor land on the bowl/turn; the hero cam's close mug competes a little with the turn for the eye's first stop. |
| 3 | Scale / miniature cues | 2 | Oversized bowl vs a scale-true pencil and toast, scale-true crumbs, mug rings, sugar cubes at finger-tip size. |
| 4 | Color | 2 | Gold + mint + constant orange; warm neutrals only; nothing fighting. |
| 5 | Light | 2 | One direction, long shadows that explain every form; drip and puddle catch the key. |
| 6 | Material | 2 | Every surface is clearly one class; the banked ribbon (track plastic, flat-shaded hull) still shows faint faceting up close. |
| 7 | Story | 2 | Two mug rings, bitten toast, crumb trail to a dropped pencil, sugar-cube engineering. |
| 8 | Nothing default | 2 | No black, no grey, gold-tinted shadows, flat token background, no post tricks. |
| | **Total** | **15/16** | No zeros. |

## Decisions made (recorded here since the file set excludes the Decision Log)

- `[agent decision]` (Env Artist A) Bank the whole bowl wrap at a single steep 0.62 rad with a narrow thick slab instead of stepped channel segments: stepped instanced segments read as a twisted accordion at all three cameras, and the ramped slab keeps the turn silhouette clean at the floor camera where a rim-height track would occlude the bowl. Alternatives: per-segment bank ramp (folded), full-profile swept channel (thin double walls read as noise).
- `[agent decision]` (Env Artist A) Fill nudged toward mint via `mixHex` on tokens instead of a second fill light: the toon shader's two-band fill is the mandated "no uniform ambient" mechanism; a real second light would double-spec every surface and wash the tint logic.
- `[agent decision]` (Env Artist A) Dropped the tea towel (fabric class): at every camera it read as a dropped paper map, not cloth; "if in doubt, remove" beat "one more soft shape." Toast lives directly on the counter now; vignette is 5 classes.

## Known weaknesses for the Art Director

- The hero-camera mug is a big foreground mass at the frame edge; if it reads as competition, the fix is pulling the mug ~6 cm right-back.
- The banked ribbon's flat-shaded hull shows faint faceting in close inspection; a smooth-normal pass would cost a welded-vertex build in the scene file.
- The establishing shot's lower-left third is quiet; a second book or the cereal box shifted forward would fill it but competes with the tap's silhouette.

## Files

- `src/dev/scenes/kitchen-a.ts` (scene `kitchen-a`)
- `docs/explorations/kitchen/establishing-a.png`, `hero-a.png`, `floor-a.png`
- Renders: `npm run render -- --scene kitchen-a --shot <establishing|hero|floor> --port 4191`
