'use strict'

// jscad-mcp demo: Image → lithophane
// ----------------------------------
// A lithophane is a thin translucent panel whose local wall thickness
// encodes image brightness: DARK pixels become THICK walls (block more
// light) and BRIGHT pixels become THIN walls (let more light through).
// Backlit, a print reveals the source image as a tonal play of light.
//
// The "novel input" this example showcases is the IMAGE itself.
// The pipeline is:
//   1. scripts/build-lithophane-data.js reads any photo via ImageMagick,
//      downsamples to grayscale, and writes lib/litho_heightmap.js as a
//      committed JS module (.jscad files run sandboxed at render time
//      with no fs access, so the heightmap must be embedded).
//   2. This file consumes the heightmap as a single polyhedron — one
//      vertex per grid corner on the top surface (z = local thickness),
//      flat bottom, four side walls.
//
// Plug in your own image:
//   node scripts/build-lithophane-data.js path/to/photo.jpg 120
// (The argument is the target width in pixels; height auto-scales by
// the image's aspect ratio.)
//
// Try in browser:
//   https://openjscad.xyz/?uri=https://raw.githubusercontent.com/caliperhq/jscad-mcp-example/main/examples/lithophane_bundled.jscad

const { primitives, colors } = require('@jscad/modeling')
const { polyhedron } = primitives
const { colorize } = colors
const { w, h, source, values } = require('./lib/litho_heightmap')
const heightmap = { w, h, source, values }

const DEFAULTS = {
  pixelSize:    1.0,   // mm per source pixel — at 120 px wide, panel = 120 mm
  minThickness: 0.6,   // wall at bright pixels (~2 perimeters on a 0.4 nozzle)
  maxThickness: 3.0    // wall at dark pixels
}

const getParameterDefinitions = () => [
  { name: 'pixelSize',    type: 'number', initial: 1.0, min: 0.3, max: 3.0, step: 0.1, caption: 'mm per source pixel' },
  { name: 'minThickness', type: 'number', initial: 0.6, min: 0.2, max: 2.0, step: 0.1, caption: 'Min thickness, bright pixels (mm)' },
  { name: 'maxThickness', type: 'number', initial: 3.0, min: 1.0, max: 6.0, step: 0.1, caption: 'Max thickness, dark pixels (mm)' }
]

const PART_COLORS = {
  panel: [0.92, 0.91, 0.86, 1]  // off-white PLA
}

// Average the up-to-four pixel cells touching corner vertex (i, j) so the
// top surface is smooth across cell boundaries rather than stepped.
const cornerThickness = (i, j, hm, p) => {
  const W = hm.w, H = hm.h
  let sum = 0, n = 0
  for (let dj = -1; dj <= 0; dj++) {
    for (let di = -1; di <= 0; di++) {
      const pi = i + di, pj = j + dj
      if (pi >= 0 && pi < W && pj >= 0 && pj < H) {
        sum += hm.values[pj * W + pi]
        n++
      }
    }
  }
  const bright = n > 0 ? sum / n : 128
  return p.minThickness + (p.maxThickness - p.minThickness) * (1 - bright / 255)
}

const buildPanel = (hm, p) => {
  const W = hm.w, H = hm.h
  const px = p.pixelSize
  const x0 = -(W * px) / 2
  const y0 =  (H * px) / 2

  const points = []
  // Top vertices — z varies with local image brightness
  for (let j = 0; j <= H; j++) {
    for (let i = 0; i <= W; i++) {
      points.push([x0 + i * px, y0 - j * px, cornerThickness(i, j, hm, p)])
    }
  }
  // Bottom vertices — flat plane at z=0
  for (let j = 0; j <= H; j++) {
    for (let i = 0; i <= W; i++) {
      points.push([x0 + i * px, y0 - j * px, 0])
    }
  }

  const stride = W + 1
  const topCount = stride * (H + 1)
  const Ti = (i, j) => j * stride + i
  const Bi = (i, j) => topCount + j * stride + i

  const faces = []
  // Top surface (outward normal = +Z).
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      faces.push([Ti(i, j), Ti(i + 1, j), Ti(i + 1, j + 1)])
      faces.push([Ti(i, j), Ti(i + 1, j + 1), Ti(i, j + 1)])
    }
  }
  // Bottom surface (outward normal = -Z) — winding reversed from top.
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      faces.push([Bi(i, j), Bi(i + 1, j + 1), Bi(i + 1, j)])
      faces.push([Bi(i, j), Bi(i, j + 1), Bi(i + 1, j + 1)])
    }
  }
  // Side walls.
  // +Y edge (j = 0)
  for (let i = 0; i < W; i++) {
    faces.push([Ti(i, 0), Bi(i, 0), Bi(i + 1, 0)])
    faces.push([Ti(i, 0), Bi(i + 1, 0), Ti(i + 1, 0)])
  }
  // -Y edge (j = H)
  for (let i = 0; i < W; i++) {
    faces.push([Ti(i + 1, H), Bi(i + 1, H), Bi(i, H)])
    faces.push([Ti(i + 1, H), Bi(i, H), Ti(i, H)])
  }
  // -X edge (i = 0)
  for (let j = 0; j < H; j++) {
    faces.push([Ti(0, j + 1), Bi(0, j + 1), Bi(0, j)])
    faces.push([Ti(0, j + 1), Bi(0, j), Ti(0, j)])
  }
  // +X edge (i = W)
  for (let j = 0; j < H; j++) {
    faces.push([Ti(W, j), Bi(W, j), Bi(W, j + 1)])
    faces.push([Ti(W, j), Bi(W, j + 1), Ti(W, j + 1)])
  }

  return polyhedron({ points, faces, orientation: 'outward' })
}

const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }
  return { panel: [colorize(PART_COLORS.panel, buildPanel(heightmap, p))] }
}

const _defaultParts = buildAll({})

const main = (params = {}) => Object.values(buildAll(params)).flat()

module.exports = { main, parts: _defaultParts, getParameterDefinitions, heightmap }
