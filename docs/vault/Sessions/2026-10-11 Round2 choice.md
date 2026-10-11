---
livedocs: snapshot
---

# 2026-10-11 — Round 2, Lane A: the choice and the clocks (level designer, `r2-choice`)

Worktree `gw-z1`, branch `r2-choice`, base `main@95dad40`. The Action Plan
([[Reference/Action Plan 2026-10-11]]) Lane A, both items, measured first throughout.
Suite: 887 unit green, `replay:all` 30/30 verified, build clean, e2e encore/campaign/goal
lanes green on port 4781.

## A1 — kitchen02 is genuinely exclusive (the player evaluation's headline 1/2)

The round-2 evaluation ([[Reference/Evaluation 2026-10-11 player round2]]) seated FOUR pieces by
aiming the LAST ask PAST the cup (the ring's auto-follow puts a lip's open end past the mouth
plane — legal under the body-only guard) and 3★'d a seated off-list trio under the 1.05 par.
Two changes, both stated: (1) the placement guard on a guarded rung now REFUSES any seat whose
open end carries the goal tell — the cup's own exit or anything past the mouth (`builder.ts`
`place()`/`updateGhost()`, new refusal copy `blocked — the run ends at the cup, so nothing past it
is ever built`); (2) the PAR IS RE-ANCHORED from `straight → drop → straight` (1.01, parTime 1.05)
to the beater line `drop → straight → straight` — hash `8008b9aa` (moved), parTime 1.00 = measured.
Geometry untouched; `kitchen02ArcBuild` still finishes at 1.06 (2★, honest). The ORDER TABLE, all
24 click orders = 12 distinct outcomes (`scripts/k02-order-table.mjs`, regenerated for this note —
identical to the correction appended in [[Sessions/2026-10-10 P4 program shortlist]]; per order
×3). Seatings are `s`=straight, `g`=gapLip, `d`=drop; "refused(goal)" is the mouth refusal,
"refused(cup)" the body guard:

    d s s refused(goal)  FINISH 1.00 ★★★   ← the ONLY ★3 line (3 click orders)
    s d s refused(goal)  FINISH 1.01 ★★☆
    s s d refused(goal)  FINISH 1.02 ★★☆
    d g s refused(cup)   FINISH 1.02 ★★☆
    d s g refused(cup)   FINISH 1.02 ★★☆
    s d g refused(cup)   FINISH 1.03 ★★☆
    g d s refused(cup)   FINISH 1.06 ★★☆
    g s d refused(cup)   FINISH 1.08 ★★☆
    s g d refused(cup)   FINISH 1.08 ★★☆
    g s s refused(cup)   fell 1.12
    s g s refused(cup)   fell 1.17
    s s g refused(cup)   fell 1.15

LAW 1: every one of the 24 click orders refuses its 4th ask (no order seats four — unit-swept,
e2e-sampled at the evaluation's own orders). LAW 2: no permutation earns 3★ without seating the
authored `d s s` line — the off-list trios pay the clock (1.01–1.083), never the star; mis-seated
trios FALL. Why the par had to move: the lip-last seatings finish at 1.025–1.033 regardless of
which geometry sweep is tried (they are a physical dribble pop, invariant across lead/height/
blend — swept in `tmp/k02-*.mjs`, scratch), so under the 1.05 bar SOME order of the dump always
beat par; re-anchoring AT the measured 1.00 floor makes the star law order-invariant by
construction. Proofs: `tests/unit/goal-guard.test.ts` (rewritten: the 24-permutation sweep +
hash pin `8008b9aa`), `tests/e2e/goal-rung.spec.ts`, `tests/unit/set-wiring.test.ts` (pin moved).

## A2 — the encore death-clock stagger (P4 item 6)

Measured first: the plan's "all four die at the same 2.25 s" was folklore — the pair-collapse was
real (bedroom05 ≡ bathroom05 at the `1b37dfed` rail, garden05 ≡ garage05 at `1f99683a`) and the
canonical shared fail — `drop → straight → landing`, crossing two uncrossed — died IDENTICALLY
inside each pair (2.908 / 1.475). ~800 headless sweeps later the death clock proved largely
SELF-CANCELLING under height/lead/catch/release moves (arrival + fall); GRADE is the lever, and
each room's own law set fixed its cell. Final clocks, pinned in `tests/unit/encore-stagger.test.ts`
(pairwise minimum 0.308 s):

    rung        rail (after)                        canonical death   par (hash)          parTime
    garden05    −29°/0.24 chute, UNMOVED (anchor)   1.475             1.342 `1f99683a`    1.35
    garage05    −17°/0.24 chute, 0.22 m plate       2.008             1.958 `2e3aa2df`    2.0
    bathroom05  −12.4°/0.26 shelf                   2.792             2.858 `b986542f`    2.9
    bedroom05   −11.35°/0.26 shelf, 0.18 m plate    3.100             3.117 `5bfb2380`    3.15

Rejected by measurement (kept for the record — each was a full battery, not a guess):
garage −16/−16.5/−15.5° and every catch-wall stand-up (each either let the five-piece over-earn
FINISH FASTER than the par — the buy must stay a SUBSTITUTION — or spent the hidden line by moving
the anchored cup out of reach); bedroom height/plank/lead moves (death clock unmoved, par stalls,
or the last-spend trim drops into the cup gap); bedroom −11.35°@0.26 with the room's own 0.20 m plate (death ✓ every law ✓, but the eased crawl
lengthens the ramp and the chain lands at 1.4040 against the set floor-disc's 1.4 m gate — 0.19 m
still 1.5 mm over; the 0.18 m crossing plate is the cell that fits, at 1.3966 — the rug is a law,
`bedroomSetPlacement` re-derives x from the rail and the rail-containment test hard-fails);
garden −26° and every release-ratio move (the hidden line dies — garden05 stays the anchor);
bathroom every shelf-height move (clock unmoved AND laws) and −12.7°+ (deck-first starts finishing
at −12.7, the hidden line dies by −13).

Law deltas, honest: garage05's trim-era porch-clocked exceptions FLIP BACK with the shallower
grade — the mid bridge and the run-out plate KILL again (2.542/2.583, the original −12° law
measured true again at −17°) and the five-piece over-earn FALLS at 2.042 — every other law status
survives verbatim, only numbers move. bathroom05 keeps every law STATUS and restates TWO clocks in
the porch pair's established idiom: the mid bridge FINISHES 0.017 s LATE (2.875) and the run-out
drag compresses +0.39 → +0.26. bedroom05 restates ONE clock (run-out drag +0.39 → +0.14);
deck-first still FALLS (2.925), the mid still KILLS, the 11-omission promise wall is intact in all
four rooms, and each room's par stays beatable within the tray (3.000/2.650/1.817/1.225). garden05
is untouched by design: its −29°/0.24 chute is the fail-timing TOOL the rung's own law names.

Re-percussions: `pars.json` moves exactly four cells (k02 1.05→1.0, bathroom05 3.05→2.9,
bedroom05 3.05→3.15, garage05 1.35→2.0), the hash atlas regenerates (garden05's row unmoved), and
three setPlacement rows re-derive with their rails (bedroom05 1.38598/−0.573821, bathroom05
1.33977/−0.574409, garage05 1.14409/−0.585587 — the room tests re-derive every literal live).
Ledger: hashes moved are kitchen02 `0b4dbab2→8008b9aa`, bathroom05 `1b37dfed→b986542f`,
bedroom05 `1b37dfed→5bfb2380`, garage05 `1f99683a→2e3aa2df`; NOTHING else's hash moved
(replay:all 30/30 verified, atlas diff 4 rungs + date line). See [[Decision Log]] 2026-10-11,
[[Concepts/Levels]] §The encore death-clock stagger and §kitchen02, [[Sessions/2026-10-10 P4
program shortlist]] correction.
