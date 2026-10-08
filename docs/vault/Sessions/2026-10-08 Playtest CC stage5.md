---
livedocs: snapshot
---

# Playtest — 2026-10-08, fresh eyes, 1280x720

Stranger-visit to the dev-preview build. Six rooms intended; reached five. No instructions, no prior play.

## (a) Kitchen01 finish + share loop
Finished on launch 3 (Landing at ramp end, then Lip there): ★★★, 2.16 s vs par 2.25.
"Copy a link to this run" puts a plain-text link in a textbox AND clipboard. The link opens a standalone "Watch this run"
page (verified-on-this-machine badge, scrubber, 1x/2x/4x, share card). **First Play click works, but the tape only starts
~6 s after the click** (in-page sampler: playhead pinned at end 3.06 for ~60 frames-of-samples, then one clean 0.07→3.06
pass). During that silence the button still reads Play, so a stranger double-clicks. Scrubber (click-to-seek and drag)
works and seeks instantly. The run does NOT end on the cup — kitchen01 has no cup (greyed); the ending frame pulls back
to show the car parked on my own lip mid-counter. Send to a friend: **yes, for a clean run** (no-install, self-verifying,
one tape), but the dead first 6 s will make friends think it's broken.

## (b) Levels in order, tries per level
- kitchen01 — 3 tries: 0-piece (2★, "let go before the cup: add a drop, lip or landing"), Landing-only (0★, "add a drop
  or a lip"), Landing+Lip = ★★★ finish.
- kitchen02 — 8 tries, unsolved. "Fell off nose-first" every time; advice rotated: "add a lip" → "lower the lip" →
  "add a lip" → "lower the lip". Drop-at-start, Lip flips/rotates, Drop-at-curve-end all fell; times 0.87–0.99 s (par 1.05).
- kitchen03 — 8 tries, unsolved, advice changed on almost every different wrong build: "add a flat landing or add a lip"
  → "flatten the landing or add a lip" → "flatten the landing or lower the lip". R is a *backwards* flip ("it rides
  backwards; fine for a coaster") — no way found to actually "lower" a lip.
- bedroom01 — 5 tries, unsolved. Advice narrowed honestly: "add a straight or a drop" → "add a straight" once I used a drop.
- bedroom02 — 5 tries, **nothing registered**: counter stuck "0 of 5 pieces used", run byte-identical 1.22 s, same advice
  "add a flat landing" every time. My builds demonstrably never landed.

## (c) Clicks / ghosts / camera
- Determinism good: retry-same-build reproduced times to the frame (1.33 s twice, 2.24 s twice).
- Silent no-op #1: clicking Launch while a piece is in hand drops the held piece back to the tray with no warning.
- Silent no-op #2 (bedroom02): status said "place landing at: end of the pre-built ramp", Place button enabled, clicks +
  Enter produced zero placements, 5 times, zero feedback.
- Ghosts never sit at the cursor — they snap to candidate points an inch-plus away while the camera auto-frames; intended
  ("] for the other spot") but it trains mis-clicks.
- Right-drag look: works. Esc-Esc: homes the camera; afterwards two dark red streaks floated near the table edge (artifact?).

## (d) Moments
Best: kitchen01's finish — 2.16 s, three stars, the wide end-shot of the car perched on my lip above the cereal box.
Friend moment: the URL that replays my exact run. Caption: "one build, one release — verified on this machine."
