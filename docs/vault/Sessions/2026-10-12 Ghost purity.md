---
livedocs: snapshot
---
# 2026-10-12 Ghost purity (Systems Engineer — the final sheet probe's items (d), (a), (b))

Snapshot session note (never checked). Branch `fp-ghostpure`, worktree `gw-g1` (outside the repo root), base main
`4a76206`, `npm run build` + `vite preview` on **ports 4990/4992**, fresh browser contexts per device; THE LEDGER:
the probe's ghost-seating fault closed as AUDIT + PROOF, the CHAIN's middle link made mintable (one flag deep),
and the friend's viewer door made to show NAME · GOAL · PAR.

## (d) The ghost that shifted the run — mechanism, resolved

The claim: identical 4-piece build, 0.57 s with the par ghost ON vs 0.67 s OFF; the re-probe's bedroom
2.80/2.83/2.83/2.80 split "correlated with record/par ghost mounts". The audit, before any code: **no ghost lane
adds a physics body anywhere** — `GhostRace` is a translucent Three.js rig (the car-rig precedent), every wind
(`deriveGhostTrace` → `TapeRecorder`) steps a FRESH `visuals:false` `World` and `free()`s it, `attachScene` moves
scene nodes only, and the whole coupling remains the one `sync(world.time)` line. Repo-wide, `createRigidBody`
lives in exactly three physics files. Node probes: baseline / wind-before / wind-interleaved-BESIDE-a-live-run
— bit-identical (`ae77c69c`). Page probes on the shipped build, identical bytes per state (sha of
`__gwBuildJson` pinned each time): kitchen-sandbox 4-piece player build `0303e226` @ 2.31 s for par cold-wind /
par cached / ghost OFF / record mirror (minted, cold, mid-run, toggled, cold page) / pasted friend / retry;
kitchen02 tray seating `683d98aa` @ 1.15 s ON vs OFF; porch friend lane `35b2c113` @ 0.32 s mounted vs off;
**0.57 s re-sighted byte-exact as `bbc4df19` — the friend's rail-shortcut build itself** — and 0.67 s is the
AUTHOR's differently seated `storm front` cup: two builds, one crossed attribution (the journal's own return
trip prints −0.03/0.57 = the mirror tie determinism promises). The re-probe's 2.80/2.83 shape reproduced ONLY
across a remove/re-place cycle — the ring re-aims after removes (the builder's own law, kitchen02 `33d67cad`
1.15 vs the re-seated `234f959d` 0.87 — different BYTES, not a mounted ghost). What the law lacked was teeth:
**`tests/e2e/ghost-purity.spec.ts`** now launches the fixture bytes with every source mounted (par trace,
your-best mirror, pasted friend, chain row `?link=`, house row `?line=house`, cold page) and asserts the run
hash AND the printed finish equal the Node `replayRun` of exactly those bytes; `tests/unit/ghost.test.ts` adds
the Node trio (interleaved wind, winds-before, and the rig `attachScene`d INTO the live scene). Any ghost that
ever becomes a body fails them red — the MOUNTING law is now proven, not asserted.

## (a) The CHAIN's middle link — the one-flag fix

`beatLineage` gated on the ghost RAIL's current mode, which the honest edit-lift ("your edits replaced their
track") clears exactly when a friend rebuilds to beat — the verdict row was right (it reads `racedLink`) and
the receipt was thrown away. One flag deep: a run that ACCEPTED a hashed link ENDS in friend mode — lineage
reads the SAME acceptance fact the verdict prints, not the visual state. **Red-first receipt**: reverting the
one term and re-running `tests/e2e/lineage.spec.ts` prints `lineage=NONE`; with the fix the friend's chain row
carries `lineage={hash: 7d9871a9, name: the long line}` and the e2e walks the probe's unfinished scenario end
to end: paste → beat with skill (determinism keeps mirror ties un-mintable) → publish → the row SHOWS the
lineage → **two fresh-context devices verify the chain of two** (`verified` twice, the beat link pointing at
the author link by hash).

## (b) The door shows the challenge

`#gw-replay-payload-line` on the `#s=` viewer page prints `“name” · the cup at x, y, z m · par t s` straight
off payload v2 (`name`, `goal`'s translation, `par`) — the probe's "beautiful film with hashes and no name
anywhere" is closed; a v1 link prints NOTHING new (the absent-field law, pinned by a fixture-token test).

## Receipts

Unit suite 982 passed (51 files); `replay:all` **30/30 byte-identical**; full e2e on port 4992 — see the run
tail in this worktree's log. `typecheck` clean. Commits: code+tests+notes; livedocs gate reconciled (replay
note, Chain concept, Decision Log entry extending THE GHOST law with the MOUNTING clause). Main untouched;
`git push` + `gh pr create` at this HEAD; CI green (the PR run).
