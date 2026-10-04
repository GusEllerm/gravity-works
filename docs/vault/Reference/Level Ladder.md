---
tags: [reference, levels]
---
# Level Ladder

> [!abstract] Role
> The ladder of levels the game ships with — the registry in
> `src/world/levels/` (`LEVELS`, `getLevel`), one file per level, each a
> plain-data `Level` plus a kit-piece `Build`. This note tracks which rungs
> exist; the design of the ladder itself is stage 3+.

## Current rungs

| Level id | File | Status |
|---|---|---|
| `feeltrack` | `src/world/levels/feeltrack.level.ts` | the only level that exists — the data-driven kit feel track (`chain(FEEL_TRACK_KINDS, { params: FEEL_PARAMS, ... })` imported from `src/feel/feeltrack.ts`, never copied); kitchen-neutral test track, not a designed level |

Stage 3 fills the actual ladder (the brief's five kitchen levels with budgets
and pars; `Level` already carries `budget` and `par` — see
[[Modules/world]]). Until then `getLevel` resolves exactly one id, and share
links, replays and the builder all ride that single rung.

## Notes

- The `Level` shape is the contract: `{ id, name, seed, startSocket, budget,
  par, maxTime, placeholderBuild() }` — a level is serialisable and a replay
  needs nothing more than (level, build, seed) ([[Concepts/Track Kit]]).
- Piece budgets/pars so far: `feeltrack` is the accept-line level, budget 16.
- Nothing here blocks stage 2: the spine is proven on one rung by design.
