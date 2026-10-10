// ROUND-2 LANE D — the FLARE PROBE. A synthetic bloom gate, not a set: two
// emissive discs on a dark deck, one the size of the flagged small whites
// (a 4.4 mm disc ≈ the duck specular / goal pin / lamp-post flare / sprinkler
// dot at play-camera distance) and one area source (a 100 mm disc ≈ the sun
// disc / blade ribbon). Rendered through the real post stack (`post=on`,
// quality=high) the small disc's BLOOM SPREAD — how far its glow lifts the
// surround above the deck — is measured from the pixels by
// `tests/e2e/bloom-flare.spec.ts`, which re-checks the spread number stated
// in `Sessions/2026-10-11 Round2 bloom.md`. This exists because the never-
// list ban must hold in MID-RUN frames, not just stills: the census/histogram
// harness measures what a frame contains, the probe measures what the bloom
// pass ADDS around a dot, which is the half of the law the stills never saw.
//
// The discs are MeshBasicMaterial at white — the pass's threshold reads the
// buffer, not the material, so no shader term can excuse the flare. The
// scene exposes `window.__flareProbe` = the projected centres/radii in
// canvas px so the spec measures annuli without guessing.

import * as THREE from 'three'
import { registerScene, type SceneEntry, type SceneFactory } from '../registry.ts'

/** Disc radii, set-space metres (the probe is authored at play scale). */
const SMALL_R = 0.0022 // ~13 px across at the hero rig — the 5 mm dot class
const LARGE_R = 0.05 // ~295 px across — the area-source control

/** Deck-to-disc stand distance along the rig's view axis. */
const STAND_Z = 0

function flareProbeScene(): SceneFactory {
  return (ctx): SceneEntry => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1c1e20')

    const deck = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ color: '#2a2c2e' }),
    )
    deck.rotation.x = -Math.PI / 2
    deck.position.y = -0.02
    scene.add(deck)

    const disc = (r: number, x: number): THREE.Mesh => {
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(r, 48),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1) }),
      )
      m.position.set(x, 0.05, STAND_Z)
      scene.add(m)
      return m
    }
    const small = disc(SMALL_R, -0.055)
    const large = disc(LARGE_R, 0.075)

    const camera = new THREE.PerspectiveCamera(ctx.rig.fov, 1600 / 900, ctx.rig.near, ctx.rig.far)
    camera.position.set(...ctx.rig.position)
    camera.lookAt(...ctx.rig.target)
    camera.updateMatrixWorld(true)

    // Project both centres for the pixel-side measurement (canvas px,
    // top-left origin, 1600x900 — the canonical harness frame).
    const project = (m: THREE.Mesh): { x: number; y: number; rPx: number } => {
      const c = m.position.clone().project(camera)
      const d = camera.position.distanceTo(m.position)
      const rPx = ((m.geometry as THREE.CircleGeometry).parameters.radius /
        (2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))) *
        900
      return { x: (c.x * 0.5 + 0.5) * 1600, y: (1 - (c.y * 0.5 + 0.5)) * 900, rPx }
    }
    ;(window as unknown as Record<string, unknown>).__flareProbe = {
      small: project(small),
      large: project(large),
    }

    return {
      scene,
      camera,
      // band on the small disc: the probe measures the bloom pass, not the
      // tilt — the control must not be defocus-smeared into the annulus
      focus: [-0.055, 0.05, STAND_Z],
    }
  }
}

registerScene('flare-probe', flareProbeScene())
