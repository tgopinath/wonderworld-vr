import type { DifficultyRules } from '@/config/activities'

export interface DifficultyState {
  level: number
  /** Consecutive rounds finished with zero mistakes. */
  streakCorrect: number
  /** Consecutive rounds that needed at least one retry. */
  streakIncorrect: number
}

export interface DifficultyBounds {
  min: number
  max: number
  /** Parent-fixed level. When set, adaptation is switched off. */
  locked?: number
}

export type LevelChange = 'up' | 'down' | null

/**
 * Apply the adaptive rules after a finished round.
 * - N clean rounds in a row → one level up.
 * - A round needing `downAfterMistakesInRound` or more retries → one level down.
 * Mistakes never remove stars or progress; they only make the next round friendlier.
 */
export function recordRound(
  state: DifficultyState,
  mistakes: number,
  rules: DifficultyRules,
  bounds: DifficultyBounds,
): { state: DifficultyState; change: LevelChange } {
  if (bounds.locked !== undefined) {
    const level = clamp(bounds.locked, bounds.min, bounds.max)
    return { state: { ...state, level, streakCorrect: mistakes === 0 ? state.streakCorrect + 1 : 0, streakIncorrect: mistakes > 0 ? state.streakIncorrect + 1 : 0 }, change: null }
  }

  if (mistakes === 0) {
    const streak = state.streakCorrect + 1
    if (streak >= rules.upAfterCleanRounds && state.level < bounds.max) {
      return { state: { level: state.level + 1, streakCorrect: 0, streakIncorrect: 0 }, change: 'up' }
    }
    return { state: { ...state, streakCorrect: streak, streakIncorrect: 0 }, change: null }
  }

  if (mistakes >= rules.downAfterMistakesInRound && state.level > bounds.min) {
    return { state: { level: state.level - 1, streakCorrect: 0, streakIncorrect: 0 }, change: 'down' }
  }
  return { state: { ...state, streakCorrect: 0, streakIncorrect: state.streakIncorrect + 1 }, change: null }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}
