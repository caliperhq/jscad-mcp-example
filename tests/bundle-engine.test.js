'use strict'
const assert = require('node:assert/strict')
const { test } = require('node:test')
const { bundleEngine } = require('../scripts/bundle-engine')

test('bundleEngine produces a single-file string with no internal requires and one module.exports', () => {
  const bundled = bundleEngine()
  // No relative requires
  const internalRequires = bundled.match(/require\(['"](\.\/|\.\.\/)/g) || []
  assert.deepEqual(internalRequires, [], 'no relative requires should remain')
  // Exactly one module.exports = { ... } block
  const exportsCount = (bundled.match(/^module\.exports\s*=\s*{/gm) || []).length
  assert.equal(exportsCount, 1, 'exactly one module.exports block')
  // @jscad/modeling require survives
  assert.ok(bundled.includes("require('@jscad/modeling')"), 'jscad/modeling require preserved')
})

test('bundleEngine output evaluates and exports main + parts + getParameterDefinitions', () => {
  const bundled = require('../scripts/bundle-engine').bundleEngine()
  const fs = require('node:fs')
  const path = require('node:path')
  const os = require('node:os')
  const tmp = path.join(os.tmpdir(), `engine_bundled_test_${process.pid}.js`)
  fs.writeFileSync(tmp, bundled)
  try {
    delete require.cache[tmp]
    const m = require(tmp)
    assert.equal(typeof m.main, 'function')
    assert.equal(typeof m.getParameterDefinitions, 'function')
    assert.ok(m.parts && typeof m.parts === 'object')
    assert.ok(Object.keys(m.parts).includes('block'))
  } finally {
    fs.unlinkSync(tmp)
  }
})
