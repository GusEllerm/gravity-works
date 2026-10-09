---
livedocs: snapshot
tags: [session, program, stage-6, level-design, campaign, ladder-order]
related: [[Concepts/Levels]], [[Decision Log]], [[Reference/Level Ladder]], [[Modules/ui]]
---

# Program T3 warp — T3.1 ladder re-weave (Level Designer)

Branch `p3-warp`, worktree `gw-y4`, base main@5499c73. The listed
prerequisite commits (0348746/69812f9/3801160) are not objects in this
repository — main's actual tip already carries the merged T0.x gates and the
T1.1 feel package, so no cherry-picks were applied.

## What ran

T3.1 of `Reference/Action Plan 2026-10-09.md`: re-wove the FLAT ladder in
`src/world/campaign.ts` so the player evaluation's déjà vu — "rung 8
(bedroom01) is rung 1 with different wallpaper", five rooms' grammar
clusters — stops being a five-beat repeat. Nav data only: `CAMPAIGN_LADDER`
is now the authored flat order and `CAMPAIGN` is a PROJECTION of it (rooms
grouped for the select, one source of order). The law, the full order and
the defense are `[[Concepts/Levels]]` §Ordering of the ladder; the decision
and the prerequisite table (with its edge cases — geometry citations are not
lessons, `garden01` ships no live zone, porch ships neither) are the
`[[Decision Log]]` 2026-10-09 entry.

## Gates held

- `npm run replay:all` — 30/30 verified, and the per-rung hash table
  `diff`s EMPTY against the pre-weave main tree: ZERO hash movement.
- Unit suite 826 green, including the new `campaign.test.ts` weave-law tests
  (grammar gap, prerequisite table, arcs + encore→finale adjacency, rising
  curve from `pars.json`, beginner walk) and a mid-campaign-save test (the
  save records IDS — `stars`/`reached` need no migration; next-rung
  resolution from ids asserted across the re-weave).
- Expected-next rows regenerated in `campaign.test.ts`, `boot.test.ts` and
  `campaign.spec.ts` with meanings preserved (unlock = the PREVIOUS rung's
  earned star): kitchen05's star now opens bedroom03; bedroom05's previous
  rung is garden02; all four encore→finale Next walks are unchanged, so the
  encore specs kept their shape.
- Dev-select grouping visually unchanged (room sections, house order).

## Calls worth replaying

- Interleave-WITH-RAMPS, not interleave-only: the first five rungs are the
  kitchen ramp (01→03) into the bedroom ramp (01→02); pure round-robin would
  front-load six 01-intros — the disease itself.
- Difficulty speaks in TRAY SIZE (`parPieces`): parTime is not comparable
  across clock families (the porch clocks are kitchen02's chute clocks, as
  the porch01 note itself says). Law: no >2-piece cliff, second half not
  easier than first.
- The honest line, on the record: nav-only treats the symptom. T3.2's ghost
  is the cure; this makes the wait between déjà rus less embarrassing.
