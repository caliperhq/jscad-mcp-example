'use strict'
const assert = require('node:assert/strict')
const { test } = require('node:test')
const { buildThreadHelix } = require('../examples/lib/thread')
const { geometries } = require('@jscad/modeling')
const { geom3 } = geometries

test('buildThreadHelix produces a geom3 with polygons', () => {
  const t = buildThreadHelix({ majorRadius: 4, minorRadius: 3.3, pitch: 1.25, height: 10 })
  assert.ok(t, 'should return a geometry')
  const polys = geom3.toPolygons(t)
  assert.ok(polys.length > 0, 'should have polygons')
  for (const poly of polys) {
    assert.ok(poly.vertices.length >= 3, `polygon has only ${poly.vertices.length} vertices`)
    for (const v of poly.vertices) {
      assert.ok(Number.isFinite(v[0]) && Number.isFinite(v[1]) && Number.isFinite(v[2]),
        `non-finite vertex ${v}`)
    }
  }
})

test('buildThreadHelix scales polygon count with height/pitch ratio', () => {
  const short = buildThreadHelix({ majorRadius: 4, minorRadius: 3.3, pitch: 1.25, height: 5 })
  const tall  = buildThreadHelix({ majorRadius: 4, minorRadius: 3.3, pitch: 1.25, height: 20 })
  const ns = geom3.toPolygons(short).length
  const nt = geom3.toPolygons(tall).length
  assert.ok(nt > ns * 2, `tall (${nt} polys) should have at least 2x short (${ns} polys)`)
})

test('buildThreadHelix rejects bad parameters', () => {
  assert.throws(() => buildThreadHelix({ majorRadius: 3, minorRadius: 4, pitch: 1, height: 5 }),
    /majorRadius must exceed minorRadius/)
  assert.throws(() => buildThreadHelix({ majorRadius: 4, minorRadius: 3, pitch: 0, height: 5 }),
    /pitch must be > 0/)
  assert.throws(() => buildThreadHelix({ majorRadius: 4, minorRadius: 3, pitch: 1, height: 0 }),
    /height must be > 0/)
})
