// Shared 2D UI building blocks (Tailwind). Large targets, rounded, high contrast.
import { Component, useEffect, useState, type ButtonHTMLAttributes, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { AvatarId } from '@/engine/core/types'
import { detectXRSupport, type XRSupport } from '@/three/xrSupport'
import { useAppStore } from '@/state/appStore'
import { unlockAudio } from '@/audio/audio'

type Tone = 'grape' | 'tangerine' | 'mint' | 'berry' | 'sky' | 'ghost' | 'white'

const TONES: Record<Tone, string> = {
  grape: 'bg-grape text-white shadow-[0_6px_0_#4b3fb5] hover:brightness-110',
  tangerine: 'bg-tangerine text-white shadow-[0_6px_0_#c9622a] hover:brightness-105',
  mint: 'bg-mint text-white shadow-[0_6px_0_#049e76] hover:brightness-105',
  berry: 'bg-berry text-white shadow-[0_6px_0_#b8304f] hover:brightness-105',
  sky: 'bg-sky text-white shadow-[0_6px_0_#0b5f7c] hover:brightness-110',
  white: 'bg-white text-ink shadow-[0_6px_0_#d5d9e8] hover:bg-cloud',
  ghost: 'bg-transparent text-ink hover:bg-white/60',
}

export function Btn({ tone = 'grape', size = 'md', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'px-8 py-4 text-xl' : size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-5 py-2.5 text-base'
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 ${TONES[tone]} ${sz} ${className}`}
    />
  )
}

export const AVATARS: Record<AvatarId, { emoji: string; label: string; bg: string }> = {
  fox: { emoji: '🦊', label: 'Fox', bg: '#ffd6a5' },
  panda: { emoji: '🐼', label: 'Panda', bg: '#e9ecef' },
  owl: { emoji: '🦉', label: 'Owl', bg: '#d8c3a5' },
  tiger: { emoji: '🐯', label: 'Tiger', bg: '#ffe066' },
  bunny: { emoji: '🐰', label: 'Bunny', bg: '#ffc6ff' },
  robot: { emoji: '🤖', label: 'Robot', bg: '#bde0fe' },
}

export function Avatar({ id, size = 48 }: { id: AvatarId; size?: number }) {
  const a = AVATARS[id]
  return (
    <span role="img" aria-label={a.label} className="inline-grid place-items-center rounded-full" style={{ width: size, height: size, background: a.bg, fontSize: size * 0.55 }}>
      {a.emoji}
    </span>
  )
}

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2 no-underline" aria-label="WonderWorld VR home">
      <img src="/icon.svg" alt="" width={small ? 32 : 56} height={small ? 32 : 56} />
      <span className={`font-semibold tracking-tight ${small ? 'text-xl' : 'text-4xl sm:text-5xl'}`}>
        <span className="text-tangerine">Wonder</span>
        <span className="text-grape">World</span> <span className="rounded-lg bg-ink px-1.5 text-[0.6em] align-middle text-white">VR</span>
      </span>
    </Link>
  )
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-blob bg-white/90 p-5 shadow-[0_10px_30px_-12px_rgba(31,42,68,0.25)] ring-1 ring-black/5 ${className}`}>{children}</div>
}

export function DeviceIndicator() {
  const [s, setS] = useState<XRSupport>('checking')
  useEffect(() => {
    let live = true
    void detectXRSupport().then((v) => live && setS(v))
    return () => {
      live = false
    }
  }, [])
  const touch = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches
  const text =
    s === 'checking' ? 'Checking your device…' : s === 'immersive-vr' ? 'VR headset ready' : s === 'emulated' ? 'VR emulator (dev mode)' : touch ? 'Touch mode — tap and drag' : 'Desktop mode — mouse & keyboard'
  const dot = s === 'immersive-vr' ? 'bg-mint' : s === 'emulated' ? 'bg-sun' : 'bg-sky'
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm text-muted ring-1 ring-black/5" role="status">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden /> {text}
    </span>
  )
}

export function SoundToggle({ compact = false }: { compact?: boolean }) {
  const settings = useAppStore((s) => s.settings)
  const update = useAppStore((s) => s.updateSettings)
  const on = settings.sfx || settings.narration || settings.music
  return (
    <Btn
      tone="white"
      size="sm"
      aria-pressed={on}
      aria-label={on ? 'Mute sound' : 'Turn sound on'}
      onClick={() => {
        unlockAudio()
        if (on) update({ sfx: false, narration: false, music: false })
        else update({ sfx: true, narration: true })
      }}
    >
      <span aria-hidden>{on ? '🔊' : '🔇'}</span>
      {!compact && (on ? 'Sound on' : 'Sound off')}
    </Btn>
  )
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid h-full min-h-64 place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-grape/20 border-t-grape" />
        <p className="text-muted">{label}</p>
      </div>
    </div>
  )
}

export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('WonderWorld error', error, info.componentStack)
  }
  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="grid min-h-full place-items-center p-6">
            <Card className="max-w-md text-center">
              <p className="text-5xl" aria-hidden>
                🛠️
              </p>
              <h1 className="mt-2 text-2xl font-semibold">Oops, something wobbled</h1>
              <p className="mt-2 text-muted">Your progress is saved. Let’s try again.</p>
              <p className="mt-2 break-words text-xs text-muted/70">{this.state.error.message}</p>
              <div className="mt-4 flex justify-center gap-3">
                <Btn onClick={() => location.reload()}>Reload</Btn>
                <Btn tone="white" onClick={() => (location.href = '/')}>
                  Home
                </Btn>
              </div>
            </Card>
          </div>
        )
      )
    }
    return this.props.children
  }
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60000)
  if (min < 1) return ms > 0 ? '<1 min' : '0 min'
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)} h ${min % 60} min`
}
