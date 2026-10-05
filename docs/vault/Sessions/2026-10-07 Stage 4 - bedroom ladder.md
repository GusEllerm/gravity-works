---
livedocs: snapshot
tags: [session, stage-4, level-designer]
---
# Stage 4 — bedroom ladder (Level Designer) — 2026-10-07

Four rungs on the ratified bedroom set (`src/sets/bedroom/data.ts`), authored
to mirror the kitchen five EXACTLY — fixtures + tray + `parBuild` +
`trayParams` + `propSockets` — under the hard-won stage-3 invariants
([[Sessions/2026-10-05 Stage 3 - ladder coherence]]): tray = the multiset
`parBuild` uses, ONE geometry per kind per level, star-gated progression,
small budgets. Every par finishes headless under the shipped launch defaults
(default launch speed 0, the raycast car, `replayRun`); par builds are ≤ 4
tray-basis pieces; the tray ⊇ par invariant now runs over BOTH ladders.

## The four rungs (measured, `npm run pars` regenerated)

| rung | lesson | tray (budget) | par pieces / time | measured |
|---|---|---|---|---|
| `bedroom01` Cable Dip | the cable is RIDDEN OVER, not flown — the tray holds no `gapLip` at all | 3 (`straight`×2, `drop`) | 3 / 2.35 | 2.350 s; every omission (`bare`, `drop`-only, `straight`-only, either single straight missing) `fell` against the anchored fixtures; all 3 whole-tray orders finish |
| `bedroom02` Pillow Plateau | a choice off the mattress: stay high or drop to the pillow — the lazy HIGH line is the fast one | 5 (`straight`×3, `drop`, `landing`) | 3 / 2.40 | high 2.367 s < soft 2.575 s (chained, both finish); anchored: soft `fell` (runs 18 cm under the cup deck), `SS` partial `fell` |
| `bedroom03` Pyramid Air | one launch, two catches — WHICH CATCHER you buy is the trade-off | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 4 / 2.70 | hard `drop` catch 2.667 s < soft 0.32 m `landing` 2.708 s (chained); whole tray (5) finishes EVERY order sampled (2.483–2.558 — beats par, loses the pieces star): no Playtest-G wall |
| `bedroom04` Lights Out | everything, one tray, no guesses — the tray IS the answer | 4 (`straight`, `gapLip`, `drop`, `landing`) | 4 / 2.70 | ALL 24 whole-tray orders finish anchored (2.467–3.300 s); par ORDER beatable (`drop→landing→straight→gapLip` 2.467 s) |

Geometry economy: one 0.20 m `straight` geometry across 01–03 (04 carries
the kitchen L04 sweep's 0.30 m on purpose — its 24/24 order-invariance was
proven at that size); the `KITCHEN_GAP` drop is the cable dip everywhere;
start ramps 0.28 (01, 02) / 0.30 (03) / 0.26 (04, so the sweep inherits L04's
exact physics). `trayParams` declares `drop`/`landing` on 02 and `landing` on
03 — the pieces the par lines never place. The lamp-shadow drama on 04 is
pure staging: the practical is the set's own `LAMP.bulb`; no level touches
light or grip (the ratified variant declares no hazards, and none were
invented).

## Set placement as level craft (the one new rule)

`bedroomSetPlacement` (`src/world/setPlacement.ts`, four data rows,
test-derived) mounts the ratified set UNDER the run: x = the par rail's
midpoint, yaw 0, z −0.15, floor 5 mm under the LOWEST authored line's
finish deck. Two numbers the whiteboard got wrong and the ruler fixed: the
bedroom rails are 2.2–2.5 m (a 12° ramp's flat run for a 0.28 m drop is
1.33 m — the kitchen's own rails are just as long, its rectangular counter
hides it), so the 2.8 m floor DISC must centre on the run or the far cup
falls off the floor edge (first draft had `bedroom01` ending 3.7 cm off the
disc — caught by the rail-sampling test before it ever reached a frame);
and bedroom02's floor follows the SOFT line's deck, because a choice
level's floor may not bury a line the player can run. The −15 cm z-slide
puts the homework 14.6 cm off the lane (analytic AABB test) and keeps every
named solid clear of the corridor.

## What did not survive contact with the sim

* **Cable collider**: sets are VISUAL mounts (the kitchen rule, re-stated by
  the stage-4 AD note) and the ratified variant declares no hazards — so
  "cable = slow it down" is taught by the `drop` the deck dips into, and the
  cable itself stays the set's fourth voice. Stated as ask #5b.
* **The drawer tunnel**: yawing the room so the bore meets the +x lane
  lands the BED (0.255 m behind the dresser along the bore axis) and the
  PYRAMID (0.36 m the other way, at 121° yaw) straight onto the corridor —
  guard boxes where the tray must seat. And `drawer.in`'s tangent points OUT
  of the bore (`+DRAWER_AXIS` at the front face), against the bowl-pair
  convention "tangent is the direction of travel". bedroom03 therefore
  ships the two authored lines it can prove, exports the placed
  `drawer.in`/`drawer.out` frames as `propSockets` (the bowl-rim
  convention), and files the fix as one sign flip + one lane-crossing bore
  anchor (ask #5a) — not a remodel.
* **bedroom02's anchored truth**: the soft line only finishes in the
  chained model (ask #2b bites harder here than on kitchen02's arc table
  row — its finish deck sits 18 cm below the anchored cup). The card says
  so and the test pins both numbers, so the claim cannot drift into
  folklore.

## Files and gates

`src/world/levels/bedroom01..04.level.ts` (01 also carries the shared
bedroom authoring kit; the placement math is imported from
`kitchen01.level.ts` — it is the FAMILY's kit, the file comment says so);
`bedroomSetPlacement` + the registry row in `src/sets/index.ts`
(`placement: () => null` → the table — the session-log's "first garden
level will want a table row" carry-forward, paid for the bedroom);
`src/boot.ts` imports the four rungs and `LADDER` walks
`kitchen05 → bedroom01 → … → bedroom04` (star-gated `Next` as everywhere);
`scripts/gen-pars.mjs` imports them; `src/world/pars.json` regenerated
(11 levels; every kitchen row byte-identical — nothing upstream moved).
`tests/unit/bedroom-levels.test.ts` (new): pars finish, contracts, the 01
only-fit promise, both lines of 02/03 with the anchored reality pinned,
the 03 no-wall whole tray, the 04 24/24 sweep + beatable par, the placement
table derived from the live builds, drawer sockets exported and inside the
floor bounds, plus the describe **"ladders (kitchen + bedroom) — tray ⊇
parBuild on EVERY authored level"** — the invariant test extended to all
levels, kitchen rungs included. `tests/unit/boot.test.ts`'s ladder-walk
test updated for the new tail. 329 unit tests green, `pars --check` green,
typecheck clean.

## Handed back

Ask #5 to the Environment Artist (tangent flip + lane-crossing bore anchor
+ cable crossing anchor), which composes with ask #4 (Systems: prop-socket
seating in the builder) to make the tunnel a buildable third line. No
blockers on the shipped four: every par finishes, every claim is a test.
