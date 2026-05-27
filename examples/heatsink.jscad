'use strict'

// jscad-mcp demo: Parametric heatsink fin array
// ----------------------------------------
// Rectangular base with N parallel fins. Fin count and spacing trade
// off against fin thickness; pushing fin count too high makes the
// spacing collapse below the printer's wall width, which the slice
// view exposes immediately. (Real engineering driver for the GPU
// waterblock that's described — but not vendored — at the bottom of
// this file.)
//
// Try in browser:
//   https://openjscad.xyz/?uri=https://raw.githubusercontent.com/caliperhq/jscad-mcp-example/main/examples/heatsink_bundled.jscad

const { primitives, booleans, transforms, colors } = require('@jscad/modeling')
const { cuboid } = primitives
const { union } = booleans
const { translate } = transforms
const { colorize } = colors

const DEFAULTS = {
  baseWidth:     60,
  baseDepth:     60,
  baseThickness: 4,
  finCount:      14,
  finHeight:     22,
  finThickness:  1.2,
  finMargin:     2    // edge-to-first-fin margin
}

const getParameterDefinitions = () => [
  { name: 'baseWidth',     type: 'number', initial: 60,  min: 20, max: 200, step: 1, caption: 'Base width X (mm)' },
  { name: 'baseDepth',     type: 'number', initial: 60,  min: 20, max: 200, step: 1, caption: 'Base depth Y (mm)' },
  { name: 'baseThickness', type: 'number', initial: 4,   min: 1,  max: 12,  step: 0.5, caption: 'Base thickness Z (mm)' },
  { name: 'finCount',      type: 'int',    initial: 14,  min: 2,  max: 60,  step: 1,   caption: 'Fin count' },
  { name: 'finHeight',     type: 'number', initial: 22,  min: 4,  max: 60,  step: 1,   caption: 'Fin height (mm)' },
  { name: 'finThickness',  type: 'number', initial: 1.2, min: 0.4, max: 4,   step: 0.1, caption: 'Fin thickness (mm)' },
  { name: 'finMargin',     type: 'number', initial: 2,   min: 0,  max: 10,  step: 0.5, caption: 'Edge → first fin margin (mm)' }
]

const PART_COLORS = {
  heatsink: [0.55, 0.62, 0.70, 1] // brushed aluminum
}

const buildHeatsink = (p) => {
  const base = cuboid({
    size:   [p.baseWidth, p.baseDepth, p.baseThickness],
    center: [0, 0, p.baseThickness / 2]
  })
  // Fins along Y, equally spaced across X.
  const finRegion = p.baseWidth - 2 * p.finMargin
  const finSpacing = p.finCount > 1 ? finRegion / (p.finCount - 1) : 0
  const fins = []
  for (let i = 0; i < p.finCount; i++) {
    const x = -p.baseWidth / 2 + p.finMargin + (p.finCount > 1 ? i * finSpacing : finRegion / 2)
    fins.push(cuboid({
      size:   [p.finThickness, p.baseDepth, p.finHeight],
      center: [x, 0, p.baseThickness + p.finHeight / 2]
    }))
  }
  return union(base, ...fins)
}

const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }
  return {
    heatsink: [colorize(PART_COLORS.heatsink, buildHeatsink(p))]
  }
}

const _defaultParts = buildAll({})

const main = (params = {}) => Object.values(buildAll(params)).flat()

module.exports = { main, parts: _defaultParts, getParameterDefinitions }
