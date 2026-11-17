// Geometry helpers for drop zones. Pure math on plain tuples, so it's testable without three.

export type Vec3 = [number, number, number]

export interface ZoneShape {
  id: string
  center: Vec3
  /** Half extents on x / z; y uses `height` above center. */
  halfX: number
  halfZ: number
  height: number
}

/** Generous, child-friendly drop test: inside the footprint (with margin) and not far above it. */
export function containsPoint(zone: ZoneShape, p: Vec3, margin = 0.04): boolean {
  const dx = Math.abs(p[0] - zone.center[0])
  const dz = Math.abs(p[2] - zone.center[2])
  const dy = p[1] - zone.center[1]
  return dx <= zone.halfX + margin && dz <= zone.halfZ + margin && dy >= -0.15 && dy <= zone.height + 0.6
}

/** Returns the zone whose center is closest among those containing the point. */
export function findZone(zones: readonly ZoneShape[], p: Vec3): ZoneShape | null {
  let best: ZoneShape | null = null
  let bestD = Infinity
  for (const z of zones) {
    if (!containsPoint(z, p)) continue
    const d = (p[0] - z.center[0]) ** 2 + (p[2] - z.center[2]) ** 2
    if (d < bestD) {
      bestD = d
      best = z
    }
  }
  return best
}

/**
 * Deterministic resting slots inside a zone so items never overlap: a centred grid,
 * filling row by row. Index i of n items → local [x, z] offset.
 */
export function slotOffset(i: number, n: number, halfX: number, halfZ: number, spacing = 0.11): [number, number] {
  const cols = Math.max(1, Math.min(Math.floor((halfX * 2) / spacing), Math.ceil(Math.sqrt(n * (halfX / Math.max(halfZ, 0.01))))))
  const rows = Math.ceil(n / cols)
  const col = i % cols
  const row = Math.floor(i / cols)
  const x = (col - (cols - 1) / 2) * spacing
  const z = (row - (rows - 1) / 2) * spacing
  return [clamp(x, -halfX, halfX), clamp(z, -halfZ, halfZ)]
}

function clamp(n: number, a: number, b: number) {
  return Math.min(Math.max(n, a), b)
}
