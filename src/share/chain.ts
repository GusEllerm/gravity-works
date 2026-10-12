/**
 * THE CHAIN (freeplay program Lane C — Decision Log 2026-10-12 "THE CHAIN
 * law greenlit"). The ladder's retention half, with no server: a share
 * payload IS a link, racing one is a beat, and a beat that shares itself
 * carries `lineage` — the link it beat. The CHAIN is what those payloads
 * spell, and per the single-machine law the honest, verifiable chain is
 * the one this DEVICE walked: the links it published (every share press)
 * and the links it raced (every accepted friend link). Payloads only —
 * every row of the LINES tab is decodable, replayable and hash-checked
 * from the bytes the store holds; no number here comes from anywhere else.
 *
 * The store rides the save's `settings.records` object (the records law of
 * `src/save/records.ts`: under `settings` the merge carries it by
 * reference, so a writer that never learned the key cannot drop it; no
 * schema bump, no migrade). THE TALLY'S BADGES ARE NOT RANK INPUTS (the
 * CHAIN law, verbatim) — nothing in this module reads `records.badges`,
 * and the one sentence the tab says about rank is a COUNT of payloads
 * walked here, phrased as exactly that.
 *
 * Builds ride as canonical `serialize` bytes (the NamedLine law: the
 * record's receipt is (level, build, seed) exactly like a share link, so
 * a chain row adds no new truth to verify — the ghost is a `deriveGhost
 * Trace` away and the hash is the receipt).
 */
import { deserialize, fixtureQuota, serialize, type Build } from '../track/build.ts';
import { loadSave, saveSave, type StorageLike } from '../save/save.ts';
import type { ShareLineage, SharePayload } from './share.ts';

/** The one device's walked links, capped FIFO — the chain is a WALK log,
 *  not an archive; 64 is generous for a machine's honest memory. */
export const CHAIN_CAP = 64;

/** One walked link: a share payload with its build pinned to canonical
 *  bytes, plus the wall-clock stamp of when this device met it. */
export interface DeviceLink {
  levelId: string;
  seed: number;
  hash: string;
  /** Canonical `serialize` bytes of the link's build. */
  build: string;
  name?: string;
  par?: number;
  goal?: number[];
  lineage?: ShareLineage;
  /** Wall-clock ms of the walk (share press or accepted race). */
  t: number;
}

function validLink(v: unknown): v is DeviceLink {
  if (typeof v !== 'object' || v === null) return false;
  const l = v as Record<string, unknown>;
  if (
    typeof l.levelId !== 'string' ||
    l.levelId === '' ||
    typeof l.seed !== 'number' ||
    !Number.isInteger(l.seed) ||
    typeof l.hash !== 'string' ||
    !/^[0-9a-f]{8}$/.test(l.hash) ||
    typeof l.build !== 'string' ||
    typeof l.t !== 'number' ||
    !Number.isFinite(l.t)
  )
    return false;
  if (l.name !== undefined && !(typeof l.name === 'string' && l.name.length > 0 && l.name.length <= 48)) return false;
  if (l.par !== undefined && !(typeof l.par === 'number' && Number.isFinite(l.par) && l.par > 0)) return false;
  if (
    l.goal !== undefined &&
    !(
      Array.isArray(l.goal) &&
      l.goal.length === 16 &&
      l.goal.every((n) => typeof n === 'number' && Number.isFinite(n))
    )
  )
    return false;
  if (l.lineage !== undefined) {
    const g = l.lineage as Record<string, unknown>;
    if (
      typeof g !== 'object' ||
      g === null ||
      typeof g.levelId !== 'string' ||
      g.levelId === '' ||
      typeof g.hash !== 'string' ||
      !/^[0-9a-f]{8}$/.test(g.hash) ||
      (g.name !== undefined && typeof g.name !== 'string')
    )
      return false;
  }
  try {
    deserialize(l.build);
  } catch {
    return false;
  }
  return true;
}

/** VALIDATE on read (the save law): the chain as stored, oldest walk
 *  first; anything unusable reads as absent, never crashes. */
export function chainFromSave(data: { settings: Record<string, unknown> }): DeviceLink[] {
  const raw = (data.settings.records as { chain?: unknown } | undefined)?.chain;
  if (!Array.isArray(raw)) return [];
  return raw.filter(validLink).slice(-CHAIN_CAP) as DeviceLink[];
}

export function readChain(store: StorageLike | null | undefined = undefined): DeviceLink[] {
  return chainFromSave(loadSave(store) as unknown as { settings: Record<string, unknown> });
}

/** The link with this hash (the identity a lineage names), or undefined. */
export function findChainLink(
  hash: string,
  store: StorageLike | null | undefined = undefined,
): DeviceLink | undefined {
  return readChain(store).find((l) => l.hash === hash);
}

/** Turn a stored link back into the payload shape the share machinery
 *  (and `racePayload`) eats — a chain row is one decode away from a race. */
export function chainLinkPayload(link: DeviceLink): SharePayload & { build: Build } {
  const payload: SharePayload & { build: Build } = {
    v: 2,
    levelId: link.levelId,
    seed: link.seed,
    hash: link.hash,
    build: deserialize(link.build),
  };
  if (link.name !== undefined) payload.name = link.name;
  if (link.par !== undefined) payload.par = link.par;
  if (link.goal !== undefined) payload.goal = link.goal;
  if (link.lineage !== undefined) payload.lineage = link.lineage;
  return payload;
}

/**
 * Remember that this device published or raced a link. Deduped by hash
 * (the receipt's own identity — re-racing the same link is the same walk,
 * and a re-share of an unchanged run is the same bytes), FIFO-capped,
 * stamped now. Returns the chain's length after the write.
 */
export function rememberLink(
  payload: SharePayload,
  store: StorageLike | null | undefined = undefined,
  now: number = Date.now(),
): number {
  const data = loadSave(store);
  const chain = chainFromSave(data as unknown as { settings: Record<string, unknown> });
  const rec = (data.settings.records ??= {}) as { chain?: unknown };
  if (chain.some((l) => l.hash === payload.hash && l.levelId === payload.levelId)) return chain.length;
  const link: DeviceLink = {
    levelId: payload.levelId,
    seed: payload.seed,
    hash: payload.hash,
    build: serialize(payload.build),
    t: now,
  };
  if (payload.name !== undefined) link.name = payload.name;
  if (payload.par !== undefined) link.par = payload.par;
  if (payload.goal !== undefined) link.goal = payload.goal.slice();
  if (payload.lineage !== undefined) link.lineage = { ...payload.lineage };
  chain.push(link);
  rec.chain = chain.slice(-CHAIN_CAP);
  saveSave(data, store);
  return chain.length;
}

/**
 * The rank sentence the LINES tab prints, phrased as what it is — the
 * count of LINKS this device published or raced, never a global number
 * (single-machine law), never badges (the CHAIN law's NOT-an-input
 * clause). The honesty clause is the records' own, verbatim.
 */
export function chainRankLine(links: readonly DeviceLink[]): string {
  const n = links.length;
  if (n === 0) return `no links walked yet — publish one, or race one · your own links on this device only`;
  return `${n} link${n === 1 ? '' : 's'} walked on this device — published or raced, verifiable from the payloads below · your own links on this device only`;
}

/** The link a finishing run beat, in lineage words (the share button
 *  attaches it to the NEXT payload): a same-run fact about the ghost that
 *  was on the grid, computed from the two FINISH times the shell already
 *  holds — the ghost's trace time is its build's own re-simulated finish,
 *  so the claim is checkable from the payloads alone. Null unless the run
 *  finished strictly ahead of a link ghost. */
export function beatLineage(opts: {
  finished: boolean;
  myTime: number;
  ghostMode: 'friend' | 'other' | 'none';
  ghostTime: number;
  link: { levelId: string; hash: string; name?: string } | null;
}): ShareLineage | null {
  if (!opts.finished || opts.ghostMode !== 'friend' || !opts.link) return null;
  if (!(opts.ghostTime > 0) || !(opts.myTime < opts.ghostTime)) return null;
  const lineage: ShareLineage = { levelId: opts.link.levelId, hash: opts.link.hash };
  if (opts.link.name !== undefined) lineage.name = opts.link.name;
  return lineage;
}

/**
 * THE GOAL FIELD, extracted the way the guard sees it: the transform of
 * the PLAYER-placed cup — the `finishCup` occurrences past the fixture
 * quota, last one wins (exactly the cup `World` reifies as the capture
 * volume, and exactly the seat `lineAnchorKey` names). Raw Matrix4
 * elements, copied from the build, never recomputed — presentation
 * geometry for the LINES tab and the chain rows. NO HASH MOVES NEAR IT:
 * the verdict's cup is read from BUILD by the guard, and this read-only
 * pass steps nothing (`tests/unit/chain.test.ts` pins the hash-neutrality
 * receipt).
 */
export function cupGoalFromBuild(
  build: Build,
  fixtures: Partial<Record<string, number>>,
): number[] | null {
  const isFixture = fixtureQuota(fixtures as never);
  let goal: number[] | null = null;
  for (const p of build.pieces) {
    if (p.def === 'finishCup' && !isFixture(p.def)) goal = Array.from(p.transform.elements);
  }
  return goal;
}
