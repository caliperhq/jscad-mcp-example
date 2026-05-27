'use strict'
const { primitives, booleans, transforms, extrusions } = require('@jscad/modeling')
const { cylinder, polygon } = primitives
const { union, subtract } = booleans
const { translate, rotate } = transforms
const { extrudeLinear } = extrusions

/** Connecting rod: I-beam shaft + small end (wrist pin) + big end (crank journal). */
const buildConrod = (p) => {
  const r = p.stroke / 2
  const L = p.conrodLength
  const thetaRad = (p.crankAngle * Math.PI) / 180

  // Crank pin (big-end center) position relative to crank center (block z = 0)
  const crankPinX = 0  // crank rotates in y-z plane; we simplify to inline
  const crankPinY = r * Math.sin(thetaRad)
  const crankPinZ = r * Math.cos(thetaRad) - r   // crank center at z = -r (below bore)

  // Small-end (wrist pin) position: directly above on bore axis
  const wristY = 0
  const wristZ = crankPinZ + Math.sqrt(L * L - (r * Math.sin(thetaRad)) ** 2)

  // Approximate rod profile: I-beam in y-z plane, thin in x
  const dy = wristY - crankPinY
  const dz = wristZ - crankPinZ
  const len = Math.hypot(dy, dz)
  // Angle to rotate the polygon (built along +y) about X so its local +y
  // points from big-end toward wrist. atan2(dz, dy), not atan2(dy, dz).
  const angleDeg = (Math.atan2(dz, dy) * 180) / Math.PI

  const iBeam = polygon({ points: [
    [-3, 0], [-3, 6], [-1, 6], [-1, len - 6], [-3, len - 6], [-3, len],
    [ 3, len], [ 3, len - 6], [ 1, len - 6], [ 1, 6], [ 3, 6], [ 3, 0]
  ] })
  const shaft = extrudeLinear({ height: 6 }, iBeam)
  // Anchor the rotated I-beam at the big-end (crank pin). Without the y/z
  // translate it sits at world origin and the shaft floats off the engine.
  const positioned = translate(
    [-3, crankPinY, crankPinZ],
    rotate([angleDeg * Math.PI / 180, 0, 0], shaft)
  )

  // Big and small ends are bearings that wrap the crank pin and the wrist
  // pin. Both pins run along the X axis (parallel to the crankshaft's
  // rotation axis), so the bearing cylinders must be oriented along X too,
  // not the default Z. Without this they cross the pins at a single line
  // and the conrod reads as disconnected from the crank.
  const bigEnd = translate([0, crankPinY, crankPinZ],
    rotate([0, Math.PI / 2, 0], cylinder({ radius: 9, height: 12, segments: 48 })))
  const smallEnd = translate([0, wristY, wristZ],
    rotate([0, Math.PI / 2, 0], cylinder({ radius: 6, height: 10, segments: 32 })))

  return union(positioned, bigEnd, smallEnd)
}

module.exports = { buildConrod }
