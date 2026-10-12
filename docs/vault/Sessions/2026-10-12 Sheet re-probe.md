---
livedocs: snapshot
---

# 2026-10-12 Sheet re-probe (Play Prober — does the sheet hold a session without a cup?)

Snapshot session note (never checked). Branch `probe-sheet`, worktree `gw-f3` (outside the repo root), base main
`31034b2` (THE TALLY = `de01abe`), `npm run build` + `vite preview` on **port 4940**, fresh browser session, clean
saves; main untouched; evidence checkpointed by commit+push on `probe-sheet` (raw journal + 8 screenshots in
`Sessions/probe-sheet/`). Real wall-clock anchors (CDT, `date`-checked): 00:19:11 start → 00:48:57 last shot,
**≈31 real minutes, ~35 launches**; the VM clock drifted (showed 01:0x–02:1x) and is not trusted — every timestamp
claim below is an anchor or a phase. Baseline: `Sessions/2026-10-12 Freeplay probe.md`.

**Method honesty:** all six sandboxes with real stakes (place a cup, name the line, race your-best), three campaign
rungs, the named-line share flow. One deviation from baseline: placements ran through the **Place button** (which
names its seat) plus one real canvas mouse-click probe — the baseline hovered/clicked. Where a baseline moment did
not reproduce, that method difference is stated, never hidden.

## Stakes log (per sandbox: cup placed? line named? ghost raced? dump?)

| room | launches | finishes | cup placed → named | your-best ghost | dump sighting |
|---|---|---|---|---|---|
| Kitchen | 11 | **0** | — | — | folded into failed lines |
| Bedroom | 6 | 4 | **"the lamp run" 2.80 s** | ✔ (`ghost: your line`) | none |
| Bathroom | 3 | 2 | **"sink hop" 2.58 s** | ✔-by-code | none |
| Garden | 5 | 0 (cup-seat key minted, no finish) | — | — | **YES — the dump of the session** |
| Garage | 4 | 2 (★★★ fixture-cup trick + my-cup 3.13 s) | **"slick skip" 3.13 s** | chip `line "slick skip"` | none |
| Porch | 2 | 2 | **"to the door" 0.67 s — beat par −0.53** | ✔ | none |

The **placed cup re-anchors the verdict** (last `finishCup` wins, per `Modules/tally` — confirmed live): porch
baseline exhibit #2 (`nothing past it is ever travelled` voiding seven straights, identical 0.89 s death) is now a
solved puzzle — straight×2 + my cup nearer the rail finished 0.67 s and the game called it `beat par ✓`. That is
the first authored goal either probe ever saw the toy call a WIN. Kitchen is the counter-case: cup at x=2.55 sits
between piece grid and ramp socket — every legal straight overshoots (`the straight sits past the cup — pull it
back`), 11 launches, zero finishes, and the baseline's 2.84 s kitchen finish did NOT reproduce (flag for Eng:
regression or a placement nuance a probe can't see).

## Freeplay-with-no-rung findings (the sheet as the only goal)

- **Did I optimize anything?** Only *reachability*: which lines the death point permits, which cup seats mint a
  record. Never *badges* — see next point.
- **What did I farm? NOTHING.** Across ~35 launches the sheet granted exactly ONE badge: `chainFall` at
  t=2.0917 on campaign kitchen01/garden01 (the same geometry reskin — same t, two rungs). Zero events in every
  sandbox run, including the garage run that JUMPS the slick, FLIES, LANDS and rolls into my cup (3.13 s, film
  mounted, `events: []`). `AIR_MIN_S 0.25 / CATCH 0.15` are swept on campaign-scale builds
  (`tools/tally-sweep.mjs`, max 4 badges, booster-farm 3) — sandbox-scale air is invisible to the sheet.
  **Booster spend never fired on real booster use anywhere** — the farm rig exists in CI and cannot exist in play.
  **Sweep-farm temptation: absent. A 1-badge economy is not a farm; it is a rumour.**
- **The dump** (garden, ~4 min after the reachable goal died): 4 noise kinds onto the dead line → 12 pieces →
  **byte-identical 2.55 s death**. Urge reproduced, mechanics inverted vs baseline: noise now lands *past the
  fixed death point* and is void — dumping feels less rewarded than before, and equally pointless (baseline #8
  nuance).
- **Determinism anomaly (new):** my named bedroom line times **2.80 / 2.83 / 2.83 / 2.80** across four launches of
  ONE saved build, while the page prints `your own runs always run the same way`. Correlated with record/par ghost
  mounts (`__gwGhostState`), no ghost body found by grep; unresolved — Eng flag.

## Campaign — three rungs, did the tally change the NEXT rung?

kitchen01 (★★★ 2.16 s) printed `earned — chain fall · first chain fall — earned` — **the `first … — earned` line is
the only cross-run behaviour modifier of the session**: it made me re-run the rung to watch the goal-beat again.
bedroom01 (★★☆ 2.38 s) printed nothing and I played it as pure advice-channel puzzle, zero badge-chasing;
garden01 (reskin) printed `earned — chain fall` with the first-line correctly consumed. Answer: **the tail informs,
it never directs** — badges name what the par line already did; they cannot be built toward, and the advice line
still authors the play (baseline #7 survives the sheet untouched).

## Named-line share flow

`Share this run` on a named run mints the usual `#s=` payload; the page opens **WATCH THIS RUN** (3.7 s run-cam
film), `verified · matches the link` (hash `e483eac2` = link = replay), `Build your own`. **The line's NAME, its
cup-goal and its PB appear nowhere** — and pasting the link as a friend ghost races their car with the verdict
still `you vs par` (exact 2.80-vs-2.80 tie, no Δ row). Does it feel like content? The film does; the CHALLENGE
does not exist yet. A named line publishes as a video of a goal, not as a goal.

## Baseline suffocation comparison (per entry)

1. Invented goals over par by construction — **Y (softened)**: my-cup runs still score against DEFAULT par
   (`slick skip` ★☆☆ over par), but the record tail gives the authored goal its own verdict row. Partial fix.
2. Cup-stop law voids play beyond the cup — **Y but BREAKABLE**: placed cup re-anchors (porch/bedroom/garage).
3. Single-line law / `fits here` flattery — **Y**: canvas click at the ring pixel and the Place button resolve to
   the identical socket; nothing else accepts placement.
4. Scoreboard colonizes the sandbox — **Y, softened at the named seat** (par ghost is replaced by `ghost: your
   line` — colonization with a friendly face; stars/par never leave).
5. Friend variants unscorable — **Y, verbatim** (friend race, `you vs par`, no Δ even on a tie).
6. No skill channel — **Y**, now with a crack: same-build times split 2.80/2.83.
7. Advice authors the play — **Y, verbatim** (garage ★★★ is again the advice sentence executed by my hands).
8. The dump law — **urge Y / mechanics N** (dump bought zero; noise sits past the death point).
9. Chrome traps — **Y**: launch-swallow behind the result band ≥4× (double-applied placements once); stale advice
   (`place at: end of ramp` with 5 pieces placed).

## Spark comparison (the 3 mine-moments)

1. Kitchen loop finish — **not reproduced** (0/11; see flag).
2. Bedroom own-cup authored goal — **reproduced and UPGRADED**: it now comes with a name, a personal best, a
   your-best ghost and a run-cam — the session's best new feeling.
3. Garage lip-trick — **reproduced byte-for-byte** (★★★ 2.56 s), and the sheet had literally nothing to say about
   it: my most cinematic run in either probe prints the emptiest bar.
New sparks: **porch cup-re-anchor** (the game honouring a goal it once refused in one sentence) and the
**`first chain fall — earned`** one-shot. New anti-spark: the badgeless slick-skip.

## Verdict — front door, room, or paint job?

The **named-line machinery is a real ROOM**: placing a cup turns four of six sandboxes from toys into puzzles with
my name on the verdict, and it retired the probe's saddest exhibit (the porch door). The **TALLY inside that room
is still PAINT**: one badge per ~35 launches, zero in free play, none where the air actually is, and the sweep
gate protects a farm nobody can build. And **free-form is not yet the front door** — the free session still
converges onto the advice channel, still never farms, still dumps when the named goal dies, and now has one room
(kitchen) where the new grammar cannot even reach a finish. Suggested sharp edges for the director, evidence-shaped:
(a) re-sweep detector thresholds against the SIX sandbox reference builds, not only campaign pars — the sheet is
invisible at exactly the scale where free play lives; (b) carry the NAME + cup-goal + PB through the share payload
and put a `you vs their line` verdict row on friend-ghosts (the payloads are already complete — this is pure
presentation); (c) the 2.80/2.83 split and the unreproducible kitchen finish need Eng eyes before anyone calls
free-form shipped.

Evidence: `Sessions/probe-sheet/journal.md` (raw, method + anchors) + 8 screenshots (kn-00/01, bd-01/02/03, cp-01,
po-01, gr-01) on branch `probe-sheet`.
