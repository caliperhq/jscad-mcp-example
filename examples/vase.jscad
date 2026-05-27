'use strict'

// jscad-mcp demo: Lofted parametric vase
// ----------------------------------------
// Smoothly morphing circular cross-section along height via extrudeFromSlices.
// Lead MCP feature: hero stills (take_image at oblique angles); the morphing
// profile makes the vase look different from every direction.
//
// Try in browser:
//   https://openjscad.xyz/?uri=https://raw.githubusercontent.com/caliperhq/jscad-mcp-example/main/examples/vase.jscad
// (Single-file, no bundle needed — only requires ./lib/vase-profile which is
// inlined by scripts/bundle-examples.js if/when bundling is needed.)

const { primitives, transforms, extrusions, maths, colors, geometries } = require('@jscad/modeling')
const { circle } = primitives
const { extrudeFromSlices, slice } = extrusions
const { mat4 } = maths
const { colorize } = colors
const { geom2 } = geometries
const { vaseRadiusAt } = require('./lib/vase-profile')

const DEFAULTS = {
  height:      120,
  baseRadius:  25,
  waistRadius: 18,
  hipRadius:   36,
  lipRadius:   22,
  twistDeg:    30,
  segments:    72,
  slices:      96
}

const getParameterDefinitions = () => [
  { name: 'height',      type: 'number', initial: 120, min: 40,  max: 240, step: 2, caption: 'Height (mm)' },
  { name: 'baseRadius',  type: 'number', initial: 25,  min: 8,   max: 60,  step: 1, caption: 'Base radius (mm)' },
  { name: 'waistRadius', type: 'number', initial: 18,  min: 6,   max: 60,  step: 1, caption: 'Waist radius (mm)' },
  { name: 'hipRadius',   type: 'number', initial: 36,  min: 10,  max: 80,  step: 1, caption: 'Hip radius (mm)' },
  { name: 'lipRadius',   type: 'number', initial: 22,  min: 8,   max: 60,  step: 1, caption: 'Lip radius (mm)' },
  { name: 'twistDeg',    type: 'number', initial: 30,  min: -180, max: 180, step: 5, caption: 'Twist (deg over full height)' },
  { name: 'segments',    type: 'int',    initial: 72,  min: 16,  max: 128, step: 4, caption: 'Cross-section segments' },
  { name: 'slices',      type: 'int',    initial: 96,  min: 20,  max: 200, step: 4, caption: 'Slice count' }
]

const PART_COLORS = {
  vase: [0.62, 0.48, 0.40, 1] // warm terracotta
}

const buildVase = (p) => {
  // Base slice: unit circle at z=0. Each callback slice transforms it.
  const baseShape = circle({ radius: 1, segments: p.segments })
  const baseSlice = slice.fromSides(geom2.toSides(baseShape))

  return extrudeFromSlices(
    {
      numberOfSlices: p.slices,
      capStart: true,
      capEnd: true,
      callback: (progress) => {
        const r = vaseRadiusAt(progress, {
          base: p.baseRadius, waist: p.waistRadius, hip: p.hipRadius, lip: p.lipRadius
        })
        const z = progress * p.height
        const twist = (p.twistDeg * Math.PI / 180) * progress

        // Build M = T(0,0,z) * R_z(twist) * S(r,r,1) so the unit circle becomes
        // a scaled+rotated ring at the correct height.
        const M = mat4.create()
        mat4.multiply(M, mat4.fromZRotation(mat4.create(), twist),
                          mat4.fromScaling(mat4.create(), [r, r, 1]))
        mat4.multiply(M, mat4.fromTranslation(mat4.create(), [0, 0, z]), M)
        return slice.transform(M, baseSlice)
      }
    },
    baseShape
  )
}

const buildAll = (params) => {
  const p = { ...DEFAULTS, ...params }
  return {
    vase: [colorize(PART_COLORS.vase, buildVase(p))]
  }
}

const _defaultParts = buildAll({})

const main = (params = {}) => Object.values(buildAll(params)).flat()

module.exports = { main, parts: _defaultParts, getParameterDefinitions }
