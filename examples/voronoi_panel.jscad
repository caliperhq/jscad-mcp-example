'use strict'

// jscad-mcp demo: Voronoi-pattern panel
// ----------------------------------------
// Flat panel with Voronoi-tessellated holes. Demonstrates 2D pattern
// generation (deterministic random sites + half-plane intersection)
// piped through extrudeLinear + subtract. Practical for speaker
// grilles, decorative covers, plant trellises.
//
// Try in browser:
//   https://openjscad.xyz/?uri=https://raw.githubusercontent.com/caliperhq/jscad-mcp-example/main/examples/voronoi_panel_bundled.jscad

const { primitives, booleans, transforms, extrusions, colors } = require('@jscad/modeling')
const { cuboid, polygon } = primitives
const { subtract } = booleans
const { translate } = transforms
const { extrudeLinear } = extrusions
const { colorize } = colors
const { voronoiPanel } = require('./lib/voronoi')

const DEFAULTS = {
  width:      100,
  height:     60,
  thickness:  4,
  cellCount:  25,
  seed:       7,
  margin:     4,
  gap:        1.4
}

const getParameterDefinitions = () => [
  { name: 'width',     type: 'number', initial: 100, min: 40,  max: 240, step: 1, caption: 'Panel width (mm)' },
  { name: 'height',    type: 'number', initial: 60,  min: 30,  max: 160, step: 1, caption: 'Panel height (mm)' },
  { name: 'thickness', type: 'number', initial: 4,   min: 1,   max: 12,  step: 0.5, caption: 'Panel thickness (mm)' },
  { name: 'cellCount', type: 'int',    initial: 25,  min: 6,   max: 80,  step: 1, caption: 'Cell count' },
  { name: 'seed',      type: 'int',    initial: 7,   min: 1,   max: 999, step: 1, caption: 'Random seed' },
  { name: 'margin',    type: 'number', initial: 4,   min: 0,   max: 20,  step: 0.5, caption: 'Edge margin (mm)' },
  { name: 'gap',       type: 'number', initial: 1.4, min: 0.4, max: 4,   step: 0.1, caption: 'Wall thickness between cells (mm)' }
]

const PART_COLORS = {
  panel: [0.85, 0.55, 0.35, 1] // amber
}

const buildPanel = (p) => {
  const { cells } = voronoiPanel({
    width:  p.width,
    height: p.height,
    count:  p.cellCount,
    seed:   p.seed,
    margin: p.margin,
    gap:    p.gap
  })

  // Panel sits with one corner at origin, top face at z=thickness.
  const board = cuboid({
    size:   [p.width, p.height, p.thickness],
    center: [p.width / 2, p.height / 2, p.thickness / 2]
  })

  const holes = cells
    .filter((pts) => pts.length >= 3)
    .map((pts) => translate(
      [0, 0, -1],
      extrudeLinear({ height: p.thickness + 2 }, polygon({ points: pts }))
    ))

  return holes.length > 0 ? subtract(board, ...holes) : board
}

const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }
  return {
    panel: [colorize(PART_COLORS.panel, buildPanel(p))]
  }
}

const _defaultParts = buildAll({})

const main = (params = {}) => Object.values(buildAll(params)).flat()

module.exports = { main, parts: _defaultParts, getParameterDefinitions }
