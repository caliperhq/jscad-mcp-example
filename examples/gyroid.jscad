'use strict'

// jscad-mcp demo: Gyroid lattice cube
// -----------------------------------
// Triply-periodic minimal surface (gyroid), thickened, clipped to a cube.
// Implicit equation: sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x) = 0
//
// Lead MCP feature: slice. Try:
//   take_standard_views        -> iso hero
//   slice z=0                  -> iconic gyroid cross-section
//   slice x=0                  -> different section, proves 3D periodicity
//   take_image (high oblique)  -> surface curvature
//
// Try in browser:
//   https://openjscad.xyz/?uri=https://raw.githubusercontent.com/caliperhq/jscad-mcp-example/main/examples/gyroid.jscad

const { primitives, booleans, transforms } = require('@jscad/modeling')
const { cuboid, polyhedron } = primitives
const { intersect } = booleans
const { translate } = transforms

const { gyroidField } = require('./lib/gyroid')
const { marchingCubes } = require('./lib/marching-cubes')

const DEFAULTS = {
  cellSize: 10,
  wallThickness: 1.2,
  cubeSize: 40,
  resolution: 32
}

const getParameterDefinitions = () => [
  { name: 'cellSize',      type: 'number', initial: 10,  min: 4,  max: 25, step: 1,    caption: 'Cell size (mm)' },
  { name: 'wallThickness', type: 'number', initial: 1.2, min: 0.4, max: 3, step: 0.1,  caption: 'Wall thickness (mm)' },
  { name: 'cubeSize',      type: 'number', initial: 40,  min: 20, max: 80, step: 5,    caption: 'Outer cube size (mm)' },
  { name: 'resolution',    type: 'int',    initial: 32,  min: 16, max: 64, step: 8,    caption: 'MC grid resolution per axis' }
]

const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }
  const half = p.cubeSize / 2

  // Field for the THICKENED gyroid: |f(x,y,z)| - t/cellSize < 0
  const t = p.wallThickness / p.cellSize
  const field = (x, y, z) => Math.abs(gyroidField(x, y, z, p.cellSize)) - t

  // March a slightly oversized box so we can intersect cleanly.
  const pad = 1
  const bbox = [[-half - pad, -half - pad, -half - pad],
                [ half + pad,  half + pad,  half + pad]]
  const { positions, indices } = marchingCubes({
    sampler: field,
    bbox,
    resolution: p.resolution,
    isoLevel: 0
  })

  let lattice
  if (positions.length === 0) {
    lattice = []
  } else {
    const latticeMesh = polyhedron({
      points: positions,
      faces: indices,
      orientation: 'outward'
    })
    lattice = intersect(latticeMesh, cuboid({ size: [p.cubeSize, p.cubeSize, p.cubeSize] }))
  }

  const shell = cuboid({ size: [p.cubeSize, p.cubeSize, p.cubeSize] })

  return {
    lattice: Array.isArray(lattice) ? lattice : [lattice],
    shell:   [shell]
  }
}

const _defaultParts = buildAll({})

const main = (params = {}) => {
  const { lattice } = buildAll(params)
  return lattice
}

module.exports = { main, parts: _defaultParts, getParameterDefinitions }
