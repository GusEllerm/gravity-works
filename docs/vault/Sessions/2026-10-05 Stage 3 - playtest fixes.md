---
livedocs: snapshot
---
# Stage 3 — playtest fixes (Systems Engineer) — 2026-10-05

Three fresh-eye reports (`Sessions/2026-10-05 Playtest A/B/C.md`) on the deployed
build. The e2e passed where humans failed; every fix below reproduces the human
condition first, then asserts it on the BUILT app (`vite preview`, Desktop Chrome
viewport). Kitchen01 GEOMETRY is the Level Designer's concurrent branch — nothing
under `src/world/levels/kitchen01*` or `pars.json` moved here.

## 1. "The result panel is invisible" — the true cause

Reproduced against `vite preview` of a production build AND the live Pages
deploy. At scrollY 0 the panel renders (so the launch-click e2e passed). The
deployed page fails for a different reason than "not shown": the panel was
SHOWN but rendered OUTSIDE the viewport — `#gw-result` was pinned to a stage
CORNER inside a document taller than any laptop window (builder ≈ 140 px + the
inline-fixed 960×540 canvas + status/help below it ⇒ docH 801–1331 vs viewport
633). Every playtest gesture — Help (a below-the-fold toggle: 2/3 opened it
first and lost the toolbar), reading the hash/status line under the canvas,
hunting the camera — scrolls ≥ 176 px down, and any launch from there (Space on
the still-focused Launch, or a run ending while the reader is looking under the
canvas) puts the panel off-screen: measured `rect.y = -435` at scrollY 611 in
the built app. The canvas letterbox rode along: `renderer.setSize(960, 540)`
wrote an inline style that OUTRANKED the stage-fit CSS rule, so the canvas never
scaled to the stage and the page never fit the window.

Fix: panel CENTRED over the stage, shown on BOTH visibility channels (`hidden` +
`display`, the help drawer's lesson), and `scrollIntoView({block:'nearest'})` on
show — wherever the reader is scrolled, the result comes to them. Canvas:
`setSize(960, 540, false)` — buffer only; the element sizes through
`#gw-stage canvas`. e2e: launch from a SCROLLED page, assert the panel's
bounding box inside the viewport (`tests/e2e/loop.spec.ts`).

## 2. The loop closed

- Panel states the rules: `outcomeLines` prints "N pieces — par M ✓" and
  "t s — par T s ✓" (marks only on a finish — rule 1 already failed otherwise)
  plus a static star-rules line (B: "the rules behind the stars are opaque").
- **Retry** (`#gw-result-retry`): as-built — `World.reset()` + static framing +
  panel away, one click back to Launch. **Next level** (`#gw-result-next`):
  `LADDER` = kitchen01…05 via `nextLevelId` (sandbox/feeltrack are nobody's
  next), swaps `?level=`.
- **Reset** (`#gw-reset`, permanent, beside Launch): car to the release pose,
  build kept, view home — the control C searched for with Escape/'r'/clicking.
- Launch re-fires from ANY terminal status (it always did); the stall→launch→
  stall limbo is answered because the panel now lands in-view with the stall
  physics note on every terminal status.

## 3. The camera

Diagnosis: the follow WAS wired on the live path (`__gwCameraPose` samples prove
the render camera travelling mid-run, B/C saw it) — what players called "static
wide, run unreadable" is the rail eye at ~2 cm over a toy-scale deck (a blur of
deck texture) and the RAIL FREEZE-FRAME kept after the run ("buried inside the
floor" = the run camera's final pose, kept forever; only a rebuild — Remove —
brought the view back). Fixes stay in the shell, the class untouched: a rigid
`RUN_EYE_OFFSET` (up/back in camera-local frame) makes the follow watchable at
the game canvas, and a terminal status HANDS THE VIEW BACK to the static track
framing. e2e asserts the render camera MOVES during a built-app run.

## 4. Placement teachability

- `#gw-tray-hint` — "Move: drag or arrows · Place: Enter · Rotate: R" — appears
  while a piece is held and nothing is placed yet; retires at the first
  successful place (A never learnt Place).
- Disabled tray buttons point at ON-SCREEN text: `#gw-tray-reason` ("Greyed
  pieces are not in this level · the ×N pieces are yours · ×0 means all
  placed") via `aria-describedby`, and clicking a locked/spent button names
  itself in the aria-live status line (C: "state and appearance disagreed").

## Gate state

typecheck clean; vitest 213 (new `tests/unit/result.test.ts`, ladder test in
`boot.test.ts`); playwright 24/24 — new `tests/e2e/loop.spec.ts` (scrolled-panel
visibility, par rules + Retry/Launch/Next loop, Reset-homes-the-car, live camera
follow, teachability) and updated copy in `result.spec.ts`/`shell.spec.ts`.

## Notes reconciled

`Modules/ui.md` (reset/hint/reason DOM, panel centring + par lines),
`Modules/src.md` (setSize(false), hand-back, loop wiring, `__gwCameraPose`,
LADDER; fixed the stale "RunCamera not yet wired" claim), `Modules/camera.md`
(freeze-frame retired, shell-side eye offset). `Modules/sets-kitchen.md` and
`Modules/world.md` mention changed files but their claims hold — acknowledged.

## Still riding on the LD's L01 fix

The chain is completable as wired (`shell.spec` finishes kitchen01 lip→drop→
landing through the real builder UI) — but only after `ArrowRight` moves the
target off "level start". That discovery problem is the geometry note's: the
players placed at "level start"/"end of finishCup" targets and watched byte-
identical ~2.0 s falls (A and C) because the open socket they wanted was never
made visible. The LD's concurrent L01 geometry pass (separate branch) owns the
gap itself, the target discoverability, and whatever `npm run pars`
regeneration the new geometry demands; the panel re-scores itself against
whatever par answers.
