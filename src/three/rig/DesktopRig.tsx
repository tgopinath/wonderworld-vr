// Desktop + mobile navigation: WASD/arrows walk, Q/E turn, drag empty space to look,
// click/tap the floor to walk there. No pointer lock, so the mouse stays free for grabbing.
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils } from 'three'
import { clampToBounds, usePlayerStore } from '@/state/playerStore'
import { interactionLock } from './interactionLock'

const SPEED = 2.2
const TURN = 1.8

export function DesktopRig() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const keys = useRef(new Set<string>())
  const drag = useRef<{ x: number; y: number; active: boolean; id: number } | null>(null)

  useEffect(() => {
    const isTyping = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
    const down = (e: KeyboardEvent) => {
      if (isTyping(e)) return
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keys.current.add(k)
        usePlayerStore.getState().clearTarget()
        if (k.startsWith('arrow')) e.preventDefault()
      }
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase())
    const blur = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  useEffect(() => {
    const el = gl.domElement
    const onDown = (e: PointerEvent) => {
      drag.current = { x: e.clientX, y: e.clientY, active: false, id: e.pointerId }
    }
    const onMove = (e: PointerEvent) => {
      const d = drag.current
      if (!d || d.id !== e.pointerId || interactionLock.grabbing > 0) return
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (!d.active && Math.hypot(dx, dy) < 6) return
      d.active = true
      d.x = e.clientX
      d.y = e.clientY
      const p = usePlayerStore.getState()
      const k = e.pointerType === 'touch' ? 0.006 : 0.004
      usePlayerStore.setState({ yaw: p.yaw + dx * k, pitch: MathUtils.clamp(p.pitch + dy * k, -1.1, 0.6), target: null })
    }
    const onUp = (e: PointerEvent) => {
      if (drag.current?.id === e.pointerId) drag.current = null
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [gl])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const p = usePlayerStore.getState()
    let { x, z, yaw, pitch, height } = p
    const k = keys.current
    const fwd = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0)
    const strafe = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0)
    const turn = (k.has('q') || k.has('arrowleft') ? 1 : 0) - (k.has('e') || k.has('arrowright') ? 1 : 0)
    yaw += turn * TURN * delta
    if (fwd || strafe) {
      x += (-Math.sin(yaw) * fwd + Math.cos(yaw) * strafe) * SPEED * delta
      z += (-Math.cos(yaw) * fwd - Math.sin(yaw) * strafe) * SPEED * delta
    }
    if (p.target) {
      const t = p.target
      const a = 1 - Math.exp(-delta * 4)
      x = MathUtils.lerp(x, t.x, a)
      z = MathUtils.lerp(z, t.z, a)
      yaw = lerpAngle(yaw, t.yaw, a)
      pitch = MathUtils.lerp(pitch, t.pitch, a)
      height = MathUtils.lerp(height, t.height ?? height, a)
      if (Math.hypot(x - t.x, z - t.z) < 0.01 && Math.abs(angleDiff(yaw, t.yaw)) < 0.01) usePlayerStore.setState({ target: null })
    }
    ;[x, z] = clampToBounds(x, z, p.bounds)
    if (x !== p.x || z !== p.z || yaw !== p.yaw || pitch !== p.pitch || height !== p.height) p.setPose({ x, z, yaw, pitch, height })
    camera.position.set(x, height, z)
    camera.rotation.set(pitch, yaw, 0, 'YXZ')
  })

  return null
}

function angleDiff(a: number, b: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

function lerpAngle(a: number, b: number, t: number) {
  return a + angleDiff(a, b) * t
}
