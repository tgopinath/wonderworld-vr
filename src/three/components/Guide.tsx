// "Pip", the friendly robot guide. Hovers gently, blinks, turns to face the player,
// waves when praising, and shows the current caption in a speech bubble (visible in VR too).
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, Vector3, type Group, type Mesh } from 'three'
import { useSessionStore } from '@/state/sessionStore'
import { Label } from '../ui/Label'

const camPos = new Vector3()
const me = new Vector3()

export function Guide({ position, bubble = true, scale = 1 }: { position: [number, number, number]; bubble?: boolean; scale?: number }) {
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const arm = useRef<Group>(null)
  const eyes = useRef<Mesh[]>([])
  const camera = useThree((s) => s.camera)
  const caption = useSessionStore((s) => s.caption)
  const waveUntil = useRef(0)
  const lastCaption = useRef<number | null>(null)

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    if (caption && caption.id !== lastCaption.current) {
      lastCaption.current = caption.id
      if (caption.tone === 'praise') waveUntil.current = t + 2
    }
    if (body.current) body.current.position.y = Math.sin(t * 1.6) * 0.03
    if (root.current) {
      camera.getWorldPosition(camPos)
      root.current.getWorldPosition(me)
      const target = Math.atan2(camPos.x - me.x, camPos.z - me.z)
      root.current.rotation.y = MathUtils.lerp(root.current.rotation.y, target, 1 - Math.exp(-delta * 3))
    }
    if (arm.current) arm.current.rotation.z = t < waveUntil.current ? -2.2 + Math.sin(t * 10) * 0.4 : MathUtils.lerp(arm.current.rotation.z, -0.3, 0.1)
    const blink = Math.sin(t * 0.9) > 0.985 ? 0.15 : 1
    for (const e of eyes.current) if (e) e.scale.y = blink
  })

  return (
    <group position={position} scale={scale}>
      <group ref={root}>
        <group ref={body}>
          {/* body */}
          <mesh position-y={0.42} castShadow>
            <capsuleGeometry args={[0.16, 0.16, 8, 16]} />
            <meshStandardMaterial color="#7dd3fc" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.42, 0.15]}>
            <circleGeometry args={[0.07, 24]} />
            <meshStandardMaterial color="#ffffff" emissive="#fde68a" emissiveIntensity={0.5} />
          </mesh>
          {/* head */}
          <mesh position-y={0.78} castShadow>
            <sphereGeometry args={[0.17, 24, 18]} />
            <meshStandardMaterial color="#e0f2fe" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.78, 0.1]} scale={[1, 0.75, 0.6]}>
            <sphereGeometry args={[0.13, 20, 14]} />
            <meshStandardMaterial color="#1e293b" roughness={0.2} />
          </mesh>
          {[-0.05, 0.05].map((x, i) => (
            <mesh key={x} ref={(m) => void (m && (eyes.current[i] = m))} position={[x, 0.79, 0.18]}>
              <sphereGeometry args={[0.024, 12, 10]} />
              <meshBasicMaterial color="#5eead4" />
            </mesh>
          ))}
          {/* antenna */}
          <mesh position-y={0.98}>
            <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position-y={1.03}>
            <sphereGeometry args={[0.025, 12, 10]} />
            <meshStandardMaterial color="#fb7185" emissive="#fb7185" emissiveIntensity={0.6} />
          </mesh>
          {/* arms */}
          <group position={[-0.18, 0.5, 0]} rotation-z={0.3}>
            <mesh position-y={-0.08}>
              <capsuleGeometry args={[0.03, 0.12, 4, 8]} />
              <meshStandardMaterial color="#38bdf8" />
            </mesh>
          </group>
          <group ref={arm} position={[0.18, 0.5, 0]} rotation-z={-0.3}>
            <mesh position-y={-0.08}>
              <capsuleGeometry args={[0.03, 0.12, 4, 8]} />
              <meshStandardMaterial color="#38bdf8" />
            </mesh>
          </group>
        </group>
        {/* hover shadow disc */}
        <mesh rotation-x={-Math.PI / 2} position-y={0.01}>
          <circleGeometry args={[0.18, 24]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.15} depthWrite={false} />
        </mesh>
        {bubble && caption && (
          <Label key={caption.id} position={[0, 1.25, 0]} size={0.055} maxWidth={1.1} bg={caption.tone === 'hint' ? '#fff3c4f0' : caption.tone === 'praise' ? '#d1fae5f0' : '#fffffff0'}>
            {caption.text}
          </Label>
        )}
      </group>
    </group>
  )
}
