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
| 8 | Garage/bathroom run-camera hero grammar | **CLOSED** | `RUN_FRAMING.eyeUp: 0.028` rows shipped; mid-run shots frame deck grammar |

The WORSE paragraph is answered in the fresh walk below: every fix I probed bought its claim WITHOUT a
new lie in my lane — the two residues are pre-existing (fail band over chips; encore/finale substance).

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

## Item 8 — garage and bathroom run cameras frame the hero grammar

The law (round-2 Lane D): the set's HERO grammar must read from the PLAY cameras, not only stills — a
per-set `eyeUp` row lifts the rail-plane eye while §7.3's pitch still passes through the car
(`eyeUp` in `src/camera/run-camera.ts`; `RUN_FRAMING = { eyeUp: 0.028 }` shipped in BOTH
`src/sets/garage/data.ts` and `src/sets/bathroom/data.ts`). Verified in mid-run frames at 1280×633
(`garage02-midrun.png`, `bathroom02-midrun.png`): the garage run puts the blade corridor + mottled oil
floor + shop props into the lower-left frame with the car centered; the bathroom run frames the tub base,
the rubber duck and the tile GRID across the lower third, car hero-center on the rail. Neither frame
reads as the round-2 complaint (flat deck void under a floating car). CLOSED — though the two shots also
show the fail-band/dev-badge chrome unchanged, and the bathroom frame's white tub still holds its AREA
glow honestly (it is a wide bright region; the size gate keeps it soft, not flared). CLOSED.

## Fresh verdict — scored like a stranger at tree `c9c2ea7`

Method note: two stated divergences, same family as prior rounds — (1) the harness reports
`navigator.webdriver`, so the premiere beat is skipped on my landings (its spec is green; a human first
visit gets it); (2) the farewell needed a finisher's save, so I seeded all 30 rungs' stars after
earning honest ones where unlocked — the crane, the doors and the film are what a finisher sees; the
tally numbers ("30 rungs walked — 88 of 90 stars") are my seed plus my one honest porch05 finish (2
stars, 1.36 s over par — the tally read 14/15 Porch, honest with itself). One methodology confession:
my FIRST bulk dumps ran through page-side `.click()` calls, and the ring aims differently for
pointer-less scripted clicks — k03 "died" at 1.07 s that way. Every rung verdict below was re-run with
real CDP clicks at human pacing; the scripted deaths were thrown out. That is also the shape of the
round-2 lesson, now on my side of the glass.

**The cold sixty seconds (1280×633, fresh save, `cold-k01-633.png`):** display chrome, honest lock lines
on the board, the rung-1 stage at 613×345 (54 % of the window, the ledger's own number), the ghost bar
carrying its locked sentence, and the teacher voice one calm line above the chips. Best first minute
this game has had on a short laptop.

**The 14-rung walk (six rooms, CDP clicks):** k01 par-build ★★★ (par mints real stars — rung 1 unlocks
honestly). k02 five orders — see item 1: the dump is now PUNISHED or paid two, never paid three for not
choosing; the one ★★★ is the authored line, and both its 3-piece seatings pay it identically. k03 dump
FINISHES ★★☆ 1.50 s "same pieces as par". k04 dump seats 3 of 4, DIES 2.66 s — the note still says
"**flatten** the landing by the lip or lower the lip by the drop": one of the two verbs still has no key.
bedroom01/garden01/garage01 dumps finish at 2.37–2.38 s ★★☆ — the rung-1 grammar in three aprons at
rungs 4/14/21, same clock as round 2 to the 0.01. bedroom02 dump 5/5, DIES 2.33 s, note unchanged:
"flatten the landing past the cup" — still, at the fourth evaluation, the unspeakable fix. bathroom02
par-run 0.74 s with the tub and tile grid in frame (item 8). The encores stagger their deaths but a
4-piece dump still COMPLETES both at par-adjacent clocks (2.86/3.12 vs 2.9/3.15). porch01 par-run
finishes at 1.02 s with the unlocked par ghost racing alongside (earned surfaces show the line).
porch05 — the FINALE — still finishes by dumping the tray: 4/4, 1.36 s, and the crane flies me out of a
rung that asked nothing. Fifteen-ish rung-visits, ONE real choice (k02), and two rungs that still ask
for a verb the builder does not ship.

**First share:** built a bedroom01 line by dumping, hit Share, got a `#s=` link; the page says
"✓ verified · matches the link — re-simulated on this machine" and shows replay hash = link hash. The
film stars the blue sedan (`share-film-1s.png` at the end frame: a blue car parked at the cup on my
orange track, sharp, NOT a bokeh blur — the round-2 ending-frame seam is gone); a 0.8 s sample of the
porch05 film is a close deck pass with the car out of frame, so the car reads late in short films.
Pasting the link into "ghost: from link" → "their car is on the grid — launch to race it", mode
`friend`, and I lost the race by 0.003 s. The social loop is the most polished part of the game.

**The farewell:** the crane sweeps clean rooms — no leaked chrome — but the between-room legs are still
flat discs in a warm void (`farewell-mid.png`: a beige planchet floating in beige nothing, props tiny at
the edge; the round-2 green-disc complaint repainted, not re-architected). The doors land honestly and
now wear SIX real sandbox links under them (door 1 → porch sandbox, door 2 → today's named board, door
3 → the film of the run, verified) — the "you could have been a tinkerer all along" sentence is finally
spoken by the interface itself.

**Ten minutes in kitchen-sandbox:** every one of the thirteen kinds at ×99, loops and springs included.
My first build — booster, straight, loop, launched — FINISHED 2.52 s ★★★ at the FIRST try: the
round-2 "first loop lands on the spawn ramp" problem is gone (the ring's default seats the run-up where
the 2.30-R law wants it), and the sandbox par (5 pieces / 2.70 s) is no longer a scored-freebuild lie —
it encodes the loop+run-up answer, which is the affordance lesson wearing a number. A spring+wide-curve
build died honestly at 2.62 s with a real "add a straight · place at: end of straight". One cosmetic
seam: the sandbox's "Stars: … at or under 2.70 s" rules line OVERPRINTS the "why the same build always
runs the same way" disclosure at 633 (`sandbox-tray.png`, bottom left) — the only text collision I
found, and it is the rules line choosing a freebuild's afterlife surface to live on.

**Sound:** mute harness again, stated limit: what plays is code-verified roll-noise, thuds, ticks and
a three-note chime; my hour-two worry (the chime as a congratulations metronome on a sandbox grind)
stands unchanged.

### VERDICT — 7.5 / 10 (fresh stranger; prior rounds: 4 → 6.5 → 7 → 6.5)

Every fix the program shipped against the round-2 indictment verified TRUE IN THE HAND, not just in the
harness — the choice rung keeps its promise under every click order I could stage, the daily names its
board, the 20 px came back, the ghost keeps its spoiler budget, the door is open, the toy is the first
toy I could actually play. That honesty is what moved the number, more than any new feature.

**What keeps it below 8:**
1. **Substance, one rung deep.** One corridor visit in ~fifteen asks anything the tray-dump does not
   answer (k02); the finale and all four encores are dump-completable; rung-1 grammar repeats verbatim
   in three rooms. The weave fixed spacing; the ladder's average DECISION count is still ~1.
2. **"Flatten" still has no verb.** k04 (2.66 s death) and bedroom02 (2.33 s death) print a fix sentence
   the builder cannot execute — four evaluations, the same two rungs. One rotate-step or "lower it" ask
   closes the game's worst teacher-moment.
3. **The crane's legs.** Between the rooms the farewell flies over void; the sets read only when docked.
   A cheap set-dressing smear along the leg (even the fog the build view already knows) is the last
   unfinished shot of the ending.
4. **The fail band still rides the chips at 633,** and the sandbox rules line overprints its own
closure — two small chrome debts at the flagship window.
5. The chime's repetition at sandbox grind (uneard by me; law-verified only).

Cheapest points, in order: (1) give one encore or the finale a blocked-rim moment (the k02 machinery
already exists — point it at porch05's last gap); (2) ship the "lower it" verb (one rotate detent step
or a param nudge on the aimed piece); (3) paint the crane legs; (4) move the sandbox rules line off the
hash row.
