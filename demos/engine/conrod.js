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
  const angleDeg = (Math.atan2(dy, dz) * 180) / Math.PI

  const iBeam = polygon({ points: [
    [-3, 0], [-3, 6], [-1, 6], [-1, len - 6], [-3, len - 6], [-3, len],
    [ 3, len], [ 3, len - 6], [ 1, len - 6], [ 1, 6], [ 3, 6], [ 3, 0]
  ] })
  const shaft = extrudeLinear({ height: 6 }, iBeam)
  const positioned = translate([-3, 0, 0],
    rotate([angleDeg * Math.PI / 180, 0, 0], shaft))

  const bigEnd = translate([0, crankPinY, crankPinZ],
    cylinder({ radius: 8, height: 8, segments: 48 }))
  const smallEnd = translate([0, wristY, wristZ],
    cylinder({ radius: 5, height: 8, segments: 32 }))

  return union(positioned, bigEnd, smallEnd)
}

module.exports = { buildConrod }
