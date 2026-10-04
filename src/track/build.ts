/**
 * Builds: the serialisable core of a level attempt, and the only thing the rest
 * of the game gets to read about a track.
 *
 *     Build       { levelId, pieces: PlacedPiece[], seed }   // share payload core
 *     PlacedPiece { def, params, transform: Mat4, seq }
 *
 * `seq` is the canonical order (`canonicalBuild`), `transform` carries a placed
 * piece from piece-local space to world space, and everything downstream —
 * meshes, colliders, camera rail, the deterministic hash — is derived, never
 * stored. That is what makes a share link replayable: (level, build, seed) is a
 * complete description with no hidden world state (Track Kit invariants 3 and 4).
 *
 * `serialize` writes canonical JSON: object keys in ascending alphabetical
 * order at every level, no whitespace, numbers by their shortest round-trip
 * repr, matrices as their 16 float64 elements in three's column-major order.
 * Byte-identical output from equal builds is therefore possible, which is what
 * lets a share link be compared by hash.
 */
import * as THREE from 'three';
import { PIECES, defaultParams, type PieceKind, type PieceParams } from './pieces.ts';
import { canonicalBuild, fitSocket } from './snap.ts';
import { TrackSpline } from './spline.ts';
import { transformSocket, type Socket } from './socket.ts';

export interface PlacedPiece {
  def: PieceKind;
  params: PieceParams;
  transform: THREE.Matrix4;
  seq: number;
}

export interface Build {
  levelId: string;
  pieces: PlacedPiece[];
  seed: number;
}

/**
 * Turn a build into the geometry the world is built from: one spline per
 * placed piece, in canonical order, with the piece transform applied.
 */
export function reify(build: Build): { splines: TrackSpline[]; pieces: PlacedPiece[] } {
  const pieces = canonicalBuild(build.pieces);
  const splines = pieces.map((piece) => {
    const def = PIECES[piece.def];
    if (!def) throw new Error(`reify: unknown piece kind "${String(piece.def)}"`);
    return def.spline(piece.params).transformed(piece.transform);
  });
  return { splines, pieces };
}

/**
 * Lay pieces end to end: each piece is seated on the previous piece's exit
 * socket by `fitSocket`, seq assigned in order. Pure — nothing here reads the
 * world, so the same list always produces the same build.
 */
export function chain(
  kinds: readonly PieceKind[],
  options: {
    params?: Partial<Record<PieceKind, PieceParams>>;
    levelId?: string;
    seed?: number;
    start?: THREE.Matrix4;
  } = {},
): Build {
  let cursor: Socket = { pos: new THREE.Vector3(), tangent: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) };
  if (options.start) cursor = transformSocket(cursor, options.start);
  const pieces: PlacedPiece[] = [];
  kinds.forEach((def, index) => {
    const params = options.params?.[def] ?? defaultParams(def);
    const [inSocket, outSocket] = PIECES[def].sockets(params);
    const transform = fitSocket(cursor, inSocket);
    pieces.push({ def, params, transform, seq: index });
    cursor = transformSocket(outSocket, transform);
  });
  return { levelId: options.levelId ?? 'sandbox', pieces, seed: options.seed ?? 0 };
}

// ---- canonical JSON --------------------------------------------------------

function canonical(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('serialize: non-finite number in build');
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value instanceof THREE.Matrix4) return canonical(value.elements as unknown as number[]);
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  throw new Error(`serialize: cannot encode ${typeof value}`);
}

/** Canonical JSON for a build — equal builds produce identical bytes. */
export function serialize(build: Build): string {
  if (typeof build.levelId !== 'string') throw new Error('serialize: build.levelId must be a string');
  if (!Number.isInteger(build.seed)) throw new Error('serialize: build.seed must be an integer');
  const pieces = canonicalBuild(build.pieces).map((p) => ({
    def: p.def,
    params: p.params,
    seq: p.seq,
    transform: p.transform,
  }));
  return canonical({ levelId: build.levelId, pieces, seed: build.seed });
}

/** Parse a build back, in canonical order. Throws on anything malformed. */
export function deserialize(json: string): Build {
  const raw: unknown = JSON.parse(json);
  if (typeof raw !== 'object' || raw === null) throw new Error('deserialize: not an object');
  const obj = raw as Record<string, unknown>;
  if (typeof obj.levelId !== 'string') throw new Error('deserialize: levelId must be a string');
  if (typeof obj.seed !== 'number' || !Number.isInteger(obj.seed)) {
    throw new Error('deserialize: seed must be an integer');
  }
  if (!Array.isArray(obj.pieces)) throw new Error('deserialize: pieces must be an array');
  const pieces = obj.pieces.map((rawPiece, index) => {
    if (typeof rawPiece !== 'object' || rawPiece === null) {
      throw new Error(`deserialize: piece ${index} is not an object`);
    }
    const p = rawPiece as Record<string, unknown>;
    if (typeof p.def !== 'string' || !(p.def in PIECES)) {
      throw new Error(`deserialize: piece ${index} has unknown def ${JSON.stringify(p.def)}`);
    }
    if (!Array.isArray(p.transform) || p.transform.length !== 16 || p.transform.some((n) => typeof n !== 'number')) {
      throw new Error(`deserialize: piece ${index} transform must be 16 numbers`);
    }
    if (typeof p.seq !== 'number' || !Number.isFinite(p.seq)) {
      throw new Error(`deserialize: piece ${index} seq must be a number`);
    }
    const params: PieceParams = {};
    if (p.params !== undefined) {
      if (typeof p.params !== 'object' || p.params === null) {
        throw new Error(`deserialize: piece ${index} params must be an object`);
      }
      for (const [k, v] of Object.entries(p.params as Record<string, unknown>)) {
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          throw new Error(`deserialize: piece ${index} param ${k} must be a finite number`);
        }
        (params as Record<string, number>)[k] = v;
      }
    }
    return {
      def: p.def as PieceKind,
      params,
      transform: new THREE.Matrix4().fromArray(p.transform as number[]),
      seq: p.seq,
    };
  });
  return { levelId: obj.levelId, pieces: canonicalBuild(pieces), seed: obj.seed };
}

/**
 * FNV-1a over the quantised samples of a reified build — the "hash of a reified
 * rig" Track Kit invariant 3 talks about. 32 samples per spline at fixed t, so
 * the fingerprint depends only on the geometry, never on tessellation choices.
 * A non-finite value poisons the hash with a distinct constant instead of
 * quietly folding into zero.
 */
export function rigFingerprint(build: Build, samplesPerSpline = 32): string {
  const { splines } = reify(build);
  let h = 0x811c9dc5 >>> 0;
  const mix = (word: number): void => {
    h = ((h ^ (word >>> 0)) >>> 0);
    h = Math.imul(h, 0x01000193) >>> 0;
  };
  const quant = (x: number): void => {
    if (!Number.isFinite(x)) {
      mix(0xdeadbead);
      return;
    }
    mix(Math.round(x * 1e6) | 0);
  };
  mix(samplesPerSpline);
  for (const spline of splines) {
    mix(Math.round(spline.length * 1e6) | 0);
    for (let i = 0; i < samplesPerSpline; i++) {
      const f = spline.sample(samplesPerSpline === 1 ? 0 : i / (samplesPerSpline - 1));
      quant(f.pos.x);
      quant(f.pos.y);
      quant(f.pos.z);
      quant(f.tangent.x);
      quant(f.tangent.y);
      quant(f.tangent.z);
      quant(f.up.x);
      quant(f.up.y);
      quant(f.up.z);
    }
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
