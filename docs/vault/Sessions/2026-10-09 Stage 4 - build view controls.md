---
tags: [session]
livedocs: snapshot
---
# 2026-10-09 — Stage 4: build view controls (playtest Q wave)

Feel Engineer pass on `stage4-buildview`. Three Q items — the build camera
("built 4 levels from ONE FIXED ANGLE, no orbit at all, left-drag PLACES"),
diagnostics naming pieces that are not in the tray, and the unreadable
"flipped fit" — plus the filmstrip's stale coverage floor, which the L02
redesign had quietly broken (red at baseline `e37bc70` on this box,
identically to my branch: not a camera regression, a clocking bug).

## 1. The restricted build orbit (`src/camera/build-camera.ts`)

The fixed view had been practised since the shell-truth pass as a §9.3
reading, never written down as a decision; Q's ledger ("the build-time
fixed angle is the real visibility bug — the cup was invisible/guessable
on 3 of 5 kitchen levels") is the evidence that amends it. The Decision
Log entry (2026-10-09, `[agent decision]`) records the amendment.

Parameters (`BUILD_VIEW`):

- **One degree of turn**: damped YAW about the world vertical through the
  framing centre. `YAW_PER_PX` 0.0058 rad/px (~64° across the canvas
  width), clamped `YAW_MAX` ±60° — the table's sensible hemisphere around
  the base three-quarter azimuth (kitchen backs the play side with its
  splashback at −z; the eye never crosses that plane to look through a
  wall, and yaw-only means the eye can never dip under the table).
- **No pitch, no zoom.** `frameCamera`'s solved eye distance is untouched;
  the wheel is unwired on purpose. Elevation/roll/distance invariances are
  unit-asserted (a hard-clamped yaw changes |eye−centre|, the elevation
  angle and the roll by < 1e-9).
- **Pan**: left-drag past the threshold translates the framing centre in
  the camera's own screen plane, `PAN_PER_PX` 0.0016 × the framing span,
  magnitude-clamped to `PAN_MAX` 0.4 × the span (off the box, never off
  the table). Proved a pure translation: the quaternion cannot change.
- **Damping** τ `TAU` 0.15 s, the run camera's step-independent
  exponential form (`1 − e^(−dt/τ)`), ticked in boot's frame loop whenever
  the run camera is off; Retry/Reset (`resetCar` → `view.reset()`) bring
  the framing home, damped.

`frameCamera` gained an OPTIONAL fifth `view` argument: with it the solved
base framing lives in the view and the view composes the pose. At zero
yaw/pan the composition is BIT-IDENTICAL to the old direct set
(`tests/unit/build-camera.test.ts` compares camera A with a view against
camera B without, exact equality) — so every visual baseline, the
goal-framing and end-hold proofs, and every run hash sit exactly where
the previous wave left them (the camera feeds no physics; the determinism
spec stayed green untouched).

## 2. The gesture contract (Q's disambiguation, made explicit)

`attachBuildView(canvas, view, {onHover, onPlace})` is the app's ONE canvas
gesture owner; the builder registers no pointer listeners any more — its
verbs are `aimAt` / `clickPlaceAt`. One pointer sequence, one verb:

| gesture                                | verb                                      |
|----------------------------------------|-------------------------------------------|
| hover                                   | aim the target ring                        |
| press → release within 6 px (`CANVAS_DRAG_PX`) | PLACE at the aimed socket            |
| left-drag past 6 px                      | PAN the framing — places NOTHING      |
| RIGHT-drag, or SPACE+drag                | ORBIT (damped yaw) — places NOTHING   |
| wheel                                    | nothing (no build zoom, by design)         |

The right-drag browser menu is suppressed on the canvas (right-drag is the
orbit). Space over the page (not a focused control) is preventDefault'ed —
it only ever means this gesture here; a focused `<button>` keeps its
native Space. The tray teaching line learned the verb: "…· Flip: R ·
Look: right-drag".

## 3. Note tails are now TRAY-aware (not just build-aware)

`physicsNote(result, ev, actionableKinds)` — a kind is ACTIONABLE when it
is PLACED in the build that ran OR still stocked in the level's tray
(`actionableKindsFor(build, tray)`, exported from `src/boot.ts`; UI-side
only, the physics and the hash never see it, same discipline as before).
Each advice half is gated by its OWN kind: nose-first keeps
`flatten the landing` only when a landing is reachable, `lower the lip`
only when a gapLip is, and stands as the bare honest head when neither
is; the stalled-flat line names the booster only when a booster is
actionable (Q's K5 wall). `null` (shared/replay page, no tray knowledge)
stays permissive. Regression: `tests/unit/result.test.ts` sweeps the K2
tray (2 straights, lip, drop) × 3 statuses × 5 evidence shapes and asserts
no printable note names `landing` or `booster`.

## 4. "Flipped fit" says why, once

`FLIP_WHY` appends to the SAME `#gw-ghost-state` line on the FIRST
reversed result of a page session: "flipped fit · rotated — it rides
backwards; fine for a coaster, not for a launch (press R again to flip
back)" — the verb unchanged, the WHY once, honest that R is its own undo.
`tests/e2e/builder.spec.ts` asserts the once-tail on the first flip and
the plain verb after.

## 5. The filmstrip's stale floor, fixed honestly

Both sampling gates counted wall-clock boundaries from PAGE start while
`launch=1` released the run mid-boot; on the redesign's ~1.01 s L02 that
spent 300–500 ms of the sampled second on wasm/shader warm-up — the 250 ms
strip caught 4 of its ≥ 6 frames and the dense final-second window lost
warm-up buckets (both PIXEL bars always passed; failing identically at
baseline). The gates now release from a Launch CLICK on a booted page, so
the sample clock shares the run's zero; the 250 ms strip additionally
gap-checks its own cadence (no hole > 2× the sample period) instead of
trusting a magic count. Re-measured twice green: dense worst L01 ≈ 40 %,
L04 48–52 %, L02-par 37.9 %, L02-alt 36.2 % (bar 60 %), 250 ms strip 5
frames 39.9 % (L04 read 48.3 % then 52.1 % across the two runs).

## Proofs run (all on the branch, macOS hardware GL)

- `npx vitest run` — 537/537 (new `tests/unit/build-camera.test.ts` × 9,
  result/stars blocks re-derived).
- `npx tsc --noEmit` — clean.
- Full `playwright` suite (minus filmstrip, own port) — 69/69, including
  the new `tests/e2e/build-view.spec.ts` × 4, the visual baselines
  (bit-identity held: 0.0000 % / 0.0164 % rows unchanged), loop.spec's
  run-camera follow gate, playtest-n's panel pass-through (a 0-travel
  click still places through the new gate).
- `npm run test:e2e:filmstrip` — 2/2, twice (numbers above).

Baseline sanity: the filmstrip failures were reproduced at `e37bc70` with
this machine's node before any of my edits touched the spec — the fix is
mine, the fault is the redesign's, neither is level data.
