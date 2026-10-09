---
tags: [session, program, stage-7]
livedocs: snapshot
---
# 2026-10-09 — Program T3.2/T3.4: ghost racing (par + friend) and the daily rung

Feel Engineer lane on branch `p3-ghosts` (worktree gw-g1): Action Plan 2026-10-09 T3.2 (ghost racing,
with the plan's prerequisite order-probe) and T3.4 (daily, shipped in this lane because the ghost
proved cheap). Laws decided here: Decision Log 2026-10-09 "a ghost is a trace"; surfaces in
[[ui]], [[replay]], [[save]], [[src]].

## The measured probe FIRST (the plan's prerequisite)

`scripts/probe-piece-order.mjs`: every registered level's reference build (`parBuild` else
`placeholderBuild`, 37 builds) replayed headless under 4 deterministic Fisher–Yates piece-ARRAY
permutations, BOTH senses: `seq` kept (**148/148 hashed identical** — `reify` runs `canonicalBuild`
(sort by `seq`), so array order is provably noise) and permuted-and-RENUMBERED, array order becoming
canonical order (**148/148 identical too** — hash and step count both, consistent with `hashBodies`
folding only the car's bodies). ANSWER:
no order-sensitivity bites shipped builds; cross-build (and therefore cross-player, same-data) equality
claims are MEASURED-OK. The claim the ghost lane actually uses is weaker still, and the par ghost never
leans on it at all: it winds the canonical `parBuild()` array itself. No new "ask" owed — the probe
question closes here; if a future build ever arrives with non-canonical `seq` bytes from the wire, the
probe script is the regression tripwire.

## What shipped

- **PAR GHOST (G1)** — `src/pages/ghost.ts`: `deriveGhostTrace` winds the level's `parBuild` through
  the shipped `TapeRecorder` on a `visuals: false` world (slices on MessageChannel tasks) at
  level-load; the car is the ratified rig with every material at 0.35 alpha, `depthWrite: false`, no
  shadows, mounted in the RENDER scene only. It is positioned FROM THE LAUNCH (grid = one car; also
  keeps the committed idle-shell baseline byte-stable — a stage-pinned bar was measured moving it
  1.25 %, so the bar is a page-corner chip like `#gw-save`). `ghost: par` toggle on the bar,
  reduced-motion = OFF-by-default (persisted `settings.ghosts.par`, toggle stays available). Finish
  beat: `#gw-result-vspar` — the stars' own two numbers as deltas (`vsParLine`, pure).
- **FRIEND GHOST (G2)** — "ghost: from link": paste → `parseShareUrl` → their build MOUNTS as the
  track through the ordinary rebuild (refusal says so honestly and leaves the world intact), their car
  is that build's trace; an edit replaces their track and LIFTS their ghost with a line, falling back
  to the rung's par. The launched run hashes to the payload's hash (proved on a crafted link).
- **DAILY (T3.4)** — `src/save/daily.ts`: `?seed=<n>` is the whole page feature; `?daily=1` = seed
  `hash(UTC date)` (FNV-1a over the ISO day) riding the build's existing seed field into the hash and
  nowhere else. Result-screen chip records today's best FINISHED time + consecutive-day streak into
  `gravity-works.daily` (outside the save envelope by choice), and the single-machine clause — "your
  own runs on this device only" — lives INSIDE the chip sentence.
- **e2e** — `tests/e2e/ghosts.spec.ts` (6): par ghost finishes inside `[parTime − 0.05 s, parTime]`
  (the gen-pars ceil IS the stated tolerance); run hash byte-equal to the Node replay WITH the ghost
  mounted; reduced-motion off-default + toggle-on; friend link mounts track + car, garbage link speaks;
  daily chip records today's key and the hash equals the Node replay AT the day's seed. Unit:
  `tests/unit/ghost.test.ts` (13) — trace equals the `replayRun({record:true})` list exactly, twice,
  permutation invariance, the translucent-rig law, daily arithmetic.

## Gate runs

`npm run replay:all` **30/30 verified** at this HEAD (ghost excluded from `hashedBodies` — it is not a
body). Unit suite 850/850. Full e2e: see below (run green on this box, port 4640). Perf gate A
unchanged (16.70 ms median post-ON). No baseline re-committed — the shell idle capture is byte-stable
through the launch-law.

## Known edges (said, not smoothed)

- A ghost trace is per-LEVEL: mounting a friend link from ANOTHER level races their car on THIS
  deck and the note says exactly that (`their link is from X — their car ghosts HERE`).
- The daily is single-machine by construction; the leaderboard-shaped hole stays a Decision-Log ask,
  not a silent promise.
- `?seed=` on a page also reseeds the SAVED build's replay of your own work (pieces kept, hash moves)
  — that is what "the same level with a shared seed" honestly means at this size.
