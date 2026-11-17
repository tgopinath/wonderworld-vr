import type { ActivityProgress, ActivityType, BadgeId, RewardState } from '@/engine/core/types'
import { DAILY_GOAL_ROUNDS } from '@/config/activities'

export const BADGES: Record<BadgeId, { title: string; icon: string; description: string }> = {
  'first-steps': { title: 'First Steps', icon: '👣', description: 'Finished your very first activity' },
  'counting-star': { title: 'Counting Star', icon: '⭐', description: 'Finished 5 counting rounds' },
  'number-detective': { title: 'Number Detective', icon: '🔍', description: 'Found 5 numbers' },
  'addition-ace': { title: 'Addition Ace', icon: '➕', description: 'Finished 5 adding rounds' },
  'take-away-hero': { title: 'Take-Away Hero', icon: '🦸', description: 'Finished 5 taking-away rounds' },
  'ten-rounds': { title: 'Ten in a Row', icon: '🔟', description: 'Finished 10 rounds' },
  'fifty-rounds': { title: 'Super Learner', icon: '🏅', description: 'Finished 50 rounds' },
  'keep-trying': { title: 'Never Give Up', icon: '💪', description: 'Kept trying and solved a tricky one' },
  'three-day-streak': { title: 'Three-Day Streak', icon: '🔥', description: 'Learned on 3 days in a row' },
  'level-up': { title: 'Level Up', icon: '🚀', description: 'Reached level 3 in an activity' },
}

const ACTIVITY_BADGE: Record<ActivityType, BadgeId> = {
  counting: 'counting-star',
  numberRecognition: 'number-detective',
  addition: 'addition-ace',
  subtraction: 'take-away-hero',
}

export function emptyRewards(): RewardState {
  return {
    stars: 0,
    coins: 0,
    badges: [],
    dailyGoal: DAILY_GOAL_ROUNDS,
    daily: { date: '', rounds: 0 },
    streak: { current: 0, best: 0, lastDate: null },
    medals: [],
  }
}

/** Effort-based: finishing always earns at least one star; speed never matters. */
export function starsForRound(mistakes: number): 1 | 2 | 3 {
  if (mistakes === 0) return 3
  if (mistakes === 1) return 2
  return 1
}

export function localDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function dayDiff(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number) as [number, number, number]
  const [yb, mb, db] = b.split('-').map(Number) as [number, number, number]
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000)
}

export interface RoundOutcome {
  activityId: ActivityType
  mistakes: number
  /** Progress for every activity AFTER this round was recorded. */
  progress: Partial<Record<ActivityType, ActivityProgress>>
  now: Date
}

export interface RewardResult {
  state: RewardState
  stars: number
  coins: number
  newBadges: BadgeId[]
  dailyGoalReached: boolean
  medalEarned: boolean
}

export function applyRound(prev: RewardState, outcome: RoundOutcome): RewardResult {
  const today = localDate(outcome.now)
  const stars = starsForRound(outcome.mistakes)

  const dailyRounds = prev.daily.date === today ? prev.daily.rounds + 1 : 1
  const dailyGoalReached = dailyRounds === prev.dailyGoal
  const coins = stars + (dailyGoalReached ? 5 : 0)

  let streak = prev.streak
  if (streak.lastDate !== today) {
    const continues = streak.lastDate !== null && dayDiff(streak.lastDate, today) === 1
    const current = continues ? streak.current + 1 : 1
    streak = { current, best: Math.max(streak.best, current), lastDate: today }
  }

  const all = Object.values(outcome.progress)
  const totalRounds = all.reduce((n, p) => n + (p?.rounds ?? 0), 0)
  const has = new Set(prev.badges.map((b) => b.id))
  const newBadges: BadgeId[] = []
  const award = (id: BadgeId, when: boolean) => {
    if (when && !has.has(id)) {
      has.add(id)
      newBadges.push(id)
    }
  }
  award('first-steps', totalRounds >= 1)
  award(ACTIVITY_BADGE[outcome.activityId], (outcome.progress[outcome.activityId]?.rounds ?? 0) >= 5)
  award('ten-rounds', totalRounds >= 10)
  award('fifty-rounds', totalRounds >= 50)
  award('keep-trying', outcome.mistakes >= 2)
  award('three-day-streak', streak.current >= 3)
  award('level-up', all.some((p) => (p?.level ?? 0) >= 3))

  const mathTypes: ActivityType[] = ['counting', 'numberRecognition', 'addition', 'subtraction']
  const mathMastered = mathTypes.every((t) => (outcome.progress[t]?.level ?? 0) >= 3)
  const medalEarned = mathMastered && !prev.medals.includes('math')

  const iso = outcome.now.toISOString()
  return {
    state: {
      ...prev,
      stars: prev.stars + stars,
      coins: prev.coins + coins,
      badges: [...prev.badges, ...newBadges.map((id) => ({ id, earnedAt: iso }))],
      daily: { date: today, rounds: dailyRounds },
      streak,
      medals: medalEarned ? [...prev.medals, 'math'] : prev.medals,
    },
    stars,
    coins,
    newBadges,
    dailyGoalReached,
    medalEarned,
  }
}
