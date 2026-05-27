'use strict'

// Spur gear profile generator.
//
// Uses a smooth cosine-modulated radius rather than a true involute curve.
// For a visual demo of meshing this is plenty — and it lets us compute
// the mesh phase analytically: cos(Nθ) peaks at θ = 0, 2π/N, ... and
// hits its valley between peaks, so two gears mesh when one is rotated
// so its valley points at the other gear's peak (or vice versa).

const TWO_PI = Math.PI * 2

/**
 * Generate the 2D polygon outline of a spur gear.
 *
 * @param {object} p
 * @param {number} p.teeth        - number of teeth (N)
 * @param {number} p.module       - tooth size; pitch radius = module * N / 2
 * @param {number} [p.addendum]   - radial outward bump from pitch (default = module)
 * @param {number} [p.dedendum]   - radial inward dip from pitch (default = 1.0 * module)
 * @param {number} [p.samples=240]
 * @returns {number[][]} polygon points
 */
const gearProfile = ({ teeth, module: m, addendum, dedendum, samples = 240 }) => {
  const N = teeth
  const rp = (m * N) / 2
  const a  = addendum !== undefined ? addendum : m
  const d  = dedendum !== undefined ? dedendum : m
  const points = []
  for (let i = 0; i < samples; i++) {
    const theta = (TWO_PI * i) / samples
    // r(θ) = rp - d + (a + d)/2 * (1 + cos(Nθ))
    //   peak  at cos = 1:  r = rp + a
    //   valley at cos = -1: r = rp - d
    const r = rp - d + 0.5 * (a + d) * (1 + Math.cos(N * theta))
    points.push([r * Math.cos(theta), r * Math.sin(theta)])
  }
  return points
}

/**
 * Pitch radius helper.
 */
const pitchRadius = (teeth, m) => (m * teeth) / 2

/**
 * Compute the rotation (radians) to apply to a second gear so its
 * valley meshes with the first gear's peak at the line of centers.
 *
 * Geometry: gear A sits at origin with a peak pointing along +X
 * (θ_A = 0). Gear B sits along +X at distance r_pA + r_pB. The mesh
 * point on B is at θ_B = π (B's -X direction, toward A's center).
 * For B to have a valley at θ_B = π, the cosine wave cos(N_B · θ_B)
 * must equal -1 there. cos(N_B · π) is +1 when N_B is even and -1
 * when N_B is odd, so we add π/N_B when N_B is even to push the
 * cosine to its trough at θ_B = π.
 */
const meshRotation = (teethB) => (teethB % 2 === 0 ? Math.PI / teethB : 0)

module.exports = { gearProfile, pitchRadius, meshRotation }
