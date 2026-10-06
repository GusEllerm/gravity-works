---
livedocs: snapshot
tags: [session, playtest, levels, ux]
---
# 2026-10-08 Playtest K — fresh-eyes, live site

Stranger pass over `gusellerm.github.io/gravity-works` (fresh session, browser only).

## 1. Route played (in order)

kitchen01 "Book Drop": 3 tries to understand placement, then 1 launch — ★★★
(2.13 s vs par 2.25, 3/3 pieces). kitchen02 "Two Ways": 3 builds, 3 launches,
all "fell off the set" (3.14 s, 3.10 s, 3.06 s; par 2.35). Level select, then
back into kitchen01 — build was empty, one more launch: "fell off after a long
jump", 2.04 s. Stopped. Never saw The Bowl or beyond (locked).

## 2. Level select as a teacher

Honest and mostly good: rooms Kitchen/Bedroom/Bathroom/Garden × 5, disabled
buttons literally labelled "locked", and one line that finally explains
everything — "A level opens when the level before it earns at least one star."
It was placed at the top where I read it last. Two stings: returning from the
select into a starred level silently hands me a wiped build (stars kept), so
"★★★" + empty tray reads as a bug; and plain-text/screen-reader view shows
locked levels as "☆☆☆", which looks merely unstarred, not locked.

## 3. Best single picture

Room: kitchen (Book Drop). The red car parked inside the coffee-cup finish on
the tablecloth, toast and sticky note mid-air behind it, ★★★ stamped over it.

## 4. Stuck / guessed, per room

- kitchen01: how placement works at all (hold → ghost → click world or Place);
  the first drop landed in dead air and I couldn't tell where it joined.
- kitchen02: which end is the goal — I built away from the cup twice; what
  par 3 pieces means when the tray holds straight ×2 (did I need them?);
  Rotate never visibly changed anything I could confirm.

## 5. Uninterpretable words/numbers

"target: end of drop" when no drop was placed; "no drop left in the tray";
"fits here" with no position shown; "fell off the set — the line let go before
the cup" after a run that visibly finished; "×N counts the pieces left to
place" vs "4 of 5 pieces used"; camelCase piece names (gapLip, finishCup);
"determinism fingerprint" line.

## 6. Broken interactions

World-click while holding gapLip: placed nothing, said nothing. Remove-mode
clicks on empty floor: silent, no "nothing there". Enter did not Place despite
"Place: click the world or Enter". Clicking a tray button yanks the page to
top. Back-from-select wipes the build without warning.

## 7. Camera

During runs it tracks the car convincingly; in build mode I found no orbit/pan
at all and only scrolling the page revealed the table.

## 8. Friend test

Yes — at the exact moment kitchen01 stamped ★★★ on my accidental build,
caption: "one try, three stars, but room two took my whole afternoon."
