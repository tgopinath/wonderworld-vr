import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './index.css'
import { ErrorBoundary } from './ui/ui'
import { LandingPage } from './ui/LandingPage'
import { LabPage } from './ui/LabPage'
import { AboutPage } from './ui/AboutPage'

function NotFound() {
  return (
    <div className="grid h-full place-items-center text-center">
      <div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <Link to="/" className="mt-2 inline-block text-accent hover:underline">
          Go home
        </Link>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/lab" element={<LabPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
