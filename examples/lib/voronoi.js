'use strict'

/**
 * Voronoi tessellation helpers for the panel demo. The algorithm here is
 * the simple half-plane-intersection approach: each cell is computed
 * independently by clipping the bounding rectangle by every other site's
 * perpendicular bisector. O(N^2) — fine for the cell counts we use here.
 *
 * Exports:
 *   rng(seed)              -> deterministic 0..1 random generator
 *   generateSites(...)     -> Poisson-disc-ish random sample inside a rectangle
 *   clipHalfPlane(...)     -> Sutherland-Hodgman clip against one half-plane
 *   voronoiCell(...)       -> one cell polygon, clipped to the panel rectangle
 *   shrinkPolygon(p, r)    -> uniform inward offset by lerping vertices to centroid
 *   voronoiPanel(opts)     -> sites + shrunken cell polygons for an entire panel
 */

const rng = (seed) => {
  let s = (seed | 0) || 1
  return () => {
    s = (s + 0x6D2B79F5) | 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const distSq = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

const generateSites = ({ width, height, count, margin = 0, seed = 1 }) => {
  const r = rng(seed)
  const sites = []
  const minDist = (Math.min(width, height) / Math.sqrt(count)) * 0.55
  const minDistSq = minDist * minDist
  const maxTries = Math.max(2000, count * 100)
  for (let tries = 0; sites.length < count && tries < maxTries; tries++) {
    const x = margin + r() * (width - 2 * margin)
    const y = margin + r() * (height - 2 * margin)
    let ok = true
    for (const s of sites) {
      if (distSq([x, y], s) < minDistSq) { ok = false; break }
    }
    if (ok) sites.push([x, y])
  }
  return sites
}

// Keep points where (p - origin) . normal <= 0
const clipHalfPlane = (poly, origin, normal) => {
  if (poly.length === 0) return []
  const side = (p) => (p[0] - origin[0]) * normal[0] + (p[1] - origin[1]) * normal[1]
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i]
    const B = poly[(i + 1) % poly.length]
    const sA = side(A)
    const sB = side(B)
    if (sA <= 0) out.push(A)
    if ((sA < 0 && sB > 0) || (sA > 0 && sB < 0)) {
      const t = sA / (sA - sB)
      out.push([A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])])
    }
  }
  return out
}

const voronoiCell = (site, allSites, width, height) => {
  let poly = [[0, 0], [width, 0], [width, height], [0, height]]
  for (const t of allSites) {
    if (t === site) continue
    const mid    = [(site[0] + t[0]) / 2, (site[1] + t[1]) / 2]
    const normal = [t[0] - site[0],       t[1] - site[1]]
    poly = clipHalfPlane(poly, mid, normal)
    if (poly.length === 0) break
  }
  return poly
}

const shrinkPolygon = (poly, ratio) => {
  if (poly.length < 3 || ratio <= 0) return poly
  let cx = 0, cy = 0
  for (const p of poly) { cx += p[0]; cy += p[1] }
  cx /= poly.length
  cy /= poly.length
  return poly.map((p) => [cx + (p[0] - cx) * (1 - ratio), cy + (p[1] - cy) * (1 - ratio)])
}

const voronoiPanel = ({ width = 100, height = 60, count = 25, seed = 1, margin = 4, gap = 1.2 }) => {
  const sites = generateSites({ width, height, count, margin, seed })
  const cells = []
  for (const site of sites) {
    const cell = voronoiCell(site, sites, width, height)
    if (cell.length < 3) continue
    let rApprox = 0
    for (const p of cell) {
      rApprox = Math.max(rApprox, Math.hypot(p[0] - site[0], p[1] - site[1]))
    }
    if (rApprox <= 0) continue
    const shrinkRatio = Math.min(0.5, gap / (2 * rApprox))
    cells.push(shrinkPolygon(cell, shrinkRatio))
  }
  return { sites, cells }
}

module.exports = { rng, generateSites, clipHalfPlane, voronoiCell, shrinkPolygon, voronoiPanel }
