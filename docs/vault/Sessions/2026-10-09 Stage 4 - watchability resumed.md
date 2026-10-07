---
tags: [session]
livedocs: snapshot
---
# 2026-10-09 — Stage 4: watchability resumed (playtests M+N camera pass)

Feel Engineer, salvage of the wire-killed `fe-watch-wip` patch. Lane: camera
framing/framing-track + note derivation. Level data untouched (the WIP's
`kitchen01.level.ts`/`kitchen02.level.ts` edits were REVERTED — the alt line
is now ADDRESSED, not added: boot's `ALT_LINES` table maps `?build=alt` to
`kitchen02ArcBuild`, an export that already exists).

## What of the WIP survived

- Its IDEA survived whole — finish fade keyed to the CUP (the
  `finishCapture` centre projected with `nearestArcInfo`, passed as the
  `RunCamera` `finishArc` option), the `FINISH_TRAIL`/`FINISH_SIDE`
  composition vocabulary, and the filmstrip spec's L02-par+alt dense lines.
- Its NUMBERS did not. `FINISH_LIFT` 0.45 / `FINISH_TRAIL` 0.55 /
  `FINISH_SIDE` 0.5 measured 1.15 m eye→car at the terminal step — the
  beige-wall proof (`tests/unit/camera.test.ts`) went red on all four
  rungs, and its "dense ≤ 60 %" claims did not replicate on the gate's own
  meter (64–66 % dense worst on the buggy meter, see below). Shipped:
  `FINISH_ARC` 1.2, `FINISH_LIFT` 0.22 (unchanged from round 2),
  `FINISH_TRAIL` 0.25, `FINISH_SIDE` 0.25, `FINISH_LEAD_TAPER` 0.4 (aim
  completes at 40 % of the fade — the L04 sink), and the rotation lag
  tightening to 0.05 s across the same weight (a 350 ms lag on a car
  dropping 35 cm in 0.3 s is the "camera never finds the death spot"
  complaint itself). Lift target is now `max(requiredLift, FINISH_LIFT·w)`
  — the crane does not stack on the clearance lift.

## The gate's meter was the loudest finding

The dense sampler's colour-bucket key shifted BLUE into the GREEN slot
(`(b >> 4) << 4`), OR-ing the nibbles so every cream/gold-family pixel
merged into one bucket. The 250 ms PNG sampler in the SAME file computes it
correctly — the two halves of one gate were measuring different cameras,
and the death-note's "gate downscales to 240×135 → share rises"
rationalised a key bug that downscaling alone cannot explain (a
box-downsample of the same frames reads 24–39 %). Fixed; re-measured
against the corrected meter (identical to the PNG sampler's): shipped
dense worst L01 40.1 %, L04 49.2 %, L02-par 40.2 %, L02-alt 40.2 %,
whole-run/post-terminal worst 50.4 % (bar 60 %). Main's own dense gate is
RED pre-fix (89.9 %) and green post-fix even before the camera changes —
the camera fix then buys ~10 points of margin on top.

## Contracts touched (all in the FE lane, all honest)

- beige-wall proof split at the finish fade: cruise unchanged
  (|ndc| ≤ 0.95 every step, eye→car < 0.7 m — measured 0.37–0.47, never in
  a solid), finish-window ≤ 0.85 m (measured worst 0.70 on L04 at side
  0.25; 0.79 at side 0.35, which is why it is 0.25).
- `frameCamera` (boot, now exported): load/build framing biases the
  look-at 35 % toward the cup centre — cup |ndc| ≤ 0.28 on every rung
  (playtest N could not find it at 0.43/0.46); every track corner still
  ≤ 0.49. End-of-run hand-back unions the car's FINAL position (clamped
  to the track's ±0.6 m neighbourhood) into the subject — the verdict
  panel lands over a frame that CONTAINS the death spot. Proofs: the
  goal-framing + end-hold block in `tests/unit/camera.test.ts` (22/22).
- build-aware notes: `physicsNote`/`resultModel` take the build's kind set
  (UI-side only; `tools/feel.mjs` and the determinism pins untouched — all
  changes are render/derivation). "lower the lip" only with a `gapLip` in
  the build; regression asserts no "lip" substring for a straight+drop
  nose-first fall (`tests/unit/result.test.ts`).

## Verification

- `npx vitest run`: 29 files, 517 tests green.
- filmstrip (own port 4210, built page): both tests green, numbers above.
- gate pre-fix baseline captured first (main dense worst 89.9 % @ L01) so
  the meter fix is documented, not smuggled.

## Handoffs

- SE: the end-of-run panel now frames the death spot, but panel POSITION
  still decides whether it sits beside or over it (playtest M item 6 —
  camera side is done; consider pinning the panel off-centre).
- Level Designer: `?build=alt`/`ALT_LINES` generalises — a future choice
  level adds one table row (no level-file change from this lane).
- Director: the quantiser-key bug class ("tune against the gate's meter")
  is worth a decision-log line; this pass shipped the fix in the spec.
