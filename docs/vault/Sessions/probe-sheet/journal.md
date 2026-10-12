# Raw journal — sheet re-probe 2026-10-12 (Play Prober, second pass)

Build: worktree `gw-f3` @ branch `probe-sheet`, base main `31034b2` (tally = `de01abe`), `npm run build` + `vite preview` on **port 4940**, fresh browser session, clean save; main untouched. Clock anchors (real CDT, checked with `date`): 00:19:11 start; 00:20:55 first launch; 00:33:49 share-link mint; 00:34:06 friend-ghost test begins; 00:42:52 midway check; 00:48:57 final evidence shot. Total real elapsed ≈ 31 min; the harness/VM clock drifted wildly (showed 01:0x–02:1x) and is NOT used for any claim below. ~35 launches total.

## Method notes (honesty)

- Placement grammar: tray-hold → **Place** button (names its seat), plus one real canvas `mouse move/down/up` probe (kitchen, ring at px≈[880,439] → placed at x=2.67, IDENTICAL socket to the Place button → single-line law confirmed across both input modes).
- Failure lifecycle reproduced ≥4×: Launch/Place behind an open result band no-ops or double-applies (baseline trap 9). After a verdict I always Retry in a SEPARATE step, then verify `ready — N of 999`, then Launch — same-tick Retry+Launch still swallows.
- Debug seams used only as a magnifier: `__gwTally` (events/lineKey/film), `__gwGhostState`, `__gwBuildJson`, `__gwTargetSocketPx`.

## Bedroom sandbox (~00:21–00:34, 6 launches) — richest room

- Default 2-piece: `fell off — 2.23 s` (universal death reproduced). Advice verbatim: `add a straight, a drop, a lip or a landing · place at: end of ramp`.
- straight→drop→landing: `nose-first — flatten the landing by the drop or add a lip · place at: end of landing` — advice mid-failure, reproduced. +1 landing → **finished 2.60 s ★★☆, −0.55 vs par** (baseline's 2.79 run, same grammar).
- My own cup at line end (`cup` tray: hover copy `The run ends at the cup. Nothing past it is ever travelled.`) → **finished 2.80 s, ★★☆, chip `name this line`** (placeholder `the spillway`), lineKey `bedroom-sandbox@2894,-546,0`. Named it **"the lamp run"** → tail row: `named "the lamp run" — personal best 2.80 s · your own runs on this device only` (bd-03).
- Next launches: `__gwGhostState().mode = "record"`, chip `ghost: your line` — **your-best ghost races** (reproduced the e2e promise live).
- DETERMINISM ANOMALY: same build times **2.80, 2.83, 2.83, 2.80** across four launches (`disclosure: "your own runs always run the same way"` on the page). Record ghost time stays 2.80. No ghost source-body found by grep; cause unknown; the disclosure printed a lie on my best line. Flag for Eng.
- Friend-ghost from my own share link: mode `friend`, their 2.80 on the grid, I finish 2.80 — **verdict still `you vs par`**, no you-vs-them row, no Δ on the exact tie (baseline #5 reproduced exactly).
- Share of the named run: `#s=` payload opens **WATCH THIS RUN** (3.7 s film), `verified · matches the link`, hash `e483eac2` both sides, `Build your own`. **The NAME is nowhere on the share page** — the line publishes as a video, not a challenge.

## Kitchen sandbox (~00:19–00:24 and ~00:54–00:58 "real" ≈ 11 launches) — the flop

- Default 2-piece: `fell off — 2.28 s` (advice names seats, reproduced).
- Seven builds (s×2+loop, s+b, rebuilds, loop+straight, lip variants, canvas-click version): deaths `2.28 / 2.30 / 2.76 s stalled` — **zero finishes**. Advice `the booster sits past the cup — pull it back`, `the straight sits past the cup — pull it back`, `place at: end of ramp` — the advice is right and the deck is the trap: cup at x=2.55 sits between the straight's reach (socket end 2.67) — every legal straight overshoots the cup.
- Baseline's 22:08:30 kitchen finish (2.84 s booster→loop→straight) is **NOT reproducible** by Place-button/canvas grammar in 11 launches; possible regression or a placement nuance the probe can't see (their exact ring choices). Flag for Eng/human check.
- The dump here was functional (lip into an ailing line) — real dump-and-pray happened in garden below.

## Garden sandbox (~00:24–00:33, 5 launches) — the dump sighting

- Tour line s→curve→s→booster: `fell off — 2.55 s` — byte-identical to the baseline garden DNF (cross-build determinism noted).
- +landing+my cup: identical `2.55 s` death — the additions sit past the fixed death point, zero delta (the cup-stop law's cousin: the death-point law — nothing past the death is ever travelled either).
- **THE DUMP** (deliberate, honest, ~4 min after the goal died): spring+banked turn+loop+landing at the ring → 12 pieces, **`fell off — 2.55 s` — IDENTICAL**. Baseline #8 REPRODUCED as urge (I reached for noise when the reachable goal vanished) but NOT as mechanics (baseline's pile went farther; mine bought nothing — noise past a death point is void).
- Zero badges the whole room. lineKey minted without a finish (`garden-sandbox@1879,-363,1124`) — records are only written on finish.

## Bathroom sandbox (~00:20 in the harness haze, 3 launches)

- Default `2.65 s fell off` → lip line `fell off` (air into death pays nothing — badge is granted AT the touchdown that never comes).
- +landing+my cup: **finished 2.58 s ★★☆**, chip, named **"sink hop"** (`named "sink hop" — personal best 2.58 s …`). The lip→landing hop earned NO air/catch (flight evidently < CATCH_MIN_AIR_S 0.15 s) — physics said no; detector never contradicted by my eyes but the spectacle/badge gap starts here.

## Garage sandbox (~00:22 and 00:43–00:49, 4 launches) — trick reproduced, sheet invisible

- straight→ramp→lip: **★★★ 2.56 s, −0.19 vs par, `same pieces as par`** — the baseline 22:29:01 lip-jump byte-identical (trick = advice's own sentence again, baseline #7 reproduced).
- THE decisive test: same trick + landing + MY cup past the fixture cup: **finished 3.13 s ★☆☆ over par**, `named "slick skip"` (gr-01), `line "slick skip"` chip in the toolbar. The car JUMPS the slick, FLIES, LANDS on a landing, rolls into my cup — `__gwTally().events = []`. **Zero air, zero catch on the session's most cinematic run.** (Detector constants: AIR 0.25 s, CATCH 0.15 s — swept on CAMPAIGN builds; sandbox-scale air is invisible to the sheet.)
- Booster badge (SPEND): fired ZERO times across every booster I used all session (kitchen ×2, garden tour) — the only spend event I could point at was never seen. The CI `booster-farm` rig (3 badges) pays only on a geometry nobody builds.

## Porch sandbox (~00:33, 2 launches) — the biggest new spark

- Baseline exhibit #2 (the door): straight×2 + **MY cup** placed closer than the fixture's → **finished 0.67 s ★★☆, `beat par ✓ (par 1.20 s)`, −0.53 vs par**, lineKey `porch-sandbox@795,-198,0`, named **"to the door"** (po-01). The goal I placed ran FASTER than the room's par — the first time in either probe the toy called an authored goal a WIN. Cup placement RE-ANCHORS the run (last finishCup wins) — `nothing past it is ever travelled` is now a law with a key in it.
- Second launch (record ghost): 0.67 again, tail `on "to the door" — personal best 0.67 s …` — determinism fine here.

## Campaign — three rungs (~00:36–00:41)

1. **kitchen01**: default `2.04 s fell off` → `add a drop, a lip or a landing · place at: end of the pre-built ramp`; landing → still short; + lip → **★★★ 2.16 s, 2/par-3 pieces** and the FIRST badge of ~35 runs: `chainFall @ t=2.0917, 0.167 s` → tail **`earned — chain fall · first chain fall — earned`** (cp-01). The retroactive-forward line actually made me re-run the rung to watch the goal-beat again — the one cross-run behaviour change of the whole session.
2. **bedroom01**: 4 launches (straight, +straight, then advice's `add a drop`) → ★★☆ 2.38 s. Tally printed NOTHING (DNFs silent, finish badgeless). Did the tally change my next-rung play? **No** — I solved it exactly as the advice line dictated; chain-fall-chasing never crossed my mind (you cannot build toward a badge; the badge names what the par line already did).
3. **garden01**: **byte-identical reskin of kitchen01** (same 2.04 death, same 2.16 finish, same chainFall at t=2.0917 s!) — ★★★ + tail `earned — chain fall` with NO first-line (the device-record hook is correctly one-shot). Note the cross-level geometry duplicate for drift-watchers.

## Verdicts-in-one-line per task question

- Sandboxes with stakes: 4/6 rooms accepted a placed cup + name + your-best race; kitchen rejected everything; bathroom/garden/porch/bedroom/garage each minted a line.
- Dump-and-pray: 1 real sighting (garden, T≈25 min in), urge identical to baseline, mechanics now VOID (past-the-death noise) instead of rewarded.
- 30-min freeplay: ~20 min real sandbox-only in this run — optimized: line reachability and the cup-seat naming loop, farmed: nothing — a 1-badge economy is not a farm; the booster-loop degenerate EXISTS in CI but not in play.
- Campaign rungs: tally changed one behaviour (one re-run after `first chain fall`) and nothing else; badges are post-hoc, unactionable, and advice still authors the play.
- Named-line share: verified film + Build-your-own, no name, no goal, no race verdict — content-shaped, not challenge-shaped.

Screens: kn-00 (arrival), kn-01 (ring/cup gap, kitchen), bd-01 (board+run-cam), bd-02 (record-seat board), bd-03 (named-tail + result), cp-01 (earned tail campaign), po-01 (to-the-door tail + ghost: your line), gr-01 (slick-skip tail + line chip).
