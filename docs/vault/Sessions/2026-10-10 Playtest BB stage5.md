---
livedocs: snapshot
tags: [session, playtest, stage-5, fresh-eyes]
---

# Playtest BB — stage 5, fresh eyes (viewport 1280x720, fresh session)

Stranger playtest of https://gusellerm.github.io/gravity-works/ . Browser + this file only.

## Progress in order (tries per launch)
| Level | Tries | Result |
|---|---|---|
| kitchen01 "Book Drop" | 1 | Cleared, 3★, 2.13 s (par 2.25), 2/3 pieces (unused piece allowed, no nag) |
| kitchen02 "Two Ways" | 5 | Cleared on 5th, 3★, 1.02 s (par 1.05), 4/4 pieces. Builds: straight+straight+lip → nose-dive; rotate-flip lip → identical line; +drop → same; drop-only → new line "the line let go before the cup; add a straight or a drop"; drop+straight+lip-on-curve-socket → WIN |
| kitchen03 "The Bowl" | 6 | NOT cleared. Fail lines: "the line let go before the cup; add a straight or a lip" → "…add a straight or a drop" → "fell off nose-first — add a flat landing or lower the lip" → "flatten the landing or lower the lip". Tried lip+landing, straights bridge, lip on cup socket, drop at "2 spots", "]" second spot — nothing worked |
| bedroom02 "Pillow Plateau" | 6 | Not cleared (reached via `?level=bedroom02` URL — see locks) |

Ordered run stalls at 2/3 of Kitchen; Bedroom/Bathroom/Rooftop/Party/Loft never reached legitimately.

## (a) Share → replay in new tab
"Share this run" → toast "Link copied — send to a friend" + readonly `#s=` URL + "Card PNG" button. Opened link in a new tab: "Watch this run" page, "verified on this machine", scrubber with shot-cut tick marks, 1×/2×/4×, "Download share card". Scrubbing works (click jumped to 1.0 s, ball mid-ramp). Shots DO change: wide follow → cut to low-angle ramp closeup → cut to drop/landing closeup → wide finish. But: first Play click did nothing (button never became Pause, scrubber frozen at 3.0); second click worked. One ~0.5 s mid-replay window shows an empty ground frame (ball offscreen between cuts).
Would I send it to a friend? Marginal yes: the replay proves "you could do this" in 3 s and the verified badge is charming, but a 3-second clip with a blank frame and one dead Play click is not the moment I'd forward. If the cuts actually ended on the cup-dunk and the dead click is fixed, yes.

## (b) bedroom02 advice after two different wrong builds
- Build 1 (one straight, ball nose-dives off ramp): "fell off nose-first — add a flat landing"
- Build 2 (two straights, different wrong trajectory): "fell off nose-first — add a flat landing" — identical; the line is keyed to the fail *class*, not the build.
- Build 3 (added the landing it asked for): "fell off nose-first — flatten the landing" — so lines DO evolve across failure classes, and this one names a change ("flatten") but never says HOW: Rotate only flips; "]" did nothing visible at that spot; scrubbing the hint produced no state change. Player left guessing.

## What taught me
The ghost labels ("place lip at: end of the prebuilt curve") and the ring landing-prediction; failure toasts name the right piece but not the right socket; the mid-flight camera teaches physics better than any tooltip.

## Bugs / dead interactions
1. Replay page: first "Play" click dead (kitchen01 share link).
2. Place button click while result modal open: no-op, no feedback (bedroom02, twice; status still said "place landing at: end of straight").
3. "]" "other spot" sometimes silently does nothing (two runs byte-identical 1.94 s).
4. Snap ghost lands far from cursor (click at 700,600 places piece at ~770,645 lip socket) — placed a lip 150 px from where I clicked and it counted.
5. Level locks cosmetic: `?level=bedroom02` loads a 🔒 level directly; "All levels" map shows all locked bedroom tiles.
6. Failure toast renders mid-canvas and hides the ball's fate during the flight camera.

## Best moment (picture)
kitchen02 finish: ball drops through the drop, camera cuts to a low angle, tiny dust puff, and the ball rolls politely into the lip socket at the plate edge — "breakfast served" toast, 3 stars, 1.02 vs 1.05 par. Felt like a Pixar short in 300 pixels.

## Friend moment + caption
The share-replay reveal: a link that opens a little film of my exact run, "verified on this machine".
Caption: "my ball made breakfast in 1.02 seconds, no notes."
