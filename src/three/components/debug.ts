// Test/debug bridge: lets Playwright find where 3D objects are on screen so it can perform
// REAL mouse drags. Exposed only in dev builds or when ?e2e is in the URL. Read-only.
import { Vector3, type Camera, type Object3D } from 'three'
import { useSessionStore } from '@/state/sessionStore'
import { useZones } from './zoneRegistry'
import { usePlayerStore } from '@/state/playerStore'
import { exitVR, xrStore } from '../xr'

const objects = new Map<string, Object3D>()
let camera: Camera | null = null
let canvas: HTMLCanvasElement | null = null
let frames = 0

/** Called once per rendered frame by the canvas (lets tests wait for real frames). */
export function tickDebugFrame() {
  frames++
}

export const debugEnabled =
  typeof window !== 'undefined' && (import.meta.env.DEV || new URLSearchParams(window.location.search).has('e2e'))

export function registerDebugObject(id: string, obj: Object3D) {
  if (!debugEnabled) return () => {}
  objects.set(id, obj)
  return () => {
    if (objects.get(id) === obj) objects.delete(id)
  }
}

export function registerDebugView(c: Camera, el: HTMLCanvasElement) {
  camera = c
  canvas = el
}

const v = new Vector3()
function screenOf(obj: Object3D) {
  obj.getWorldPosition(v)
  return project(v)
}

function project(world: Vector3) {
  if (!camera || !canvas) return null
  v.copy(world).project(camera)
  const r = canvas.getBoundingClientRect()
  return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height }
}

if (debugEnabled) {
  ;(window as unknown as { __ww: unknown }).__ww = {
    ids: () => [...objects.keys()],
    frames: () => frames,
    round: () => {
      const { round, roundState, celebration, scene, loading } = useSessionStore.getState()
      return { scene, loading, moving: usePlayerStore.getState().target !== null, round, placements: roundState?.placements, phase: roundState?.phase, mistakes: roundState?.mistakes, celebration }
    },
    zone: (id: string) => {
      const z = useZones.getState().zones[id]
      return z ? project(new Vector3(z.center[0], z.center[1] + 0.03, z.center[2])) : null
    },
    xrVisibility: () => xrStore.getState().visibilityState,
    exitVR,
    /** Log raw XR select/squeeze events (debugging emulated input). */
    traceXRInput: () => {
      const session = xrStore.getState().session
      for (const t of ['selectstart', 'selectend', 'select', 'squeezestart', 'squeezeend']) session?.addEventListener(t, (e) => console.log('[wwdbg] xr', t, (e as XRInputSourceEvent).inputSource.handedness))
      return !!session
    },
    xr: () =>
      xrStore.getState().inputSourceStates.map((st) => {
        const obj = 'object' in st ? st.object : undefined
        return {
          type: st.type,
          hand: st.inputSource.handedness,
          world: obj ? obj.getWorldPosition(new Vector3()).toArray() : null,
          // Forward (−Z) of the grip object (the ray uses the target-ray space, tilted from this).
          dir: obj ? obj.getWorldDirection(new Vector3()).negate().toArray() : null,
        }
      }),
    camera: () => (camera ? { position: camera.position.toArray(), rotation: camera.rotation.toArray().slice(0, 3) } : null),
    /** World-space position of a registered object / zone, and the player origin (for XR scripting). */
    world: (id: string) => objects.get(id)?.getWorldPosition(new Vector3()).toArray() ?? null,
    zoneWorld: (id: string) => useZones.getState().zones[id]?.center ?? null,
    player: () => {
      const p = usePlayerStore.getState()
      return { x: p.x, z: p.z, yaw: p.yaw }
    },
    screen: (id: string) => {
      const o = objects.get(id)
      return o ? screenOf(o) : null
    },
  }
}
