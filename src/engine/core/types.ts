// Shared domain types. Pure data — no React, no three.

export type AgeGroup = 'little' | 'adventurer' | 'master'

export const AGE_GROUPS: Record<AgeGroup, { label: string; ages: string; startLevel: number }> = {
  little: { label: 'Little Explorer', ages: '5–7', startLevel: 1 },
  adventurer: { label: 'Adventurer', ages: '8–10', startLevel: 2 },
  master: { label: 'Master', ages: '11–12', startLevel: 3 },
}

export type AvatarId = 'fox' | 'panda' | 'owl' | 'tiger' | 'bunny' | 'robot'

export interface ChildProfile {
  id: string
  nickname: string
  ageGroup: AgeGroup
  avatarId: AvatarId
  preferences: { favouriteWorld?: WorldId; narration: boolean }
  createdAt: string
}

export type WorldId = 'math' | 'geography' | 'space' | 'science' | 'money' | 'puzzle'

export type ActivityType = 'counting' | 'numberRecognition' | 'addition' | 'subtraction'

export interface ActivityProgress {
  activityId: ActivityType
  level: number
  streakCorrect: number
  streakIncorrect: number
  rounds: number
  correctRounds: number
  mistakes: number
  bestStars: number
}

export interface ActivityAttempt {
  id: string
  profileId: string
  worldId: WorldId
  activityId: ActivityType
  level: number
  mistakes: number
  hintsUsed: number
  stars: number
  durationMs: number
  completedAt: string
}

export type BadgeId =
  | 'first-steps'
  | 'counting-star'
  | 'number-detective'
  | 'addition-ace'
  | 'take-away-hero'
  | 'ten-rounds'
  | 'fifty-rounds'
  | 'keep-trying'
  | 'three-day-streak'
  | 'level-up'

export interface EarnedBadge {
  id: BadgeId
  earnedAt: string
}

export interface RewardState {
  stars: number
  coins: number
  badges: EarnedBadge[]
  dailyGoal: number
  daily: { date: string; rounds: number }
  streak: { current: number; best: number; lastDate: string | null }
  medals: WorldId[]
}

export interface ComfortSettings {
  turn: 'snap' | 'smooth'
  snapDegrees: 30 | 45
  teleport: boolean
  vignette: boolean
  mode: 'seated' | 'standing'
}

export interface Settings {
  masterVolume: number
  music: boolean
  sfx: boolean
  narration: boolean
  captions: boolean
  comfort: ComfortSettings
}

export interface ParentSettings {
  pinHash: string | null
  salt: string | null
  sessionLimitMin: number | null
  breakReminderMin: number | null
  /** Parent-fixed level per activity; undefined = adaptive. */
  levelLocks: Partial<Record<ActivityType, number>>
}
