'use strict'

// jscad-mcp demo: Cutaway 4-stroke engine cylinder
// ------------------------------------------------
// Single-cylinder 4-stroke engine, cut away to expose piston, valves, ports.
// Lead MCP feature: slice (axial section through the cylinder). Try:
//   take_standard_views   -> iso hero with cutaway face
//   slice y=0             -> axial section, the headline shot
//   slice z=<head>        -> top-down valve placement
//   label_parts           -> annotated cutaway
//   sweep crankAngle 0..360 in 30deg steps -> centerpiece GIF
//
// Try in browser (bundled single-file):
//   https://openjscad.xyz/?uri=https://raw.githubusercontent.com/caliperhq/jscad-mcp-example/main/demos/engine/engine_bundled.jscad

const { colors } = require('@jscad/modeling')
const { colorize } = colors

const { buildBlock }      = require('./block')
const { buildHead }       = require('./head')
const { buildPiston }     = require('./piston')
const { buildConrod }     = require('./conrod')
const { buildCrankshaft } = require('./crankshaft')
const { buildIntakeValve, buildExhaustValve, buildSparkPlug } = require('./valves')
const { buildIntakePort,  buildExhaustPort }                   = require('./ports')

// Per-part RGBA colors. Picked for cutaway clarity: cool grays for the
// fixed structure, warm metals for moving parts, hot/cool tints for the
// flow paths.
const PART_COLORS = {
  block:         [0.55, 0.58, 0.62, 1],
  head:          [0.45, 0.48, 0.52, 1],
  piston:        [0.85, 0.55, 0.20, 1],
  conrod:        [0.75, 0.45, 0.25, 1],
  crankshaft:    [0.35, 0.38, 0.42, 1],
  intake_valve:  [0.30, 0.55, 0.85, 1],
  exhaust_valve: [0.85, 0.30, 0.20, 1],
  spark_plug:    [0.95, 0.85, 0.30, 1],
  intake_port:   [0.50, 0.75, 1.00, 0.55],
  exhaust_port:  [1.00, 0.55, 0.45, 0.55]
}

const DEFAULTS = {
  bore: 80, stroke: 70, conrodLength: 130, compressionRatio: 10,
  crankAngle: 30, intakeValveOpen: 0.6, exhaustValveOpen: 0.0
}

const getParameterDefinitions = () => [
  { name: 'bore',             type: 'number', initial: 80,  min: 40, max: 120, step: 1, caption: 'Bore (mm)' },
  { name: 'stroke',           type: 'number', initial: 70,  min: 30, max: 120, step: 1, caption: 'Stroke (mm)' },
  { name: 'conrodLength',     type: 'number', initial: 130, min: 80, max: 200, step: 1, caption: 'Conrod length (mm)' },
  { name: 'compressionRatio', type: 'number', initial: 10,  min: 6,  max: 14,  step: 0.5, caption: 'Compression ratio' },
  { name: 'crankAngle',       type: 'number', initial: 30,  min: 0,  max: 360, step: 1, caption: 'Crank angle (deg)' },
  { name: 'intakeValveOpen',  type: 'number', initial: 0.6, min: 0,  max: 1,   step: 0.05, caption: 'Intake valve open (0=closed)' },
  { name: 'exhaustValveOpen', type: 'number', initial: 0.0, min: 0,  max: 1,   step: 0.05, caption: 'Exhaust valve open (0=closed)' }
]

const colorPart = (name, geom) => geom ? colorize(PART_COLORS[name], geom) : null

const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }
  return {
    block:         [colorPart('block',         buildBlock(p))].filter(Boolean),
    head:          [colorPart('head',          buildHead(p))].filter(Boolean),
    piston:        [colorPart('piston',        buildPiston(p))].filter(Boolean),
    conrod:        [colorPart('conrod',        buildConrod(p))].filter(Boolean),
    crankshaft:    [colorPart('crankshaft',    buildCrankshaft(p))].filter(Boolean),
    intake_valve:  [colorPart('intake_valve',  buildIntakeValve(p))].filter(Boolean),
    exhaust_valve: [colorPart('exhaust_valve', buildExhaustValve(p))].filter(Boolean),
    spark_plug:    [colorPart('spark_plug',    buildSparkPlug(p))].filter(Boolean),
    intake_port:   [colorPart('intake_port',   buildIntakePort(p))].filter(Boolean),
    exhaust_port:  [colorPart('exhaust_port',  buildExhaustPort(p))].filter(Boolean)
  }
}

const _defaultParts = buildAll({})

const main = (params = {}) =>
  Object.values(buildAll(params)).flat()

module.exports = { main, parts: _defaultParts, getParameterDefinitions }
