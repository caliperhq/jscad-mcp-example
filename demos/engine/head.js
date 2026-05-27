'use strict'
const { primitives, booleans, transforms } = require('@jscad/modeling')
const { cuboid, cylinder, sphere } = primitives
const { union, subtract } = booleans
const { translate, rotate } = transforms

/**
 * Cylinder head: rectangular slab on top of the block, with combustion chamber
 * dome subtracted, plus valve guide bores and spark plug well.
 * Includes the same +X cutaway as the block.
 */
const buildHead = (p) => {
  const headThick = 24
  const blockSide = p.bore + 30
  const blockHeight = p.conrodLength + 40   // must match block.js
  const headZBottom = blockHeight - 20
  const cutawayDepth = blockSide / 2 + 1

  // Combustion chamber volume derived from compression ratio.
  // V_swept = pi * (bore/2)^2 * stroke; V_clearance = V_swept / (CR-1)
  const sweptV     = Math.PI * (p.bore / 2) ** 2 * p.stroke
  const clearanceV = sweptV / (p.compressionRatio - 1)
  // Approximate the chamber as a spherical cap of radius bore/2:
  // V = (pi * h^2 * (3r - h)) / 3; solve for h given r=bore/2, V=clearanceV
  const r = p.bore / 2
  // Newton iterate a couple times for h:
  let h = clearanceV / (Math.PI * r * r)   // initial linear guess
  for (let i = 0; i < 5; i++) {
    const f  = (Math.PI * h * h * (3 * r - h)) / 3 - clearanceV
    const df = Math.PI * h * (2 * r - h)
    h -= f / df
  }

  const headBody = translate([0, 0, headZBottom + headThick / 2],
    cuboid({ size: [blockSide, blockSide, headThick] }))

  const dome = translate([0, 0, headZBottom + h - r],
    sphere({ radius: r, segments: 64 }))

  // Valve guide bores (intake on -Y side, exhaust on +Y side)
  const guideR = p.bore * 0.04
  const intakeGuide = translate([0, -p.bore * 0.22, headZBottom + headThick / 2],
    cylinder({ radius: guideR, height: headThick + 2, segments: 32 }))
  const exhaustGuide = translate([0,  p.bore * 0.22, headZBottom + headThick / 2],
    cylinder({ radius: guideR, height: headThick + 2, segments: 32 }))

  // Spark plug well: small offset cylinder
  const plugWell = translate([0, 0, headZBottom + headThick / 2],
    cylinder({ radius: p.bore * 0.06, height: headThick + 2, segments: 24 }))

  const cutaway = translate([cutawayDepth / 2 + 0.001, 0, headZBottom + headThick / 2],
    cuboid({ size: [cutawayDepth, blockSide + 2, headThick + 2] }))

  return subtract(headBody, union(dome, intakeGuide, exhaustGuide, plugWell, cutaway))
}

module.exports = { buildHead }
