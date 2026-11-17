// 3D reward animation after a completed round: earned stars rise and spin, gentle confetti drifts down.
// Smooth motion only — no flashing, no strobing.
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, InstancedMesh, Object3D, type Group } from 'three'
import { useSessionStore } from '@/state/sessionStore'
import { geo, mats } from './Items'

const CONFETTI = 70
const COLORS = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#8338ec', '#ff9f1c']
const dummy = new Object3D()

export function RewardBurst({ origin }: { origin: [number, number, number] }) {
  const celebration = useSessionStore((s) => s.celebration)
  const stars = useRef<Group>(null)
  const confetti = useRef<InstancedMesh>(null)
  const start = useRef(-1)
  const seeds = useMemo(
    () => Array.from({ length: CONFETTI }, () => ({ x: (Math.random() - 0.5) * 1.4, z: (Math.random() - 0.5) * 0.8, s: 0.6 + Math.random() * 0.8, r: Math.random() * 6 })),
    [],
  )

  useEffect(() => {
    const m = confetti.current
    if (!m) return
    const c = new Color()
    for (let i = 0; i < CONFETTI; i++) m.setColorAt(i, c.set(COLORS[i % COLORS.length]!))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [])

  useEffect(() => {
    if (celebration) start.current = -2 // armed: set on next frame using the clock
  }, [celebration])

  useFrame(({ clock }) => {
    const t0 = start.current
    if (t0 === -1) return
    if (t0 === -2) start.current = clock.elapsedTime
    const t = clock.elapsedTime - start.current
    const done = t > 3
    const g = stars.current
    if (g) {
      g.visible = !done
      g.children.forEach((child, i) => {
        const k = Math.min(1, t / 1.2)
        const ease = 1 - (1 - k) ** 3
        child.position.set((i - (g.children.length - 1) / 2) * 0.18, 0.1 + ease * 0.55, 0)
        child.rotation.y = t * 3 + i
        child.scale.setScalar(Math.min(1, t * 3) * (t > 2.4 ? Math.max(0, (3 - t) / 0.6) : 1) * 1.6)
      })
    }
    const m = confetti.current
    if (m) {
      m.visible = !done
      for (let i = 0; i < CONFETTI; i++) {
        const s = seeds[i]!
        const y = 1.1 - ((t * s.s * 0.45) % 1.3)
        dummy.position.set(s.x + Math.sin(t * 2 + s.r) * 0.05, Math.max(0, y), s.z)
        dummy.rotation.set(t * 2 + s.r, t * 3 + s.r, 0)
        dummy.scale.setScalar(t < 2.5 ? 1 : Math.max(0, (3 - t) / 0.5))
        dummy.updateMatrix()
        m.setMatrixAt(i, dummy.matrix)
      }
      m.instanceMatrix.needsUpdate = true
    }
    if (done) start.current = -1
  })

  return (
    <group position={origin}>
      <group ref={stars} visible={false}>
        {Array.from({ length: celebration?.stars ?? 0 }, (_, i) => (
          <mesh key={`${celebration?.id}-${i}`} geometry={geo.star} material={mats.star} scale={0} />
        ))}
      </group>
      <instancedMesh ref={confetti} args={[undefined, undefined, CONFETTI]} visible={false} frustumCulled={false}>
        <planeGeometry args={[0.025, 0.012]} />
        <meshBasicMaterial side={2} />
      </instancedMesh>
    </group>
  )
}
