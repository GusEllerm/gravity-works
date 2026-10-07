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
