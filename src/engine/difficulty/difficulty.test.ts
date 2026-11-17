import { describe, expect, it } from 'vitest'
import { recordRound, type DifficultyState } from './difficulty'
import { DIFFICULTY_RULES } from '@/config/activities'

const bounds = { min: 1, max: 5 }
const start: DifficultyState = { level: 2, streakCorrect: 0, streakIncorrect: 0 }

describe('adaptive difficulty', () => {
  it('goes up one level after three clean rounds', () => {
    let s = start
    s = recordRound(s, 0, DIFFICULTY_RULES, bounds).state
    s = recordRound(s, 0, DIFFICULTY_RULES, bounds).state
    const third = recordRound(s, 0, DIFFICULTY_RULES, bounds)
    expect(third.change).toBe('up')
    expect(third.state.level).toBe(3)
    expect(third.state.streakCorrect).toBe(0)
  })

  it('a single mistake keeps the level but breaks the streak', () => {
    let s = recordRound(start, 0, DIFFICULTY_RULES, bounds).state
    const r = recordRound(s, 1, DIFFICULTY_RULES, bounds)
    expect(r.change).toBeNull()
    expect(r.state.level).toBe(2)
    s = r.state
    expect(s.streakCorrect).toBe(0)
  })

  it('repeated mistakes in a round lower the level', () => {
    const r = recordRound(start, 2, DIFFICULTY_RULES, bounds)
    expect(r.change).toBe('down')
    expect(r.state.level).toBe(1)
  })

  it('never leaves the bounds', () => {
    expect(recordRound({ ...start, level: 1 }, 5, DIFFICULTY_RULES, bounds).state.level).toBe(1)
    const top = { level: 5, streakCorrect: 2, streakIncorrect: 0 }
    expect(recordRound(top, 0, DIFFICULTY_RULES, bounds).state.level).toBe(5)
  })

  it('respects a parent lock', () => {
    const r = recordRound({ ...start, streakCorrect: 2 }, 0, DIFFICULTY_RULES, { ...bounds, locked: 4 })
    expect(r.change).toBeNull()
    expect(r.state.level).toBe(4)
  })
})
