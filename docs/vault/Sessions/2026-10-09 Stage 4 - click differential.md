---
livedocs: snapshot
---

# 2026-10-09 Stage 4 - click differential (Feel Engineer)

Worktree `gw-feel13`, branch `stage4-clickdiff`. Y round6: **"every level: clicks inert, Enter
always placed"** at 1280x768 dpr1 (with X round6's below-fold dead clicks folded in). Built the
playwright-level repro matrix — `tests/e2e/playtest-y-clickdiff.spec.ts`, 14 cells, fresh context
per cell, production preview build, with a RECORDING PROXY installed by `addInitScript` before any
app code: it logs every canvas listener REGISTRATION the app makes, every pointer/click event the
browser actually DISPATCHES (document capture), and canvas/GL-context counts.

## The differential, cell by cell (all placed fine — the bug did NOT reproduce page-side)

T0 move→down/up; T1 zero-move CDP down/up at the fits spot; T2 teleport move BEFORE the canvas
listeners attached then click after ready; T3 down/up storm inside the first 500 ms of boot;
T4 stale toolbar-only hover + zero-canvas-move click; T5 down with an untracked-up retry;
T6 ghost-equals-cursor within 3 px at 1280x633 + click places; T7 right-drag repeatedly in one
session AND after later level loads + Esc-Esc home (X's "worked once" did not reproduce);
T8 four level loads with drags — exactly 1 canvas + 1 GL context per page, zero `webglcontextlost`
(the black death did not reproduce under the proxy; evidence needed to chase it further is the
AUTOMATION HOST's crash event — `page.on('crash')` / chrome://crashes — not an in-page probe).

## What DID reproduce (both are TOOLING laws pinned as permanent assertions)

- **T9 — positional-desync clicks reproduce Y's symptom EXACTLY, page-innocently**: hovers arrive
  at the fits spot through one input path (aim tracks, status reads `fits here`), the press/release
  arrive at a STALE cursor point (probe: `pointerdown` at (0,0), target BODY). Nothing placed,
  nothing said, Enter works — Y's report verbatim. The page is right (a click that never touched
  the board is not place intent — the toolbar keeps its single-verb meaning). **What would settle
  Y's machine for good**: her tool's own dispatch log (event types + x/y + `button` field)
  diffed against this page-side probe for one session — if the probe shows zero pointerdown/up AT
  her cursor point, the events never arrived there.
- **T10 — a `Input.dispatchMouseEvent` down/up with NO `button` field generates ZERO page events**
  (Chrome eats it in the browser process; probe shows the move arriving and no pointerdown/pointerup
  at all). A tool omitting `button:'left'` reproduces "clicks inert on EVERY level, Enter places"
  100% and nothing page-side can reach it. This is the prime suspect for Y's tool.
- **T11 — X's below-fold dead clicks were page-side and are FIXED**: at 1280x633 the canvas rect
  reaches past the fold; Chrome routes a release at those coordinates to `<html>` (target HTML),
  and the stuck-press guard's `ev.target === canvas` test ate it. The guard now asks COORDINATES
  (`overCanvasAt` in `src/camera/build-camera.ts`): a release inside the canvas rect that lands on
  no control/panel/drawer is fresh place intent, same verb, same dedupe. X's "clicking empty sky
  places at the target" is the documented aim-retention rule, not an offset bug — T6 proves the
  projection equals the cursor at the target point at 633.

## Fixes shipped

1. **Gesture owner attaches at CANVAS MOUNT** (`src/boot.ts`): `attachBuildView` moved before the
   set module's `await` and the world's wasm await, dispatching through a null-able `builderRef`
   (probe: canvas `pointerdown` listener attaches at ~270 ms boot, was ~507 ms).
2. **Coordinate-based stuck-press release** (`src/camera/build-camera.ts`, above).
3. **Target-label audit** (`src/ui/builder.ts` `targets()`): an open start socket reads
   `target: the car's start point` (was "where the car starts" — read as a piece name by Y and X);
   an exit of a kind the TRAY NEVER STOCKS reads `end of the pre-built X` — the ring can no longer
   read "end of curve" beside a greyed Curve (kitchen02's run-out was Y's item 4). Tray kinds keep
   the measured-good "end of X"; the cup keeps "cup on the table". T12 sweeps the whole kitchen02
   target list and fails on any bare greyed-kind name.
4. **`]` now visibly changes the line with exactly two ties** (`updateGhost`): the second pick
   speaks the counter tail ("(2 of 2)") instead of repeating the identical phrase — X's
   "] visibly did nothing" (the ties ARE a few px apart on screen BY DESIGN; the words now move).

Gates: full e2e suite 124/124 (13 specs' label assertions updated to the reworded copy),
vitest 584/584, typecheck clean. See `Modules/camera.md` (attach-at-mount + coordinate guard)
and `Modules/ui.md` / `Concepts/Levels.md` (label copy) for the reconciled claims.
