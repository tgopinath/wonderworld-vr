import { Link } from 'react-router-dom'
import { Logo } from './ui'

export function AboutPage() {
  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Logo />
        <Link to="/lab" className="text-sm text-accent hover:underline">
          Open the lab
        </Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-5 pb-16 text-[15px] leading-relaxed text-mute">
        <section>
          <h1 className="text-2xl font-semibold text-ink">Sources, licence & privacy</h1>
          <p className="mt-2">Anatomy Lab is a free educational tool. It is not a medical device and must not be used for diagnosis or treatment.</p>
        </section>

        <section>
          <h2 className="font-semibold text-ink">3D models</h2>
          <p className="mt-2">The anatomical models are the seven system files (skeletal, muscular, joints, cardiovascular, nervous, visceral, lymphatic) published by the open-source 3d-anatomy project, exported from Z-Anatomy, which is built on BodyParts3D. Required attributions:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/90">
            <li>"BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan"</li>
            <li>"Z-Anatomy - The open source atlas of anatomy - CC-BY-SA 4.0"</li>
            <li>"Cranial Nerves and Foramina - by University of Dundee, CAHID - CC-BY 4.0"</li>
            <li>"Anatomy of the Inner Ear - by University of Dundee School of Medicine - CC-BY-NC-SA 4.0"</li>
            <li>"Kidney - by lissiecowley - CC-BY-NC 4.0"</li>
            <li>"Brainder" and "White matter" from the University of Washington (licence not stated upstream)</li>
          </ul>
          <p className="mt-2">
            Because two components are non-commercial, the models as used here are under <b className="text-ink">CC BY-NC-SA 4.0</b>: free to share and adapt for non-commercial purposes with attribution, under the same licence. The upstream notice ships unmodified at{' '}
            <a className="text-accent hover:underline" href="/models/License.txt">
              /models/License.txt
            </a>
            . Meshes are shown as published; this app only recolours them by tissue type.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink">Study notes</h2>
          <p className="mt-2">Short notes on about 50 commonly studied structures were written for this app from standard textbook facts. Other structures show their system, tissue group, size and neighbouring structures computed from the model.</p>
        </section>

        <section>
          <h2 className="font-semibold text-ink">Privacy</h2>
          <p className="mt-2">No account, no analytics, no ads. Your layer settings and study progress are stored only in this browser (localStorage). When you enter VR, the XR library downloads standard controller and hand models from the public jsDelivr CDN; no personal data is included.</p>
        </section>

        <section>
          <h2 className="font-semibold text-ink">Known limitations</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>VR is verified in Meta’s Quest 3 emulator; it has not yet been tested on a physical headset.</li>
            <li>The heart/vessel and nerve layers are dense (about 2.5 M and 1.4 M triangles) and may be slow on phones and standalone headsets.</li>
            <li>Cut surfaces are open (hollow), not capped.</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
