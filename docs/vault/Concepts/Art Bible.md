---
tags: [concept]
---
# Art Bible

> [!abstract] Role
> The visual law of Gravity Works, version zero from the studio brief. The Art Director elaborates it — chosen references replace placeholders here; this note never contradicts `PROMPT.md`.

## The world

**Sunday morning on the toy table.** Everything is 1:64 scale inside a real house, seen the way a child lying on the floor sees it: low, close, a window somewhere behind us. Ordinary rooms made monumental: a cereal box is a cliff, a dish rack is a bridge. Warm single-source light. Clean but lived in — a crumb, a mug ring, a pencil. Handmade, warm, slightly funny. Never grim, never cute for its own sake.

## Preference pairs

Chunky over detailed · saturated over muted · one strong light over ambient mush · silhouette at thumbnail over surface detail · three materials per set over thirty · big shapes with one small surprising detail · physical motion over tweens · warm over cool (unless a set's story says otherwise) · a camera that frames over one that follows · quiet UI over game-UI. If in doubt, remove.

## Color

- Each set: **one dominant hue + one accent**, chosen for its story and time of day (see the set table in `PROMPT.md` §6).
- The **orange track** is the constant in every set, never re-hued — it is the reader's path and the brand.
- Cars: high-chroma single colors with one stripe; palette must stay distinguishable for colorblind players.
- Neutrals are warm (paper, cream, oak, putty) — never grey. Shadows tinted toward the set's dominant hue — never black.
- Palettes live once in a tokens file, generated into CSS and the material system so they cannot drift. Contrast validated for UI text and for the track against every set's floor.

## Materials

A single **toon-ramp system**, few parameters: base color, ramp (2–3 steps), specular size/strength, rim, optional "toy" treatment. Classes: die-cast paint, track plastic, painted wood (procedural faint grain), ceramic, fabric, glass, liquid. Every object is one of these classes. No image textures; variation is generated.

## Light

One key light per set (sun through a window, or one lamp), long soft shadows, visible direction. Soft fill from the set's dominant hue. No point-light clutter. Dust motes where the key crosses open air. Time of day is a set property and sets its palette (breakfast = low gold; bedroom = nightlight; garden = dusk).

## Camera

**Tilt-shift is the signature**: a narrow focus band around the car, soft defocus above/below, so the kitchen reads miniature. FOV ≈ 35° in play, 28° in replay. Build camera: orbital, framed on the set, never free-fly. Run camera: leads the car along the track spline, anticipates turns. Replay camera: composed shots (crane, rail, lock-off, low tracking) chosen procedurally from track geometry.

## Motion

Cars and loose props move by physics, always. Ambient world motion (dripping tap, curtain, cat's tail) runs at a ~12 fps stop-motion cadence. UI motion under 250 ms, never bouncy. Reduced-motion disables ambient motion and the cadence and makes everything else instant.

## Canonical cameras

Each set defines three fixed cameras in its level file — **establishing** (whole set, track visible), **hero** (signature affordance in use), **floor** (low, close, car in the focus band). All render reviews and visual regression use them: **1600×900, DPR 1, deterministic** (fixed time of day and ambient phase).

## The rubric (visual review)

Each line 0–2; a render needs **12/16 and no zero**.
1. Silhouette reads at 200 px wide.
2. One focal point, and it is the right thing.
3. At least two miniature cues (tilt-shift band, oversized prop, scale-true detail).
4. Dominant + accent + orange track; nothing fighting.
5. One light direction; shadows explain the forms.
6. Every surface is clearly one material class; nothing defaults to plastic grey.
7. One detail says someone lives here.
8. Nothing default: no stock-Three.js look, no untinted shadow, no uniform ambient, no gradient sky.

## The never list

No black. No pure grey. No untinted shadows. No image textures. No skybox gradients. No lens flare. No bloom above "soft". No particle fountains. No UI drop shadows. No cartoon eyes/faces on cars. No licensed shapes or branded objects. No ambient motion competing with the car.

## UI and type

UI is a thin layer over the world: piece tray, budget counter, launch button, replay bar. One display face with character (Google Fonts; rounded or humanist sans with personality — not Inter) + one text face. UI color from the set palette. No panels over the set during a run.

## Chosen references

*(filled by the Art Director at stage 1; empty = nothing approved yet)*
- Set look (kitchen): _unchosen_
- Car look: _unchosen_
- Material ramp: _unchosen_
