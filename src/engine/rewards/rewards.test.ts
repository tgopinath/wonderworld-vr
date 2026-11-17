import { describe, expect, it } from 'vitest'
import { applyRound, emptyRewards, starsForRound } from './rewards'
import type { ActivityProgress } from '@/engine/core/types'

const prog = (rounds: number, level = 1): ActivityProgress => ({
  activityId: 'counting',
  level,
  streakCorrect: 0,
  streakIncorrect: 0,
  rounds,
  correctRounds: rounds,
  mistakes: 0,
  bestStars: 0,
})

describe('rewards', () => {
  it('stars reward effort: finishing always earns at least one', () => {
    expect(starsForRound(0)).toBe(3)
    expect(starsForRound(1)).toBe(2)
    expect(starsForRound(9)).toBe(1)
  })

  it('awards first-steps once, and keep-trying for perseverance', () => {
    const now = new Date(2026, 10, 17, 10)
    const r1 = applyRound(emptyRewards(), { activityId: 'counting', mistakes: 3, progress: { counting: prog(1) }, now })
    expect(r1.newBadges).toEqual(expect.arrayContaining(['first-steps', 'keep-trying']))
    expect(r1.state.stars).toBe(1)
    const r2 = applyRound(r1.state, { activityId: 'counting', mistakes: 0, progress: { counting: prog(2) }, now })
    expect(r2.newBadges).not.toContain('first-steps')
    expect(r2.state.stars).toBe(4)
  })

  it('tracks daily goal and day streaks', () => {
    let s = emptyRewards()
    const day = (d: number) => new Date(2026, 10, d, 9)
    let goal = false
    for (let i = 1; i <= 5; i++) {
      const r = applyRound(s, { activityId: 'counting', mistakes: 0, progress: { counting: prog(i) }, now: day(17) })
      s = r.state
      goal = goal || r.dailyGoalReached
    }
    expect(goal).toBe(true)
    expect(s.daily.rounds).toBe(5)
    s = applyRound(s, { activityId: 'counting', mistakes: 0, progress: { counting: prog(6) }, now: day(18) }).state
    const third = applyRound(s, { activityId: 'counting', mistakes: 0, progress: { counting: prog(7) }, now: day(19) })
    expect(third.state.streak.current).toBe(3)
    expect(third.newBadges).toContain('three-day-streak')
    const gap = applyRound(third.state, { activityId: 'counting', mistakes: 0, progress: { counting: prog(8) }, now: day(22) })
    expect(gap.state.streak.current).toBe(1)
    expect(gap.state.streak.best).toBe(3)
  })

  it('gives the maths medal when all four activities reach level 3', () => {
    const p = { ...prog(5, 3) }
    const r = applyRound(emptyRewards(), {
      activityId: 'addition',
      mistakes: 0,
      progress: { counting: p, numberRecognition: p, addition: p, subtraction: p },
      now: new Date(),
    })
    expect(r.medalEarned).toBe(true)
    expect(r.state.medals).toEqual(['math'])
  })
})
