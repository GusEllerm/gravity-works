---
livedocs: snapshot
---

# Playtest P — round 2 (fresh eyes, live site)

Stranger playtest of https://gusellerm.github.io/gravity-works/ via browser only. Session: fresh, unauthenticated, no repo knowledge during play.

## 1. How far (in order)

Landing page boots straight into Kitchen "Book Drop" (?level=kitchen01). Level list shows 21 levels (Kitchen 5, then 4 each: Bedroom, Bathroom, Garden, Garage), not 20.

- Kitchen 1 "Book Drop" — 10 tries, 0 stars: (1) launch with 0 pieces — "fell off the set" 2.04 s; (2) landing placed far-right on free hover — fail 2.05 s; (3–4) landing at end-of-ramp, default and flipped orientations — fails 2.05/2.27 s; (5) landing snapped to "end of cup" rotated — fail 2.05 s; (6–8) re-orient/remove replays of end-of-ramp landing — 2.27 s; (9–10) lip at end-of-ramp — fail 2.11 s.
- Kitchen 2 "Two Ways" never opened (needs a star on Book Drop). Everything else locked. Stuck at 0/21.

## 2. What taught placement/unlocks

Status line "Aim: hover the world or ←→ · Place: click the world or Enter · Flip: R"; live "fits here / target: end of ramp|cup|landing" snap labels; piece hints ("A sloped catcher — match it to the flight, not to the floor."; "A launch lip sets the angle of the jump…"); "Greyed pieces are not in this level · ×N counts the pieces left". The ?levels=1 page plainly explains star-gated unlocks. Help modal is 3D models with no legible text.

## 3. Best moment (picture)

Kitchen: after a run the camera pulls back to an overhead of the whole breakfast table — one frame, whole problem readable, book mid-flight.

## 4. Stuck/guessed

- Kitchen: never decoded where "the cup" wanted the book — the mug is table-center-left while the ramp ejects right; every snap target felt like a guess.
- Later rooms: unplayable, so unknown.

## 5. Couldn't interpret

"the line let go before the cup"; "target: end of cup" while cursor was over empty floor; run times (2.04–2.27 s) vs par 2.25 s on failed runs; piece-count text flip-flopping ("0 of 3" vs "1 of 3") while the result modal is open; green track visible on the 0-piece run screen.

## 6. Broken interactions

- Enter/arrows act on the last-focused toolbar button, not the game: Enter silently re-picks the piece instead of placing; Rotate steals focus and breaks the next Enter. Placement only worked after `blur()` — a mouse/keyboard-trust trap.
- Result modal buttons absent from the accessibility tree (only "Retry this build from the start" appears after reload).
- Mouse events land on the world under the modal: clicks beside the modal changed aim / fired tray actions while the modal was up.
- Click-on-piece delete unreliable (Delete key worked); placed pieces drift off-pixel between screenshots, hard to click.

## 7. Camera during runs

Camera follows the book and lands on a wide overview afterward — I could see the book sail past the cup and off the table edge, but the exact failing bounce happened while the result modal was already covering the scene.

## 8. Send-to-a-friend

Screenshot: overhead kitchen, translucent green landing ghost dangling off the ramp edge, mug far on the left. Caption: "The book flies right. The cup is left. The piece goes somewhere in between, and I can't find it."
