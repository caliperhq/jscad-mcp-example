'use strict'

/**
 * Generate the 2D profile of a cycloidal disc.
 *
 * Canonical "Hugo Elias" parametric form for a cycloidal disc engaging N pins
 * arranged on a circle of radius R, with eccentricity e and pin radius rp.
 * The disc has N-1 lobes; the resulting drive ratio is (N-1):1.
 *
 *   ratio   = R / (e * N)                       // must be > 1 (i.e. e < R/N)
 *   psi(t)  = -atan2( sin((1 - N)·t), ratio - cos((1 - N)·t) )
 *   x(t)    =  R·cos(t) - rp·cos(t + psi) - e·cos(N·t)
 *   y(t)    = -R·sin(t) + rp·sin(t + psi) + e·sin(N·t)
 *
 * Note: the y-equation intentionally has the negated R·sin(t) and +rp/+e
 * terms — this is the standard cycloidal-drive derivation (see Hugo Elias,
 * "Cycloidal Drive" writeup, and the GearCutter / OpenSCAD ports of it).
 * Using the same sign as x produces a profile with 2(N-1) lobes instead of
 * N-1; that bug is exactly the kind this demo's perception loop is meant
 * to surface.
 *
 * Constraint: eccentricity must satisfy e < R/N or the profile self-
 * intersects and the lobe count is undefined.
 *
 * @param {object} params
 * @param {number} params.pinCount      N  - number of pins (>= 4)
 * @param {number} params.pinCircleRadius R - radius of the pin pitch circle
 * @param {number} params.eccentricity  e  - eccentricity, must be < R/N
 * @param {number} params.pinRadius     rp - radius of each engagement pin
 * @param {number} [params.samples=360] - profile samples (closed loop)
 * @returns {number[][]} array of [x, y] points, last != first (caller closes)
 */
const cycloidProfile = ({ pinCount, pinCircleRadius, eccentricity, pinRadius, samples = 360 }) => {
  const N = pinCount
  const R = pinCircleRadius
  const e = eccentricity
  const rp = pinRadius
  const ratio = R / (e * N)

  const pts = new Array(samples)
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * 2 * Math.PI
    const sn = Math.sin((1 - N) * t)
    const cs = Math.cos((1 - N) * t)
    const psi = -Math.atan2(sn, ratio - cs)

    const x =  R * Math.cos(t) - rp * Math.cos(t + psi) - e * Math.cos(N * t)
    const y = -R * Math.sin(t) + rp * Math.sin(t + psi) + e * Math.sin(N * t)
    pts[i] = [x, y]
  }
  return pts
}

module.exports = { cycloidProfile }
