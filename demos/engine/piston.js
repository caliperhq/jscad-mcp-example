'use strict'
const { primitives, booleans, transforms } = require('@jscad/modeling')
const { cylinder, torus } = primitives
const { subtract, union } = booleans
const { translate } = transforms

/**
 * Piston positioned by crankAngle: vertical position is
 *   y_piston = r*cos(theta) + sqrt(L^2 - (r*sin(theta))^2)   (slider-crank kinematics)
 * with r = stroke/2 and L = conrodLength. Result is the crown height above
 * crank center; we offset so TDC sits just below the head dome.
 */
const buildPiston = (p) => {
  const r = p.stroke / 2
  const L = p.conrodLength
  const thetaRad = (p.crankAngle * Math.PI) / 180
  const yp = r * Math.cos(thetaRad) + Math.sqrt(L * L - (r * Math.sin(thetaRad)) ** 2)
  // Re-frame so TDC (theta=0, yp = r+L) places crown just under head dome.
  const blockHeight = p.stroke + 60
  const headZ = blockHeight - 20
  const tdcCrownZ = headZ - 8   // 8mm crown clearance
  const crownZ = tdcCrownZ - ((r + L) - yp)

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
