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
const WEB_THICKNESS  = 8    // X-thickness of each crank web
const PIN_LENGTH     = 22   // X length of the crank pin (gap between webs)
const JOURNAL_STUB   = 18   // length of each main-journal segment past a web

const buildCrankshaft = (p) => {
  const r = p.stroke / 2
  const thetaRad = (p.crankAngle * Math.PI) / 180
  const crankCenterZ = -r   // main journal axis sits at z = -r

  // Pin offset from journal axis (in the Y-Z rotation plane)
  const offsetY = r * Math.sin(thetaRad)
  const offsetZ = r * Math.cos(thetaRad)

  // X-position of the OUTER face of each web (and inner face of journal)
  const webOuterX = PIN_LENGTH / 2 + WEB_THICKNESS

  // ---- Main journal: TWO segments split by the throw ----------------
  // A real crankshaft has a gap in the main journal at every throw —
  // the web + pin assembly fills that gap with an offset rotating
  // mass. Without the gap, the journal would pass through the webs
  // and the part couldn't physically rotate.
  const journalSegment = rotate([0, Math.PI / 2, 0],
    cylinder({ radius: JOURNAL_RADIUS, height: JOURNAL_STUB, segments: 48 }))
  const leftJournal  = translate([-(webOuterX + JOURNAL_STUB / 2), 0, crankCenterZ], journalSegment)
  const rightJournal = translate([ (webOuterX + JOURNAL_STUB / 2), 0, crankCenterZ], journalSegment)

  // ---- Crank pin: cylinder along X, offset in Y-Z by the throw -------
  const pin = translate([0, offsetY, crankCenterZ + offsetZ],
    rotate([0, Math.PI / 2, 0],
      cylinder({ radius: PIN_RADIUS, height: PIN_LENGTH, segments: 32 })))

  // ---- Webs: hull two short along-X disks (journal end + pin end) ----
  // hullChain wraps a stadium around both — the canonical crank-web
  // shape. Build the template at the origin, then translate two copies
  // in X to flank the pin and sit on the journal axis at z=crankCenterZ.
  const journalDisk = rotate([0, Math.PI / 2, 0],
    cylinder({ radius: JOURNAL_RADIUS, height: WEB_THICKNESS, segments: 48 }))
  const pinDisk = translate([0, offsetY, offsetZ],
    rotate([0, Math.PI / 2, 0],
      cylinder({ radius: PIN_RADIUS, height: WEB_THICKNESS, segments: 32 })))
  const webTemplate = hullChain(journalDisk, pinDisk)

  const webCenterX = PIN_LENGTH / 2 + WEB_THICKNESS / 2
  const leftWeb  = translate([-webCenterX, 0, crankCenterZ], webTemplate)
  const rightWeb = translate([ webCenterX, 0, crankCenterZ], webTemplate)

  return union(leftJournal, rightJournal, pin, leftWeb, rightWeb)
}

module.exports = { buildCrankshaft }
