// The object interaction framework: one component for mouse, touch, XR rays, XR grip and hand pinch.
// It never decides correctness — it reports drops via `onDrop` and glides to `rest` (owned by the engine).
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Plane, Vector3, type Group, type Mesh, type MeshBasicMaterial } from 'three'
import { initialInteraction, interact, interactionLook, type InteractionContext, type InteractionEvent } from '@/engine/interaction/machine'
import { findZone, type Vec3 } from '@/engine/interaction/zones'
import { interactionLock } from '../rig/interactionLock'
import { pulse } from '../xr'
import { playSfx } from '@/audio/audio'
import { useZones } from './zoneRegistry'
import { registerDebugObject } from './debug'

export interface GrabbableProps {
  id: string
  /** World position the engine wants this object at (its zone slot). */
  rest: Vec3
  /** Height of the table surface objects slide on while dragged with a ray/mouse. */
  surfaceY: number
  /** Return true if the zone accepted the object. */
  onDrop: (id: string, zoneId: string | null) => boolean
  disabled?: boolean
  /** Glow for level-2 hints. */
  highlight?: boolean
  /** Footprint radius, used for the glow ring. */
  radius?: number
  label?: string
  /** Changing this snaps the interaction state back to idle (engine "reset objects"). */
  resetKey?: number
  children: ReactNode
}

/** pmndrs XR pointer events carry the pointer's own world pose; R3F mouse events don't. */
const pointerPos = (e: ThreeEvent<PointerEvent>) => (e as unknown as { pointerPosition?: Vector3 }).pointerPosition

const plane = new Plane(new Vector3(0, 1, 0), 0)
const hit = new Vector3()
const tmp = new Vector3()

type DragMode = { kind: 'ray'; offset: Vector3 } | { kind: 'grab'; offset: Vector3 }

export function Grabbable({ id, rest, surfaceY, onDrop, disabled, highlight, radius = 0.05, label, resetKey, children }: GrabbableProps) {
  const group = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const drag = useRef<DragMode | null>(null)
  const ctx = useRef<InteractionContext>(initialInteraction)
  const settleAt = useRef(0)
  const restV = useMemo(() => new Vector3(...rest), [rest])
  const selected = useZones((s) => s.selected === id)

  const send = (ev: InteractionEvent) => {
    ctx.current = interact(ctx.current, ev)
  }

  useEffect(() => {
    if (resetKey !== undefined && !drag.current) send({ type: 'reset' })
  }, [resetKey])

  useEffect(() => {
    if (!group.current) return
    group.current.position.set(...rest) // spawn in place on mount
    return registerDebugObject(id, group.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(
    () => () => {
      if (drag.current) interactionLock.grabbing = Math.max(0, interactionLock.grabbing - 1)
    },
    [],
  )

  const begin = (e: ThreeEvent<PointerEvent>) => {
    if (disabled || drag.current || !group.current) return
    e.stopPropagation()
    ;(e.target as unknown as { setPointerCapture(id: number): void }).setPointerCapture(e.pointerId)
    const pos = group.current.position
    if (e.pointerType === 'grab') {
      drag.current = { kind: 'grab', offset: pos.clone().sub(pointerPos(e) ?? e.point) }
    } else {
      plane.constant = -surfaceY
      const p = e.ray.intersectPlane(plane, hit) ?? e.point
      drag.current = { kind: 'ray', offset: new Vector3(pos.x - p.x, 0, pos.z - p.z) }
    }
    interactionLock.grabbing++
    useZones.getState().setSelected(null)
    send({ type: 'grab' })
    playSfx('pop', [pos.x, pos.y, pos.z])
    pulse(pointerPos(e), 0.5, 25)
  }

  const move = (e: ThreeEvent<PointerEvent>) => {
    const d = drag.current
    const g = group.current
    if (!d || !g) return
    e.stopPropagation()
    if (d.kind === 'grab') {
      g.position.copy(pointerPos(e) ?? e.point).add(d.offset)
      g.position.y = Math.max(g.position.y, surfaceY)
    } else {
      plane.constant = -surfaceY
      const p = e.ray.intersectPlane(plane, hit)
      if (!p) return
      g.position.set(p.x + d.offset.x, surfaceY + 0.08, p.z + d.offset.z)
    }
    const z = findZone(Object.values(useZones.getState().zones), [g.position.x, g.position.y, g.position.z])
    useZones.getState().setHot(z?.id ?? null)
  }

  const end = (e: ThreeEvent<PointerEvent>) => {
    const g = group.current
    if (!drag.current || !g) return
    e.stopPropagation()
    ;(e.target as unknown as { releasePointerCapture?(id: number): void }).releasePointerCapture?.(e.pointerId)
    drag.current = null
    interactionLock.grabbing = Math.max(0, interactionLock.grabbing - 1)
    useZones.getState().setHot(null)
    const zone = findZone(Object.values(useZones.getState().zones), [g.position.x, g.position.y, g.position.z])
    const accepted = onDrop(id, zone?.id ?? null)
    send({ type: 'release', accepted: zone ? accepted : null })
    settleAt.current = performance.now() + 700
    if (zone && !accepted) pulse(pointerPos(e), 0.2, 60)
    else pulse(pointerPos(e), 0.3, 20)
  }

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    if (!drag.current) {
      const a = 1 - Math.exp(-delta * 10)
      g.position.lerp(restV, a)
      if (settleAt.current && performance.now() > settleAt.current) {
        settleAt.current = 0
        send({ type: 'settle' })
      }
    }
    const lk = interactionLook(ctx.current.state)
    const s = (highlight ? 1.1 + Math.sin(performance.now() / 250) * 0.06 : 1) * lk.scale
    tmp.setScalar(s)
    g.scale.lerp(tmp, 1 - Math.exp(-delta * 14))
    if (ring.current) {
      const m = ring.current.material as MeshBasicMaterial
      const color = selected ? '#ffd166' : highlight ? '#fde047' : lk.outline
      ring.current.visible = !!color
      if (color) m.color.set(color)
    }
  })

  return (
    <group
      ref={group}
      name={`grab:${id}`}
      userData={{ label }}
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerOver={(e) => {
        e.stopPropagation()
        send({ type: 'hoverIn' })
        if (!disabled) document.body.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        send({ type: 'hoverOut' })
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        e.stopPropagation()
        // Tap/click without dragging = select; then tap a basket to place (accessible alternative to dragging).
        if ((e.delta ?? 0) < 6 && !disabled) {
          send({ type: 'select' })
          const z = useZones.getState()
          z.setSelected(z.selected === id ? null : id)
          playSfx('click')
        }
      }}
    >
      {children}
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.002} visible={false} raycast={() => null}>
        <ringGeometry args={[radius * 1.05, radius * 1.35, 32]} />
        <meshBasicMaterial transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </group>
  )
}
