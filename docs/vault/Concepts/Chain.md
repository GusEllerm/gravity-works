---
livedocs: living
tags: [concept, freeplay, chain, share]
---
# Concepts/Chain — THE CHAIN (freeplay Lane C)

> [!abstract] Role
> The retention half of freeplay, stated as a machine: a share payload IS a link, racing one is a
> beat, a beat that shares itself carries its lineage, and the CHAIN anyone can check is the one
> THIS device walked. No server (the hash is the trust backend), no accounts (a name is a string,
> not an identity). Law'd in the Decision Log entry "THE CHAIN law greenlit" (2026-10-12); the
> acceptance scenario is the Sheet re-probe's challenge-half gap
> (`Sessions/2026-10-12 Sheet re-probe.md` — a named line published as a video of a goal, not as a
> goal; the friend's ghost race printing `you vs par` for the WRONG game). Owner: Systems Engineer.

## What shipped (and what it is made of)

- **Payload v2** (`src/share/share.ts`, `Modules/share`): the link grows `name` (the line's), `par`
  (the AUTHOR's measured reference run through the gen-pars rule — `parOfRun` is one home for
  `scripts/gen-pars.mjs`'s ceil), `goal` (the placed cup's transform, guard geometry copied from
  the build, presentation only) and `lineage` (the link whose ghost this run beat, by hash — since the final sheet probe the mode it reads is the ACCEPTANCE: a run that accepted a hashed link ends in friend mode, so a rebuild-to-beat mints its beat; Decision Log 2026-10-12, Ghost-law extension).
  Optional-on-read, mandatory-on-write-new: the share button stamps `v: 2` always
  (`src/boot.ts`), and **v1 links verify forever** — real v1 fixtures in
  `tests/fixtures/share-v1.json` replay to their embedded hashes and re-serialize byte-identically
  in CI (`tests/unit/share-v1.test.ts`), because a broken old link is a burned receipt.
- **The VERDICT ROW** (`verdictLine` in `src/ui/result.ts`, `Modules/ui`): racing a link's ghost
  against the LINK's own par prints `you vs <name>’s par` with the honest Δ; a v1 link without a
  par reads the ghost's own re-simulated finish (`their run`); a foreign-board link gets the honest
  refusal. While a link was raced the row CANNOT print the wrong game's `you vs par` — swept over
  every link shape (`tests/unit/chain.test.ts`) and proven live against the re-probe's exact tie
  scenario (`tests/e2e/chain.spec.ts`).
- **The LINES tab** (`createLinesTab` in `src/ui/levelselect.ts`, `Modules/ui`): the ladder becomes
  a DOOR, not the building. The seed — all thirty authored pars republished as links "published by
  the house", one click, ghost+par+name rows — then the device's chain walk, the links it published
  or raced, rows straight from the payloads under a rank sentence phrased as what it is (a count
  WALKED ON THIS DEVICE, `chainRankLine`). Badges never enter the rank — the NOT-an-input clause;
  since the final-sheet probe (2026-10-12) the panel ends in a READ-ONLY sheet footline (the
  badge counts themselves, `#gw-lines-sheet`, `Modules/ui`) — a face to look at, never an input
  to feed. The campaign stands as tutorial-spine-plus-seed-gallery:
  undeleted, unmodified, hashes unmoved.
- **The daily gains today's LINK** (`dailyLinkLine` in `src/save/daily.ts`): the seed fold that
  picks today's board picks today's link with it — the house line on that board, named on the
  daily's corner tag. The fold already was the curator; this only says so.

## The laws this rests on

- **The DOOR shows the CHALLENGE.** The `#s=` viewer page prints NAME · GOAL · PAR from the payload's own v2 fields (`#gw-replay-payload-line`, `Modules/share`) — presentation only; a v1 link stays silent.
- **No hash near any of it.** The cup-goal is guard geometry the guard already places from BUILD
  (`World` reifies the last player `finishCup`; `cupGoalFromBuild` COPIES that transform, never
  recomputes); the verdict reads the cup from BUILD; the payload fields never enter a step loop.
  The gate is a test, not a claim: kitchen01's par build hashes to its atlas receipt `d32417dc`
  with the whole v2 layer mounted around the replay, and `replay:all` stays 30/30 byte-same
  (`tests/unit/chain.test.ts`, `Modules/replay`).
- **Single-machine phrasing everywhere.** Chain rank is verifiable from payloads, walked on THIS
  device — never a global number (the score-normalized rank is the class of lie the 7.5 bought
  protection from; a server was rejected: the hash is the trust backend).
- **THE TALLY's badges are NOT rank inputs** (Decision Log 2026-10-12, TALLY law addendum): the
  chain store never reads `records.badges`; the sheet and the chain are siblings under
  `settings.records` with the ride law so neither can erase the other (`Modules/save`).
- **v1 is forever.** The schema's one true point of no return was spent the day the first v2 link
  was written; both directions are fixture-tested so nothing written before today can die.

## Guarded by

`tests/unit/share-v1.test.ts` (the fixtures verify forever, both directions), `tests/unit/chain.test.ts`
(the verdict-row impossibility sweep, the chain store and its ride, the goal's guard geometry, the
hash-neutrality receipt, the gen-pars rule, the daily fold), `tests/e2e/chain.spec.ts` (seed thirty
playable, the named-line publish into a v2 payload, the beat-a-friend verdict row live), `tests/e2e/lineage.spec.ts` (the CHAIN's middle link: paste → beat with skill → publish → the row SHOWS the lineage → two fresh-context devices verify the chain of two; the viewer page's NAME · GOAL · PAR line; the v1 silence), `tests/e2e/ghost-purity.spec.ts` (the ghost MOUNTING law the chain leans on — mounted runs are unmoved runs), plus the
unchanged families: `replay:all` 30/30, `share.test.ts`, `ghosts.spec.ts`, `tally.spec.ts`.

## See also

[[Decision Log]] 2026-10-12 (THE CHAIN law), [[Concepts/Freeplay Exploration]],
[[Modules/share]], [[Modules/save]], [[Modules/ui]], [[Modules/replay]], [[Modules/tally]],
`Sessions/2026-10-12 Sheet re-probe.md`, `Sessions/2026-10-12 Freeplay chain.md`.
