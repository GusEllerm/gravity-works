---
livedocs: snapshot
tags: [reference, evaluation, player]
---
# Evaluation 2026-10-11 — player round 3 verdict (closure sweep + fresh stranger score)

> [!abstract] Method
> Worktree `gw-z6`, branch `eval-round3b`, tree `c9c2ea7` (main tip: r2-doors + r2-choice merged).
> `npm run build` + `vite preview` :4860, fresh browser profile, viewport 1280×633.
> Reused-lane check: the `playtest-aa/` PNGs in the tree are tracked since `b2325d8` (stage5-b2v2),
> NOT from the dead round-3 attempt — treated as historical, every claim below re-measured live.
> Closure items verified first (1–8), then a fresh stranger score: cold visit, ~8 rungs across rooms,
> first share, farewell, ~10 min sandbox.

## Closure table

| # | Round-2 item | Status | Evidence |
|---|---|---|---|
| 1 | k02 pays the dump (orders 2/3) | **CLOSED** | headless 24-order table + 5 shipped-browser orders; no order seats 4, no ★3 without choosing |
| 2 | Par ghost reads the answer aloud | pending | |
| 3 | 633px stage shrank to 574×323 | pending | |
| 4 | Daily = date sticker on rung one | pending | |
| 5 | Sandbox door hidden | pending | |
| 6 | Encore rail one rung in four paints | pending | |
| 7 | Bloom / post mid-run honesty | pending | |
| 8 | Garage/bathroom run-camera hero grammar | pending | |

## Item 1 — kitchen02, all 24 orders (the round-2 flagship failure)

Headless sweep (`node scripts/k02-order-table.mjs`, played through the shipped placement model + replay):
12 distinct seatings — every row ends `refused(cup|goal)` at **3 seated**; the two 3-star rows are the
authored line only. Exit 0: `laws hold: no order seats four; every 3-star order is an authored line`.

Shipped-browser verification at :4860 (fresh profile, CDP clicks on the tray buttons; localStorage cleared
between orders — an uncleared same-rung revisit reloads the autosaved work-in-progress build and fakes a
refusal, my first false alarm, noted honestly):

| click order (tray buttons) | 4th ask | outcome |
|---|---|---|
| straight, straight, gapLip, drop | "blocked — the cup is in the way" | trio FELL 1.15 s ☆☆☆ |
| straight, straight, drop, gapLip | "blocked — the run ends at the cup, so nothing past it is ever built" | FINISHED 1.02 s ★★☆ — **over** par now (par re-anchored 1.00; the +0.02 ✗ denies the star) |
| drop, gapLip, straight, straight | "blocked — the cup is in the way" (4th straight, body guard) | FINISHED 1.02 s ★★☆ (was ★★★ at round 2) |
| drop, straight, straight (3 clicks) | — | FINISHED 1.00 s ★★★ — the authored line, and the ONLY ★★★ |

The two round-2 exploits are dead in the hand: the run-out seat now carries its own refusal line ("the run
ends at the cup"), and the off-list trio pays 2 stars at a clock that no longer beats par. The ring's
`goal` tell covers the guarded run-out (`blockedGoalSeat` in `kitchen02.level.ts` + the Lane A refusal in
`builder.ts` place()). RESIDUAL: the table's refusal column says refused(goal)/refused(cup) per order
while the shipped ring aims the refusal at whichever ask first reaches past the mouth — the ORDER that
gets mocked differs by one position between script mirror and shipped button; the LAW (never 4 seated,
never off-list ★3) held in every probe. CLOSED.

## Fresh verdict

pending
