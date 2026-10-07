---
livedocs: snapshot
tags: [session, stage-4, close]
---
# 2026-10-09 — Stage 4 close (Documentarian)

Stage 4 is COMPLETE on `main` pending the `stage-4` tag (Director owes it; `stage-3` is cut).
91 commits since `stage-3`. This note is the resume point: what shipped, what the seven-plus
stranger rounds of playtests taught, what Stage 5 inherits.

## What shipped

- **The campaign: 21 levels, five rooms, ONE flat ladder.** Kitchen (5, from stage 3) then
  `bedroom01..04`, `bathroom01..04`, `garden01..04`, `garage01..04` — rooms as grouping metadata
  over the sequence `nextInCampaign` walks; every room handoff one ordinary step, the unlock rule
  stated once in `levelUnlock` (`src/world/campaign.ts`, Decision Log 2026-10-09 — cross-ref the
  2026-10-07 star/reached entry: the v1→v2 migrade carries STANDING, only a finished run MINTS).
  Ladder logs: `Sessions/2026-10-07 Stage 4 - bedroom ladder.md`,
  `Sessions/2026-10-08 Stage 4 - bathroom ladder.md`,
  `Sessions/2026-10-08 Stage 4 - garden ladder.md`,
  `Sessions/2026-10-09 Stage 4 - garage ladder.md` (campaign close-out, salvaged by the Director).
- **Four new production sets** (`src/sets`) — bedroom dusk lamp, bathroom variant A, garden
  golden hour with the sun-shadow reading, garage variant C epoxy — each registry-row-wired,
  lazily imported (Decision Log 2026-10-06: the page pays only for the set it mounts), mounted
  by the same under-the-run placement family (`Modules/world`).
- **The build view**: restricted yaw orbit + pan, explicit click-vs-drag, five state-robustness
  defences, Esc-Esc home (§9.3 AMENDED — Decision Log 2026-10-09, `Modules/camera`).
- **Watchability**: cup-witnessed finish clip, death-site end-hold (`frameDeathHold`), goal-biased
  table framing swept on all 21 rungs, the dense filmstrip sampler's bucket-key bug fixed
  (`Sessions/2026-10-09 Stage 4 - watchability resumed`).
- **Honest speech**: fail notes with build-aware tails wearing the three-way truth (Decision Log
  2026-10-09), spoken Remove, three-way tray legend, aim-vs-goal target line, `propWord` Help
  titles, one-time `REVERSING_WHY`.
- **Fail-timing as a design law**: L02 (three visible death families via the −29° chute sweep)
  and bedroom02 (pillow sink vs plateau step on one deck plane) re-authored so wrong builds say
  WHAT/WHEN/WHERE (Decision Log 2026-10-09; the B2 log
  `Sessions/2026-01-18 Stage 4 - B2 learnability.md` carries an agent clock-fault date — the pass
  is stage-4, commit `9ca66c9`).
- **The short-window layout**: ≤700 px whole-page compact variant, width-capped aspect-true
  canvas, panel above the sticky toolbar, measured docHeight == viewport at 1280x633
  (`Sessions/2026-10-09 Stage 4 - short-window polish`).
- **Determinism held all stage**: node↔browser hard-match at `099403c7` (`verified`), feel-table
  variants `cee96961`/`90d4cd69`; the only campaign par hash re-derived was kitchen02's
  `0b4dbab2` (L02 fail-timing).

## The playtest arc (J → Z, eight fresh-eyes rounds)

- **J+K (new rooms)** → kitchen 5/5 + bedroom capstone clean; the L02 wall, camera bury-at-end,
  note ledger → end-bury `FINISH_LIFT`, slow-air stall window, rise-witness notes.
- **M+N (campaign)** → L01 eight-try and L02 nine-try walls, "the cup and death spot were NEVER
  visible" → watchability resumed + L02 fail-timing redesign + L01 verdict (FIRST-PLACEMENT
  TARGET, not chain order → `chainHeadIndex`), N-wave shell wiring (as-built Retry, star rules
  before first failure).
- **P+Q (round 2)** → focus traps, split counters, the L01 boot rail; Q's "one FIXED angle,
  left-drag places" → the RESTRICTED orbit (§9.3 amendment) + actionability-gated advice tails.
- **R+S (round 3)** → orbit latch, K4/K5 walls, panel-swallowed toolbar → state-robust gestures,
  depth-aware aim (`worldToClientPx` kin), death-site holds, sticky toolbar behind the card,
  K4 tap-wall and K5 booster fixes.
- **T+U (round 4)** → silent clicks, partial reload restore, Esc-Esc inert → click binds to the
  SHOWN ghost, edit-side debounced autosave with `pagehide` flush, `RECENTER_MS` 1500, the
  cup-framing sweep wired as a gate on 21 rungs.
- **V+W (round 5)** → ghost-offset 2/2 and a context-loss black tab → the VIEWPORT TRUTH (single
  source aim transform, reserved toolbar rows, hostile-viewport e2e, context-loss recovery) and
  the three-way phrasing truth for note tails.
- **X+Y (round 6)** → inert clicks + a dead-click below the fold → the RECORDING-PROXY DOCTRINE
  (Decision Log 2026-10-09): 14-cell repro matrix, page innocent; the two laws pinned as
  assertions; gesture owner attaches at canvas mount; coordinate-based release.
- **Z (round 7)** → short-window panel fold + copy ledger → the ≤700 px layout, spoken Remove,
  copy pass; the about:blank/black-tab deaths CLOSED tooling-side (zero crashes across the
  matrix; standing bar: host-side `page.on('crash')` logs before any reopen); the K3 death-family
  re-sweep left OWED now the layout unblocks it.

## Numbers (at close)

- Unit **584/584**; e2e **125 passed / 2 designed skips** (plus the filmstrip gate on its own
  config); typecheck clean; `npm run pars -- --check` green over the 21 campaign rungs.
- 21 campaign levels + feel track; five sets; 22 pars rows.
- Merge discipline (Decision Log 2026-10-07) paid for itself twice: five stage-4 branches merged
  clean once the `checkout --ours` lesson became a rule; every merge commit needs
  `livedocs affected` + a batch stamp before push because `git merge` skips the gate.

## The close review (`Reference/Review 2026-10-09 stage 4 close.md`)

Ship-with-follow-ups. F1 (vacuous `.catch` cells), F2 (T11 dead by construction), F3 (off-canvas
press place), F4 (panel z-index vs wrapped toolbar), F5 (Next vs level-select unlock disagree) —
fixed by the follow-up crew on main as that review directs. **F6 deferred to stage 5** (Home
Deferred): autosaved builds restore onto level geometry that has since moved; fix direction is
stamping `builds[id]` with a level-geometry revision (or the par hash) and refusing a mismatch —
a save-schema change that wants its own versioned migration (`Modules/save`).

## Stage 5 inherits

1. **Porch** — sixth room, one more campaign row; apply the fail-family sweep at AUTHORING time
   (the L02/B2 law), not as a rescue.
2. **Cinematic replay + synthesised sound** (sound is stage 5 by design).
3. **F6 save migration** (geometry-revision stamp on `builds[id]`).
4. **K3 bowl death-family re-sweep** in a real short window — owed before any bowl geometry edit.
5. **Hardware-GPU 60 fps with post ON** — still the standing open measurement (Home Deferred).
6. **Ask backlog** in [[Concepts/Levels]]: birdbath sockets (#7a), timed sprinkler kind (#7b),
   tunnel anchor (#8b), drivable yaw (#1) and the film↔zone alignment (#6) family; prop-callout
   registration for kitchen/bedroom props (`PROP_CALLOUTS` rows land per set module).
7. **Stage-6 polish carry-ins**: the three unclosed H+I tickets (Retry dead time, zoom-tight
   chase, ✗-mark legibility), a11y/responsive pass, liquid specular ceiling, filmstrip frame-3
   wide-hold nuance, player-built hash canonicalisation before any cross-build equality claim.
