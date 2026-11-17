// Floating panel shown only inside VR: the selected structure plus large, ray-friendly buttons.
// In study mode it shows the current question and the answer options.
import { RoundedBox, Text } from '@react-three/drei'
import { type ThreeEvent } from '@react-three/fiber'
import { useState } from 'react'
import { SYSTEMS, SYSTEM_BY_ID, displayName } from '@/engine/anatomy'
import { getStructure } from '@/state/indexData'
import { useLab } from '@/state/labStore'
import { useView } from '@/state/viewStore'
import { exitVR, pulse } from './xr'
import { FONT } from './fonts'

type V3 = [number, number, number]

function Btn({ label, onPress, position, width = 0.22, active = false, tone = '#1f2b37' }: { label: string; onPress: () => void; position: V3; width?: number; active?: boolean; tone?: string }) {
  const [hover, setHover] = useState(false)
  const press = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    pulse((e as unknown as { pointerPosition?: import('three').Vector3 }).pointerPosition, 0.3, 15)
    onPress()
  }
  return (
    <group position={position}>
      <RoundedBox args={[width, 0.065, 0.015]} radius={0.012} onClick={press} onPointerOver={(e) => (e.stopPropagation(), setHover(true))} onPointerOut={() => setHover(false)}>
        <meshStandardMaterial color={active ? '#0f766e' : hover ? '#2a3a49' : tone} roughness={0.6} />
      </RoundedBox>
      <Text font={FONT} fontSize={0.026} color="#e6edf3" position-z={0.009} anchorX="center" anchorY="middle" maxWidth={width * 0.92} raycast={() => null}>
        {label}
      </Text>
    </group>
  )
}

export function VrPanel() {
  const inXR = useView((s) => s.inXR)
  const selectedId = useView((s) => s.selectedId)
  const mode = useView((s) => s.mode)
  const q = useView((s) => s.question)
  const isolated = useView((s) => s.isolated)
  const systems = useLab((s) => s.systems)
  if (!inXR) return null
  const sel = getStructure(selectedId)

  return (
    <group position={[-0.85, 1.25, 0.55]} rotation-y={0.75}>
      <RoundedBox args={[0.62, 0.78, 0.012]} radius={0.02} position-z={-0.01}>
        <meshStandardMaterial color="#0e161e" roughness={0.8} transparent opacity={0.94} />
      </RoundedBox>
      <Text font={FONT} fontSize={0.024} color="#5eead4" position={[-0.28, 0.35, 0.002]} anchorX="left">
        ANATOMY LAB
      </Text>

      {mode === 'explore' || !q ? (
        <>
          <Text font={FONT} fontSize={0.036} color="#e6edf3" position={[-0.28, 0.29, 0.002]} anchorX="left" anchorY="top" maxWidth={0.56}>
            {sel ? displayName(sel) : 'Point at any part and pull the trigger'}
          </Text>
          {sel && (
            <Text font={FONT} fontSize={0.022} color="#93a4b4" position={[-0.28, 0.17, 0.002]} anchorX="left">
              {SYSTEM_BY_ID[sel.system].label}
            </Text>
          )}
          <Btn label={isolated ? 'Show all' : 'Isolate'} position={[-0.155, 0.1, 0.004]} onPress={() => (isolated ? useView.getState().showAll() : sel && useView.getState().isolate([sel.id]))} />
          <Btn label="Hide" position={[0.115, 0.1, 0.004]} onPress={() => sel && useView.getState().hide(sel.id)} />
          {SYSTEMS.map((s, i) => (
            <Btn
              key={s.id}
              label={s.label}
              width={0.27}
              active={systems[s.id].visible}
              position={[i % 2 === 0 ? -0.14 : 0.14, 0.01 - Math.floor(i / 2) * 0.075, 0.004]}
              onPress={() => useLab.getState().setSystem(s.id, { visible: !systems[s.id].visible })}
            />
          ))}
        </>
      ) : (
        <>
          <Text font={FONT} fontSize={0.03} color="#e6edf3" position={[-0.28, 0.29, 0.002]} anchorX="left" anchorY="top" maxWidth={0.56}>
            {q.mode === 'locate' ? `Find: ${q.target.base}` : 'Name the highlighted part'}
          </Text>
          {q.mode === 'identify' &&
            q.options.map((o, i) => (
              <Btn key={o} label={o} width={0.56} position={[0, 0.14 - i * 0.075, 0.004]} active={!!q.result && o === q.target.base} onPress={() => useView.getState().answerIdentify(o)} />
            ))}
          {q.result && (
            <>
              <Text font={FONT} fontSize={0.028} color={q.result.correct ? '#5eead4' : '#fdba74'} position={[-0.28, -0.17, 0.002]} anchorX="left" maxWidth={0.56}>
                {q.result.correct ? 'Correct' : `It was: ${q.target.base}`}
              </Text>
              <Btn label="Next question" width={0.3} position={[0, -0.25, 0.004]} onPress={() => useView.getState().ask(q.mode, q.system)} />
            </>
          )}
        </>
      )}
      <Btn label="Exit VR" width={0.2} tone="#3b1f24" position={[0.17, -0.34, 0.004]} onPress={exitVR} />
    </group>
  )
}
