---
tags: [session]
livedocs: snapshot
---
# 2026-10-09 — Stage 4 · systems engineer — short-window polish (Z round7 close-out)

Four carry-ins from `Sessions/2026-10-09 Playtest Z round7.md`. All landed on main; full e2e green
(125 passed / 2 designed skips), unit 584/584, one build, preview port 4311.

## 1. Short-window layout (the real-player one) — SHIPPED

Reproduced Z's window FIRST (1280x633, fresh context): page measured 962 px tall at scroll 0 —
chrome ≈ 319 px + a 540 px canvas + the status/callout/hash lines, so the fold cut through the
playfield; the result panel itself fit only until ANY scroll, and the sticky toolbar
(`#gw-builder-host`, z-index 5) then owned the panel's pixels — the Next-level click died
`covered by <p#gw-piece-count>`. The old compact media query fired at ≤620 px and never saw 633.

Fix, all in `src/ui/shell.css`: the media block moves to `@media (max-height: 700px)` and becomes a
whole-PAGE compact variant — tightened chrome (h1/nav/builder margins), the canvas capped by WIDTH
(`min(960px, calc((100vh - 380px) * 960 / 540))` — a WIDTH cap keeps the buffer aspect true; a
max-HEIGHT cap would squash the 960x540 render and skew aiming), and the existing panel compaction.
The panel also takes `z-index: 6` — above the sticky toolbar — so a scrolled page can never again
bury its buttons under the builder lines. Measured: docHeight = viewport height exactly at both
1280x633 and 960x540; retry/next are the frontmost element at their own centre pixel.

New e2e (`tests/e2e/result.spec.ts`, 1280x633 describe): success path asserts scrollY 0, an
elementFromPoint hit-test per panel button, panel/buttons/status/callout fully in-window, and the
REAL Next click walking to kitchen02; the failure path asserts the fell-off note + caption lines
inside the window with nothing scrolled. Consequence: `playtest-y-clickdiff.spec.ts` T11 (below-fold
release) is structurally retired at 633 — now a conditional skip, the way T6b already skipped.

## 2. Remove-mode coherence — SHIPPED

There was never a mode — `removeLast()` is one shot per click — but both outcomes could be SILENT.
Now every shot speaks on `#gw-ghost-state`: success `removed the <piece>` (one-shot channel, survives
the rebuild, retired by the next action), refusals `nothing to remove — the track is empty` /
`nothing to remove — only the level’s own pieces are on the track`. Delete/Backspace ride the same
spoken path. e2e: remove round-trip in `tests/e2e/builder.spec.ts` (place → 'removed the lip' →
'nothing to remove', counter pinned at 0 of 3, keyboard twin included).

## 3. Copy — SHIPPED

- Help prop titles: `propWord()` humanises camelCase — "oilStain" → "oil stain" (`src/ui/help.ts`).
- Fingerprint disclosure: "Same pieces, same run, every time — this code proves it." → "Why the same
  build always runs the same way" (`src/boot.ts`; the hash claim inside is unchanged).
- Tray legend now states all three ways a piece appears — greyed / ×N stock / built-in: "…· pieces
  already on the track came with the level" (Z: "which pieces did I actually own?").
- Aim-vs-goal: WHILE HOLDING a piece the target line reads `place <piece> at: <socket>` — an aim;
  empty-handed keeps the neutral `target:` (Z read "target: the car's start point" as a placement
  spot because "target" also carries the star-rules goal). Socket labels untouched; the tie tails
  unchanged; `tests/e2e/playtest-n.spec.ts` updated on the held-state assertion.

## 4. Deferred ledger — HOME

`docs/vault/Home.md` Deferred: device-side anomalies (about:blank deaths, black tabs) CLOSED as
tooling-side per the 14-cell recording-proxy matrix (zero page crashes), with the standing bar —
any future session that observes a death attaches host-side `page.on('crash')` logs before reopening
the theory. One line for the K3 bowl: Z's three deaths were identical 2.3 s falls; below-fold aim in
her window may explain the build blindness — the death-family sweep re-opens now that the ≤700 px
layout shipped.

## Livedocs

`Modules/ui.md` updated in the commit (panel media pass, remove one-shot, copy lines, help titles,
spec inventories). File-level mentions of `src/boot.ts`/`src/ui/builder.ts` in Levels/camera/replay/
save/track/Level Ladder acked — the flagged lines all describe machinery this pass did not touch.

## Trail: stage-4 close review follow-ups (F1–F5, this session)

`Reference/Review 2026-10-09 stage 4 close.md` returned ship-with-follow-ups; the fix crew pass
landed F1 (mandatory), F2, F3, F5 and F4's hit-test on main; F6 went to the Deferred ledger in
`Home.md` (a save-schema migration, deliberately not touched here). Port 4330; every commit green.

- **F1 — the matrix can FAIL.** The eight `.catch` handlers in
  `tests/e2e/playtest-y-clickdiff.spec.ts` rethrow after the probe dump. Fail-proof (throwaway,
  reverted): with the release places-branch flipped `if (false && wasCleanClick)`, T0 ran RED —
  `Error: T0: director flow regressed … Expected: "1 of 3 pieces used" / Received: "0 of 3 pieces
  used" … 1 failed` — reverted, matrix back to passing.
- **F2 — the coordinates guard has a live cell.** T11 moved from the never-fired 633 skip to
  1280x721 — over 700 px the compact variant is off and chrome + the 540 px canvas still run the
  RECT past the fold. The cell asserts the PRECONDITION (rect crosses the fold), asserts the
  release ARRIVED routed to `<html>` (probe: off-canvas target), then asserts it placed — it can
  only pass on coordinates. Fail-proven: reverting `overCanvasAt` to identity-only turned T11 RED
  (`T11: below-fold in-rect release placed nothing … 1 failed`), then green.
- **F3 — press origin.** `attachBuildView` now records (window capture) whether the last mouse
  press BEGAN on a control; an untracked release whose press began on a control is not fresh
  intent. Repro before: hold drop, press Launch, drag to world, release → `1 of 3 pieces used`;
  after: `0 of 3`, the run never starts (no activation click either — down/up targets differ).
  New T13 cell with the ordinary-canvas-click positive control.
- **F5 — panel Next == level select.** `gateNext` takes `max(model.stars, bestStarsBefore)` (the
  save's banked best was already read for replay honesty and never used for the gate). The
  both-directions e2e in `tests/e2e/result.spec.ts`: fresh-save failure hides Next AND locks
  kitchen02 on `?levels=1`; bank the star, fail the replay → Next shows, the walk lands on
  kitchen02, the select shows it open. Deterministic from the save; the sim never sees it.
- **F4 — mirror-z, checked and clean.** Hit-tested the regime the review flagged (panel z6 above
  the sticky toolbar z5): the 1280x720 scrollable page and the 520x760 WRAPPED toolbar, Launch +
  Remove `elementFromPoint` at every scroll depth plus a real Launch click with the panel open.
  No collision at any shape — structurally impossible: the overlap needs ~370 px of scroll range,
  which needs a >700 px viewport AND a page ~370 px taller, while the non-compact page measures
  ~960 px. No z-order change shipped; the finding is stated in `Modules/ui`.

