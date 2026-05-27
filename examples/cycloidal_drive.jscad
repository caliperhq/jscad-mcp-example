'use strict'

// jscad-mcp demo: Cycloidal drive reducer
// ----------------------------------------
// Three-part cycloidal speed reducer: eccentric input, cycloidal disc, fixed pin housing.
// Reduction ratio = (pinCount - 1) : 1.
//
// Lead MCP feature: named parts. Try:
//   list_parts            -> {eccentric_input, cycloid_disc, pin_housing, output_pins}
//   highlight cycloid_disc -> lobed profile pops out of the assembly
//   label_parts           -> annotated diagram
//   slice z=mid           -> eccentricity visible

const { primitives, booleans, transforms, extrusions } = require('@jscad/modeling')
const { cuboid, cylinder, polygon } = primitives
const { union, subtract } = booleans
const { translate, rotate } = transforms
const { extrudeLinear } = extrusions
const { cycloidProfile } = require('./lib/cycloid')

const DEFAULTS = {
  pinCount: 12,
  eccentricity: 1.5,
  discDiameter: 60,
  discThickness: 8,
  pinRadius: 2.5
}

const getParameterDefinitions = () => [
  { name: 'pinCount',      type: 'int',    initial: 12,  min: 6,  max: 24, step: 1,   caption: 'Pin count (reduction = N-1:1)' },
  { name: 'eccentricity',  type: 'number', initial: 1.5, min: 0.5, max: 4, step: 0.1, caption: 'Eccentricity (mm)' },
  { name: 'discDiameter',  type: 'number', initial: 60,  min: 30, max: 120, step: 1,  caption: 'Disc diameter (mm)' },
  { name: 'discThickness', type: 'number', initial: 8,   min: 4,  max: 20,  step: 1,  caption: 'Disc thickness (mm)' },
  { name: 'pinRadius',     type: 'number', initial: 2.5, min: 1,  max: 6,   step: 0.5,caption: 'Roller pin radius (mm)' }
]

// --- placeholders, filled in by later tasks ---
const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }

  const pinCircleRadius = p.discDiameter / 2 - p.pinRadius * 1.5
  const discProfile = cycloidProfile({
    pinCount: p.pinCount,
    pinCircleRadius,
    eccentricity: p.eccentricity,
    pinRadius: p.pinRadius,
    samples: 360
  })
  const discFlat = polygon({ points: discProfile })
  const discSolid = extrudeLinear({ height: p.discThickness }, discFlat)

  // Output-pin holes: circle of N-1 holes near the center, oversized for eccentric motion.
  // Hole-circle radius is sized so (N-1) holes of outputHoleRadius don't overlap:
  // arc spacing = 2π·R/(N-1) must exceed 2·outputHoleRadius. discDiameter * 0.27 keeps
  // ~1mm of disc material between adjacent holes at the default pinCount.
  const outputHoleRadius = p.pinRadius * 1.6
  const outputHoleCircleRadius = p.discDiameter * 0.27
  const outputHoles = []
  for (let i = 0; i < p.pinCount - 1; i++) {
    const a = (i / (p.pinCount - 1)) * 2 * Math.PI
    outputHoles.push(translate(
      [Math.cos(a) * outputHoleCircleRadius, Math.sin(a) * outputHoleCircleRadius, -1],
      cylinder({ radius: outputHoleRadius, height: p.discThickness + 2, segments: 48 })
    ))
  }

  // Center bore for the eccentric
  const centerBore = cylinder({
    radius: p.discDiameter * 0.08, height: p.discThickness + 2, segments: 64
  })

  const cycloid_disc = translate(
    [p.eccentricity, 0, 0],
    subtract(discSolid, union(...outputHoles, centerBore))
  )

  // --- Pin housing: annular ring + arrayed cylindrical pins ---
  const housingOuterR = p.discDiameter / 2 + p.pinRadius * 4
  const housingHeight = p.discThickness + 4
  const housingRing = subtract(
    cylinder({ radius: housingOuterR, height: housingHeight, segments: 96 }),
    cylinder({ radius: pinCircleRadius + p.pinRadius * 1.1, height: housingHeight + 2, segments: 96 })
  )
  const housingPins = []
  for (let i = 0; i < p.pinCount; i++) {
    const a = (i / p.pinCount) * 2 * Math.PI
    housingPins.push(translate(
      [Math.cos(a) * pinCircleRadius, Math.sin(a) * pinCircleRadius, 0],
      cylinder({ radius: p.pinRadius, height: housingHeight, segments: 32 })
    ))
  }
  const pin_housing = translate([0, 0, -2], union(housingRing, ...housingPins))

  // --- Eccentric input: central shaft + offset bearing cylinder ---
  const shaft = cylinder({
    radius: p.discDiameter * 0.05, height: housingHeight + 20, segments: 48
  })
  const bearing = translate(
    [p.eccentricity, 0, 0],
    cylinder({ radius: p.discDiameter * 0.075, height: p.discThickness, segments: 48 })
  )
  const eccentric_input = translate([0, 0, -8], union(shaft, bearing))

  // --- Output pins: protrude up through disc holes ---
  const outputPinsArr = []
  const outputPinR = p.pinRadius * 0.8
  for (let i = 0; i < p.pinCount - 1; i++) {
    const a = (i / (p.pinCount - 1)) * 2 * Math.PI
    outputPinsArr.push(translate(
      [Math.cos(a) * outputHoleCircleRadius, Math.sin(a) * outputHoleCircleRadius, p.discThickness],
      cylinder({ radius: outputPinR, height: 6, segments: 32 })
    ))
  }
  const outputPlate = translate(
    [0, 0, p.discThickness + 5.5],
    cylinder({ radius: p.discDiameter * 0.3, height: 1, segments: 64 })
  )
  const output_pins = [...outputPinsArr, outputPlate]

  return {
    eccentric_input: [eccentric_input],
    cycloid_disc:    [cycloid_disc],
    pin_housing:     [pin_housing],
    output_pins:     output_pins
  }
}

const _defaultParts = buildAll({})

const main = (params = {}) => {
  const all = buildAll(params)
  return [
    ...all.pin_housing, ...all.cycloid_disc,
    ...all.eccentric_input, ...all.output_pins
  ]
}

module.exports = { main, parts: _defaultParts, getParameterDefinitions }
