---
livedocs: snapshot
tags: [session, stage-5, level-design, kitchen, fail-timing, salvage]
related: [[Concepts/Levels]], [[Reference/Level Ladder]], [[Modules/world]], [[Modules/camera]], [[Sessions/2026-10-10 Playtest AA stage5]], [[Sessions/2026-10-10 Playtest BB stage5]], [[Sessions/2026-10-10 Stage 5 - B2 pass 2]]
---

# Stage 5 — kitchen03 "The Bowl" re-sweep (Level Designer)

## SALVAGE NOTE

A predecessor drove this task and died mid-run (wire fault) at checkpoint
`aca3294` on `stage5-k3`: kitchen03 geometry + pars + setPlacement + two
test files re-authored, typecheck-clean, **sweep unfinished**. Their
headless diagnosis of the AA+BB double wall was reconstructed and is
believed; their re-authored geometry was carried forward as the direction,
then finished and CORRECTED in four places (below). Nothing was re-done
from scratch; everything was re-MEASURED.

## Goal

Playtests AA and BB wall-backed-to-back on `kitchen03` ("The Bowl"): AA 4
builds to the 3★ ("no advice text ever differentiated my six builds" — of
the NEXT rung, but the bowl's four were equally undifferentiated), BB 6
builds and quit. Reconstruct their ten builds headless against the
checkpoint geometry, classify death clock/site/advice, complete the K2
fail-timing-law verification the checkpoint had started, measure
whole-tray first-try payoff, keep every contract (tray = par multiset, no
par inflation, pars regen, set-wiring, camera in-frame, ladder rows
honest).

## (1) The checkpoint's diagnosis — VERDICT: RIGHT

Headless re-sweep of the OLD geometry (every chainable build of the tray):
the −12°/0.3 m shared ramp's ~2 s crawl put every death at 2.58–2.96 s
(ramp-end arrival + the constant ~0.4 s fall — the K2 law, never executed
on this rung), and the forgiving `KITCHEN_GAP` spans left ~0.15 m of reach
slack — 15 of the 4-piece subsets FINISHED, so the failing that taught was
a minority pattern. Their fail-timing re-authoring (−29°/0.34 m chute,
0.22 m equality-law `straight`/`gapLip` spans, 0.10 m `drop` step, shallow
8° sink `landing`) is the right direction and was kept.

## (2) Their checkpoint, rebuilt headless — two walls found

On the checkpoint geometry (drop step 0.10 m, sink LAST in the par order,
chute blend 0.12):

- Enumeration: 111/111 subsets fell, 1.06–1.80 s — the fail-timing law
  ITSELF passed.
- But the whole-tray order `s,s,d,g,l` FELL at 1.633 s on **every seed**
  (the rail is seed-independent — the checkpoint's "completes on other
  seeds" claim was wrong; only launch SPEED moved it) — a porch03-style
  order WALL for a first try that places decks first and the sink last.
- And `camera.test` (kitchen03, the beige-wall gate) was ALREADY FAILING
  at the checkpoint — worst |ndc| 1.278 for ~0.2 s at t ≈ 0.75–0.95: the
  car crossed the long chute's toe at 2.4 m/s, the run camera's 0.35 s
  rotation lag kept the axis ~20° down the dead chute while the car
  levelled on the deck, and the car rode the top frame edge off-screen.
  Deaths stayed in frame, but the rung broke a law the checkpoint never
  re-ran.

## (3) The corrections (four numbers, all measured)

- `L03_DROP.height` 0.10 → **0.11** (still under the ladder's 0.12 belly
  threshold): pops the lip-launched car over the sink's rising tail
  instead of nose-first into it — the wedge family cleared (landing
  steepening, sink level/angle and drop-lead micro-variants all measured
  and REJECTED — they moved OTHER orders into the wall).
- `L03_RAMP_BLEND` 0.12 → **0.16** — camera-framing-tuned, kitchen02's
  convention: at 0.16 the toe's pitch step is slow enough for the
  rotation lag to track (worst 0.92). Behaviour unchanged (111/111 fall,
  same bands).
- `L03_DROP.lead` 0.125 → **0.11** — with the 0.16 blend, 0.125 leads
  wedged `s,l,d,g,s`/`l,d,s,g,s` again; 0.11 restored 60/60.
- The par REFERENCE ORDER lays `landing` FIRST — the sink sits at the
  chute toe ("the car drops off the books into the bowl's mouth",
  kitchen02's toe idiom). Behaviour is order-invariant (reach sums), so
  this choice is the camera's: sink-at-toe keeps the fast toe inside the
  in-frame gate (par run worst |ndc| 1.28 → 0.92). Tray, budget and the
  par multiset are untouched; the set-placement row re-derived once more
  (1.1063, −0.5008) and the par hash re-pinned `a1a50d05`.

## (4) The ten rebuilt walls (builder mount, final geometry)

Assumptions: AA's sheet names the nose-first flip ("flipped landing +
lip") and the 4th-build whole-tray clear; BB's name lip+landing, a
straights bridge, lip cup-side, drop at "2 spots" and the "]" retry. The
rest are the most probable stranger sequence on this tray. "Flip" = the
builder's half turn about the socket up, transform-exact.

| build | chain | clock | site x | note |
|---|---|---|---|---|
| A1 straight bridge | `s,s,l` | 1.483 | 2.446 | fell nose-first — flatten the landing or add a lip |
| A2 K1 carry-over fit | `g,d,l` | 1.542 | 2.500 | fell nose-first — flatten the landing or lower the lip |
| A3 flipped landing + lip | `lR,g` | 1.067 | 1.756 | fell nose-first — flatten the landing or lower the lip |
| A4 whole tray (AA's clear) | `s,s,g,d,l` | FINISH 1.508 | — | — |
| B1 lip+landing | `g,l` | 1.367 | 2.256 | let go before the cup; add a straight or a drop |
| B2 straights bridge | `s,s,l` | 1.483 | 2.446 | flatten the landing or add a lip |
| B3 lip cup-side | `s,s,g` | 1.383 | 2.184 | add a flat landing or lower the lip |
| B4 drop spot 1 | `g,s,d` | 1.492 | 2.319 | add a flat landing or lower the lip |
| B5 drop the "]" spot | `s,g,d` | 1.492 | 2.310 | add a flat landing or lower the lip |
| B6 whole tray, deck-first | `s,s,d,g,l` | FINISH 1.500 | — | — |

CLASSIFICATION: every rebuilt failure dies ≤ 1.55 s, ON screen at counter
height, cup in frame, never airborne past the cup mouth; the advice
admits SIX different vocabularies across the families (test-pinned), and
both strangers' whole-tray attempts now PAY OFF. Retries-to-learn: each
family's note names exactly the kind it lacks → one informed retry per
build, and the whole tray is a 60/60 finish from ANY order.

## (5) Fail-timing law — VERIFIED, whole build space (test-gated)

- 171 chainable builds enumerated (default seed/launch): 111/111 subset
  orders FALL, deaths 1.07–1.74 s, five size-monotone bands
  (0/1/2/3/4-piece ≈ 1.07 / 1.17–1.24 / 1.27–1.40 / 1.38–1.55 /
  1.56–1.74), 44 distinct clocks, 3 quarter-second bands, spread 0.675 s.
- 60/60 whole-tray orders FINISH, 1.43–1.61 s.
- Tray = the exact par multiset (2 `straight`, `gapLip`, `drop`,
  `landing` = 5 = budget = par pieces) — piece-par for a first try at the
  whole tray is 100 % by construction; the par CLOCK is tight and honest:
  7 of 60 orders beat the 1.45 line (the 1.433 reference ceil'd — pars
  regenerated, `--check` green). No inflation on either axis.
- Not a dual-route rung — the "both routes finish" clause is N/A (kitchen
  dual lives on `kitchen04`).

## (6) Contracts

`npm run pars --check`, kitchen-levels (the re-authored K3 describes:
space size, enumeration + x-law, the all-orders test, the rebuilt AA/BB
test with builder-exact flips), set-wiring (rule re-derivation + hash
`a1a50d05`), camera (0.916 < 0.95 worst |ndc|, in-frame every step) —
green, and the FULL unit suite: 684/684. Ladder/Levels/world rows
rewritten to the measured numbers; Home's owed-K3 ledger line CLOSED.
