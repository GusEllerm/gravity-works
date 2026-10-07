---
livedocs: snapshot
---

# Playtest W round5 — fresh-eyes stranger, browser only

## 1. How far, in order
Kitchen → level 1 "Book Drop" only. Never earned a star; never left room 1. Tries:
1. Launch, 0 pieces: `fell off — the line let go before the cup`, 2.04 s.
2. Placed Drop at the ring. Launch: `fell off nose-first — flatten the landing or lower the lip`, 2.14 s.
3. Placed Lip (auto-snapped onto the Drop), Landing flipped (R) at end of lip. Launch: same nose-first line, 2.30 s.
4. Remove-piece, tried to re-place Landing by clicking the world — click silently did NOT place. Launch with only Drop+Lip: same nose-first line again, 2.27 s. Hit wall.

## 2. Did the game lie
Yes, three times:
- Fail text "before the cup" and "lower the lip" / "flatten the landing" appeared on builds with NO Cup (greyed out), NO Lip, and eventually NO Landing placed at all. Try 4 gave landing advice with zero landings.
- `target:` flipped between "end of ramp" and "cup on the table" between idle and hover, so I never knew what I was solving.
- Status said `fits here` while the green ghost sat ~2 m from my cursor; my last "placement" click was accepted (button highlighted, `target: end of lip`) yet `3 of 3` never happened — the card counted 2 pieces.

## 3. Camera
One right-drag (~150 px) blacked the ENTIRE tab (screenshot fully black, no console errors, then about:blank). Reload recovered; build persisted. After that Esc-Esc did return home from run-follow view. In angled views the green ghost frequently did not match where I clicked — hovering the ramp nose it still snapped to `end of drop`.

## 4. Best moment (picture)
The run flyover: camera diving beside the marble as it punches through the white ring off the ramp — arcade-clean, screenshot `screenshot-1791359263256.png`.

## 5. Where stuck / what I tried
Stuck on nose-first falls. Tried: 0/1/3-piece builds, R-flip of Landing, remove-and-replace, hovering every snap point, arrow-key hint text. Nothing distinguished which end the ball would leave.

## 6. Uninterpretable words
"the line let go before the cup" (which line? which cup — Cup was greyed), "a cold car's engine", "it rides backwards; fine for a coaster, not for a launch" — charming, but gave zero actionable delta.

## 7. Failures with no visible cause
The black-screen tab death mid-drag (empty console). The silently swallowed placement click. Why nose-first keeps happening when the ring preview says the landing point is on the catcher.

## 8. Friend moment
Friend watches the marble sail perfectly through the ring, then politely drive its nose into a plank and tumble off the table.
Caption: "Great flight. Terrible handwriting."
