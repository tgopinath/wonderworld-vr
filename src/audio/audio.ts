// Audio system: narration (Web Speech), synthesized sound effects with optional
// spatial panning, and a soft optional music bed. No audio files to download.
// Audio is never required: every narrated line is also shown as a caption.
import { useAppStore } from '@/state/appStore'

type Sfx = 'pop' | 'drop' | 'success' | 'tryAgain' | 'levelUp' | 'click' | 'whoosh'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicNodes: { stop(): void } | null = null

function settings() {
  return useAppStore.getState().settings
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.connect(ctx.destination)
  }
  if (master) master.gain.value = settings().masterVolume
  return ctx
}

/** Must be called from a user gesture once (browsers block autoplay). */
export function unlockAudio() {
  const c = audio()
  if (c && c.state === 'suspended') void c.resume()
  syncMusic()
}

/** Listener pose for spatial sfx — updated every frame by the 3D layer. */
export function setListener(pos: [number, number, number], forward: [number, number, number], up: [number, number, number]) {
  const c = ctx
  if (!c) return
  const l = c.listener
  if (l.positionX) {
    l.positionX.value = pos[0]
    l.positionY.value = pos[1]
    l.positionZ.value = pos[2]
    l.forwardX.value = forward[0]
    l.forwardY.value = forward[1]
    l.forwardZ.value = forward[2]
    l.upX.value = up[0]
    l.upY.value = up[1]
    l.upZ.value = up[2]
  }
}

const NOTES: Record<Sfx, { f: number[]; dur: number; type: OscillatorType; gain: number }> = {
  pop: { f: [660, 880], dur: 0.09, type: 'sine', gain: 0.25 },
  drop: { f: [520, 390], dur: 0.12, type: 'triangle', gain: 0.25 },
  click: { f: [900], dur: 0.05, type: 'sine', gain: 0.15 },
  success: { f: [523, 659, 784, 1046], dur: 0.14, type: 'triangle', gain: 0.25 },
  levelUp: { f: [392, 523, 659, 784, 1046], dur: 0.12, type: 'sine', gain: 0.25 },
  tryAgain: { f: [440, 392], dur: 0.16, type: 'sine', gain: 0.18 }, // soft, never a buzzer
  whoosh: { f: [300, 600], dur: 0.25, type: 'sine', gain: 0.1 },
}

export function playSfx(name: Sfx, at?: [number, number, number]) {
  if (!settings().sfx) return
  const c = audio()
  if (!c || !master) return
  const spec = NOTES[name]
  let out: AudioNode = master
  if (at) {
    const p = c.createPanner()
    p.panningModel = 'HRTF'
    p.distanceModel = 'inverse'
    p.refDistance = 0.6
    p.positionX.value = at[0]
    p.positionY.value = at[1]
    p.positionZ.value = at[2]
    p.connect(master)
    out = p
  }
  const t0 = c.currentTime
  spec.f.forEach((freq, i) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = spec.type
    o.frequency.value = freq
    const start = t0 + i * spec.dur * 0.8
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(spec.gain, start + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, start + spec.dur)
    o.connect(g).connect(out)
    o.start(start)
    o.stop(start + spec.dur + 0.02)
  })
}

/** Speak a line if narration is on. Returns immediately; captions are handled by the caller. */
export function say(text: string) {
  const s = settings()
  if (!s.narration || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text.replace(/−/g, 'minus').replace(/×/g, 'times'))
    u.rate = 0.95
    u.pitch = 1.15
    u.volume = Math.min(1, s.masterVolume)
    const voices = window.speechSynthesis.getVoices()
    const en = voices.find((v) => /en-(IN|GB|US)/.test(v.lang) && /female|samantha|google/i.test(v.name)) ?? voices.find((v) => v.lang.startsWith('en'))
    if (en) u.voice = en
    window.speechSynthesis.speak(u)
  } catch {
    /* speech is optional */
  }
}

export function stopSpeech() {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    /* ignore */
  }
}

/** Gentle pentatonic pad. Off by default; parents/children can switch it on. */
export function syncMusic() {
  const on = settings().music
  if (!on) {
    musicNodes?.stop()
    musicNodes = null
    return
  }
  if (musicNodes) return
  const c = audio()
  if (!c || !master) return
  const bus = c.createGain()
  bus.gain.value = 0.05
  bus.connect(master)
  const scale = [261.6, 293.7, 329.6, 392, 440, 523.3]
  let stopped = false
  let timer: ReturnType<typeof setTimeout>
  const step = () => {
    if (stopped) return
    const t = c.currentTime
    const f = scale[Math.floor(Math.random() * scale.length)] ?? 261.6
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'sine'
    o.frequency.value = f
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(1, t + 0.8)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2)
    o.connect(g).connect(bus)
    o.start(t)
    o.stop(t + 3.3)
    timer = setTimeout(step, 1400)
  }
  step()
  musicNodes = {
    stop() {
      stopped = true
      clearTimeout(timer)
      bus.disconnect()
    },
  }
}

useAppStore.subscribe((s, prev) => {
  if (s.settings === prev.settings) return
  if (master) master.gain.value = s.settings.masterVolume
  if (s.settings.music !== prev.settings.music) syncMusic()
  if (!s.settings.narration) stopSpeech()
})
