// Where the player stands. Desktop rig animates toward targets; XR rig jumps (teleport-style).
import { create } from 'zustand'

export interface Bounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface Viewpoint {
  x: number
  z: number
  yaw: number
  /** Desktop only: camera pitch in radians (negative = look down). */
  pitch: number
  /** Desktop only: eye height override. */
  height?: number
}

interface PlayerState {
  x: number
  z: number
  yaw: number
  pitch: number
  height: number
  bounds: Bounds
  /** Desktop camera eases toward this when set. */
  target: Viewpoint | null
  /** Incremented on every discrete jump so the XR rig re-syncs. */
  jumpId: number
  setBounds(b: Bounds): void
  jumpTo(v: Viewpoint): void
  glideTo(v: Viewpoint): void
  walkTo(x: number, z: number): void
  /** Low-level per-frame update (desktop rig, XR turning). */
  setPose(p: Partial<Pick<PlayerState, 'x' | 'z' | 'yaw' | 'pitch' | 'height'>>): void
  clearTarget(): void
}

export const EYE_HEIGHT = 1.3

export function clampToBounds(x: number, z: number, b: Bounds): [number, number] {
  return [Math.min(Math.max(x, b.minX), b.maxX), Math.min(Math.max(z, b.minZ), b.maxZ)]
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  x: 0,
  z: 3,
  yaw: 0,
  pitch: -0.12,
  height: EYE_HEIGHT,
  bounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 },
  target: null,
  jumpId: 0,
  setBounds(bounds) {
    set({ bounds })
  },
  jumpTo(v) {
    set({ x: v.x, z: v.z, yaw: v.yaw, pitch: v.pitch, height: v.height ?? EYE_HEIGHT, target: null, jumpId: get().jumpId + 1 })
  },
  glideTo(v) {
    set({ target: v })
  },
  walkTo(x, z) {
    const [cx, cz] = clampToBounds(x, z, get().bounds)
    const s = get()
    // Face the walking direction, keep current pitch.
    const yaw = Math.atan2(-(cx - s.x), -(cz - s.z))
    set({ target: { x: cx, z: cz, yaw: Math.hypot(cx - s.x, cz - s.z) > 0.3 ? yaw : s.yaw, pitch: s.pitch, height: s.height } })
  },
  setPose(p) {
    set(p)
  },
  clearTarget() {
    set({ target: null })
  },
}))
