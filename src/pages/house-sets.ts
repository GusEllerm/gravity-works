/**
 * THE HOUSE SET MOUNT (Lane F1 of the 8→9 program, `Action Plan 2026-10-13`;
 * the spec is [[Reference/Evaluation 2026-10-13 art of the house]] §5 mock,
 * `src/dev/scenes/house-window-mock.ts`, productionized).
 *
 * The house page MOUNTS THE SETS: all six ratified sets, each mounted
 * exactly as its own `04` mounts it (`buildGameSet`'s pattern from
 * `src/pages/mount.ts` — placement row for the rung, then TRANSLATE ONLY
 * by the deck's frame offset; the dressing passes are plain code inside
 * each `build`, deterministic at any transform — the art note's cause-A
 * finding: the pass was ABSENT, never cheapened). On top of the mount:
 *
 * - THE DOLLHOUSE CUT (§5's honest cost a): at cross-section altitudes a
 *   set's big backdrop geometry (walls, floor discs, slabs — the mock's
 *   bbox rule, > 0.85 m wide/deep or > 0.45 m tall) reads as a flat colour
 *   band across the section, so the mount culls it and the deck wears a
 *   painted-wood SHELF (the room's own `ground` token) instead of the disc.
 * - THE WINDOW = THE DOORFRAME (plan line 3): painted-wood posts in the
 *   room's dominant, an accent lintel and a forward sill plank (the sill
 *   the `windowSillLine` star read belongs on) standing at the deck centre.
 * - ONE HOUSE, ONE KEY (cause B): the World's default white rig is removed
 *   and replaced by a single warm key with a house-scaled shadow box; the
 *   per-room rigs survive as the MATERIAL fill bands (one strong light at
 *   one time of day — the art bible's §Light law at house scale).
 * - `setCameraSolids` runs HOUSE-WIDE: every mounted set's leaf boxes, the
 *   union the house camera clamps its eye against (`house-camera.ts`).
 *
 * RENDER LAYER ONLY, and the law that keeps the receipts: nothing here
 * touches `World`, the colliders or `hashedBodies` — the sets arrive AFTER
 * `World.create` as plain scene groups, so `replay:all` 30/30 and the
 * house's `6caea49b` are byte-identical with or without the mount (the
 * hash-neutrality referee).
 */
import * as THREE from 'three';
import { createLightingRig, applyKeyLight, type LightingRig } from '../render/lighting.ts';
import { SET_TOKENS, darken } from '../render/tokens.ts';
import { paintedWood } from '../render/materials.ts';
import { toyBlock } from '../render/geometry.ts';
import { SETS } from '../sets/index.ts';
import { placeSet } from '../world/setPlacement.ts';
import { setCameraSolids } from './mount.ts';
import { GLOBAL_TOKENS } from '../render/tokens.ts';
import type { Deck, HouseLayout } from '../world/house-frame.ts';
import type { SetId } from '../render/tokens.ts';

/** THE DOLLHOUSE CUT thresholds — the mock's bbox rule, verbatim
 *  (`house-window-mock.ts`): a mesh whose WORLD box is wider/deeper than
 *  0.85 m or taller than 0.45 m is backdrop geometry at section altitudes. */
export const DOLLHOUSE_CUT = { wide: 0.85, tall: 0.45 };

/** The one key: the studio's breakfast light (GLOBAL keyLight) from the
 *  stock rig direction, on a shadow box wide enough to cover the section
 *  (the per-set 1.2 m ortho is a room's; the house's is the section's). */
export const HOUSE_KEY = { intensity: 1.3, dir: [0.9, 0.55, 0.6], extent: 12, dist: 14 } as const;

function shadowed(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      // films (wet-patch/wet-drip/oil-drip planes) never CAST — a puddle's
      // film has no body to shadow, the same law the guard walker keeps
      o.castShadow = !o.name.includes('film');
      o.receiveShadow = true;
    }
  });
}

/** THE DOLLHOUSE CUT — the mock's bbox rule, applied to a mounted set
 *  group AFTER the deck translation (world boxes, no naming authority the
 *  production pass had to invent; §5's stated cost). Deterministic. */
export function dollhouseCut(group: THREE.Object3D): void {
  const box = new THREE.Box3();
  const victims: THREE.Object3D[] = [];
  group.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const geo = o.geometry.clone();
    geo.computeBoundingBox();
    if (geo.boundingBox) {
      box.copy(geo.boundingBox).applyMatrix4(o.matrixWorld);
      const s = box.getSize(new THREE.Vector3());
      if (Math.max(s.x, s.z) > DOLLHOUSE_CUT.wide || s.y > DOLLHOUSE_CUT.tall) victims.push(o);
    }
    geo.dispose();
  });
  for (const v of victims) v.parent?.remove(v);
}

/** THE WINDOW = THE ROOM'S OWN DOORFRAME (plan line 3, the §5 mock's
 *  measurements with the one fix the mock left floating: the lintel sits
 *  ON the post heads). Painted-wood posts in the set's DOMINANT flanking
 *  the deck centre, an accent lintel, and a forward SILL PLANK — the sill
 *  the star line belongs on, now geometry the room's dressing owns. */
export function doorframe(room: SetId, cx: number, cy: number, cz: number, T = SET_TOKENS): THREE.Group {
  const g = new THREE.Group();
  g.name = `doorframe-${room}`;
  const wood = paintedWood(T[room], T[room].dominant);
  const trim = paintedWood(T[room], T[room].accent);
  const W = 0.62;
  const H = 0.42;
  // the frame STANDS ON the deck shelf: the sill line sits flush to the
  // shelf top plane (its plank at deck.center.y − 0.075), posts from there
  const base = cy - 0.1175;
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(toyBlock(0.05, H, 0.06, 0.012), wood);
    post.position.set(cx + (s * W) / 2, base + H / 2, cz);
    g.add(post);
  }
  const lintel = new THREE.Mesh(toyBlock(W + 0.12, 0.055, 0.07, 0.014), trim);
  lintel.position.set(cx, base + H + 0.0275, cz);
  g.add(lintel);
  const sill = new THREE.Mesh(toyBlock(W + 0.16, 0.03, 0.11, 0.01), wood);
  sill.position.set(cx, base - 0.015, cz + 0.03);
  g.add(sill);
  return g;
}

/** The deck's room SHELF — the cut floor disc's replacement (§5 cost a):
 *  the room's own `ground` token as a painted-wood shelf plank. */
function deckShelf(deck: Deck, T = SET_TOKENS): THREE.Mesh {
  const room = deck.room as SetId;
  const shelf = new THREE.Mesh(
    toyBlock(
      Math.max(deck.bounds.max[0] - deck.bounds.min[0], 0.6) + 0.28,
      0.035,
      0.58,
      0.012,
    ),
    paintedWood(T[room], T[room].ground),
  );
  shelf.position.set(deck.center[0], deck.center[1] - 0.075, deck.center[2] + 0.12);
  shelf.name = `shelf-${deck.room}`;
  return shelf;
}

export interface HouseSets {
  /** The mounted set groups (page order = descent order). */
  groups: THREE.Group[];
  /** `setCameraSolids` HOUSE-WIDE — the union of the six sets' leaf boxes. */
  solids: THREE.Box3[];
  /** The single key the scene gained (declare it to car/ghost rigs). */
  key: THREE.DirectionalLight;
}

/**
 * Mount the six ratified sets on the layout's decks in `scene` — the
 * dressing pass re-run at frame offsets. Also swaps the World's default
 * white rig for the one warm key (cause B) and re-surfaces the Lambert
 * `table` as painted wood (cause F — the grey slab retires).
 */
export async function mountHouseSets(scene: THREE.Scene, layout: HouseLayout): Promise<HouseSets> {
  // THE ONE KEY (cause B): the World's AmbientLight 0.85 + white
  // DirectionalLight 1.1 are the shell's set-less default — the house
  // replaces them with a single warm key the sets' toon bands declare
  // (art bible §Light, the mock's reference frame).
  for (const light of [...scene.children]) {
    if (light instanceof THREE.AmbientLight || light instanceof THREE.DirectionalLight) scene.remove(light);
  }
  const key = new THREE.DirectionalLight(GLOBAL_TOKENS.keyLight, HOUSE_KEY.intensity);
  const [kx, ky, kz] = HOUSE_KEY.dir;
  const mid = new THREE.Vector3();
  for (const d of layout.decks) mid.add(new THREE.Vector3(...d.center));
  mid.multiplyScalar(1 / layout.decks.length);
  key.position.set(mid.x + kx * HOUSE_KEY.dist, mid.y + ky * HOUSE_KEY.dist, mid.z + kz * HOUSE_KEY.dist);
  key.target.position.copy(mid);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const ext = HOUSE_KEY.extent;
  key.shadow.camera.left = -ext;
  key.shadow.camera.right = ext;
  key.shadow.camera.top = ext * 0.6;
  key.shadow.camera.bottom = -ext * 0.6;
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = HOUSE_KEY.dist * 3;
  // house-scale bias pair: the per-set values speckle at a 24 m ortho
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key, key.target);

  const groups: THREE.Group[] = [];
  const solids: THREE.Box3[] = [];
  let keyDeclared = false;
  for (const deck of layout.decks) {
    const room = deck.room as SetId;
    const reg = SETS[room]!;
    // the material rig: the mock's indoor fill recipe per room (one house,
    // one time of day — the per-room suns are the per-set cameras' story)
    const rig: LightingRig = createLightingRig(SET_TOKENS[room], {
      accentMix: 0.4,
      fillStrength: 0.07,
      keyIntensity: HOUSE_KEY.intensity,
      keyPosition: HOUSE_KEY.dir,
    });
    if (!keyDeclared) {
      void key.color; // the scene's ONE key is `key`; the rigs are fill bands
      keyDeclared = true;
    }
    // THE CAMPAIGN PATTERN (`src/pages/mount.ts` `buildGameSet`): the set
    // mounts where its `04` mounts it, then rides the deck's translation.
    const instance = await reg.build(THREE, { rig });
    const placement = reg.placement(deck.rung);
    if (placement) placeSet(instance.group, placement);
    instance.group.position.x += deck.x;
    instance.group.position.y += deck.alt;
    instance.group.updateMatrixWorld(true);
    dollhouseCut(instance.group);
    shadowed(instance.group);
    scene.add(instance.group);
    applyKeyLight(instance.group, rig);
    groups.push(instance.group);
    solids.push(...setCameraSolids(instance.group));

    // the deck's shelf and its doorframe (the cut's stated replacement and
    // the architecture the windows stop wearing as paper)
    const shelf = deckShelf(deck);
    shadowed(shelf);
    scene.add(shelf);
    const frame = doorframe(room, deck.center[0], deck.center[1] + 0.06, deck.center[2] + 0.26);
    shadowed(frame);
    scene.add(frame);
  }

  // THE TABLE, NOT THE VOID (cause F — the boot's T1.2 swap, the price the
  // house page never paid): the scaled Lambert slab becomes painted wood.
  surfaceHouseTable(scene);

  // the world slab and the decks' own track ride the key too; the slab
  // keeps the shell's shadow-catcher role (it is what breaks the fill
  // band on the big plane) but wears a REDUCED fill gain — see
  // `surfaceHouseTable` (cause F, house-scale half)
  const track = scene.getObjectByName('track');
  if (track) shadowed(track);
  const table = scene.getObjectByName('table');
  if (table) table.receiveShadow = true;

  return { groups, solids, key };
}

/** The painted-wood table swap the campaign shell already contains
 *  (program T1.2): the grey Lambert slab (never-list) retires as the
 *  kitchen-token wood the boot mounts with. */
export function surfaceHouseTable(scene: THREE.Scene, T = SET_TOKENS): void {
  const table = scene.getObjectByName('table');
  if (table instanceof THREE.Mesh) {
    table.receiveShadow = true;
    const t = T.kitchen;
    // The shell's tone plus one house-scale adaptation: on a 20 m platter
    // the GROUND-SIDE fill band alone almost whitens the wood (the toon
    // fill is directional ambient — every upward face gets it at full
    // gain), so the table material rides a reduced fill gain; without it
    // the slab blew to flat orange PAPER at section altitude (cause F,
    // house-scale half). Shadow-catching stays — it is what BREAKS the
    // band once the decks shade their patch of floor.
    table.material = paintedWood(t, darken(t.ground, 0.06), {
      fillHigh: t.fillHigh,
      fillLow: t.fillLow,
      shadowTint: t.shadowTint,
      fillStrength: 0.1,
      grain: 0.5,
      grainScale: 0.02,
    });
  }
}

/** THE HOUSE'S FACE (SET_TOKENS backgrounds, the campaign shell's law at
 *  house scale): the cross-section wears the kitchen's token background
 *  (the house's established face — the par ghost's token row), a room the
 *  crane is PARKED at wears its own, and the fog breathes the same colour
 *  it fogs toward (one paint, one haze). Render-side only. */
export function setHouseFace(scene: THREE.Scene, fog: THREE.FogExp2 | null, room: SetId | null): void {
  const bg = new THREE.Color(SET_TOKENS[room ?? 'kitchen'].background);
  scene.background = bg;
  if (fog) fog.color = bg;
}
