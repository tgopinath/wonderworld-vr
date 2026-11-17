import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ACTIVITIES, ACTIVITY_ORDER, levelCount } from '@/config/activities'
import { WORLDS } from '@/config/worlds'
import { AGE_GROUPS, type ActivityType, type AgeGroup, type ChildProfile } from '@/engine/core/types'
import { BADGES } from '@/engine/rewards/rewards'
import { grownUpQuestion, hashPin, isValidPin, newSalt } from '@/persistence/pin'
import { useAppStore } from '@/state/appStore'
import { accuracy, mathProgressPct } from '@/state/selectors'
import { Avatar, Btn, Card, Logo, formatDuration } from '../components/ui'

// Unlock lasts for this page visit only (memory), never persisted.
let unlocked = false

export function ParentPage() {
  const [ok, setOk] = useState(unlocked)
  return (
    <main className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Logo small />
        <nav className="flex gap-4" aria-label="Parent">
          <Link to="/" className="text-grape">
            Home
          </Link>
          {ok && (
            <button
              className="text-grape"
              onClick={() => {
                unlocked = false
                setOk(false)
              }}
            >
              Lock
            </button>
          )}
        </nav>
      </header>
      {ok ? (
        <Dashboard />
      ) : (
        <Gate
          onUnlock={() => {
            unlocked = true
            setOk(true)
          }}
        />
      )}
    </main>
  )
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const parent = useAppStore((s) => s.parent)
  const updateParent = useAppStore((s) => s.updateParent)
  const q = useMemo(() => grownUpQuestion(), [])
  const [step, setStep] = useState<'question' | 'pin'>(parent.pinHash ? 'pin' : 'question')
  const [answer, setAnswer] = useState('')
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const creating = !parent.pinHash

  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-semibold">Parents’ corner</h1>
      {step === 'question' ? (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (Number(answer) === q.answer) {
              setError(null)
              setStep('pin')
            } else setError('That’s not quite right. Please ask a grown-up.')
          }}
        >
          <label className="flex flex-col gap-1">
            <span>
              Grown-ups only: what is <span data-testid="gate-question">{q.text}</span>?
            </span>
            <input inputMode="numeric" className="rounded-xl border-2 border-black/10 px-3 py-2 text-lg" value={answer} onChange={(e) => setAnswer(e.target.value)} autoFocus aria-label="Answer" />
          </label>
          {error && <p className="text-sm text-berry">{error}</p>}
          <Btn type="submit">Continue</Btn>
        </form>
      ) : (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!isValidPin(pin)) return setError('Use 4 to 6 digits.')
            if (creating) {
              if (pin !== pin2) return setError('The two PINs don’t match.')
              const salt = newSalt()
              updateParent({ salt, pinHash: await hashPin(pin, salt) })
              onUnlock()
            } else {
              const h = await hashPin(pin, parent.salt ?? '')
              if (h === parent.pinHash) onUnlock()
              else setError('Wrong PIN. Try again.')
            }
          }}
        >
          <p className="text-sm text-muted">{creating ? 'Create a parent PIN. It keeps settings and progress details away from little hands.' : 'Enter your parent PIN.'}</p>
          <input type="password" inputMode="numeric" autoComplete="off" maxLength={6} className="rounded-xl border-2 border-black/10 px-3 py-2 text-lg tracking-widest" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} aria-label="PIN" autoFocus />
          {creating && (
            <input type="password" inputMode="numeric" autoComplete="off" maxLength={6} className="rounded-xl border-2 border-black/10 px-3 py-2 text-lg tracking-widest" value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))} aria-label="Repeat PIN" placeholder="Repeat PIN" />
          )}
          {error && <p className="text-sm text-berry">{error}</p>}
          <Btn type="submit">{creating ? 'Save PIN' : 'Unlock'}</Btn>
          {!creating && <p className="text-xs text-muted">Forgot the PIN? It is stored only on this device. Clearing this site’s data in the browser resets the app (and its progress).</p>}
        </form>
      )}
    </Card>
  )
}

function Dashboard() {
  const profiles = useAppStore((s) => s.profiles)
  const [sel, setSel] = useState<string | null>(profiles[0]?.id ?? null)
  const profile = profiles.find((p) => p.id === sel) ?? profiles[0]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Learning dashboard</h1>
      {profiles.length === 0 ? (
        <Card>
          <p>No learners yet.</p>
          <Link to="/profiles?new=1" className="text-grape underline">
            Create a profile
          </Link>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Learners">
            {profiles.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={p.id === profile?.id}
                onClick={() => setSel(p.id)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 ring-2 ${p.id === profile?.id ? 'bg-grape text-white ring-grape' : 'bg-white ring-black/5'}`}
              >
                <Avatar id={p.avatarId} size={26} /> {p.nickname}
              </button>
            ))}
            <Link to="/profiles?new=1" className="rounded-full bg-white px-3 py-1.5 text-grape ring-2 ring-black/5">
              + Add
            </Link>
          </div>
          {profile && <ChildReport key={profile.id} profile={profile} />}
        </>
      )}
      <FamilySettings />
    </div>
  )
}

function ChildReport({ profile }: { profile: ChildProfile }) {
  const progress = useAppStore((s) => s.progress[profile.id])
  const rewards = useAppStore((s) => s.rewards[profile.id])
  const time = useAppStore((s) => s.learningTimeMs[profile.id] ?? 0)
  const attempts = useAppStore((s) => s.attempts)
  const locks = useAppStore((s) => s.parent.levelLocks)
  const updateParent = useAppStore((s) => s.updateParent)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const deleteProfile = useAppStore((s) => s.deleteProfile)
  const setActive = useAppStore((s) => s.setActiveProfile)
  const setLevel = useAppStore((s) => s.setLevel)
  const mine = useMemo(() => attempts.filter((a) => a.profileId === profile.id), [attempts, profile.id])

  const rounds = ACTIVITY_ORDER.reduce((n, t) => n + (progress?.[t]?.rounds ?? 0), 0)
  const mistakes = ACTIVITY_ORDER.reduce((n, t) => n + (progress?.[t]?.mistakes ?? 0), 0)
  const acc = accuracy({ rounds, mistakes })
  const tricky = ACTIVITY_ORDER.filter((t) => (progress?.[t]?.rounds ?? 0) >= 2)
    .map((t) => ({ t, avg: (progress?.[t]?.mistakes ?? 0) / (progress?.[t]?.rounds ?? 1) }))
    .filter((x) => x.avg >= 0.5)
    .sort((a, b) => b.avg - a.avg)

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="grid grid-cols-2 gap-3 lg:col-span-3 lg:grid-cols-5">
        <Stat label="Learning time" value={formatDuration(time)} />
        <Stat label="Activities completed" value={String(rounds)} testId="stat-rounds" />
        <Stat label="Accuracy" value={acc === null ? '—' : `${acc}%`} hint="Right first time" />
        <Stat label="Stars" value={String(rewards?.stars ?? 0)} testId="stat-stars" />
        <Stat label="Day streak" value={String(rewards?.streak.current ?? 0)} />
      </div>

      <Card className="lg:col-span-2">
        <h2 className="text-xl font-semibold">Mathematics — by activity</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-1 pr-3 font-medium">Activity</th>
                <th className="py-1 pr-3 font-medium">Level</th>
                <th className="py-1 pr-3 font-medium">Done</th>
                <th className="py-1 pr-3 font-medium">Accuracy</th>
                <th className="py-1 font-medium">Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVITY_ORDER.map((t) => {
                const p = progress?.[t]
                const a = accuracy(p)
                return (
                  <tr key={t} className="border-t border-black/5">
                    <td className="py-2 pr-3">
                      {ACTIVITIES[t].icon} {ACTIVITIES[t].title}
                    </td>
                    <td className="py-2 pr-3">
                      {p?.level ?? 1} / {levelCount(t)}
                    </td>
                    <td className="py-2 pr-3" data-testid={`done-${t}`}>
                      {p?.rounds ?? 0}
                    </td>
                    <td className="py-2 pr-3">{a === null ? '—' : `${a}%`}</td>
                    <td className="py-2">
                      <select
                        aria-label={`${ACTIVITIES[t].title} difficulty`}
                        className="rounded-lg border border-black/10 bg-white px-2 py-1"
                        value={locks[t] ?? 'auto'}
                        onChange={(e) => {
                          const v = e.target.value
                          const next = { ...locks }
                          if (v === 'auto') delete next[t]
                          else next[t] = Number(v)
                          updateParent({ levelLocks: next })
                          if (v !== 'auto') {
                            setActive(profile.id)
                            setLevel(t as ActivityType, Number(v))
                          }
                        }}
                      >
                        <option value="auto">Adaptive</option>
                        {Array.from({ length: levelCount(t) }, (_, i) => (
                          <option key={i} value={i + 1}>
                            Fixed: level {i + 1}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">Adaptive: three clean rounds in a row move up a level; a round with two or more retries moves down one. Fixed levels apply to every learner on this device.</p>
        <h3 className="mt-5 font-semibold">Progress by subject</h3>
        <ul className="mt-2 grid gap-2">
          {WORLDS.map((w) => {
            const pct = w.id === 'math' ? mathProgressPct(progress) : 0
            return (
              <li key={w.id} className="flex items-center gap-2 text-sm">
                <span className="w-40 shrink-0">
                  {w.icon} {w.title}
                </span>
                {w.available ? (
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-cloud" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${w.title} progress`}>
                    <span className="block h-full rounded-full bg-mint" style={{ width: `${pct}%` }} />
                  </span>
                ) : (
                  <span className="text-xs text-muted">Not available yet</span>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      <div className="flex flex-col gap-5">
        <Card>
          <h2 className="text-xl font-semibold">Needs practice</h2>
          {tricky.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nothing tricky yet — keep exploring!</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {tricky.map(({ t, avg }) => (
                <li key={t}>
                  {ACTIVITIES[t].title}: about {avg.toFixed(1)} retries per round
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Recent achievements</h2>
          {rewards?.badges.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {[...rewards.badges]
                .reverse()
                .slice(0, 6)
                .map((b) => (
                  <li key={b.id}>
                    {BADGES[b.id].icon} <b>{BADGES[b.id].title}</b> <span className="text-muted">· {new Date(b.earnedAt).toLocaleDateString()}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No badges yet.</p>
          )}
        </Card>
      </div>

      <Card className="lg:col-span-2">
        <h2 className="text-xl font-semibold">Recent activity</h2>
        {mine.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No completed rounds yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-black/5 text-sm" data-testid="recent-attempts">
            {mine
              .slice(-10)
              .reverse()
              .map((a) => (
                <li key={a.id} className="flex justify-between py-1.5">
                  <span>
                    {ACTIVITIES[a.activityId].title} · level {a.level}
                  </span>
                  <span className="text-muted">
                    {'⭐'.repeat(a.stars)} · {a.mistakes} retr{a.mistakes === 1 ? 'y' : 'ies'} · {Math.round(a.durationMs / 1000)}s ·{' '}
                    {new Date(a.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Profile</h2>
        <ProfileEditor profile={profile} onSave={(patch) => updateProfile(profile.id, patch)} />
        <Btn
          tone="berry"
          size="sm"
          className="mt-4"
          onClick={() => {
            if (confirm(`Delete ${profile.nickname} and all of their progress? This cannot be undone.`)) deleteProfile(profile.id)
          }}
        >
          Delete profile
        </Btn>
      </Card>
    </div>
  )
}

function ProfileEditor({ profile, onSave }: { profile: ChildProfile; onSave: (p: { nickname: string; ageGroup: AgeGroup }) => void }) {
  const [nickname, setNickname] = useState(profile.nickname)
  const [ageGroup, setAgeGroup] = useState(profile.ageGroup)
  const dirty = nickname !== profile.nickname || ageGroup !== profile.ageGroup
  return (
    <form
      className="mt-3 flex flex-col gap-2 text-sm"
      onSubmit={(e) => {
        e.preventDefault()
        if (nickname.trim()) onSave({ nickname: nickname.trim().slice(0, 20), ageGroup })
      }}
    >
      <label className="flex flex-col gap-1">
        Nickname
        <input className="rounded-lg border border-black/10 px-2 py-1.5" value={nickname} maxLength={20} onChange={(e) => setNickname(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        Age group (sets age-appropriate starting levels)
        <select className="rounded-lg border border-black/10 bg-white px-2 py-1.5" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}>
          {(Object.keys(AGE_GROUPS) as AgeGroup[]).map((g) => (
            <option key={g} value={g}>
              {AGE_GROUPS[g].label} ({AGE_GROUPS[g].ages})
            </option>
          ))}
        </select>
      </label>
      <Btn size="sm" tone="mint" disabled={!dirty} type="submit">
        Save
      </Btn>
    </form>
  )
}

function FamilySettings() {
  const parent = useAppStore((s) => s.parent)
  const settings = useAppStore((s) => s.settings)
  const updateParent = useAppStore((s) => s.updateParent)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const wipe = useAppStore((s) => s.wipeAll)
  return (
    <Card>
      <h2 className="text-xl font-semibold">Family settings</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          Session limit
          <select className="rounded-lg border border-black/10 bg-white px-2 py-1.5" value={parent.sessionLimitMin ?? 0} onChange={(e) => updateParent({ sessionLimitMin: Number(e.target.value) || null })}>
            <option value={0}>No limit</option>
            {[10, 15, 20, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Break reminder
          <select className="rounded-lg border border-black/10 bg-white px-2 py-1.5" value={parent.breakReminderMin ?? 0} onChange={(e) => updateParent({ breakReminderMin: Number(e.target.value) || null })}>
            <option value={0}>Off</option>
            {[10, 15, 20, 30].map((m) => (
              <option key={m} value={m}>
                Every {m} minutes
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Volume
          <input type="range" min={0} max={1} step={0.05} value={settings.masterVolume} onChange={(e) => updateSettings({ masterVolume: Number(e.target.value) })} />
        </label>
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend>Audio</legend>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={settings.narration} onChange={(e) => updateSettings({ narration: e.target.checked })} /> Narration
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={settings.music} onChange={(e) => updateSettings({ music: e.target.checked })} /> Music
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={settings.captions} onChange={(e) => updateSettings({ captions: e.target.checked })} /> Captions
          </label>
        </fieldset>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-black/5 pt-4">
        <Link to="/settings" className="text-sm text-grape underline">
          VR comfort settings
        </Link>
        <Btn
          size="sm"
          tone="white"
          onClick={() => {
            if (confirm('Remove the parent PIN? You will create a new one next time.')) updateParent({ pinHash: null, salt: null })
          }}
        >
          Reset PIN
        </Btn>
        <Btn
          size="sm"
          tone="berry"
          onClick={() => {
            if (confirm('Delete ALL profiles, progress and settings from this device? This cannot be undone.')) {
              void wipe().then(() => {
                unlocked = false
                location.href = '/'
              })
            }
          }}
        >
          Delete all data
        </Btn>
        <span className="text-xs text-muted">All data is stored only on this device (demo mode) and never sent anywhere.</span>
      </div>
    </Card>
  )
}

function Stat({ label, value, hint, testId }: { label: string; value: string; hint?: string; testId?: string }) {
  return (
    <Card className="!p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-semibold" data-testid={testId}>
        {value}
      </p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </Card>
  )
}
