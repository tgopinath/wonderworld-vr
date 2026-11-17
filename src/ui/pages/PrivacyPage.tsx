import { Link } from 'react-router-dom'
import { Card, Logo } from '../components/ui'

export function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between">
        <Logo small />
        <Link to="/" className="text-grape">
          Home
        </Link>
      </header>
      <Card>
        <h1 className="text-3xl font-semibold">Privacy & data</h1>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <b>What we keep:</b> a nickname, age group and avatar for each learner, their activity results (level, retries, stars, time) and app settings.
          </li>
          <li>
            <b>Where:</b> in this demo version, only in this browser’s local storage on this device. Your child’s data is never sent anywhere.
          </li>
          <li>
            <b>No tracking:</b> no advertising, no analytics SDKs, no third-party cookies, no public profiles, no messaging.
          </li>
          <li>
            <b>VR models:</b> when VR starts, the 3D models of the controllers and hands are downloaded from the public jsDelivr CDN. No personal data is included in that request.
          </li>
          <li>
            <b>Speech:</b> narration uses your browser’s built-in voice. No microphone is ever used.
          </li>
          <li>
            <b>Retention:</b> data stays until a parent deletes a profile or uses “Delete all data” in the Parents’ corner, or clears this site’s data in the browser. Only the latest 2,000 activity results are kept.
          </li>
        </ul>
      </Card>
    </main>
  )
}
