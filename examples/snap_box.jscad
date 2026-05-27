'use strict'

// jscad-mcp demo: Snap-fit parametric box
// ----------------------------------------
// Tray-style box with a press-on lid. The lid's downward skirt wraps the
// outside of the box; small wedge protrusions on the box's long walls
// catch matching dimples on the inside of the skirt. Tolerance
// (`clearance`) between mating surfaces is the dial that decides whether
// the lid snaps or jams — exactly the kind of fit that's painful to
// pick without a render.
//
// Try in browser:
//   https://openjscad.xyz/?uri=https://raw.githubusercontent.com/caliperhq/jscad-mcp-example/main/examples/snap_box_bundled.jscad

const { primitives, booleans, transforms, colors } = require('@jscad/modeling')
const { cuboid } = primitives
const { union, subtract } = booleans
const { translate } = transforms
const { colorize } = colors

const DEFAULTS = {
  width:        60,
  depth:        40,
  height:       28,
  wallThickness: 2,
  floorThickness: 2,
  lidThickness: 3,
  lidSkirtHeight: 8,
  snapZ:        20,   // height (from box floor) at which the snap features sit
  snapWidth:    14,   // length along the long side
  snapDepth:    1.4,  // wedge protrusion outward from wall
  clearance:    0.25, // radial gap between box outer wall and lid skirt inner wall
  lidLifted:    18    // z offset of the lid (0 = closed, positive = lifted in exploded view)
}

const getParameterDefinitions = () => [
  { name: 'width',         type: 'number', initial: 60,  min: 30, max: 200, step: 1, caption: 'Box width X (mm)' },
  { name: 'depth',         type: 'number', initial: 40,  min: 20, max: 200, step: 1, caption: 'Box depth Y (mm)' },
  { name: 'height',        type: 'number', initial: 28,  min: 10, max: 80,  step: 1, caption: 'Box height Z (mm)' },
  { name: 'wallThickness', type: 'number', initial: 2,   min: 1,  max: 6,   step: 0.5, caption: 'Wall (mm)' },
  { name: 'floorThickness',type: 'number', initial: 2,   min: 1,  max: 6,   step: 0.5, caption: 'Floor (mm)' },
  { name: 'lidThickness',  type: 'number', initial: 3,   min: 1,  max: 8,   step: 0.5, caption: 'Lid top (mm)' },
  { name: 'lidSkirtHeight',type: 'number', initial: 8,   min: 3,  max: 24,  step: 1,   caption: 'Lid skirt height (mm)' },
  { name: 'snapZ',         type: 'number', initial: 20,  min: 4,  max: 80,  step: 1,   caption: 'Snap-feature z (mm above box floor)' },
  { name: 'snapWidth',     type: 'number', initial: 14,  min: 4,  max: 80,  step: 1,   caption: 'Snap length (mm)' },
  { name: 'snapDepth',     type: 'number', initial: 1.4, min: 0.3, max: 3,  step: 0.1, caption: 'Snap depth (mm)' },
  { name: 'clearance',     type: 'number', initial: 0.25, min: 0.05, max: 0.8, step: 0.05, caption: 'Clearance lid<->box (mm)' },
  { name: 'lidLifted',     type: 'number', initial: 18,  min: 0,  max: 60,  step: 1,   caption: 'Lid lift (mm; 0 = closed)' }
]

const PART_COLORS = {
  box: [0.30, 0.55, 0.65, 1], // teal
  lid: [0.85, 0.55, 0.30, 1]  // amber
}

const buildBox = (p) => {
  const outer = cuboid({
    size:   [p.width, p.depth, p.height],
    center: [0, 0, p.height / 2]
  })
  const inner = cuboid({
    size:   [p.width - 2 * p.wallThickness, p.depth - 2 * p.wallThickness, p.height],
    center: [0, 0, p.floorThickness + (p.height - p.floorThickness) / 2 + 0.1]
  })
  const wallsAndFloor = subtract(outer, inner)

  // Snap protrusions: small wedges on the two long sides (Y = ±depth/2)
  const wedge = (yCenter) => translate(
    [0, yCenter, p.snapZ],
    cuboid({ size: [p.snapWidth, p.snapDepth * 2, p.snapDepth * 2] })
  )
  // Place each wedge half-buried in the wall so half pokes outside
  const front = wedge( p.depth / 2)
  const back  = wedge(-p.depth / 2)
  return union(wallsAndFloor, front, back)
}

const buildLid = (p) => {
  // Skirt outer perimeter wraps the box outer perimeter with `clearance`.
  const outerX = p.width  + 2 * p.clearance + 2 * p.wallThickness  // total skirt outer width
  const outerY = p.depth  + 2 * p.clearance + 2 * p.wallThickness
  // Inner cavity (where the box top fits)
  const innerX = p.width  + 2 * p.clearance
  const innerY = p.depth  + 2 * p.clearance

  const skirtBase  = cuboid({
    size:   [outerX, outerY, p.lidSkirtHeight + p.lidThickness],
    center: [0, 0, (p.lidSkirtHeight + p.lidThickness) / 2]
  })
  const skirtCavity = cuboid({
    size:   [innerX, innerY, p.lidSkirtHeight + 0.01],
    center: [0, 0, p.lidSkirtHeight / 2]
  })
  let lid = subtract(skirtBase, skirtCavity)

  // Dimples on the inside of the skirt to catch the box's wedges.
  // The dimple is a small inset cuboid carved out of the skirt's inner face.
  const dimple = (yCenter) => translate(
    [0, yCenter, p.snapZ - p.lidLifted + 0],
    cuboid({ size: [p.snapWidth + 2, p.snapDepth * 2 + 0.5, p.snapDepth * 2 + 0.5] })
  )
  // Position the dimples so they line up with the wedges when lidLifted = 0
  // (the box's wedges are at z = snapZ, and the lid's local origin should
  // map to the same z when lid is closed).
  const dimpleFront = dimple( p.depth / 2 + p.clearance / 2 + p.wallThickness / 2 + p.snapDepth)
  const dimpleBack  = dimple(-p.depth / 2 - p.clearance / 2 - p.wallThickness / 2 - p.snapDepth)
  lid = subtract(lid, dimpleFront, dimpleBack)

  return lid
}

const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }
  const box = buildBox(p)
  const lidZ = p.height + p.lidLifted - p.lidSkirtHeight  // lid skirt straddles the top of the box
  const lid = translate([0, 0, lidZ], buildLid(p))
  return {
    box: [colorize(PART_COLORS.box, box)],
    lid: [colorize(PART_COLORS.lid, lid)]
  }
}

const _defaultParts = buildAll({})

const main = (params = {}) => Object.values(buildAll(params)).flat()

module.exports = { main, parts: _defaultParts, getParameterDefinitions }
