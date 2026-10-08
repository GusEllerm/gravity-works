---
livedocs: snapshot
tags: [session, stage-5, feel, salvage]
---

# Stage 5 — BB feel fixes (salvage of the dead predecessor's WIP)

Worktree `gw-feel16`, branch `stage5-bb-feel`. The previous Feel Engineer died mid-task at
`8faeffc` (checkpoint commit, typecheck-broken in `tests/unit/aim-outcomes.test.ts` — wrong
`../../track/...` import roots — and in `tests/e2e/stage5-bb-feel.spec.ts`). Their WIP had the
four playtest-BB items substantially PLANTED (see the diff of `8faeffc`): the replay Play-click
rewind (`PLAY_RESUME_MIN` in `src/boot.ts`), the cup-owning finale (`REPLAY_FINISH_LEAD` + the
blend look-at carry in `src/replay/cinematic.ts`), the aim-or-speak `clickPlaceAt` and the
distinct-outcome tie law (`distinctOutcomes` / `dryRunHash` / `flipPlacement` in
`src/ui/builder.ts`, unit-gated by `aim-outcomes.test.ts`), plus their proof specs. What was
missing was a green tree. This log records what the salvage found and what it changed.

## Salvage step 0 — the stale server
The first proof run reused a `vite preview` the dead session left LISTENING on port 4360, serving
a PRE-checkpoint `dist/` (mtime 19:28 vs the 20:07 commit) — two of the new specs failed against
code that did not exist on disk (`__gwTieOutcomes is not a function`, the old empty-handed
placement). Killed the squatter; rebuilt. Proof ports moved to the 4360+ lanes as briefed.

## What was finished
1. **Spec typechecks** — unit-test import roots (`../../src/...`), the `probe` signature, the
   e2e `Projected` type predicate, and the now-unused `serialize` import.
2. **Item 4 seam honesty** — the spec's test-side dry run keyed on `PIECES.landing.params` while
   the app seats with the TRAY override (`levelTrayParams` → `KITCHEN_GAP.landing` on kitchen03):
   hashes disagreed about geometry, not about the law. New accessor `Builder.heldState()` (+
   `__gwHeldState`) exposes held kind + EXACT params + flip; the recompute now shares the app's
   inputs and stays an independent computation. 5 unit + 1 live proof green.
3. **Item 3's law, corrected.** The WIP's `AIM_WORLD_RANGE_M = 0.5` ray-perpendicular cap is
   mathematically redundant with the screen cone (perp = dCam·tan θ; a screen-radius conjunction
   only ever TIGHTENS the cone at depth) and it refused legitimate aims: a feeltrack centre click
   sits 159 px from the nearest socket — beyond `HOVER_PX` anyway — while every campaign aim
   beyond ~3.5 m needed > 0.5 m at ≤ 120 px. The cap came out (with `clientPxToWorldRay`, which
   only it used — `aim-transform.ts` back to `da2fc2a`); `HOVER_PX`'s note states the law. BB's
   bug was never the radius (their click was 150 px, already outside 120) — it was placing at the
   STALE ring after a failed aim, and that is what `clickPlaceAt`'s aim-or-speak fixes. Empty-
   handed clicks now speak the HAND line first, wherever they land (keeps playtest U's contract).
4. **The regression sweep the cap triggered — 9 specs that proved placement THROUGH the stale
   ring** (centre clicks at 159 px on the feel rig): `click-place` ×4, `playtest-n` panel
   pass-through, `playtest-tu` zombie reconcile (the empty-handed half needed only the ordering
   fix), `playtest-y` T11 below-fold release, `viewport-aim` hiccup restore. Each now expresses
   the intent at the RING'S OWN projection — new `Builder.targetSocketPx()` + `__gwTargetSocketPx`
   seam — so what they prove is the GESTURE law, and the far-click specs (`stage5-bb-feel` item 3)
   prove the RANGE law. T11 keeps its below-fold coordinates honestly: it releases straight below
   the socket nearest the fold (65 px, inside the cone), asserted as a precondition, never a skip.

## Proofs (all on this branch)
- `tests/unit/aim-outcomes.test.ts` — 5 green (collapse/keep/first-wins/flip-is-a-build/single).
- `tests/e2e/stage5-bb-feel.spec.ts` — 5 green: Play click moves on the FIRST press (1a) and
  rewinds from the tail (1b); per-100 ms census of the kitchen01 finale second — zero car-less
  frames, cup in-frame at the terminal beats (2); far held click places nothing, moves no ring,
  says "nothing fits out here", held near-tie still snaps nearer-depth (3); the kitchen03 held tie
  speaks the distinct-outcome count and the `]` walk visits distinct builds (4).
- Full gates (final, post-rebase): `vitest run` 694 green; main playwright suite 164 run/1
  skipped green (ports 4360+ lanes); filmstrip local-machine status in its own section below.
  Commit stamps the updated notes: [[ui]] (snap-range + aim-or-speak + collapse-before-refusal +
  distinct-outcome tie law + the four seams), [[replay]] (Play-rewind + finish-lead + cut-carry +
  pace ledger), [[src]] (the debug seams).

## share-replay CI flake (the replay page's own red on main)
`tests/e2e/share-replay.spec.ts` "the trace, the seek and the playhead are the deterministic sim"
is green 6/6 locally but RED on CI: the play/pause/4× section sampled the playhead after
`waitForTimeout(300/350)` WALL-CLOCK waits. The playhead accumulates real time × rate with a
0.25 s per-frame clamp, so on SwiftShader frame pacing a 300 ms window can contain ZERO rendered
frames (t2 == t1) or burn the 1.2 s-of-sim budget unevenly off-step (the 15.8 s feeltrack run).
Fix: no wall-clock playhead sampling — PLAY advances are asserted by polling the state seam
(30 s generous timeouts) and the RATE is asserted per rendered frame from the page's new pace
ledger (`__gwReplayPace` in `src/boot.ts`, cleared at every seek/play/speed break): every
interval of a contiguous session must advance the playhead by min(frame gap, 0.25 s) × rate,
which no pacing regime can land off-step by construction; the paused-hold waits double-rAF
instead of sleeping, and the tick-seek state checks remain seek-driven per sim step. Proven under CI truth with
`GQA_FORCE_SOFTWARE_GL=1` × `--repeat-each` (see the commit; results appended here).

## After the merge (main moved twice more: 002d453 SE shell fixes, then bccbee2 with the K3 re-sweep)
Rebased onto main before pushing. Where the laws meet:
- **playtest-n's panel pass-through** — SE rewrote the test while I was making its click
  aim-honest; the merge takes THEIR ended-read version (click a canvas pixel of the caption
  strip; the intent must end READ — placed or refused), and the meeting point is in
  `clickPlaceAt`: the refusal branch fires `onPlaceIntent` BEFORE speaking, so a held-piece
  intent far from every socket collapses the panel and then says "nothing fits out here" —
  BB item 2's collapse law and the aim law both hold; the button path already ran the same
  dismissal inside `place()`.
- **Empty-handed clicks** still speak the hand line without collapsing (no build intent).
- **playtest-pq's rung table** was RED from the K3 merge (pars.json moved kitchen03 to
  5/1.45 s, the spec row still said 2.65 — pre-existing on main). Fixed in the house way:
  the table DERIVES from `pars.json` (imported with `{ type: 'json' }` — Node's ESM law for
  spec-side JSON), so the next re-sweep cannot rot it again.

## Flake-proof results (share-replay, the CI red)
`src/boot.ts` carries a PACE LEDGER (`__gwReplayPace`, cleared at every seek/play/speed
break, `__gwReplayState` unchanged): [wallMs, playheadS, rate] per advanced frame. The spec
asserts the rate law per rendered interval — advance === min(gap, 0.25 s) × rate, 1 % tol —
and replaces every wall-clock playhead sample with a poll (30 s) plus a double-rAF held-state
check. Proofs run: `GQA_FORCE_SOFTWARE_GL=1` + real SwiftShader WebGL
(`--disable-gpu --use-angle=swiftshader`, renderer string verified as the CI's) —
share-replay ×6 serial 18/18, ×4 parallel 12/12, the replay family 9/9; a throttle probe at
10×/20× CPU (CDP) held the interval law across ≥5 starved intervals and the progress poll
caught 0.6 s of sim. By construction the assertion's expectation is derived from the gaps the
page actually experienced, so no frame pacing — CI or worse — can land it off-step.

## Filmstrip (main lane) — local-machine record, NOT touched
`npm run test:e2e:filmstrip` L02 coverage floor (`≥5` frames) is red on THIS machine, 4/5
samples every run, pixel bars green (worst 39.6 % vs the 60 % bar), IDENTICALLY at baseline
`da2fc2a` in a scratch worktree — pre-existing, not this branch's. Measured cause: the run's
wall clock from the sample clock's zero is ~0.8 s here (release lag + screenshot cadence),
so the 1.0 s boundary is never inside the run; the floor was tuned on faster boxes, and the
same wall-clock-against-a-run-clock shape as the share-replay flake. CI does not run this
config (workflow runs the main suite only), so it is left for its owner with the measurement
here rather than loosened silently from a feel branch.

---

## Addendum — replay readiness (feel pass on Playtest CC item (a), branch `stage5-ready`, worktree `gw-feel17`)

CC's stranger clicked Play on a share link and the film answered ~6 s late, playhead pinned at the
end the whole time — the double-click-and-give-up window. Cause, measured here: the ready path paid
TWO one-shot simulations (the `replayRun` verdict and the synchronous `stepAndRecord` fast-forward)
plus a one-time ~870 ms post-stack shader compile, all on a blocked main thread behind a button
that still read "Play" (`livedocs: snapshot` of the pre-fix probe: bar up 1.36 s, one 925 ms block).

What changed:

- `TapeRecorder` (`src/replay/cinematic.ts`) — the old `stepAndRecord` loop as a resumable state
  machine: `pump(n)` (≤ n fixed steps), `done`, `totalSteps`, `hashHex`, `sliceHashes` (state hash
  at every pumped boundary), `finish()`. `stepAndRecord` is now the one-shot wrapper over it.
- `bootSharedRun`/`startReplayPlayer` (`src/boot.ts`): ONE chunked wind replaces the two sims; the
  wind settles the verdict (headless `replayRun` survives only as the could-not-mount fallback).
  The bar goes up FIRST in a waiting state (`data-phase="waiting"`, `aria-busy`, "⏳ winding the
  tape… N%" + `#gw-replay-progress`, no `aria-pressed`) with a pre-wind wide preview frame; a click
  during the wind sets `pendingPlay` (label "queued"), honoured on ready with the playhead snapped
  to 0; `__gwReplayWind()` / `__gwReplayPhases()` are the e2e seams. The post stack is built BEFORE
  the wind — measured cheaper than scene-shaders-then-stack (1.20 s vs 1.96 s to first frame here).
- Chunk law: `WIND_CHUNK_STEPS = 32` fixed steps per pump, `WIND_CHUNK_BUDGET_MS = 8` per slice;
  the slice clock is rAF-armed but timer-raced, so a slow compositor cannot stretch the wind.

Measured on this box: waiting bar at ~150 ms; wind is ~50 ms of sim work across 9 slices (label
counts 0→96 % before the tape is ready); verdict `verified` the moment the wind ends; first painted
traced frame ~1.2 s (dominated by the software-GL shader compile, now inside the honest waiting
window); playhead 0.03 s at the ready sample, terminal 3.01 s at ~4 s of watching; ledger
`waiting → queued-click → playing → paused → ended`. Hashes unchanged through all of it: 268 steps,
`d32417dc`, equal to the one-shot `replayRun` result AND equal slice-by-slice against a Node
`World` stepped to the same boundaries (`tests/e2e/stage5-ready.spec.ts` 3, `tests/unit/cinematic.test.ts`).

Proofs: 695 unit green (one new chunking test); e2e full suite 166 passed / 1 skipped incl. the
three new readiness specs and every prior share/replay gate (`share-replay`, `replay`, the BB
`1a/1b` play-click laws, `determinism`, `replay-red`).

## CI-red salvage: the wind pump leaves rAF (2026-10-11, worktree gw-feel18, branch stage5-pump)
The share-replay trace test went red ONLY on CI (page.evaluate 30 s timeout, 6/6 green locally): the pump arm raced rAF with a 16 ms timer, and a STARVED frame callback — CI's SwiftShader compositor, or a HIDDEN tab where Chrome fires no rAF at all — starved the CHUNKS (also a product bug: a backgrounded tab never got its tape). Fix: the slice chain rides `setTimeout(0)` and rAF only paints the label (`src/boot.ts`'s wind); the seams stay read-only and `tests/e2e/share-replay.spec.ts` now READY-polls the wind phase (90 s) before its first evaluate; the pace clamp no longer wipes the ledger, so a film-out session's law-honouring frames survive a 2-frame 4× tail (the one harness-induced red found on the way). CI-truth repro on this GPU box: `E2E_SWIFTSHADER=1` (renderer string verified SwiftShader, the CI rasterizer) × `E2E_STARVE_RAF_MS=300` (test-side rAF-delay harness) × `GQA_FORCE_SOFTWARE_GL=1` × `--repeat-each=6 --workers=6`: 42/42 green on share-replay + stage5-ready (incl. new item 4: hidden visibilityState + rAF NEVER fires, the tape still winds chunked to the identical slice ledger — probe note: `waitForFunction` DEFAULTS to rAF polling, so the hidden-tab probe must pass `polling:`); suite-wide 167 passed/1 skipped + 695 unit green.
