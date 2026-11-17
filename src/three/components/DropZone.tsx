import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { type Mesh, type MeshStandardMaterial } from 'three'
import type { Vec3 } from '@/engine/interaction/zones'
import { useZones } from './zoneRegistry'
import { Label } from '../ui/Label'

export interface DropZoneProps {
  id: string
  position: Vec3
  halfX: number
  halfZ: number
  variant: 'basket' | 'tray' | 'slot' | 'mat'
  color: string
  label?: string
  count?: number | null
  /** Called when the child taps the zone while an item is selected (accessible placement). */
  onPlaceSelected?: (itemId: string, zoneId: string) => void
}

/** A place objects can be dropped. Purely visual + geometry; acceptance is decided by the engine. */
export function DropZone({ id, position, halfX, halfZ, variant, color, label, count, onPlaceSelected }: DropZoneProps) {
  const register = useZones((s) => s.register)
  const unregister = useZones((s) => s.unregister)
  const glow = useRef<Mesh>(null)
  const height = variant === 'basket' ? 0.065 : 0.05

  useEffect(() => {
    register({ id, center: position, halfX, halfZ, height })
    return () => unregister(id)
  }, [id, position, halfX, halfZ, height, register, unregister])

  useFrame((_, delta) => {
    const m = glow.current
    if (!m) return
    const z = useZones.getState()
    const on = z.hot === id || (z.selected !== null && onPlaceSelected !== undefined)
    const mat = m.material as MeshStandardMaterial
    mat.emissiveIntensity += ((z.hot === id ? 0.9 : on ? 0.35 : 0) - mat.emissiveIntensity) * Math.min(1, delta * 12)
  })

  const w = halfX * 2
  const d = halfZ * 2
  const wall = 0.018

  return (
    <group
      position={position}
      name={`zone:${id}`}
      onClick={(e) => {
        const sel = useZones.getState().selected
        if (sel && onPlaceSelected) {
          e.stopPropagation()
          onPlaceSelected(sel, id)
          useZones.getState().setSelected(null)
        }
      }}
    >
      {/* floor of the zone */}
      <mesh ref={glow} position-y={0.004} receiveShadow>
        <boxGeometry args={[w, 0.008, d]} />
        <meshStandardMaterial color={variant === 'slot' ? '#fff7d6' : color} emissive={variant === 'slot' ? '#ffd166' : color} emissiveIntensity={0} roughness={0.8} />
      </mesh>

      {variant === 'basket' && (
        <group>
          {[
            [0, height / 2, halfZ, w + wall, height, wall],
            [0, height / 2, -halfZ, w + wall, height, wall],
            [halfX, height / 2, 0, wall, height, d],
            [-halfX, height / 2, 0, wall, height, d],
          ].map(([x, y, z, sx, sy, sz], i) => (
            <mesh key={i} position={[x!, y!, z!]} castShadow>
              <boxGeometry args={[sx!, sy!, sz!]} />
              <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
          ))}
        </group>
      )}

      {variant === 'tray' && (
        <RoundedBox args={[w + 0.03, 0.02, d + 0.03]} radius={0.008} position-y={-0.006} receiveShadow>
          <meshStandardMaterial color={color} roughness={0.6} />
        </RoundedBox>
      )}

      {variant === 'slot' && (
        <mesh position-y={0.012} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[Math.min(halfX, halfZ) * 0.85, Math.min(halfX, halfZ) * 1.05, 40]} />
          <meshStandardMaterial color="#f4b400" emissive="#f4b400" emissiveIntensity={0.4} />
        </mesh>
      )}

      {label && (
        <Label position={[0, variant === 'basket' ? height + 0.05 : 0.05, -halfZ - 0.04]} size={0.032} color="#1f2a44" bg="#ffffffdd">
          {count !== undefined && count !== null ? `${label}: ${count}` : label}
        </Label>
      )}
    </group>
  )
}
