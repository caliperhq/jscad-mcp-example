'use strict'
const assert = require('node:assert/strict')
const { test } = require('node:test')
const {
  rng, generateSites, clipHalfPlane, voronoiCell, shrinkPolygon, voronoiPanel
} = require('../examples/lib/voronoi')

test('rng is deterministic for a given seed', () => {
  const a = rng(42)
  const b = rng(42)
  for (let i = 0; i < 50; i++) assert.equal(a(), b())
})

test('clipHalfPlane keeps the half-plane (p - origin) . normal <= 0', () => {
  const sq = [[0, 0], [10, 0], [10, 10], [0, 10]]
  // Clip away the right half (x > 5)
  const left = clipHalfPlane(sq, [5, 0], [1, 0])
  // Resulting polygon should be x in [0,5]
  const xs = left.map(p => p[0])
  assert.ok(Math.max(...xs) <= 5 + 1e-9, `max x ${Math.max(...xs)} should be <= 5`)
  assert.ok(Math.min(...xs) >= 0 - 1e-9)
})

test('voronoiCell yields a valid polygon for an interior site', () => {
  const sites = [[20, 20], [80, 20], [50, 80]]
  const cell = voronoiCell(sites[0], sites, 100, 100)
  assert.ok(cell.length >= 3, `cell should be a polygon, got ${cell.length} vertices`)
  // The site should lie inside its own cell — strictly closer than any other site
  // to any point in the cell (we just sanity-check the centroid).
  let cx = 0, cy = 0
  for (const p of cell) { cx += p[0]; cy += p[1] }
  cx /= cell.length; cy /= cell.length
  const d0 = Math.hypot(cx - sites[0][0], cy - sites[0][1])
  for (let i = 1; i < sites.length; i++) {
    const di = Math.hypot(cx - sites[i][0], cy - sites[i][1])
    assert.ok(d0 <= di + 1e-6, `centroid of cell 0 should be closest to site 0 (got d0=${d0}, d${i}=${di})`)
  }
})

test('shrinkPolygon preserves vertex count and shrinks toward centroid', () => {
  const sq = [[0, 0], [10, 0], [10, 10], [0, 10]]
  const small = shrinkPolygon(sq, 0.2)
  assert.equal(small.length, 4)
  // Shrunk polygon should be strictly inside the original (every coord moved toward center 5,5)
  for (const [x, y] of small) {
    assert.ok(x > 0 && x < 10 && y > 0 && y < 10, `vertex ${[x, y]} should be strictly inside`)
  }
})

test('voronoiPanel returns one cell per site (after filtering degenerate cells)', () => {
  const { sites, cells } = voronoiPanel({ width: 100, height: 60, count: 20, seed: 7, margin: 4, gap: 1.5 })
  assert.ok(sites.length > 0, 'should generate sites')
  // Every cell is a non-degenerate polygon
  for (const c of cells) {
    assert.ok(c.length >= 3, `cell has only ${c.length} vertices`)
    for (const v of c) {
      assert.ok(Number.isFinite(v[0]) && Number.isFinite(v[1]), `cell vertex ${v} is non-finite`)
    }
  }
  // Sanity: roughly one cell per site (allow degenerate filtering)
  assert.ok(cells.length >= Math.floor(sites.length * 0.8),
    `expected ~${sites.length} cells, got ${cells.length}`)
})

test('generateSites respects margin', () => {
  const sites = generateSites({ width: 100, height: 60, count: 15, margin: 5, seed: 3 })
  for (const [x, y] of sites) {
    assert.ok(x >= 5 - 1e-9 && x <= 95 + 1e-9, `site x=${x} outside [5,95]`)
    assert.ok(y >= 5 - 1e-9 && y <= 55 + 1e-9, `site y=${y} outside [5,55]`)
  }
})
