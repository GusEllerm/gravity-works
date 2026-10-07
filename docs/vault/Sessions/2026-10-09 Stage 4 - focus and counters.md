---
livedocs: snapshot
tags: [session]
---
# 2026-10-09 Stage 4 — focus and counters (systems engineer: shell/ui)

Playtest P+Q round2 items owned by shell/ui (camera/orbit/notes stayed FE's, level files stayed LD's):
the focus policy, the counter coherence, the speaking ring, the spent-kind stuck hold, and the par on
the rules lines. Gate: `tests/e2e/playtest-pq.spec.ts` (new) + the whole suite green (units 526,
e2e 70, port 4256).

## 1. Focus returns to the world (P: "Enter re-picks the last-focused button", "Rotate eats focus"; Q: "Enter ambiguously relaunches")

Every builder/toolbar button (`button()` in `src/ui/builder.ts`), the result panel's Retry/Next
(`panelButton` in `src/ui/result.ts`) and the Help toggle (`src/ui/help.ts`) `blur` themselves on the
`click` event — AFTER the native activation, so a focused button still keeps its own Enter/space
(Launch on Enter still launches WHILE it is focused) and focus is the world's the instant the control
fires. Enter's WORLD action (place) in the builder's keydown handler now fires only with focus on the
body, the canvas or the `#gw-builder` board group (previously: "not a BUTTON/A", which fired through
a parked `<summary>` too). e2e: click a tray button → Enter PLACES (count moves, button not
re-clicked); click Rotate → arrows still move `__gwTargetSocket` and Enter does not re-fire Rotate;
click Launch → the panel ends with focus on body, Enter neither re-launches nor dismisses; clicked
panel Retry likewise; focus Launch by keyboard → native Enter launches.

## 2. One counter, one verb (P: count "flip-flops"; Q: "0 of 4 used vs ready — 1 placed")

`runStatusLine(world, pieces, budget)` — the IDLE line now states the tray tally in the tray's own
words, `ready — n of m pieces used`, identical to `#gw-piece-count`; the running/terminal lines carry
the clock only (no second tally mid-session), and the rebuild's transient write uses the same function
(no bare "ready"). The number is the same `builder.playerCount()` both lines already read; only the
wording doubled the counter. `tests/unit/boot.test.ts` pins the new line; the set-spec e2es assert
`pieces used`; `tests/e2e/playtest-pq.spec.ts` asserts both lines say the same numbers at rest and
after a placement, and that the mid-run line holds no tally at all.

## 3. The target ring speaks (Q: "unlabeled white rings")

`#gw-ring-hint` ("the ring is where it will land") shows the FIRST time the ring is visible in a page
session — session-scoped on purpose (not the save's seen set; a fresh visit re-teaches) — and retires
at the first successful `place()` (or when the ring vanishes). `#gw-target-label` now carries the
ring's socket label whenever a target exists, held piece or not (it used to speak only while a piece
was held — the ring was mute the rest of the time). e2e asserts the line, its retirement, the
no-hold label, and the re-announcement after reload.

## 4. No stuck holds on exhausted kinds (Q: "no Drop left" while holding a spent Drop)

The message was fixed in the N wave; the STRAND was this pass. Placing the LAST of a kind releases
the hold (`setKind(null)`) and leaves a one-shot note ("last Drop placed — pick another piece") that
outlives the async `setScene`/`updateGhost` rebuild (a `stuckNote` channel rendered by `updateGhost`,
retired by ANY next action — pick-up, place, rotate, remove, tray press) and a spent-kind place
REFUSAL releases too, so the next Place is never spent on a ghost the tray cannot stock. e2e:
place the last Drop → aria-pressed false, note visible across the rebuild, Place never says "no Drop
left" again; the remaining kinds hold and place as before.

## 5. Par on the rules line, verified per rung (Q: "star par numbers only in Help")

The N pass wired `starRulesLine` into the rungs + first boot; this pass asserts ADDRESSING, not just
words: the level select's `.gw-level-rules` is checked against pars.json per rung (kitchen01 3/2.25,
kitchen02 3/1.05, kitchen03 5/2.65, kitchen04 4/2.55, kitchen05 6/2.40, bedroom01 3/2.35) and kitchen03's
first-boot `#gw-callout` line carries ITS numbers (5 pieces, 2.65 s). Nothing to fix — `parFor`
addressing was right; the assertions now prove it.

## Docs

`Modules/ui` reconciled (focus policy, ring hint, stuck-hold release, one-counter status copy, new
gate spec); `Modules/src` idle-line clause; `Modules/world` hazard-seam clause fixed (zone count
never rode the player line — stale since the hash left it).
