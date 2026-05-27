'use strict'

/**
 * Gyroid implicit surface scalar field.
 *   f(x,y,z) = sin(kx) cos(ky) + sin(ky) cos(kz) + sin(kz) cos(kx)
 * where k = 2*PI / cellSize.
 *
 * The surface is f=0; the solid region for a thickened gyroid is |f| < t.
 */
const gyroidField = (x, y, z, cellSize) => {
  const k = (2 * Math.PI) / cellSize
  const X = x * k, Y = y * k, Z = z * k
  return Math.sin(X) * Math.cos(Y)
       + Math.sin(Y) * Math.cos(Z)
       + Math.sin(Z) * Math.cos(X)
}

module.exports = { gyroidField }
