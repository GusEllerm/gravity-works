/**
 * `src/render/car-rig.ts` — the RATIFIED car-a rig, shared by the dev
 * scenes and the GAME shell (program T1.1: "the car you drive is a red
 * box" is a render-layer bug, not a physics one).
 *
 * One source of truth for the sedan the art director ratified at the
 * stage-1 bake-off (`Sessions/2026-10-04 Stage 1 review.md`, Decision Log
 * 2026-10-04): the beveled `toyBlock` body, the proud cream stripe band
 * (never a decal), the raked cabin with the glass band and roof-rack bars,
 * and four thick wheels on the axle line. The dev scene `car-a`
 * (`src/dev/scenes/cars.ts`) and the shell's in-game car are now the SAME
 * meshes from the SAME factory — the ratified stills' car is literally the
 * car you drive.
 *
 * RENDER LAYER ONLY, and the law that keeps `replay:all` byte-identical:
 * the rig is a `THREE.Group` the shell hangs off the frame sink's pose. It
 * never touches `World`, the colliders, or `hashedBodies` — the hashed set
 * stays `chassis + wheels` from `src/physics/car.ts`. The wheel SPIN here
 * is a render-side omega read (pose motion / wall dt, same class of input
 * as the roll voice's screen speed), never a physics drive. The squash
 * entry point scales the rig's inner group on wall time only.
 *
 * Spaces: the rig root is CAR space — wheel bottoms at y = 0, length along
 * +x, the same space the dev scenes park at `y = 0.0045` on their track
 * run. The game shell hangs it at -CAR_GROUND_LIFT under a pose group so
 * the OUTER origin is the chassis centre `World.carPose(alpha).pos`
 * reports: the raycast struts hold that centre `suspRest + |wheelY|` =
 * 0.41 sim = 0.041 world metres above the deck, so the wheels seat on it.
 */
import * as THREE from 'three';
import { dieCastPaint, fabric, glass } from './materials.ts';
import { toyBlock } from './geometry.ts';
import { SET_TOKENS, shiftHex, type SetTokens } from './tokens.ts';
import { ToonMaterial } from './toon-material.ts';

/** The ratified sedan's body blue (colorblind-safe seed nudged through the
 *  tokens machinery — the `car-a` scene's own constant, moved here with the
 *  geometry it colours). */
export const CAR_A_BLUE = shiftHex('#0072B2', 0.0, 0.12, 0.05);
const STRIPE = '#EFDCB8'; // warm cream/putty band
const RUBBER = '#4A3527'; // dark warm brown tyres — never black

/** Chassis-centre height above the deck when the struts are at rest
 *  (`(suspRest 0.16 + |wheelY| 0.25) / SIM_SCALE` in world metres). The
 *  rig's car-space ground plane hangs at this depth under the pose origin. */
export const CAR_GROUND_LIFT = 0.041;

/** The rig's wheel radius in world metres (the omega read divides by it). */
export const CAR_WHEEL_RADIUS = 0.0095;

/**
 * Strobe damping for the cosmetic wheel omega. The PHYSICAL omega of a
 * 0.0095 m wheel at 2 m/s is ~210 rad/s — 33 rev/s, which at 60 fps is a
 * pure strobe (a wheel that reads backwards is worse than a wheel that
 * reads still). The visual spin is `speed / (RADIUS * SPIN_DAMP)`: ~1.7
 * rev/s at the par runs' 2 m/s top speed, ~0.4 rev/s at a crawl — always
 * forward, never aliased. Render-side cosmetic only; nothing physical
 * reads or is read by this.
 */
export const CAR_SPIN_DAMP = 12;

export interface CarRig {
  /** The car-space root: wheel bottoms at y = 0, length along +x. Dev
   *  scenes park it at `position.y = 0.0045` on their track run exactly as
   *  they always did; the game shell hangs it at -CAR_GROUND_LIFT under a
   *  pose group so the OUTER origin is the chassis centre that
   *  `World.carPose(alpha).pos` reports. */
  readonly group: THREE.Group;
  /** The squash pivot (the car-space root — scaling it about its own
   *  origin keeps the wheel bottoms ON the ground plane). Juice owns
   *  `scale`; nothing else writes it. */
  readonly body: THREE.Group;
  /** Spinners in spin order: tyres with their caps. The shell integrates
   *  `rotation.z` from the render-side omega. */
  readonly wheels: readonly THREE.Object3D[];
  readonly wheelRadius: number;
  /** Declare the scene's key light to the rig's toon materials (the tinted-
   *  shadow contract every ToonMaterial needs; see `dev/scenes/cars.ts`). */
  setKeyLight(color: string | number, intensity: number): void;
  /** Free the rig's geometries and materials (a page teardown, not a
   *  rebuild — the shell mounts ONE rig per boot). */
  dispose(): void;
}

/**
 * Build the ratified car-a sedan in car space (wheel bottoms at y = 0,
 * length along +x). `tokens` default to the kitchen's (the ratification's
 * home); the shell passes the mounted set's tokens so the paint reads
 * under the room it is standing in.
 */
export function createCarRig(tokens: SetTokens = SET_TOKENS.kitchen): CarRig {
  const group = new THREE.Group();
  // the car-space root doubles as the squash pivot: scaling it about its
  // own origin scales ABOUT the wheel-contact plane (y = 0 stays put)
  group.name = 'car-body';
  const body = group;

  const setProps = (mesh: THREE.Mesh, cast: boolean, receive: boolean): void => {
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
  };

  const chassis = new THREE.Mesh(toyBlock(0.076, 0.024, 0.038, 0.009, 0.004), dieCastPaint(tokens, CAR_A_BLUE));
  chassis.position.y = 0.006;
  setProps(chassis, true, true);
  body.add(chassis);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.0055, 0.039),
    dieCastPaint(tokens, STRIPE, { toy: 0.25, rim: { strength: 0.22, size: 0.2 } }),
  );
  stripe.position.y = 0.0165;
  setProps(stripe, false, false);
  body.add(stripe);

  const cabin = new THREE.Group();
  cabin.position.set(-0.01, 0.03, 0);
  cabin.rotation.z = 0.12; // windshield raked back
  const shell = new THREE.Mesh(
    toyBlock(0.034, 0.016, 0.034, 0.011, 0.003),
    dieCastPaint(tokens, shiftHex(CAR_A_BLUE, 0, 0, -0.06)),
  );
  setProps(shell, true, false);
  cabin.add(shell);
  const greenhouse = new THREE.Mesh(
    toyBlock(0.027, 0.010, 0.036, 0.009, 0.002),
    glass(tokens, '#CFEDE4', { rim: { strength: 0.4, size: 0.3 } }),
  );
  greenhouse.position.y = 0.004;
  cabin.add(greenhouse);
  const barMat = dieCastPaint(tokens, STRIPE, { toy: 0.2 });
  for (const bx of [-0.009, 0, 0.009]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.0026, 0.0024, 0.03), barMat);
    bar.position.set(bx, 0.0174, 0);
    setProps(bar, false, false);
    cabin.add(bar);
  }
  body.add(cabin);

  // four thick wheels outside the flanks, each a tyre + cream hub cap that
  // shares the tyre's spin (the cap's 12-gon is what makes the rotation
  // legible on a solid rubber tyre)
  const wheels: THREE.Object3D[] = [];
  const width = Math.max(0.005, CAR_WHEEL_RADIUS * 0.74);
  const tyreGeo = new THREE.CylinderGeometry(CAR_WHEEL_RADIUS, CAR_WHEEL_RADIUS, width, 20);
  tyreGeo.rotateX(Math.PI / 2); // axle along z, car length along x
  const hubGeo = new THREE.CylinderGeometry(CAR_WHEEL_RADIUS * 0.4, CAR_WHEEL_RADIUS * 0.4, width + 0.001, 12);
  hubGeo.rotateX(Math.PI / 2);
  const rubber = fabric(tokens, RUBBER, { rim: { strength: 0.3, size: 0.65 } });
  const hub = dieCastPaint(tokens, STRIPE, { toy: 0.2, specular: { size: 0.08, strength: 0.7 } });
  for (const x of [-0.0245, 0.0245]) {
    for (const z of [0.0165, -0.0165]) {
      const axle = new THREE.Group();
      axle.position.set(x, CAR_WHEEL_RADIUS, z);
      const tyre = new THREE.Mesh(tyreGeo, rubber);
      setProps(tyre, true, false);
      axle.add(tyre);
      const cap = new THREE.Mesh(hubGeo, hub);
      setProps(cap, false, false);
      axle.add(cap);
      body.add(axle);
      wheels.push(axle);
    }
  }

  const materials = new Set<THREE.Material>();
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
    }
  });

  return {
    group,
    body,
    wheels,
    wheelRadius: CAR_WHEEL_RADIUS,
    setKeyLight(color, intensity): void {
      for (const m of materials) {
        if (m instanceof ToonMaterial) m.setKeyLight(color, intensity);
      }
    },
    dispose(): void {
      for (const o of [group]) {
        o.traverse((n) => {
          if (n instanceof THREE.Mesh) n.geometry.dispose();
        });
      }
      for (const m of materials) m.dispose();
    },
  };
}
