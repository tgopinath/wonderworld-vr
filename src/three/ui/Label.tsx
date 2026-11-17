// Spatial UI primitives built from real geometry + SDF text, so they work identically in VR.
import { RoundedBox, Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Group, Vector3 } from 'three'
import { playSfx } from '@/audio/audio'
import { pulse } from '../xr'
import { registerDebugObject } from '../components/debug'

import { FONT } from './fonts'
export { FONT }

type V3 = [number, number, number]

export function Label({
  children,
  position,
  size = 0.06,
  color = '#1f2a44',
  bg,
  maxWidth,
  rotation,
}: {
  children: ReactNode
  position?: V3
  size?: number
  color?: string
  bg?: string
  maxWidth?: number
  rotation?: V3
}) {
  const [box, setBox] = useState<[number, number] | null>(null)
  return (
    <group position={position} rotation={rotation}>
      {bg && box && (
        <RoundedBox args={[box[0] + size * 0.9, box[1] + size * 0.55, size * 0.15]} radius={size * 0.3} position-z={-size * 0.1} raycast={() => null}>
          <meshBasicMaterial color={bg.slice(0, 7)} transparent={bg.length > 7} opacity={bg.length > 7 ? parseInt(bg.slice(7), 16) / 255 : 1} />
        </RoundedBox>
      )}
      <Text
        font={FONT}
        fontSize={size}
        color={color}
        anchorX="center"
        anchorY="middle"
        maxWidth={maxWidth}
        textAlign="center"
        outlineWidth={bg ? 0 : size * 0.04}
        outlineColor="#ffffff"
        raycast={() => null}
        onSync={(t) => {
          const b = t.textRenderInfo?.blockBounds
          if (b) setBox((prev) => (prev && Math.abs(prev[0] - (b[2] - b[0])) < 1e-4 && Math.abs(prev[1] - (b[3] - b[1])) < 1e-4 ? prev : [b[2] - b[0], b[3] - b[1]]))
        }}
      >
        {children}
      </Text>
    </group>
  )
}

export function Button3D({
  label,
  onPress,
  position,
  rotation,
  width = 0.34,
  height = 0.11,
  color = '#6c5ce7',
  textColor = '#ffffff',
  disabled,
  icon,
  name,
}: {
  label: string
  onPress: () => void
  position?: V3
  rotation?: V3
  width?: number
  height?: number
  color?: string
  textColor?: string
  disabled?: boolean
  icon?: string
  name?: string
}) {
  const g = useRef<Group>(null)
  const [hover, setHover] = useState(false)
  const id = name ?? `button:${label}`
  useEffect(() => (g.current ? registerDebugObject(id, g.current) : undefined), [id])
  useFrame((_, delta) => {
    if (!g.current) return
    const t = hover && !disabled ? 1.06 : 1
    g.current.scale.x += (t - g.current.scale.x) * Math.min(1, delta * 14)
    g.current.scale.y = g.current.scale.z = g.current.scale.x
  })
  const press = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (disabled) return
    playSfx('click')
    pulse((e as unknown as { pointerPosition?: Vector3 }).pointerPosition, 0.3, 15)
    onPress()
  }
  return (
    <group ref={g} position={position} rotation={rotation} name={id}>
      <RoundedBox
        args={[width, height, 0.03]}
        radius={Math.min(height, width) * 0.3}
        onClick={press}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          if (!disabled) document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
        castShadow
      >
        <meshStandardMaterial color={disabled ? '#b8bfd0' : color} emissive={color} emissiveIntensity={hover && !disabled ? 0.25 : 0} roughness={0.45} />
      </RoundedBox>
      <Text font={FONT} fontSize={height * 0.42} color={textColor} anchorX="center" anchorY="middle" position-z={0.017} raycast={() => null} maxWidth={width * 0.92}>
        {icon ? `${icon}  ${label}` : label}
      </Text>
    </group>
  )
}

export function Panel({ width, height, color = '#ffffff', position, rotation, children, opacity = 0.96 }: { width: number; height: number; color?: string; position?: V3; rotation?: V3; children?: ReactNode; opacity?: number }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[width, height, 0.02]} radius={0.04} position-z={-0.012} receiveShadow>
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={0.9} />
      </RoundedBox>
      {children}
    </group>
  )
}
