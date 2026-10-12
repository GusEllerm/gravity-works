---
livedocs: snapshot
---
# 2026-10-12 Seating fix (Systems Engineer: THE SEATING LAW, red-first)

Snapshot session note (never checked). Branch `fp-reseat`, worktree `gw-f6` (outside the repo root), base main
main `07fe80b`, `npm install`, live probes on **port 4971** only; main untouched; every artifact
checkpointed by commit+push (never `--no-verify`). Executes the escalation of
[[Sessions/2026-10-12 Sheet fix — the sandbox-scale tally]] §Escalation — "`World.reset()` is not
launch-deterministic" — and closes it; the receipts live in Decision Log 2026-10-12 "THE SEATING LAW".

## The mechanism (measured, not papered)

`reset()` removed the car bodies and re-ran `spawnCar`. That is NOT a round trip in Rapier 0.21: the car's
collider comes back at the same slot INDEX but a bumped handle GENERATION — kitchen-sandbox's last collider's
raw f64 handle bits read `…8200000000` on a fresh world and `…8200000001` after any Retry (collider COUNT and
index order identical; body count 2, colliders 131, both cases). The solver iterates the contact graph keyed
by those bits, so the sequential-impulse accumulation sums in a different order: the traces differ at step 1
(the sheet-fix receipt `grounded 0/1`), the suspension settles ~0.1 mm apart, and the run lands two steps
late. Headless today: kitchen-sandbox reference build **320 steps @ `7f008f48` fresh vs 322 @ `9732f07a`
after Retry** (the escalated kitchen line was 337/339 — same signature, the tally retune re-clocked it);
kitchen01's par `557f33bc`/266 vs `d32417dc`/268. This is the "2.84 → 2.72 on rebuild" collider-order law,
caught in the launch path.

## The fix

`World.reset()` rebuilds the physics world through the constructor's own creation sequence —
`createSimWorld()` → `addTrackColliders()` (the constructor's block extracted verbatim, generating descs
again from the stored `splines`) → `spawnCar()` — instead of touching the old world. Every launch is a FIRST
launch by construction; the cost is one collider rebuild per Retry, never per frame. `hashedBodies` re-seats
through `spawnCar` as before.

## Proofs

- RED-FIRST: with the fix reverted, `tests/unit/seating.test.ts` fails 5/6 (handle bits AND run equality; the
  one that passes is feeltrack's run equality — that build provably converges even pre-fix, which is why the
  e2e moved to kitchen01), and `tests/e2e/retry-share-verify.spec.ts` prints **`mismatch`** on the pasted
  link. Green after the fix, both files.
- GREEN: the repo-flow e2e the repo LACKED — build → `#gw-result-retry` → `#gw-launch` → finish →
  `#gw-result-share` → paste in a fresh page → `#gw-replay-status = verified · matches the link`.
- ANCHORS: `replay:all` **30/30 verified**, hashes byte-identical to main; `npm run atlas` re-stamped — every
  atlas hash unchanged (only the `generated` date moved). Full unit suite 938 green.
- STRICT REPAIR: no fresh-launch hash moved, so nothing that ever verified changes meaning. A link minted
  after a Retry BEFORE this fix recorded a live hash no from-scratch replay can produce — it can never verify
  and ages honestly; it is not silently re-keyed.
