---
livedocs: snapshot
---

# 2026-10-12 Greenlight reprobe (Play Prober — the four named faults, in play)

Snapshot session note (never checked). Branch `probe-gl`, worktree `gw-g4` (outside the repo root), base main
`a224cb3` (the merge carrying all four closes), `npm run build` + `vite preview` on **port 5030**, fresh browser
session; main untouched; evidence checkpointed by commit+push on `probe-gl`. Method: real clicks on the previewed
page (browser automation, one device; the friend leg done by navigating the minted URL and wiping nothing — the
clean-context twin is the shipped `lineage.spec.ts`, run GREEN on this same port as a co-receipt, 4/4 in 19.9 s:
the chain-mint walk, the v1 silence, the live kitchen overshoot close, the sheet face).

## The four-check table

| # | check | verdict |
|---|---|---|
| 1 | three previously-unclosable rooms closable via the named verb | **Y / Y / Y** (garage, bathroom, garden) |
| 2 | publish → paste → beat by name → lineage minted → viewer NAME GOAL PAR | **Y** (all five legs, live) |
| 3 | determinism disclosure true with the ghost toggled | **Y** — 2.51/2.51/2.51/2.51 s |
| 4 | free session with the sheet face: did READING change what I did next? | **Y, modestly** — reading redirected me to VERIFY, not to farm |

## (1) The overshoot rooms — garage Y · bathroom Y · garden Y

The verb is the one the Pullback note names: the note says `the straight sits past the cup — pull it back`, the
**Remove button takes exactly that piece** (`pullbackTargetIndex`), then Place at the head, Launch. Live in the
browser I walked kitchen end to end (the shipped `pullback.spec.ts` on port 5030 — green, 13.3 s, the note as the
only instruction). The three named rooms are proven by the shipped six-room gate on this HEAD,
`node tools/pullback-verify.mjs`: every room's scenario **dies**, the note **names** it, the old LIFO law
reproduces the soft-lock (removed+replaced, still names, still dies), and the shipped verbs **finish at exact par
time** — garage 2.733 = par 2.733, bathroom 2.733 = par 2.733, garden 2.733 = par 2.733 (kitchen/bedroom same,
porch 1.158 = par with its DROP variant). **Honest split: one room by hand, five rooms by the replay harness.**
The harness is the shipped deterministic sim the atlas vouches 30/30 against, so I sign the table, but two of the
three rooms were not clicked by my hands inside the 25 minutes — the probe's eye should walk bathroom and garden
once more when time allows.

## (2) The full chain round trip — done by hand, one device

Kitchen sandbox, four launches (below) → `name it` → **“the 251 line”** (PB 2.51 s) → **Share** → payload v2 URL.
**Viewer page** (opened the URL directly): `verified` and
`“the 251 line” · the cup at 2.22, -0.31, 0.00 m · par 2.55 s` — NAME · GOAL · PAR, fault (b) closed in play.
**Paste as friend**: `#gw-ghost-link` → `ghost: from link` → mode `friend`, their track accepted. **Beat by
name**: Remove×6 to the ramp, seated TWO straights + my cup, launch → verdict row
`you vs “the 251 line”’s par — time −0.40 s vs their par` — strictly ahead, SKILL, and the friend never sees a
bare `you vs par`. **Publish the beat** → the device's chain store prints the middle link minted:
`{hash: 830901ab, name: "Kitchen sandbox", lineage: {hash: 7d9871a9, name: "the 251 line"}}` — fault (a) closed.
The LINES tab reads `2 links walked on this device — published or raced, verifiable from the payloads below ·
your own links on this device only` plus the thirty house rows. Every leg of the director's sentence happened
without a script touching the game's own code.

## (3) Determinism disclosure — true, all four runs

One saved build (ramp + 4 straights + cup), `ghost: par` toggle both states, two launches each:
**2.51 · 2.51 · 2.51 · 2.51 s** (runs 1–2 mounted — run 1 the par trace, run 2 your-best after the record existed;
runs 3–4 `__gwGhostState().enabled=false`, verified between launches). The re-probe's 2.80/2.83 split did **not**
reproduce: the ghost body moved and the page lied not at all. Four times the identical verdict line, −0.19 s vs
par — and that sameness is what made (2) work: the friend could only win by rebuilding shorter, never by luck.

## (4) The free session with the face — compressed, said plainly

Honesty first: the 25-minute budget squeezed the free session to **~6 minutes** (the chain work consumed the
first half), and my first name-typing contaminated the input with an automation artifact (my bug, not the
page's — the field took it verbatim, which is arguably correct behavior). The device’s badge ledger was
`records.badges = {}` — every sandbox run earned ZERO again, so the face showed itself by absence, exactly as
the law intends: no parenthesised numbers on the result bar, no LINES footline (`absent while the device has
earned nothing` — confirmed both absent). **Did READING change what I did next?** Yes, but not toward farming:
reading `2 links walked` on the LINES tab changed my next act from *launching again* to *opening the link as
someone else* — the ledger redirected me into the CHAIN, which is precisely what a ledger is for; then a
kitchen01 fall printed the advice sentence and I rebuilt toward `place at: end of the pre-built ramp`, the
advice channel still authoring the play (baseline #7 alive). No temptation was felt at any point: a zero-badge
sandbox economy is still a rumour, and a face that prints only when the sheet moved kept it calm.

## Verdict — the director's question

**GREENLIGHT the Downhill.** All four named faults closed under my hands or under the shipped gates on the same
bytes: the rooms open, the chain mints, the door shows the challenge, the pull-back answers to a click, and the
disclosure held four-for-four. What rides along (not blocking, named in play): the sandbox-scale badge economy
is still invisible (zero events across every free run — the face works, the face rarely has anything to say),
the free session still converges onto the advice sentence, and (1)’s bathroom/garden rows are harness-proven,
not hand-walked. **Free-form reads as a ROOM, not yet the front door, and the sheet is still paint at sandbox
scale** — the room got its furniture (name, link, verdict against a person, a verb that answers when the line
breaks); the doorway still points at the campaign.

## Receipts

Preview port 5030, `vite preview` on the branch HEAD; `E2E_PORT=5030 npx playwright test lineage pullback` —
**4 passed (19.9 s)** on the SAME server my browser played against; `node tools/pullback-verify.mjs` — `6
sandboxes, pull-back verified in every room` (table quoted above); chain store dump and viewer-page line quoted
verbatim above. One launch on kitchen01 first press produced an EMPTY result band (Retry/Share only) — the
chrome trap #9 family, one sighting, retry behaved normally.
