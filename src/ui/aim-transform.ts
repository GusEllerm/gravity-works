/**
 * THE ONE AIM TRANSFORM (playtests V+W round5: "the ghost sat ~40 px up
 * and left of my cursor" / "~2 m away" — 2/2, viewport-dependent).
 *
 * Every screen-space decision the builder makes — which socket a hover
 * means, and whether a click is ON the shown ring — is the SAME question:
 * "where does this socket appear on the screen RIGHT NOW". Historically
 * each call site inlined its own rect math, and the round-5 finding is
 * what happens when the mapping is ever duplicated or cached: a client
 * coord compared to canvas-local offsets, or a rect that lived at a
 * different place a moment ago. The rule lives here now, once:
 *
 * - `getBoundingClientRect()` is read FRESH on every call — never cached.
 *   The rect is viewport-relative, exactly like `PointerEvent.clientX/Y`,
 *   so scroll needs no compensation and a scrolled page cannot drift.
 * - The projection is the LIVE camera (the same object that rendered the
 *   last frame), so yaw/pan/frames need no bookkeeping.
 * - All units are CSS px; `devicePixelRatio` never enters (the drawing
 *   buffer may be any resolution; the rect maps it onto the element).
 *
 * A rect that MOVES under a still cursor (a hint line above the canvas
 * appearing, a wrap, a window resize) is the residual failure mode the
 * builder defends against with `revalidateAim()` — see `src/ui/builder.ts`.
 */
import * as THREE from 'three';

const scratch = new THREE.Vector3();
const scratchNdc = new THREE.Vector2();
let scratchRay: THREE.Raycaster | null = null;

/** The camera ray through a client point — the exact INVERSE of
 *  `worldToClientPx` (same fresh rect, same live camera, same CSS px).
 *  The world-space side of the aim rule: the perpendicular distance from
 *  this ray to a socket origin is what that socket sits "this many metres"
 *  from the cursor, however the perspective flattens it on screen. */
export function clientPxToWorldRay(
  canvas: HTMLElement,
  camera: THREE.Camera,
  clientX: number,
  clientY: number,
  out = new THREE.Ray(),
): THREE.Ray {
  const rect = canvas.getBoundingClientRect(); // LIVE, never cached
  scratchNdc.set(
    ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
    -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1),
  );
  scratchRay ??= new THREE.Raycaster();
  scratchRay.setFromCamera(scratchNdc, camera);
  return out.copy(scratchRay.ray);
}

/** Where a world point appears on screen, in CSS `clientX/clientY` space,
 *  under the CURRENT canvas rect and the CURRENT camera matrices — the
 *  identical inverse of "which world point is under this pointer".
 *  `null` when the point is behind the camera. */
export function worldToClientPx(
  canvas: HTMLElement,
  camera: THREE.Camera,
  world: THREE.Vector3,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect(); // LIVE, never cached
  scratch.copy(world).project(camera);
  if (scratch.z > 1) return null; // behind the camera
  return {
    x: rect.left + (scratch.x * 0.5 + 0.5) * rect.width,
    y: rect.top + (0.5 - scratch.y * 0.5) * rect.height,
  };
}
