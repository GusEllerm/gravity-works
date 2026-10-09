---
livedocs: snapshot
tags: [session]
---
# 2026-10-08 Stage 6 close - pacing

## Goal

Kill the two CI-only e2e reds (share-replay "4x never covered the sim window"; stage6-encore-brevity garden05 blind-clear 30 s timeout) under a CI-truth repro, product-side if the playhead could actually starve, test-side only where the product is provably right.

## What was done

Both reds lived on the TEST side. (A) The playhead never stalled: the three CI `Received` values (0.4918 / 0.5917 / 0.1086) are each exactly `duration − t3`, the playhead having PLAYED THE FILM OUT at 4×. The 4× coverage poll measured `t − t3` with a `t3` baseline that was never re-zeroed: `page.click` parks focus on the play/speed button, so the second bare `press('Home')` is a SILENT NO-OP (proved locally: `document.activeElement` stays `#gw-replay-play`, Home no-ops), and seeking-while-playing lets the film run on during the pause round-trips (0.25 s of sim per SwiftShader frame). Whenever CI wall clock left the pause position inside the film's last 0.6 s, the 0.6 s target sat beyond `duration − t3` — unreachable at any patience, which is why the 3ff1bf9 90 s poll went red again. A near-tail Play click legitimately REWINDS (the BB dead-click law, pinned by `stage5-bb-feel.spec.ts`), and the pace-law clamp `min(gap, 0.25 s) × rate` cannot starve 90 s of polling on this 3.9 s film even at 10 s frame gaps — so no product change was owed. Fix in `tests/e2e/share-replay.spec.ts`: PAUSE FIRST, focus the `#gw-replay-timeline`, press Home, and ASSERT the seek landed (`t === 0`) in both the 1× and 4× blocks, so a failed seek fails loudly at the seek instead of resurfacing 90 s later as "never covered". Deterministic red→green proof: with the playhead forced to 3.7997 before the 4× block, the OLD preamble reproduces CI's number to the microsecond (max advance 0.1086 = duration − t3, film ends); the FIXED preamble baselines at 0 and covers. (B) `tests/e2e/stage6-encore-brevity.spec.ts` died mid-`click('#gw-place')` with the default 30 s budget against a missing piece-count wait: added the sibling budget lesson (`test.slow()`, making the in-assertion 60 s waits spendable) plus an event-driven per-Place `#gw-piece-count` wait (the event each Place click owes, no sleeps). Proven green: both specs under the CI-truth config (`E2E_SWIFTSHADER=1` × `E2E_STARVE_RAF_MS=300` × `GQA_FORCE_SOFTWARE_GL=1`, `--repeat-each=6 --workers=6`) 30/30, and the normal local suite green (791 unit + 201 e2e).

## Decisions

- No product change: the pace ledger law and the rewind-near-tail Play law are the shipped, note-documented, spec-pinned behaviors, and the CI numbers prove the playhead honored them to the end. The test asserted a bound the product's own (correct) rewind law makes unreachable from a nonzero baseline.
- The PR CI check then reproduced the SAME class one layer deeper, exactly where the new loud assertion pointed: the run ended between `ensurePaused`'s aria read and its click (at 4x a clamped frame carries ~1 s of the 3.9 s film), so the click hit the BB rewind law — rewind AND PLAY — and the loop's "press again until a paused read" never converged (every iteration can watch a whole rewound film end before the next read). `ensurePaused` now converges ON THE FACE: it reads `#gw-replay-play`'s `data-phase`, treats the ENDED face as success (not playing), never clicks it. The very next CI check exposed the second shape of the same law — even clicking a truly-PLAYING face loses when one click round-trip outlasts `duration/rate` of wall clock and the film ends IN FLIGHT, the click landing on the ended face as rewind-and-play — so a playing face is now rewound first by the timeline's own Home key (full-duration runway makes the click unambiguously a PAUSE) and only then clicked; the seek clears the pace ledger, harmlessly, because every ledger proof runs before the `ensurePaused` that follows it. Verified against the resonance zone locally at `E2E_STARVE_RAF_MS=1000` (round-trips comparable to the film itself) and 18/18 at 700.

## Next

- CI watch on the merge commit; if share-replay ever reddens again it should now point at a seek that failed to land, not at the coverage poll.
