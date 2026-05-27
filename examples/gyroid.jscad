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
// Try in browser (uses the bundled single-file copy; openjscad.xyz cannot
// resolve relative requires like ./lib/gyroid against a GitHub raw URL):
//   https://openjscad.xyz/?uri=https://raw.githubusercontent.com/caliperhq/jscad-mcp-example/main/examples/gyroid_bundled.jscad

const { primitives, booleans, transforms } = require('@jscad/modeling')
const { cuboid, polyhedron } = primitives
const { intersect } = booleans
const { translate } = transforms

const { gyroidField } = require('./lib/gyroid')
const { marchingCubes } = require('./lib/marching-cubes')

const DEFAULTS = {
  cellSize: 10,
  wallThreshold: 0.6,
  cubeSize: 40,
  resolution: 48
}

const getParameterDefinitions = () => [
  { name: 'cellSize',      type: 'number', initial: 10,  min: 4,  max: 25, step: 1,    caption: 'Cell size (mm)' },
  { name: 'wallThreshold', type: 'number', initial: 0.6, min: 0.2, max: 1.4, step: 0.05, caption: 'Wall threshold (|f|<t becomes solid)' },
  { name: 'cubeSize',      type: 'number', initial: 40,  min: 20, max: 80, step: 5,    caption: 'Outer cube size (mm)' },
  { name: 'resolution',    type: 'int',    initial: 48,  min: 24, max: 64, step: 8,    caption: 'MC grid resolution per axis' }
]

const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }
  const half = p.cubeSize / 2

  // Thickened gyroid: solid where |f(x,y,z)| < wallThreshold.
  // The naive iso-function |f|-t has a kink at f=0 that breaks marching cubes
  // (produces non-manifold triangles). We use f^2 - t^2: same iso-surface |f|=t,
  // but smooth across the surface, so MC's linear edge interpolation produces a
  // coherent watertight mesh.
  const t = p.wallThreshold
  const field = (x, y, z) => {
    const g = gyroidField(x, y, z, p.cellSize)
    return g * g - t * t
  }

  // March a slightly oversized box so we can intersect cleanly.
  const pad = 2
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
