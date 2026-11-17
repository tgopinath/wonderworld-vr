// Transient play-session state: which scene, which activity, the live round.
// Bridges the 3D layer (reports placements) and the learning engine (judges them).
import { create } from 'zustand'
import type { ActivityType, BadgeId } from '@/engine/core/types'
import { createRng } from '@/engine/core/rng'
import { createRound, evaluate, initialState, placeItem, zoneAccepts, type Round, type RoundState, type ZoneId } from '@/engine/learning/round'
import { useAppStore, blankProgress } from './appStore'
import { playSfx, say } from '@/audio/audio'
import { ACTIVITIES } from '@/config/activities'
import type { LevelChange } from '@/engine/difficulty/difficulty'

export type SceneId = 'classroom' | 'math'

export interface Celebration {
  id: number
  stars: number
  coins: number
  newBadges: BadgeId[]
  levelChange: LevelChange
  dailyGoalReached: boolean
  medalEarned: boolean
}

export interface Caption {
  id: number
  text: string
  tone: 'info' | 'hint' | 'praise'
}

interface SessionState {
  scene: SceneId
  activity: ActivityType | null
  round: Round | null
  roundState: RoundState | null
  roundStartedAt: number
  caption: Caption | null
  celebration: Celebration | null
  /** Bumped to send every object back to its home spot. */
  resetToken: number
  inXR: boolean
  /** A world is still loading inside the canvas. */
  loading: boolean

  goTo(scene: SceneId): void
  startActivity(type: ActivityType): void
  leaveActivity(): void
  /** Report a drop from the 3D layer. Returns whether the zone accepted the item. */
  place(itemId: string, zone: ZoneId | null): { accepted: boolean }
  check(): void
  nextRound(): void
  resetItems(): void
  speak(text: string, tone?: Caption['tone']): void
  setInXR(v: boolean): void
}

let seed = (Date.now() ^ 0x5bd1e995) >>> 0
const nextRng = () => createRng((seed = (seed * 1664525 + 1013904223) >>> 0))
let captionId = 0
let celebrationId = 0

function currentLevel(type: ActivityType): number {
  const s = useAppStore.getState()
  const pid = s.activeProfileId
  const lock = s.parent.levelLocks[type]
  if (lock !== undefined) return lock
  return (pid && s.progress[pid]?.[type]?.level) || blankProgress(type, 1).level
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  scene: 'classroom',
  activity: null,
  round: null,
  roundState: null,
  roundStartedAt: 0,
  caption: null,
  celebration: null,
  resetToken: 0,
  inXR: false,
  loading: true,

  goTo(scene) {
    playSfx('whoosh')
    set({ scene, activity: null, round: null, roundState: null, celebration: null })
    if (scene === 'math') get().speak('Welcome to Mathematics World! Pick an activity on the big board.')
    else get().speak('Back in the classroom. Walk to a glowing portal to visit a world.')
  },

  startActivity(type) {
    const round = createRound(type, currentLevel(type), nextRng())
    set({ activity: type, round, roundState: initialState(round), roundStartedAt: Date.now(), celebration: null, resetToken: get().resetToken + 1 })
    get().speak(round.say)
  },

  leaveActivity() {
    set({ activity: null, round: null, roundState: null, celebration: null })
    get().speak('Pick another activity whenever you are ready.')
  },

  place(itemId, zone) {
    const { round, roundState } = get()
    if (!round || !roundState) return { accepted: false }
    const item = round.items.find((i) => i.id === itemId)
    if (!item) return { accepted: false }
    const accepted = zone !== null && zoneAccepts(round, roundState, item, zone)
    let next = placeItem(round, roundState, itemId, zone)
    const phaseChanged = next.phase !== roundState.phase

    if (accepted && zone === 'answer' && item.kind === 'number') {
      const { state, result } = evaluate(round, next, item.value)
      next = state
      set({ roundState: next })
      if (result.correct) finishRound(result.message)
      else {
        playSfx('tryAgain')
        get().speak(result.message, 'hint')
      }
      return { accepted: result.correct }
    }

    set({ roundState: next })
    if (phaseChanged && next.phase === 'answer') {
      playSfx('success')
      const msg =
        round.type === 'addition'
          ? `All together now! How many are in the big basket? Put that number in the golden slot.`
          : `Great! Now how many are left? Put that number in the golden slot.`
      get().speak(msg)
    } else if (accepted) {
      playSfx('drop')
    }
    if (round.type === 'subtraction' && zone === 'away' && accepted) {
      const away = Object.entries(next.placements).filter(([id, z]) => z === 'away' && !id.startsWith('num')).length
      if (away > round.take) get().speak(`Oops, that is ${away}. We only need to take away ${round.take}. Bring one back.`, 'hint')
    }
    return { accepted }
  },

  check() {
    const { round, roundState } = get()
    if (!round || !roundState || round.type !== 'counting' || roundState.phase === 'done') return
    const { state, result } = evaluate(round, roundState)
    set({ roundState: state })
    if (result.correct) finishRound(result.message)
    else {
      playSfx('tryAgain')
      get().speak(result.message, 'hint')
    }
  },

  nextRound() {
    const { activity } = get()
    if (activity) get().startActivity(activity)
  },

  resetItems() {
    const { round, roundState } = get()
    if (!round || !roundState) return
    const fresh = initialState(round)
    set({ roundState: { ...fresh, mistakes: roundState.mistakes, hintsUsed: roundState.hintsUsed }, resetToken: get().resetToken + 1 })
  },

  speak(text, tone = 'info') {
    set({ caption: { id: ++captionId, text, tone } })
    say(text)
  },

  setInXR(v) {
    set({ inXR: v })
  },
}))

function finishRound(praise: string) {
  const s = useSessionStore.getState()
  const { round, roundState, roundStartedAt } = s
  if (!round || !roundState) return
  const app = useAppStore.getState()
  if (!app.activeProfileId) return
  const { reward, change } = app.completeRound({
    activityId: round.type,
    level: round.level,
    mistakes: roundState.mistakes,
    hintsUsed: roundState.hintsUsed,
    durationMs: Date.now() - roundStartedAt,
  })
  playSfx(change === 'up' ? 'levelUp' : 'success')
  useSessionStore.setState({
    celebration: {
      id: ++celebrationId,
      stars: reward.stars,
      coins: reward.coins,
      newBadges: reward.newBadges,
      levelChange: change,
      dailyGoalReached: reward.dailyGoalReached,
      medalEarned: reward.medalEarned,
    },
  })
  let line = praise
  if (change === 'up') line += ` You are ready for ${ACTIVITIES[round.type].title} level ${round.level + 1}!`
  s.speak(line, 'praise')
}
