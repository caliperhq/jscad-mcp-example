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
  // TODO Task 1.3: cycloid_disc
  // TODO Task 1.4: pin_housing, eccentric_input, output_pins
  return { eccentric_input: [], cycloid_disc: [], pin_housing: [], output_pins: [] }
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
