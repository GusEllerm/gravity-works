---
livedocs: snapshot
---
# Playtest X round6 (fresh-eyes, browser, 1280x633 viewport)

## How far (in order)
1. Kitchen (kitchen01): Drop→Lip→Landing on ring at ramp tip, Launch → 1/3 stars (2.37s vs par 2.25s).
2. kitchen02: Drop→Straight→Straight→Lip (all auto-snapped onto table track), Launch → 2/3 (1.00s, 4 pieces > par 3).
3. kitchen03 (room 3): Drop→Lip→Landing placed; then WALL — Straight ×2 had no hover anywhere showing "fits here"; camera would not move; `]`, R, arrows did nothing. Stopped here.

## Fits, clicks, ghosts
- Hover near (600,550) with Drop showed "fits here"; the ghost rendered at the ramp tip ~(610,630) — 80–130px BELOW my cursor. Clicking on empty "sky" still landed the piece exactly on the off-screen ring. Fit-clicks always placed at the target, so "fits" = yes-it-lands, but the ghost is far from the cursor.
- Dead clicks: any click at y≈660–700 did nothing (screenshot shows content there, but viewport is only 633px tall — the game thinks it's off-screen). Clicking while "two spots fit here" showed, with no fit banner, placed nothing (kitchen03).

## Camera / Esc
- Right-drag panned the scene exactly ONCE (kitchen01). In kitchen03 right-drag (real and scripted), wheel, scroll: view never moved.
- Esc-Esc never restored a camera. In kitchen01 my Esc-Esc attempt ended with a black screen and the tab navigating to about:blank (hard crash; cause invisible).

## Advice about an unplaced piece
While holding Landing, table = ramp + drop + lip and a pre-placed curved track with cup: "target: end of lip · two spots fit here — press ] for the other one" — `]` visibly did nothing.

## Best moment (picture)
Kitchen launch: car threading drop→lip→cup. /Users/gusellerm/.agent-browser/tmp/screenshots/screenshot-1791365770450.png

## Words I couldn't interpret
"Retry from the start — the build stays as built"; "target: where the car starts" (appeared mid-drag); "two spots fit here" (no visual mark of the two spots); "the ring is where it will land" vs "target:" (same thing?).

## Failures with invisible cause
Straight never fits anywhere in kitchen03 (target ring below viewport, no working camera escape). Silent no-op clicks below the viewport fold. The kitchen01 black-screen crash.

## Friend moment
Caption: "Game: 'fits here.' Also game: the piece, the ring, and your cursor live in three different places."
