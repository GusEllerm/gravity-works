---
livedocs: snapshot
tags: [session, feel, stage-6, place-honesty]
---

# Stage 6 — place honesty (the Place button names its drop spot)

Playtest DD's kitchen01 finding was the game's first impression failing: the tutorial stranger pressed the tray
"Place" button ~10 times over 18 minutes and every press built the wrong track, because the plain-labelled button
dropped at what read as "a fixed right-side socket" instead of the spot the aim had named. The diagnosis found no
fixed socket anywhere — `place()` in `src/ui/builder.ts` has always placed at `list[targetIndex]`, the ring the ghost
wears — the lie was in the LABEL: hover-aim legitimately follows the mouse wherever it crosses the canvas, the trip
from the aimed socket up to the button included, so the transit's last intermediate hover re-aimed the ring and the
button said nothing but "Place" at the press instant. Option (b) (downgrade the button to the keyboard path) was
rejected — it strands exactly the pure-click player DD was — and option (a) shipped: `updateGhost` now writes the
target socket's ratified name into the button text (`Place — the car’s start point`, same words as
`#gw-target-label` minus the verb and tie tail), a cannot-place button names no spot and stays aria-disabled, and
the placement code never changed; both mouse-only and keyboard paths (`tests/e2e/a11y.spec.ts`) are untouched and
honest. Proof is `tests/e2e/place-honesty.spec.ts`: fresh kitchen01, mouse-only player, three button presses
(resting aim, hover-aim + transit across the canvas, the cup's exit with a fresh kind), each asserted to place
exactly at the socket the aim named via `__gwTargetSocket`/`__gwOpenSockets` and the counter — zero mis-drops — plus
a label-rides-the-aim sweep over every open socket; the full suite (755 unit + the whole e2e lane at port 4480) is
green on this commit. Recorded in the Decision Log (2026-10-08) and reconciled in `Modules/ui`.
