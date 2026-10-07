---
tags: [session]
livedocs: snapshot
---
# 2026-10-09 — Stage 4: K4 "The Tap" — Playtest R's wall, replayed (Level Designer)

Branch `stage4-k4`. R cleared K1–K3 in one try each and walled at `kitchen04`
in three tries and quit (`Sessions/2026-10-09 Playtest R round3.md`). Items:
replay her builds headless and classify the deaths; check the wet-patch
lesson's learnability; audit the "blocked everywhere I could aim" placements;
cross-check the note-advice honesty. No geometry changed — the wall was not
the geometry, and two documented CLAIMS were wrong.

## 1. The replay (reconstruction + assumptions)

Replay mount = the shipped builder's: fixtures anchored at their par
transforms (`initialBuild`), tray pieces chained onto the running exit cursor
in place order with the tray's one geometry per kind — the learnability
pass's `kitchenPlaced` emulation, EXTENDED with the REVERSED seat
`src/ui/builder.ts` `place()` produces while the `flipped` flag is up
(half-turn about the target socket's up). Assumptions, stated because R's
raw session file is not in the repo: (a) her lip was a reversed mount on
every try — she says so ("my lip only existed as a REVERSED mount"); (b)
tries 1–2 were one build (her Remove clicks no-op'd behind the result card —
determinism does the rest: replay says the SAME hash); (c) "straight blocked
everywhere I could aim" (item 3) means the straight may be ABSENT from the
build — both the 3- and 4-piece variants were run and, in this family,
nothing placed AFTER the lip matters: the car dies at the lip catapult
before it exists (bit-identical times).

## 2. Death classes (all headless, builder mount)

| family | build (reconstructed) | dies | note printed |
|---|---|---|---|
| A — REVERSED-`gapLip` sink catapult | `drop → gapLip⟲ → (landing)` (tries 1–2) | 2.192 s, x≈1.47, touchdown nose −54° | "fell off nose-first — flatten the landing or lower the lip" — R's verbatim |
| B — REVERSED-`gapLip` past-cup overshoot | `drop → landing → gapLip⟲ → straight` (try 3) | 2.533 s, x≈2.56, −22° | THE SAME LINE — why three tries read as one diagnosis |
| C — reversed lip at the ramp exit | `gapLip⟲ → drop → …` | 2.167 s | "fell off the set — the line let go before the cup" |
| D — forward omissions (contrast) | `omit s` 2.658 s, `omit l` 2.883 s nose-first; `omit d` wet-drive 2.717 (dry 2.725) | — | honest tails |

**Clock separation (item 2): NOT needed.** A and B are 0.34 s apart and die
in different visible places (sink vs past the cup) — the L02 −29°/0.16 m
ramp tool is the answer to a clustering the clock does not have here; the
sameness R read was the IDENTICAL NOTE TEXT (plus, on one try, the camera
burying itself in a peach wall — the camera lane's standing finding, not
re-opened here). Pinned by a test: the two reversed families are > 0.2 s
apart and both `fell`.

## 3. Geometry verdict: the wet-patch lesson is half-learnable, and the card was wrong

R's question — can the wet-patch lesson be learned with this tray at all?
Measured on the builder mount: **10 of the 24 whole-tray orders stand a deck
across the sink's near half and ROLL THROUGH `sinkSplash`** (grip 0.5 for
0.11–0.29 s, up to 35 steps) **and still finish**, at 2.53–2.61 s — inside
the fly lines' own 2.47–3.12 s span. So the zone DOES bite on buildable
lines (the level header and card claimed "no finishing line touches the
zone" — only true of the FLY lines; corrected in both), but the toll has no
stakes: no buildable line dies of grip, and the wet/drive and fly clocks
overlap, so "the patch forces a line choice" is currently taught as an
ORDER fact (deck the sink = roll it wet) rather than a timed trade-off. One
sharper honesty find: the tray-minus-`drop` order `gapLip → straight →
landing` **finishes WET (2.558 s) where it `fell` DRY (2.817 s)** — the
ladder's wet-can-rescue property (bathroom03's twin) exists on this rung
too, now test-pinned both ways. The hazard PROBE (`kitchen04GroundBuild`)
and the par's bit-identical fly (grip stays exactly 1 on the par, test now
asserts it) are unchanged. Geometry NOT touched: fixing the toll's stakes is
ask #2b's lateral half / the zone's `source` story, not a clock fix.

## 4. The "blocked" placements: legitimate, data-pinned — no row fix

Guard audit (builder's `setPlacementGuard` replica, every open socket × every
tray kind × forward/flipped): on `kitchen04` exactly ONE socket blocks the
straight — `end of ramp` (1.335, −0.267, 0): the 0.3 m tray geometry's tip
reaches x = 1.635 = the zone centre, and the `tap` group box (x
[1.622, 1.700], z [−0.123, +0.013] — it STRADDLES the lane) is the guard's
named solid there. That is by construction: the tap-over-zone law pins the
drip at the zone centre ON the lane (the sink the arc must fly), so no yaw
or offset in `TAP_LEVEL` can move the group box off x 1.635 — the box must
contain the drip. A deck into the sink footprint is the ground probe's
bridge; refusing it is the guard working, not clipping a legitimate target.
`landing` forward is blocked at the same socket for the same reason; every
other socket accepts every tray kind (on `kitchen01` for contrast: nothing
blocks; K4's ramp end sits 0.10–0.15 m from book-stack/carton/pencil — clear,
but the yaw row does bring the dress closer than the 0.45 m standard).
"Blocked everywhere I could aim" is therefore ONE blocked socket × the
120 px hover-snap radius re-claiming it wherever she pointed near the ramp
(arrow-walking to `level start` accepts the straight — verified). Not a
guard-code defect, not a wrong mount offset: **no setPlacement row change;
no FE handoff on the guard.**

## 5. Handoffs

- **FE — `src/ui/result.ts` (+ `actionableKinds` plumbing in `src/boot.ts`)**:
  the nose-first tail names a kind whose ONLY placement is REVERSED. R's lip
  was mounted backwards; "lower the lip" is not advice for that build —
  lowering a reversed mount changes nothing; the fix is "flip it back". The
  gate today is kind-presence only; the evidence for mount handedness is in
  the build (seated inlet tangent vs the socket's). Same-line refinement:
  the tail can name a piece placed strictly DOWNSTREAM of the death (R's
  sink death at x≈1.47 — the landing sits BEHIND the lip the car never rode,
  ≈ 0.2 m further along the chain) — same
  "noise, not advice" fault the M/Q passes fixed for absent kinds. Not
  edited here (result.ts is the FE's).
- **Systems — `src/ui/builder.ts`** (observation, her report + the code):
  `flipped` is createBuilder-session state — R toggles it even with nothing
  held (R "did nothing" while silently arming the reversal she later saw
  only in the diagnosis) and it persists across kind picks, so one stray
  press can reverse EVERY later mount. A per-hold reset, or making the
  empty-handed R say what it did, retires this class of wall.
- **Camera lane**: R's one buried death (peach wall) is the lane's standing
  finding; nothing new measured here.

## 6. Files

`src/world/levels/kitchen04.level.ts` (header claims corrected — no geometry,
no hashes), `tests/unit/kitchen-levels.test.ts` (new describe: par grip==1
pin, wet-route pin, wet-rescues pin (wet vs dry), reversed-lip wall pins
with the >0.2 s clock separation; builder-mount-with-flip replica),
`docs/vault/Concepts/Levels.md` (L04 card), `docs/vault/Reference/Level
Ladder.md` (kitchen04 row), this log. `pars.json` unchanged —
`npm run pars -- --check` passes; setPlacement untouched.
