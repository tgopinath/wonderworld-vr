// The hub: a bright classroom with world portals, a stats display board and Pip the guide.
import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Group } from 'three'
import { WORLDS } from '@/config/worlds'
import type { WorldId } from '@/engine/core/types'
import { mathProgressPct } from '@/state/selectors'
import { selectActiveProfile, useAppStore } from '@/state/appStore'
import { useSessionStore } from '@/state/sessionStore'
import { usePlayerStore } from '@/state/playerStore'
import { Bookshelf, Desk, Lights, WalkableFloor, Window, useWoodTexture } from './environment'
import { Portal } from '../components/Portal'
import { Guide } from '../components/Guide'
import { Label, Panel } from '../ui/Label'

const W = 9
const D = 10
const WALL_H = 3.2

/** Playable worlds sit in the middle of the arc, right in front of the player. */
const PORTAL_ORDER: WorldId[] = ['geography', 'space', 'math', 'science', 'money', 'puzzle']

export const CLASSROOM_SPAWN = { x: 0, z: 3.4, yaw: 0, pitch: -0.08 }

export function ClassroomScene() {
  const wood = useWoodTexture()
  const goTo = useSessionStore((s) => s.goTo)

  useEffect(() => {
    usePlayerStore.getState().setBounds({ minX: -W / 2 + 0.5, maxX: W / 2 - 0.5, minZ: -D / 2 + 0.6, maxZ: D / 2 - 0.5 })
    usePlayerStore.getState().jumpTo(CLASSROOM_SPAWN)
  }, [])

  return (
    <group>
      <color attach="background" args={['#cfe9ff']} />
      <fog attach="fog" args={['#cfe9ff', 12, 30]} />
      <Lights shadowSize={6} />
      <WalkableFloor size={[W, D]} color="#ffffff" texture={wood} />

      {/* rug */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0.6]} receiveShadow>
        <circleGeometry args={[1.6, 48]} />
        <meshStandardMaterial color="#ffb4a2" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 0.6]}>
        <ringGeometry args={[1.2, 1.35, 48]} />
        <meshStandardMaterial color="#ffd6a5" roughness={1} />
      </mesh>

      {/* walls */}
      <mesh position={[0, WALL_H / 2, -D / 2]} receiveShadow>
        <boxGeometry args={[W, WALL_H, 0.1]} />
        <meshStandardMaterial color="#fff1d6" />
      </mesh>
      <mesh position={[0, WALL_H / 2, D / 2]}>
        <boxGeometry args={[W, WALL_H, 0.1]} />
        <meshStandardMaterial color="#fff1d6" />
      </mesh>
      <mesh position={[-W / 2, WALL_H / 2, 0]} receiveShadow>
        <boxGeometry args={[0.1, WALL_H, D]} />
        <meshStandardMaterial color="#d8f3dc" />
      </mesh>
      <mesh position={[W / 2, WALL_H / 2, 0]} receiveShadow>
        <boxGeometry args={[0.1, WALL_H, D]} />
        <meshStandardMaterial color="#e0e7ff" />
      </mesh>
      {/* skirting stripe */}
      {[-D / 2 + 0.06, D / 2 - 0.06].map((z) => (
        <mesh key={z} position={[0, 0.08, z]}>
          <boxGeometry args={[W, 0.16, 0.03]} />
          <meshStandardMaterial color="#ff9f1c" />
        </mesh>
      ))}
      {/* ceiling */}
      <mesh position={[0, WALL_H, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W, D]} />
        <meshBasicMaterial color="#f4f7ff" />
      </mesh>

      <Window position={[-W / 2 + 0.06, 1.7, -1.5]} rotationY={Math.PI / 2} />
      <Window position={[-W / 2 + 0.06, 1.7, 1.5]} rotationY={Math.PI / 2} />

      <Bookshelf position={[W / 2 - 0.22, 0, -1.2]} rotationY={-Math.PI / 2} seed={3} />
      <Bookshelf position={[W / 2 - 0.22, 0, 0.4]} rotationY={-Math.PI / 2} seed={7} />

      <Desk position={[-2.6, 0, 1.4]} rotationY={0.25} color="#4cc9f0" />
      <Desk position={[-2.6, 0, 3.2]} rotationY={0.25} color="#f72585" />
      <Desk position={[2.5, 0, 2.6]} rotationY={-0.25} color="#06d6a0" />

      <Posters />
      <DisplayBoard />
      <FloatingShapes />

      {PORTAL_ORDER.map((id, i) => {
        const w = WORLDS.find((x) => x.id === id)!
        // Arc of portals facing the rug in the middle of the room.
        const angle = ((i - (WORLDS.length - 1) / 2) / (WORLDS.length - 1)) * 2.3
        const x = Math.sin(angle) * 3.5
        const z = 1.0 - Math.cos(angle) * 3.5
        return <PortalWithProgress key={w.id} worldId={w.id} x={x} z={z} rotY={-angle} onEnter={() => w.id === 'math' && goTo('math')} />
      })}

      <Guide position={[-1.3, 0, 0.2]} />
    </group>
  )
}

function PortalWithProgress({ worldId, x, z, rotY, onEnter }: { worldId: WorldId; x: number; z: number; rotY: number; onEnter: () => void }) {
  const world = WORLDS.find((w) => w.id === worldId)!
  const progress = useAppStore((s) => (world.id === 'math' && s.activeProfileId ? mathProgressPct(s.progress[s.activeProfileId]) : 0))
  return <Portal world={world} position={[x, 0, z]} rotationY={rotY} progress={progress} onEnter={onEnter} />
}

function DisplayBoard() {
  const profile = useAppStore(selectActiveProfile)
  const rewards = useAppStore((s) => (s.activeProfileId ? s.rewards[s.activeProfileId] : undefined))
  return (
    <group position={[0, 2.05, -D / 2 + 0.08]}>
      <RoundedBox args={[3.2, 1.4, 0.06]} radius={0.05}>
        <meshStandardMaterial color="#2d6a4f" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[3.34, 1.54, 0.04]} radius={0.06} position-z={-0.02}>
        <meshStandardMaterial color="#b5835a" />
      </RoundedBox>
      <Label position={[0, 0.42, 0.04]} size={0.17} color="#ffffff">
        {`Hello, ${profile?.nickname ?? 'Explorer'}!`}
      </Label>
      <Label position={[0, 0.1, 0.04]} size={0.085} color="#d8f3dc">
        Choose a glowing portal to start learning
      </Label>
      <Panel width={2.6} height={0.42} color="#ffffff" position={[0, -0.36, 0.05]} opacity={0.12}>
        <Label position={[-0.85, 0, 0.02]} size={0.085} color="#ffe066">{`Stars ${rewards?.stars ?? 0}`}</Label>
        <Label position={[0, 0, 0.02]} size={0.085} color="#ffd6a5">{`Coins ${rewards?.coins ?? 0}`}</Label>
        <Label position={[0.85, 0, 0.02]} size={0.085} color="#bde0fe">{`Badges ${rewards?.badges.length ?? 0}`}</Label>
      </Panel>
    </group>
  )
}

function Posters() {
  const posters: [string, string, number][] = [
    ['A B C', '#ff006e', -2.8],
    ['1 2 3', '#3a86ff', 2.8],
  ]
  return (
    <>
      {posters.map(([text, color, x]) => (
        <group key={text} position={[x, 2.1, -D / 2 + 0.07]}>
          <RoundedBox args={[1.1, 0.8, 0.02]} radius={0.04}>
            <meshStandardMaterial color={color} />
          </RoundedBox>
          <Label position={[0, 0, 0.02]} size={0.2} color="#ffffff">
            {text}
          </Label>
        </group>
      ))}
    </>
  )
}

/** A few slow, floating educational shapes for life in the room. Gentle motion only. */
function FloatingShapes() {
  const g = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!g.current) return
    g.current.children.forEach((c, i) => {
      c.position.y = 2.3 + Math.sin(clock.elapsedTime * 0.6 + i) * 0.12
      c.rotation.y = clock.elapsedTime * 0.3 + i
    })
  })
  return (
    <group ref={g}>
      <mesh position={[-2, 2.3, -2.5]} castShadow>
        <icosahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#ffd166" flatShading />
      </mesh>
      <mesh position={[2.2, 2.3, -2.2]} castShadow>
        <torusKnotGeometry args={[0.12, 0.04, 64, 8]} />
        <meshStandardMaterial color="#ef476f" />
      </mesh>
      <mesh position={[0, 2.4, 1.2]} castShadow>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial color="#06d6a0" flatShading />
      </mesh>
    </group>
  )
}
