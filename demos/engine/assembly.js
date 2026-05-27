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

const { buildBlock }      = require('./block')
const { buildHead }       = require('./head')
const { buildPiston }     = require('./piston')
const { buildConrod }     = require('./conrod')
const { buildCrankshaft } = require('./crankshaft')
const { buildIntakeValve, buildExhaustValve, buildSparkPlug } = require('./valves')
const { buildIntakePort,  buildExhaustPort }                   = require('./ports')

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

const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }
  return {
    block:         [buildBlock(p)].filter(Boolean),
    head:          [buildHead(p)].filter(Boolean),
    piston:        [buildPiston(p)].filter(Boolean),
    conrod:        [buildConrod(p)].filter(Boolean),
    crankshaft:    [buildCrankshaft(p)].filter(Boolean),
    intake_valve:  [buildIntakeValve(p)].filter(Boolean),
    exhaust_valve: [buildExhaustValve(p)].filter(Boolean),
    spark_plug:    [buildSparkPlug(p)].filter(Boolean),
    intake_port:   [buildIntakePort(p)].filter(Boolean),
    exhaust_port:  [buildExhaustPort(p)].filter(Boolean)
  }
}

const _defaultParts = buildAll({})

const main = (params = {}) =>
  Object.values(buildAll(params)).flat()

module.exports = { main, parts: _defaultParts, getParameterDefinitions }
