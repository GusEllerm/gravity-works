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

export interface SharePayload {
  levelId: string;
  seed: number;
  /** Final state hash, 8 hex digits. */
  hash: string;
  build: Build;
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

/** Canonical wrapper JSON. Keys sorted ascending; build via `serialize`. */
export function shareJson(payload: SharePayload): string {
  if (!/^[0-9a-f]{8}$/.test(payload.hash)) {
    throw new Error(`share: hash must be 8 hex digits, got ${JSON.stringify(payload.hash)}`);
  }
  if (!Number.isInteger(payload.seed)) throw new Error('share: seed must be an integer');
  if (typeof payload.levelId !== 'string' || payload.levelId === '') {
    throw new Error('share: levelId must be a non-empty string');
  }
  return `{"build":${serialize(payload.build)},"hash":${JSON.stringify(payload.hash)},"levelId":${JSON.stringify(payload.levelId)},"seed":${payload.seed},"v":1}`;
}

export function fromShareJson(json: string): SharePayload {
  const raw: unknown = JSON.parse(json);
  if (typeof raw !== 'object' || raw === null) throw new Error('share: payload is not an object');
  const obj = raw as Record<string, unknown>;
  if (obj.v !== 1) throw new Error(`share: unsupported payload version ${String(obj.v)}`);
  if (typeof obj.levelId !== 'string' || obj.levelId === '') throw new Error('share: bad levelId');
  if (typeof obj.seed !== 'number' || !Number.isInteger(obj.seed)) throw new Error('share: bad seed');
  if (typeof obj.hash !== 'string' || !/^[0-9a-f]{8}$/.test(obj.hash)) {
    throw new Error('share: bad hash');
  }
  // `deserialize` wants canonical JSON text; JSON.parse -> stringify keeps
  // the parsed key order, and deserialize validates structure regardless.
  const build = deserialize(JSON.stringify(obj.build));
  return { levelId: obj.levelId, seed: obj.seed, hash: obj.hash, build };
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
