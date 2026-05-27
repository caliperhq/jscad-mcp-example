'use strict'
const assert = require('node:assert/strict')
const { test } = require('node:test')
const { cycloidProfile } = require('../examples/lib/cycloid')

test('cycloidProfile returns a closed loop of 2D points', () => {
  const pts = cycloidProfile({ pinCount: 12, eccentricity: 1.5, pinCircleRadius: 25, pinRadius: 2.5, samples: 360 })
  assert.equal(pts.length, 360)
  for (const [x, y] of pts) {
    assert.ok(Number.isFinite(x) && Number.isFinite(y), 'all points finite')
  }
})

test('cycloidProfile has N-1 lobes when pinCount=N', () => {
  // A hypocycloidal disc engaging N pins has N-1 lobes.
  // Sample radial distance from origin, count peaks above mean.
  const pts = cycloidProfile({ pinCount: 12, eccentricity: 1.5, pinCircleRadius: 25, pinRadius: 2.5, samples: 720 })
  const radii = pts.map(([x, y]) => Math.hypot(x, y))
  const mean = radii.reduce((a, b) => a + b) / radii.length
  let peaks = 0
  for (let i = 0; i < radii.length; i++) {
    const prev = radii[(i - 1 + radii.length) % radii.length]
    const next = radii[(i + 1) % radii.length]
    if (radii[i] > mean && radii[i] >= prev && radii[i] >= next) peaks++
  }
  assert.equal(peaks, 11, `expected 11 lobes, got ${peaks}`)
})

test('cycloidProfile stays bounded near pinCircleRadius', () => {
  const R = 25
  const pts = cycloidProfile({ pinCount: 12, eccentricity: 1.5, pinCircleRadius: R, pinRadius: 2.5, samples: 360 })
  for (const [x, y] of pts) {
    const r = Math.hypot(x, y)
    assert.ok(r > R - 5 && r < R + 5, `radius ${r} out of bounds`)
  }
})
