---
livedocs: snapshot
---

# Program T2 — the advice MOVE wave + the share page's first two seconds

Action Plan 2026-10-09 T2.1 + T2.2, worked on branch `p2-voice` off main (T1.3 `5f14a18`).
Role: Level Designer (advice copy) + the share-page surface. Laws obeyed are named inline;
the standing statements live in `Modules/ui`, `Modules/replay`, `Modules/share`, and four
`Decision Log` entries dated 2026-10-09.

## T2.1 — the MOVE clause (`moveHintFor`, `src/ui/advice.ts` → `physicsNote`, `src/ui/result.ts`)

The failure note could only ADD. Two readings of the build graph (socket facts only — the
determinism law is untouched: `null` on the shared/replay paths, the physics never sees the
hint, no run hash moves):

- **ORPHAN** — a piece the PLAYER placed sits joined to the goal's own open exit. The clause
  (`the drop sits past the cup — pull it back`) **outranks the ADD list** in the drive-off
  branch: naming a kind to add while a placed piece dangles past the goal is the
  lie-by-silence the R-flag note fix retired. An AUTHORED run-out never names (kitchen02's
  curve is authored, not stranded — the fixture id is excluded by construction). The return
  seat rides the existing WHERE tail (`aimHint`), so the sentence teaches `]` with no new verb
  (tie-walk = aim-to-socket since the stage-6 a11y fix).
- **BOOSTER** — actionable but not spent at the head of the line (unplaced / off-chain /
  seated after another tray piece): "the booster needs spending EARLY — remove back to the
  ramp and place the booster FIRST, before the first lip · press ] to walk the open ends".
  Fires ONLY where the ADD tail is silent (stock spent or tray-only-booster) — ADD outranks
  while a placeable piece remains — and never names a booster the player cannot act on
  (playtest-Q gate, `canAct`). The `remove back to the ramp` pre-clause appears exactly when
  the ramp's exit is taken (the graph knows, per order).
- The machine naming (`fell off the track at 2.4 s` / `rolled past the goal`) survives
  byte-identical; the clause is an insert, not a verdict rewrite. `MoveHint` carries the
  phrasing so `result.ts` never learns piece words (advice owns the graph and the words;
  `goalNoun` stays the note's own).

### The kitchen05 residual, closed decide/log/blind-prove

- **DECIDE**: booster ordering belongs in the NOTE (drive-off branch, tray-silence only), not
  a new callout — the first-sight callout already says "early", and a wall the note can speak
  needs no second voice. Taught by placement, not by keys (`]` for the sequencing rung).
- **LOG**: the no-booster line (`ramp, lip, drop, lip, drop, landing, cup`) `fell off the
  track at 2.467 s` — a gram of rolling resistance short of the back gap's far rim (the card's
  original numbers, restored by the `KITCHEN05_GAP` pin). Booster-first rebuild = the par
  build, finish 2.39 s, ★★★.
- **BLIND-PROVE**: `tests/e2e/program-voice.spec.ts` is the blind player — it places by
  Place/`]` only (no mouse hover), fails the wall build, reads the sentence, then EXECUTES
  it: Remove ×5 (each label naming its piece — `Remove the drop past the cup` on the last),
  `]` walks the ring to `ramp exit`, booster first, the rest in order. The finished build is
  byte-equal to `parBuild()` (serialized transforms, sorted multiset) and the verdict is ★★★.
  The residual needed no geometry change and no new key.

### T2.1 side-find: kitchen04 is placeably UNWINNABLE (deferred, loudly)

The same proof attempted on kitchen04 found ZERO legal second seats in all 24 whole-tray
orders: after `gapLip @ ramp exit` the sink-exit socket refuses every piece with
`blocked — the tap is in the way`. Measured: the `tap` group box's bottom edge
(`setPlacementGuard` → `blockerOf`) sits 2.2–7 mm below the sink-exit deck plane the par's
own pieces run through (`endSocket` y ≈ −0.2348 vs box floor −0.237). The K4 tap-wall audit
enumerated the INITIAL sockets only — never the mid-chain seats a build walks into. Options
(mount lift / leaf-granularity guards / socket retarget) all re-derive a shipped rung and owe
a playtest, so the fix is DEFERRED with evidence (`Home`, `Concepts/Levels` k04 card,
`Decision Log`). The clause proof therefore demonstrates on k04's BUILDABLE half (the
cup-exit orphan: `place at: end of the lip` IS a legal seat) and executes end-to-end on k05.
Proof of the fix direction, headless: the par build built on the mount finishes
(`par build finishes 2.483 s` in the e2e build probe's twin run) — the physics was never the
wall, the guard box is.

### Remove names its target (`removeIndex`/`removePhrase`, `src/ui/builder.ts`)

`Remove the <piece> <locator>` — locators in the ring's own words (`by the ramp`, `past the
cup`, `at the car's start point`), `you placed last` only when the graph locates by nothing
else; LIFO stated in `title`/`aria-label`; one scan with `removeLast` so label and click
cannot drift; plain `Remove piece` when nothing is owned. The Place-button naming decision
extends to its twin.

## T2.2 — the share page opens PLAYING (`src/pages/share.ts`)

The film leads: stage first substantial node, `startReplayPlayer` paints the PRE-WIND preview
as the first paint, title demoted to a caption, the bar (Play, scrub, speeds, `Build your own`
exit) mounts BEFORE the wind so the CTA is one click from first paint. The badge element is
RETIRED (not hidden) — one honest verdict line under the player (`#gw-replay-verdict`,
`role=status`) promises while the tape winds and pronounces when `settle` lands
(`✓ verified · matches the link — re-simulated on this machine` / `⚠ this machine disagrees ·
the replay here differs from the link`), machine-local wording, glyph riding the word; the
hash essay sits behind a closed `<details>` fold with the mechanism paragraph byte-identical
inside. Autoplay legality stated where it belongs: the page RE-SIMS — it is not a media embed
(evaluation's own distinction); reduced-motion pause and click-to-override unchanged. All
spec-read IDs and the `verified`/`mismatch` strings survive unchanged; the physics is
untouched, so the determinism law holds by construction and `replay:all` is untouched.
Proofs: `tests/e2e/program-voice.spec.ts` DOM-order test + the reworked
`tests/e2e/share-replay.spec.ts` (both green).

## Housekeeping found on the lane

`tests/e2e/lifecycle-kill.spec.ts` was red ON MAIN (verified on a clean main checkout): its
disk readers still parsed the pre-stamp envelope (`builds.kitchen01` as a bare string) while
the stamp format writes `{t, s}` records — a T1.3-era test-compat miss, fixed here as a
reader-only repair (no product code), green after.

## Gate status

Unit 825/825 green (incl. the `physicsNote`/`moveHintFor`/Remove-label sweeps); full e2e
215/215 green; `npm run build` green; typecheck green. Docs: `Modules/ui`, `Modules/replay`,
`Modules/share`, `Concepts/Levels`, `Home`, `Decision Log` reconciled with the code in this
same lane.
