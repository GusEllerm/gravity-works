---
livedocs: snapshot
---

# Stage 4 — K5 booster discoverability + fixture reading (playtest Q round 2)

Q cleared K1–K4 and WALLED at K5 Sunday Run: "Booster fits nowhere I could find" (4+ tries, quit).
Brief items 1–3, worked in `stage4-k5`.

## 1. Booster verdict (item 1)

Replayed Q's class of builds headless (builder-anchored tray seating — the same `fitSocket`
chain the shipped builder runs, tray geometry from `levelTrayParams`, `replayRun`):

| K5 build (tray order after the ramp fixture) | result |
| --- | --- |
| booster FIRST, then lip·drop·lip·drop·landing (the par order) | **finished 2.392 s** |
| lip·drop·**booster**·lip·drop·landing (mid-chain) | **finished 2.500 s** (+0.11) |
| lip·drop·lip·drop·landing·**booster** (place-LAST) | **fell 2.467 s** |
| lip·drop·landing·**booster**·lip·drop (late, = wrong answer B) | fell 2.842 s |
| no booster (5 pieces) | fell 2.467 s |
| booster only / booster+lip | fell |

**The socket was never the wall.** On the fixture-only boot build the booster
`snapSocket`s at the ramp's open exit — and that socket IS the builder's boot default
target (`chainHeadIndex`), so the new target ring already sits on the par's booster
socket and a held booster reports `fits here` there. The wall was the ORDER story.

**Verdict: on K5 the booster does NOT belong mid-chain.** Mid-chain finishes but pays
+0.11 s; last FALLS; early (straight off the ramp) is the fast line. Declared in the
level file's header ("PLACE VERDICT") and pinned as data: `kitchen05MidBoosterBuild`
(second intended line, finishes) and `kitchen05LastBoosterBuild` (wrong answer C, the
place-last reading, does NOT). The level declaration carries a note that the data has
no per-level hint render seam — the shipped hint surface is the callout.

## 2. Hint-truth check (item 1)

**There is no "place LAST" string anywhere in shipped data or notes** (grepped `src/`,
`docs/vault/`, patch refs). The only shipped copy that reads as a placement ORDER is
the `booster` first-sight callout, which said: "One push, paid from the budget, **in
the middle of a run**." K5's par places the booster FIRST of the six tray pieces, so
that copy contradicted the par under every reading — "middle" measures to the +0.11 s
line and "last" (what Q appeared to attempt) to a `fell`. K5 is the booster's only
campaign tray (sandbox aside), so the callout IS K5's tray hint. Fixed the hint data
(level order untouched — it is measured): `PIECE_CALLOUTS.booster` = "One push, paid
from the budget — spend it EARLY; speed saved for later overshoots." (≤ 90-char §11
gate passes).

## 3. Fixture reading (item 2) — route: HANDOFF, not level data

Measured: at runtime every build piece — functional fixtures AND the K2 run-out curve /
K3 bowl rim — is swept in the SAME track orange by `buildTrackMeshes` (one material per
build; `PlacedPiece` carries no material field and `serialize` would drop one). So the
brief's "track orange on fixture pieces that are part of the timed rail" is already
true on the shipped page. The actual Q misreading is the INVERSE: the pre-placed curves
in K2/K3 are **off** the timed rail (K2's curve is laid after `finishCup`; K3's rim
pair sits on the set's bowl sockets and the run ends at the cup before it) yet wear
playable-rail plastic — scenery that reads functional. Demoting off-rail rails needs a
render-side per-piece visual flag (FE/SE seam in `buildTrackMeshes`/`PlacedPiece`) —
**handoff: FE/SE, a `scenery`/role flag on build pieces; geometry untouched here (hash-
pinned)**. Nothing changed in kitchen02/03 level data or sets; the notes live in the
Level Ladder rows.

## 4. Changes + gates (item 3)

- `src/world/levels/kitchen05.level.ts` — place-verdict header; `kitchen05MidBoosterBuild`
  + `kitchen05LastBoosterBuild` exports; declaration note (no `trayParams`/hint by design).
- `src/ui/callouts.ts` — booster one-liner (above).
- `tests/unit/kitchen-levels.test.ts` — both intended K5 lines finish + three wrong
  allocations don't; both new lines in the tray-⊇ table.
- Par/geometry UNTOUCHED: `npm run pars -- --check` clean, tray=par multiset intact
  (6/6), full unit suite 526 green, `npm run typecheck` green. Scratch Q-probe deleted.
- Notes: Level Ladder K5 row honest + K2/K3 fixture-reading notes; Concepts/Levels K5
  card updated (wrong answer C, second intended line as data, socket-visibility claim).
