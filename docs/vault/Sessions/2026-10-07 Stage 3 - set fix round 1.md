---
livedocs: snapshot
tags: [session, stage-3, environment-artist]
---
# 2026-10-07 Stage 3 — kitchen set fix round 1 (AD review 2026-10-07)

> [!abstract] Role
> Session snapshot for the seven-point send-back in `Reference/Review 2026-10-07 Stage 3 kitchen renders.md`:
> all fixes are data/param edits, the three canonicals re-shot post=on, acceptance numbers below.
> Provenance note: the predecessor session did most of the code work but died before committing; its
> uncommitted diff was adopted, audited, and extended — the grade (fix 7) was re-tuned by the successor
> because the predecessor's pull still left the hero with zero sub-60 pixels. The round was completed
> by the successor.

## Per-fix status

1. **Ceramic exposure (class-level, kept).** `ceramic` in `src/render/materials.ts` is now a three-band
   ramp (steps 0.58/0.8/1.0, thresholds 0.25/0.62) with the broad specular down to 0.3; the bowl's
   per-scene ramp/diffuse overrides in `buildKitchenSet` were deleted — the bands are the class's job
   (decision 5). Acceptance met (table below): hero 15.4 % → 4.67 %, floor 21 % → 0.71 %.
2. **Liquids tinted.** Milk `#F7EFDE`→`#EADFC6` with wobble 0.25, coffee `#8A5A32`→`#5C3720`; the class
   specular narrowed (size 0.28, strength 1.15) so each surface shows ONE highlight and the set tint
   stays whole instead of desaturating to plastic grey.
3. **Rim car seated.** Posed AT `BOWL_SOCKET_FRAMES['bowl.out']` in `src/dev/scenes/kitchen-set.ts` —
   wheels on the crown circle, yaw along the tangent, level (the old centreline angle + 0.35 bank drove
   the body through the ceramic). Cropped at full size in all three frames: body clears the glaze.
   Seat is `bowl.out`, not `bowl.in`: at `bowl.in` the car is geometrically correct but projects across
   the milk disc from the hero height and reads parked in the soup.
4. **Floor focus car.** The AD's "park it on the near run" cannot also satisfy their own "middle third
   at 200 px" bar — both run landings project into the frame's OUTER thirds from the low camera — so a
   stand-in is parked on the counter centreline just clear of the rim (where ramp-run traffic would stop)
   and the floor shot's `SceneEntry.focus` re-points at it (identified via `canonicalCamera('floor')`
   rig identity; the §7.3 car-following band still holds, it follows the SHOT's car). Verified on a
   200 px downscale by this session: car fully visible, sharp, middle third.
5. **Track end-cap grounded.** `STAGING.trackRuns[0].b` y 0.022→0.001 (segment lowered, not a fifth cube).
6. **Toast + mug ring.** Soldier leans on the mug flank, bottom edge grounded (YXZ order, −0.45 lean);
   the ring mesh was already the `stainDecal` film (checked — no torus is wired): it read as a standing
   washer because it sat 7 cm from the pulled-back mug at coffee-palette grey. Pulled to the mug's
   flank, espresso brown, and the mug yawed so the handle leaves the canonical sightlines.
7. **Book spines + grade.** Terracotta spine → warm putty (track orange reserved for track-plastic).
   Grade: the predecessor's `fillStrength` 0.18 + `darken(shadowTint, 0.3)` was not enough — hero still
   had ZERO pixels below 60 and every shadow floor sat ≥ 70 (a near-cream `shadowTint` at 40 % key
   strength plus the fill band puts ~84 luma on any fully-shadowed counter pixel; fill 0.18 never
   bites). Re-tuned to `fillStrength` 0.07 with the rig's `shadowTint` mixed 0.70 toward a deep umber
   (tinted, never black). Rejected alternatives: raising `shadowRadius` (softened the bowl's own bands
   away — regression), pushing below ~0.06 fill (mud at establishing distance, the weave reads as
   speckle). Answer to the AD's question for the TA: the rig did NOT drift — the token shadow tint and
   default fill simply never paid a shadow budget; only the canonical STILLS pay it (the override lives
   in the dev scene; gameplay defaults are untouched and the bathroom question stays with the Director).

## Histogram numbers (tools/histogram.mjs, rec.709 luma, post=on canonicals)

| frame | mean | p5 | p95 | ≥ 243 | < 60 |
|---|---:|---:|---:|---:|---:|
| establishing | 202.2 | 182 | 218 | 2.07 % | 84 px |
| hero | 198.4 | 116 | 241 | **4.67 %** (bar: < 8 %) | **191 px** (bar: > 0) |
| floor | 198.2 | 106 | 229 | **0.71 %** (bar: < 10 %) | **2254 px** |

Honesty note: the floor's sub-60 pixels are true core shadow; hero's and establishing's are a mix of
deep weave cells and the shaded saturated-red car bodies (luma weights green). A scene-wide push deep
enough to land the big bowl-cast core under 60 in every frame is reachable (fill ~0.055) but reads as
mud at establishing distance; this round took the deepest pull that keeps the golden breakfast clean.
The ratified references themselves have zero sub-60 pixels, which is the calibration anchor for that call.

## Verification

- `node tools/histogram.mjs docs/explorations/kitchen-set/*.png` — table above, by this session.
- 200 px downscales of hero/floor/establishing viewed by this session (floor car: fully visible, sharp,
  middle third).
- Renders re-shot fresh in this session: `npm run render -- --scene kitchen-set --shot
  <establishing|hero|floor> --param post=on --port 4198` — and confirmed byte-identical to the
  predecessor's working-tree PNGs before the grade change.
- Full unit suite green; e2e green; typecheck clean.

## Budget delta

One extra stand-in car in the dev scene (the floor focus car): staged draws ~59 → ~64, set-only
geometry unchanged (39 draws / ~16.7k tris); no new meshes in `buildKitchenSet` (mug ring, toast, book
edits are transforms/colors).
