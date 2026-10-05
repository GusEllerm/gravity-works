---
livedocs: snapshot
---
# 2026-10-06 Stage 3 — L04 learnability (Playtest G's wall)

Brief: G cleared L01–L03 in 1/2/3 tries and HARD-WALLED at `kitchen04` (nine attempts, every tray
combo, all "nose-first"/"flew off", quit). Levers: fixtures, budget, tray, geometry params,
`parBuild` — no physics, no shell. Work on branch `stage3-l04`.

## (a) Reproduction — G's nine builds, headless, on the mount the SHIPPED builder makes

Emulated `initialBuild` (fixtures ANCHORED at their par transforms) + tray seating
(`levelTrayParams`) + the target-follow placement rule, and replayed every attempt via
`replayRun`/`World`. All fail, and the witnesses say the wall is the TRAY, not the arc:

| G's build | verdict | where the car dies |
|---|---|---|
| `drop` | fell t=2.19 | rolls off the drop's near lead into the sink; last touchdown −54.2° nose, 1.94 m/s, then the floor |
| `drop → landing` | fell t=2.53 | touchdown −21.9° at x=1.59 (the "nose-first" note fires at ≤ −20°), then rolls off the deck END 29 cm short of the cup — "long jump" |
| `landing` (R-flipped) | fell t=2.17 | never a real run: off the ramp edge straight into the sink |
| `drop → straight` | fell t=2.58 | same as drop+landing, deck ends 33 cm short of the cup |
| `straight`×2 @ ramp | fell t=2.67 | decks the sink but ends 38 cm SHORT of the anchored cup, 1.6 m/s roll-off → "flew off" (matches the coherence table's `fell` at 2.675) |
| `straight`×2 @ cup-exit | fell t=2.17 | dangles PAST the cup; the line from the ramp never gets built — sink |
| `gapLip → landing` | fell t=2.48 | launched over the missing `drop`'s hole, lands past the landing end |
| `landing`@cup + `drop` | fell t=2.21 | −54° nose-first down the drop face, into the sink |
| (the answer: par 4-piece) | **finished 2.52 s** | touchdown −21.9°, 1.53 m/s, on the landing run past the patch |

Diagnosis: the geometry only ever had ONE buildable line (the par chain), but the TRAY showed FIVE
pieces for a FOUR-piece answer (`straight` ×2, one spare). "Which 4 of 5?" is a pure guess-space,
and every wrong subset dies harshly (the sink is a hole). Every kit socket seats flat, so a
chained line's reach is an order-invariant SUM of its pieces — that law both explains the failures
and fixes the level.

## (b) Redesign — eligibility, not guessing

`kitchen04.level.ts`: **tray = the par line's exact multiset** — {`gapLip`,`drop`,`landing`,
`straight`} = budget 4, all load-bearing (L03/L05's rule, the one L04 broke). NO geometry moved:
the par chain, the 0.3 m `L04_STRAIGHT`, the wet patch and the tap's yaw are byte-identical, so
the par hash and every hazard/set/camera claim are untouched (`pars.json` byte-identical,
`gen-pars --check` green). Measured after the change:

* **ALL 24 orders of the whole tray finish** builder-anchored, 2.47–3.12 s (test-asserted) — the
  player places everything and the line always reaches the cup; the lesson is the ORDER/speed
  question, discovered by driving, not by subset-guessing.
* Par 2.52 s stays the reference ORDER and is BEATABLE within the tray: `drop→landing→straight→
  gapLip` runs 2.47 s (test-asserted).
* G's partials (`drop`, `drop→landing`, `drop→straight`, `gapLip→landing`, `straight`) stay
  pinned to FAIL — the sink is the `drop`'s 0.24 m span, longer than a flat roll-off can fly.
* The "gentler first crossing" levers (shorter span, shallower drop, lower ramp) were measured and
  REJECTED: the ramp's exit x/y is pinned by the set mount (`TAP_LEVEL` — the tap's drip solves
  onto the patch centre), and any span/step change moves the whole deck past the guard-box clearances
  for a pitch the landing already absorbs (par touches −21.9° ON a 0.36 m catch deck and finishes;
  the −20° "nose-first" note only ever fires on FAILURES, which were subset failures, not arcs).

The "second line that avoids the patch" is **mathematically off the table on one anchored rail**:
a bridged (ground) deck ends at the RAMP's height, 0.176 m above and 38 cm short of the low cup the
chained par anchors, and no flat-socket piece subset bridges AND drops to that cup. It was never
buildable in the builder (the coherence pass measured its `fell`). `kitchen04GroundBuild()` is
therefore re-labelled the **hazard/juice probe** it physically always was (it still proves the zone
hook: hash diverges wet/dry, both variants finish, wet runs 0.06 s faster) and left the
tray ⊇ authored-LINE roster in the ladder test with an honest comment.

## (c) Callout — none shipped, deliberately

Checked "how L03's bowl callout ships": **it doesn't** — `src/ui/callouts.ts` is a manifest keyed
by piece KIND plus an empty `PROP_CALLOUTS` (`prop:tap` appears only as a test example); levels
carry no callout field and boot fires kind-lines on first PLACE (every L04 kind's line is spent by
L01–L03 anyway). With the tray fix the lesson needs no text. FLAG for the shell/systems lane: a
`prop:tap` registration ("The tap wets the deck — wet halves grip.") would land the hazard tell on
L04's first load — one manifest row + one `firstSight` call at set mount, both outside LD's files.

## (d) All five levels + sandbox

`npm run typecheck` green; `vitest run` 249/249 green (includes the new L04 order-sweep/partial/
beatable gates and the L02 anchored E-build test); `gen-pars --check` green — **pars deltas: none**
(par builds unchanged: 2.25 / 2.35 / 2.65 / 2.55 / 2.40 / 2.70; L04 par pieces 4 on the tray basis
was already right).

## (e) L02 discovery verdict — no nudge needed

E's own L02 build was `straight → drop → straight` — E FOUND the lazy line. Replayed on the
current shipped mount it finishes, 2.32 s (now pinned as a test). E's session predates the
builder's target-follow fix (the same `targets()` array-order bug that ate L01's promise); the
failure was the seam in the UI, not the seam in the level. A fixture cue-line would be
window-dressing over an already-fixed bug — implemented nothing, documented in the L02 card.

## Blockers / hand-offs

* ask #2b (`Level.finishSocket`) remains the only road to L04's original "two lines" promise —
  until then the card states the anchored truth and the patch is a TELLS-not-a-TOLL.
* Shell lane: `prop:tap` callout wiring (one line, §c).
* Shell lane (from G's §6, unchanged by this pass): the verdict/picture disagreement ("seated" +
  "flew off", car resting in the cup at 0) is the capture-radius + status-line story, not level data.

Cards updated to measured truth: [[Concepts/Levels]] (L02, L04, replay table, guarded-by),
[[Reference/Level Ladder]] (L04 row, tray ⊇ roster), [[Modules/hazards]] (probe re-label + review
stamp).
