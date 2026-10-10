---
livedocs: snapshot
tags: [reference, evaluation, player]
---
# Evaluation 2026-10-10 — the player re-run (fresh eyes, external)

> [!abstract] Method
> Read [[Evaluation 2026-10-09 player]] (my 4/10 and the brutal list) and the program's own notes
> (`Sessions/2026-10-09 Program T1 feel`, `Program T2 voice`, `Program T3 ghosts`, `Program T3 farewell`,
> `2026-10-10 Program P3 final reds`, `Reference/Action Plan 2026-10-09`), THEN played the current build
> (tree at 398c36a, worktree gw-ev4 branch eval-player2, `npm run build` + `vite preview` :4690) with a real
> browser, fresh profile. Fifteen rungs across all six rooms — cold-first-minute honest, then dev-select
> (the dev-preview badge honest about it; one honest cold chain k01→k02 through the Next button), plus the
> share link opened as a visitor, the farewell crane live, par ghost and friend ghost raced, the daily run,
> the porch sandbox, and `?levels=1`. Two divergences stated: (1) the harness browser reports
> `navigator.webdriver`, so the premise beat is skipped on bare landings — I verified it separately via its
> own gate (`tests/e2e/intro.spec.ts` 5/5 green on this machine) and forced frames with `?intro=1` with the
> seen flag cleared; a human first visit DOES get the beat. (2) the farewell needs an unlocked porch05, and
> walking 25 rungs with earned stars was out of budget, so I earned stars honestly on the early rungs and
> seeded the save's star map for the mid-campaign rooms to reach the ending — the crane, tally and doors are
> then exactly what a finisher sees; the tally numbers were mine.

## VERDICT — 6.5 / 10. The program delivered most of its promises; the bar is 7. The corridor is still a corridor.

The face is fixed, the voice is real, the ending exists, and the social loop now opens on the film. What I
did not get is the toy: on the shipped default-aim path, dumping every tray piece and pressing Launch
FINISHED eleven of the fifteen rungs I walked (the exceptions — bedroom02, kitchen05, bathroom05, one k04
order — are the game's only puzzles per room), the parable of "Two Ways" still cannot be failed to choose,
and the film I would send to a friend stars a RED BOX while the game I played drives a blue sedan. Against
my own list: **2 FIXED, 7 PARTIAL, 1 UNFIXED.**

## The first 60 seconds (cold land, measured)

t+0 for an automation browser is still the builder — but that is the harness, not the audience. For a real
first visit the premise beat plays (verified by frames with the flag cleared and by its green spec): the
chrome vanishes, the display face carries GRAVITY WORKS across the top, and a die-cast blue sedan with a
roof rack rolls a close-up tilt-shifted kitchen for the length of the par line, camera leading. It is the
best sixty seconds this game has ever had — and it spends itself exactly once per browser. Then the chrome
returns: the same beige page, the same system-face copy, the same big "the ring is where it will land"
heading, legal small print, thirteen tray buttons — and, on my 1280×653 window, the SAME 450×253 canvas as
October 9 (the height-fit cap `min(960px, (100vh − 380px) × 16/9)` letterboxes the world on any window under
about 900 px tall; a taller laptop gets 750–950 px, so the old complaint now has a shape: fine on a big
window, still a notepad on a short one). Post/tilt-shift is ON by default (verified in every frame); the
build camera frames the SET — the kitchen01 idle shot is a kitchen now: juice box, cereal bowl, spoon,
mat — which is genuinely charming. First launch: the camera leads, wheels spin, dust kicks, the car has
wheels and a stripe, a translucent par ghost rolls beside you, and the finish line reads "you vs par — time
+0.12 s vs par". The brown result slab over the world is still the ugliest rectangle in the game.

## The re-woven 30-rung walk (15 played, all six rooms)

(rung | how reached | result | what it asked)

- kitchen01 | cold, honest | ★★☆ 2.37 vs 2.25, ~2 min in | tray dump + launch; the ghost beside you; the vs-par delta makes the 2-star sting real.
- kitchen02 | Next button, honest | ★★★-adjacent ★★☆, first try | the dump STILL finishes (union of both lines, every order — the level file is unchanged and says so in its own header). The "choice" is still a formality; losing the pieces star to the 4-piece dump is a tax, not a decision.
- kitchen03 | dev-select | ★★★ pieces, ★★☆ time, FIRST TRY | the old honest-iteration rung is gone: tray = the exact par multiset now, and the dump is the bowl line — the bowl finally does structural work (the bank is IN the par build) — but the rung now teaches nothing, because nothing can go wrong on the first launch.
- bedroom01 | dev-select (rung 4, woven) | ★★☆ 2.38 vs 2.35 | rung-1 grammar 3 rungs in — survivable — and the mid-run frame is the best picture the game has ever drawn: sedan + ghost + tilt-shifted duvet sprawl.
- kitchen04 | dev-select (rung 6) | attempt A: partial tray fell 2.66 s — note: "fell off nose-first — flatten the landing or lower the lip"; full dump FINISHED 2.59 s ★★☆ | the ADD-lie is dead (no more "add a straight" with an empty tray), but the full-tray invariance that the studio's own T2 lane measured (some orders placeably UNWINNABLE behind the tap guard — DEFERRED with evidence) did not bite my order; the wall stands for the order that meets it.
- kitchen05 | dev-select (rung 7) | dump FELL 2.33 s — note: "the booster needs spending EARLY — remove back to the ramp and place the booster FIRST, before the first drop · press ]" → executed it verbatim: named Removes ("Remove the lip by the booster"), booster FIRST at "end of the pre-built ramp", ★★★ 2.38 < par 2.40 | THE flagship fix, and it is real: I read the sentence, performed the sentence, and the game agreed. The wall became a lesson.
- bedroom02 | dev-select | dump FELL 2.33 s, note "flatten the landing" with NO socket tail and no verb to flatten with | I do not know how to clear this rung from its own advice, and I ran the game's best teacher.
- bedroom03 / bathroom01 / bathroom03 | dev-select | all ★★★/★★☆ first try by dump | wallpapered rung-1 grammar, spaced ≥3 apart by the weave (verified in `CAMPAIGN_LADDER` and on the level select — the lock lines now read across rooms honestly).
- bathroom05 (encore) | dev-select | fell 2.63 s → the SAME booster sentence → not re-run in budget | the encore now teaches the room's real verb at least; the shared rail is still the shared rail.
- garden03 | dev-select | ★★★-adjacent ★★☆, dump | the sprinkler still never fires on camera in my frames; the green hose is a decal.
- garage05 | dev-select | ★☆☆ by dump | the encore double-dip again, in apron.
- porch01 (rung 26) | dev-select | ★★★ 1.02 | rung-1's tray, 25 rungs later — lonely but spaced.
- porch03 | dev-select | ★★★ 1.18 | the whole tray load-bearing; the best late rung.
- porch05 | unlocked (seeded star map, stated above) | finished 1.38 — and then the ENDING.

## The ending (the farewell, live)

On the first finished porch05 with a real star, the result bar never appeared: a crane pass lifted over the
six rooms in campaign order (11.9 s, star tally revealed per room), then the summary line — "30 rungs
walked — 60 of 90 stars" — and THREE DOORS: keep building (porch-sandbox), race today's daily run, watch the
film of this run. The sandbox door landed me in a sandbox. The complaint "the campaign ends on a share
button" is dead; it ends on a house. The seams: the ghost-chip strip and Sound chip LEAK through the crane
and the premise beat (the hide-class misses the corner bar), the wide crane legs are flat color blobs over
empty beige between rooms, and at a short window the three door buttons render vertically CLIPPED (visible
in the screenshot — half a line of each label cut off). Cosmetic, but they are cosmetics on the poster.

## The two share moments

Giving: finish → Share this run → a real 803-char link, honest "copy the link below". Receiving: the page
opens PLAYING at frame zero — player, scrubber, speeds and "Build your own" above the fold, one verdict
line under the player ("✓ verified · matches the link — re-simulated on this machine"), the hash essay
folded (the two hash readouts are still a visible strip). The film canvas is small and blurry, and — this
is the new ugly one — THE FILM'S CAR IS THE OLD RED FALLBACK BOX. Nobody mounted the ratified rig on the
replay page (only `bootGame` and the ghost do; the T1.1 ledger itself booked the chore and nobody came).
A friend watching my kitchen03 run sees a red box bouncing on MY track while I drive a blue sedan. A
corrupted copy of the link honestly says "this link is not a run — nothing to replay" — credit where due.

## Hour two, raced for real

Par ghost: ON by default, translucent sedan beside you, finish beat in deltas, lazy wind so it costs
nothing on boot — I raced it and LOST by 0.12 s on rung one, which is the most I have ever cared about a
kitchen01 replay. Friend ghost: pasted my own link into the rung, note said "their car is on the grid —
launch to race it", mode flipped to friend — honest and cheap. Daily: `?daily=1` finished with an honest
chip ("race today — best 2.37 s · streak 1 day · your own runs on this device only"). Sandbox: porch-sandbox
has all thirteen pieces ×99 and loops PLACE (loop + ramp + cup down; 3 of 999). But: the campaign's own
trays still use five kinds (the bank is authored geometry, not a tray piece; loop/S-bend/spring/curve
appear in ZERO campaign trays), and the level select still does not list the sandboxes — the campaign
points at the afterlife only ONCE, from the finale.

## The brutal list, ten months (four days) later

1. t+0 debug face / look off by default — **PARTIAL**: post ON, premise beat, display stack, set-framed camera; but the beat is once-ever, the returning-visitor builder is still beige small type, and the canvas is STILL 450×253 on a short window.
2. rung-8 déjà vu / rooms as wallpaper — **PARTIAL**: the weave spaces the grammar (verified in data and play), the bowl finally builds; but the kit is five verbs everywhere, the sprinkler never fires, and the encores are still one shared rail in four color schemes.
3. rung-2 choice that cannot fail — **UNFIXED**: the level file never moved; the union dump finishes every order; only a star-tax comments.
4. rung-4 ADD-lie with an empty tray — **PARTIAL**: the note says MOVE now ("flatten the landing or lower the lip", orphan "pull it back" + named Removes); but the tap-guard wall is DEFERRED with evidence for the orders that walk into it, and bedroom02's "flatten the landing" still names no verb or socket I could act on.
5. rung-5 booster lie — **FIXED**: I read it, executed it, three stars; the sentence even repeats itself at bathroom05.
6. rung-26 rung-1 grammar — **PARTIAL**: tray unchanged, now 25 rungs from its twin — spacing, not a cure.
7. the Retry-button ending — **FIXED**: crane, tally, three doors, once per save, reduced-motion static page; leaky chrome chips and clipped door buttons are cosmetics on an ending that LANDS.
8. share recipient sees blur + hash essay — **PARTIAL**: film-first is true, the verdict line is one honest line, the essay folds — and the film stars a red box, on a postage-stamp defocused canvas.
9. hour-two pieces locked in unmentioned sandboxes — **PARTIAL**: the finale door opens the sandbox and the afterlife (ghosts/daily) is real and raceable; the first hour still never says the word, and the campaign kit is still five verbs.
10. acceptance memory overrated the beats — **PARTIAL**: the bowl is no longer a brochure; the encore rail and the still-decorative hazards say the couch re-read is still owed.

## What is genuinely good

The failure note is now the best teacher I have met in this genre in two evaluations: it names the symptom,
the MOVE, the socket, and the key, and it is right (I executed its exact sentence for three stars). The
ghost race turns every replay into a two-car race for zero physics cost. The premise beat, the sedan, the
dust, the vs-par deltas — the played frame is a toy at last. The farewell made me feel something at rung
thirty for the first time in the history of this program. Invalid input speaks honestly, dev previews call
themselves out, and every hash I touched did not move.

## Score

**6.5 / 10** — below the 7 bar. The program spent its weeks on the face, the voice and the shape, and got
the face and the voice nearly right and the shape mostly right. The points still on the table are exactly
three: a campaign whose DEFAULT path is "click everything, press Launch" eleven rungs out of fifteen
(the weave spaced the sameness, it did not thin it — the tray-vs-par parity that fixed k03 also DEFEATED
k03); a share film that shows a red box instead of the car the whole game was rebuilt around; and the
level-data debts that were measured, minuted and left standing (k02's fake choice, the k04 tap guard,
bedroom02's unspeakable fix, the encore rail, the dry porch, the silent sprinkler). None of them need a new
engine. They need the level files the program never opened.
