// Mathematics World: a sunny playground with the activity table, question board and Pip.
import { RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, Object3D, type Group, type InstancedMesh } from 'three'
import { useAppStore } from '@/state/appStore'
import { useSessionStore } from '@/state/sessionStore'
import { usePlayerStore } from '@/state/playerStore'
import { Lights, WalkableFloor } from './environment'
import { Guide } from '../components/Guide'
import { RewardBurst } from '../components/RewardBurst'
import { Label } from '../ui/Label'
import { ActivityStage } from './math/ActivityStage'
import { Board } from './math/Board'
import { TABLE, tableHeight } from './math/layout'

export const MATH_SPAWN = { x: 0, z: TABLE.z + 2.2, yaw: 0, pitch: -0.15 }

export function MathWorldScene() {
  const mode = useAppStore((s) => s.settings.comfort.mode)
  const surfaceY = tableHeight(mode)

  useEffect(() => {
    usePlayerStore.getState().setBounds({ minX: -6, maxX: 6, minZ: -5, maxZ: 5 })
    usePlayerStore.getState().jumpTo(MATH_SPAWN)
  }, [])

  return (
    <group>
      <color attach="background" args={['#a7e0ff']} />
      <fog attach="fog" args={['#a7e0ff', 14, 40]} />
      <Lights shadowSize={4} />
      <Sky />
      <WalkableFloor size={[30, 30]} color="#8fd694" />
      <PlayMat />
      <Trees />
      <Fence />
      <NumberBalloons />

      <ActivityTable surfaceY={surfaceY} />
      <Board position={[TABLE.x, surfaceY + 0.5, TABLE.z - 0.6]} />
      <Guide position={[TABLE.x - 1.05, 0, TABLE.z - 0.2]} bubble={false} scale={0.9} />
      <ActivityStage />
      <RewardBurst origin={[TABLE.x, surfaceY, TABLE.z]} />
      <ActivityViewpoint surfaceY={surfaceY} />
    </group>
  )
}

/** On desktop, frame the table nicely for the current screen shape. In VR, step up to the table once. */
function ActivityViewpoint({ surfaceY }: { surfaceY: number }) {
  const activity = useSessionStore((s) => s.activity)
  const inXR = useSessionStore((s) => s.inXR)
  const size = useThree((s) => s.size)
  useEffect(() => {
    const p = usePlayerStore.getState()
    if (!activity) return
    if (inXR) {
      p.jumpTo({ x: TABLE.x, z: TABLE.z + 0.5, yaw: 0, pitch: 0 })
      return
    }
    const aspect = size.width / Math.max(size.height, 1)
    const vfov = (55 * Math.PI) / 180
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect)
    const needForWidth = (TABLE.width / 2 + 0.08) / Math.tan(hfov / 2)
    const dist = Math.max(0.9, Math.min(2.4, needForWidth))
    const height = surfaceY + 0.62 + (dist - 0.9) * 0.35
    // Aim between the table centre and the board so both fit on screen.
    p.glideTo({ x: TABLE.x, z: TABLE.z + dist, yaw: 0, pitch: -Math.atan2(height - surfaceY - 0.08, dist + 0.12), height })
  }, [activity, inXR, size.width, size.height, surfaceY])
  return null
}

function ActivityTable({ surfaceY }: { surfaceY: number }) {
  return (
    <group position={[TABLE.x, 0, TABLE.z]}>
      <RoundedBox args={[TABLE.width + 0.1, 0.05, TABLE.depth + 0.1]} radius={0.02} position-y={surfaceY - 0.025} receiveShadow castShadow>
        <meshStandardMaterial color="#fff8e7" roughness={0.7} />
      </RoundedBox>
      <mesh position-y={surfaceY - 0.06}>
        <boxGeometry args={[TABLE.width + 0.12, 0.03, TABLE.depth + 0.12]} />
        <meshStandardMaterial color="#ff9f1c" />
      </mesh>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[(sx! * TABLE.width) / 2.2, (surfaceY - 0.07) / 2, (sz! * TABLE.depth) / 2.3]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, surfaceY - 0.07, 10]} />
          <meshStandardMaterial color="#3a86ff" />
        </mesh>
      ))}
    </group>
  )
}

function PlayMat() {
  const colors = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff']
  return (
    <group position={[TABLE.x, 0.004, TABLE.z + 0.6]}>
      {colors.map((c, i) => (
        <mesh key={c} rotation-x={-Math.PI / 2} position={[((i % 4) - 1.5) * 0.9, 0, (Math.floor(i / 4) - 0.5) * 0.9]} receiveShadow>
          <planeGeometry args={[0.88, 0.88]} />
          <meshStandardMaterial color={c} roughness={1} />
        </mesh>
      ))}
      <Label position={[0, 0.002, 1.2]} rotation={[-Math.PI / 2, 0, 0]} size={0.18} color="#ffffff">
        1  2  3  4  5
      </Label>
    </group>
  )
}

function Sky() {
  const sun = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (sun.current) sun.current.rotation.z = clock.elapsedTime * 0.05
  })
  return (
    <group>
      <group ref={sun} position={[6, 9, -14]}>
        <mesh>
          <circleGeometry args={[1.6, 32]} />
          <meshBasicMaterial color="#ffe066" fog={false} />
        </mesh>
      </group>
      {[
        [-6, 7, -12, 1.4],
        [3, 8, -16, 1.8],
        [-12, 6, -8, 1.2],
      ].map(([x, y, z, s], i) => (
        <group key={i} position={[x!, y!, z!]} scale={s}>
          {[
            [0, 0, 0.9],
            [0.9, -0.1, 0.7],
            [-0.9, -0.1, 0.7],
          ].map(([cx, cy, r], j) => (
            <mesh key={j} position={[cx!, cy!, 0]}>
              <sphereGeometry args={[r!, 14, 10]} />
              <meshBasicMaterial color="#ffffff" fog={false} />
            </mesh>
          ))}
        </group>
      ))}
      {/* rainbow */}
      {['#ef476f', '#ff9f1c', '#ffd166', '#06d6a0', '#118ab2', '#8338ec'].map((c, i) => (
        <mesh key={c} position={[-3, 0, -13]}>
          <torusGeometry args={[7 - i * 0.35, 0.18, 8, 48, Math.PI]} />
          <meshBasicMaterial color={c} fog={false} />
        </mesh>
      ))}
    </group>
  )
}

/** All trees in two instanced draw calls (trunks + crowns). */
function Trees() {
  const trunks = useRef<InstancedMesh>(null)
  const crowns = useRef<InstancedMesh>(null)
  const spots = useMemo(() => {
    const out: [number, number, number][] = []
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2
      const r = 7 + (i % 3) * 1.6
      out.push([Math.cos(a) * r, Math.sin(a) * r - 2, 0.8 + ((i * 7) % 5) * 0.12])
    }
    return out
  }, [])
  useEffect(() => {
    const d = new Object3D()
    const c = new Color()
    const greens = ['#2bb673', '#52b788', '#74c69d', '#40916c']
    spots.forEach(([x, z, s], i) => {
      d.position.set(x, 0.5 * s, z)
      d.scale.set(s, s, s)
      d.updateMatrix()
      trunks.current?.setMatrixAt(i, d.matrix)
      d.position.set(x, 1.4 * s, z)
      d.updateMatrix()
      crowns.current?.setMatrixAt(i, d.matrix)
      crowns.current?.setColorAt(i, c.set(greens[i % greens.length]!))
    })
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true
    if (crowns.current) {
      crowns.current.instanceMatrix.needsUpdate = true
      if (crowns.current.instanceColor) crowns.current.instanceColor.needsUpdate = true
    }
  }, [spots])
  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 1, 8]} />
        <meshStandardMaterial color="#8d5a3b" />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, spots.length]} castShadow>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial flatShading roughness={0.8} />
      </instancedMesh>
    </>
  )
}

function Fence() {
  const ref = useRef<InstancedMesh>(null)
  const posts = useMemo(() => Array.from({ length: 36 }, (_, i) => (i / 36) * Math.PI * 2), [])
  const colors = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2']
  useEffect(() => {
    const d = new Object3D()
    const c = new Color()
    posts.forEach((a, i) => {
      d.position.set(Math.cos(a) * 5.6, 0.3, Math.sin(a) * 5.6 - 1)
      d.rotation.set(0, -a, 0)
      d.updateMatrix()
      ref.current?.setMatrixAt(i, d.matrix)
      ref.current?.setColorAt(i, c.set(colors[i % colors.length]!))
    })
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    }
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, posts.length]} castShadow>
      <boxGeometry args={[0.12, 0.6, 0.12]} />
      <meshStandardMaterial roughness={0.6} />
    </instancedMesh>
  )
}

function NumberBalloons() {
  const g = useRef<Group>(null)
  useFrame(({ clock }) => {
    g.current?.children.forEach((c, i) => {
      c.position.y = 2.2 + Math.sin(clock.elapsedTime * 0.5 + i * 1.3) * 0.15
    })
  })
  const nums = [1, 2, 3, 4, 5, 6]
  const colors = ['#ef476f', '#ff9f1c', '#ffd166', '#06d6a0', '#118ab2', '#8338ec']
  return (
    <group ref={g}>
      {nums.map((n, i) => (
        <group key={n} position={[(i - 2.5) * 0.9, 2.2, TABLE.z - 2.2 - (i % 2) * 0.5]}>
          <mesh castShadow>
            <sphereGeometry args={[0.28, 20, 16]} />
            <meshStandardMaterial color={colors[i]} roughness={0.3} />
          </mesh>
          <Label position={[0, 0, 0.29]} size={0.26} color="#ffffff">
            {String(n)}
          </Label>
          <mesh position-y={-0.6}>
            <cylinderGeometry args={[0.004, 0.004, 0.65, 4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
