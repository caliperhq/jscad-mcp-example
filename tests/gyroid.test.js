'use strict'
const assert = require('node:assert/strict')
const { test } = require('node:test')
const { gyroidField } = require('../examples/lib/gyroid')

test('gyroidField is zero at the origin', () => {
  assert.equal(gyroidField(0, 0, 0, 1), 0)
})

test('gyroidField is periodic with given cellSize', () => {
  const cell = 10
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 50, y = Math.random() * 50, z = Math.random() * 50
    const a = gyroidField(x, y, z, cell)
    const b = gyroidField(x + cell, y + cell, z + cell, cell)
    assert.ok(Math.abs(a - b) < 1e-9, `not periodic: a=${a} b=${b}`)
  }
})

test('gyroidField is bounded in [-3, 3]', () => {
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 100 - 50, y = Math.random() * 100 - 50, z = Math.random() * 100 - 50
    const v = gyroidField(x, y, z, 10)
    assert.ok(v >= -3 && v <= 3, `value ${v} out of bounds`)
  }
})
