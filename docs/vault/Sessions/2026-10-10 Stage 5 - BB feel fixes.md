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
- Full gates: `vitest run` 684 green; main playwright suite 155 run/1 skipped green; filmstrip
  green (see below). Commit stamps the updated notes: [[ui]] (snap-range + aim-or-speak +
  distinct-outcome tie law + the four seams), [[replay]] (Play-rewind + finish-lead + cut-carry),
  [[src]] (the debug seams).

## share-replay CI flake (the replay page's own red on main)
`tests/e2e/share-replay.spec.ts` "the trace, the seek and the playhead are the deterministic sim"
is green 6/6 locally but RED on CI: the play/pause/4× section sampled the playhead after
`waitForTimeout(300/350)` WALL-CLOCK waits. The playhead accumulates real time × rate with a
0.25 s per-frame clamp, so on SwiftShader frame pacing a 300 ms window can contain ZERO rendered
frames (t2 == t1) or burn the 1.2 s-of-sim budget unevenly off-step (the 15.8 s feeltrack run).
Fix: no wall-clock playhead sampling — PLAY advances are asserted by polling the state seam for a
≥ 4-STEP step-quantised advance (30 s generous timeouts), and the 4× rate is proven by covering
1.2 s of sim in < 1 s of wall (a 1× playhead physically cannot); the paused-hold and the
tick-seek state checks are seek-driven per sim step. Proven under CI truth with
`GQA_FORCE_SOFTWARE_GL=1` × `--repeat-each` (see the commit; results appended here).

## After the merge (main 002d453)
Rebased onto main before pushing; the SE's `onPlaceIntent` collapse (place-with-modal) and the
empty-handed button line meet the aim-or-speak precedence in `clickPlaceAt` — conflict resolutions
and the final gates are noted here at landing.
