// The big question board behind the table: activity menu, live question, buttons, celebration.
// Everything a child needs is here in 3D, so the experience is complete inside VR.
import { ACTIVITIES, ACTIVITY_ORDER, levelCount } from '@/config/activities'
import { countIn } from '@/engine/learning/round'
import { BADGES } from '@/engine/rewards/rewards'
import { useAppStore } from '@/state/appStore'
import { useSessionStore } from '@/state/sessionStore'
import { Button3D, Label, Panel } from '../../ui/Label'
import { exitVR } from '../../xr'

const COLORS: Record<string, string> = { counting: '#ef476f', numberRecognition: '#118ab2', addition: '#06d6a0', subtraction: '#8338ec' }
const SHORT: Record<string, string> = { counting: 'Counting', numberRecognition: 'Find the Number', addition: 'Adding Up', subtraction: 'Taking Away' }

export function Board({ position }: { position: [number, number, number] }) {
  const activity = useSessionStore((s) => s.activity)
  return (
    <group position={position}>
      <Panel width={1.5} height={0.72} color="#ffffff" opacity={0.97}>
        {activity ? <RoundPanel /> : <MenuPanel />}
      </Panel>
      {activity && <CaptionStrip />}
    </group>
  )
}

function MenuPanel() {
  const start = useSessionStore((s) => s.startActivity)
  const goTo = useSessionStore((s) => s.goTo)
  const inXR = useSessionStore((s) => s.inXR)
  const progress = useAppStore((s) => (s.activeProfileId ? s.progress[s.activeProfileId] : undefined))
  return (
    <group>
      <Label position={[0, 0.27, 0.01]} size={0.065} color="#1f2a44">
        Mathematics World
      </Label>
      <Label position={[0, 0.19, 0.01]} size={0.035} color="#64748b">
        Pick an activity
      </Label>
      {ACTIVITY_ORDER.map((t, i) => {
        const x = (i % 2 === 0 ? -1 : 1) * 0.36
        const y = i < 2 ? 0.06 : -0.1
        const p = progress?.[t]
        return (
          <group key={t}>
            <Button3D name={`activity:${t}`} label={SHORT[t]!} onPress={() => start(t)} position={[x, y, 0.01]} width={0.6} height={0.12} color={COLORS[t]} />
            <Label position={[x, y - 0.085, 0.01]} size={0.024} color="#475569">
              {`Level ${p?.level ?? 1} of ${levelCount(t)}  ·  ${p?.rounds ?? 0} done  ·  best ${'*'.repeat(p?.bestStars ?? 0) || '-'}`}
            </Label>
          </group>
        )
      })}
      <Button3D name="nav:classroom" label="Back to classroom" onPress={() => goTo('classroom')} position={[inXR ? -0.3 : 0, -0.27, 0.01]} width={0.5} height={0.08} color="#94a3b8" />
      {inXR && <Button3D name="nav:exit-vr" label="Exit VR" onPress={exitVR} position={[0.3, -0.27, 0.01]} width={0.36} height={0.08} color="#334155" />}
    </group>
  )
}

function RoundPanel() {
  const round = useSessionStore((s) => s.round)
  const state = useSessionStore((s) => s.roundState)
  const celebration = useSessionStore((s) => s.celebration)
  const check = useSessionStore((s) => s.check)
  const next = useSessionStore((s) => s.nextRound)
  const reset = useSessionStore((s) => s.resetItems)
  const leave = useSessionStore((s) => s.leaveActivity)
  if (!round || !state) return null
  const def = ACTIVITIES[round.type]
  const done = state.phase === 'done'

  let status = ''
  if (round.type === 'counting') status = `In the basket: ${countIn(round, state, 'tray')}`
  // Live counts help while moving; in the answer step the child counts the objects themselves.
  if (round.type === 'addition') status = state.phase === 'move' ? `Big basket: ${countIn(round, state, 'combined')}` : 'Count the big basket, then pick the number'
  if (round.type === 'subtraction') status = state.phase === 'move' ? `Taken away: ${countIn(round, state, 'away')} of ${round.take}   ·   Left: ${countIn(round, state, 'group')}` : 'Count what is left, then pick the number'

  return (
    <group>
      <Label position={[0, 0.3, 0.01]} size={0.03} color="#64748b">{`${def.title}  ·  Level ${round.level}`}</Label>
      <Label position={[0, 0.2, 0.01]} size={round.prompt.length > 20 ? 0.07 : 0.1} color="#1f2a44" maxWidth={1.35}>
        {round.prompt}
      </Label>
      {status && (
        <Label position={[0, 0.08, 0.01]} size={0.045} color="#0f766e">
          {status}
        </Label>
      )}

      {done && celebration ? (
        <group>
          <Label position={[0, -0.04, 0.01]} size={0.06} color="#f59e0b">{`${'*'.repeat(celebration.stars)}  ${celebration.stars} star${celebration.stars > 1 ? 's' : ''}  +${celebration.coins} coins`}</Label>
          <Label position={[0, -0.12, 0.01]} size={0.032} color="#475569" maxWidth={1.3}>
            {[
              celebration.levelChange === 'up' ? 'Level up!' : celebration.levelChange === 'down' ? 'Next one will be a little easier.' : '',
              celebration.newBadges.length ? `New badge: ${celebration.newBadges.map((b) => BADGES[b].title).join(', ')}` : '',
              celebration.dailyGoalReached ? 'Daily goal reached!' : '',
              celebration.medalEarned ? 'Maths medal earned!' : '',
            ]
              .filter(Boolean)
              .join('   ') || 'Great work!'}
          </Label>
          <Button3D name="round:next" label="Next one" onPress={next} position={[-0.2, -0.25, 0.01]} width={0.34} height={0.1} color="#06d6a0" />
          <Button3D name="round:menu" label="Activities" onPress={leave} position={[0.2, -0.25, 0.01]} width={0.34} height={0.1} color="#94a3b8" />
        </group>
      ) : (
        <group>
          {round.type === 'counting' && <Button3D name="round:check" label="Check" onPress={check} position={[-0.42, -0.24, 0.01]} width={0.3} height={0.11} color="#ef476f" />}
          <Button3D name="round:reset" label="Reset" onPress={reset} position={[round.type === 'counting' ? -0.08 : -0.32, -0.24, 0.01]} width={0.26} height={0.09} color="#f4a261" />
          <Button3D name="round:skip" label="New one" onPress={next} position={[round.type === 'counting' ? 0.22 : 0, -0.24, 0.01]} width={0.26} height={0.09} color="#118ab2" />
          <Button3D name="round:menu" label="Activities" onPress={leave} position={[round.type === 'counting' ? 0.52 : 0.32, -0.24, 0.01]} width={0.26} height={0.09} color="#94a3b8" />
        </group>
      )}
    </group>
  )
}

function CaptionStrip() {
  const caption = useSessionStore((s) => s.caption)
  const done = useSessionStore((s) => s.roundState?.phase === 'done')
  const show = useAppStore((s) => s.settings.captions)
  if (!caption || !show || done) return null
  const bg = caption.tone === 'hint' ? '#fff3c4' : caption.tone === 'praise' ? '#d1fae5' : '#eef2ff'
  return (
    <Label key={caption.id} position={[0, -0.09, 0.02]} size={0.034} maxWidth={1.35} bg={bg} color="#1f2a44">
      {caption.text}
    </Label>
  )
}
