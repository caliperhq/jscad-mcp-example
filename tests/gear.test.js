'use strict'
const assert = require('node:assert/strict')
const { test } = require('node:test')
const { gearProfile, pitchRadius, meshRotation } = require('../examples/lib/gear')

test('gearProfile returns the requested number of sample points', () => {
  const pts = gearProfile({ teeth: 18, module: 2, samples: 240 })
  assert.equal(pts.length, 240)
})

test('gearProfile produces N peaks and N valleys at the expected radii', () => {
  const N = 16, m = 2
  const a = m, d = m
  const rp = pitchRadius(N, m)
  const pts = gearProfile({ teeth: N, module: m, samples: N * 32 })
  // Each tooth has one peak and one valley
  let peaks = 0, valleys = 0
  for (let i = 0; i < pts.length; i++) {
    const r = Math.hypot(pts[i][0], pts[i][1])
    const prev = Math.hypot(pts[(i - 1 + pts.length) % pts.length][0], pts[(i - 1 + pts.length) % pts.length][1])
    const next = Math.hypot(pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1])
    if (r > prev && r > next) peaks++
    if (r < prev && r < next) valleys++
  }
  assert.equal(peaks, N, `expected ${N} peaks, got ${peaks}`)
  assert.equal(valleys, N, `expected ${N} valleys, got ${valleys}`)
  // Radii bounded
  const rMax = Math.max(...pts.map(p => Math.hypot(p[0], p[1])))
  const rMin = Math.min(...pts.map(p => Math.hypot(p[0], p[1])))
  assert.ok(Math.abs(rMax - (rp + a)) < 0.01, `peak ≈ rp + a; rMax=${rMax}, expected=${rp + a}`)
  assert.ok(Math.abs(rMin - (rp - d)) < 0.01, `valley ≈ rp - d; rMin=${rMin}, expected=${rp - d}`)
})

test('pitchRadius is m * N / 2', () => {
  assert.equal(pitchRadius(12, 2), 12)
  assert.equal(pitchRadius(20, 1.5), 15)
})

test('meshRotation is zero for odd N and π/N for even N', () => {
  assert.equal(meshRotation(13), 0)
  assert.equal(meshRotation(20), Math.PI / 20)
})
