import { Link, Navigate, useNavigate } from 'react-router-dom'
import { WORLDS } from '@/config/worlds'
import { ACTIVITIES, ACTIVITY_ORDER, levelCount } from '@/config/activities'
import { selectActiveProfile, useAppStore } from '@/state/appStore'
import { useSessionStore } from '@/state/sessionStore'
import { mathProgressPct } from '@/state/selectors'
import { Avatar, Btn, Card, Logo, SoundToggle } from '../components/ui'

export function WorldsPage() {
  const profile = useAppStore(selectActiveProfile)
  const progress = useAppStore((s) => (s.activeProfileId ? s.progress[s.activeProfileId] : undefined))
  const rewards = useAppStore((s) => (s.activeProfileId ? s.rewards[s.activeProfileId] : undefined))
  const navigate = useNavigate()
  if (!profile) return <Navigate to="/profiles" replace />

  const enter = (scene: 'classroom' | 'math') => {
    useSessionStore.setState({ scene })
    navigate('/play')
  }

  return (
    <main className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Logo small />
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-black/5">
            <Avatar id={profile.avatarId} size={28} /> {profile.nickname}
          </span>
          <span className="rounded-full bg-sun/40 px-3 py-1">⭐ {rewards?.stars ?? 0}</span>
          <span className="rounded-full bg-tangerine/20 px-3 py-1">🪙 {rewards?.coins ?? 0}</span>
          <SoundToggle compact />
          <Link to="/profiles" className="text-grape">
            Switch
          </Link>
        </div>
      </header>

      <section className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">Where shall we go?</h1>
        <p className="text-muted">Step into the 3D classroom and walk through a portal — or jump straight into a world.</p>
        <Btn size="lg" tone="grape" onClick={() => enter('classroom')}>
          🏫 Enter the classroom
        </Btn>
      </section>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {WORLDS.map((w) => {
          const isMath = w.id === 'math'
          const done = isMath ? ACTIVITY_ORDER.filter((t) => (progress?.[t]?.rounds ?? 0) > 0).length : 0
          const pct = isMath ? mathProgressPct(progress) : 0
          return (
            <li key={w.id}>
              <Card className={`flex h-full flex-col gap-3 ${w.available ? '' : 'opacity-75'}`}>
                <div className="grid h-28 place-items-center rounded-2xl text-6xl" style={{ background: `linear-gradient(135deg, ${w.accent}, ${w.color})` }} aria-hidden>
                  {w.icon}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl font-semibold">{w.title}</h2>
                  <span className="rounded-full bg-cloud px-2 py-0.5 text-xs text-muted">{w.difficulty}</span>
                </div>
                <p className="text-sm text-muted">{w.description}</p>
                {isMath ? (
                  <>
                    <ul className="flex flex-col gap-1 text-sm">
                      {ACTIVITY_ORDER.map((t) => (
                        <li key={t} className="flex justify-between">
                          <span>
                            {ACTIVITIES[t].icon} {ACTIVITIES[t].title}
                          </span>
                          <span className="text-muted">
                            Lv {progress?.[t]?.level ?? 1}/{levelCount(t)} · {progress?.[t]?.rounds ?? 0} done
                          </span>
                        </li>
                      ))}
                      <li className="flex justify-between text-muted/70">
                        <span>✖️ Multiplication · 🧩 Number puzzles</span>
                        <span>🔒 Next update</span>
                      </li>
                    </ul>
                    <div className="h-3 overflow-hidden rounded-full bg-cloud" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="World progress">
                      <div className="h-full rounded-full bg-mint" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted">{done} of 4 activities tried</p>
                    <Btn tone="tangerine" onClick={() => enter('math')}>
                      Start
                    </Btn>
                  </>
                ) : (
                  <p className="mt-auto rounded-xl bg-cloud px-3 py-2 text-center text-sm font-medium text-muted">🔒 Coming soon</p>
                )}
              </Card>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
