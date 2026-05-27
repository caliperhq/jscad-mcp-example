'use strict'
const { primitives, booleans, transforms } = require('@jscad/modeling')
const { cylinder, torus } = primitives
const { subtract, union } = booleans
const { translate } = transforms

/**
 * Piston positioned by crankAngle. Wrist pin sits inside the piston at
 * z = wristZ (per slider-crank kinematics); the crown sits above it by
 * COMPRESSION_HEIGHT. This is the physically-correct layout — the
 * earlier version put the crown below the wrist, so the conrod's
 * small-end stuck up through the piston top.
 */
const COMPRESSION_HEIGHT = 14   // mm from wrist-pin centerline to crown

const buildPiston = (p) => {
  const r = p.stroke / 2
  const L = p.conrodLength
  const thetaRad = (p.crankAngle * Math.PI) / 180

  // Slider-crank wrist position (same formula as conrod.js)
  const yp = r * Math.cos(thetaRad) + Math.sqrt(L * L - (r * Math.sin(thetaRad)) ** 2)
  const wristZ = -r + yp   // crank center is at z = -r
  const crownZ = wristZ + COMPRESSION_HEIGHT

  const pistonHeight = p.bore * 0.7
  const ringGroove1Z = crownZ - 4
  const ringGroove2Z = crownZ - 8
  const ringGroove3Z = crownZ - 12

  const body = translate([0, 0, crownZ - pistonHeight / 2],
    cylinder({ radius: p.bore / 2 - 0.5, height: pistonHeight, segments: 64 }))
  const groove = (z) => translate([0, 0, z],
    torus({
      innerRadius: 0.8, outerRadius: p.bore / 2,
      innerSegments: 16, outerSegments: 64
    }))

  return subtract(body, union(groove(ringGroove1Z), groove(ringGroove2Z), groove(ringGroove3Z)))
}

module.exports = { buildPiston }
