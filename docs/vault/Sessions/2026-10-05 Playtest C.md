---
livedocs: snapshot
---

# Playtest C (stranger, 2026-10-05)

Fresh browser at gusellerm.github.io/gravity-works, no prior knowledge. ~6 runs, all 0 stars.

## First look
Title, then the tray: most piece buttons greyed-out with no reason; three showed "x1". Scene: kitchen table, ramp high-left with a car, "0 / 3 pieces" under the buttons. First thought: "which of these three pieces am I supposed to use?"

## First action
Clicked Help — a glossary far below the fold; the page scrolled, I lost the toolbar, and the "straight" text overlapped a piece render.

## Where I got stuck / guessed
- Holding drop enabled Place; status read "snapped — target: level start". Place incremented the counter, but a pixel-diff proved nothing rendered. I clicked Place guessing.
- No ghost under the cursor; drag didn't orbit; wheel scrolled the page, not the camera. I gave up finding any camera control.
- "target: end of finishCup" appeared while finishCup was greyed out — I couldn't tell what chain I was building or where the goal was (the cereal bowl?).
- After a run the camera stayed on empty floor; no reset found. Escape, 'r', clicking pieces — nothing. The view only returned after Remove piece.
- After runs every button reported enabled while looking dim, and clicking greyed "booster" left an unclear status. State and appearance disagreed; I stopped trusting the tray.

## Wish someone had told me
- Placement snaps to chain connection points; you don't aim with the mouse.
- Rotate before Place, or pieces sit flush and useless.
- After a run, an edit action (Place/Remove) returns the camera.
- Grey tray buttons = not in this level; the x1 ones are yours.

## Good moments
Remove = instant undo, inventory back, camera home. Camera chases the car mid-run. The end card diagnoses failure in one line: "the gap outran the landing." Rotate made the landing wedge click flush. Hidden line: "fell off the set — 2.02s — hash a7549cc0".

## Bugs that broke flow
1. Placed drop rendered nothing (0-pixel diff). 2. Post-run camera stuck on blank floor, no reset. 3. Help panel overlap + scroll-away. 4. Identical 2.02/2.04 s results across different builds — pieces felt physics-inert. 5. Tray enabled-state inconsistent with visuals after runs.

## What I'd show a friend
"Build a marble-run on a kitchen table — except you can't see where your piece lands until you launch, which is both the joke and the problem."