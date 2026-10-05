---
livedocs: snapshot
tags: [session, stage-3, level-designer]
---
# Stage 3 — ladder coherence (Level Designer) — 2026-10-05

Two defects handed back from the playtest-fix crew, both stated as "a level
you can't build is not a level". One reproduced exactly (in a shape nobody
named), one did not reproduce at all — and the honest fix for the first turned
out to be a whole-family rule, applied to all six kitchen rungs and made a
test.

## What the hand-off said vs what the data says

The log (`Sessions/2026-10-05 Stage 3 - playtest fixes.md`) contains no tray
defect; the two claims to check were (a) `kitchen03` declares an empty tray
while its `parBuild` ships pieces, and (b) `kitchen05`'s tray does not contain
what its par build places. **Neither is in the tree** — no level file has ever
declared `tray: {}` (`git log --all -S "tray: {}"` is empty), L03 declares a
5-piece tray against a 9-piece reference build whose other four pieces are its
declared `fixtures`, and L05's tray is byte-for-byte the multiset its par
places. What DOES reproduce, immediately and everywhere:

**The par piece count and the piece counter are on different bases.**
`scripts/gen-pars.mjs` wrote `parPieces = build.pieces.length` — the whole
reference build, the book-stack and the cup included — while
`Builder.playerCount` (the tray counter, the budget gate, `starsFor`, the
panel's "N pieces — par M") counts TRAY placements only. On the deployed page
that is `"3 pieces — par 5"` on a three-piece tutorial: a 2-star line no run
can ever miss. `tests/e2e/loop.spec.ts` has been RED on `main` about exactly
this since the pars regeneration merged ("Expected substring: 3 pieces — par 3
/ Received: 3 pieces — par 5"). Measured before touching anything; the one
failure in `loop.spec`/`result.spec` at `HEAD`.

**And the tray seats one geometry per kind.** `levelTrayParams` takes a
kind's FIRST `parBuild()` placement and `createBuilder` ghosts/seats every held
piece with it — so any par chain using a kind at two sizes is a line NO tray
can place. L02 chained a 0.12 and a 0.25 straight, L03 a 0.1 and a 0.2, the
sandbox a 0.1 and a 0.25, and L04's par used 0.35 where its own ground line
uses 0.3. Replayed the way the builder mounts a level (`initialBuild` anchors
the fixtures, the tray pieces chain off them), L02's "placeable" par **fell**
— 0.13 m short of the anchored cup — and L03 finished on a line 0.1 m shorter
than the one it was par'd against. THAT is the defect the hand-off felt: a
tray whose counts add out but whose geometry the builder cannot seat.

## The rule, applied to every rung

`tray ⊇ parBuild` (every piece the reference build places is tray- or
fixture-afforded) **and** one geometry per tray kind. Where a level's second
line needs a piece its par line never places, the level now DECLARES that
kind's geometry (`trayParams`), so the choice pieces stop seating at kit
defaults:

| rung | tray | par places (tray basis) | change | par / parTime |
|---|---|---|---|---|
| `kitchen01` | 3 (`gapLip`,`drop`,`landing`) | 3 (whole tray) | geometry untouched, as instructed | 2.233 → par 2.25, `parPieces` 5 → **3** |
| `kitchen02` | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 3 | both straights → 0.18 m; `trayParams` declares `gapLip`/`landing` | 2.317 (unchanged) → 2.35; arc route 2.492 → 2.442 |
| `kitchen03` | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 5 (whole tray) | the bowl line re-authored: both straights 0.15 m, tray = the par's exact multiset, rim still seated THROUGH `BOWL_SOCKET_FRAMES` (`kitchenSetPlacement`) | 2.600 → 2.617 → par **2.65** |
| `kitchen04` | 5 (`gapLip`,`drop`,`landing`,`straight`×2) | 4 | the par's run-out straight → the ground line's 0.3 (the ground build left byte-identical so the zone, the tap's yaw and the par's wet==dry bit-identity do not move) | 2.567 → 2.517 → par **2.55** |
| `kitchen05` | 6 (`gapLip`×2, `drop`×2, `landing`, `booster`) | 6 (whole tray) | NOTHING — already coherent, now pinned by test | 2.392 → 2.40, `parPieces` 8 → **6** |
| `kitchen-sandbox` | all ×99 | 5 | both straights → 0.175 (the same 0.35 m of deck) | 2.642 → 2.667 → par **2.70** |

`npm run pars` re-derived all seven entries (`--check` green); every par still
finishes headless — `kitchen01` 2.233, `02` 2.317, `03` 2.617, `04` 2.517,
`05` 2.392, sandbox 2.667, plus `feeltrack` 3.05. The L01 three-piece promise
test is green and L01's geometry was not touched (its par entry was rewritten
identically by the regen; hash `d32417dc`).

Knock-on re-derivations (each annotated in place, none silent): the
`setPlacement` counter centre for `kitchen02` (1.0162 → 1.0112 — the cup moved
5 cm; `tests/unit/set-wiring.test.ts` recomputes and demands it), the pinned
par hashes there (`kitchen02` `8e06206a`, `kitchen03` `25e3e828`, sandbox
`7f008f48`; `kitchen01`/`04`/`05` byte-for-byte unchanged — L04's straight
change lands between two hash samples, so the sampled states are identical and
only the finish time moved), and the L04 chime time in
`tests/unit/juice.test.ts` (2.57 → 2.52).

## New seams and the new test

`src/boot.ts`: `levelTrayParams` (exported, now merges the level's declared
`trayParams` under the par build's tuned placements), `trayParityBuild` (the
build the SHIPPED builder produces when the player places the par line —
fixtures anchored, tray pieces seated at the tray's one geometry; the parity
probe, next to `initialBuild`, not a runtime path), and `playerPieceCount`
(the tray basis applied to a replay/share payload — the share-card star line
was counting fixtures too).

`tests/unit/kitchen-levels.test.ts` → **`kitchen ladder — tray ⊇ parBuild (a
level you cannot build is not a level)`**, data-level, three assertions per
rung: (1) per AUTHORED line (par + L02's arc + L04's ground + L05's two wrong
allocations) every piece is tray/fixture-afforded AND placed at the tray's
single geometry per kind; (2) `serialize(trayParityBuild(level)) ===
serialize(level.parBuild())` — the tray can place the par byte-for-byte;
(3) `PARS[levelId].pieces === level.par.pieces` — one piece basis. 245 unit
tests green, typecheck clean, `pars --check` green.

## Measured in the builder's mounting, honestly

The same lines replayed with the fixtures ANCHORED (how the game mounts a
level) instead of chained (how the cards measure them): L02's arc route
finishes in **2.242 s — faster than the lazy par**, and L04's ground line
**falls** because two straights stop short of the fixed cup. L05's wrong
allocations fall either way, so the trade-off holds. Those two card claims are
properties of the chained-cup data model and are now stated as such
([[Concepts/Levels]] §The same data replayed the way the BUILDER mounts it) —
both are `Level.finishSocket` (ask #2b). New **ask #4**: the builder cannot
seat a piece on a PROP socket, so even a steerable `bank` could not be placed
on the bowl's rim — L03's blocked half needs ask #1 AND ask #4.

## Fixed, measured, and one thing genuinely handed on

1. **L01 could not be built with the shipped target walk — FIXED here, in the
   UI lane's file.** `tests/e2e/shell.spec.ts` "building all three tray pieces
   launches, finishes…" is RED ON `main` (verified by re-running it on a
   stashed tree, and it is the only red besides `loop.spec`'s par line). Cause
   is not geometry: `targets()` lists free exits in ARRAY order and
   `initialBuild` mounts the fixtures FIRST, so once the `gapLip` takes the
   ramp's exit, index 1 of `[level start, end of finishCup, end of gapLip]`
   is the CUP's exit and the `drop` is seated on the cup — `fell` at 2.41 s,
   hash `0951a819`, reproduced by porting the target rule headlessly. The same
   three pieces seated on the RUN finish byte-identically to the par
   (`d32417dc`), which is why every data-level test stayed green over it.
   `place()` now moves the default target to the exit the piece just placed
   (`src/ui/builder.ts` — the Systems/UI lane's file; the arrows still walk
   every target, and ask #2b will move these targets again, so please review).
   Green on this branch.
2. `pars --check` in CI must keep running on the same physics build as the
   determinism tests (unchanged caveat); par TIMES re-ceiled where geometry
   moved (L03 2.60 → 2.65, L04 2.60 → 2.55, sandbox 2.65 → 2.70) — three
   rungs' 3-star line moves by ≤0.05 s.
3. **Still open, not mine to close:** ask #2b (`Level.finishSocket`) is what
   makes L02's "the lazy line is faster" and L04's "two routes" true in the
   game rather than only in the chained replay model — measured above. And
   ask #4 (prop-socket seating) is the other half of L03's bowl line.
4. `tests/e2e/visual.spec.ts` "game shell kitchen01 idle" is red on this box
   and red on a stashed tree — a platform-dependent baseline, not a change
   from this pass (the three kitchen-set baselines pass).

## Notes reconciled

`Concepts/Levels.md` (the tray ⊇ parBuild rule, `trayParams`, the tray-basis
pars section, the four re-measured cards, ask #4, the builder-mounting table,
guarded-by), `Reference/Level Ladder.md` (re-measured table, the pars-basis
rewrite, the two blockers, the new rule section), `Modules/ui.md` (seating
geometry from `trayParams`+par, and the target-follows-the-line rule in
`place()`), `Modules/src.md` (`levelTrayParams` export, `trayParityBuild`,
`playerPieceCount`, the share-card basis). `Modules/world.md` (the
`kitchen02` centre re-derivation), `Modules/camera.md` and
`Modules/sets-kitchen.md` mention files this pass touched
(`setPlacement.ts`, `boot.ts`) but their claims hold — the latter two
acknowledged.
