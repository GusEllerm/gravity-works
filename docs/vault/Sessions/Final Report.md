---
livedocs: snapshot
tags: [session, final, stage-6]
---
# Final Report — Gravity Works, shipped

> [!abstract] Role
> The Documentarian's final sweep: what was built, where it lives, the evidence per stage, the
> numbers, the determinism ledger, the decision classes made on the human's behalf, and what to
> build next. State and open items: [[Home]]; every choice below points at its `Decision Log`
> entry rather than restating it.

## What was built (one page)

**Gravity Works** is a browser game about building toy-car tracks that physics has to approve of.
Cars have no engines; the only energy is the height and the boosters you spend. You snap spline
track pieces into sockets across six 1:64-scale toy sets inside a real house — kitchen counter,
bedroom, bathroom, garden, garage, and the porch in the rain — then let go. Physics decides, at a
fixed 120 Hz step, on every machine the same way.

- **The campaign: six rooms, THIRTY rungs, one flat ladder** (`src/world/campaign.ts`,
  `Reference/Level Ladder`). Kitchen `kitchen01..05` is the wordless tutorial arc; each of the
  five other rooms ships five rungs in play order `01, 02, 03, 05, 04` — a lesson ladder, a stage-6 **encore** rung slotted
  before the finale (the "double crossing": two gaps on one line), and the room's capstone. Stars
  are §9.2's three lines (finish / under par pieces / under par time); unlocks are the previous
  rung's star, stated once in `levelUnlock`. `garage04 → porch01` hands off to the porch finale;
  `porch05.next === null` ends the campaign. Kitchen also ships a no-budget sandbox.
- **The spine** (`Modules/track`, `Modules/world`, `Modules/physics`): 13 kit pieces defined by
  one spline each — mesh, collider, camera rail and sockets all generated from it, so nothing on
  screen ever disagrees with what you hit; a raycast-wheel car on the ratified SIM_SCALE-10 solve;
  the loop threshold measured at 2.30 R and band-asserted; hazards as grip FILMS (wet patch, oil,
  magnet, whirlpool, gust reads), never painted lies.
- **The build view** (`Modules/ui`, `Modules/camera`): hover-aim with a visible ring and ghost,
  socket naming on every line and on the Place button itself, a RESTRICTED right-drag orbit,
  aim-or-speak refusals, and a failure note that says WHAT went wrong by WHEN and WHERE it dies —
  the fail-timing law every rung is authored against.
- **Determinism and the film** (`Modules/replay`, `Modules/share`): a run is (level, build, seed);
  the share link carries the state hash; the share page opens a CINEMATIC REPLAY — composed shots,
  scrubber, deterministic seek — with a `verified` badge, and the whole wind is one deterministic
  sim under the chunking law. `npm run replay:all` replays every rung's par build twice IN ORDER
  in CI.
- **The look** (`Modules/render`, `Modules/sets`): one toon-ramp material system from a tokens
  file, one key light per set, tinted shadows, tilt-shift/bloom/grade post with a quality ladder
  that drops stages not resolution, and six ratified sets each judged to the 16-line rubric
  (kitchen 16/15/15 round 2; porch 15/16; the others via their stage-4/5 reviews).
- **Sound** (`Modules/sound`): 15 synthesised voices, zero assets, a −12 dBFS measured ceiling, a
  repetition guard, mute + volume in the save, and an import-graph firewall that keeps audio off
  every physics path.
- **Ship shape**: keyboard end-to-end (Tab is the browser's, `L` launches, `]` walks ties), touch
  verbs at 390/820, contrast computed in CI, reduced motion honored everywhere it has a still,
  every set at 60 fps with post ON on the reference machine, README with renders and a clip.

**Live: <https://gusellerm.github.io/gravity-works/>** (GitHub Pages, static, no backend;
`Vite` base `./`).

## Live numbers (re-measured on this sweep, commit `86240ae`)

- Unit: **761/761 green** (36 vitest files, live `npm test`).
- E2E: **189 passed / 1 designed skip** across 42 spec files on the main lane (the skip is the
  documented below-the-fold browser law), **plus the filmstrip lane 3/3** on its own config —
  43 spec files under `tests/e2e/` in total.
- `npm run replay:all`: **30 rungs, all verified** (every par build twice in order, pair-hashes
  equal, par times respected).
- CI: green on the shipped HEAD (vitest + typecheck + e2e + determinism + visual + perf gates +
  `livedocs verify` + Pages deploy). `livedocs verify`: 113 stamped notes, clean.
- One dead file went in this sweep: `src/world/levels/koz0old.level.ts`, a stage-4 stale snapshot
  of kitchen02 that nothing imported (quality bar: no dead code).

## Hero renders (per set) + clip

`docs/renders/kitchen-hero.png` · `docs/renders/bathroom-hero.png` · `docs/renders/bedroom-hero.png`
· `docs/renders/garden-hero.png` · `docs/renders/garage-hero.png` · `docs/renders/porch-hero.png` —
all from the ratified hero cameras via `tools/render.mjs` — plus `docs/renders/run-clip.gif`, the
verified kitchen02 par-run gif (first-vs-last pixel diff proves animation).

## Playtest evidence (28 fresh-eyes reports, A..DD, L/O never issued)

**Stage 2→3, first playable:** A/B/C — three strangers on the deployed build: invisible result
panel, no run-camera follow, L01 gap wall, unexplained greyed tray; the whole stage-3 fix wave.
D (confirmation) — L01 finished unaided, loop closes: 8/10.
**Stage 3:** E+G — acceptance reports with screenshot evidence (black first paint, hash
legibility). F — 12-try L1 win, the hidden-arrow/Enter model named. H (confirmation) — L01
BEATEN under par (2.16 s vs 2.25, ★★★). I (confirmation) — all five kitchen levels cleared
UNAIDED — the §10 line.
**Stage 4 (fifteen rounds, J..Z):** J — kitchen 5/5 + bedroom capstone clean. K / M — the L02
nine-try wall (camera/latency/note ledgers) → the fail-timing law. N — L01 eight-try chain-order
wall; the cup was never framed. P — L01 ten-try wall + focus regressions. Q — K1–K4 cleared, K5
booster wall; fixed view hides goals → the restricted orbit. R / S — K4 wall, orbit-death +
aim-disambiguation ledgers. T / U — full kitchen + bedroom cleared; silent-click + dead-click
ledgers. V / W — K1 wall both (held-click no-place, ghost offset 2/2 confirmed); the note-tail
lie → the three-way truth. X / Y / Z — the tab-death/clicks-inert round: the crash matrix cleared
the PAGE (14 cells, zero crashes) and indicted the tooling; camera latch disproved 4/5.
**Stage 5:** AA — walled at bedroom02 (fixed: B2 pass 2), and "I'd send replays to a friend if the
game handed me a link" → the share button. BB — replay judged friend-worthy with two named flaws;
K3 wall 2/2 → aim law + K3 re-sweep. CC — aim lies GONE, K3+B2 walkable at 4 tries; the one flaw
left was the share page's 6 s silent pre-sim → the chunked wind.
**Stage 6:** DD — final sweep: the Place button walled kitchen01 (~10 launches) and kitchen03
walled a second stranger; BOTH fixed in the follow-up wave (the button names its socket; the
callout names the refused seat, the past-finish tell, and the END the kind goes on — anchor
unmoved, and a blind five-Place/one-launch clear is now an e2e). DD's other verdicts stand as
polish items: the encores read as remixes (brevity note, Home Deferred), and the share-film is
"already the best second".

## Frame numbers per set (the stage-6 verdict table)

Hardware GL on the reference machine (Apple M5 Pro, ANGLE Metal), post stack ON, each set at its
measured busiest rung — the full table with method and CI-truth context is
`Reference/Performance 2026-10-08`; gate history in `Performance/stage-2`/`stage-3`:

| set | rung | median | p95 | unpaced cost |
|---|---|---:|---:|---:|
| kitchen | kitchen03 | 16.70 ms | 16.70 ms | 3.5 ms |
| bedroom | bedroom02 | 16.70 ms | 16.70 ms | 3.5 ms |
| bathroom | bathroom04 | 16.70 ms | 16.80 ms | 2.6 ms |
| garden | garden04 | 16.70 ms | 16.70 ms | 2.6 ms |
| garage | garage04 | 16.70 ms | 16.80 ms | 3.2 ms |
| porch | porch04 | 16.70 ms | 16.70 ms | 4.5 ms |

0–1 dropped frames across the six, keep-up 1.00, no §12 triage needed. The open end is CI: the
runners are software rasterizers and RECORD-and-DEFER (Decision Log 2026-10-07) — a hardware-GPU
runner still owes the regression gate (Home Deferred).

## Determinism status

- node↔browser equality is HARD-ASSERTED on every run: match at `099403c7`, page verdict
  `verified` (`Modules/replay`, `tests/e2e/determinism.spec.ts`).
- Feel-table variants ride `cee96961` / `90d4cd69`; the only campaign par hashes ever re-derived
  are kitchen02 `0b4dbab2` (stage-4 fail-timing) and kitchen03 `a1a50d05` (the stage-5 K3
  re-sweep) — `a1a50d05` **STOOD through the stage-6 K3 callout fix** (UI-side grammar only).
- `replay:all` **30/30 verified**, re-run on this sweep, every pair-hash equal.
- The caveat stays stated in UI and log: verification is **same-machine** — cross-OS/CPU
  floating-point equivalence is unproven and the assert fails loudly wherever it is false
  (Decision Log 2026-10-07 CI-truth entry; Home Deferred).

## Decisions made on the human's behalf

Do not restate them — `Decision Log.md` is the record, annotated per entry with cross-references.
The classes, so a reviewer can triage: **stack/deps** (npm, three, rapier3d-compat over the 50 kB
gate, relative base, Pages via workflow); **physics** (SIM_SCALE 10, raycast wheels over jointed,
the loop speed-window `[2.30 R, ∞)`, hazard grip as contact query, the chord-slab correction);
**determinism & CI honesty** (hard-asserted node↔browser, platform-suffixed baselines with loud
skips, records-and-defers on software GL, URL affordances recorded not stripped, dev-preview
mints nothing); **interaction law** (restricted orbit + click-vs-drag, aim-or-speak + the
HOVER_PX cone, distinct-outcome ties, Tab-is-the-browser's + the touch/pinch split, the Place
button names its socket); **design law** (campaign as one flat ladder, the fail-timing clock/place
law, advice three-way truth, blocked-rung asks over fake pars, porch ratified with rain deferred
on treatment, the stage-6 encore rungs to reach thirty, K3 fixed in the callout with the anchor
standing); **tooling doctrine** (worktree-HEAD merges, build-before-prove, marker scans, the
recording-proxy doctrine, png tools via pngjs). The six the Documentarian would put in front of a
human first are listed in `Home` → "Decisions a human should review".

## What I would build next (three, honest)

1. **Drivable yaw steering** (ask #1, open since stage 3). Every banked line in the game is
   rail-carried, not steered — the bowl turn teaches the reading, not the cornering, and it is why
   kitchen03's rim seat reads as a wall. Real steering unlocks the brief's banking intuition and
   disolves the K3 discoverability class by construction.
2. **Verified-on-any-machine share links.** A cross-platform determinism matrix (a hash atlas
   re-derived across OS/CPU/GPU, ideally on the hardware-GPU CI runner the perf gate already
   owes) would upgrade today's honest same-machine caveat into the brief's original promise.
3. **The sandbox promise, finished — and the encores, trimmed.** The brief promised a sandbox per
   set; only the kitchen ships one. Pair that with DD's brevity note: cut garden05/garage05 to
   porch-level length and spend the saved minutes where they pay for themselves — the rung that
   walled two fresh-eyes testers in a row.
