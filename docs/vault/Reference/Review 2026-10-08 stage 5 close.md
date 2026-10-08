---
type: review
status: snapshot
date: 2026-10-08
stage: 5
tags: [review, stage5, close]
---

# Review 2026-10-08 — stage 5 close

Snapshot review of stage 5 (replay readiness, chunked wind, sound, aim law, tie law), finishing a
predecessor's close pass. Livedocs: snapshot — this page is a record of what was checked, not a
living ledger.

## Inherited and accepted (not re-run here)

replay-all 26/26 verified; `npm run pars -- --check` green; sound imports nothing from
world/physics/render (import-graph spec); no XSS (textContent everywhere); tray ⊇ par asserted for
porch rungs; the slice-hash gate is real (a Node `World` stepped to the browser's own slice
boundaries); sound/aim/cinematic/save unit specs 47 green.

## (a) sound.frame() call-site ordering, listener/timer discipline

The frame sink sits at the foot of the game frame loop (src/boot.ts:1915), AFTER the stepping block
and after the mesh pose is written, so it reads exactly what was rendered this frame
(`pose.pos`/`pose.quat`, wall `dt`). The only in-frame state mutation is `launchQueued → startRun()`
at the head of the same frame, and `startRun` clears `prevMeshPos` (src/boot.ts:1687), so the
position-delta speed reads zero for that frame — no phantom roll spike. Out-of-frame mutations
(`resetCar`, `rebuild`) move the car between frames and could inflate one frame's delta, but both
paths take the roll voice away first (`sound.stopRun()`) and `frame()` gates the roll update on the
voice existing, so the stale delta has no consumer; `prevMeshPos` is rewritten every frame, so the
staleness is one frame deep. No leak: level switches are cross-document (`window.location.search = …`
in src/boot.ts:1525 and src/ui/levelselect.ts:112 — a search swap reloads), so every
`window`/`document` listener and the sound bed's `setTimeout` chain are one-per-document;
`bootGame` runs once per document (src/boot.ts:454).

## (b) Mutation sweep (throwaway working-tree edits, reverted; one per target)

| target | mutation | outcome |
| stage5-ready.spec.ts item 4 | pump rides `requestAnimationFrame` instead of `setTimeout(0)` (src/boot.ts:802) | RED — never reaches `ready`, 90 s timeout (baseline 5.9 s green) |
| share-replay pace/pump additions | playhead clamp removed in the replay loop (`dt = (now-last)/1000`, src/boot.ts:1058), run under `E2E_STARVE_RAF_MS=300` | RED — "the 1x frames did not honour the pace law" (baseline green) |
| stage5-bb-feel item 3 (aim range) | NOT RUN — turn limit | unverified |
| aim-outcomes tie law (unit) | `distinctOutcomes` dedup removed (src/ui/builder.ts:203) | RED — 3/5 fail (baseline 5/5 green) |
| tools/replay-all.mjs | `kitchen01.parTime` −1.00 s in src/world/pars.json | RED — `FAIL: time 2.233 > 1.25`, exit 1 (baseline 26/26) |

## (c) Save v2 sound/settings round-trip

`settings.sound` rides the optional-key round-trip documented in src/save/save.ts (no schema bump);
the boot read sites coalesce (`loadSave().settings.reducedMotion ?? false`, mute/volume read through
`createSound`'s loader), so a missing or corrupt value falls back to the engine default rather than
`NaN` into `setVolume`. Not mutated this pass — see follow-ups.

## Open findings carried in

- **F-1 (medium)** src/boot.ts:802 — the wind pump chains `setTimeout(pumpSlice, 0)`. Chrome
  clamps chained timers, and intensive throttling aligns timers on a tab hidden past ~5 minutes to
  roughly one wake per minute; a tape needing N more slices then waits N minutes. Stage5-ready item
  4 proves rAF-independence (rAF never fires there) but cannot see timer clamping. Fix shape: drive
  the pump from a `MessageChannel` port (or `postMessage` loop), which is not timer-throttled, with
  the 0 ms timer as the fallback.
- **F-2 (medium)** tests/e2e/stage5-ready.spec.ts:139 — `if (clickedWhileWaiting)` makes the
  pendingPlay proof conditional: on a machine that winds inside the `waitForSelector` window the
  branch is skipped silently and the queued-click claim is untested for that run. Assert at least
  one of the two branches ran (or force the waiting state) so the skip is visible.

## Verdict

**ship-with-follow-ups.** Every green claim inherited above held up under the mutations that were
run (4 of 5 targets, each RED), the sound frame sink is read-only and leak-free per document, and
nothing in the diff is broken. Two follow-ups: F-1 (background-tab winding stall) and F-2
(conditional proof), plus the unrun aim-range mutation.
