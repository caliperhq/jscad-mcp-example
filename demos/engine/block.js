'use strict'
const { primitives, booleans, transforms } = require('@jscad/modeling')
const { cuboid, cylinder } = primitives
const { union, subtract } = booleans
const { translate } = transforms

/**
 * Engine block: rectangular solid with a cylindrical bore and a +X cutaway face
 * exposing the interior. Cutaway is done HERE (on the block alone, cheap)
 * rather than on the fully-assembled engine, to keep CSG cost manageable.
 *
 * Origin: bottom-center of the bore. +Z up.
 */
const buildBlock = (p) => {
  const blockHeight = p.stroke + 60          // room for piston travel + skirt + crankcase
  const blockSide   = p.bore + 30            // wall thickness around bore
  const boreR       = p.bore / 2
  const cutawayDepth = blockSide / 2 + 1

  const body = translate([0, 0, blockHeight / 2 - 20],
    cuboid({ size: [blockSide, blockSide, blockHeight] }))
  const bore = translate([0, 0, blockHeight / 2 - 20],
    cylinder({ radius: boreR, height: blockHeight + 2, segments: 96 }))
  const cutaway = translate([cutawayDepth / 2 + 0.001, 0, blockHeight / 2 - 20],
    cuboid({ size: [cutawayDepth, blockSide + 2, blockHeight + 2] }))

  return subtract(body, union(bore, cutaway))
}

module.exports = { buildBlock }
