---
livedocs: snapshot
---

# 2026-10-11 Round3 lower (Level Designer — giving "flatten"/"lower it" a verb)

Snapshot note (sessions are never checked). Branch `r3-lower`, worktree `gw-x7`, base `314d6f6`
(main tip — the round-3 verdict's tree). The verdict's "below 8" cheap point 2:
[[Reference/Evaluation 2026-10-11 player round3 verdict]] §"What keeps it below 8" item 2. The dead
rims lane (`r3-rims`, PR #12) shipped item 1 and left item 2's section open ("to be appended below
once shipped") — its reconnaissance never ran the "which flattening heals k04" sweep, so this lane
ran it from scratch.

## The question, and the answer the verdict did not expect

The verdict offered two machineries: a new lower-detent key, or a note that names an existing
keystroke. `scripts/k04-flatten-sweep.mjs` played the first proposal to death. k04's dump death is
the **3-seat chain `drop → gapLip → landing`** — it falls at **2.658 s**, the verdict's 2.66 s — and
every single-piece flattening of it (drop angle/height, lip angle, landing angle/level — 27 param
variants, plus all three flips Rotate already ships) **fails or stalls: 0 of 30 finish**. The death
line is SHORT, not steep: on one anchored rail a chained line's reach is an order-invariant piece
SUM (the k04 header's own law), so no `flatten`/`lower` nudge, whatever detent it rides, can ever
heal this death. What heals it is the piece the dump left ON THE TRAY: seating the `straight` at the
chain head finishes at **2.592 s** — par 2.52, 4 pieces = par pieces — a ★★☆ **clear**.

So the round-3 verb is not a key. It is the keys that already exist — tray button + Place — finally
NAMED by the note. (A param-nudge key shipped on the verdict's advice would have been a verb for a
death it cannot fix; that is stated here because it is the interesting fact.)

## The change (UI copy only; no hash can move)

`physicsNote`'s nose-first branch gained THE ACTIONABLE-VERB PRIORITY (law + wording in
`Modules/ui`; the branch code reads `src/ui/result.ts`): recipe (`re-place it flat (no R)`) >
tray-only ADD half > ORPHAN clause (`pull it back` — Remove) > ADD naming UNUSED stock (`add a
straight · place at: end of landing`) > the verbless critique, as shipped, only where the data names
no verb. Precedence mirrors the drive-off branch's existing laws; the derivations are the already-
plumbed `stockedKindsFor` / `moveHintFor` / `aimHint`. Unused stock = stock minus placed: a kind
already seated somewhere is the ambiguity the WHERE clause kills — and it is what keeps
`tests/unit/critique-where.test.ts` byte-identical (its fixtures name no unused piece).

k04's death note becomes `fell off nose-first — add a straight · place at: end of landing`.
bedroom02's dump (landing seated past the cup, tray spent) becomes the MOVE clause: `… — the
landing sits past the cup — pull it back · …`. The verdict's two verbless rungs now print sentences
with keystrokes; every other nose-first line is byte-identical (`null`-permissive like every gate;
`replay:all` 30/30 verified, pars untouched — this lane touched no physics input).

## Proofs

- `scripts/k04-flatten-sweep.mjs` — laws: the 2.66 death reproduces; NO flattening/flip heals it;
  the tray straight does. Exit-gated.
- `tests/unit/actionable-verb.test.ts` — replays the death/heal/grid; the k04 sentence from the LIVE
  derivations; critique byte-identity with all-placed stock; the rotated recipe outranks unused
  stock; the bedroom02 orphan outranks the critique.
- `tests/e2e/round3-verb.spec.ts` — THE task's law: fresh page, build the verdict's 3-seat death
  with real clicks, read the note (names `add a straight` + `place at:`, says no flatten/lower),
  obey ONLY it (tray-straight, Place at the ring), launch → `#gw-result-stars` mints ★. Cleared.
- `tests/e2e/p4-words-where.spec.ts` bedroom02 half — reconciled to the orphan line (was the
  critique with a `past the cup` tail; the same live build, now a sentence with a verb).

## Honest residues

- The rank-5 fallback still prints verbless critiques where the data names NO verb (e.g. a full-
  tray, no-orphan nose-first death that is not bedroom02's dump). Round 3 made the two named rungs
  truthful rather than rewriting every nose-first line; the sweep says WHY that would be a lie in
  k04's case, and nothing yet measured says what a general `flatten` verb would DO.
- k04's dump in BUTTON order (`gapLip drop landing straight`) finishes at 2.517 s — the death needs
  the fourth ask left unseated, which is what the evaluator's clicks actually did; the e2e builds
  exactly that shape.
- Suite at this tree: typecheck clean, 912 unit, both touched e2es green (E2E_PORT 4890).
