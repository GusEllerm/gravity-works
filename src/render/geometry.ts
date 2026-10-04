// Shared procedural mesh generators owned by the material/render system
// (brief §8: extrusion, lathe, beveled box live here, used by every set).
// Scene units are meters at real scale; a 1:64 toy car is ~0.07 m long.
// All generators center on the origin in X/Z and rest on y = 0.

import * as THREE from 'three'

/**
 * Chunky beveled block: rounded rectangle footprint, chamfered top/bottom.
 * The toy-car / toy-brick workhorse.
 */
export function toyBlock(
  length: number,
  height: number,
  width: number,
  cornerRadius: number,
  bevel = Math.min(0.002, height * 0.25),
  curveSegments = 6,
): THREE.BufferGeometry {
  // ExtrudeGeometry grows the outline by bevelSize and the depth by 2x the
  // bevel thickness, so the seed shape is inset by the bevel: the result is
  // exactly length x width x height, resting on y = 0.
  const l = length / 2 - bevel - cornerRadius
  const w = width / 2 - bevel - cornerRadius
  const shape = new THREE.Shape()
  shape.moveTo(-l - cornerRadius, -w)
  shape.absarc(-l, -w, cornerRadius, Math.PI, (3 * Math.PI) / 2, false)
  shape.absarc(l, -w, cornerRadius, (3 * Math.PI) / 2, 0, false)
  shape.absarc(l, w, cornerRadius, 0, Math.PI / 2, false)
  shape.absarc(-l, w, cornerRadius, Math.PI / 2, Math.PI, false)
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments,
    steps: 1,
  })
  // Shape lies in XY and extrudes along +Z; stand it up so the footprint is XZ.
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, bevel, 0)
  geo.computeVertexNormals()
  return geo
}

/**
 * Cereal-bowl lathe form: parabolic walls from a small foot to an open rim.
 * Double-sided (interior wall visible), so give it a two-sided material.
 */
export function bowlForm(
  radius: number,
  height: number,
  wall = radius * 0.07,
  segments = 48,
  profileSegments = 10,
): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = []
  const footR = radius * 0.26
  const baseH = height * 0.05
  // interior: floor center up to the inner rim (parabolic wall)
  for (let i = 0; i <= profileSegments; i++) {
    const s = i / profileSegments
    const r = (radius - wall) * Math.sqrt(s)
    const y = baseH + (height - baseH) * (0.85 * s * s + 0.15 * s)
    pts.push(new THREE.Vector2(Math.max(r, 0.0001), y))
  }
  // rim top
  pts.push(new THREE.Vector2(radius - wall / 2, height + wall / 2))
  pts.push(new THREE.Vector2(radius, height))
  // exterior: outer wall down to the foot, resting on y = 0
  for (let i = profileSegments - 1; i >= 0; i--) {
    const s = i / profileSegments
    const r = footR + (radius - footR) * Math.sqrt(s)
    const y = height * s * (0.88 * s + 0.12)
    pts.push(new THREE.Vector2(Math.max(r, 0.0001), y))
  }
  // close across the base
  pts.push(new THREE.Vector2(0.0001, 0))
  const geo = new THREE.LatheGeometry(pts, segments)
  geo.computeVertexNormals()
  return geo
}

/**
 * Orange track segment: a U-channel extruded along its length — flat deck
 * rails either side of a recessed groove floor. Later stages extrude this
 * along the real track spline; this straight generator keeps the same
 * cross-section so mesh and collider stay one family.
 */
export function trackChannel(
  length: number,
  width = 0.055,
  wallThickness = 0.006,
  wallHeight = 0.012,
  floorThickness = 0.004,
): THREE.BufferGeometry {
  const hw = width / 2
  const inner = hw - wallThickness
  const shape = new THREE.Shape()
  shape.moveTo(-hw, 0)
  shape.lineTo(hw, 0)
  shape.lineTo(hw, wallHeight)
  shape.lineTo(inner, wallHeight)
  shape.lineTo(inner, floorThickness)
  shape.lineTo(-inner, floorThickness)
  shape.lineTo(-inner, wallHeight)
  shape.lineTo(-hw, wallHeight)
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: false,
    steps: 1,
  })
  geo.translate(0, 0, -length / 2)
  return geo
}
