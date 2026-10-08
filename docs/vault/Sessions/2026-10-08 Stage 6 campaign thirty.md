# 2026-10-08 Stage 6 campaign thirty

Livedocs: snapshot. Role: Level Designer. Worktree `gw-ld15`, branch `stage6-campaign30`.

## The ask

§13 wants THIRTY levels; the campaign walked 26. Grow to exactly 30: one encore rung
(`05`) in each of the four 4-rung rooms — kitchens and porch stay. Per rung: a par that
finishes under a fresh generated parTime, tray ⊇ par + one decoy + one temptation, at
least ONE genuinely new idea over the room's ladder, honest late-ladder difficulty
(harder than the room's 03, under its finale), placement rows, tests, ladder proof.

## The design: THE DOUBLE CROSS

No rung in any of the four rooms' ladders ever crossed TWO gaps on one line — every rung
01–04 rides exactly one hole. Encore rung 05 says: ride two. Par = `drop → straight →
drop → landing` on a start at the room's capstone height (ramp 0.26) — the room's own
verbs, but the line has never existed here.

The geometry is a stated deviation, rung-local like `KITCHEN05_GAP`/`PORCH_STEP`: the
dip is the ladder's 0.12 m step on the porch THRESHOLD's LONG LEAD (0.11, span 0.3566 m,
`DOUBLE_DIP` per file) — the fail-timing law's own tool: a missing piece leaves a hole
LONGER THAN A ROLL-OFF CAN FLY (~0.31 m measured at this launch), which kills the star
steal the stock 0.2366 m gap would leave (on the stock lead the 3-piece omission
`straight → drop → landing` FLIES the remaining hole and finishes UNDER the par line —
measured 2.592 vs 2.625 at lead 0.05; that build FALLS here, pinned). Every one- and
two-piece omission falls — 11/11 swept — the kitchen01 promise law restated on a long
line: a half-line falls in a sink.

Tray (uniform, the family's choice-tray economy — bathroom02's union rule): the par's
four pieces + ONE DECOY `straight` + ONE TEMPTATION `booster` = 6 = budget. The
`booster` is the room's first speed purchase (kitchen05's verb, never in these rooms'
trays). Measured on every rung: place the whole tray and it still finishes (the decoy
tail's extra deck lies past the cup, the run is par's own — same hash, piece-star
cost); the decoy MID-LINE displaces the second dip and falls; booster EARLY buys ~0.6 s
(5 pieces, the time star, the piece star paid — kitchen05's "spend it EARLY" law,
now stated in these rooms' own voice); booster LAST buys nothing at all (par's own
clock, one piece wasted — the sequencing lesson measured both ways). The par ORDER is
beatable inside the tray (dip–catch–dip–deck runs 2.783) — the kitchen04 law.

Campaign order (the design call the table had to make): ids stay APPEND-ONLY — the new
files are `bedroom05/bathroom05/garden05/garage05`; the FLAT ladder slots each encore
between the room's 03 and its finale, so every room block reads 01, 02, 03, 05, 04 —
difficulty stays monotone (03 < encore < finale) and each room's finale stays its last
rung, the boundary steps (`bedroom04 → bathroom01`, …, `garage04 → porch01`) unchanged.
The encore is harder than 03 honestly — every omission FALLS, while 03 forgives its soft
line — and under the finale honestly: the capstone's whole-tray order-invariance mastery
(24/24, every verb) stays the room's hardest claim; the encore asks for one longer line.

## Room cards (the geometry economy is shared VERBATIM; the LESSON is each room's)

- `bedroom05` **Double Take** — the cable snake crosses the lane TWICE; RIDE OVER, both.
  No live zone (the bedroom ladder ships none by law). The booster tempts a shortcut off
  the lamp shelf; the second cable does not care.
- `bathroom05` **Twin Drains** — two sink drains, one puddle: the live zone sits IN the
  second sink's hole at the waterline the decked line would roll — and the PAR RIDES THE
  CATCH ARC OVER IT: the wheel is airborne inside the circle and never touches the water.
  New grip statement for the ladder — bathroom01's airborne law on a ROLL-OFF, not a
  launch: even a ridden dip keeps its wheels dry (bit-identical wet==dry pinned; the
  decked probe diverges and runs wet-FASTER — low drag, the same honest delta).
- `garden05` **Two Shadows** — the trellis bars stride the two bores; ZERO live zones by
  the garden's light law (pure reading, `prop:shadowBars` says it). The temptation is
  the room's first speed purchase in a room whose lesson is always the EYE.
- `garage05` **Dyno Run** — two stains' worth of air under the door-gap blade; the oil
  film LIVE in the second dip's hole (`source: 'oilStain'`), par airborne-dry, probe
  wet-faster; the booster is a dyno pull you can spend early or decorate with.

## Measured table (ramp 0.26, dip 0.12/45°/lead 0.11 — span 0.3566, `DOUBLE_DIP`)

(par 3.017 s → parTime 3.05; rail mid x 1.3602; finish deck y −0.56919)

| build | status | clock | claim |
|---|---|---|---|
| par `d,s,d,l` | finished | 3.017 | 3★ reference |
| every 1- and 2-piece omission | fell | — | promise law, 11/11 swept |
| `d,s,d` / `d,s,l` / `s,d,l` / `d,l,s` | fell | — | no half-line flies the long hole |
| whole tray par+decoy-tail+booster | finished | 3.017 | piece star paid, run is par's own |
| decoy MID `d,s,s,d,l` | fell | — | the spare deck displaces the dip |
| booster EARLY `b,d,s,d,l` | finished | 2.425 | time star, 5 pieces — the trade |
| booster LAST `d,s,d,l,b` | finished | 3.017 | par's clock, one piece wasted |
| order `d,l,d,s` | finished | 2.783 | par order beatable (kitchen04 law) |
| order `s,d,d,l` | fell | — | deck-first never catches the second sink |
| lip builds (no lip in tray) | fell | — | the pop cannot cross a 0.36 m sink |

## Session notes

- The stock-gap star steal: with the ladder's 0.05 leads, omitting EITHER dip finishes
  (the remaining deck sits 0.12 ABOVE the cup and 0.24 short — a 2 m/s roll-off flies it
  in ~0.30 s of clock). The long-lead dip is the cure, measured, and it is the porch
  ladder's own threshold geometry — the fail-timing law doing ladder work.
- Ladder proof: fresh Chromium per encore, no instructions — par build launched through
  the real page, finish + ★ + Next, per the campaign.spec OPENS pattern.
- `tools/replay-all.mjs`: 30 rungs verified. pars.json regenerated (CI `--check` green).

(Commits: `stage 6: level designer - <what>`; livedocs gate honored — Levels note and
Modules/world.md body-edited with the encore section.)

## Verification

- `tools/replay-all.mjs`: **30 rungs, all verified** (fresh generated pars; every prior
  rung's hash byte-identical — bedroom05/bathroom05/garden05/garage05 all ride hash
  `1b37dfed` at 3.017 s, parTime 3.05).
- `npm run pars -- --check` green (32 registered ids; the 26 pre-existing cells
  byte-identical — the diff is exactly four appended entries).
- Unit suite: all files green (campaign table 30, boot ladder walk through the encore
  slots, four room ladders incl. the encore describes, star/board economics pinned).
- Playwright: full suite green on :4410 (170 passed, 1 designed skip) — includes the
  four-encore clean-browser ladder proof, the encore mint→unlock chain, T+U 3's 30-rung
  cup-framing sweep, and every boundary OPENS test unchanged.
- `npm run build` clean.
