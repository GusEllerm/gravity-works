---
livedocs: snapshot
---

# 2026-10-11 Round2 doors (Lane C — the world's edges and doors)

Snapshot note (sessions are never checked). Branch `r2-doors`, worktree `gw-z4`, base `5ac115d`
(the ghosts lane merged — this lane rides its ghost law). Action Plan
[[Reference/Action Plan 2026-10-11]] Lane C + the two adjacent round-2 engineering debts (N8
residue, N5).

## What shipped

1. **THE 20 PX BACK** (`src/ui/shell.css`, `src/pages/ghost.ts`, `src/ui/settings.ts`,
   `tests/e2e/p4-chrome.spec.ts`): the compact canvas constant returns 310 → 288 and the chip band
   moves INTO the page's bottom slack — the two bottom chips read their offset from
   `--gw-chip-bottom` (8 px; 4 px in the compact block; their layout stays INLINE, the value lives
   in the cascade). Re-measured, not hoped — and the CI proof line earned its keep: the FIRST run
   at 288 went RED at 633 on Linux, `gw-callout vs gw-ghost-bar` riding 716 px² into the band —
   thirteen tray labels at the 14 px display voice fit mac's Futura in the 980 px column and
   WRAPPED on Linux's fallback grotesque, a +25 px flow the old 310 had silently absorbed as
   world pixels (the Linux-Fonts lesson, one row higher). The compact block now STATES the
   button boxes (11 px/13 px) and the spec asserts the tray stays ONE ROW at compact heights;
   re-measured after: the last flow line ends 592.98 against the chips' 608 — ~15 px of slack,
   every rect pairwise-disjoint, both chips on screen and tap-reachable, no scroll, and the
   stage serves the ledger's 613×345 again (`≥ 340` floor asserted at 633, itself proved
   RED-when-mutated back to 310). Screenshots attached at 633/720/900 by the spec;
   `docs/explorations/round2-doors/chrome-633.png` is the human frame. The honesty the
   P4 band bought (stated integer boxes, pairwise rects, stack order) is kept whole — the band just
   stopped buying its room out of the WORLD.
2. **SANDBOX DOORS, VISIBLE** (`src/ui/levelselect.ts`, `src/world/campaign.ts`
   `CampaignRoom.sandboxId`, `src/pages/farewell.ts`): every room's row on `?levels=1` ends with its
   sandbox as a quiet sub-entry LINK (`#gw-level-<room>-sandbox` — italic, no stars, no lock, no
   rules line: the toy is nobody's rung and says so), replacing the P4 prose line the evaluation
   read as an unlinked sentence; the farewell's door 1 now reads "keep building — a room of your
   own, every room:" and names all six (`#gw-farewell-sandboxes`, one small link per room; the
   door's own click stays the porch sandbox — one click, one landing, unchanged). `levelselect-sandbox-doors.png`.
3. **THE DAILY, MADE REAL** (Decision Log 2026-10-11; `src/world/campaign.ts` `dailyBoardId`,
   `src/boot.ts` `dailyAddress`/`resolveLevel`, `src/save/daily.ts`, `src/pages/farewell.ts`): the
   seed law is untouched — `seed = hash(UTC date)` still rides the build field into the hash and
   the sim never reads it — but the SAME number now also folds onto the thirty rungs: a daily page
   boots TODAY'S BOARD (`dailyBoardId(seed)`, an explicit `?level=` still wins), names it in a
   zero-flow corner tag (`#gw-daily-board`: "today's board — The Open Door · 2026-10-11" for the
   11th), the result chip LEADS with the name (`dailyChipLine(rec, today, boardName)`), and the
   ghost law rides it untouched — afterlife surface, par default ON on a rung the save never
   finished. A `?date=YYYY-MM-DD` recorded debug param pins the UTC day BOTH SIDES of every
   comparison (the N6 midnight race cannot exist); the record keys the addressed day; a daily page
   is never a dev preview (a finished run mints, doctrine). Farewell door 2 strips `level` with the
   other one-use params — the door lands TODAY'S board, not the finale's rung. `daily-board.png`.
4. **CI DEBTS** (engineering round-2): `scratch-census.spec` routes through `goto.ts` (N8 — the
   ghosts six were already the ghosts lane's); `mergeEnvelope` is EXPORTED and proved against the
   SAME commutativity-table pair as `mergeEnvelopes` — disk+data+journal in both write orders,
   same winners, same bytes (N5; mutation (b) — drop the disk view or the journal — reddens it).

## Proofs (all local, mac; CI below)

* Unit: 894 passed (44 files) — the +11: the fold (`campaign`), the three daily URL faces + the
  `?level=` override (`boot`), the board-named chip (`ghost`), the production-merge table (`save`).
* E2E FULL: 252 passed / 1 skipped (the pre-existing conditional) — incl. the new `daily.spec.ts`
  (two dates → two NAMED boards, stable within a date; the date-seeded page hashes the Node
  replay's bytes and hashes them TWICE — the seed's own hash claim, verified honestly, not
  asserted), the re-derived `p4-chrome` (rects + ≥340 floor + screenshots at 633/720/900), the
  reversed sandbox law (`stage6-sandboxes`, `p4-words-where`), the farewell doors (six names;
  door 2 = today's board, no `level` in the URL), and the ghosts afterlife defaults.
* `npm run replay:all`: 30/30 verified, every hash byte-identical to the committed table — the
  daily's pick is nav + the existing seed field; zero shipped hashes moved, atlas untouched.
* Typecheck green; build green; hash-atlas untouched (no level data changed).

## Known limits

The board fold maps 2026-10-11 → porch02 ("The Open Door") and 2026-10-12 → garage05 ("Spill
Course") — two dates, two boards, proved with those exact days; a date whose fold repeats a
neighbour's rung is arithmetic, not a bug to hide. The compact chrome's ~15 px of slack replaces
the old 11 px of paid-in-world air — bought with STATED boxes on every row that could move, which
is what the two Linux-Fonts incidents (summary line, tray row) actually taught; if a future metric
moves a row, the p4-chrome spec goes RED at 633 (rects + one-row tray + the ≥340 floor), not
quietly overlapped. The `?date=` face changes which day the
record belongs to — a device that travels back in debug dates re-plays a past board; recorded-param
doctrine, stated in `daily.ts`.

See [[ui]], [[save]], [[Levels]], [[Decision Log]] 2026-10-11 (daily law),
[[Reference/Action Plan 2026-10-11]].
