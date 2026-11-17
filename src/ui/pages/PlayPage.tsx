// Hosts the persistent 3D canvas plus a light HTML HUD (desktop/mobile). Inside VR the HUD is
// hidden by the headset; everything essential is mirrored on 3D boards.
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { selectActiveProfile, useAppStore } from '@/state/appStore'
import { useSessionStore } from '@/state/sessionStore'
import { detectXRSupport, type XRSupport } from '@/three/xrSupport'
import { unlockAudio } from '@/audio/audio'
import { Avatar, Btn, ErrorBoundary, SoundToggle, Spinner, webglAvailable } from '../components/ui'

const PlayCanvas = lazy(() => import('@/three/PlayCanvas').then((m) => ({ default: m.PlayCanvas })))

export function PlayPage() {
  const profile = useAppStore(selectActiveProfile)
  if (!profile) return <Navigate to="/profiles" replace />
  if (!webglAvailable()) {
    return (
      <div className="grid min-h-full place-items-center p-6 text-center">
        <div>
          <p className="text-xl">This device can’t show 3D right now.</p>
          <Link to="/" className="text-grape underline">
            Back home
          </Link>
        </div>
      </div>
    )
  }
  return (
    <div className="fixed inset-0 bg-[#cfe9ff]">
      <ErrorBoundary>
        <Suspense fallback={<Spinner label="Building your world…" />}>
          <PlayCanvas />
        </Suspense>
      </ErrorBoundary>
      <WorldLoading />
      <Hud />
      <SessionTimers />
    </div>
  )
}

function Hud() {
  const profile = useAppStore(selectActiveProfile)!
  const rewards = useAppStore((s) => (s.activeProfileId ? s.rewards[s.activeProfileId] : undefined))
  const caption = useSessionStore((s) => s.caption)
  const captionsOn = useAppStore((s) => s.settings.captions)
  const scene = useSessionStore((s) => s.scene)
  const inActivity = useSessionStore((s) => s.activity !== null)
  const goTo = useSessionStore((s) => s.goTo)
  const navigate = useNavigate()
  const [xr, setXr] = useState<XRSupport>('checking')
  const [help, setHelp] = useState(false)
  const [vrError, setVrError] = useState<string | null>(null)

  useEffect(() => {
    void detectXRSupport().then(setXr)
    const s = useSessionStore.getState()
    s.speak(s.scene === 'math' ? 'Welcome to Mathematics World! Pick an activity on the big board.' : `Hi ${profile.nickname}! I'm Pip. Tap the glowing Maths portal to start.`)
  }, [profile.nickname])

  const enterVR = async () => {
    unlockAudio()
    setVrError(null)
    try {
      const { enterVR } = await import('@/three/xr')
      await enterVR()
    } catch {
      setVrError('Could not start VR. Check the headset is awake and this page is open in the Meta Quest Browser.')
    }
  }

  const goal = rewards?.dailyGoal ?? 5
  const today = rewards?.daily.date === new Date().toLocaleDateString('en-CA') ? rewards.daily.rounds : 0

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 shadow ring-1 ring-black/5">
          <Avatar id={profile.avatarId} size={32} />
          <span className="font-semibold">{profile.nickname}</span>
          <span className="ml-2 rounded-full bg-sun/40 px-2 py-0.5 text-sm" aria-label={`${rewards?.stars ?? 0} stars`}>
            ⭐ {rewards?.stars ?? 0}
          </span>
          <span className="rounded-full bg-tangerine/20 px-2 py-0.5 text-sm" aria-label={`${rewards?.coins ?? 0} coins`}>
            🪙 {rewards?.coins ?? 0}
          </span>
          <span className="hidden rounded-full bg-mint/20 px-2 py-0.5 text-sm sm:inline" title="Daily goal">
            🎯 {Math.min(today, goal)}/{goal}
          </span>
          {(rewards?.streak.current ?? 0) > 1 && <span className="hidden rounded-full bg-berry/15 px-2 py-0.5 text-sm sm:inline">🔥 {rewards?.streak.current}</span>}
        </div>
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {(xr === 'immersive-vr' || xr === 'emulated') && (
            <Btn tone="grape" size="sm" onClick={enterVR} data-testid="enter-vr">
              🥽 Enter VR{xr === 'emulated' ? ' (emulator)' : ''}
            </Btn>
          )}
          {scene === 'math' && (
            <Btn tone="white" size="sm" onClick={() => goTo('classroom')}>
              🏫 Classroom
            </Btn>
          )}
          <SoundToggle compact />
          <Btn tone="white" size="sm" aria-expanded={help} onClick={() => setHelp((h) => !h)}>
            ❓ Help
          </Btn>
          <Btn tone="white" size="sm" onClick={() => navigate('/worlds')}>
            ✖ Exit
          </Btn>
        </div>
      </div>

      {vrError && (
        <div role="alert" className="absolute left-1/2 top-20 -translate-x-1/2 rounded-xl bg-white px-4 py-2 text-berry shadow">
          {vrError}
        </div>
      )}

      {help && <HelpPanel onClose={() => setHelp(false)} />}

      {captionsOn && caption && (
        // During an activity the 3D board shows the caption; keep this one for screen readers only.
        <div className={inActivity ? 'sr-only' : 'pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4'}>
          <p
            key={caption.id}
            aria-live="polite"
            data-testid="caption"
            className={`max-w-2xl rounded-2xl px-5 py-3 text-center text-lg shadow-lg ring-1 ring-black/5 ${caption.tone === 'hint' ? 'bg-[#fff3c4]' : caption.tone === 'praise' ? 'bg-[#d1fae5]' : 'bg-white/95'}`}
          >
            <span aria-hidden>🤖 </span>
            {caption.text}
          </p>
        </div>
      )}
    </>
  )
}

function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div role="dialog" aria-label="How to play" className="absolute right-3 top-20 w-80 max-w-[calc(100%-1.5rem)] rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
      <h2 className="text-lg font-semibold">How to play</h2>
      <ul className="mt-2 space-y-1.5 text-sm">
        <li>🖱️ <b>Drag</b> an object to move it. Or <b>tap it</b>, then <b>tap a basket</b>.</li>
        <li>👀 <b>Drag empty space</b> to look around.</li>
        <li>⌨️ <b>W A S D</b> or arrows to walk, <b>Q / E</b> to turn.</li>
        <li>👆 <b>Click the floor</b> to walk there.</li>
        <li>🥽 In VR: <b>point + trigger</b> to pick, <b>grip</b> to grab close things, <b>push the stick forward</b> to teleport, <b>flick it sideways</b> to turn.</li>
      </ul>
      <Btn className="mt-3 w-full" size="sm" onClick={onClose}>
        Got it
      </Btn>
    </div>
  )
}

/** Counts active learning time, nudges breaks, and honours the parent's session limit. */
function SessionTimers() {
  const addTime = useAppStore((s) => s.addLearningTime)
  const parent = useAppStore((s) => s.parent)
  const [limitHit, setLimitHit] = useState(false)
  const [breakNudge, setBreakNudge] = useState(false)
  const elapsed = useRef(0)
  const lastBreak = useRef(0)
  const navigate = useNavigate()

  useEffect(() => {
    let last = Date.now()
    const id = setInterval(() => {
      const now = Date.now()
      const dt = document.visibilityState === 'visible' ? now - last : 0
      last = now
      elapsed.current += dt
      addTime(dt)
      const min = elapsed.current / 60000
      if (parent.breakReminderMin && min - lastBreak.current >= parent.breakReminderMin) {
        lastBreak.current = min
        setBreakNudge(true)
        useSessionStore.getState().speak('You have been learning for a while. Time for a little stretch and a sip of water!')
      }
      if (parent.sessionLimitMin && min >= parent.sessionLimitMin && !limitHit) {
        setLimitHit(true)
        useSessionStore.getState().speak('That is all for today. Great learning! See you next time.', 'praise')
        // Give the child time to read, then leave VR gently.
        setTimeout(() => void import('@/three/xr').then((m) => m.exitVR()), 8000)
      }
    }, 5000)
    return () => clearInterval(id)
  }, [addTime, parent.breakReminderMin, parent.sessionLimitMin, limitHit])

  if (limitHit) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-ink/40 p-6" role="dialog" aria-label="Session finished">
        <div className="max-w-sm rounded-blob bg-white p-6 text-center">
          <p className="text-5xl" aria-hidden>
            🌙
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Time’s up for today</h2>
          <p className="mt-1 text-muted">Your stars are saved. Come back tomorrow!</p>
          <Btn className="mt-4" onClick={() => navigate('/')}>
            Back home
          </Btn>
        </div>
      </div>
    )
  }
  if (breakNudge) {
    return (
      <div className="absolute left-1/2 top-24 -translate-x-1/2 rounded-2xl bg-white px-5 py-3 text-center shadow-xl" role="status">
        🧃 Stretch break? <Btn size="sm" className="ml-2" onClick={() => setBreakNudge(false)}>OK</Btn>
      </div>
    )
  }
  return null
}

function WorldLoading() {
  const loading = useSessionStore((s) => s.loading)
  if (!loading) return null
  return (
    <div className="pointer-events-none absolute inset-0 bg-[#cfe9ff]">
      <Spinner label="Building your world…" />
    </div>
  )
}
