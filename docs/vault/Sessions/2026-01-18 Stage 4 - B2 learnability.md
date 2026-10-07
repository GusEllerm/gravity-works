---
tags: [session]
livedocs: snapshot
---
# 2026-01-18 — Stage 4: bedroom02 learnability redesign (the B2 pass)

Level Designer pass on `stage4-b2` (worktree `gw-ld11`). Playtest U cleared
the whole campaign to `bedroom02` and WALLED: every build of hers
(drop + landing + straights, all orders) printed "the line let go before
the cup" and died with nothing on screen to interpret. T reached the cup
but stopped earlier. Four items: replay her class headless and classify;
make the lesson learnable with the L02/L04 fail-timing tool; check the par
line is discoverable from tray + fixtures; par ≤ 4, tray = the authored
lines' multiset, BOTH routes finish, pars regenerated.

## 1. The death census (old geometry, shipped mount)

~110 headless `World` runs over every distinct subset-and-order of the old
tray, fixtures anchored at their par transforms. The class picture was as
bad as U's words:

- **13 of the 20 whole-tray orders FINISHED**, several faster than par
  (`lsssd` 2.22 vs par 2.367) — the par economy was fiction, and the cup's
  capture sphere (r = 0.072 m, center BELOW the deck plane) also let a
  deck running 0.12 m UNDER the mug finish (`dsssl` — the "solved" 3-piece
  run-out was a capture-sphere accident, not a line).
- **The 7 fallers died at 2.98–3.25 s**, 0.4–0.9 m PAST the anchored cup,
  at the far end of a deck 18 cm below the mug plane. Nothing visible at
  the death spot, the cup off-frame: that is the uninterpretable "the line
  let go before the cup". U's drop-first chains were all in this class.
- The cause is commutative socket arithmetic: with `drop` = −0.12 and the
  old `landing` = −0.0624, NO ordering of the tray can put the soft line
  on the high cup's deck plane. Ask #2b was never fixable at that geometry
  — the "both routes finish" card claim was chained-model only.

## 2. The geometry change (what shipped)

One deck plane for BOTH routes, plus a deeper mug line:

- Par line is now the PILLOW line: one 0.4 m deck, the `landing` re-authored
  as a SINK (`PILLOW_SINK` {level 0.31, angle 30, blend 0.06}, dy −0.1857),
  then the floor run. Par 4 tray pieces, 1.75 (measured 1.72).
- The STEP alternative keeps two high decks and takes the edge on the
  `drop` deepened to MATCH the sink (`PLATEAU_STEP` {height 0.19, angle 45,
  lead 0.0885}, dy −0.1900): the two decks pass the mug mouth 4 mm apart
  — inside the capture sphere — so the ANCHORED cup finishes both routes
  (chained 1.72 vs 2.47, anchored 1.83 vs 2.47, test-pinned; the old
  anchored-soft-falls pin is retired). Slam, not length, makes the step the
  slow road — the lesson flipped honestly: the soft sink beats the hard step.
- This rung seats its own 0.4 m decks (`BEDROOM02_STRAIGHT`) and its own
  −22° launch (`BEDROOM02_RAMP_ANGLE`, the L02 ramp-angle precedent). The
  angle tool is what separates the clocks: at the old −12° crawl every
  death compressed to 2.2–3.3 s; at −22° the runs are 1.7–2.5 s and the
  classes spread. `kitchenRamp`'s angle parameter widened to `number` —
  the only shared-kit touch.
- Reach law kept honest the topology way: the cup sits a whole crossing
  (0.78 m — two decks, or deck+sink) beyond ANY plateau end, far outside
  the ~0.25 m ballistic reach, so no omission skips a missing piece into
  the capture. Seeds 1–6 and launch jitter 0–0.1 stable; `s,l,s,s` and
  `s,s,d,s` finish at every seed.

## 3. The new fail stream (death-clock cap 2.6 s, test-pinned)

- Bare plateau / missing crossing: falls at the plateau END, 1.5–2.2 s.
- Crossing without its run-out: dies AT the step or pillow, 1.6–2.1 s.
- The double-drop (step AND pillow chained): a deck 19 cm below the mug
  plane, dies at its far end with the cup overhead, 1.9–2.3 s.
- U's whole class (`drop`+`landing`+2 straights, all 12 orders) fails at
  1.88–2.19 s AT or before the cup line — never invisible, never past 2.6.
- No build of ≤ 3 pieces finishes (test-enumerated over every order).

## 4. Discoverability (item 3)

The par line is chainable from tray + fixtures alone: the ramp lands on
the mattress, the mug stands on the floor past the edge, the ghost rings
mark the crossing, and the pillow is ONE piece at the SAME socket where
the step would sit — the choice is which tray piece to hold, not a hidden
socket. Nothing in either route is an invisible trick; the one physics
fact worth a caption is that the mug is deep enough to catch a deck that
passes 4 mm low or high, which is exactly how both routes finish.

## Files

`src/world/levels/bedroom02.level.ts` (full rewrite; `bedroom02SoftBuild`
→ `bedroom02StepBuild`), `src/world/levels/bedroom01.level.ts`
(`BEDROOM_STRAIGHT` comment names the 0.4 exception), `src/world/levels/
kitchen01.level.ts` (`kitchenRamp` angle widened to `number`),
`src/world/setPlacement.ts` (bedroom02 row re-derived
[1.25162, −0.48732, −0.15]), `src/world/pars.json` (regen: 4 @ 1.75),
`tests/unit/bedroom-levels.test.ts` (both-mount finishes pinned, ≤3-piece
enumeration, the 20-build death-clock battery, header note), docs
(`Concepts/Levels` bedroom02 card + floor-rule sentence + the two stale
cross-references, `Reference/Level Ladder` bedroom02 row + garage02/
bathroom02 cross-reference phrases). 574/574 tests green, `pars --check`
clean. The garage02 row still carries the plateau property garage02
itself measured — the parenthetical now says where that property came
from; a garage02 B2 twin is a future ticket, not this commit's claim.
