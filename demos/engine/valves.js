'use strict'
const { primitives, booleans, transforms } = require('@jscad/modeling')
const { cylinder } = primitives
const { union } = booleans
const { translate } = transforms

const _valve = (p, openFraction, side) => {
  // side = -1 for intake (-Y), +1 for exhaust (+Y)
  const blockHeight = p.stroke + 60
  const headZ = blockHeight - 20
  const stemR = p.bore * 0.025
  const headR = p.bore * 0.18
  const stemLen = 50
  const maxLift = 10
  const lift = openFraction * maxLift
  const yOffset = side * p.bore * 0.22

  const stem = translate([0, yOffset, headZ + stemLen / 2 - lift],
    cylinder({ radius: stemR, height: stemLen, segments: 24 }))
  const head = translate([0, yOffset, headZ + 1 - lift],
    cylinder({ radius: headR, height: 3, segments: 48 }))
  return union(stem, head)
}

const buildIntakeValve  = (p) => _valve(p, p.intakeValveOpen, -1)
const buildExhaustValve = (p) => _valve(p, p.exhaustValveOpen, +1)

const buildSparkPlug = (p) => {
  const blockHeight = p.stroke + 60
  const headZ = blockHeight - 20
  return translate([0, 0, headZ + 20],
    cylinder({ radius: p.bore * 0.05, height: 30, segments: 24 }))
}

module.exports = { buildIntakeValve, buildExhaustValve, buildSparkPlug }
