'use strict'
const { edgeTable, triTable } = require('./marching-cubes-tables')

/**
 * Standard marching cubes over a regular grid.
 *
 * @param {object} opts
 * @param {(x:number, y:number, z:number) => number} opts.sampler - implicit field
 * @param {[[number,number,number],[number,number,number]]} opts.bbox
 * @param {number|[number,number,number]} opts.resolution - cells per axis
 * @param {number} [opts.isoLevel=0]
 * @returns {{positions:number[][], indices:number[][]}}
 */
const marchingCubes = ({ sampler, bbox, resolution, isoLevel = 0 }) => {
  const [[xmin, ymin, zmin], [xmax, ymax, zmax]] = bbox
  const [nx, ny, nz] = Array.isArray(resolution)
    ? resolution
    : [resolution, resolution, resolution]
  const dx = (xmax - xmin) / nx
  const dy = (ymax - ymin) / ny
  const dz = (zmax - zmin) / nz

  // Pre-sample the full grid once.
  const grid = new Float32Array((nx + 1) * (ny + 1) * (nz + 1))
  const idx = (i, j, k) => i + (nx + 1) * (j + (ny + 1) * k)
  for (let k = 0; k <= nz; k++) {
    for (let j = 0; j <= ny; j++) {
      for (let i = 0; i <= nx; i++) {
        grid[idx(i, j, k)] = sampler(xmin + i * dx, ymin + j * dy, zmin + k * dz)
      }
    }
  }

  const positions = []
  const indices = []
  // Edge cache: maps "i,j,k,edgeId" -> vertex index in positions
  const cache = new Map()

  // Local edge corner pairs for a unit cube (Bourke convention):
  // edge: corner-a, corner-b
  const edgeCornerPairs = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ]
  // Corner offsets within the cube (i,j,k)
  const cornerOffsets = [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
  ]

  const interp = (p1, p2, v1, v2) => {
    const t = (isoLevel - v1) / (v2 - v1)
    return [
      p1[0] + t * (p2[0] - p1[0]),
      p1[1] + t * (p2[1] - p1[1]),
      p1[2] + t * (p2[2] - p1[2])
    ]
  }

  const cellPos = (i, j, k, o) => [
    xmin + (i + o[0]) * dx,
    ymin + (j + o[1]) * dy,
    zmin + (k + o[2]) * dz
  ]

  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const v = cornerOffsets.map((o) => grid[idx(i + o[0], j + o[1], k + o[2])])
        let cubeIndex = 0
        for (let c = 0; c < 8; c++) if (v[c] < isoLevel) cubeIndex |= (1 << c)
        const eMask = edgeTable[cubeIndex]
        if (eMask === 0) continue

        const vertIdx = new Array(12).fill(-1)
        for (let e = 0; e < 12; e++) {
          if (!(eMask & (1 << e))) continue
          const key = `${i},${j},${k},${e}`
          let cached = cache.get(key)
          if (cached === undefined) {
            const [a, b] = edgeCornerPairs[e]
            const pa = cellPos(i, j, k, cornerOffsets[a])
            const pb = cellPos(i, j, k, cornerOffsets[b])
            const pos = interp(pa, pb, v[a], v[b])
            cached = positions.length
            positions.push(pos)
            cache.set(key, cached)
          }
          vertIdx[e] = cached
        }

        const tris = triTable[cubeIndex]
        for (let t = 0; tris[t] !== -1; t += 3) {
          indices.push([vertIdx[tris[t]], vertIdx[tris[t + 1]], vertIdx[tris[t + 2]]])
        }
      }
    }
  }
  return { positions, indices }
}

module.exports = { marchingCubes }
