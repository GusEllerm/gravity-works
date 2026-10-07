---
tags: [session]
livedocs: snapshot
---
# 2026-10-09 — Playtest Z round 7 (fresh-eyes, 1280x633 short window)

Fresh browser session, viewport 1280x633 set FIRST. Screenshots: `assets/playtest-z7-*.png`.

## How far (in order), launch tries per level

1. Book Drop (kitchen01): 3 tries — fail ("fell off — the line let go before the cup", 2.38 s),
   fail (same line, 2.38 s), then ★★★ (finished — 2.19 s ✓ par). Lip→Landing→Drop.
2. Two Ways (kitchen02): 1 try — ★☆☆ ("finished — 1.13 s", par 1.05 ✗, 4 pieces vs par 3 ✗).
3. The Bowl (kitchen03): 3 tries — all ☆☆☆ "fell off — the line let go before the cup" (2.30/2.33 s).
   Stopped with 0 stars → The Tap locked → Bedroom never opened ("A level opens when the level
   before it earns at least one star."). Reached: 3 of 5 rooms.

## CAMERA LOG (right-drag, in order)

1. kitchen01 build (2 pieces down): MOVED — big swing to the start-point view (z7-08).
2. kitchen01 build (after 3rd piece): MOVED — orbit toward table edge (z7-17).
3. kitchen02 build, drag ending off-canvas (y=300 above canvas): DID NOT MOVE — byte-identical screenshot.
4. kitchen02 build, fully in-canvas: MOVED — pushed scene under the fold (z7-27).
5. kitchen03 build: MOVED (z7-35).
So 4/5 moved on this build — not the "worked once, never again" pattern; the one dud ended off-canvas.

## Esc-Esc

Never returned home, ever. (1) kitchen01 results overlay: no. (2) kitchen01 build: no.
(3) kitchen01 build, fast batch: tab dropped to about:blank — page dead (see below).
(4) kitchen02 results: stayed on ?level=kitchen02. (5) kitchen03 results: stayed on ?level=kitchen03.
Only "All levels" link reached the level list (?levels=1).

## Black screen / visible-but-unclickable

- After fast Esc+Esc in kitchen01, the tab became about:blank mid-session; game only came back via reopen
  (build progress lost, pieces restored — inconsistent with kitchen03 reload, which KEPT the 5/5 build).
- 633 px window: result overlays (stars/Retry/Next level) and much of the playfield render below the
  canvas fold; "Next level" click failed once: "covered by <p#gw-piece-count>". Result captions also sit
  below the fold ("fell off — 2.38s · A sloped catcher — match it to the flight…").
- Remove-piece mode silently ate two clicks (piece counter stayed 4 of 5), then the mode quietly turned off
  ("nothing in hand — pick a piece from the tray").

## "Fits" but nothing placed?

No — every "fits here" click incremented the piece counter. The dead clicks were remove-mode (status said
"nothing in hand", not "fits").

## Best moment, as a picture

z7-24: the ★★★ freeze — three par ticks, the little car gone into the bowl somewhere past the fold,
toast and napkin undisturbed on the sunlit table. The Drop snapping over the book gap is what did it:
"A gap with a catch ramp — the line crosses where the drop is."

## Words I could not interpret

- "Same pieces, same run, every time — this code proves it." (proves what, to whom?)
- "oilStain — Oil sheen halves grip…" (raw camelCase in Help)
- A piece listed with no ×N at all, yet totals reach "4 of 4 pieces used" — which pieces did I actually own?
- "target: the car's start point" while holding a piece (is that a place to put it?)
- "par = the target time for this run" (which line is par again?)

## Friend moment + caption

I pressed Esc twice to go home, exactly as promised, and the game deleted the world — about:blank, no
ceremony. Caption: "Home is where the tab crashes."
