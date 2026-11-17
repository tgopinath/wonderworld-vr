import { useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { flushSave, useAppStore } from '@/state/appStore'
import { ErrorBoundary, Spinner } from '@/ui/components/ui'
import { WelcomePage } from '@/ui/pages/WelcomePage'
import { ProfilesPage } from '@/ui/pages/ProfilesPage'
import { WorldsPage } from '@/ui/pages/WorldsPage'
import { PlayPage } from '@/ui/pages/PlayPage'
import { ParentPage } from '@/ui/pages/ParentPage'
import { SettingsPage } from '@/ui/pages/SettingsPage'
import { PrivacyPage } from '@/ui/pages/PrivacyPage'

export function App() {
  const ready = useAppStore((s) => s.ready)
  useEffect(() => {
    void useAppStore.getState().init()
    const save = () => void flushSave()
    window.addEventListener('pagehide', save)
    return () => window.removeEventListener('pagehide', save)
  }, [])

  if (!ready) return <Spinner label="Opening WonderWorld…" />
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="/worlds" element={<WorldsPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/parent" element={<ParentPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

function NotFound() {
  return (
    <main className="grid min-h-full place-items-center p-6 text-center">
      <div>
        <p className="text-5xl" aria-hidden>
          🧭
        </p>
        <h1 className="mt-2 text-2xl font-semibold">This page wandered off</h1>
        <Link to="/" className="mt-3 inline-block text-grape underline">
          Go home
        </Link>
      </div>
    </main>
  )
}
