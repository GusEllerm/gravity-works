/**
 * THE SET MOUNT (program T0.2, extracted verbatim from `src/boot.ts`): the
 * level-to-set decision (`levelSet`), the per-boot set builder
 * (`buildGameSet`, the dynamic-import mount of `src/sets/index.ts`), and the
 * named-prop box walkers that turn a mounted set into the builder's
 * placement guard and the run camera's solids. The boot's law travels with
 * it: a level must name a REGISTERED set to mount anything; the guard boxes
 * are cheap named boxes, never mesh tests; the camera reads LEAF-MESH
 * granularity (see `Modules/sets`, `Modules/camera`). `src/boot.ts`
 * re-exports the two guard entry points so its documented surface is
 * unchanged.
 */
import * as THREE from 'three';
import { isRegisteredSet, type SetInstance, type SetRegistration } from '../sets/index.ts';
import { placeSet } from '../world/setPlacement.ts';
import type { SetGuard } from '../ui/builder.ts';
import type { Level } from '../world/level.ts';

/** The set a level declares (`KitchenLevel.set` / any set-carrying level),
 *  structurally — the boot must not depend on the level modules' types to
 *  decide what to mount. It must also name a registered set: an unknown id
 *  mounts nothing (the pre-stage-3 empty-space render), never a wrong set. */
export function levelSet(level: Level): string | null {
  const set = (level as { set?: string }).set;
  return typeof set === 'string' && isRegisteredSet(set) ? set : null;
}

/** The named solid props of a built set as world-space NAMED boxes — the
 *  builder's placement-guard input (cheap: boxes, never mesh tests). Films
 *  and the counter floor are excluded: a wet patch must never block a piece,
 *  and the deck the track rides on is not an obstacle.
 *
 *  STAGE 6 (kitchen03's second wall): each box carries the NAME of the object
 *  that owns it, because the refusal line has to name the thing that refused
 *  the seat — "blocked — furniture is in the way" over the cereal bowl on a
 *  rung called "The Bowl" read to two strangers as "move the furniture"
 *  (playtests BB/DD). The name is the object's own path (`cereal-bowl`,
 *  `lazy-pencil/pencil-shaft`), which is the SAME naming convention the guard
 *  walker already uses to decide what is a solid; `solidWord` in
 *  `src/ui/builder.ts` turns it into the player words, and
 *  `tests/unit/named-props.test.ts` proves the authority: the guard's names
 *  and a walk of the mounted set's meshes agree box-for-box. */
export function setPlacementGuard(group: THREE.Group): SetGuard[] {
  return collectSetBoxes(group, false);
}

/** The same boxes at LEAF-MESH granularity — the run camera's input (stage 3
 *  "beige wall"). A named group's single AABB is the right placement
 *  contract ("no piece inside the tap") but too crude for a flypast: the
 *  TAP group's box spans column→spout-tip as one solid slab, and its
 *  bottom face cuts right through the sink lane the deck legally runs
 *  under — the camera would crane over a spout the car passes cleanly
 *  beneath. Leaf boxes are the actual solids: the column beside the lane,
 *  the spout above it, none of them on the corridor. */
export function setCameraSolids(group: THREE.Group): THREE.Box3[] {
  return collectSetBoxes(group, true).map((g) => g.box);
}

function collectSetBoxes(group: THREE.Group, leaves: boolean): SetGuard[] {
  const boxes: SetGuard[] = [];
  // Box3.setFromObject does not refresh PARENT matrices — a freshly repositioned
  // mount would otherwise box the props at their UNPLACED coordinates
  group.updateMatrixWorld(true);
  // The guard collects from the set's `dress` group by NAMING CONVENTION
  // (src/sets/index.ts §SetInstance): `counter`/`shell` are the floor/wall
  // surfaces outside the dress, `wet-patch-films` and anything named *film*
  // are never solids.
  const skip = new Set(['counter', 'shell', 'wet-patch-films']);
  const collect = (root: THREE.Object3D, path: string[]): void => {
    for (const child of root.children) {
      if (child.name.includes('film') || skip.has(child.name)) continue;
      const namedSolid =
        child.children.length === 0 || child.name === 'book-stack' || child.name === 'tap';
      if (leaves ? child.children.length === 0 : namedSolid) {
        // the object's PATH under the dress, joined with `/` — the mesh's own
        // name is often generic (`mug-body`), the group it hangs under is the
        // object a player would name (`mug`); `solidWord` reads the first
        path.push(child.name);
        boxes.push({ name: path.join('/'), box: new THREE.Box3().setFromObject(child) });
        path.pop();
        continue;
      }
      path.push(child.name);
      collect(child, path);
      path.pop();
    }
  };
  const dress = group.getObjectByName('dress');
  if (dress) collect(dress, []);
  return boxes;
}

/** Build a registered set once per game boot, mounted where this level wants
 *  it (a null placement = the set's canonical origin). */
export async function buildGameSet(reg: SetRegistration, levelId: string): Promise<SetInstance> {
  const placement = reg.placement(levelId);
  const instance = await reg.build(THREE);
  if (placement) placeSet(instance.group, placement);
  return instance;
}
