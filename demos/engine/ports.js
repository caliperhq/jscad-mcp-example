'use strict'
const { primitives, booleans, transforms } = require('@jscad/modeling')
const { cylinder } = primitives
const { union } = booleans
const { translate, rotate } = transforms

// Ports are voids in the head, but here we render them as translucent solids
// in the parts map so they can be highlighted/labeled. They are NOT
// subtracted from the head; main() returns them as overlay solids. Visitor
// sees the airflow paths.
const _port = (p, side) => {
  const blockHeight = p.stroke + 60
  const headZ = blockHeight - 20
  const yOffset = side * p.bore * 0.22

  // Vertical segment over the valve
  const vertical = translate([0, yOffset, headZ + 12],
    cylinder({ radius: p.bore * 0.08, height: 24, segments: 32 }))
  // Horizontal segment exiting the side
  const horizontal = translate([0, yOffset + side * 18, headZ + 18],
    rotate([Math.PI / 2, 0, 0],
      cylinder({ radius: p.bore * 0.08, height: 30, segments: 32 })))
  return union(vertical, horizontal)
}

const buildIntakePort  = (p) => _port(p, -1)
const buildExhaustPort = (p) => _port(p, +1)

module.exports = { buildIntakePort, buildExhaustPort }
