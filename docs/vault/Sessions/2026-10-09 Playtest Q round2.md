---
livedocs: snapshot
---

# Playtest Q — round 2 (fresh eyes, `sessionMode: fresh`)

## 1. Progress, in order
- Kitchen 1 `Book Drop`: solved, 1 launch try (2 pieces, 2.13 s — 3 stars). One accidental
  placement from a canvas drag (removed pre-launch; not counted as a try).
- Kitchen 2 `Two Ways`: try1 lip-flipped fail · try2 lip+drop fail · try3 lip-unflipped fail ·
  try4 zero pieces fail · try5 straight+drop fail ("line let go before the cup") · try6
  straight+drop+straight fail · try7 straight+drop+straight+lip SOLVED, 1 star (1.07 s, 4 pcs).
  Skipped a par-cut try8.
- Kitchen 3 `The Bowl`: try1 straight+straight+drop fail · try2 +landing SOLVED, 3 stars (2.62 s, 4 pcs).
- Kitchen 4 `The Tap`: try1 drop+landing fail · try2 +lip fail · try3 +straight SOLVED, 3 stars (2.48 s, 4 pcs).
- Kitchen 5 `Sunday Run`: 4 tries, unsolved — WALL. Bedroom and everything past stays locked.

## 2. What taught placement/unlocks
Help panel piece one-liners + star rules; the status line "fits here · target: X" plus the hover
hint row (hover/click/R); `All levels` captions "earn a star on X to open this". No first-run tutorial; ArrowRight target-cycling I discovered by accident.

## 3. Best moment (picture)
Kitchen 1: book arcs off the ramp over the croissant, drop's catch ramp snags it mid-air, it rolls
the landing and settles in the cup while the camera pulls back. `tmp/l1-run1.png`.

## 4. Stuck/guessed per room (Kitchen = the room so far)
L1 none. L2: big curve read as scenery for 5 guesses; "Two Ways" name never mapped to the solution.
L3: bowl-curve same scenery problem, hover-cycling saved it. L4: couldn't see the cup at all.
L5: Booster fits nowhere I could find — no idea where it belongs.

## 5. Uninterpretable words/numbers/screens
Star par numbers only in Help; "flipped fit" vs "fits here"; "0 of 4 used" vs "ready — 1 placed"
two counters; diagnostic "flatten the landing" when Landing isn't in the tray (L2!); white ring
markers unlabeled; white TP-roll prop read as a possible cup.

## 6. Broken interactions
- Left-drag on canvas PLACES a piece (press+move+release counts as click) — no way to orbit; right-drag does nothing. Build camera is fixed.
- Diagnostics can name pieces not in the level (L2 landing).
- Piece hold sticks on the exhausted piece: Place then says "no Drop left in the tray" — must re-click.
- Enter both re-launches and dismisses the win overlay — ambiguous.

## 7. Camera during runs
Great: Launch zooms to the whole table and the exact death is visible (fall off edge, skip short
of cup), and the caption names the failure mode ("fell off nose-first", "let go before the cup").
The build-time fixed angle is the real visibility bug — the cup was invisible/guessable on 3 of 5 kitchen levels.

## 8. Send-to-a-friend
Screenshot of Kitchen 1's run. Caption: "Deterministic book-into-coffee-cup trickshot, star-rated — breakfast is physics now."
