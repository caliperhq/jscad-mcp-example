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

  // Main journal (along Y axis, runs through the engine width)
  const blockSide = p.bore + 30
  const mainJournal = translate([0, 0, crankCenterZ],
    rotate([Math.PI / 2, 0, 0], cylinder({ radius: 12, height: blockSide, segments: 48 })))

  // Crank pin at the rotating offset position
  const pinY = r * Math.sin(thetaRad)
  const pinZ = crankCenterZ + r * Math.cos(thetaRad)
  const pin = translate([0, pinY, pinZ],
    rotate([Math.PI / 2, 0, 0], cylinder({ radius: 8, height: 18, segments: 32 })))

  // Counterweight (slab opposite the crank pin)
  const cwY = -r * 0.6 * Math.sin(thetaRad)
  const cwZ = crankCenterZ - r * 0.6 * Math.cos(thetaRad)
  const counterweight = translate([0, cwY, cwZ],
    cuboid({ size: [16, r * 1.4, r * 0.8] }))

  return union(mainJournal, pin, counterweight)
}

module.exports = { buildCrankshaft }
