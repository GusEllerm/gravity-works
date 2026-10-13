/**
 * THE PAR/RECORD/LINK GHOST WIRING (program H4, Lane F3 — extracted verbatim
 * from `src/boot.ts`; behavior untouched): the lazy par wind, the named
 * line's RECORD ghost, the pasted-link and chain-row RACES, and the house
 * line (the `?line=`/`?link=` address family, LINES-tab rows and the ghost
 * bar's toggle). `src/pages/ghost.ts` owns the rail itself (the translucent
 * rig, the seating, the sync); this module owns WHO gets wound WHEN — the
 * scheduling and the chain bookkeeping that used to live inside the
 * `bootGame` closure. VISUALS ONLY, as ever: nothing here steps physics,
 * owns a body, or moves a hash (the coupling line in the frame loop stays
 * the shell's single `ghost.sync` call — the referee specs guard it there).
 */
import * as THREE from 'three';
import type { Build } from '../track/build.ts';
import { deserialize, fixtureQuota } from '../track/build.ts';
import { PIECES } from '../track/pieces.ts';
import type { PieceKind } from '../track/pieces.ts';
import type { Level } from '../world/level.ts';
import type { World } from '../world/world.ts';
import { parFor } from '../world/stars.ts';
import { cachedGhostTrace, type GhostBar, type GhostRace } from './ghost.ts';
import { parseShareUrl, type SharePayload } from '../share/share.ts';
import { chainLinkPayload, findChainLink, rememberLink } from '../share/chain.ts';
import { lineAnchorKey, readNamedLine } from '../save/records.ts';
import { loadSave, saveSave } from '../save/save.ts';

/** The raced link's verdict-facing facts (Lane C): the VERDICT ROW reads
 *  the LINK's par, never this page's, and the lineage claims read the
 *  acceptance, not the rail's momentary visibility. */
export interface RacedLink { levelId: string; hash: string | null; name?: string; par?: number; time: number }

export interface LinkRaceContext {
  level: Level;
  params: URLSearchParams;
  /** the live world (null before the first `World.create` resolves). */
  world: () => World | null;
  /** the live build (the line's identity is read off ITS player cup). */
  currentBuild: () => Build;
  /** Mount a build through the shell's ordinary `rebuild` line. */
  rebuild: (build: Build) => Promise<void>;
  /** true on a sandbox rung (the named-line surface). */
  isSandbox: () => boolean;
  ghost: GhostRace;
  ghostBar: GhostBar;
  ghostOn: () => boolean;
  setGhostOn: (on: boolean) => void;
  /** THE GHOST LAW's lock (rung not yet earned). */
  parLocked: () => boolean;
  setParLocked: (locked: boolean) => void;
}

export interface LinkRace {
  /** The par trace is WANTED — nothing winds while nobody could see. */
  armParGhost(): void;
  /** Wind the par line NOW. */
  ensureParGhost(): void;
  /** true when the live par wind is turning (the record-fallback gate). */
  readonly parWinding: boolean;
  /** true when the par trace is armed but not yet wound. */
  readonly parArmed: boolean;
  /** Mount the RECORD ghost (your best run on this named line). */
  ensureRecordGhost(): boolean;
  /** The ghost bar's toggle, with the ghost law and the save write. */
  togglePar(on: boolean): void;
  /** Paste-a-link race (the bar's `race` button). */
  raceFriendLink(url: string): Promise<void>;
  /** `?line=house` — race the level's own par build as a LINK. */
  startHouseLinkRace(): void;
  /** `?link=<hash>` — dispatch after the first world mounts. */
  dispatchChainLink(): void;
  /** The world-space capture centre of a build's PLAYER-placed cup. */
  playerCupAnchorFor(build: Build): THREE.Vector3 | null;
  /** The named line the CURRENT build sits on (null off-sandbox). */
  lineGhostKey(): string | null;
  /** The line-key the CURRENT build re-anchors (the mint's identity). */
  lineKey(build: Build): string | null;
  /** The link accepted for the LAST race (verdict/lineage read this). */
  readonly racedLink: RacedLink | null;
  /** A build mounted from a FOREIGN board marks the board foreign. */
  readonly foreignBoard: string | null;
}

export function createLinkRace(ctx: LinkRaceContext): LinkRace {
  const { level, params, ghost, ghostBar } = ctx;
  let parArmed = false;
  let parWinding = false;
  let racedLink: RacedLink | null = null;
  let foreignBoard: string | null = null;

  /** The world-space capture centre of the build's PLAYER-placed cup (the
   *  `finishCup` occurrences past the fixture quota — and exactly the cup
   *  `World` reified as THE capture volume, since a later piece wins).
   *  Null when the build holds no player cup: an ordinary rung, or a
   *  sandbox whose cup is the fixture's. */
  function playerCupAnchorFor(build: Build): THREE.Vector3 | null {
    const kl = level as unknown as { fixtures?: Partial<Record<PieceKind, number>> };
    const isFixture = fixtureQuota(kl.fixtures ?? {});
    let anchor: THREE.Vector3 | null = null;
    for (const p of build.pieces) {
      const fixture = isFixture(p.def);
      if (p.def === 'finishCup' && !fixture) {
        const cv = PIECES.finishCup.captureVolume!(p.params);
        anchor = new THREE.Vector3(cv.center.x, cv.center.y, cv.center.z).applyMatrix4(p.transform);
      }
    }
    return anchor;
  }

  /** The named line the CURRENT build sits on (the cup seat is the line's
   *  identity — same seat, same line, whoever rebuilt the decks). */
  function lineGhostKey(): string | null {
    if (!ctx.isSandbox()) return null;
    const cup = playerCupAnchorFor(ctx.currentBuild());
    return cup ? lineAnchorKey(level.id, cup) : null;
  }

  /** The mint's identity for a build (the tail's `lineAnchorKey` read). */
  function lineKey(build: Build): string | null {
    const cup = playerCupAnchorFor(build);
    return cup ? lineAnchorKey(level.id, cup) : null;
  }

  /** The rung's par trace is WANTED (armed at level-load and when a friend
   *  ghost is lifted) — nothing winds while nobody could see the car. */
  function armParGhost(): void {
    if (!ctx.ghostOn()) return;
    parArmed = true;
  }
  /** Wind the par line NOW (the ghost is about to show). A rung with no
   *  `parBuild` (a bespoke rig) says so on the bar rather than silently
   *  showing nothing. */
  function ensureParGhost(): void {
    if (!ctx.ghostOn() || parWinding || ghost.ghostMode === 'friend') return;
    parArmed = false;
    const parBuild = (level as unknown as { parBuild?: () => Build }).parBuild;
    if (!parBuild) {
      ghostBar.setNote('this rig has no par line to race');
      return;
    }
    parWinding = true;
    ghost.setWinding(true);
    ghostBar.setNote('winding the par line…');
    void cachedGhostTrace(level, parBuild()).then(
      (trace) => {
        parWinding = false;
        ghost.setWinding(false);
        // a friend ghost that won the race to mount keeps the grid — the
        // par wind must not silently evict the link the player asked for
        // — and the same law covers a NAMED LINE's record ghost (Lane B):
        // a line mounted during this wind outranks the par line on it.
        if (ghost.ghostMode === 'friend' || ghost.ghostMode === 'record') return;
        ghost.setTrace('par', trace);
        ghostBar.clearNote();
        window.dispatchEvent(new CustomEvent('gw-ghost-ready', { detail: { mode: 'par' } }));
        const w = ctx.world();
        if (w) {
          if (w.status !== 'idle') ghost.resumeRace(); // wound mid-run
          ghost.sync(w.time);
        }
      },
      () => {
        parWinding = false;
        ghost.setWinding(false);
        ghostBar.setNote('the par line could not be wound on this machine');
      },
    );
  }

  /** THE SHARE LINK IS A GHOST (G2): decode with the shipped parser, mount
   *  their build as the track through the ordinary `rebuild` line, and wind
   *  THEIR car from it. Every refusal lands a sentence on the bar, never a
   *  silent no-op — a link that is not a run, and a build that will not
   *  mount, say different true things.
   *
   *  THE CHAIN (Lane C) adds the honest bookkeeping behind the race: the
   *  payload being raced is remembered (its name, its par, its finish —
   *  the VERDICT ROW reads the LINK's par, never this page's, so the
   *  re-probe's wrong-game `you vs par` cannot print), a build mounted
   *  from a FOREIGN board marks the board foreign (no par verdict is
   *  honest across boards, with the ghost up or down), and the accepted
   *  link enters the device's chain walk (`rememberLink` — payloads only).
   *  A house line from the LINES tab (`?line=house`) rides the same
   *  machinery on the level's own par build — one click, no paste, the
   *  link is the par build's bytes and the shipped par.
   *  THE GHOST LAW does not lock either: an explicit ask, never a spoiler
   *  budget (round 2's law, extended to the tab's rows). */
  async function raceFriendLink(url: string): Promise<void> {
    if (!url) {
      ghostBar.setNote('paste a share link first');
      return;
    }
    let payload: SharePayload;
    try {
      payload = await parseShareUrl(url);
    } catch {
      ghost.setTrace('off', null);
      racedLink = null;
      ghostBar.setNote('that link is not a run — nothing to race');
      return;
    }
    await racePayload(payload);
  }
  /** Mount and race a decoded payload (a pasted link or a chain row — one
   *  race path, the same honest refusals). */
  async function racePayload(payload: SharePayload): Promise<void> {
    ghostBar.setNote('mounting their track…');
    try {
      await ctx.rebuild(payload.build);
    } catch {
      ghost.setTrace('off', null);
      racedLink = null;
      ghostBar.setNote("their build refuses to mount on this rung — it stays their run, not your track");
      return;
    }
    foreignBoard = payload.levelId === level.id ? foreignBoard : payload.levelId;
    try {
      const trace = await cachedGhostTrace(level, payload.build);
      // THE GHOST LAW does not lock a pasted link (round 2): an explicit ask
      // shows THEIR car even on an unearned rung or with the rail off — the
      // par spoiler is the only thing the law gates.
      ghost.setEnabled(true);
      ghost.setTrace('friend', trace);
      racedLink = {
        levelId: payload.levelId,
        hash: payload.hash,
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.par !== undefined ? { par: payload.par } : {}),
        time: trace.time,
      };
      // THE CHAIN WALK: a link this device raced is a link it walked —
      // the payload enters the store the LINES tab reads (payloads only,
      // deduped by hash; no hash, no physics, nothing stepped).
      rememberLink(payload);
      const world = ctx.world();
      if (world && world.status !== 'idle') ghost.resumeRace();
      ghostBar.setNote(
        payload.levelId === level.id
          ? 'their car is on the grid — launch to race it'
          : `their link is from ${payload.levelId} — their car ghosts HERE`,
      );
    } catch {
      ghost.setTrace('off', null);
      racedLink = null;
      ghostBar.setNote('their track mounted, but their car would not wind — launch it yourself');
    }
  }
  /** THE HOUSE LINE (LINES tab's click, `?line=house`): race the level's
   *  own par build as a LINK — the ghost is the par trace wound the same
   *  cheap way, the verdict row names the house and reads the shipped
   *  par (the gen-pars number, the same bytes the rung's stars use), and
   *  the rung's own stars/par/hashes are untouched. */
  function startHouseLinkRace(): void {
    const parBuild = (level as unknown as { parBuild?: () => Build }).parBuild;
    if (!parBuild) {
      ghostBar.setNote('this rig has no house line to race');
      return;
    }
    ghost.setEnabled(true);
    ctx.setGhostOn(true);
    ghostBar.toggle.setAttribute('aria-pressed', 'true');
    ghostBar.setNote('winding the house line…');
    void cachedGhostTrace(level, parBuild()).then(
      (trace) => {
        if (ghost.ghostMode === 'friend' && racedLink !== null) return; // a real link outranks
        ghost.setTrace('friend', trace);
        racedLink = { levelId: level.id, hash: null, name: level.name.slice(0, 48), par: parFor(level.id, level.par).time, time: trace.time };
        ghostBar.setNote('the house line is on the grid — launch to race it');
        const world = ctx.world();
        if (world) {
          if (world.status !== 'idle') ghost.resumeRace();
          ghost.sync(world.time);
        }
      },
      () => {
        ghostBar.setNote('the house line could not be wound on this machine');
      },
    );
  }

  /** `?link=<hash>` (dispatched after the first world mounts — it MOUNTS
   *  the payload's build, the pasted-link flow's own path). An unknown hash
   *  says so honestly; a non-hash says less kindly. */
  function dispatchChainLink(): void {
    const chainLinkParam = params.get('link');
    if (chainLinkParam !== null) {
      if (/^[0-9a-f]{8}$/.test(chainLinkParam)) {
        const found = findChainLink(chainLinkParam);
        if (found) void racePayload(chainLinkPayload(found));
        else ghostBar.setNote('no walked link with that hash on this device');
      } else {
        ghostBar.setNote('that is not a link hash');
      }
    }
  }

  /** The ghost bar's toggle (THE GHOST LAW's door): the locked word is on
   *  the button itself; an earned flip persists through `settings.ghosts`. */
  function togglePar(on: boolean): void {
    if (ctx.parLocked()) return; // the locked word is on the button itself
    ctx.setGhostOn(on);
    const s = loadSave();
    s.settings.ghosts = { ...s.settings.ghosts, par: on };
    saveSave(s);
    ghost.setEnabled(on);
    if (on && ghost.ghostMode !== 'friend' && !ensureRecordGhost()) ensureParGhost();
    else if (!on) {
      ghost.setTrace('off', null);
      ghostBar.clearNote();
    }
  }

  /** Mount the RECORD ghost — your best run on this named line — instead
   *  of the par line. Returns true when a record line took the rail. The
   *  trace is the stored build's own replayed tape (`cachedGhostTrace`,
   *  the par ghost's machinery on a headless world): visuals-only law,
   *  no new truth, `replay:all` untouched. */
  function ensureRecordGhost(): boolean {
    if (!ctx.ghostOn()) return false;
    const key = lineGhostKey();
    const rec = key ? readNamedLine(key) : undefined;
    if (!rec) return false;
    void cachedGhostTrace(level, deserialize(rec.build)).then(
      (trace) => {
        if (ghost.ghostMode === 'friend') return; // an explicit link keeps the grid
        ghost.setTrace('record', trace);
        ghostBar.clearNote();
        ghostBar.toggle.textContent = 'ghost: your line';
        ghostBar.toggle.setAttribute('aria-label', `Race your best run on “${rec.name}”`);
        window.dispatchEvent(new CustomEvent('gw-ghost-ready', { detail: { mode: 'record' } }));
        const world = ctx.world();
        if (world) {
          if (world.status !== 'idle') ghost.resumeRace();
          ghost.sync(world.time);
        }
      },
      () => {
        // the record could not be wound on this machine: the par line stands
        if (ctx.ghostOn() && !parWinding) ensureParGhost();
      },
    );
    return true;
  }

  return {
    armParGhost,
    ensureParGhost,
    get parWinding() {
      return parWinding;
    },
    get parArmed() {
      return parArmed;
    },
    ensureRecordGhost,
    togglePar,
    raceFriendLink,
    startHouseLinkRace,
    dispatchChainLink,
    playerCupAnchorFor,
    lineGhostKey,
    lineKey,
    get racedLink() {
      return racedLink;
    },
    get foreignBoard() {
      return foreignBoard;
    },
  };
}
