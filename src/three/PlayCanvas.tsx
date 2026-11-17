// The single persistent canvas. Scenes switch INSIDE it so a VR session survives moving between worlds.
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { XR, useXR } from '@react-three/xr'
import { Suspense, lazy, useEffect } from 'react'
import { Vector3 } from 'three'
import { useSessionStore } from '@/state/sessionStore'
import { setListener } from '@/audio/audio'
import { xrStore } from './xr'
import { DesktopRig } from './rig/DesktopRig'
import { XRRig } from './rig/XRRig'
import { ClassroomScene } from './scenes/ClassroomScene'
import { debugEnabled, registerDebugView, tickDebugFrame } from './components/debug'

// Worlds are code-split and loaded on demand.
const MathWorldScene = lazy(() => import('./scenes/MathWorldScene').then((m) => ({ default: m.MathWorldScene })))

export function PlayCanvas() {
  const scene = useSessionStore((s) => s.scene)
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 55, near: 0.03, far: 80, position: [0, 1.3, 3.4] }}
      gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
      onPointerMissed={() => document.body.style.removeProperty('cursor')}
      aria-label="WonderWorld 3D scene"
    >
      <XR store={xrStore}>
        <XRBridge />
        <Rig />
        <SpatialListener />
        <DebugView />
        <Suspense fallback={<LoadingSignal />}>{scene === 'classroom' ? <ClassroomScene /> : <MathWorldScene />}</Suspense>
      </XR>
    </Canvas>
  )
}

function Rig() {
  const inXR = useXR((s) => s.session != null)
  return inXR ? <XRRig /> : <DesktopRig />
}

/** Mirror XR session presence into the session store for UI (Exit VR buttons, viewpoints). */
function XRBridge() {
  const inXR = useXR((s) => s.session != null)
  useEffect(() => {
    useSessionStore.getState().setInXR(inXR)
  }, [inXR])
  return null
}

const pos = new Vector3()
const fwd = new Vector3()
const up = new Vector3()
function SpatialListener() {
  const camera = useThree((s) => s.camera)
  useFrame(() => {
    camera.getWorldPosition(pos)
    camera.getWorldDirection(fwd)
    up.set(0, 1, 0).applyQuaternion(camera.quaternion)
    setListener([pos.x, pos.y, pos.z], [fwd.x, fwd.y, fwd.z], [up.x, up.y, up.z])
  })
  return null
}

function DebugView() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  useEffect(() => registerDebugView(camera, gl.domElement), [camera, gl])
  useFrame(() => {
    if (debugEnabled) tickDebugFrame()
  })
  return null
}

/** Rendered while a world's code/fonts load; the HTML HUD shows a friendly loading card meanwhile. */
function LoadingSignal() {
  useEffect(() => {
    useSessionStore.setState({ loading: true })
    return () => useSessionStore.setState({ loading: false })
  }, [])
  return null
}
