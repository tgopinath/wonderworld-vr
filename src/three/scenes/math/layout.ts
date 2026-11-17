// Where zones sit on the activity table, and where each object rests given the engine's placements.
// Pure functions (unit-tested) — the 3D components just render the result.
import type { ActivityType } from '@/engine/core/types'
import type { Round, RoundState, ZoneId } from '@/engine/learning/round'
import { slotOffset, type Vec3 } from '@/engine/interaction/zones'

/** Activity table, in world space. Player stands at z ≈ TABLE.z + 0.65 facing −z. */
export const TABLE = { x: 0, z: -2.0, width: 1.4, depth: 0.7 }

export function tableHeight(mode: 'seated' | 'standing'): number {
  return mode === 'seated' ? 0.68 : 0.78
}

export interface ZoneLayout {
  id: ZoneId
  /** Offset from table centre on the table surface. */
  x: number
  z: number
  halfX: number
  halfZ: number
  variant: 'basket' | 'tray' | 'slot' | 'mat'
  color: string
  label?: string
  /** Show a live object count on the label. */
  counted?: boolean
  /** Only shown during this phase (number shelf for addition/subtraction). */
  phase?: 'answer'
}

const SHELF_ROW = 0.24
const ANSWER: ZoneLayout = { id: 'answer', x: 0.5, z: SHELF_ROW, halfX: 0.07, halfZ: 0.07, variant: 'slot', color: '#ffd166', label: 'Answer' }

export const ZONES: Record<ActivityType, ZoneLayout[]> = {
  counting: [
    { id: 'pile', x: -0.33, z: -0.05, halfX: 0.27, halfZ: 0.22, variant: 'mat', color: '#bde0fe', label: 'Pile' },
    { id: 'tray', x: 0.36, z: -0.05, halfX: 0.24, halfZ: 0.2, variant: 'basket', color: '#e9a15b', label: 'Basket', counted: true },
  ],
  numberRecognition: [
    { id: 'shelf', x: 0, z: -0.12, halfX: 0.6, halfZ: 0.11, variant: 'mat', color: '#e0e7ff', label: 'Numbers' },
    { ...ANSWER, x: 0, z: SHELF_ROW - 0.02, halfX: 0.08, halfZ: 0.08 },
  ],
  addition: [
    { id: 'left', x: -0.5, z: -0.12, halfX: 0.15, halfZ: 0.14, variant: 'basket', color: '#f28482', label: 'Basket A', counted: true },
    { id: 'combined', x: 0, z: -0.12, halfX: 0.24, halfZ: 0.18, variant: 'basket', color: '#e9a15b', label: 'Big basket', counted: true },
    { id: 'right', x: 0.5, z: -0.12, halfX: 0.15, halfZ: 0.14, variant: 'basket', color: '#84a59d', label: 'Basket B', counted: true },
    { id: 'shelf', x: -0.12, z: SHELF_ROW, halfX: 0.42, halfZ: 0.075, variant: 'mat', color: '#e0e7ff', phase: 'answer' },
    { ...ANSWER, phase: 'answer' },
  ],
  subtraction: [
    { id: 'group', x: -0.3, z: -0.12, halfX: 0.3, halfZ: 0.18, variant: 'mat', color: '#caffbf', label: 'Left here', counted: true },
    { id: 'away', x: 0.43, z: -0.12, halfX: 0.17, halfZ: 0.15, variant: 'basket', color: '#a3a3c2', label: 'Take-away box', counted: true },
    { id: 'shelf', x: -0.12, z: SHELF_ROW, halfX: 0.42, halfZ: 0.075, variant: 'mat', color: '#e0e7ff', phase: 'answer' },
    { ...ANSWER, phase: 'answer' },
  ],
}

export function zoneWorld(z: ZoneLayout, surfaceY: number): Vec3 {
  return [TABLE.x + z.x, surfaceY, TABLE.z + z.z]
}

/** Resting world position of every item, derived from where the engine says each one is. */
export function restPositions(round: Round, state: RoundState, surfaceY: number): Record<string, Vec3> {
  const zones = new Map(ZONES[round.type].map((z) => [z.id, z]))
  const byZone = new Map<ZoneId, string[]>()
  for (const it of round.items) {
    const zid = state.placements[it.id] ?? it.home
    const list = byZone.get(zid) ?? []
    list.push(it.id)
    byZone.set(zid, list)
  }
  const out: Record<string, Vec3> = {}
  for (const [zid, ids] of byZone) {
    const z = zones.get(zid)
    if (!z) continue
    const isNumbers = ids.some((id) => id.startsWith('num-'))
    const n = ids.length
    // Shrink spacing so big piles still fit without overlapping.
    const area = z.halfX * 2 * (z.halfZ * 2)
    const spacing = isNumbers ? Math.min(0.12, (z.halfX * 2) / Math.max(n, 1)) : Math.min(0.105, Math.sqrt(area / Math.max(n, 1)) * 0.95)
    ids.forEach((id, i) => {
      const [ox, oz] = isNumbers && zid !== 'answer' ? [(i - (n - 1) / 2) * spacing, 0] : zid === 'answer' ? [0, 0] : slotOffset(i, n, z.halfX - 0.04, z.halfZ - 0.04, spacing)
      out[id] = [TABLE.x + z.x + ox, surfaceY, TABLE.z + z.z + oz]
    })
  }
  return out
}
