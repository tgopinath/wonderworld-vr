// A floating world portal. Available worlds are clickable (mouse, tap, XR trigger) and open
// when you teleport/walk into them; unavailable ones are clearly marked "Coming soon".
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from 'three'
import type { WorldDefinition } from '@/config/worlds'
import { Label } from '../ui/Label'
import { FONT } from '../ui/fonts'
import { playSfx } from '@/audio/audio'
import { usePlayerStore } from '@/state/playerStore'
import { registerDebugObject } from './debug'

export function Portal({
  world,
  position,
  rotationY = 0,
  progress,
  onEnter,
}: {
  world: WorldDefinition
  position: [number, number, number]
  rotationY?: number
  progress: number
  onEnter: () => void
}) {
  const root = useRef<Group>(null)
  const disc = useRef<Mesh>(null)
  const ring = useRef<Group>(null)
  const [hover, setHover] = useState(false)
  const entered = useRef(false)
  useEffect(() => (disc.current ? registerDebugObject(`portal:${world.id}`, disc.current) : undefined), [world.id])

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    if (disc.current) {
      disc.current.rotation.z = t * (world.available ? 0.6 : 0.15)
      const m = disc.current.material as MeshStandardMaterial
      m.emissiveIntensity = MathUtils.lerp(m.emissiveIntensity, world.available ? (hover ? 1.1 : 0.7) : 0.15, 1 - Math.exp(-delta * 8))
    }
    if (ring.current) ring.current.position.y = 1.05 + Math.sin(t * 1.2 + position[0]) * 0.04
    // Walk/teleport into an open portal to enter it.
    if (world.available) {
      const p = usePlayerStore.getState()
      const d = Math.hypot(p.x - position[0], p.z - position[2])
      if (d < 0.45 && !entered.current) {
        entered.current = true
        onEnter()
      } else if (d > 0.9) entered.current = false
    }
  })

  return (
    <group ref={root} position={position} rotation-y={rotationY} name={`portal:${world.id}`}>
      <group ref={ring}>
        <mesh castShadow>
          <torusGeometry args={[0.46, 0.055, 16, 48]} />
          <meshStandardMaterial color={world.available ? world.color : '#9aa3b5'} roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh
          ref={disc}
          onClick={(e) => {
            e.stopPropagation()
            if (world.available) {
              playSfx('whoosh')
              onEnter()
            } else playSfx('tryAgain')
          }}
          onPointerDown={(e) => console.log('[wwdbg] portal down', e.pointerType)}
          onPointerUp={(e) => console.log('[wwdbg] portal up', e.pointerType)}
          onPointerOver={(e) => {
            console.log('[wwdbg] portal over', e.pointerType)
            e.stopPropagation()
            setHover(true)
            document.body.style.cursor = world.available ? 'pointer' : 'not-allowed'
          }}
          onPointerOut={() => {
            setHover(false)
            document.body.style.cursor = ''
          }}
        >
          <circleGeometry args={[0.43, 48]} />
          <meshStandardMaterial color={world.available ? world.accent : '#d7dbe4'} emissive={world.available ? world.color : '#8b93a6'} emissiveIntensity={0.7} transparent opacity={0.92} roughness={1} />
        </mesh>
        {world.available ? (
          <Text font={FONT} fontSize={0.26} position-z={0.02} color="#ffffff" outlineWidth={0.012} outlineColor={world.color} anchorX="center" anchorY="middle" raycast={() => null}>
            {world.glyph}
          </Text>
        ) : (
          <group position-z={0.03}>
            <mesh position-y={-0.04} raycast={() => null}>
              <boxGeometry args={[0.2, 0.16, 0.05]} />
              <meshStandardMaterial color="#8b93a6" />
            </mesh>
            <mesh position-y={0.05} raycast={() => null}>
              <torusGeometry args={[0.065, 0.018, 8, 20, Math.PI]} />
              <meshStandardMaterial color="#8b93a6" />
            </mesh>
          </group>
        )}
      </group>
      <Label position={[0, 0.42, 0.05]} size={0.075} bg="#ffffffe8" color="#1f2a44">
        {world.title}
      </Label>
      <Label position={[0, 0.27, 0.05]} size={0.06} color={world.available ? '#0f766e' : '#475569'}>
        {world.available ? (progress > 0 ? `${progress}% explored · Tap to enter` : 'Tap to enter') : 'Coming soon'}
      </Label>
      {/* pedestal */}
      <mesh position-y={0.08} receiveShadow castShadow>
        <cylinderGeometry args={[0.45, 0.55, 0.16, 32]} />
        <meshStandardMaterial color={world.available ? world.accent : '#e2e5ec'} roughness={0.7} />
      </mesh>
    </group>
  )
}
