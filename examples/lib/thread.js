'use strict'

// ISO-style metric thread geometry helpers.
//
// All threads here use a simple triangular cross-section (60° included
// flank angle, no flat crest or root truncation — close enough for a
// visual demo, NOT for a real fastener).
//
// extrudeHelical takes a geom2 in the X-Y plane and sweeps it around
// the Z axis. X (in the source 2D) becomes radial distance from the
// Z axis after the sweep; Y becomes a vertical *offset* on top of the
// per-revolution `pitch` rise. So a triangle with X spanning
// [minorRadius, majorRadius] becomes a thread climbing one pitch per
// turn, with crests at majorRadius and roots at minorRadius.

const { primitives, extrusions, maths } = require('@jscad/modeling')
const { polygon } = primitives
const { extrudeHelical } = extrusions
const { TAU } = maths.constants

/**
 * Build a single-start helical thread, swept around the Z axis from
 * z=0 to z=height. The thread is left-hand-incomplete at the ends —
 * union with a cylinder of `minorRadius` to close it off and form a
 * real bolt shaft.
 *
 * @param {object} p
 * @param {number} p.majorRadius - outer radius (crest)
 * @param {number} p.minorRadius - inner radius (root)
 * @param {number} p.pitch       - axial distance between adjacent crests
 * @param {number} p.height      - total threaded length (z)
 * @param {number} [p.segmentsPerRotation=48]
 */
const buildThreadHelix = ({ majorRadius, minorRadius, pitch, height, segmentsPerRotation = 48 }) => {
  if (majorRadius <= minorRadius) throw new Error('thread: majorRadius must exceed minorRadius')
  if (pitch <= 0)                 throw new Error('thread: pitch must be > 0')
  if (height <= 0)                throw new Error('thread: height must be > 0')

  const turns = height / pitch
  const profile = polygon({
    points: [
      [minorRadius, -pitch / 2],
      [majorRadius, 0],
      [minorRadius,  pitch / 2]
    ]
  })
  return extrudeHelical(
    { angle: TAU * turns, pitch, startAngle: 0, segmentsPerRotation },
    profile
  )
}

module.exports = { buildThreadHelix }
