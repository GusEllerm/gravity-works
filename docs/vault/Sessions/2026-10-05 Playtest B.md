---
livedocs: snapshot
---

# Playtest B — 2026-10-05 (first-time player, no instructions)

## First thing I looked at
Title "Gravity Works", then the tray: 13 piece buttons (mostly greyed), then the 3D table
with one orange ramp and a red start gate. "0 / 3 pieces" under the toolbar. No goal text
visible anywhere on first paint.

## First thing I tried
Opened Help — it's an accordion *below the fold*; the button scrolled the page under the
canvas, and its piece descriptions (straight/drop/landing…) only appear after scrolling.
Then clicked "drop ×1" (highlighted), moved over the ramp, clicked. Status went
"1 / 3 pieces — target: end of ramp". Nothing visibly appeared. The piece had been placed
at "level start" (top of the ramp) per the earlier status line, but I couldn't see it.

## Where I got stuck / guessed
- **Where does a click place?** Help says "click a cell" — there are no visible cells. Clicks
  actually place instantly at an invisible snapped target ("target: level start → end of ramp →
  end of finishCup"). I guessed click coordinates repeatedly.
- **Camera.** Help promises drag-orbit and scroll-zoom. My drags never rotated the view; wheel
  scrolled the *page*, not the camera. After every run the camera ended buried inside the floor
  (big cream plane, track off-screen).
- **Tray state.** Consumed buttons kept showing "×1" (only greyed); held pieces stayed
  highlighted even when "no landing left in the tray". I lost track of what was on the table.
- **Undo.** "Remove piece" instantly deleted my last placement — no confirm, but it worked and
  returned stock. Reload resets the whole run (I only discovered the puzzle hash / summary line
  "fell off the set — 2.24s — hash …" hidden below the canvas).

## Wish someone had told me (one line each)
- Clicking a greyed-out name in the tray does nothing; only drop/gapLip/landing are yours.
- A click drops the held piece immediately at the snapped target — no confirm, no ghost unless
  the mouse is over the canvas.
- Press R to rotate the ghost before clicking; status "snapped/seated/no drop left" is the feedback.
- Reload is a full reset; there is no replay button — just place more and Launch again.

## Felt good
- Placing landing and watching a teal ghost show exactly where it will sit.
- Launch: the camera chases the marble; even failure looked cinematic.
- "Remove piece" as instant undo — clean and fast.

## What I'd show a friend
"A marble-run puzzle where you get exactly three pieces and have to bridge a kitchen-table
giant's gap — but the trick is you can't see where your pieces land until you launch."

## Bugs that broke flow
1. Drag-orbit and scroll-zoom never responded; camera often ended inside the floor post-run.
2. Failure text was identical ("flew off after a long jump — the gap outran the landing") on all
   five launches, even with zero landing pieces placed.
3. Tray counts never decremented (stayed "×1"); "Place" button permanently disabled/dead.
4. Help panel rendered below the viewport with no auto-scroll.

Outcome: 5 launches, best 1/3 stars, never solved level hash c1361097.
