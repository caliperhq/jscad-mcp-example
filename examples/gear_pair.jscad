'use strict'

// jscad-mcp demo: Spur gear pair (cosine-modulated tooth profile)
// ----------------------------------------
// Two meshing gears with the same module, different tooth counts. The
// tooth profile is a smooth cosine modulation of the radius about the
// pitch circle — not a true involute, but enough to demonstrate proper
// meshing geometry (centers spaced by r_pA + r_pB, second gear rotated
// so its valley lines up with the first gear's peak at the line of
// centers).
//
// Try in browser:
//   https://openjscad.xyz/?uri=https://raw.githubusercontent.com/caliperhq/jscad-mcp-example/main/examples/gear_pair_bundled.jscad

const { primitives, booleans, transforms, extrusions, colors } = require('@jscad/modeling')
const { cylinder, polygon } = primitives
const { union, subtract } = booleans
const { translate, rotateZ } = transforms
const { extrudeLinear } = extrusions
const { colorize } = colors
const { gearProfile, pitchRadius, meshRotation } = require('./lib/gear')

const DEFAULTS = {
  module:    2,
  teethA:    24,
  teethB:    13,
  thickness: 8,
  boreA:     6,
  boreB:     4
}

const getParameterDefinitions = () => [
  { name: 'module',    type: 'number', initial: 2,  min: 0.5, max: 6,  step: 0.5, caption: 'Module (mm; tooth size)' },
  { name: 'teethA',    type: 'int',    initial: 24, min: 8,   max: 60, step: 1,   caption: 'Gear A teeth' },
  { name: 'teethB',    type: 'int',    initial: 13, min: 8,   max: 60, step: 1,   caption: 'Gear B teeth' },
  { name: 'thickness', type: 'number', initial: 8,  min: 2,   max: 20, step: 0.5, caption: 'Thickness (mm)' },
  { name: 'boreA',     type: 'number', initial: 6,  min: 1,   max: 20, step: 0.5, caption: 'Gear A bore diameter (mm)' },
  { name: 'boreB',     type: 'number', initial: 4,  min: 1,   max: 20, step: 0.5, caption: 'Gear B bore diameter (mm)' }
]

const PART_COLORS = {
  gear_a: [0.78, 0.55, 0.30, 1], // brass
  gear_b: [0.55, 0.58, 0.62, 1]  // steel
}

const buildGear = (teeth, m, thickness, boreDiameter) => {
  const profile = polygon({ points: gearProfile({ teeth, module: m }) })
  const body = extrudeLinear({ height: thickness }, profile)
  const bore = cylinder({
    radius: boreDiameter / 2,
    height: thickness + 2,
    center: [0, 0, thickness / 2],
    segments: 48
  })
  return subtract(body, bore)
}

const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }
  const rA = pitchRadius(p.teethA, p.module)
  const rB = pitchRadius(p.teethB, p.module)
  const center2X = rA + rB

  const gearA = buildGear(p.teethA, p.module, p.thickness, p.boreA)
  const gearB = translate(
    [center2X, 0, 0],
    rotateZ(meshRotation(p.teethB), buildGear(p.teethB, p.module, p.thickness, p.boreB))
  )

  return {
    gear_a: [colorize(PART_COLORS.gear_a, gearA)],
    gear_b: [colorize(PART_COLORS.gear_b, gearB)]
  }
}

const _defaultParts = buildAll({})

const main = (params = {}) => Object.values(buildAll(params)).flat()

module.exports = { main, parts: _defaultParts, getParameterDefinitions }
