// Harness scene `worldsmoke`: the `World` module's reify-to-mesh path with no
// physics and no clock — one build (the feel track placeholder) through
// `buildTrackMeshes`, plain materials, plus the car proxy parked at the level
// start socket. If this renders, the world module's geometry half works in
// the built page; the physics half is guarded headlessly (tests/unit).

import * as THREE from 'three'
import { FEELTRACK } from '../../world/levels/feeltrack.level.ts'
import { buildTrackMeshes } from '../../world/world.ts'
import { reify } from '../../track/build.ts'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

function worldsmokeScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#efe0c8')
    scene.add(new THREE.AmbientLight(0xffffff, 0.85))
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(1, 2, 1.5)
    scene.add(key)

    const build = FEELTRACK.placeholderBuild()
    scene.add(buildTrackMeshes(build))

    let lowest = FEELTRACK.startSocket.pos.y
    for (const spline of reify(build).splines) {
      for (const frame of spline.stationFrames()) lowest = Math.min(lowest, frame.pos.y)
    }
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshLambertMaterial({ color: '#e6d3b3' }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = lowest - 0.2
    scene.add(ground)

    const car = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.02, 0.035),
      new THREE.MeshLambertMaterial({ color: '#d7263d' }),
    )
    car.position.copy(FEELTRACK.startSocket.pos).addScaledVector(FEELTRACK.startSocket.up, 0.04)
    scene.add(car)

    const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 16 / 9, ctx.rig.near, ctx.rig.far)
    camera.position.set(...ctx.rig.position)
    camera.lookAt(new THREE.Vector3(...ctx.rig.target))
    return { scene, camera }
  }
}

registerScene('worldsmoke', worldsmokeScene())
