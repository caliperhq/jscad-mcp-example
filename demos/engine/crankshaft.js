'use strict'
const { primitives, booleans, transforms, hulls } = require('@jscad/modeling')
const { cylinder } = primitives
const { union } = booleans
const { translate, rotate } = transforms
const { hullChain } = hulls

/**
 * Single-cylinder crankshaft: main journal along X + offset crank pin +
 * two stadium-shaped webs connecting the journal to the pin. The webs
 * make this read as one continuous part (the previous version had the
 * pin floating with no visible connection to the journal). For a real
 * multi-cylinder crankshaft this whole assembly would repeat at each
 * throw with the angular phasing of the firing order.
 */
const JOURNAL_RADIUS = 12
const PIN_RADIUS     = 8
const WEB_THICKNESS  = 7    // X-thickness of each crank web
const PIN_LENGTH     = 20   // X length of the crank pin (gap between webs)
const JOURNAL_STUB   = 10   // how far the journal sticks past each web

const buildCrankshaft = (p) => {
  const r = p.stroke / 2
  const thetaRad = (p.crankAngle * Math.PI) / 180
  const crankCenterZ = -r   // main journal axis sits at z = -r

  // Pin offset from journal axis (in the Y-Z rotation plane)
  const offsetY = r * Math.sin(thetaRad)
  const offsetZ = r * Math.cos(thetaRad)

  // ---- Main journal: long cylinder along X --------------------------
  const journalLength = PIN_LENGTH + 2 * WEB_THICKNESS + 2 * JOURNAL_STUB
  const mainJournal = translate([0, 0, crankCenterZ],
    rotate([0, Math.PI / 2, 0],
      cylinder({ radius: JOURNAL_RADIUS, height: journalLength, segments: 48 })))

  // ---- Crank pin: cylinder along X, offset in Y-Z by the throw -------
  const pin = translate([0, offsetY, crankCenterZ + offsetZ],
    rotate([0, Math.PI / 2, 0],
      cylinder({ radius: PIN_RADIUS, height: PIN_LENGTH, segments: 32 })))

  // ---- Webs: hull two short along-X disks (journal end + pin end) ----
  // hullChain wraps a stadium around both — the canonical crank-web
  // shape. Build the template at the origin, then translate two copies
  // in X to flank the pin and onto the journal axis at z=crankCenterZ.
  const journalDisk = rotate([0, Math.PI / 2, 0],
    cylinder({ radius: JOURNAL_RADIUS, height: WEB_THICKNESS, segments: 48 }))
  const pinDisk = translate([0, offsetY, offsetZ],
    rotate([0, Math.PI / 2, 0],
      cylinder({ radius: PIN_RADIUS, height: WEB_THICKNESS, segments: 32 })))
  const webTemplate = hullChain(journalDisk, pinDisk)

  const webOuterOffset = PIN_LENGTH / 2 + WEB_THICKNESS / 2
  const leftWeb  = translate([-webOuterOffset, 0, crankCenterZ], webTemplate)
  const rightWeb = translate([ webOuterOffset, 0, crankCenterZ], webTemplate)

  return union(mainJournal, pin, leftWeb, rightWeb)
}

module.exports = { buildCrankshaft }
