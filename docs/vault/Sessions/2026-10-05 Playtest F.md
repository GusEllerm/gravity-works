---
livedocs: snapshot
---
# Playtest F — 2026-10-05 (stranger, fresh browser)

## 1. Levels finished
- **"Book Drop" (L1): cleared on my ~12th launch** — build `gapLip → drop → landing`, 2.23 s, ★★★. Eleven earlier launches: all "fell off the set", ~2.0–2.9 s.
- **"Two Ways" (L2): reached via "Next level" after a fail, never cleared.** Patience gone; I went back and brute-forced L1.

## 2. Pieces placed
Early: `drop` alone; `landing` alone; `drop + gapLip`; rotated `gapLip`. Middle: `drop + booster`; `drop + landing`. Win: the whole ×1 tray in tray order — `gapLip`, `drop`, `landing`.

## 3. Best moment
The win frame: cream kitchen diorama from above, long brown ramp cutting across the table, tiny red car at its crest, book stack, cereal bowl, coffee mug by the sink; at the right edge my three pieces form one clean dive — lip → dark drop → an upturned landing plank pointing at nothing. Whole puzzle in one glance. Mid-run frames are just beige blur.

## 4. Stuck / guessed
Stuck on **where placement happens**: every canvas click produced the identical build, "target" never moved. I guessed aiming was positional — clicks near the gap, five coordinates, with rotation — all no-ops. Finally discovered (via page internals) **arrows cycle target, Enter places**; progress was fast after that.

## 5. Couldn't interpret
- **Hash across different builds**: 1-piece and 2-piece fails both `2.03s — hash 2c1c8426`; 0-piece and 1-piece runs both `hash 8eee5a0c`. It fingerprints the outcome, not the build.
- `par 2.25 s` beside a 2.03 s failed run — what does beating it mean when you can't finish?
- "out of budget" (3/3) while tray counts say the same — two counters for one thing.
- Bare "target:" with nothing held.

## 6. Broken / misleading
- **Canvas clicks look like aiming; they don't** (auto-target only); the "drag or arrows · Place: Enter · Rotate: R" hint hides until a piece is held.
- First load: **black screen for seconds**, no message; on one visit only the title rendered, no scene.
- **Help** = collapsed word-button at page bottom; rulebook invisible early on.
- Camera often faces beige blur mid-run — car off-screen in most launches.
- "Next level" silently skips a failed level at 0 stars.

## 7. Send to a friend?
Yes — the win shot: **"12 tries to solve level 1 — it took exactly the 3 pieces I was given, and the last one was a coin-toss that stuck ★★★"**. Fail frames aren't shareable; only the win frame is.
