---
livedocs: snapshot
---

# 2026-10-12 Final sheet probe (Play Prober — the last sheet test before the greenlight)

Snapshot session note (never checked). Branch `probe-final`, worktree `gw-f7` (outside the repo root), base main
`40c3db4` (THE CHAIN = `80353d9`), `npm run build` + `vite preview` on **port 4980**, fresh browser session, clean
device (badges null, chain 0 — verified before the first launch); main untouched; evidence checkpointed by
commit+push on `probe-final` (raw journal + 10 screenshots in `Sessions/probe-final/`). Wall-clock CDT anchors:
05:17:15 worktree → 05:19:36 first freeplay click → 05:41 chain hand-off → 05:53 last launch, **≈34 real minutes,
39 launches**. Baselines: `Sessions/2026-10-12 Freeplay probe.md` (suffocation log #1–#9) and
`2026-10-12 Sheet re-probe.md`. The re-swept thresholds, payload-v2 shares and Retry law were all tested in play,
not in CI.

## Q1 — the cup-less freeplay session (sheet + named lines + lines tab as the only goals)

**39 launches, 11 finishes** — kitchen 8L/5F, bedroom 7L/2F, porch 6L/4F (incl. the chain legs), garage 4L/0F,
bathroom 5L/0F, garden 7L/0F. **Three of six rooms never closed** — garage/bathroom/garden share one shape of
failure: my line overshoots the default cup, the advice says `the straight sits past the cup — pull it back ·
press ] to walk the open ends`, but Remove only takes the LAST piece and the `]` walk never resolved an alternate
seat in my hands — a soft-lock with a correct sentence (the re-probe's "sink hop" and kitchen-loop finishes did
NOT reproduce; my method — Place button, no canvas-hover aim — is stated, not hidden).

**Badges minted (per type):** air **7**, catch **6**, spend **5**, crossing **0**, chainFall **0**. The re-sweep
claim is CONFIRMED at sandbox scale: `earned — air · clean catch` fires mid-failure on a 4-piece bedroom loft
(baseline: zero sandbox badges in ~35 launches), and `booster spend` finally mints in play (baseline: never).
`first … — earned` one-shots fired and were consumed correctly. crossing/chainFall remain campaign-only for a
free player — loops mint nothing in any sandbox (kitchen loop stalled silent, bathroom loop stalled silent).

**Named lines minted: five** — `counter cruise` 2.52 s (kitchen), `lamp loft` 2.47 s (bedroom), `storm front`
0.67 s (porch), `dry dash` 2.26 s (kitchen), `rail shortcut` 0.57 s (porch, the friend replay). The mint chip
behaves: appears exactly on player-cup finishes, the named tail prints on every replay, the LINES tab is honest
(`2 links walked on this device … your own links on this device only` + thirty house rows). One friction: a
finish on the DEFAULT cup prints no mint row — my first kitchen win was un-nameable, so the best run mints
nothing until you re-run it with your own cup.

**Did I optimize anything unprompted? YES — that is the sentence: within ten minutes of minting a named line
that already beat par, I removed two pieces from it, twice, purely to make the verdict row read
`beat par ✓ · same pieces as par`, and the resulting ★★★ 2.26 s was the fastest, most-prized run of my session —
and the sheet granted it ZERO badges.** The trim chain 7 pc/2.52 s ★★☆ → 6 pc/2.38 s ★★☆ → 5 pc/2.26 s ★★★
printed an empty tally bar on the best run: physics-gating means the sheet can celebrate landings but cannot
see efficiency, so the ONLY visible reward for optimizing is the `you vs par` sentence itself — which, this
probe says, is now genuinely enough to pull a free session. The sheet informs the optimization; the par row
directs it.

**Farm temptation: tried, and it half-works.** Identical-build replays RE-MINT physics badges: three no-edit
Launch presses on the bedroom loft took air 2→5 and catch 1→4; a booster pad parked on a garden line took
spend 2→5 across three replays of a run that FALLS OFF every time (even failure prints). The farm channel is
general — replay any badge-producing build and the counters climb. BUT: **there is no sheet UI anywhere** — no
screen shows the totals; the visible reward is the per-run `earned —` row and the `first … — earned` one-shot,
both of which stop telling me anything new after the first sighting. I spam-launched twice out of curiosity,
learned the counter was invisible, and stopped. A farm with no visible barn: mechanically open, motivationally
dead — this probe did not feel the pull, but a telemetry-only counter is one settings-tab away from feeling it.

## Q2 — the chain in play (one honest round trip)

`storm front` (0.67 s, par 0.70 in the payload) → `Share this run` → chain row 1 (`b1e67381`) → save stashed,
device wiped → **friend** opens the link: the viewer page is a beautiful film with hashes and **no name, no
GOAL, no PAR text anywhere on it** (the payload carries all three — presentation gap) → `Build your own` →
paste → `their car is on the grid — launch to race it` → friend builds straight + own cup at the rail →
**0.57 s ★★★ and the row is REAL: `you vs “storm front”’s par — time −0.13 s vs their par`** — the game named
ME beating a person by name. Friend names it `rail shortcut`, shares.

**The LINEAGE link never minted.** Across two share presses and every ghost-toggle state, the friend's chain
row (`bbc4df19`) carried no `lineage` field, so no beat-a-beat link exists — the chain's middle link cannot
fire in play. Code read explains the empirical: `beatLineage` requires the run to end with ghost mode
`friend`, and the accept-the-link path never leaves the run ending in that mode (the verdict row reads
`racedLink` directly, which is why the NAME row is right while lineage stays null). Return trip did work: the
friend's build rebuilt byte-exact on my device (share hash identical), pasted and raced →
`you vs “rail shortcut”’s par — time −0.03 s` + the personal-best tail; a strict beat would then be my lineage
chance — and under determinism the only un-beaten ghost is a tie, so the CHAIN needs SKILL to grow, exactly as
designed, and one broken link is stopping it.

**Would I send it to an actual person?** `storm front` — yes, honestly: one sentence, a name, a par, a thing
they can beat, and the LINES tab would remember we raced. The beat-back did not make me reach for a second
person, because it came back anonymous (no lineage, viewer page without the name) — a chain row I cannot point
at is a receipt, not a story. The round trip earns ONE send per link today; fix the lineage and it earns the
second.

## Suffocation-log comparison vs baseline (#1–#9)

1. Invented goals over par by construction — **N, dead**: named lines carry their own par, own verdict, own tail; the LINES tab prints them.
2. Cup-stop law — **Y, softened + spoken**: `the straight sits past the cup — pull it back`; porch re-anchor reproduced (0.67 s).
3. Single-line law / `fits here` flattery — **Y, verbatim**: one free end; canvas hover-click placed nothing I could verify.
4. Scoreboard colonizes the sandbox — **Y, softened**: par ghost toggleable, your-best mirror shipped; stars/par still print on every sandbox run.
5. Friend variants unscorable — **N, dead** — the beat-a-name row exists and reads exactly right. The NEW suffocation moved next door: the beat leaves no lineage (new #10).
6. No skill channel — **Y, widened**: the only skill channel remains piece-count; and ghost MOUNTING shifts the run — the identical 4-piece build ran 0.57 s (par ghost on) vs 0.67 s (off): determinism's own footnote is not yet true (the re-probe's 2.80/2.83 split, confirmed and reproducible — Eng).
7. Advice authors the play — **Y, verbatim**: every closing line I built was the advice's own sentence executed by my hands.
8. The dump law — **urge Y / mechanics N**: garden noise pile (5 pieces) = 2.38 s of tumble, ZERO badges — dumping still buys nothing, and now the sheet says nothing about it either.
9. Chrome traps — **Y, one named**: the name-`save` button collides with the Save-dropdown `Save` (settings panel opened mid-result once); no launch-swallow sightings this round.

New #10 — **the invisible sheet**: badge counts accumulate in the save with no surface; a free player cannot
read their sheet, so the sheet cannot be shown off, farmed, or finished. It is currently a ledger nobody audits.

## Verdict — is free-form the FRONT DOOR?

**A ROOM. Hold it.** The named-line machinery + beat-a-name row turned MY OWN free session into content worth
sending (first time across three probes a probe wanted to text the link to a real person), and the sheet is now
alive at sandbox scale without becoming a farm. But it is not the front door: three of six rooms cannot close
at all, the CHAIN's lineage link cannot mint, the friend's door (viewer page) doesn't show the name, and the
sheet has no face. Greenlight Downhill is therefore NOT this door — the fixes below are small, all presentational
or one-flag deep, and I'd re-probe the door after them:

(a) **Eng, one flag**: end the run in `friend` ghost mode when a hashed link was accepted (lineage cannot mint
today; verdict row proves the beat happened — the receipt is thrown away).
(b) **Presentational**: print NAME · GOAL · PAR on the friend's viewer page (payload v2 already carries all three).
(c) **The overshoot soft-lock**: give the `]`-hinted pull-back an executable verb (Remove-any-named-piece, or
`Replace` on the sitting piece) — a correct advice sentence with no reachable verb made 3/6 rooms unclosable.
(d) **Eng**: ghost-body seating — identical build ran 0.10 s apart by ghost mount; the determinism disclosure
promises otherwise.
(e) **Give the sheet a face or stop counting**: one LINES-tab footline (`air 7 · catch 6 · spend 5 · crossed 0 ·
fallen 0 — earned on this device`) converts the invisible ledger into either a trophy or a visible farm problem.
(f) **Mint on default-cup finishes too** (or say so in the bar): a win you cannot name is a lost line.

Evidence: `Sessions/probe-final/journal.md` (raw, anchors + method) + 10 screenshots on branch `probe-final`
(kn-03/05/07/32, bd-10-run, po-20-named, ch-00-beatbyname, lt-00/02/03).
