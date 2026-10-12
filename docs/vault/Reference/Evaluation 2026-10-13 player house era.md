---
livedocs: snapshot
tags: [reference, evaluation, house-era]
---
# Evaluation 2026-10-13 — player, house era (what a stranger meets at the NEW door, priced fresh)

> [!abstract] Method
> Worktree `gw-h4`, branch `eval-h4-player`, tree `97c6a6b` (main tip = program close). `npm run build`
> + `vite preview` **:5100**, one fresh browser profile (never a campaign save of its own), viewport
> 1280×633 plus targeted 633×900 and 390×844 probes. Lanes: timed cold first visit; a stranger's full
> route downhill → kitchen window → tour → sandbox → LINES → daily → seeded veteran → porch05 farewell;
> then the surfaces the freeform verdict's 8 lanes did not walk (`Reference/Evaluation 2026-10-13
> freeform verdict`): touch geometry, the house's SOUND path, the tab path *around open panels*, the
> door's second act, and every link that leads back to the bare route. Evidence in
> `Sessions/eval-h4-player/`. The prior 8/10 is not re-litigated; this lane prices **the seams the
> door-swap itself created**. Grounding read first: `Sessions/2026-10-13 Freeform program close` §Below 9.

## Fresh rubric (this question, not the program's)

| Axis | Question a stranger actually asks | Score |
|---|---|---|
| Arrival | Does the diagram-house explain itself in the first 60 s? | 7/10 |
| The pitch | Is the first downhill worth the one press it asks for? | 7/10 |
| Free play | Does the game judge and release free play kindly? | 8/10 |
| The commons | Lines/daily/chain — is there a life beyond the tape? | 8/10 |
| The return | Does the door know you, and can you GET BACK to it? | 4/10 |

**VERDICT 7/10.** The receipts still never lie and the failure copy is still the kindest text in the
game — but the act of moving the door *itself* severed things the old front end had and the new one
quietly lost: the house is **literally silent**, **wears no nameplate at a normal window**, and **has
no door back** anywhere in the shipped UI. The referee suite cannot see any of this because every
spec boots an ADDRESSED rung (`?boot=rung`, the webdriver law) — the front door is the only surface
in the repo no test ever stands in.

### First-visit stopwatch (held honestly)

Fresh profile, bare `/`, cold cache: `loadEventEnd` **108 ms**, first-contentful-paint **168 ms** —
the door boots three orders of magnitude inside the 60-second law. Stated harness divergence, same
as every prior lane: under webdriver the premise beat does not fire, so the t0 frame I captured is
the door the beat ENDS on (`11-beat-t0.png`, captured via the forced `?intro=1`, is the honest first
image: a wordmark over floating rail slivers and one grey deck slab). A human's first visit additionally
sits ~6.0 s (`HOUSE_BEAT` = pull 1.0 + roll 4.5 + still 0.5) — see truth 1 for what that silence costs.

## Top-8 brutal truths (each with the scenario that proves it)

### 1. The house is not "deaf" — it is LITERALLY silent, and only the house.

`bootHouse` has no `src/sound` import at all (the word `sound` appears nowhere in `src/pages/house.ts`), and the bare route in `src/boot.ts`
early-returns into the page before the SOUND block (`createSound`, the gesture-unlock listeners, the
`#gw-sound` toggle chip, `setBed`/`setSurface`) ever runs — that wiring lives only in `bootGame`, the
OLD front end's boot. Consequences a stranger meets: the ~6 s premise beat is silent BY CONSTRUCTION
(`src/pages/intro.ts` states it — the beat swallows the first gesture, so the engine never even
unlocks); the downhill — THE PITCH, four rooms, crane and all — plays with NO roll voice, NO room
bed, NO terminal edge; and the home page has no Sound toggle to even discover volume with. Scenario:
kitchen table, first visit, speakers on. Seven seconds of moving nothing at the house's scale; then
they tour Book Drop and hear the kitchen clock and the roll they just watched silently. Same car,
same rails, sound EXISTS — it just doesn't live at the front door. The close note says the program
"cost paint, not truth"; this is neither — the swap moved the door out of the room where the sound
engine is wired in and nobody carried the wiring through.

### 2. At the most common window the door wears no name.

`src/ui/shell.css`'s short-window compact rule (`@media (max-height: 700px) → h1 { font-size: 13px }`)
was written for the RUNG page's fold arithmetic; the house inherits it. At 1280×633 the wordmark
h1 renders 13px AT x=150,y=12 — directly under the daily chip, and `elementFromPoint` there returns
the chip's link: the name is covered, not styled. Proof shot `03-wordmark-under-chip-proof.png`:
raising the h1's z-index by one makes "GRAVITY WORKS — THE HOUSE" appear behind the chip mid-screen —
it was there the whole time, invisible. At 633×900 and 390×844 the h1 goes full-size but collides/
wraps under the chip anyway (`08-house-633.png`, `07-house-390.png`). Scenario: a journalist grabs a
633-high screenshot for the article. The caption writes "some beige thing with buttons." The freeform
verdict checked the wordmark's PRESENCE in the DOM at t0 and never its pixels.

### 3. The new front door is a ONE-WAY door: nothing in the shipped UI leads back to it.

Grep for `href` to the bare route across `src/`: ZERO. Live, every anchor on `?level=kitchen01`
= `?levels=1`; every anchor on `?levels=1` is a `?level=…` (verified set-difference: none base to
`/`); the daily page, the sandbox pages, the replay page — same. Scenario: ten minutes in, a stranger
who came IN through the kitchen window wants "that house screen" — browser Back or typing the URL is
the only way home. And the farewell's "the whole house" door (`src/pages/farewell.ts`) links
`?level=house`, which is a DIFFERENT house — build 1's flat page with all thirty tour links expanded
in a DOM list (`snapshot` on `?level=house`: 6 headings + 30 links, no window buttons, no Release-era
chrome order) — so the one link that does say "the house" delivers a stranger's second, flatter house
than the one they were welcomed by. Two house UIs, one URL family, no path between them and the door.

### 4. At 390px the six windows are a stack of lies — and taps land in the wrong ROOM.

`07-house-390.png`: the window cards keep desktop widths while the canvas reflows, so they fan into
each other (garage 22–99, kitchen 79–157, bedroom 130–219 …). `elementFromPoint` at KITCHEN's
right half returns the BEDROOM button, and its top-left corner returns GARAGE — the kitchen's honest
tap zone is a ~36 px strip. Scenario: first phone visit, thumb taps KITCHEN, a menu for a room they
didn't pick unfolds over the geometry. The freeform lane tested 1280×633 only and called the a11y
walk clean; the walk IS clean — at exactly one window size.

### 5. The Tab path descends the house OUT OF ORDER, and open panels toll thirty stops.

The window nav is built by iterating `CAMPAIGN` (`src/pages/house.ts`, `for (const room of CAMPAIGN)`) — kitchen, bedroom, bathroom, garden, GARAGE, porch — while the crane's own descent order is `ROOM_IDS` (garage first), so the keyboard/reader walk visits garage (visually the FIRST room, top-left) fifth, mid-descent
— scenario: a screen-reader user hears the tour of the house starting in the middle of the sky. The
freeform verdict's own tab walk "named every window" without once checking the ORDER — mine records it.
Worse, opening the LINES corner inserts its 30 published-line links into the tab path BEFORE
Release, and Escape does not close the panel (verified: `aria-expanded` stays `true` after Escape) —
scenario: a keyboard player opens Lines, changes their mind, tabs for Release, and walks the entire
community board first. Not a focus trap; worse, a focus TAX the closed-panel tab walk could never see.

### 6. The door's own tape contradicts itself, and its second showing is unacknowledged.

After any run, `#gw-house-status` keeps the LAST-APPROVAL timestamp — **"4 rooms · 3.7 s"** — printed
directly above `#gw-house-result`'s **"4 rooms · 6.7 s — you stopped at the bathroom"**. Two numbers,
both `role=status`, one run: 3.7 is when the car ENTERED the last room, 6.7 when it stopped; the
status line is never finalized (`src/pages/house.ts` writes it per approval tick, the result writes
the terminal time). And the second Release — THE DOWNHILL being one tape forever — changes nothing
on screen, no "same film" note, no variation; the verdict's "the door is a film until you walk into
a sandbox" conceded the fact but never noticed the film's own timecode is wrong while it plays.
Scenario: the 2 a.m. question at the new door — a player tells a friend "4 rooms, six-point-seven"
and shows them a screen whose own status line says 3.7.

### 7. From the door, "free" is TWO hops away, and the door's run cannot leave the device.

The six windows link rungs only; the only `sandbox` hit in `src/pages/house.ts` is a comment — zero sandbox links; the free-build
sandboxes live behind **All levels** → board → row: the verdict said the free in "free-form" lives
"one click off the door"; from the bare route it is two, and via a surface the program demoted.
Meanwhile the downhill run prints a real receipt (`6caea49b`, verified again in this lane across two
releases) and has NO share path — `src/pages/house.ts` has no share surface at all; the honest tape
of THE PITCH is the only run in the game that cannot travel. Scenario: "look what the whole house
does" → there is no link to send; what travels are the thirty rung rows the house was supposed to
replace at the front of the mind.

### 8. The game judges free play kindly — and proves the door is where the judging CAN'T happen.

The sandbox failure face (fresh save, kitchen-sandbox, 0 edits, Launch): **"fell off — the line let
go before the cup; add a straight, a drop, a lip or a landing"** — named cause, named verbs, zero
stars, no scold. That is the warmest sentence in the game and it answers the kindness question: YES,
the game is gentle where play is free. The seam is that the FRONT DOOR has no failure surface at all
— one deterministic tape means the door can't lose, can't coach, can't vary; the house-era front
page is the one screen where the game's best trait (kind, specific feedback) is structurally absent.
Small tell on the same page: a sandbox FAILURE's result bar still offers "Next level" — the rung
chrome worn where there are no rungs.

## What the surfaces smelled good on (the honest other column)

Boots at 108 ms; one press → four physics-approved rooms, receipt stable across releases, exactly as
the program promised; the kitchen window unfolds a real tour list IN PLACE with a lock honestly worn
(`05-window-open.png`); the LINES empty state for a fresh save says "no links walked yet — publish
one, or race one" above thirty house-published rows and never fakes a feed (`06-lines-fresh.png`);
the sill-star grammar is READABLE once earned (★ 15/15 under each label, aria mirrors it —
`09-veteran-sills.png`) — it is only the never-earned sill (a bare rule line) that reads decorative;
and the porch05 farewell still lands — "and that is the house," 90/90, three doors, crane pass
(`10-farewell-crane.png`) — the promise the door inherited, kept.

## Cheapest points up

Mount the SOUND block for the home route (the wiring exists; move it above the routing fork); raise
the wordmark out of the compact rule's crossfire at `max-height ≤ 700px` — three lines of CSS; put
one `/` anchor somewhere ("the house" as the nav's first crumb, every page); finalize the status line
with the result line; reorder the window nav to descent order; give the downhill receipt a share
link — it is the game's own trailer and it can't leave the laptop.

### What the program's close note refuses to see

It prices "below 9" entirely in pixels and gen-pars drift — but the seams it won't name are MOVING
damage, not paint: the swap relocated the front door out of `bootGame` and left the sound engine,
the nameplate legibility, the back door, and the share verb behind on the old front end, and every
one stays invisible because no test ever boots the bare route — the suite proves the rooms and never
the doorway.
