'use strict'
const assert = require('node:assert/strict')
const { test } = require('node:test')
const { marchingCubes } = require('../examples/lib/marching-cubes')

test('empty volume produces empty triangle list', () => {
  const { positions, indices } = marchingCubes({
    sampler: () => 1.0,
    bbox: [[-1, -1, -1], [1, 1, 1]],
    resolution: 4,
    isoLevel: 0
  })
  assert.equal(positions.length, 0)
  assert.equal(indices.length, 0)
})

test('sphere field (f = r - 1) produces triangles', () => {
  const { positions, indices } = marchingCubes({
    sampler: (x, y, z) => Math.hypot(x, y, z) - 1.0,
    bbox: [[-2, -2, -2], [2, 2, 2]],
    resolution: 16,
    isoLevel: 0
  })
  assert.ok(positions.length > 0, 'sphere mesh has vertices')
  assert.ok(indices.length > 0, 'sphere mesh has triangles')
  for (let i = 0; i < positions.length; i++) {
    const [x, y, z] = positions[i]
    const r = Math.hypot(x, y, z)
    assert.ok(r > 0.85 && r < 1.15, `vertex radius ${r} too far from 1`)
  }
})
