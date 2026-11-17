import { Link } from 'react-router-dom'
import { useAppStore } from '@/state/appStore'
import { unlockAudio } from '@/audio/audio'
import { Card, Logo } from '../components/ui'

export function SettingsPage() {
  const s = useAppStore((st) => st.settings)
  const update = useAppStore((st) => st.updateSettings)
  const comfort = useAppStore((st) => st.updateComfort)
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between">
        <Logo small />
        <Link to="/" className="text-grape">
          Home
        </Link>
      </header>
      <h1 className="text-3xl font-semibold">Settings</h1>
      <Card>
        <h2 className="text-xl font-semibold">Sound</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Toggle label="Narration (Pip talks)" checked={s.narration} onChange={(v) => update({ narration: v })} />
          <Toggle label="Sound effects" checked={s.sfx} onChange={(v) => update({ sfx: v })} />
          <Toggle
            label="Background music"
            checked={s.music}
            onChange={(v) => {
              unlockAudio()
              update({ music: v })
            }}
          />
          <Toggle label="Captions (always recommended)" checked={s.captions} onChange={(v) => update({ captions: v })} />
          <label className="flex flex-col gap-1 sm:col-span-2">
            Volume
            <input type="range" min={0} max={1} step={0.05} value={s.masterVolume} onChange={(e) => update({ masterVolume: Number(e.target.value) })} />
          </label>
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">VR comfort</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-1">Play position</legend>
            <Radio name="mode" options={[['standing', 'Standing'], ['seated', 'Seated']]} value={s.comfort.mode} onChange={(v) => comfort({ mode: v as 'seated' | 'standing' })} />
          </fieldset>
          <fieldset>
            <legend className="mb-1">Turning</legend>
            <Radio name="turn" options={[['snap', 'Snap turn (most comfortable)'], ['smooth', 'Smooth turn']]} value={s.comfort.turn} onChange={(v) => comfort({ turn: v as 'snap' | 'smooth' })} />
          </fieldset>
          <fieldset>
            <legend className="mb-1">Snap angle</legend>
            <Radio name="snap" options={[['30', '30°'], ['45', '45°']]} value={String(s.comfort.snapDegrees)} onChange={(v) => comfort({ snapDegrees: Number(v) as 30 | 45 })} />
          </fieldset>
          <div className="flex flex-col gap-2">
            <Toggle label="Teleport with the thumbstick" checked={s.comfort.teleport} onChange={(v) => comfort({ teleport: v })} />
            <Toggle label="Comfort vignette while smooth-turning" checked={s.comfort.vignette} onChange={(v) => comfort({ vignette: v })} />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          Every activity can be done without walking. The camera never moves on its own in VR. Use your headset’s Guardian/boundary — WonderWorld does not replace it. Press the Meta button or “Exit VR” on the board to leave VR at any time.
        </p>
      </Card>
    </main>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-cloud px-3 py-2">
      <span>{label}</span>
      <input type="checkbox" className="h-5 w-5 accent-[#6c5ce7]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

function Radio({ name, options, value, onChange }: { name: string; options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      {options.map(([v, l]) => (
        <label key={v} className="flex items-center gap-2">
          <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} className="accent-[#6c5ce7]" /> {l}
        </label>
      ))}
    </div>
  )
}
