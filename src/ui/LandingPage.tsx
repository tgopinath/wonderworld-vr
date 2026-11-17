import { Link } from 'react-router-dom'
import { SYSTEMS } from '@/engine/anatomy'
import { Logo } from './ui'

const FEATURES = [
  { title: '2,827 named structures', body: 'Every bone, muscle, vessel, nerve and organ from the BodyParts3D / Z-Anatomy atlas, at true scale.' },
  { title: 'Layers and cross-sections', body: 'Switch systems on and off, make layers see-through, and cut axial, sagittal or coronal sections.' },
  { title: 'Study with spaced repetition', body: 'Locate and identify quizzes per system. Cards you miss come back sooner; ones you know drift away.' },
  { title: 'Life-size in VR', body: 'Open it in Meta Quest Browser and walk around the body at 1:1 scale. Point to select, teleport, snap-turn.' },
]

export function LandingPage() {
  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,#132230_0%,#0b1118_60%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logo />
        <nav className="flex items-center gap-5 text-sm text-mute">
          <Link to="/about" className="hover:text-ink">
            Sources & licence
          </Link>
          <Link to="/lab" className="rounded-md bg-accent px-3 py-1.5 font-medium text-[#04201c] hover:bg-[#5eead4]">
            Open the lab
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:pt-20">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">3D · WebXR · Open anatomy data</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">Study the human body in three dimensions.</h1>
        <p className="mt-5 max-w-2xl text-lg text-mute">
          A browser-based anatomy atlas for students: explore real anatomical models layer by layer, slice through them, and test yourself with spaced repetition — on a laptop, a tablet or a VR headset.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/lab" className="rounded-md bg-accent px-5 py-2.5 font-medium text-[#04201c] hover:bg-[#5eead4]">
            Open the lab
          </Link>
          <Link to="/lab?mode=study" className="rounded-md border border-line px-5 py-2.5 font-medium hover:bg-white/5">
            Start studying
          </Link>
        </div>

        <section className="mt-16 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-panel p-5">
              <h2 className="font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mute">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-faint">Systems</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SYSTEMS.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
                {s.label}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-16 max-w-3xl text-xs leading-relaxed text-faint">
          Models: BodyParts3D — The Database Center for Life Science — CC-BY-SA 2.1 Japan; Z-Anatomy — The open source atlas of anatomy — CC-BY-SA 4.0; assembled by the 3d-anatomy project. Educational, non-commercial use (CC BY-NC-SA 4.0). Not a medical device. <Link to="/about" className="underline hover:text-mute">Full credits</Link>.
        </p>
      </main>
    </div>
  )
}
