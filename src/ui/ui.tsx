import { Component, type ButtonHTMLAttributes, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Button({ variant = 'ghost', size = 'md', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'outline' | 'danger'; size?: 'sm' | 'md' }) {
  const v = {
    primary: 'bg-accent text-[#04201c] hover:bg-[#5eead4]',
    ghost: 'text-ink hover:bg-white/5',
    outline: 'border border-line text-ink hover:bg-white/5',
    danger: 'border border-[#5a2a2a] text-[#fca5a5] hover:bg-[#2a1414]',
  }[variant]
  const s = size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-3.5 text-sm'
  return <button {...rest} className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 ${v} ${s} ${className}`} />
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 text-ink" aria-label="Anatomy Lab home">
      <img src="/icon.svg" alt="" width={26} height={26} />
      <span className={`whitespace-nowrap text-[15px] font-semibold tracking-tight ${compact ? 'max-sm:hidden' : ''}`}>Anatomy Lab</span>
    </Link>
  )
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-mute" role="status" aria-live="polite">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
      {label}
    </div>
  )
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Anatomy Lab error', error, info.componentStack)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="max-w-md rounded-lg border border-line bg-panel p-6">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="mt-1 text-sm text-mute">Your study progress is saved on this device.</p>
          <p className="mt-2 break-words font-mono text-xs text-faint">{this.state.error.message}</p>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={() => location.reload()}>
              Reload
            </Button>
            <Button variant="outline" onClick={() => (location.href = '/')}>
              Home
            </Button>
          </div>
        </div>
      </div>
    )
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

export const fmtInt = (n: number) => n.toLocaleString('en-US')
