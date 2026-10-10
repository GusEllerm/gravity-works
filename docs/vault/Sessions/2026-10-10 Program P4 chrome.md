---
livedocs: snapshot
tags: [session, program-p4, polish, shell-coherence]
---

# Program P4 — chrome: the chip band becomes a reserved row (feel engineer)

The final evaluation's asterisk (Evaluation 2026-10-10 player re-run, item 2's evidence — the stage-633
frame): at short window heights the compact reflow made the HASH LINE overlap the GHOST-CHIP STRIP below
the stage. Reproduced with rects before any code moved: at a fresh-save 1280×633 the compact law made the
page fit the window (`document.scrollHeight` 633 = viewport, no scroll), but its 288 px reserved constant
had counted every FLOW line and NONE of the corner-chip band — the zero-flow, viewport-pinned chips
(`#gw-ghost-bar` bottom:8px left:12, `#gw-save` bottom:8px right:12) sit at [604..625], and the last flow
line, `#gw-hash-details`, ended at [599..611] — 7 px inside the strip. At 720/900 the taller pages already
kept every flow row clear of the pinned chips (hash 971+/984+, chips 691/871), so this was the compact
block's law alone. History read before moving anything: the 380→288 re-measure (P4 shortlist pass, same
day) is where the band went uncounted — 288 was honest for flow and silent about the chips.

The fix is the layout law, not pixels (ui note carries the full claim):

1. **Stated integer boxes below the canvas.** `#gw-status` / `#gw-callout` in the ≤700 px block were the
   last lines left at `line-height: normal` (17 px boxes with 2 px margins); they now state
   `line-height: 15px; min-height: 15px; margin: 1px 0` like every reserved row above the canvas
   (the AIM-LAYOUT integer-box rule the studio already enshrined).
2. **The chip band is reserved.** The canvas cap constant moves 288 → 310: 270 px of re-measured flow +
   a 40 px band (the strip's 21 px box + 8 px offset + 11 px air) below the last flow line, so a
   zero-flow corner chip can never ride a flow row — on every OS. The first cut was 304; CI's Linux font
   metrics proved the extra 6, with condition 1 extended to the hash summary's line (`line-height:
   13px`) so the boxes are platform-stable and the same rects hold locally and on CI. The chips
   themselves and every regime above 700 px are UNTOUCHED (the 1600×900 canvas-element baselines never
   move; the corner law they ride is documented and stands).
3. **CI budget, not law** — the Tab-walk a11y test hit the bare 30 s wall on the PR's saturated
   SwiftShader runner (green locally and on main's quieter run); it now carries the same `test.slow()`
   headroom its neighbour keyboard flow already cites.

Proof (ports 4750; `tests/e2e/p4-chrome.spec.ts`, rects not vibes): pairwise-DISJOINT rects of the status
row, callout row, hash line, both bottom chips, the tray and the controls at 633/653/700 (compact: + no
scroll + hash bottom above chip-strip top) and at 633/720/900 (the three evaluation heights, scroll-0
page space, each with an attached full-window screenshot). Measured after the fix at 633: hash 570–583,
chip band 604–625 — 21 px of air; canvas 574×323 (the honest cost of the band is ~22 px of stage versus
the 345 it showed while the overlap existed — the 345 was never really free, it was spending the chips'
pixels). Contrast gate green (`scripts/a11y-contrast.mjs`, no color moved); a11y and result short-window
specs green; suite green.
