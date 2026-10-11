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
| 3 | 633px stage shrank to 574×323 | **CLOSED (one residue)** | canvas measured 613×345 at 1280×633, idle rects disjoint; fail band still crosses the chips |
| 4 | Daily = date sticker on rung one | **CLOSED** | `dailyBoardId` folds `dailySeed(date)` onto the 30-rung ladder; 3 dates → 3 named boards in the browser |
| 5 | Sandbox door hidden | **CLOSED** | six named sandbox links on the board; cold save → kitchen-sandbox "ready" in 426 ms |
| 6 | Encore rail one rung in four paints | **CLOSED (clocks)** | b05 dies 2.35 s vs bed05 2.63 s at the same ask; dumps finish 2.86/3.12 vs par 2.9/3.15 |
| 7 | Bloom / post mid-run honesty | **CLOSED** | flare probe re-run on this tree: small-disc spread 0.0 px (pre-gate 5.5), area control still glows; mid-run shots read clean |
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

## Item 3 — the 633 px window, measured

`set viewport 1280 633`, `?level=kitchen01` idle state, rects via `getBoundingClientRect`:

- canvas: **613×345 at (333,202)** — the ledger's number, back verbatim (`#gw-stage canvas` cap at
  `100vh − 288px` after the "20 px back" in shell.css; history 380→288→304→310→288 in the CSS comment).
- page height 633 = `100vh`, no scroll; status/callout/hash lines at y 548/564/580, chips at y 608
  (`--gw-chip-bottom: 4px`): **every idle pair disjoint** (ghost×status, ghost×hash, save×status,
  save×hash, ghost×save, chips×canvas all false).
- RESIDUE (honest): a FAIL result still expands to a full-width band — measured x=12 w=1256 y=590 h=33 —
  and it INTERSECTS the ghost bar and Save chip (band bottom 623 > chip top 608). The round-2 sentence
  "the fail band overlays what it found" is still true at this tree; it is the failure-note row riding
  the chip band, not the idle chrome. The world itself is no longer paying for the chrome. CLOSED with
  that asterisk.

## Item 4 — the daily is a board now, not a sticker

Headless: `dailySeed` (FNV-1a over the UTC key) → `dailyBoardId` on the 30-board ladder:
2026-10-11 → porch02, 2026-10-12 → garage05, 2026-10-13 → garage04. In the shipped browser the same URLs
show named boards (`#gw-daily-board`): **"today’s board — The Open Door · 2026-10-11"**, **"Spill Course ·
2026-10-12"**, **"Last Lap · 2026-10-13"**. Two dates, two boards, three dates, three boards — the
round-2 "race against rung one, forever" sentence is false now, and `?date=` makes it checkable without
racing midnight. The seed still rides the build hash only (physics law unchanged); what the date decides
is the BOARD. CLOSED.

## Items 5–6 — the sandbox door and the staggered encores

**Door:** `?levels=1` on a FRESH save lists all six rooms, each row carrying a real `<a>` to its sandbox
(`#gw-level-<room>-sandbox`, labelled "every piece in the kit, loops and springs included") — zero lock,
zero stars. Fresh save → board → click Kitchen sandbox → `ready`: **426 ms** wall (the < 60 s law by
three orders of magnitude). The round-2 "names the six sandboxes and links none" sentence is dead.

**Encore clocks:** the death-clock stagger is real at the shipped button. Same single-drop ask, launched:
bathroom05 **fell off — 2.35 s**, bedroom05 **fell off — 2.63 s** (round 2: both 2.63 s to the
centisecond). Full dumps finish at distinct clocks too: b05 2.86 s vs bed05 3.12 s against pars 2.9 / 3.15
(`pars.json`). Substance note carried to the fresh-stranger score: the 4-piece dump still COMPLETES both
encores at par-adjacent clocks — the rails stagger their deaths but the union line still asks no CHOICE
in any of the four paints.

## Item 7 — the bloom size gate at DEFAULT tier, mid-run

The ban is now a shader term (`min(centre, neighbourhood-mean)` over ±2 quarter-res texels in
`src/render/post/bloom.ts`, `BLOOM_SOFT_CEILING = 0.22`). Re-measured on THIS tree, not trusted from the
Lane D note: `npx playwright test bloom-flare.spec.ts` →
`small r=6.1px halo=0px spread=0.0px | large spread=12.0px` — the ≤5 mm class is at zero spread (pre-gate
5.5 px / 217 halo px) while the area control keeps its glow. My own mid-run screenshots at the default
(high) tier — kitchen01 (bowl/mug/sponge class), porch01 and garden01 (goal pin) — show the small whites
as lit dots with tight halos, no lightbulb flares; the sun-disc class still glows where it should. (My
first crude pixel probe tried to measure a guessed pin coordinate and lied — 59 px of "spread" that was
really the sunlit lawn; I threw the number away and ran the real probe instead.) CLOSED.

## Fresh verdict

pending
