---
livedocs: snapshot
tags: [reference, evaluation, player]
---
# Evaluation 2026-10-09 — the player lens (fresh-eyes, external)

> [!abstract] Method
> Read PROMPT.md (the brief) cold, then played the shipped build (same tree as main at 50102b3) via
> npm run build and vite preview on localhost, driven by a real browser. Two sessions: one fresh
> cold visit for the first-60-seconds test, one long session that played thirteen rungs spread over
> all six rooms — mostly honest tray-order placement with the game's own failure notes as the only
> teacher, sometimes with the level-select (noted per rung; the dev preview badge was honest about
> unlocks). Where progress-unlocked play would differ from dev-select play, it is stated. No code
> read before the walk; the tray grep came after, to confirm what play had already shown.

## VERDICT — 4 / 10 against the brief's own bar

Against the repo's gates this thing is a 9: deterministic, 60 fps, honest share, real fail-timing.
Against the brief — a toy-track game you'd finish at 2am and send to someone — it is a 4. The
engineering half of the promise is met and the documentation is unusually honest about the rest. The
game itself is a thirty-rung corridor in which five verbs are performed twenty-five times, the kit's
other eight pieces never once earn their tray slot, the hazards are scenery, and the rooms are
wallpaper. Nothing I felt in thirteen rungs resembles "a game you finish at 2am": median rung took me
forty seconds, the first run ends in 2.2 seconds, and the campaign ends with a Retry button and no
word. The share flow is an engineering miracle that opens on a blurry static frame and asks the
viewer to press Play and read a hash policy.

## The first 60 seconds of a brand-new visitor (fresh browser, cold land, measured)

- t+0s: no title screen, no menu, no premise. The page IS the kitchen01 builder — a beige HTML
  document: h1 "Gravity Works", an "All levels" link, thirteen tray buttons (ten greyed), a row of
  plain buttons, legalistic small print, "0 of 3 pieces used", "target: end of the pre-built ramp",
  then "the ring is where it will land" rendered as a giant heading. Type is the system font
  everywhere — the brief demanded a display face with personality; the page is Bootstrap-default
  energy. At the default laptop window the world renders in a card roughly 450 by 255 pixels; the
  car is a few pixels tall and the kitchen reads as a tan disc with grey corner wedges — closer to
  a broken texture than to a monumental breakfast table. Tilt-shift post is OFF by default, so the
  signature look the art bible sells is not what a first-time visitor ever sees.
- t+10s: clicking a tray piece is genuinely good — the Place button renames itself to the socket
  and the panel says "fits here". First drop placed.
- t+30s: tray placed, Launch clicked. The run is 2.2 seconds of a tiny red dot crossing a plate.
  The camera does lead the car, which is the best part of the minute.
- t+55s: the result panel — a brown rectangle over the world: ★★★, "2.23 s — par 2.25 ✓",
  Retry / Next level / Share this run. First-finish beat: a checkmark. No chime visible in the
  stills, no flourish, no one-line celebration.

Friction was near zero — and that is the finding: the first minute asks nothing, explains nothing,
and shows almost nothing. A visitor is five honest clicks from three stars before they know what
kind of game this is.

## The 30-rung walk — thirteen played, all six rooms

(id | how reached | result | what it actually asked of me)

- kitchen01 | cold, honest unlock chain | ★★★, first try, ~90s | nothing. Place tray, launch.
- kitchen02 | dev-select | ★★★ finish with 3 of 4 tray pieces placed; the 4-piece dump also finishes per the studio's own 12-of-12 enumeration | the advertised CHOICE never bites: dumping the union of both lines finishes, so no decision was ever mine to make.
- kitchen03 | dev-select | attempt 1: bridged with 4 of 5 — fell at 1.56s with "fell off nose-first — add a flat landing or lower the lip · place at: end of lip"; attempt 2 placed the landing → ★★☆ | the BEST failure teaching in the game — and the reason the rung works is the tray forces one honest iteration. The cereal bowl — the hero set's signature affordance, the thing stage-3 acceptance said playtesters must NAME — is a prop the finished line flies past; I never built around it. The vault admits the bowl line is BLOCKED; play confirms it: the brief's flagship affordance is furniture.
- kitchen04 | dev-select | 3 confirmed launches, several minutes, NOT cleared in the walk. Attempt A (tray dump) died at 2.23s "the line let go before the cup; add a straight, a drop or a landing · place at: end of lip" — with the tray empty and every piece already down. The advice then goes mute-by-generic: nothing to ADD; the problem is MOVE, and the game's vocabulary has no word for it. One placement did get excellent help ("blocked — the tap is in the way · press ] to walk the open ends"). The vault claims all 24 whole-tray ORDERS finish; via the shipped default-aim chain two whole-tray attempts fell — the invariance is a property of their seat-exact test builds, not of what the shipped Place button can reach. This is the vault's open "orphan-past-goal" item, and I walked into it naturally at rung 4, as the brief's own first real puzzle would present it to a first-time player.
- kitchen05 | dev-select | two full attempts, NOT cleared. Booster LAST → fell at 2.52s ("the line let go before the cup"). Rebuilt with the booster FIRST as the callout says ("speed saved for later overshoots") → fell at the SAME 2.52s with the same note. A copy fix ("say EARLY") was shipped over the wall playtest Q hit, and the wall stands: the advice names a sequencing the default-aim chain cannot express.
- bedroom01 | dev-select | ★★☆ 2.38 vs par 2.35 | the cable is crossed by placing the tray. "Ride over, don't fly" is a law the rung cannot make me break.
- bathroom01 | dev-select | ★★★ 2.23 | the grip-halved wet patch is on the par line and finishes bit-identical wet or dry — the studio says so proudly; as an experience it means the room's entire physics LESSON has zero decision content. The drain is a hole I fly.
- bathroom03 | dev-select | attempt 1 launched early — fell with "add a drop or a landing · place at: end of lip"; placed the drop → ★★★ | good fail-timing again. The advertised TRADE-OFF (splash route vs high line) is unbuyable from the tray — one road.
- garden03 | dev-select | ★★☆ | sprinkler "shortcut" again unbuyable; I flew the sprawl; I never once saw the sprinkler fire in any garden run — the brief's "timed arcs of water" is a permanently wet patch in shipped play.
- garden05 encore | dev-select | ★☆☆, finished by dumping the tray | the encore family is ONE authored rail replicated into four rooms (the vault says so: "the encore family's shared rail"); rung 30 of the campaign, I placed the same six pieces on the same double-dip I'd seen in three other color schemes.
- garage01 | dev-select | ★★★ 2.23 | rung-1 grammar in an apron. The oil stain: I ran over it and finished; it is a decal.
- porch01 | dev-select | ★★★ 1.06 | rung-1 grammar with a doormat.
- porch05 (finale) | dev-select | ★★☆ 1.48 vs par 1.20 | the "finale" is a four-piece tray dump. The result bar: Retry and Share. No finale text, no credits, no last look at the house. The campaign ends on a share button.

Where honest progress-unlocked play would differ from my dev-select walk: the unlock gate is one star on the previous rung — a floor so low it adds no friction and no triumph; nothing about the campaign would have changed my walls (k04/k05 are content walls, not access walls).

### Drag, sameness, and the mechanic count

- Distinct kit pieces the thirty campaign trays ever make me place: **five** — straight, gap lip, drop, landing, and (six rungs only) the booster. Confirmed by grep after play, exactly as play predicted. The brief's "start with: straight, curve (two radii), S-bend, bank, loop, drop, ramp, gap lip, landing, booster, spring, cup" is a thirteen-piece kit of which the campaign needs 5. **Loop, bank, curve, S-bend and spring appear in ZERO campaign trays** — the studio's proudest physics result, the 2.30-R loop threshold, is exercised by no level a player can reach. Per-room mechanic count: identical, five, six rooms running.
- The sameness is structural: five of six rooms' rung 01 is lip-drop-landing (identical tray), four rooms' rung 05 is one shared rail, and the rooms' own signature affordances (bowl bank, bathtub bowl, bookshelf descent, hose half-pipe, vise gap, gutter flume) never do structural work — every finished line I built is the same four verbs on ramps and gaps.
- A rung that teaches nothing: every encore 05 except its first appearance, and the porch rungs after porch03. Bedroom01's lesson ("ride, don't fly") cannot be failed; bathroom01's lesson (grip halves) cannot be felt on the only reachable line.

### The emotional beats vs what the brief promised

- First finish: a checkmark row, ~2 minutes in, at 1280 window a game the size of a notepad. "You'd think about the physics" — I thought about the font.
- First share: the machinery is excellent — link carries a real payload, opens into the film, "verified on this machine" with an honest cross-machine caveat. The experience: the share page opens PAUSED at the final frame, which is a defocused grey blur of nobody's porch; a wall of hash-policy prose sits above a beige "Watch this run" heading; the visitor must press Play to discover there was a run. A playtester is on record describing a replay as something they'd send to a friend; what a friend sees first is the blur and the legal text.
- Replay-worth: the par-clock star is the only reason to replay, and the times are so generous that my casual chain-placements beat par TIME on most rungs while losing the pieces star by dumping the tray. The star design rewards the exact behavior (dump everything) that makes the rungs feel identical.
- The porch finale: no rain (the brief's storm porch, deferred on treatment — visible in every porch screenshot: a dry porch), gusts never felt, and the ending beat is the absence of a Next button.

### Depth ceiling — the twenty minutes after the ladder

- The sandbox is where the game actually lives: loops place, loops RUN (I drove one end to end in kitchen-sandbox), everything is ×99, the failure notes keep working. It is also hidden — no campaign screen links a sandbox, and the level select does not list them; the studio's own playtesters never found one. A player who finishes the corridor and never typed a URL never learns loop physics exists.
- Sound: on by default, mute and volume present — and by the vault's own admission, instrument-verified and never ear-verified; in a browser at default volume it is not a reason to stay.
- After the ladder: sandbox (off-path), par-time grinding (thin), share-clip trading (the film's first impression is a blur). Twenty minutes of post-campaign motivation exists only if the player is handed a sandbox URL. The game is a linear corridor with furniture, and the furniture has doors in it the campaign never points at.

## The brutal list (each: a player, a feeling, a cause)

1. A first-timer at t+0 feels they opened a debug harness, because the landing state is an unexplained builder at 450×255 in system-font beige, and the tilt-shift look that IS the pitch is off by default.
2. A player at rung 8 (bedroom01) feels déjà vu because rung 8 is rung 1 with different wallpaper; the rooms' signature affordances do structural work in the vault, not in the run; and the porch rungs after the first repeat the gap grammar with a doormat.
3. A player at rung 2 (Two Ways) feels nothing while making a "choice" they cannot not-make, because dumping the union of both lines finishes every way.
4. A player at rung 4 (The Tap) feels stuck across launch after launch because the failure note only knows how to say ADD when the tray is empty and the truth is MOVE — the studio's open orphan-past-goal item, reachable inside the first ten minutes of honest play.
5. A player at rung 5 (Sunday Run) feels the game is lying because the callout says spend the booster early, they place it early, and the SAME 2.52-second death returns — advice that names a sequencing the default-aim Place button cannot express.
6. A player at rung 26 feels rung-1 grammar again because porch01's tray is the tutorial's tray.
7. A player reaching the end feels nothing because the campaign's final state is a two-star bar with Retry and Share — no farewell, no summary of the thirty rungs, no view of the whole house.
8. A share-recipient at second zero feels confused: a paused blurred frame, a heading called "How this link verifies", and a hash essay before the 2.4 seconds of actual car.
9. A completionist at hour one feels cheated because the loop, the bank, the spring and the S-bend — every piece that would make hour two — exist only in sandboxes the campaign never mentions.
10. The studio's own acceptance memory overrates the beats: "three playtesters name the bowl turn as a moment they liked" was true of a slice the shipped campaign routes players PAST the bowl; the ladder is honest in its BLOCKED tables and the experience report never re-read them from the couch.

## What is genuinely good (so nobody accuses me of only reading the smoke alarms)

The fail-timing law, when the failure is a missing piece, is the best failure-advice UX I have encountered in a puzzle game: named symptom, named fix, named socket, on screen in a second and a half. The Place button that names its socket, the dev-preview badge, the honest verified-on-two-machines wording, determinism that survives my abuse — the craftsmanship is real. The run camera leading the car is the only moment per rung where the toy table looks alive. These are the parts to keep, and they are also the template for the fix: everything the game does when it tells the truth about a failure, it should do when it shows itself.
