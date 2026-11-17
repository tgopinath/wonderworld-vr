import { ACTIVITY_ORDER, levelCount } from '@/config/activities'
import type { ActivityProgress, ActivityType } from '@/engine/core/types'

/** World progress = levels climbed + activities tried, as a share of everything available. */
export function mathProgressPct(progress: Partial<Record<ActivityType, ActivityProgress>> | undefined): number {
  const total = ACTIVITY_ORDER.reduce((n, t) => n + levelCount(t), 0)
  const done = ACTIVITY_ORDER.reduce((n, t) => {
    const p = progress?.[t]
    if (!p || p.rounds === 0) return n
    return n + p.level
  }, 0)
  return Math.min(100, Math.round((done / total) * 100))
}

/** Share of answers that were right first time (each retry counts as one wrong answer). */
export function accuracy(p: Pick<ActivityProgress, 'rounds' | 'mistakes'> | undefined): number | null {
  if (!p || p.rounds === 0) return null
  return Math.round((p.rounds / (p.rounds + p.mistakes)) * 100)
}
