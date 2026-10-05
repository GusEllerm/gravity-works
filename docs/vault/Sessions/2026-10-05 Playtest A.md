---
livedocs: snapshot
---

# Playtest A — 2026-10-05 (first-time player, no instructions)

## First things looked at
Title "Gravity Works", a 13-button piece tray (9 greyed out, only drop/gapLip/landing live, labelled ×1),
Place / Rotate / Remove / Launch, a "0 / 3 pieces" counter, and a 3D breakfast-table scene with one angled
ramp and a red car. No goal text anywhere on first paint. I opened Help early — the one-line piece
definitions were the best writing in the game.

## First thing tried
Clicked the highlighted "drop ×1", clicked Place. Counter went to 1/3, status said "snapped / target:
level start" — then "target: end of ramp". I never saw what or where that piece went.

## Where I got stuck / guessed
- Camera: page-scroll and mouse-drag did nothing. The camera jumps by itself (after launches, after
  placements) and post-run often stares at blank beige — I could not see my board or where the car died.
- Placement is blind: "snapped" vs "seated" and the green vs orange ghost were never explained; ghost only
  faintly visible from the fixed angle. I guessed every placement.
- Where is the finish? A coffee cup? a cereal bowl? two little orange rails at the table edge? Status
  mentioned "end of finishCup" but I could not confidently match it to an object.
- After six launches — 0, 1, 2, and 3 pieces, landing at ramp end, gapLip at ramp end, landing at the
  "finishCup end", landing at level start — the result was always the same: 0 stars, ~2.0 s, "flew off
  after a long jump — the gap outran the landing". Gave up because nothing I did ever changed the number.

## Wish someone had told me
- The mouse controls the camera (or that it doesn't).
- What green vs orange ghost means.
- Which object on the table is the finish.
- That Remove is a full undo and returns the piece to the tray.

## Good moments
- Remove: instant, trustworthy, returned my piece.
- The failure card is honest and its one-line diagnosis is evocative.
- Help's prose ("it keeps speed, it never adds any") taught me physics in 13 lines.

## Would I show a friend?
"A marble-race level editor where you build a track out of kitchen physics — but I'd warn them: aim carefully, the camera doesn't do what you expect."

## Bugs / flow breakers
- Post-run camera parks on empty space; the result panel overlays the only view.
- Zero-piece launch and 3-piece builds produce byte-identical outcomes — either placements don't reach the
  trajectory or valid targets are undiscoverable.
- Tray buttons stay highlighted after their piece is placed/removed in some sequences.
