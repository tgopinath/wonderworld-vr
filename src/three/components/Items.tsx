// Procedural learning objects. Geometries + materials are created once at module load and shared
// by every instance (a few KB of GPU memory for the app's lifetime — cheap on Quest).
import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { BoxGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, MeshStandardMaterial, Shape, SphereGeometry } from 'three'
import type { ItemKind } from '@/config/activities'
import { FONT } from '../ui/fonts'

export const ITEM_RADIUS = 0.04

function starShape(outer: number, inner: number) {
  const s = new Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  return s
}

const R = ITEM_RADIUS
export const geo = {
  sphere: new SphereGeometry(R, 20, 14),
  stem: new CylinderGeometry(0.004, 0.005, 0.018, 6),
  leaf: new SphereGeometry(0.012, 8, 6),
  star: (() => {
    const g = new ExtrudeGeometry(starShape(R * 1.15, R * 0.5), { depth: 0.022, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 })
    g.center()
    return g
  })(),
  duckBody: new SphereGeometry(R * 0.95, 16, 12),
  duckHead: new SphereGeometry(R * 0.55, 14, 10),
  beak: new ConeGeometry(R * 0.22, R * 0.45, 8),
  cube: new BoxGeometry(R * 1.6, R * 1.6, R * 1.6),
  numberBlock: new BoxGeometry(0.085, 0.085, 0.05),
}

const mat = (color: string, extra: Partial<{ roughness: number; metalness: number; emissive: string; emissiveIntensity: number }> = {}) =>
  new MeshStandardMaterial({ color, roughness: 0.55, ...extra })

export const mats = {
  apple: mat('#e63946', { roughness: 0.35 }),
  stem: mat('#6b4226'),
  leaf: mat('#2bb673'),
  star: mat('#ffc93c', { roughness: 0.3, metalness: 0.1, emissive: '#ffb703', emissiveIntensity: 0.15 }),
  ball: mat('#3a86ff', { roughness: 0.4 }),
  ballStripe: mat('#ffffff'),
  duck: mat('#ffd60a', { roughness: 0.5 }),
  beak: mat('#fb8500'),
  eye: mat('#1b1b1b'),
  cube: mat('#8338ec', { roughness: 0.5 }),
}

const NUMBER_COLORS = ['#ef476f', '#f78c6b', '#ffd166', '#06d6a0', '#118ab2', '#8338ec', '#ff006e', '#3a86ff', '#fb5607', '#2a9d8f']
const numberMats = NUMBER_COLORS.map((c) => mat(c, { roughness: 0.45 }))

export function ItemModel({ kind }: { kind: ItemKind }) {
  switch (kind) {
    case 'apple':
      return (
        <group position-y={R}>
          <mesh geometry={geo.sphere} material={mats.apple} scale={[1, 0.92, 1]} castShadow />
          <mesh geometry={geo.stem} material={mats.stem} position-y={R * 0.95} />
          <mesh geometry={geo.leaf} material={mats.leaf} position={[0.008, R * 1.02, 0]} scale={[1.2, 0.4, 0.7]} rotation-z={-0.5} />
        </group>
      )
    case 'star':
      return <mesh geometry={geo.star} material={mats.star} position-y={R * 1.15} castShadow />
    case 'ball':
      return (
        <group position-y={R}>
          <mesh geometry={geo.sphere} material={mats.ball} castShadow />
          <mesh geometry={geo.sphere} material={mats.ballStripe} scale={[1.01, 0.25, 1.01]} />
        </group>
      )
    case 'duck':
      return (
        <group position-y={R * 0.9}>
          <mesh geometry={geo.duckBody} material={mats.duck} scale={[1.15, 0.85, 0.9]} castShadow />
          <mesh geometry={geo.duckHead} material={mats.duck} position={[0, R * 0.75, R * 0.45]} castShadow />
          <mesh geometry={geo.beak} material={mats.beak} position={[0, R * 0.7, R * 1.0]} rotation-x={Math.PI / 2} />
          <mesh geometry={geo.leaf} material={mats.eye} position={[R * 0.25, R * 0.9, R * 0.85]} scale={0.25} />
          <mesh geometry={geo.leaf} material={mats.eye} position={[-R * 0.25, R * 0.9, R * 0.85]} scale={0.25} />
        </group>
      )
    case 'cube':
      return <mesh geometry={geo.cube} material={mats.cube} position-y={R * 0.8} castShadow />
  }
}

export function NumberBlock({ value }: { value: number }) {
  const material = numberMats[value % numberMats.length]
  const text = useMemo(() => String(value), [value])
  return (
    <group position-y={0.0425}>
      <mesh geometry={geo.numberBlock} material={material} castShadow />
      <Text font={FONT} fontSize={0.062} color="#ffffff" outlineWidth={0.004} outlineColor="#1f2a44" position-z={0.026} anchorX="center" anchorY="middle" raycast={() => null}>
        {text}
      </Text>
      <Text font={FONT} fontSize={0.04} color="#ffffff" outlineWidth={0.003} outlineColor="#1f2a44" position-y={0.0426} rotation-x={-Math.PI / 2} anchorX="center" anchorY="middle" raycast={() => null}>
        {text}
      </Text>
    </group>
  )
}
