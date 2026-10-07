---
tags: [session]
livedocs: snapshot
---
# 2026-10-09 — Stage 4: kitchen02 fail-timing redesign (second L02 pass)

Level Designer pass on `stage4-l02c`. Two briefs: (A) L02 — nine distinct
wrong builds AND first tries all die at ~2.2 s with identical invisible
timings ("the car vanished out of sight"); redesign so wrong-but-plausible
builds fail EARLY and DISTINCTLY on the near rail, executing the
predecessor's standing finding that the ramp's angle (−12°, 1.43 m crawl)
is the CLUSTERING ENGINE — sweep steeper launch ramps × void sizes.
(B) L01 — replay N's failing chain vs the winning build headless and, if
chain ORDER is the variable, reorder the fixtures.

## L02 — the sweep and the verdict

Deleted the predecessor's committed scratch probes first (they duplicated
what the harness re-proves), then wrote fresh ones (`.ld8-*.mjs`, kept
uncommitted per the brief). ~25 000 headless `World` runs on the shipped
builder's mount (fixtures at par transforms, tray chains off the ramp exit),
gridding angle × height × drop geometry (void height × lead) × lip ×
straight span × lip angle — sweeps 1–10 plus shortlists and a dedicated
belly-hop probe. Four laws came out of it:

1. **The death clock = ramp-end arrival + flight + a constant ~0.4 s fall to
   the floor plane** (floor = lowest deck − 0.75). The crawl-to-ramp-end is
   paid by EVERY build, right or wrong — which is exactly why −12°/0.28 m
   clustered all nine wrong builds at 2.2–2.4 s. Angle moves the clock only
   through height; the separation must come from WHERE the wrong build can
   die, and a build can only die early where the rail it fails to cross is
   near the ramp end.
2. **A belly hop across a flat air gap dies at ≥ 0.10 m** — with NO hop
   distance at all (the nose dips, the belly keeps the car, the wheel
   never catches). Below 0.10 the gap wedges/captures and COMPLETES. This
   is what killed the 2-piece drop-pairs (their gap is exactly one
   `straight` by the reach law — so the straight had to grow to 0.11).
3. **No flat-socket void separates a lip catapult from a drop catch**: the
   intended lazy catch and the fluke landing share the same flight-distance
   window; a `gapLip` launch off any level deck pops ~0.25–0.35 m, so a
   void that swallows bridges also swallows the arc line's catch. Every
   single-cell candidate the grid produced violated one constraint until
   the CLOCK was moved instead of the geometry.
4. A DROP-FIRST big-void architecture kills everything early (all wrong
   builds die at the ramp-exit void, 0.86–1.16 s, zero wrong finishes) but
   costs the lesson (order-invariant sums → no arc, no beatable par) —
   explored and rejected, kept here so nobody re-pays it.

## L02 — the shipped geometry

`kitchen02.level.ts` (all deviations local + declared, the tray seats them
via `trayParams`): ramp `angle −29`, 0.16 m, **blend 0.12** (its own knob —
the 0.08 blend passed every rail law but left the run camera pitched down
the chute while the car was already at the drop: |ndc| 0.99 > the 0.95
camera gate; 0.12 eases it to 0.89 and keeps every law; 0.14 is
camera-clean but STALLS one whole-tray order — the laws are not
blend-invariant); one `straight` 0.11 m = the `gapLip` span (deck 0.0405,
12°) — the reach-sum law intact; `drop` step **0.10 m** with 0.125 m leads
(at the ladder's 0.12 step NO lead stopped the `gapLip → drop` pair
wedge-capturing the cup lip and finishing at 1.01 s = a 2-piece three-star;
0.10 is where the belly-kill and pop-catch thresholds coexist).

Verified on the full 34-build enumeration (test-pinned): both lines finish
— lazy `s,d,s` 1.01 s (par **1.05**), arc `g,d,s` 1.07 s (the pop costs the
hop); par beatable by `d,s,s` at 1.00; ALL 12 whole-tray orders finish
1.00–1.13 s; seeds 1–6 and launch speeds ×1.0–1.1 stable. **No wrong build
finishes** — the fail stream now says what went wrong:
~0.87–0.97 s bare/flat (off the ramp end INTO the void, at the rail),
~1.05–1.07 bridged decks (land IN the void a rail out), ~1.12–1.18
bridge+lip catapults, ~1.23–1.28 drop-pairs (cross the visible catch, fall
off its far deck). Both former pinned exceptions are dead at this geometry
(the `s,s,g` catapult falls at 1.15; the `g,d` wedge falls at 1.27) and
the "never past the cup" gate now samples the last point ABOVE THE DECK
PLANE — the old floor-plane x drifts ~0.5 m and could not see flyovers.
`setPlacement` kitchen02 row and the par hash re-derived (0.51896, −0.27918
/ `0b4dbab2`); pars regenerated; 508/508 tests green.

## L01 — the verdict: NOT chain order

Replayed N's exact chain and the winning build headless on the shipped
mounts. The real variable is the FIRST-PLACEMENT TARGET, not order: any
chain that starts from the RAMP EXIT completes (`drop → gapLip → landing`
chained finishes at 2.37 s; N's `landing@ramp-end + gapLip-last` won at
2.13) — but seating ANY piece at the "level start" socket (the builder's
`targets()[0]`, a flat socket ON THE RAMP BLEND) buries the car's launch and
kills the run at ~2.0 s regardless of what follows. N's first Three-Ways
build fell to the same trap. No reordering of a level-file array changes
this — fixtures are anchored by transform and `targets()` puts level start
first by construction. **HANDOFF (systems lane, `src/ui/builder.ts`):** for
levels with fixtures, the FIRST placement's default target should be the
first fixture exit (ramp end), not `level start` — or `level start` sorted
last for non-empty-fixture levels. No kitchen01 geometry change; its par
(3 @ 2.25) and all pins untouched.

## Files

`src/world/levels/kitchen02.level.ts` (geometry + header), `src/world/
setPlacement.ts` (kitchen02 row), `src/world/pars.json` (regen),
`tests/unit/kitchen-levels.test.ts` (contract exception + L02 chute test,
34-build fail-family test with the deck-plane x gate, both old exception
tests rewritten), `tests/unit/set-wiring.test.ts` (hash re-pin),
`docs/vault/Concepts/Levels.md` + `docs/vault/Reference/Level Ladder.md`
(L02 card + row).
