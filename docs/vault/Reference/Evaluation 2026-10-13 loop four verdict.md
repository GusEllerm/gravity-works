---
livedocs: snapshot
tags: [reference, evaluation, house-era, loop-four]
---
# Evaluation 2026-10-13 — loop four verdict (the furnished door, scored cold)

> [!abstract] Method
> Worktree `gw-k1`, branch `eval-k4`, tree `0afaf84` (main tip = F1+F2 merged: sets mounted, sound
> wired, door back). Checklist = the eight brutal truths of [[Reference/Evaluation 2026-10-13 player
> house era]] (the 7/10). `npm run build` + `vite preview` **:5150**, fresh browser profiles only
> (never a campaign save of its own), 1280×633 home, targeted 633×900 / 390×844 probes. Lanes: cold
> first 60 s + the journalist frame; three room frames at the PARKED eye with my own eyes against the
> `Sessions/furnish-door/` campaign column; one downhill sound-on; a tour; a named line; a chain
> round trip; ~15 min freeplay (fail → fix → mint → race → share → replay); then the regression
> sweep. Evidence `Sessions/eval-k4-door/`. Stated harness divergence, same as every prior lane: the
> premise beat does not fire under CDP automation (`__gwHouseBeat` = `{}`), so `12-beat-t0.png` is
> the forced `?intro=1` image; and mid-session the managed window went hidden — rAF throttled to ~1
> Hz and the sandbox's frame loop starved (a HARNESS effect, not the page's: the same build stepped
> clean in the visible sessions) — the freeplay lane restarted in a fresh session with an init-script
> frame pump, stated per call, sim untouched (the receipt hash proves it).

## Closure table — the top-8 truths, in play

| # | Truth at the 7/10 | Verdict now | The scenario that proves it |
|---|---|---|---|
| 1 | The house is LITERALLY silent | **CLOSED** | Fresh profile, sound chip top-right says "Sound: on" at the door. Downhill with ears: `state().bed` flips garage→kitchen→bedroom→bathroom ON THE CROSSINGS, 114 roll updates, the terminal ring + whoosh, the bed returns to the parked room. One `AudioContext` per page (the engine mounts through `src/sound/mount.ts` behind an `if (sound) return` guard; the beat hand-off replays the swallowed gesture down the same code path — the hand-off test counts constructors), and the tour hand-off is a navigation, so it cannot double-unlock. |
| 2 | At the common window the door wears no name | **CLOSED** | `elementFromPoint`, not DOM: 15 points across the h1 rect at 1280×633, 6 at 633×900, 6 at 390×844 — ALL return the h1. The chip rides a flow line below the nameplate (`.gw-home #gw-daily-board`), the wordmark never hides. `01/02/03-*.png`. |
| 3 | The front door is one-way | **CLOSED** | `⌂ the house` (href `?`) is the nav's first crumb on the rung page, the sandbox page, and the share page (walked all three); one lone Escape from `?level=kitchen01` lands the house (`src/ui/home-door.ts`). And the farewell's "whole house" link — `?level=house` — now boots THE same page (`bootHouse` non-home: same h1, same mounted sets, Release, 30 tour rows honest-locked; `11-addressed-house.png`) the flatter second house is gone; what remains is a variant without the window overlay, one world, one URL family with a path between. |
| 4 | At 390px the six windows are a stack of lies | **CLOSED (edges contested)** | The cards are dead — hit targets are projected doorframe centres. All six CENTRES own their room at 633 and at 390; at 390 the ±3 px edges of the 72–98 px transparent buttons bleed into the neighbour (kitchen's right edge → bedroom). Nobody taps a doorframe's edge; the fan-of-lies scenario is dead, the honest-centre law holds. |
| 5 | Tab descends OUT OF ORDER; panels toll thirty stops | **PARTIALLY OPEN** | The walk is clean and complete (chip → All levels → Lines corner → Release → receipt → six windows → footers), but the windows still walk in `CAMPAIGN` order — GARAGE, the first room down and visually first, is visited FIFTH. And Escape still closes NOTHING at the door: open a window or the Lines corner, press Escape, `aria-expanded` stays `true` (`src/pages/house.ts` has no Escape handler; `mountHomeDoor` is not mounted there). The keyboard tax survives. |
| 6 | The door's tape contradicts itself | **OPEN** | Word for word, still there (`04-home-after-run.png`): `#gw-house-status` "4 rooms · 3.7 s" printed directly above `#gw-house-result` "4 rooms · 6.7 s — you stopped at the bathroom" — both `role=status`, one run. `finalize()` writes the result line and never the status line. The second Release changes nothing on screen, no "same film" note — verified again, identical bytes both runs. |
| 7 | Free is two hops; the door's run cannot travel | **OPEN** | Home carries exactly three anchors (`?levels=1`, `?daily=1`, rung links) — ZERO sandbox links; the free build is still All levels → board → row. The downhill mints its receipt into a `<details>` disclosure — no share surface anywhere on the page, while the SANDBOX failure bar has "Share this run": the game's own trailer remains the only run in the game that cannot leave the laptop. |
| 8 | Free play is judged kindly | **CLOSED** | Manufactured the failure live: "fell off — the line let go before the cup; add a straight, a drop, a lip or a landing · place at: end of ramp" — named cause, named verbs, ☆☆☆, no scold, and the rung-era tell is DEAD: no "Next level" on a failure (the star gate hides it, `offsetParent` null). Then the kind half: fix one piece, ★★★ under par, name the line ("loop-four express"), re-run → "on 'loop-four express' — personal best 0.39 s", share → the friend page re-simulates it "✓ verified", plays the film, names the lineage, and wears the ⌂ crumb. One NEW small seam: REMOVE the starter cup and place your own and the minting chip vanishes — the fixture quota counts OCCURRENCES, not provenance (`playerCupAnchorFor`), so your cup silently "is" the level's. Pre-h4, stated here for the record. |

**6 of 8 CLOSED, 1 partial, 2 open.** The three the 8→9 program FUNDED (1–3) are closed in play,
pixel-verified, sound-verified, walk-verified. What's open was not funded — and it is all at the
door, not in the rooms.

## Fresh-stranger score (cold, furnished build)

| Axis | Question | Score |
|---|---|---|
| Arrival | Does the door explain itself in 60 s? | 8/10 — boots in ~44 ms/80 ms FCP, the cross-section now READS as a furnished dollhouse (six decks, doorframes, shelves, key light), nameplate legible at every probe size; at the WIDE home eye the props are small by the section's own grammar — the crane must park for them to speak |
| The pitch | Is one press worth it? | 8/10 — the downhill is now four physics-approved rooms WITH roll voice, room beds, ring and whoosh, and the `6caea49b` receipt — still one deterministic tape, now at least a loud one |
| The commons | A life beyond the tape? | 8/10 — named line minted, beaten by name, shared, verified across a re-simulation; the chain law held end to end |
| Free play | Kind? | 9/10 — the failure sentence is still the warmest text in the game, the Next-level scold is gone, one piece fixed everything |
| The return | Does the door know you — and can you GET BACK? | 7/10 — the crumb is everywhere and Escape is a door from the rungs; at the door itself Escape closes nothing and the Tab order starts in the middle of the sky |

**VERDICT 8/10** — the ≥ 8 bar for the 8→9 program is MET. The bar this clears is real, not
inflation: the referee suite now has a spec that stands in the front door (`home-chrome.spec`), and
this lane re-proved every pixel claim at `elementFromPoint` rather than in the DOM.

### What keeps it below 9 (priced, three lines)

1. The door's status line still contradicts its own result line — "3.7 s" above "6.7 s" on the same
   screen, unfinalized while the sim stops — the cheapest wrong number in the game (`finalize()`).
2. The trailer cannot leave the laptop and "free" is two hops away — no share verb on the downhill
   receipt, zero sandbox links on the home page, both since the freeform era and both unfunded twice.
3. The door's keyboard/Escape seams: `CAMPAIGN`-order window walk (garage fifth), Escape closing no
   panel at the door, and the 390 px hit-target edge bleed.

## Regression sweep (done by hand, not by the suite's say-so)

- `npm run replay:all` — **30 rungs, all verified**, hashes byte-identical across the double replay,
  every time inside par (`kitchen05 2.633/2.65 … porch05 1.192/1.20`).
- `src/boot.ts` **1595 lines < 1800** — the N3 budget claim holds as a fact, if not yet as a gate.
- a11y Tab on the furnished home: full clean walk (every control named, no traps, no tax while
  panels are closed) — the ORDER finding is truth 5, not a new one.
- Downhill receipt `6caea49b` **still exact** — node replay of `HOUSE.parBuild()` = `6caea49b`
  (807 steps, `fell`, 6.725 s) and the page's `#gw-hash-value` = `6caea49b` on two consecutive
  releases of a fresh profile. The one-tape law stands.

## The honest other column

The boot is a warm start (44 ms); the LINES fresh-save state still says "1 link walked … your own
links on this device only" and never fakes a feed; the farewell's three doors now NAME the six
sandboxes; the share page refuses a corrupted link honestly ("this link is not a run — nothing to
replay" — earned by a truncated probe URL, verified by the intact one); the sound chip, the volume
slider, and the receipt disclosure all sit at the door where the freeform verdict said nothing was.

### See also

`Sessions/eval-k4-door/` (15 verified artifacts: the three window sizes, the mid-run bed walk, the
fail face, the three parked room frames, the share round trip), [[Reference/Evaluation 2026-10-13
player house era]] (the 7/10 this closes against), [[Sessions/2026-10-13 Wire the door]],
[[Sessions/2026-10-13 Furnish the door]] (the two lanes under test).
