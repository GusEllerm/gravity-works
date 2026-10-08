---
livedocs: snapshot
tags: [session, playtest, stage-6, fresh-eyes]
---

# Playtest DD — stage 6, final sweep (fresh eyes, local build, viewport 1280x900/1000, fresh session)

Stranger playtest of a fresh `npm run build` served at http://localhost:4450 (preview on :4450). No repo code read;
game + this file only. Screenshots kept in tmp/gw-ptdd-shots (NN-*.png). I moved forward via the honest
"next level" button until I hit a wall, then via the `?level=` dev selector — the "dev preview — progress from here
won't unlock anything" banner is a kind, unambiguous tell that I was cheating.

## Progress in order (tries = launches on that rung)
| Level | Tries | Result | What it taught vs what I guessed | Delight / friction (one line) |
|---|---|---|---|---|
| kitchen01 "Book Drop" | ~14 launches, ~18 min | ★★ 3/3 (2.16 s ≤ 2.25, 3 pieces = par 3) | Taught place=hover+click/Enter, `]` alt-socket, R flip, L launch — but only AFTER I stopped pressing the "Place" button; the tray copy and the failing ring taught the ramp→cup grammar | Delight once it clicked; friction finding the click — the **Place button auto-drops into a fixed right-side socket**, so I burned ~10 launches building the wrong track (00/02/07/13-*.png) |
| kitchen02 "Two Ways" | 2 | ★★ 2/3 (1.08 s vs 1.05 par — missed time-star by 0.03) | Nothing new; the "place X at: cup on the table" ghost named the finish socket instantly, ring confirmed the arc | The two-ways split read clearly; felt like a clean puzzle, not a lesson (24-29-*.png) |
| kitchen03 "The Bowl" | 6+ | **WALL — not cleared** | The only snap is a curve exit the game itself says is "blocked — furniture is in the way"; building backwards from the cup extends off-table; `]` swaps to "car's start point" | Frustrating: every valid action is either blocked or wrong-direction; matches Playtest BB's identical 6-try wall (30-35-*.png) |
| bathroom04 "Twin Drains" | 2 | ★★ 3/3 (2.60 s ≤ 2.70, 3 pieces ≤ 4) via dev jump | Nothing new taught; tiled floor is the surface, drain holes + overshoot were the only new physics hazard | Felt great — real bathroom, satisfying 3-piece bridge into the cup (36-43-*.png) |
| garden05 "Sunday Run" (encore) | 2 | **WALL** | Nothing taught — pure "extend the line" remix; stacked drops left a gap the ball fell into just short of the cup | New garden set is lovely; the level itself is just a longer kitchen (46-50-*.png) |
| garage05 (encore) | 2 | **WALL** | Nothing taught; steep ramp + workbench mat; same extend-the-line remix, fell off at the very end | Garage set charming; felt like a remix (51-53-*.png) |
| porch01 | 3 | **WALL (near-solve)** — fell in nose-first at 1.23 s on try 3, hint "lower the lip" | Re-taught the lip lesson (the game's own tutorial rung) inside the sixth room | The porch set is the most charming thing in the game — blue clapboard, doormat, screen door (54-58-*.png) |
| bedroom05 "Lights Out" (encore) | 0 (staging peek) | n/a | — | Genuinely fresh staging: dark room, the run only visible in a lamp's light pool |
| bathroom05 "Full Bath" (encore) | 0 (staging peek) | n/a | — | Water-flooded set; mechanic unchanged, presentation fresh |

## (a) Share + replay — would I send it?
Yes — this is the game's best marketing. From bathroom04's result, "Share this run" produced a readonly `#s=` URL;
opened cold in a fresh browser it renders a full **"Watch this run"** film page: "✓ verified on this machine",
replay hash === link hash (both `e1e2dfff`), a scrubber (1.9 s / 3.5 s), 1×/2×/4× speed, "Download share card", and
"Build your own". The deterministic-physics promise ("Why the same build always runs the same way") is what makes
it forwardable — it's proof, not a gif. Only hesitation: it's ~3.5 seconds of a rolling ball; the *build* isn't in
the film, so a friend sees the run, not the cleverness. (44/45-*.png)

## (b) Sound
Honest limitation: this harness has no audio output, so I could not hear any cue and cannot judge whether sound
"lied" about the physics — I refuse to invent a verdict. What I can report: the "Sound: on" toggle and the 0–100
volume slider are present and persistent; nothing about the mute ever looked like it could desync from a
deterministic engine. No moment made me *feel* the audio was lying; no moment proved it wasn't.

## (c) The four encores (bedroom05 / bathroom05 / garden05 / garage05)
I played garden05 and garage05 (both walls), and opened bedroom05 and bathroom05 for staging. Verdict: **fresh
skin, familiar bones.** Each encore is the same ramp→extend-the-line→cup grammar as that room's 01–03, just longer,
with a bigger budget (par 4, 3.05 s, more drops) and a showy set beat (Lights Out's darkness, Full Bath's water).
bedroom05 "Lights Out" is the most genuinely fresh (the light pool changes what you can even see); garden05 and
garage05 read as remixes — charming rooms, but my hands did exactly what they did on kitchen02. The encore rung
earns its slot on staging, not on mechanics.

## (d) Keyboard-only tells (no instructions read)
Strong. The canvas is `role="img"` with aria-label "Game view — the set, the track, and the toy car"; the target and
hint lines ("target: …", "place lip at: …", the fail toasts) are `<p aria-live="polite">` regions — nine live regions
on the page, so a screen reader narrates the aim and the failure. 28 keyboard-focusable controls. The shortcut line
"Place: … Enter · Flip: R · Launch: L · ] for the other spot" means a no-mouse player can aim purely by cycling
sockets with `]` + Enter (I used exactly that). The one gap: aiming a *free* spot wants "hover the world" (a mouse
verb); the keyboard path is socket-cycling, which is a real alternative, not a parity — a puzzle with a truly
free-placement socket might be unreachable by keyboard.

## Walls (the honest list)
1. kitchen03 "The Bowl" — hard wall, 6+ tries, corroborates Playtest BB's identical failure. The only extension
   socket reads "blocked — furniture is in the way", and building from the cup runs off-table. Either the intended
   build is undiscoverable to a fresh eye or the furniture collision is too punishing. This is the campaign's
   worst learning moment — it stops the whole ladder at rung 3.
2. kitchen01 tutorial — a soft wall: the "Place" button's fixed-socket auto-drop (vs hover-to-aim) cost ~10 extra
   launches on the very first rung. First impression risk.
3. garden05 / garage05 / porch01 — my walls, likely skill: the encore/porch rungs punishes a mis-timed drop-gap
   with no forgiveness and the hint ("add a straight") never names the socket. No bug claim, just difficulty
   spiking exactly where the game stops teaching.

## Verdict — one minute less, what gets cut
Cut the encores' length, keep their sets. kitchen02 proved the core grammar needs ~30 s per rung to shine; the 05
rungs stretch that same verb to ~4–5 pieces and a bigger set and call it a finale — I'd trim garden05/garage05
toward porch-level brevity and spend the saved budget fixing **kitchen03** (that is the single cut-that-pays-for-
itself: a rung that walls 2 fresh-eyes testers in a row is a rung that walls everyone). The share-film is the thing
to protect — it's already the best second.
