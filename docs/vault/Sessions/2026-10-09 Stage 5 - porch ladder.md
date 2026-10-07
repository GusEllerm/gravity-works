---
tags: [session, stage-5, level-design, porch, ladder]
related: [[Concepts/Levels]], [[Reference/Level Ladder]], [[Sessions/2026-10-09 Stage 5 - porch production set]]
---

# Stage 5 — porch ladder (Level Designer)

Authored the SIXTH room's ladder: `porch01..porch05` on the merged
porch set, wired the rung into `campaign.ts` (the porch room + the
`garage04 → porch01` handoff + unlock copy), and extended every gate.
The set itself is the previous session's (`Sessions/2026-10-09 Stage 5
- porch production set`); this log is the LADDER pass.

## The numbers (all `npm run pars` output, `src/world/pars.json`)

| rung | par pieces | par time | par build measured | headline measurements |
|---|---|---|---|---|
| porch01 | 3 | 1.10 | 1.058 | 6/6 orders 1.017–1.083; omissions die 0.867–0.967 EARLY + one 1.275 family |
| porch02 | 4 | 1.20 | 1.158 | deck 1.158 < door 1.250 both mountings; 20/20 orders 1.142–1.358 |
| porch03 | 4 | 1.25 | 1.242 | bounce 1.125 beats par; 22/24 orders; NO subset finishes (0.967–1.408 all fall) |
| porch04 | 4 | 1.10 | 1.083 | 24/24 orders 1.083–1.367; belly dies 1.475; shortcut finishes 1.250 (> line) |
| porch05 | 4 | 1.20 | 1.192 | catch-first 1.392; 12/12 orders 1.117–1.475; beat 1.117; shortcut 1.267 (> line) |

Pars regenerate clean (`npm run pars`, 28 levels); every par ≤ 4 pieces;
tray ⊇ par on every rung (the cross-ladder roster covers the porch door,
bounce and catch-first lines).

## The doctrine this ladder had to LEARN (the hard lessons, honestly)

1. **THE SINK IS A UNIVERSAL BRIDGE.** porch03's first shape carried a
   fifth piece — a 21° sink ramp — so its trade-off line could run out to
   the cup. The sweep (`tmp/porch-sweep.mjs`) then kept finding
   `landing → drop → straight` finishing UNDER the par clock at any sink
   angle/blend tried (1.008–1.083): the sink caught the ramp's own chute
   drop and became a no-lip, no-lesson bridge across the whole tray. The
   cure is kitchen03's shape — THE TRAY IS THE PAR, no landing in the
   tray at all — which is why porch03 is an ORDER rung on the pinned step
   and the sink lives only in porch04/porch05, where every line still
   needs its pops. The doctrine: a soft-catch piece may exist in a tray
   only where no line reaches by sinking into it.
2. **PIN THE STEP WHERE THE BELLY IS THE LESSON.** The ladder's stock
   trench (0.10/45) lets a belly ROLL a trench — porch04's order lesson
   needs it to DIE, so the porch step is pinned at 0.14 m / 55° / r 0.005
   with the SPAN preserved (0.35) so every reach equality survives
   (`PORCH_STEP`, tuned by `tmp/porch-tune.mjs`, pinned by the ladder
   test: the belly build dies at 1.475 while all 24 orders finish).
3. **BOTH ROUTES ANCHORED IS CHEAP WHEN THE SPANS ARE EQUAL.** porch02's
   deck/door swap and porch05's two crossings all finish chained AND
   anchored because the swapped pieces carry the same span BY CONSTRUCTION
   (the sink's span == the pinned step's == the stock trench's). Where
   spans differ, ask #2b bites and the card says so.
4. **THE CHUTE TOOL IS NON-NEGOTIABLE.** Every rung launches at
   −29°/0.16 m so no wrong build crawls past ~1.5 s; the death-clock
   families (0.87–0.97 ramp-end, 1.05–1.25 far-deck, 1.25–1.48
   wedge/late) are the honest part of every rung card.
5. **A MISSING `startSocket` ARGUMENT LOOKS LIKE PHYSICS.** A full
   afternoon of "every porch03 build finishes at 15.0 s with one hash"
   was `startSocketFromBuild(build)` without the release parameter — NaN
   spawn, not geometry. The sweeps that "contradicted each other" were
   both artifacts; the fix is one argument, the lesson is: when EVERY
   build in a level shares a hash, doubt the SPAWN before the surface.

## Staging honesty (the claims that are NOT made)

- The threshold pair is STAGING: `door.in`/`door.out` sit inside the deck
  bounds, travel axis ACROSS the +x lane, test-pinned; no ride through
  the door is claimed (ask #4 behind a lane-crossing anchor — the porch's
  ask, below).
- Zero live hazard zones on every rung BY LAW (`hazards` absent-or-empty
  test-pinned; `HAZARDS` empty in the set module). Rain is a later wave
  with enforced physics or it is shade, never a painted lie.
- The ride-through claims the other rooms needed asks for are not
  invented here; porch01's flight and porch02's door-pop are the same
  tray verbs, honestly re-skinned.

## Placement (the table is derived, not folklore)

`PORCH_AXIS_OFFSET` = 0.53 (53 cm back): the ROOF CORNER POSTS (set z
+0.421) are the forward-most dress solid, and the test sweeps EVERY
`dress` mesh's live group box against the corridor at every mount (all
≤ −10 cm). The rows (x = rail midpoint on the 0.005 grid, y = LOWEST
authored finish deck − clearance − `DECK_Y` 5 mm, yaw 0) are re-derived
in `tests/unit/porch-levels.test.ts`, same rule as every flush-paving set.

## Asks (for the queue, one paragraph each in Concepts/Levels)

- **#P1 (a porch ask, pattern of #8b):** a lane-CROSSING prop anchor —
  the door pair wants a marble that TRAVELS through it (the bathroom
  drain / garden bore / garage wheel pattern needs a bore ALONG the lane;
  the porch's crossing is ACROSS it). Behind ask #4's prop-socket seating
  and ask #1's player build; porch02's sockets are ready when it lands.

## Files this pass touched (beyond the five level files)

`src/world/campaign.ts` (the porch room, unlock copy, `garage04.next =
porch01`, `porch05.next = null`), `src/boot.ts` (imports + the
`void [...]` registry line), `src/world/setPlacement.ts` (`PORCH_ROWS`,
`PORCH_AXIS_OFFSET` — the only numbers outside the level files),
`scripts/gen-pars.mjs` (the five imports), `src/world/pars.json`
(generated), `tests/unit/campaign.test.ts` (ladder rows, the boundary
now ends at porch05), `tests/unit/boot.test.ts` (the ladder walk),
`tests/unit/bedroom-levels.test.ts` (the roster is SIX ladders),
`tests/unit/porch-levels.test.ts` (NEW — the rung gates),
`tests/e2e/campaign.spec.ts` (garage04's Next lands on porch01 with the
porch mounted — the sixth room is REACHABLE through the real UI),
`tmp/porch-sweep.mjs` + `tmp/porch-tune.mjs` (the sweeps; the numbers
above are their output), this log, and the two vault docs.

## Gate state at commit

`npm run typecheck` clean; `npx vitest run` — 659/659; the campaign e2e
spec — 5/5 (the porch reachability test included). `npm run pars`
regenerated; `--check` passes.
