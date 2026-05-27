'use strict'
const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { bundleEntry } = require('../scripts/bundle-examples')

const evalBundle = (src) => {
  const tmp = path.join(os.tmpdir(), `examples_bundled_test_${process.pid}_${Math.random().toString(36).slice(2)}.js`)
  fs.writeFileSync(tmp, src)
  try {
    delete require.cache[tmp]
    return require(tmp)
  } finally {
    fs.unlinkSync(tmp)
  }
}

for (const [entry, expectedParts] of [
  ['cycloidal_drive.jscad', ['eccentric_input', 'cycloid_disc', 'pin_housing', 'output_pins']],
  ['gyroid.jscad',          ['lattice', 'shell']]
]) {
  test(`bundleEntry(${entry}): no relative requires remain, jscad/modeling preserved`, () => {
    const src = bundleEntry(entry)
    const internal = src.match(/require\(['"]\.\.?\//g) || []
    assert.deepEqual(internal, [], 'no relative requires should remain')
    assert.ok(src.includes("require('@jscad/modeling')"), 'jscad/modeling require preserved')
  })

  test(`bundleEntry(${entry}): output evaluates and exposes main/parts/getParameterDefinitions`, () => {
    const m = evalBundle(bundleEntry(entry))
    assert.equal(typeof m.main, 'function')
    assert.equal(typeof m.getParameterDefinitions, 'function')
    assert.ok(m.parts && typeof m.parts === 'object')
    for (const p of expectedParts) assert.ok(p in m.parts, `parts.${p} present`)
    const out = m.main()
    assert.ok(Array.isArray(out) && out.length > 0, 'main() returns a non-empty array')
  })
}
