// Animated 3D backdrop for the welcome screen: drifting numbers and shapes (gentle, no flashing).
import { Float, Text } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { FONT } from './ui/fonts'

const SHAPES = [
  { p: [-3.2, 1.4, -2], c: '#ff8a3d', t: '1' },
  { p: [3.1, 1.1, -2.5], c: '#6c5ce7', t: '2' },
  { p: [-2.4, -1.4, -1.5], c: '#06d6a0', t: '3' },
  { p: [2.6, -1.2, -1.8], c: '#ef476f', t: '+' },
  { p: [1.4, -2.3, -3.5], c: '#118ab2', t: '5' },
  { p: [-4.2, -0.2, -3], c: '#ffd166', t: '=' },
] as const

function Drift() {
  const g = useRef<Group>(null)
  useFrame(({ clock, pointer }) => {
    if (!g.current) return
    g.current.rotation.y = Math.sin(clock.elapsedTime * 0.1) * 0.15 + pointer.x * 0.08
    g.current.rotation.x = pointer.y * 0.05
  })
  return (
    <group ref={g}>
      {SHAPES.map((s, i) => (
        <Float key={i} speed={1.2} rotationIntensity={0.6} floatIntensity={1.2}>
          <group position={s.p as unknown as [number, number, number]}>
            <mesh>
              {i % 3 === 0 ? <icosahedronGeometry args={[0.55, 0]} /> : i % 3 === 1 ? <torusGeometry args={[0.45, 0.16, 16, 32]} /> : <boxGeometry args={[0.7, 0.7, 0.7]} />}
              <meshStandardMaterial color={s.c} roughness={0.35} flatShading={i % 3 === 0} />
            </mesh>
            <Text font={FONT} fontSize={0.42} position-z={0.62} color="#ffffff" outlineWidth={0.02} outlineColor={s.c}>
              {s.t}
            </Text>
          </group>
        </Float>
      ))}
    </group>
  )
}

export default function WelcomeBackground() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 1.5]} aria-hidden style={{ position: 'absolute', inset: 0 }}>
      <hemisphereLight args={['#ffffff', '#c7d2fe', 1.3]} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <Drift />
    </Canvas>
  )
}
