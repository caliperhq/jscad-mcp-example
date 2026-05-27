'use strict'

/**
 * Smoothstep blend through four radius control points along normalized
 * height progress 0..1. Tangents are continuous because each segment
 * uses smoothstep (3p^2 - 2p^3) within its own [0,1] sub-range.
 *
 * Control points:
 *   p = 0.0  ->  base   (foot)
 *   p = 0.4  ->  waist  (narrowest above the foot)
 *   p = 0.6  ->  hip    (widest above the waist)
 *   p = 1.0  ->  lip    (top opening)
 */
const smoothstep = (t) => t * t * (3 - 2 * t)

const vaseRadiusAt = (progress, { base, waist, hip, lip }) => {
  if (progress <= 0.4) {
    const t = smoothstep(progress / 0.4)
    return base * (1 - t) + waist * t
  }
  if (progress <= 0.6) {
    const t = smoothstep((progress - 0.4) / 0.2)
    return waist * (1 - t) + hip * t
  }
  const t = smoothstep((progress - 0.6) / 0.4)
  return hip * (1 - t) + lip * t
}

module.exports = { vaseRadiusAt, smoothstep }
