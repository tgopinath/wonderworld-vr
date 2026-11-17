import { Suspense, lazy, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { selectActiveProfile, useAppStore } from '@/state/appStore'
import { unlockAudio } from '@/audio/audio'
import { Avatar, Btn, DeviceIndicator, Logo, webglAvailable } from '../components/ui'

const WelcomeBackground = lazy(() => import('@/three/WelcomeBackground'))

export function WelcomePage() {
  const navigate = useNavigate()
  const profile = useAppStore(selectActiveProfile)
  const profiles = useAppStore((s) => s.profiles)
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [gl] = useState(webglAvailable)

  return (
    <main className="relative min-h-full overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#ffe8cc,transparent_45%),radial-gradient(circle_at_80%_30%,#e0d9ff,transparent_45%),radial-gradient(circle_at_50%_90%,#c9f7e9,transparent_50%)]" />
      {gl && (
        <Suspense fallback={null}>
          <WelcomeBackground />
        </Suspense>
      )}
      <div className="pointer-events-none relative mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-5 py-10 text-center">
        <div className="pointer-events-auto">
          <Logo />
        </div>
        <p className="max-w-xl text-xl text-ink/80 sm:text-2xl">Grab, count and build your way through magical 3D worlds.</p>
        <div className="pointer-events-auto flex flex-col items-center gap-4 sm:flex-row">
          <Btn
            size="lg"
            tone="tangerine"
            onClick={() => {
              unlockAudio()
              navigate(profiles.length ? '/profiles' : '/profiles?new=1')
            }}
          >
            Start learning
          </Btn>
          {profile && (
            <Btn
              size="lg"
              tone="grape"
              onClick={() => {
                unlockAudio()
                navigate('/play')
              }}
            >
              <Avatar id={profile.avatarId} size={32} /> Continue as {profile.nickname}
            </Btn>
          )}
        </div>
        {!gl && <p className="pointer-events-auto rounded-xl bg-berry/10 px-4 py-2 text-berry">This browser can’t show 3D (WebGL is off). Try Chrome, Edge, Safari or the Meta Quest Browser.</p>}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3">
          <DeviceIndicator />
          <fieldset className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm ring-1 ring-black/5">
            <legend className="sr-only">Audio</legend>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={settings.narration} onChange={(e) => updateSettings({ narration: e.target.checked })} /> Voice
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={settings.sfx} onChange={(e) => updateSettings({ sfx: e.target.checked })} /> Sounds
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={settings.music} onChange={(e) => { unlockAudio(); updateSettings({ music: e.target.checked }) }} /> Music
            </label>
          </fieldset>
        </div>
        <nav className="pointer-events-auto flex gap-4 text-sm" aria-label="Grown-ups">
          <Link className="text-grape underline-offset-4 hover:underline" to="/parent">
            Parents’ corner
          </Link>
          <Link className="text-grape underline-offset-4 hover:underline" to="/settings">
            Settings
          </Link>
          <Link className="text-grape underline-offset-4 hover:underline" to="/privacy">
            Privacy
          </Link>
        </nav>
      </div>
    </main>
  )
}
