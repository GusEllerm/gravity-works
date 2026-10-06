---
livedocs: snapshot
tags: [session, playtest]
---
# Playtest J — new rooms (fresh-eyes, browser) — 2026-10-08

Stranger session at `https://gusellerm.github.io/gravity-works/`, no instructions, keyboard/mouse only.

## 1. How far, in order

1. Landing = Kitchen "Book Drop" builder (level name only visible in the URL).
2. "All levels" → level select (Kitchen/Bedroom/Bathroom/Garden).
3. **Kitchen 1 Book Drop** — drop→landing→gapLip by snap-aim, **try 1: finish, 3★** (2.16 s ≤ par 2.25, 3 = par).
4. **Kitchen 2 Two Ways** — straight×2, drop, landing, gapLip (5), **try 1: finish, 2★** (2.33 s ≤ par; 5 > par 3).
5. **Kitchen 3 The Bowl** — straight×2, landing, drop (4/5). **Try 1 failed** ("fell off nose-first"). Try 2 never happened: every remaining snap said "blocked — the set is in the way". Stopped.
6. Loaded `?level=kitchen04` ("The Tap") by URL — playable with full tray despite level select calling it locked. Quit here.

## 2. Level select as teacher

Header line "A level opens when the level before it earns at least one star" is the only rule shown. Cleared levels get gold stars — legible. But **locked and unlocked buttons look identical** (lock state lives only in the accessible name "— locked"); no lock glyph, no room-progress cue. No back-to-current-build control from the select.

## 3. Best moment, as a picture

Kitchen (Book Drop) finish: chase-cam still of the toy car settling into the white finish cup on the floor beside the coffee mug, three gold stars popping.

## 4. Stuck / guessed, per room

- Kitchen 1: stuck hardest overall — landing page taught nothing; the aim/place hints ("←→ · Enter · R") I only noticed by accident; canvas click placement discovered by trial.
- Kitchen 2: title promised "Two Ways" with no way to see the second; guessed the 5-piece road, lost the par star.
- Kitchen 3: guessed that the blue pad by the pipes is the goal; guessed where drop/landing bridge; then "blocked" everywhere.

## 5. Uninterpretable words/numbers

"determinism fingerprint — same build, same run, anywhere"; "blocked — the set is in the way" (which set?); a time + par shown on a **failed** run ("2.82 s — par 2.65 s").

## 6. Broken interactions

- **Help panel lies over the game**: its parts-gallery canvas covers the whole level while expanded — I "played" against the gallery for a while.
- **Two silent placement clicks** on targets reporting "fits here" (after switching held piece via toolbar) — no piece, no reason.
- **Lying button**: level select says The Tap locked; the URL hands it over.
- Enter-to-place did nothing while aim said "fits here".

## 7. Camera during runs

Build view is a fixed drifting orbit that crops the work area at the screen bottom; the run itself gets a lovely tight chase-cam, but failures/results snap to a useless wide shot.

## 8. Send to a friend?

Yes — at the Kitchen 1 first-try 3★ panel, caption: "the car drops off the table and swishes into a cup by the coffee — first run, three stars."
