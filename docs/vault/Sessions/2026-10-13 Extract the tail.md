---
tags: [session]
livedocs: snapshot
---
# 2026-10-13 Extract the tail — Lane F3, salvaged at the finish line

The lane died on the wire between "full e2e green (304 passed, 1 conditional skip)" and its AFTER
mutation ledger; the tree was complete and uncommitted. Salvaged by the program lead: notes
reconciled, ledger run, this note written in its place.

**The move, measured:** `src/boot.ts` 2,603 -> **1,595** lines. The run-end tail block (tally
`accumulateBadges`, the records reads, the verdict/chain/ghost wiring) left the `bootGame` closure
for `src/pages/runEnd.ts` (plus `src/pages/ghostLinks.ts` and `src/camera/framing.ts` where the
tail's legs were already standing); the 23 `__gw*` seams keep their exact names for the specs.
Pure moves — no behavior, no bytes of sim.

**The acceptance, per the engineering evaluator's own six mutations** (`tools/mutate-acceptance.sh`,
before vs after at `9d8a739`-family and the extraction tip): **identical RED sets — 7 red lines
across the six ledgers both sides** (M1 input law, M2 tally hash-on-read, M3 v1-writer, M4 seating,
M5 ghost.sync coupling, M6 pixel enforced-views x2). The laws kept every tooth through the move.

`replay:all` 30/30 byte-same; e2e 304 green pre-death and ledger-clean after; the hated file is
retired on schedule (`Reference/Evaluation 2026-10-13 engineering house era` N3).
