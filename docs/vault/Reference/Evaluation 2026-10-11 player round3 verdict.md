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
| 2 | Par ghost reads the answer aloud | **CLOSED** | locked on unearned rungs, unlocks at first minted finish, afterlife default ON |
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

## Item 2 — the ghost law: locked on rungs, default-ON in the afterlife

Measured with `#gw-ghost-toggle` text + `__gwGhostState()` (fresh save = localStorage cleared before each
surface):

- unearned rung (`?level=kitchen03`, fresh save): toggle reads **"ghost: par — finish first to race"**,
  `aria-disabled`, state `{enabled:false, mode:"off"}` — the par car does NOT roll while you decide. The
  round-2 spoiler seam is law'd away (`parGhostRule` in `src/pages/ghost.ts`).
- first minted finish (`?level=kitchen01&build=par` on a fresh save — rung 1 IS unlocked, no
  `#gw-dev-preview` badge): after ★★★ the toggle returns to plain **"ghost: par"**, state goes
  `{mode:"par", enabled:true}` and a re-enter shows `enabled:true` remembered ON.
- afterlife defaults, fresh save: `?daily=1` → plain toggle, `enabled:true`; `?level=porch-sandbox` →
  plain toggle, `enabled:true`. The par line is always on the table exactly where the spoiler budget says
  it should be.
- honest side-effect found while probing: a `?level=` boot of a rung the save has NOT unlocked wears the
  dev-preview badge and mints no star (my k02 ★★★ minted nothing and k02 stayed locked — the badge's
  promise is the code path, `if (!devPreview) recordStars(...)`). Ghost-lock truth therefore had to be
  tested where stars actually mint (rung 1) — done.
- unlock is by minted STAR (≥ 1): my accidental k01 launch with 0 of 3 pieces seated scored ☆☆☆ (result
  strip showed a clock — 2.04 s vs par 2.25 — but paid no star) and the toggle stayed locked. CLOSED.

## Fresh verdict

pending
