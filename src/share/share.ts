/**
 * Share links: `(levelId, build, seed, hash)` -> canonical JSON -> DEFLATE
 * (raw) -> base64url -> a `#s=` URL fragment. No server (brief §2.1): the
 * fragment is the whole payload, and the final state hash rides inside it so
 * any viewer can recompute the run and print "verified" or "mismatch".
 *
 * Canonical JSON: the wrapper keys are emitted in ascending alphabetical
 * order with no whitespace, and the build is embedded through `serialize`
 * (already canonical), so equal payloads are byte-equal before compression.
 *
 * Compression is injectable (`ShareCodec`). The browser uses the platform
 * `CompressionStream('deflate-raw')`; Node tests pass a `zlib.deflateRawSync`
 * codec — both emit RFC1951 raw DEFLATE, and the interop test proves either
 * side's bytes decode on the other. The module itself imports no Node APIs,
 * so it bundles for the browser untouched.
 */
import { deserialize, serialize, type Build } from '../track/build.ts';

/**
 * THE PAYLOAD (v1 forever readable, v2 on every new write — Decision Log
 * 2026-10-12 "THE CHAIN law"). v1 carried (levelId, build, seed, hash) and
 * LOSED the line's name, its cup-goal and the author's measured par, so a
 * friend's ghost race printed `you vs par` for the WRONG game (Sheet
 * re-probe). v2 adds the four facts the challenge half of a named line
 * needs, all OPTIONAL-ON-READ / MANDATORY-ON-WRITE-NEW:
 *
 * - `name` — the line's name (a named sandbox line, or a rung's registry
 *   name). A name is a string, not an identity (the no-accounts law).
 * - `goal` — the placed cup's transform, 16 float64 elements in three's
 *   column-major order, copied verbatim from the build's own piece. It is
 *   PRESENTATION geometry only: the physics' capture volume is the cup the
 *   guard already reifies from BUILD (`World` reifies the last player
 *   `finishCup`), never this field — no hash moves near it
 *   (`tests/unit/chain.test.ts` proves the neutrality).
 * - `par` — the author's MEASURED reference run through the gen-pars rule
 *   (`parOfRun`), so a friend's verdict reads against THEIR line's par,
 *   not the page's own.
 * - `lineage` — the link whose ghost this run beat (identity by hash —
 *   the trust anchor again), what the device's chain walk strings into a
 *   chain. Optional even on write: most links beat nothing.
 *
 * A v1 payload must still parse, replay and verify forever (the burned-
 * receipt law): `v: 1` bytes are unchanged from the first ship, and
 * `fromShareJson` reads both shapes; new writers stamp `v: 2`.
 */
export interface SharePayload {
  /** Payload schema version; absent on read of a v1 link, 2 on every new write. */
  v?: 1 | 2;
  levelId: string;
  seed: number;
  /** Final state hash, 8 hex digits. */
  hash: string;
  build: Build;
  /** The line's name, ≤ 48 chars (the named-line cap). */
  name?: string;
  /** Author's measured par in seconds (gen-pars rule). */
  par?: number;
  /** Placed cup's transform, 16 float64 elements — presentation geometry.
   *  The verdict's cup is read from BUILD; this field never reaches a sim. */
  goal?: number[];
  /** The link whose ghost this run beat. */
  lineage?: ShareLineage;
}

/** Identity of a beaten link — hash is the trust anchor, name is phrasing. */
export interface ShareLineage {
  levelId: string;
  hash: string;
  name?: string;
}

export interface ShareCodec {
  deflate(bytes: Uint8Array): Promise<Uint8Array>;
  inflate(bytes: Uint8Array): Promise<Uint8Array>;
}

export const SHARE_FRAGMENT_KEY = 's';

/** The platform codec (browser, or Node >= 18's web-stream zlib bindings). */
export function platformCodec(): ShareCodec {
  const CS = (globalThis as { CompressionStream?: unknown }).CompressionStream;
  const DS = (globalThis as { DecompressionStream?: unknown }).DecompressionStream;
  if (typeof CS !== 'function' || typeof DS !== 'function') {
    throw new Error('share: no CompressionStream in this environment; pass a codec');
  }
  const pipe = async (bytes: Uint8Array, Ctor: new (f: string) => TransformStream): Promise<Uint8Array> => {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new Ctor('deflate-raw'));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  };
  return {
    deflate: (b) => pipe(b, CS as new (f: string) => TransformStream),
    inflate: (b) => pipe(b, DS as new (f: string) => TransformStream),
  };
}

/** The gen-pars rule applied to an author's measured run — ONE home for
 *  the ceil-to-0.05 law `scripts/gen-pars.mjs` states (the 3-star line is
 *  "at least as fast as the reference" without punishing float jitter).
 *  A payload's `par` is THIS function over the author's own finished run. */
export function parOfRun(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('share: parOfRun needs a finished-run time');
  return Math.ceil(seconds * 20 - 1e-9) / 20;
}

function validName(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= 48;
}

function validGoal(v: unknown): v is number[] {
  return (
    Array.isArray(v) &&
    v.length === 16 &&
    v.every((n) => typeof n === 'number' && Number.isFinite(n))
  );
}

function goalJson(goal: readonly number[]): string {
  return `[${goal.map((n) => JSON.stringify(n)).join(',')}]`;
}

function validLineage(v: unknown): v is ShareLineage {
  if (typeof v !== 'object' || v === null) return false;
  const l = v as Record<string, unknown>;
  return (
    typeof l.levelId === 'string' &&
    l.levelId !== '' &&
    typeof l.hash === 'string' &&
    /^[0-9a-f]{8}$/.test(l.hash) &&
    (l.name === undefined || validName(l.name))
  );
}

/** Canonical wrapper JSON. Keys sorted ascending; build via `serialize`;
 *  v2 fields ride only when present (byte-stability is the whole point —
 *  `undefined` fields are absent, not null). A payload with no v2 fields
 *  writes the EXACT v1 bytes it always wrote, so old fixtures are the same
 *  file a v1 writer makes; any v2 field (or an explicit `v: 2`) stamps the
 *  envelope `"v":2` — mandatory-on-write-new. */
export function shareJson(payload: SharePayload): string {
  if (!/^[0-9a-f]{8}$/.test(payload.hash)) {
    throw new Error(`share: hash must be 8 hex digits, got ${JSON.stringify(payload.hash)}`);
  }
  if (!Number.isInteger(payload.seed)) throw new Error('share: seed must be an integer');
  if (typeof payload.levelId !== 'string' || payload.levelId === '') {
    throw new Error('share: levelId must be a non-empty string');
  }
  const v2 = payload.name !== undefined || payload.par !== undefined || payload.goal !== undefined || payload.lineage !== undefined;
  if (payload.v === 1 && v2) throw new Error('share: a v1 payload may not carry v2 fields');
  const version = v2 || payload.v === 2 ? 2 : 1;
  if (payload.name !== undefined && !validName(payload.name)) throw new Error('share: name must be 1..48 chars');
  if (payload.par !== undefined && !(typeof payload.par === 'number' && Number.isFinite(payload.par) && payload.par > 0)) {
    throw new Error('share: par must be a positive finite number');
  }
  if (payload.goal !== undefined && !validGoal(payload.goal)) throw new Error('share: goal must be 16 finite numbers');
  if (payload.lineage !== undefined && !validLineage(payload.lineage)) throw new Error('share: lineage must be {levelId, hash, name?}');
  const parts = [`"build":${serialize(payload.build)}`, `"hash":${JSON.stringify(payload.hash)}`];
  if (payload.goal !== undefined) parts.push(`"goal":${goalJson(payload.goal)}`);
  if (payload.lineage !== undefined) {
    const l = payload.lineage;
    const lp = [`"hash":${JSON.stringify(l.hash)}`, `"levelId":${JSON.stringify(l.levelId)}`];
    if (l.name !== undefined) lp.push(`"name":${JSON.stringify(l.name)}`);
    parts.push(`"lineage":{${lp.join(',')}}`);
  }
  parts.push(`"levelId":${JSON.stringify(payload.levelId)}`);
  if (payload.name !== undefined) parts.push(`"name":${JSON.stringify(payload.name)}`);
  if (payload.par !== undefined) parts.push(`"par":${JSON.stringify(payload.par)}`);
  parts.push(`"seed":${payload.seed}`, `"v":${version}`);
  return `{${parts.join(',')}}`;
}

export function fromShareJson(json: string): SharePayload {
  const raw: unknown = JSON.parse(json);
  if (typeof raw !== 'object' || raw === null) throw new Error('share: payload is not an object');
  const obj = raw as Record<string, unknown>;
  if (obj.v !== 1 && obj.v !== 2) throw new Error(`share: unsupported payload version ${String(obj.v)}`);
  if (typeof obj.levelId !== 'string' || obj.levelId === '') throw new Error('share: bad levelId');
  if (typeof obj.seed !== 'number' || !Number.isInteger(obj.seed)) throw new Error('share: bad seed');
  if (typeof obj.hash !== 'string' || !/^[0-9a-f]{8}$/.test(obj.hash)) {
    throw new Error('share: bad hash');
  }
  // OPTIONAL-ON-READ: a v1 envelope carries none of the v2 fields and
  // verifies exactly as it always did; a v2 envelope that CARRIES a field
  // must carry it well (garbage in a v2 field is garbage, not absence).
  const extra: Pick<SharePayload, 'name' | 'par' | 'goal' | 'lineage'> = {};
  if (obj.name !== undefined) {
    if (!validName(obj.name)) throw new Error('share: bad name');
    extra.name = obj.name;
  }
  if (obj.par !== undefined) {
    if (obj.v !== 2) throw new Error('share: a v1 payload may not carry par');
    if (typeof obj.par !== 'number' || !Number.isFinite(obj.par) || obj.par <= 0) {
      throw new Error('share: bad par');
    }
    extra.par = obj.par;
  }
  if (obj.goal !== undefined) {
    if (obj.v !== 2) throw new Error('share: a v1 payload may not carry goal');
    if (!validGoal(obj.goal)) throw new Error('share: bad goal');
    extra.goal = obj.goal;
  }
  if (obj.lineage !== undefined) {
    if (obj.v !== 2) throw new Error('share: a v1 payload may not carry lineage');
    if (!validLineage(obj.lineage)) throw new Error('share: bad lineage');
    extra.lineage = obj.lineage as ShareLineage;
  }
  // `deserialize` wants canonical JSON text; JSON.parse -> stringify keeps
  // the parsed key order, and deserialize validates structure regardless.
  return {
    v: obj.v,
    levelId: obj.levelId,
    seed: obj.seed,
    hash: obj.hash,
    build: deserialize(JSON.stringify(obj.build)),
    ...extra,
  };
}

// ---- base64url -------------------------------------------------------------

function bytesToBinaryString(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i] as number);
  return s;
}

function binaryStringToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

export function base64urlEncode(bytes: Uint8Array): string {
  return btoa(bytesToBinaryString(bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlDecode(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) throw new Error('share: not base64url');
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  return binaryStringToBytes(atob(b64));
}

// ---- URLs ------------------------------------------------------------------

/**
 * `#s=<deflate-raw(payload) base64url>`. Returned fragment includes the `#`.
 */
export async function encodeShareUrl(
  payload: SharePayload,
  codec: ShareCodec = platformCodec(),
): Promise<string> {
  const compressed = await codec.deflate(new TextEncoder().encode(shareJson(payload)));
  return `#${SHARE_FRAGMENT_KEY}=${base64urlEncode(compressed)}`;
}

/**
 * Pull the share reference out of a full URL, a `#s=…` fragment or a bare
 * token (the no-`#` case only, so an ordinary `#anchor` is not mistaken for
 * a share). Returns null when there is no share fragment at all — garbage
 * inside the *payload* is `parseShareUrl`'s problem.
 */
export function extractShareRef(url: string): string | null {
  const hashIdx = url.indexOf('#');
  const candidate = hashIdx >= 0 ? shareFromFragment(url.slice(hashIdx + 1)) : url;
  if (candidate === null || candidate === '') return null;
  return /^[A-Za-z0-9_-]+$/.test(candidate) ? candidate : null;
}

function shareFromFragment(fragment: string): string | null {
  // a plain `#anchor` is never a share; only the `s=` key counts
  if (!fragment.startsWith(`${SHARE_FRAGMENT_KEY}=`)) return null;
  return fragment.slice(SHARE_FRAGMENT_KEY.length + 1).split('&')[0]!;
}

/** Decode a share reference (any URL shape) into a validated payload. Throws
 * on garbage — this is the refuse-garbage gate of the contract. */
export async function parseShareUrl(
  url: string,
  codec: ShareCodec = platformCodec(),
): Promise<SharePayload> {
  const token = extractShareRef(url);
  if (token === null) throw new Error('share: no share fragment in input');
  const json = new TextDecoder().decode(await codec.inflate(base64urlDecode(token)));
  return fromShareJson(json);
}

/** Alias kept for call sites that say "decode". */
export const decodeShareUrl = parseShareUrl;
