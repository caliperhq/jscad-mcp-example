'use strict'
const assert = require('node:assert/strict')
const { test } = require('node:test')
const { vaseRadiusAt } = require('../examples/lib/vase-profile')

const CTRL = { base: 25, waist: 18, hip: 36, lip: 22 }

test('vaseRadiusAt returns the control-point radius at each anchor', () => {
  assert.equal(vaseRadiusAt(0,   CTRL), 25, 'foot')
  assert.equal(vaseRadiusAt(0.4, CTRL), 18, 'waist')
  assert.equal(vaseRadiusAt(0.6, CTRL), 36, 'hip')
  assert.equal(vaseRadiusAt(1,   CTRL), 22, 'lip')
})

test('vaseRadiusAt is monotonic within each anchor segment', () => {
  // base -> waist (25 -> 18): monotonically decreasing
  let prev = vaseRadiusAt(0, CTRL)
  for (let p = 0.05; p <= 0.4; p += 0.05) {
    const r = vaseRadiusAt(p, CTRL)
    assert.ok(r <= prev + 1e-9, `decreasing in base->waist segment at p=${p}: ${r} > ${prev}`)
    prev = r
  }
  // waist -> hip (18 -> 36): monotonically increasing
  prev = vaseRadiusAt(0.4, CTRL)
  for (let p = 0.45; p <= 0.6; p += 0.05) {
    const r = vaseRadiusAt(p, CTRL)
    assert.ok(r >= prev - 1e-9, `increasing in waist->hip segment at p=${p}: ${r} < ${prev}`)
    prev = r
  }
  // hip -> lip (36 -> 22): monotonically decreasing
  prev = vaseRadiusAt(0.6, CTRL)
  for (let p = 0.65; p <= 1; p += 0.05) {
    const r = vaseRadiusAt(p, CTRL)
    assert.ok(r <= prev + 1e-9, `decreasing in hip->lip segment at p=${p}: ${r} > ${prev}`)
    prev = r
  }
})

test('vaseRadiusAt stays within control-point bounds', () => {
  const lo = Math.min(...Object.values(CTRL))
  const hi = Math.max(...Object.values(CTRL))
  for (let p = 0; p <= 1; p += 0.01) {
    const r = vaseRadiusAt(p, CTRL)
    assert.ok(r >= lo - 1e-9 && r <= hi + 1e-9,
      `at p=${p.toFixed(2)}: ${r} not in [${lo}, ${hi}]`)
  }
})
