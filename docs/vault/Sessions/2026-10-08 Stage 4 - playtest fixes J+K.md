---
livedocs: snapshot
tags: [session, stage-4, systems-engineer, ui]
---
# Stage 4 — playtest fixes J+K (Systems Engineer) — 2026-10-08

Three truth/layout items from [[Sessions/2026-10-08 Playtest J new rooms]]
(panel cut off at ~960x540; par lines meaningless on replays) and
[[Sessions/2026-10-08 Playtest K new rooms]] (level select "taught nothing
about what's unlocked or why"). Lanes respected: `src/ui/**` + boot wiring
only; no touch to `src/camera/**`, the note's witnesses/`physicsNote`
wording, or `run_status_note` phrasing.

## 1. The result panel is viewport-safe (J, "exact")

Reproduced at 960x540: the stage (223 px down a page 824 px tall,
`overflow: hidden`) plus the panel's fixed inline styling meant a ~150–176
px panel bottom sat at 383–407 px at scroll 0 but slid off the fold with
any downward scroll, and nothing could compact it. Fix: `createResultPanel`
now emits NO inline style on the panel or its buttons — the whole look moved
to `src/ui/shell.css` (inline styles outrank stylesheets, so the media
query could never have won). The stylesheet caps it
(`max-height: min(calc(100% - 16px), calc(100vh - 16px))`, `overflow-y:
auto` as a backstop) and a `@media (max-height: 620px)` pass compacts it
(12 px face, tighter star row and buttons) so at 960x540 the whole panel is
108 px and the button row ends ~200 px inside the window. The e2e
(`tests/e2e/result.spec.ts`, 960x540 describe) drives the BOTH-BUTTONS case
— kitchen01 `?build=par&launch=1` finishes starred and has a next rung — and
asserts Retry AND Next fully inside the viewport, `scrollY == 0`, and the
panel's own `scrollHeight == clientHeight` (nothing scrolled anywhere, not
even internally). The loop/shell panel specs still pass untouched.

## 2. Level-select unlock honesty (K)

Locked rungs now TEACH WITHOUT A CLICK: a 🔒 glyph plus the rule INLINE in
the button — "Earn a star on <registry name> to open this" — in place of
the old ☆☆☆ (K read plain-text ☆☆☆ as "merely unstarred"); locked rungs
are dimmed via `.gw-levelselect button[aria-disabled='true']`. The three
states differ at a glance: locked = 🔒 + rule, unlocked-unplayed = ☆☆☆,
earned = ★. One honesty case the spec surfaced while I wrote it: kitchen05
can HOLD an earned star (the recorded `?level=` addressing doctrine) while
still GATED (its predecessor never starred) — hiding a real trophy is as
big a lie as a fake ☆, so earned stars stay visible behind the lock; only
the ☆ PADDING is withheld from locked rungs. The click-says-why behavior,
`aria-describedby`, and the page's live region are unchanged; the rule is
still `levelUnlock`, read once, never restated. Proved in
`tests/e2e/campaign.spec.ts`: the lock-line text exists on locked buttons
(kitchen02, bedroom01), a starless locked rung contains no ☆ at all, and
the open-unplayed first rung shows ☆☆☆.

## 3. Par-line honesty on replays (J + K)

`resultModel` gained `bestStarsBefore` — the star the SAVE held before this
run, read in `src/boot.ts` at the terminal status BEFORE `recordStars`
writes this run's best, so same-session re-runs count. `outcomeLines` is
pure about it: a FINISHED run with `bestStarsBefore >= 1` leads with the
run's own numbers and the par reads as a clean verdict — "3 pieces — beat
par ✓ (par 3)" / "2.22 s — beat par ✓ (par 2.25 s)", "over par" when it
misses — and the "— par M ✓/✗" TARGET phrasing appears only when par is
still a genuine target (nothing earned yet). Failure runs keep the failure
rules exactly (unmarked tallies + the note), replay or not — the note's
witnesses and wording (the Feel Engineer's lane) are untouched. Proved by
`tests/unit/result.test.ts` (verdict lines, failure rules, default arg) and
the e2e replay test (feeltrack first finish = target lines, re-run = verdict
lines, stale phrasing asserted gone).

## Ledger

`npm run typecheck`, `npx vitest run` (447), full `playwright test` on
E2E_PORT 4231 — green; the one red during the pass was the earned-behind-a-
lock case above, resolved in the surface, not the spec. No camera, physics,
save-schema, campaign-rule, or note-witness changes.
