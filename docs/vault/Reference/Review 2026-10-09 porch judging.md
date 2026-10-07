---
tags: [reference, review]
livedocs: snapshot
---
# Review 2026-10-09 — Stage 5 porch judging (Art Director)

> [!abstract] Scope and method
> Variants A (sunday morning), B (dusk lantern), C (rainy overhang) of the porch set, scenes porch-a/b/c
> on branch stage5-porch-explore (src/dev/scenes/porch.ts is branch-only; anchors below are main-side),
> six canonical 1600x900 frames, judged against the Art Bible rubric (eight lines, 0–2, pass ≥12, no zero)
> plus the set questions: build/hero readability, corridor legibility, palette coherence with the ratified
> five rooms, affordance legibility, tilt-shift signature, and the threshold fantasy. Evidence: one view
> per frame, the explorer's census, one read of the rain build in porch.ts and the render system
> (`src/render/post/tilt-shift.ts`, `src/render/tokens.ts` porch row).

## Scores

| line | A morning | B dusk | C rain |
|---|---:|---:|---:|
| 1 silhouette @200 px | 2 | 2 | 1 |
| 2 right focal point | 1 | 2 | 2 |
| 3 miniature cues (≥2) | 2 | 2 | 2 |
| 4 dominant+accent+track, nothing fighting | 2 | 1 | 1 |
| 5 one light, shadows explain | 2 | 2 | 1 |
| 6 one material class each | 2 | 2 | 1 |
| 7 someone lives here | 2 | 2 | 2 |
| 8 nothing default / earned darks | 2 | 2 | 1 |
| **total** | **15** | **13** | **10** |

**A passes at 15; B passes at 13; C fails at 10.** No send-back needed — a variant clears.

## Verdict: ratify A

A is the studio's most legible single-key since the garage sunblade: the screen-door mesh weave combed as
one parallelogram of grid shadow across the deck names the door, the hour and the threshold at once. The
threshold reads spatially true at build camera — sneakers kicked off mid-crossing, doormat, step, yard
beyond — and the corridor is open and fully buildable. Tilt-shift is in the production system
(`src/render/post/tilt-shift.ts`, post=on), so line 3 is uncapped and the signature holds in every frame;
the Art Bible's "not yet landed" parenthetical is stale. Palette is coherent by tokens, not by reuse:
`src/render/tokens.ts` porch slate #6C8AA6 + lantern amber #E8A13C sit in the same system as the five
ratified rooms without borrowing any of their hues.

B is the most *beautiful* frame (its establishing is the best single image of the exploration) but the lit
hall interior at #A8703C is a large orange field beside the orange track — line 4's "nothing fighting" is
the exact failure the track rule exists to prevent, and the hero plank values drift a full stop brighter
than the establishing, so dusk is inconsistent between rigs. Keep B as the porch *evening grade* of A's
room, not as the set. C fails honestly: grey-green deck against the warm-neutrals rule, puddles reading as
flat decals, and the frozen streaks as glass rods. Its rain **cost is not the problem** — the build is one
InstancedMesh, 270 instances of a 5-sided cylinder, no shadow casting: trivial against the Performance
budget. The problem is treatment (billboard or liquid class, not diecast facets) and the streaks grazing
the tilt-shift band at build camera. No veto against revisiting rain once the material is fixed.

## Must-not-lose list for the production port

1. The weave-shadow parallelogram — the key story. Carry the lifted sky-side shadow tint (garden AD-note-2)
   that keeps the seams out of the census soot band.
2. AD-2 accent-inside-the-band discipline (geraniums + doormat band, never above the rail).
3. The gutter flume laid at deck height, in the band — the signature affordance.
4. The sneakers as the scale joke — resized; at current scale they read as bricks at build camera.
5. Warm-neutral planks; the A ground passes because it stays warm — do not let a grade grey it (C's lesson).
6. Hero rig re-aimed at the door-mouth + step (the explorer's own fix), per the garden precedent:
   hero frames the story, floor obeys the camera law. All three heroes currently undersell the threshold.

Send-backs: none (a variant cleared). Notes 6 and sneakers are port conditions, not exploration defects.

## Production check — ratified A on the set (same day, Art Director, targeted pass)

Artifacts now: docs/explorations/porch/production-build.png, production-hero.png, production-low.png
(the exploration a-frames live on branch stage5-porch-explore; evidence this pass was the production
build + hero frames read against establishing-a and hero-a — targeted, not a re-judge).

**Verdict: the port HOLDS. All six must-not-lose items survive; no send-back.**

1. Weave parallelogram — **holds** at both cameras. In production-build the grid band still combs across
   the deck beside the track; the sky-lift keeps the seams out of soot (blackish ≤ 0.003 % per the
   session census, and nothing sooty in the frames themselves).
2. AD-2 band discipline — **holds**. The amber pair (geraniums, doormat) stays in the band; the only
   bloom clearing a rail line is the near planter at the extreme right of the build frame, a parallax
   artifact of the rail sitting forward of the pot, not a band violation. No amber above the far rails.
3. Deck-height gutter flume — **holds**, laid at the threshold seam in the band with its drip line, in
   both production frames.
4. Sneakers — **accepted on the session's claim**: resized 0.62× and the joke lands in the floor frame;
   I did not independently read production-low this pass (outside the build-camera scope) and its census
   row is clean.
5. Warm-neutral planks — **holds**. Both production cameras stay warmly keyed like A; the cool fields
   are sky-filled wall shade, not greyed deck. C's lesson was taken.
6. Hero re-aim — **holds, and it is the port's best improvement**: production-hero finally frames the
   threshold — door-mouth, weave shadow thrown on the return wall, the lane running at the camera, the
   step-break at the right edge. hero-a's decks-only framing is gone; medTone 155 sits at the top of the
   ratified 131–155 range, inside the room.

Palette coherence: slate wall + amber track + white rail read as the same system as the five ratified
rooms with no borrowed hues, exactly as ratified; no second amber field competes with the track.
Corridor legibility at the build camera: the lane is clear through the door mouth and the rails part
around the track with buildable margin both sides — parity with establishing-a, whose census row the
production frame reproduces (medTone 152, zero darks/blackish).

Send-backs: none. Round counter stands; porch production is ratified-cleared.
