---
livedocs: snapshot
---

# 2026-10-12 Pullback + face (Level Designer — the final-sheet probe's (c), (g) and the sheet face)

Snapshot session note (never checked). Branch `fp-pullback`, worktree `gw-g2` (outside the repo root), base main
`4a76206`, `npm run build` + `vite preview` on **port 5174** for the screenshots (5000 is squatted on this machine by
macOS ControlCenter — every e2e here rode `E2E_PORT=5173/5175…`); main untouched; evidence in `Sessions/pullback-face/`
(two screenshots). Executed from `Sessions/2026-10-12 Final sheet probe.md` — suffocation #2/#3 and verdict **(c)**,
chrome trap #9 **(g)**, new #10 verdict **(e)/(10)**. No hashes moved: `npm run replay:all` stayed **30/30 verified
byte-same**.

## (c) — the overshoot soft-lock: the sentence got the verb, not a new verb

The probe's shape: the note reads `the straight sits past the cup — pull it back · press ] to walk the open ends`,
but Remove took the LAST piece placed — on the overshoot builds the named piece is not the tail, so the sentence owned
no reachable verb (garage/bathroom/garden unclosable in play). **Ship the verb that already exists:** `removeIndex`
(`src/ui/builder.ts`) gained a FIRST clause — a player-placed, tray-owned piece seated joined to the goal's own open
exit is what the click takes — read from `goalExitJoinIndex`/`pullbackTargetIndex` in `src/track/build.ts`, the SAME
join fact `moveHintFor`'s ORPHAN clause reads (advice.ts now calls it too — one source; the sentence can never point
at a piece the click will not take). The button label already named its drop (`removePhrase` says `the straight past
the cup`); only the `title`/`aria` law-line changes (`removes the straight past the cup — pull it back`), and wherever
nothing removable sits past the goal the plain LIFO law is untouched — kitchen02's authored run-out fixture names
nothing and takes nothing, kitchen05's booster-first Remove ×5 rebuild keeps its exact order (`program-voice.spec.ts`
green). `Replace` on the sitting piece was considered and rejected: a second button for a sentence one button already
points at.

### VERBS ACTUALLY HEAL — the six-room table (`node tools/pullback-verify.mjs`)

Each row replays the probe's overshoot scenario through the shipped deterministic harness: the par line's finisher
re-seated, EARLY, on the cup's own exit, the chain left one piece short of the cup.

| room     | die   | note names                                        | LIFO (old)                            | verbs (now)                          |
|----------|-------|---------------------------------------------------|----------------------------------------|--------------------------------------|
| kitchen  | fell  | the straight sits past the cup — pull it back      | removed+replaced landing; still names  | finished 2.667 s = par 2.667 s       |
| bedroom  | fell  | the straight sits past the cup — pull it back      | removed+replaced landing; still names  | finished 2.733 s = par 2.733 s       |
| bathroom | fell  | the straight sits past the cup — pull it back      | removed+replaced landing; still names  | finished 2.733 s = par 2.733 s       |
| garden   | fell  | the straight sits past the cup — pull it back      | removed+replaced landing; still names  | finished 2.733 s = par 2.733 s       |
| garage   | fell  | the straight sits past the cup — pull it back      | removed+replaced landing; still names  | finished 2.733 s = par 2.733 s       |
| porch    | fell  | the DROP sits past the cup — pull it back          | removed+replaced straight; still names | finished 1.158 s = par 1.158 s       |

Every cell is a four-part claim the sweep asserts, not narrates: the scenario build **dies**; the ORPHAN clause
**names** it AND the pull target IS the named piece; the OLD law (LIFO Remove + the `]`-walked Place at the head)
returns to a build that **still names and still does not finish** — the soft-lock reproduced, then closed; the
shipped verbs (Remove-the-named → Place-at-the-head → Launch) rebuild the par line's transform set **verbatim** and
finish at the parity build's exact time. **The porch footnote (no lie shipped):** at the ride-to-cup seat porch has
no soft-lock — its sink sling-shot clears the missing straight and the run captures anyway (sweep: `finished`), so
the sweep walks the candidate one piece UP the par line and stages the DROP overshoot instead. Removal CAN heal
porch too; the scenario just has to actually die first, and the tool says so in its own output.
`tests/unit/pullback.test.ts` pins the laws data-side (six sandboxes + the ladder invariant + the fixture/tray gates);
`tests/e2e/pullback.spec.ts` walks the kitchen sandbox live — the note as the only instruction: overshoot placed
FIRST (so the old LIFO could never take it), `]`-walked line, launch → the death names itself, `Remove the straight
past the cup` takes it, Place at the head, launch → finished.

## (g) — the name-`save` vs the Save dropdown: the row is a FIELD

One page, two controls, one name — the probe's click meant for the name opened the settings. The studio names a
control by its noun: `name this line` is now the input's real `<label for>` (the row speaks its noun), and the commit
button says **`name it`** — no second `save` shares the page with the Save dropdown's `Save`. Ids ride untouched
(`#gw-result-name-save` is a test surface, not copy — `chain.spec`/`tally.spec` clicks unchanged). CI law pinned in
`tally.spec.ts`: the chip IS a label (`for=gw-result-name-input`), the button text is `name it`, and the
`#gw-result-name-save`/`#gw-save-toggle` rects are DISJOINT.

## (10) — the sheet gets a face: how modest, and why

**Decision: a footline and a parenthesis — no new surface, no new number-line.**
(1) THE LINES TAB ends in one quiet `<p id="gw-lines-sheet">`: every badge kind in the sheet's own order with its
lifetime count, campaign-only kinds printing their ZEROS, the honesty sentence verbatim —
`air 7 · clean catch 6 · chain fall 0 · room crossing 0 · booster spend 5 — your own runs on this device only` — and
absent entirely while the device has earned nothing. (2) ON A SANDBOX RESULT BAR the lifetime number rides ONLY the
earned line, in parentheses, only for kinds this run actually moved (`earned — air (8) · clean catch (7) · your own
runs on this device only`); a run that earned nothing prints no number, the three-line law is unbroken, and the
campaign bar passes `null` and prints the shipped tail byte-identical.

Reasoning, from the screenshots (`Sessions/pullback-face/01-sandbox-result-sheet.png`, the seeded-device sandbox
finish; `02-lines-footline.png`, the LINES tab on the same device): the probe proved the INVISIBLE ledger carried no
temptation, so the face must stay calm enough to keep that finding true. A standing sheet row on every bar turns the
footnote into a scoreboard the player reads before the verdict — the parenthesis only exists when the sheet just
moved, which is the moment the number INFORMS (did that boost me past what I had?) and not the moment it egos. The
footline puts the auditable whole truth where READING already lives (the tab you choose), prints zeros rather than
editing them out (a ledger that hides `crossed 0` is edited, not calm), and carries no button, streak or rank —
nothing between runs to feed. The number stays small: five counts, one line, device-only words verbatim.

## Receipts

- Unit: full `vitest run` **990 passed** (new `tests/unit/pullback.test.ts` 10; FACE block in `tests/unit/tally.test.ts`).
- e2e: full suite **269 passed, 1 failed, 1 skipped** on `E2E_PORT=5173` — the failure is
  `visual.spec.ts “game shell kitchen01 idle”` (0.400 % px), which **fails IDENTICALLY on the base commit `4a76206` in a
  clean worktree on this machine** (pre-existing darwin baseline drift; CI owns the platform baselines) — nothing in the
  diff renders on the idle canvas. New specs green: `pullback.spec.ts` (live verbs + the face), `tally.spec.ts` (field
  law, disjoint rects), `program-voice.spec.ts` (pull-back aria on the k04 orphan; booster rebuild LIFO-untouched).
- `npm run replay:all` 30/30 verified; `node tools/pullback-verify.mjs` is the six-room gate above.
- Notes reconciled in the same commit: `Modules/ui` (Remove target law, tally `sheet` arg, name FIELD, LINES footline),
  `Modules/tally` (face + field), `Modules/track` (`goalExitJoinIndex`/`pullbackTargetIndex`), `Concepts/Chain`
  (badges-not-an-input vs the footline), `Home` (orphan bullet closed to a TARGET), `Decision Log` 2026-10-12 entry.
