'use strict'
const { primitives, booleans, transforms } = require('@jscad/modeling')
const { cylinder, cuboid } = primitives
const { union } = booleans
const { translate, rotate } = transforms

/** Simplified crank: main journal + offset crank pin + counterweight. */
const buildCrankshaft = (p) => {
  const r = p.stroke / 2
  const thetaRad = (p.crankAngle * Math.PI) / 180
  const crankCenterZ = -r

  // Main journal: axis along X (perpendicular to the Y-Z plane the pin
  // orbits in). Conrod.js puts the crank pin at (0, r·sinθ, -r+r·cosθ),
  // so the rotation axis is X. The journal length is sized to read in
  // the cutaway view — one end emerges from the +X cutaway face, the
  // other extends a short way into the crankcase.
  const journalLength = p.bore + 10
  const mainJournal = translate([0, 0, crankCenterZ],
    rotate([0, Math.PI / 2, 0], cylinder({ radius: 12, height: journalLength, segments: 48 })))

  // Crank pin at the rotating offset position, axis also along X
  const pinY = r * Math.sin(thetaRad)
  const pinZ = crankCenterZ + r * Math.cos(thetaRad)
  const pin = translate([0, pinY, pinZ],
    rotate([0, Math.PI / 2, 0], cylinder({ radius: 8, height: 18, segments: 32 })))

  // Counterweight: thin slab in the Y-Z rotation plane (X = journal axis),
  // positioned opposite the pin. Roughly square in Y-Z so it reads as a
  // crank web rather than a long arm.
  const cwY = -r * 0.6 * Math.sin(thetaRad)
  const cwZ = crankCenterZ - r * 0.6 * Math.cos(thetaRad)
  const counterweight = translate([0, cwY, cwZ],
    cuboid({ size: [14, r * 0.9, r * 0.9] }))

  return union(mainJournal, pin, counterweight)
}

module.exports = { buildCrankshaft }
