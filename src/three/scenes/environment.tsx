// Reusable environment pieces: floors (teleport + tap-to-walk), walls, furniture, lighting.
import { RoundedBox } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { TeleportTarget } from '@react-three/xr'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Color, Object3D, RepeatWrapping, SRGBColorSpace, type InstancedMesh } from 'three'
import { usePlayerStore } from '@/state/playerStore'

/** Floor you can click/tap to walk on, and teleport onto in VR. */
export function WalkableFloor({ size, color, texture, position = [0, 0, 0] }: { size: [number, number]; color: string; texture?: CanvasTexture; position?: [number, number, number] }) {
  const onTeleport = (p: { x: number; z: number }) => {
    const [x, z] = clampXZ(p.x, p.z)
    usePlayerStore.setState({ x, z })
  }
  return (
    <TeleportTarget onTeleport={onTeleport}>
      <mesh
        name="floor"
        rotation-x={-Math.PI / 2}
        position={position}
        receiveShadow
        onClick={(e: ThreeEvent<MouseEvent>) => {
          // Walk only when the floor is the first thing under the pointer and it was a tap, not a drag.
          if ((e.delta ?? 0) > 6 || e.intersections[0]?.object !== e.object) return
          usePlayerStore.getState().walkTo(e.point.x, e.point.z)
        }}
      >
        <planeGeometry args={size} />
        <meshStandardMaterial color={color} map={texture ?? null} roughness={0.9} />
      </mesh>
    </TeleportTarget>
  )
}

function clampXZ(x: number, z: number): [number, number] {
  const b = usePlayerStore.getState().bounds
  return [Math.min(Math.max(x, b.minX), b.maxX), Math.min(Math.max(z, b.minZ), b.maxZ)]
}

/** Procedural plank texture — no image download. */
export function useWoodTexture(base = '#d9a066', line = '#b97a43') {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')!
    g.fillStyle = base
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#00000010' : '#ffffff10'
      g.fillRect(0, i * 32, 256, 32)
      g.fillStyle = line
      g.fillRect(0, i * 32, 256, 2)
      g.fillRect(((i * 97) % 256) | 0, i * 32, 2, 32)
    }
    const t = new CanvasTexture(c)
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(4, 4)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [base, line])
}

export function Lights({ shadowSize = 6 }: { shadowSize?: number }) {
  return (
    <>
      <hemisphereLight args={['#fff7e6', '#c3cfe2', 1.5]} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-shadowSize}
        shadow-camera-right={shadowSize}
        shadow-camera-top={shadowSize}
        shadow-camera-bottom={-shadowSize}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
    </>
  )
}

export function Desk({ position, rotationY = 0, color = '#4cc9f0' }: { position: [number, number, number]; rotationY?: number; color?: string }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <RoundedBox args={[1.1, 0.05, 0.6]} radius={0.02} position-y={0.62} castShadow receiveShadow>
        <meshStandardMaterial color="#f8f1e5" roughness={0.6} />
      </RoundedBox>
      {[
        [-0.5, -0.25],
        [0.5, -0.25],
        [-0.5, 0.25],
        [0.5, 0.25],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x!, 0.3, z!]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}
      {/* chair */}
      <group position={[0, 0, 0.55]}>
        <RoundedBox args={[0.42, 0.05, 0.4]} radius={0.02} position-y={0.38} castShadow>
          <meshStandardMaterial color={color} roughness={0.5} />
        </RoundedBox>
        <RoundedBox args={[0.42, 0.36, 0.05]} radius={0.02} position={[0, 0.6, 0.18]} castShadow>
          <meshStandardMaterial color={color} roughness={0.5} />
        </RoundedBox>
        {[
          [-0.18, -0.16],
          [0.18, -0.16],
          [-0.18, 0.16],
          [0.18, 0.16],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x!, 0.18, z!]}>
            <cylinderGeometry args={[0.018, 0.018, 0.36, 6]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

const BOOK_COLORS = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#8338ec', '#ff9f1c', '#2ec4b6', '#e76f51']

/** Bookshelf with every book drawn in a single instanced draw call. */
export function Bookshelf({ position, rotationY = 0, seed = 1 }: { position: [number, number, number]; rotationY?: number; seed?: number }) {
  const books = useRef<InstancedMesh>(null)
  const layout = useMemo(() => {
    const out: { x: number; y: number; h: number; w: number; tilt: number; c: number }[] = []
    let r = seed * 9301
    const rand = () => ((r = (r * 16807) % 2147483647) / 2147483647)
    for (let shelf = 0; shelf < 4; shelf++) {
      let x = -0.62
      while (x < 0.58) {
        const w = 0.04 + rand() * 0.04
        const h = 0.2 + rand() * 0.12
        out.push({ x: x + w / 2, y: 0.1 + shelf * 0.42, h, w, tilt: rand() > 0.9 ? 0.2 : 0, c: Math.floor(rand() * BOOK_COLORS.length) })
        x += w + 0.006
      }
    }
    return out
  }, [seed])

  useLayoutEffect(() => {
    const m = books.current
    if (!m) return
    const d = new Object3D()
    const c = new Color()
    layout.forEach((b, i) => {
      d.position.set(b.x, b.y + b.h / 2, 0)
      d.rotation.set(0, 0, b.tilt)
      d.scale.set(b.w, b.h, 0.22)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
      m.setColorAt(i, c.set(BOOK_COLORS[b.c]!))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [layout])

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.9, -0.14]} castShadow receiveShadow>
        <boxGeometry args={[1.36, 1.8, 0.04]} />
        <meshStandardMaterial color="#a26b3f" roughness={0.8} />
      </mesh>
      {[-0.68, 0.68].map((x) => (
        <mesh key={x} position={[x, 0.9, 0]} castShadow>
          <boxGeometry args={[0.04, 1.8, 0.32]} />
          <meshStandardMaterial color="#b87a48" roughness={0.8} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 0.08 + i * 0.42, 0]} receiveShadow>
          <boxGeometry args={[1.36, 0.035, 0.32]} />
          <meshStandardMaterial color="#c58b55" roughness={0.8} />
        </mesh>
      ))}
      <instancedMesh ref={books} args={[undefined, undefined, layout.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </group>
  )
}

export function Window({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh>
        <planeGeometry args={[1.4, 1.1]} />
        <meshBasicMaterial color="#9bd8ff" />
      </mesh>
      <mesh position={[0.25, -0.15, 0.001]}>
        <circleGeometry args={[0.18, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      <mesh position={[-0.3, 0.2, 0.001]}>
        <circleGeometry args={[0.12, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
      {[
        [0, 0.57, 1.5, 0.06],
        [0, -0.57, 1.5, 0.06],
        [0.72, 0, 0.06, 1.2],
        [-0.72, 0, 0.06, 1.2],
        [0, 0, 0.04, 1.1],
        [0, 0, 1.4, 0.04],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x!, y!, 0.02]}>
          <boxGeometry args={[w!, h!, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  )
}
