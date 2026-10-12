---
livedocs: snapshot
---

# 2026-10-12 Freeplay chain (Systems Engineer — Lane C, THE CHAIN)

Snapshot session note (never checked). Branch `fp-chain`, worktree `gw-f4` (outside the repo root), base main
`4978ec7` (THE CHAIN law greenlit). Build via `npm run build` + `vite preview` on **port 4950** (`E2E_PORT=4950`);
main untouched; evidence is the branch itself (commits `freeplay: …`, pushed, `git ls-remote`-verified). The law
executed verbatim is the Decision Log entry "THE CHAIN law greenlit" + Action Plan Lane C; the acceptance
scenario is the re-probe's challenge-half gap (`Sessions/2026-10-12 Sheet re-probe.md`).

## What shipped

- **Share payload v2** (`src/share/share.ts`): `name` / `par` / `goal` / `lineage`, optional-on-read,
  mandatory-on-write-new (the share button stamps `v: 2` always). `par` is the AUTHOR's measured run
  through the gen-pars rule — `parOfRun` is the one home for `scripts/gen-pars.mjs`'s ceil; `goal` is
  the placed cup's transform COPIED the guard's way (`cupGoalFromBuild`, last player `finishCup` past
  the fixture quota); `lineage` names the link whose ghost this run beat, identity by hash. A payload
  with no v2 fields still writes the exact v1 bytes — which is what makes the fixtures real.
- **v1 fixtures verify forever**: `tests/fixtures/share-v1.json` — four REAL v1 payloads (kitchen01
  `d32417dc`, bedroom02 `8166e5e1`, garden04 `69206512`, porch05 `1e367c94`: shipped par builds
  replayed through the shipped sim, encoded by the v1 writer at base) — and
  `tests/unit/share-v1.test.ts` proves both directions per fixture: parse → re-serialize byte-identical
  → wire-decode (zlib ⇄ CompressionStream) → REPLAY to the embedded hash; and the same build re-minted
  v2 replays to the SAME hash. The burned-receipt law is a CI line, not a promise.
- **The beat-a-friend VERDICT ROW** (`verdictLine` in `src/ui/result.ts`, same `#gw-result-vspar`):
  a raced link's row reads the LINK — `you vs “to the door”’s par — time −0.53 s vs their par` — or,
  for a v1 link with no par, the ghost's own re-simulated finish phrased `their run`; a foreign-board
  link gets the honest refusal. The impossibility sweep (every link shape never prints `you vs par`)
  is in `tests/unit/chain.test.ts`; the shell's `racedLink` (boot) follows the ACCEPTED link, not the
  rail's momentary visibility, and a foreign mounted track suppresses the local-par verdict too.
- **LINES tab** (`createLinesTab` in `src/ui/levelselect.ts`): LEVELS/LINES tablist, the stage-4 page
  unchanged and default under LEVELS. Seed first — the thirty authored pars as "published by the
  house" rows (`?level=<id>&line=house`, one click, ghost+par+name; the ghost law never locks a link)
  — then the device's chain walk from the payloads (`?level=<id>&link=<hash>`), rank sentence a count
  WALKED ON THIS DEVICE. The chain store (`src/share/chain.ts`) rides `settings.records.chain` —
  payloads only, validated on read, deduped by hash, FIFO 64 — with the ride law in `readRecords` so
  no badges/named-line write can erase it.
- **The daily gains today's LINK** (`dailyLinkLine` in `src/save/daily.ts`): the seed fold that picks
  today's board picks today's link with it — the house line on that board, named on the daily's
  corner tag beside the board it rides. No new stored fact, no new number.

## Laws, kept (and how they are gated)

- **No hash near any of it**: the verdict's cup is read from BUILD; `goal` is presentation geometry.
  The gate: kitchen01's par build hashes to the atlas receipt `d32417dc` with goal extraction, payload
  mint/parse and a chain write mounted around the step loop; the v1 fixtures replay to their embedded
  hashes; `npm run replay:all` 30/30 byte-same (ran green on this branch; the atlas file untouched).
- **Single-machine phrasing**: chain rank is the walked-payload count, honesty clause inside; no
  server, no accounts, no global number (the rejected list stays rejected).
- **TALLY badges are NOT rank inputs**: `src/share/chain.ts` never reads `records.badges`.
- **v1 is forever**: fixture-tested both directions in CI.

## Proofs

`tests/unit/share-v1.test.ts` (4 fixtures × both directions), `tests/unit/chain.test.ts` (verdict-row
impossibility sweep, chain store + ride + dedupe + cap + garbage-absent, goal = guard geometry,
hash-neutrality receipt, `parOfRun` ≡ gen-pars ceil, daily fold), `tests/e2e/chain.spec.ts` (seed
thirty listed + a house click arms the line; the house-line verdict row live; the full re-probe
arc — name a line, SHARE publishes a v2 payload (decoded Node-side from the minted URL), the LINES
tab lists it, one click races it and the bar prints `you vs “the spillway”’s par`, never `you vs par`).
`npm test` 971 green incl. the unchanged share/ghost/result/save families; the full `playwright test`
suite on the branch head: 266 passed, 1 skipped, 1 failed — the failure is the kitchen01 idle VISUAL
baseline, PRE-EXISTING at the base commit on this machine (see below); `tally:sweep` 37 rigs ok and
`hash-atlas --check` ALL 37 MATCH ran on the branch; `daily.spec.ts`'s corner-tag assertion extended
for the link sentence, nothing else touched.

## Commits

`freeplay: THE CHAIN — payload v2, the beat-a-friend verdict row, the LINES tab, today's link` — code,
tests, fixtures, the reconciled `Modules/share|save|ui|replay|tally` notes, the new
[[Concepts/Chain]], and the `--ack` stamps on `camera/render/track/Action Plan 2026-10-09` (boot.ts
moved only in CHAIN surfaces; their claims stand). Pushed to `origin/fp-chain`, ls-verified; PR CI next.

## Pre-existing on the base, named not hidden (both reproduced at `4978ec7` on this machine)

- `visual.spec.ts` "game shell kitchen01 idle" measures 0.40 % differing pixels against the committed
  darwin baseline — IDENTICAL failure on a detached baseline worktree at the base commit, i.e. drift
  from this machine's GPU/driver against when the capture was made, not a Lane C regression (no CHAIN
  code runs on that idle page).
- `npm run pars -- --check` fails on ONE row — `bedroom-sandbox` parTime shipped 3.15 vs recomputed
  2.75 — also failing verbatim at the base commit. Not CI-gated (ci.yml runs `replay:all`, which is
  30/30 byte-same on this branch), the sandbox is off the ladder; handed to the pars owner.

## Open, honestly

- The re-probe's edge (b) is closed; its (a) (re-sweep the badge thresholds at sandbox scale) and (c)
  (the 2.80/2.83 split) belong to Lane B's sheet and Eng's determinism ledger — untouched here, named
  in `Modules/tally`.
- A house row's ghost on an unearned rung bypasses the par LOCK only as a LINK (explicit ask, the
  round-2 law's own words); the rung's own par line stays locked until the first finish, unchanged.
- `?link=<hash>` addresses payloads on THIS device (single-machine law): pasted links from elsewhere
  still arrive through the paste field and enter the chain when raced.
