'use strict'

// jscad-mcp demo: Threaded bolt + nut
// ----------------------------------------
// ISO-style metric thread on a hex-head bolt and a hex nut, both built
// from the same extrudeHelical triangle. The bolt's external thread is
// at radius [minor..major]; the nut's internal thread is at
// [major+clearance..major+clearance+depth]. With the nut placed partway
// up the bolt shaft, a vertical slice shows the thread engagement
// clearly.
//
// NB: this is a *visual* demo of the technique, not a printable
// fastener. Real threads have truncated crests/roots and tighter
// tolerances; here we keep the triangular profile and small clearance
// so the engagement reads in renders.
//
// Try in browser:
//   https://openjscad.xyz/?uri=https://raw.githubusercontent.com/caliperhq/jscad-mcp-example/main/examples/thread_bundled.jscad

const { primitives, booleans, transforms, extrusions, colors } = require('@jscad/modeling')
const { cylinder, cuboid } = primitives
const { union, subtract } = booleans
const { translate, rotateZ } = transforms
const { extrudeLinear } = extrusions
const { colorize } = colors
const { buildThreadHelix } = require('./lib/thread')

const DEFAULTS = {
  majorDiameter: 8,
  pitch:         1.25,
  threadLength:  20,
  shankLength:   5,
  headHeight:    5,
  headAcross:    13,
  nutHeight:     7,
  nutAcross:     13,
  nutPosition:   8,   // mm from bolt threaded-end (z=0) to nut bottom
  clearance:     0.2  // radial clearance bolt-major to nut-minor
}

const getParameterDefinitions = () => [
  { name: 'majorDiameter', type: 'number', initial: 8,    min: 3,  max: 24,  step: 0.5, caption: 'Major diameter (mm)' },
  { name: 'pitch',         type: 'number', initial: 1.25, min: 0.5, max: 3,   step: 0.05, caption: 'Pitch (mm)' },
  { name: 'threadLength',  type: 'number', initial: 20,   min: 6,  max: 60,  step: 1, caption: 'Threaded length (mm)' },
  { name: 'shankLength',   type: 'number', initial: 5,    min: 0,  max: 30,  step: 1, caption: 'Unthreaded shank (mm)' },
  { name: 'headHeight',    type: 'number', initial: 5,    min: 2,  max: 14,  step: 0.5, caption: 'Head height (mm)' },
  { name: 'headAcross',    type: 'number', initial: 13,   min: 6,  max: 32,  step: 0.5, caption: 'Head across-flats (mm)' },
  { name: 'nutHeight',     type: 'number', initial: 7,    min: 3,  max: 18,  step: 0.5, caption: 'Nut height (mm)' },
  { name: 'nutAcross',     type: 'number', initial: 13,   min: 6,  max: 32,  step: 0.5, caption: 'Nut across-flats (mm)' },
  { name: 'nutPosition',   type: 'number', initial: 8,    min: 0,  max: 30,  step: 0.5, caption: 'Nut bottom z (mm above thread start)' },
  { name: 'clearance',     type: 'number', initial: 0.2,  min: 0.05, max: 0.6, step: 0.05, caption: 'Radial clearance (mm)' }
]

const PART_COLORS = {
  bolt: [0.70, 0.70, 0.74, 1], // bright steel
  nut:  [0.55, 0.58, 0.62, 1]  // duller steel
}

// 6-gon (hexagon) of given across-flats distance, extruded to height
const hexPrism = (acrossFlats, height) => {
  const r = acrossFlats / Math.sqrt(3) // circumradius from across-flats (= 2r sin60°)
  const pts = []
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6 // rotate so flats face X/Y
    pts.push([r * Math.cos(a), r * Math.sin(a)])
  }
  const { primitives: { polygon } } = require('@jscad/modeling')
  return extrudeLinear({ height }, polygon({ points: pts }))
}

const buildBolt = (p) => {
  const majorR = p.majorDiameter / 2
  const minorR = majorR - 0.541 * p.pitch // ISO root depth ≈ 0.541 P
  const threadH = p.threadLength

  const shaft = cylinder({
    radius: minorR,
    height: threadH,
    center: [0, 0, threadH / 2],
    segments: 64
  })
  const threads = buildThreadHelix({
    majorRadius: majorR,
    minorRadius: minorR,
    pitch: p.pitch,
    height: threadH,
    segmentsPerRotation: 48
  })

  const shank = translate([0, 0, threadH + p.shankLength / 2],
    cylinder({ radius: majorR, height: p.shankLength, segments: 64 }))

  const head = translate([0, 0, threadH + p.shankLength + p.headHeight / 2 - p.headHeight / 2],
    hexPrism(p.headAcross, p.headHeight))
  const headPositioned = translate([0, 0, threadH + p.shankLength], hexPrism(p.headAcross, p.headHeight))

  return union(shaft, threads, shank, headPositioned)
}

const buildNut = (p) => {
  const majorR = p.majorDiameter / 2
  const minorR = majorR - 0.541 * p.pitch
  // Internal-thread radii: peak (closest to bolt axis) sits at majorR+clearance;
  // valley (deepest into the nut wall) at majorR+clearance + (majorR-minorR)
  const intMinor = majorR + p.clearance
  const intMajor = intMinor + (majorR - minorR)

  const body = hexPrism(p.nutAcross, p.nutHeight)
  const bore = cylinder({
    radius: intMinor,
    height: p.nutHeight + 2,
    center: [0, 0, p.nutHeight / 2],
    segments: 64
  })
  const internalThreads = buildThreadHelix({
    majorRadius: intMajor,
    minorRadius: intMinor,
    pitch: p.pitch,
    height: p.nutHeight,
    segmentsPerRotation: 48
  })

  return subtract(body, union(bore, internalThreads))
}

const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }
  const bolt = colorize(PART_COLORS.bolt, buildBolt(p))
  const nut  = colorize(PART_COLORS.nut,
    translate([0, 0, p.nutPosition], buildNut(p)))
  return {
    bolt: [bolt],
    nut:  [nut]
  }
}

const _defaultParts = buildAll({})

const main = (params = {}) => Object.values(buildAll(params)).flat()

module.exports = { main, parts: _defaultParts, getParameterDefinitions }
