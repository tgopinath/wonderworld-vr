import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AGE_GROUPS, type AgeGroup, type AvatarId } from '@/engine/core/types'
import { useAppStore } from '@/state/appStore'
import { unlockAudio } from '@/audio/audio'
import { AVATARS, Avatar, Btn, Card, Logo } from '../components/ui'

export function ProfilesPage() {
  const profiles = useAppStore((s) => s.profiles)
  const setActive = useAppStore((s) => s.setActiveProfile)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [creating, setCreating] = useState(params.has('new') || profiles.length === 0)

  return (
    <main className="mx-auto flex min-h-full max-w-4xl flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between">
        <Logo small />
        <Link to="/" className="text-grape">
          Home
        </Link>
      </header>
      {creating ? (
        <CreateProfile
          onDone={() => navigate('/worlds')}
          onCancel={profiles.length ? () => setCreating(false) : undefined}
        />
      ) : (
        <>
          <h1 className="text-center text-3xl font-semibold">Who’s learning today?</h1>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {profiles.map((p) => (
              <li key={p.id}>
                <button
                  className="flex w-full flex-col items-center gap-2 rounded-blob bg-white p-5 shadow-[0_8px_0_#d5d9e8] transition hover:-translate-y-1 active:translate-y-1 active:shadow-none"
                  onClick={() => {
                    unlockAudio()
                    setActive(p.id)
                    navigate('/worlds')
                  }}
                >
                  <Avatar id={p.avatarId} size={84} />
                  <span className="text-xl font-semibold">{p.nickname}</span>
                  <span className="text-sm text-muted">{AGE_GROUPS[p.ageGroup].label}</span>
                </button>
              </li>
            ))}
            <li>
              <button
                className="flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 rounded-blob border-4 border-dashed border-grape/30 text-grape transition hover:bg-white/60"
                onClick={() => setCreating(true)}
              >
                <span className="text-5xl" aria-hidden>
                  +
                </span>
                <span className="font-semibold">Add a learner</span>
              </button>
            </li>
          </ul>
          <p className="text-center text-sm text-muted">
            Grown-ups can rename or remove profiles in the <Link className="text-grape underline" to="/parent">Parents’ corner</Link>.
          </p>
        </>
      )}
    </main>
  )
}

function CreateProfile({ onDone, onCancel }: { onDone: () => void; onCancel?: () => void }) {
  const create = useAppStore((s) => s.createProfile)
  const [nickname, setNickname] = useState('')
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('little')
  const [avatarId, setAvatar] = useState<AvatarId>('fox')
  const valid = nickname.trim().length >= 1

  return (
    <Card className="mx-auto w-full max-w-xl">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          unlockAudio()
          create({ nickname, ageGroup, avatarId })
          onDone()
        }}
      >
        <h1 className="text-2xl font-semibold">New learner</h1>
        <p className="-mt-3 text-sm text-muted">Just a nickname — no real names, emails or birthdays needed.</p>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Nickname</span>
          <input
            className="rounded-2xl border-2 border-black/10 px-4 py-3 text-lg outline-none focus:border-grape"
            value={nickname}
            maxLength={20}
            autoFocus
            placeholder="e.g. Star Fox"
            onChange={(e) => setNickname(e.target.value)}
          />
        </label>
        <fieldset>
          <legend className="mb-2 font-medium">Age group</legend>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(AGE_GROUPS) as AgeGroup[]).map((g) => (
              <label key={g} className={`cursor-pointer rounded-2xl border-2 p-3 text-center ${ageGroup === g ? 'border-grape bg-grape/10' : 'border-black/10'}`}>
                <input type="radio" className="sr-only" name="age" checked={ageGroup === g} onChange={() => setAgeGroup(g)} />
                <span className="block font-semibold">{AGE_GROUPS[g].label}</span>
                <span className="text-sm text-muted">Ages {AGE_GROUPS[g].ages}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 font-medium">Pick a buddy</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(AVATARS) as AvatarId[]).map((a) => (
              <label key={a} className={`cursor-pointer rounded-full p-1 ring-4 ${avatarId === a ? 'ring-grape' : 'ring-transparent'}`}>
                <input type="radio" className="sr-only" name="avatar" checked={avatarId === a} onChange={() => setAvatar(a)} aria-label={AVATARS[a].label} />
                <Avatar id={a} size={56} />
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Btn type="button" tone="white" onClick={onCancel}>
              Cancel
            </Btn>
          )}
          <Btn type="submit" tone="mint" disabled={!valid}>
            Let’s go!
          </Btn>
        </div>
      </form>
    </Card>
  )
}
