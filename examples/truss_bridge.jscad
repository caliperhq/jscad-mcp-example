'use strict'

// jscad-mcp demo: HO-scale Pratt through-truss railroad bridge
// ------------------------------------------------------------
// A classic Pratt through-truss: train rides on a deck at the bottom
// chord, between two parallel truss walls. The diagonals are the
// Pratt signature — every diagonal slopes down *toward the end* of
// the bridge (top corner closer to center, bottom corner closer to
// end), which puts diagonals in tension and verticals in compression
// under gravity. Mirroring this around the bridge centerline makes
// the two innermost diagonals form the characteristic "V" at center.
//
// Reference photos that inspired this example come from Helmuth's
// model train house, photographed by Talking Walls Photo:
// https://www.talkingwallsphoto.com/houses/helmuths-model-train-house
//
// Bumping `panels` re-tiles the bridge automatically; verticals,
// diagonals, floor beams, ties, and portal bracing all regenerate.
// Good showcase for a parameter sweep — see scripts/ for the recipe.
//
// Try in browser:
//   https://openjscad.xyz/?uri=https://raw.githubusercontent.com/caliperhq/jscad-mcp-example/main/examples/truss_bridge_bundled.jscad

const { primitives, booleans, transforms, colors } = require('@jscad/modeling')
const { cuboid } = primitives
const { union } = booleans
const { translate, rotate } = transforms
const { colorize } = colors

const DEFAULTS = {
  span:            200,  // mm, end-to-end
  panels:          6,    // panel count (N+1 vertical posts)
  trussHeight:     50,
  deckWidth:       28,   // inside-truss gauge
  memberThickness: 1.6,  // diagonals + verticals
  chordThickness:  2.4,  // top + bottom chord
  floorBeamHeight: 3,
  deckThickness:   2,
  tieCount:        24,
  tieHeight:       1.6,
  railHeight:      1.4
}

const getParameterDefinitions = () => [
  { name: 'span',            type: 'number', initial: 200, min: 80,  max: 400, step: 10,  caption: 'Span length (mm)' },
  { name: 'panels',          type: 'int',    initial: 6,   min: 3,   max: 12,  step: 1,   caption: 'Panel count' },
  { name: 'trussHeight',     type: 'number', initial: 50,  min: 25,  max: 90,  step: 1,   caption: 'Truss height (mm)' },
  { name: 'deckWidth',       type: 'number', initial: 28,  min: 18,  max: 60,  step: 1,   caption: 'Deck (gauge) width (mm)' },
  { name: 'memberThickness', type: 'number', initial: 1.6, min: 0.8, max: 4,   step: 0.1, caption: 'Vertical/diagonal thickness (mm)' },
  { name: 'chordThickness',  type: 'number', initial: 2.4, min: 1.2, max: 5,   step: 0.1, caption: 'Top/bottom chord thickness (mm)' },
  { name: 'tieCount',        type: 'int',    initial: 24,  min: 8,   max: 60,  step: 1,   caption: 'Tie count' }
]

const PART_COLORS = {
  trusses: [0.34, 0.34, 0.38, 1],   // dark steel
  chords:  [0.28, 0.28, 0.32, 1],   // slightly darker steel
  deck:    [0.42, 0.30, 0.20, 1],   // creosote-stained timber
  ties:    [0.22, 0.16, 0.12, 1],   // darker ties
  rails:   [0.55, 0.55, 0.60, 1],   // running rail
  portals: [0.30, 0.30, 0.34, 1]
}

const buildTruss = (p, ySign) => {
  // ySign = -1 (left truss) or +1 (right truss)
  const y    = ySign * (p.deckWidth / 2 + p.memberThickness / 2)
  const z0   = 0
  const zT   = p.trussHeight
  const N    = p.panels
  const dx   = p.span / N
  const tM   = p.memberThickness
  const tC   = p.chordThickness
  const out  = []

  // Bottom chord
  out.push(cuboid({
    size:   [p.span, tC, tC],
    center: [p.span / 2, y, z0 + tC / 2]
  }))
  // Top chord
  out.push(cuboid({
    size:   [p.span, tC, tC],
    center: [p.span / 2, y, zT - tC / 2]
  }))
  // Vertical posts at each panel point (0..N)
  for (let i = 0; i <= N; i++) {
    const x = i * dx
    out.push(cuboid({
      size:   [tM, tM, zT],
      center: [x, y, zT / 2]
    }))
  }
  // Diagonals — Pratt rule: top corner is the one closer to bridge center
  const center = N / 2
  for (let i = 0; i < N; i++) {
    const xL = i * dx, xR = (i + 1) * dx
    const panelCenter = i + 0.5
    const eps = 1e-6
    let topX, botX
    if (panelCenter < center - eps) {
      // Pratt left half: top at LEFT post (outer end), bottom at RIGHT (toward center)
      topX = xL; botX = xR
    } else if (panelCenter > center + eps) {
      // Pratt right half: top at RIGHT post (outer end), bottom at LEFT (toward center)
      topX = xR; botX = xL
    } else {
      // exact center panel (odd N): vertical members already cover it;
      // add an X to keep the pattern symmetric and dense
      const cxMid = (xL + xR) / 2
      const len   = Math.hypot(dx, zT)
      const ang   = Math.atan2(zT - tC, dx)
      for (const s of [+1, -1]) {
        out.push(translate([cxMid, y, zT / 2],
          rotate([0, s * ang, 0], cuboid({ size: [len, tM, tM] }))
        ))
      }
      continue
    }
    const dz = (zT - tC)
    const lx = Math.abs(topX - botX)   // = dx
    const len = Math.hypot(lx, dz)
    const ang = Math.atan2(dz, topX - botX)  // signed
    const cx  = (topX + botX) / 2
    const cz  = z0 + tC + (dz) / 2
    out.push(translate([cx, y, cz],
      rotate([0, -ang, 0], cuboid({ size: [len, tM, tM] }))
    ))
  }
  return union(...out)
}

const buildFloorBeams = (p) => {
  const N = p.panels, dx = p.span / N
  const beams = []
  const tC = p.chordThickness
  for (let i = 0; i <= N; i++) {
    beams.push(cuboid({
      size:   [tC, p.deckWidth + 2 * p.memberThickness, p.floorBeamHeight],
      center: [i * dx, 0, tC + p.floorBeamHeight / 2]
    }))
  }
  return union(...beams)
}

const buildDeck = (p) => {
  const z0 = p.chordThickness + p.floorBeamHeight
  return cuboid({
    size:   [p.span, p.deckWidth, p.deckThickness],
    center: [p.span / 2, 0, z0 + p.deckThickness / 2]
  })
}

const buildTies = (p) => {
  const z0     = p.chordThickness + p.floorBeamHeight + p.deckThickness
  const tieLen = p.deckWidth - 1
  const tieWid = p.span / p.tieCount * 0.55
  const ties = []
  for (let i = 0; i < p.tieCount; i++) {
    const x = (i + 0.5) * (p.span / p.tieCount)
    ties.push(cuboid({
      size:   [tieWid, tieLen, p.tieHeight],
      center: [x, 0, z0 + p.tieHeight / 2]
    }))
  }
  return union(...ties)
}

const buildRails = (p) => {
  const z0 = p.chordThickness + p.floorBeamHeight + p.deckThickness + p.tieHeight
  const gauge = 16.5 * 0.4  // HO gauge is 16.5 mm; visual rail spacing slightly tighter
  const rails = []
  for (const s of [-1, +1]) {
    rails.push(cuboid({
      size:   [p.span, 0.8, p.railHeight],
      center: [p.span / 2, s * gauge, z0 + p.railHeight / 2]
    }))
  }
  return union(...rails)
}

const buildPortals = (p) => {
  // Portal frame at each end — leaves an open arch tall enough for
  // a train to pass through. Structure (bottom to top):
  //   • open opening from deck up to the portal lintel
  //   • lintel (horizontal strut spanning between the two end posts)
  //   • knee braces at the inside top corners (the iconic Pratt gusset)
  //   • optional X-bracing in the small band between lintel and top strut
  //   • top strut hugging the top chord
  const zT  = p.trussHeight
  const tM  = p.memberThickness
  const y0  = p.deckWidth / 2 + tM / 2
  const w   = 2 * y0
  const deckTopZ  = p.chordThickness + p.floorBeamHeight + p.deckThickness + p.tieHeight + p.railHeight
  const headroom  = (zT - p.chordThickness) - deckTopZ
  // Reserve at least 70% of the available headroom for the train opening.
  const clearance = Math.max(headroom * 0.7, headroom - 12)
  const lintelZ   = deckTopZ + clearance
  const topStrutZ = zT - p.chordThickness / 2 - tM
  const xBraceH   = Math.max(0, topStrutZ - lintelZ - tM)
  const kneeSize  = Math.min(8, Math.max(3, clearance * 0.18))
  const kneeLen   = kneeSize * Math.SQRT2
  const out = []
  for (const x of [0, p.span]) {
    // top strut (snug under the top chord)
    out.push(cuboid({
      size:   [tM, w, tM],
      center: [x, 0, topStrutZ]
    }))
    // portal lintel (train-clearance ceiling)
    out.push(cuboid({
      size:   [tM, w, tM],
      center: [x, 0, lintelZ]
    }))
    // X-bracing only in the band above the lintel
    if (xBraceH > 1) {
      const len = Math.hypot(w, xBraceH)
      const ang = Math.atan2(xBraceH, w)
      for (const s of [+1, -1]) {
        out.push(translate([x, 0, (topStrutZ + lintelZ) / 2],
          rotate([s * ang, 0, 0], cuboid({ size: [tM, len, tM] }))
        ))
      }
    }
    // Knee braces: short 45° diagonals at the inside top corners,
    // springing from the post downward-inward to the lintel.
    for (const s of [+1, -1]) {
      const cy = s * (y0 - kneeSize / 2)
      const cz = lintelZ - kneeSize / 2
      out.push(translate([x, cy, cz],
        rotate([-s * Math.PI / 4, 0, 0],
          cuboid({ size: [tM, kneeLen, tM] })
        )
      ))
    }
  }
  return union(...out)
}

const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }
  return {
    trusses:    [colorize(PART_COLORS.trusses, union(buildTruss(p, -1), buildTruss(p, +1)))],
    floorBeams: [colorize(PART_COLORS.chords,  buildFloorBeams(p))],
    deck:       [colorize(PART_COLORS.deck,    buildDeck(p))],
    ties:       [colorize(PART_COLORS.ties,    buildTies(p))],
    rails:      [colorize(PART_COLORS.rails,   buildRails(p))],
    portals:    [colorize(PART_COLORS.portals, buildPortals(p))]
  }
}

const _defaultParts = buildAll({})

const main = (params = {}) => Object.values(buildAll(params)).flat()

module.exports = { main, parts: _defaultParts, getParameterDefinitions }
