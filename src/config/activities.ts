// Activity content as DATA. Scene components never hardcode ranges or rules.
import type { ActivityType, WorldId } from '@/engine/core/types'

export type ItemKind = 'apple' | 'star' | 'ball' | 'duck' | 'cube'

export interface CountingLevel {
  target: [number, number]
  decoys: [number, number]
  kinds: ItemKind[]
}
export interface NumberRecognitionLevel {
  range: [number, number]
  choices: number
}
export interface AdditionLevel {
  a: [number, number]
  b: [number, number]
  maxSum: number
  choices: number
  kinds: ItemKind[]
}
export interface SubtractionLevel {
  total: [number, number]
  take: [number, number]
  choices: number
  kinds: ItemKind[]
}

export interface LevelByType {
  counting: CountingLevel
  numberRecognition: NumberRecognitionLevel
  addition: AdditionLevel
  subtraction: SubtractionLevel
}

export interface ActivityDefinition<T extends ActivityType = ActivityType> {
  id: T
  worldId: WorldId
  title: string
  icon: string
  blurb: string
  levels: LevelByType[T][]
  hints: { enabled: boolean; maxLevel: 1 | 2 }
  /** Optional per-round time limit in seconds; null = untimed (default for every MVP activity). */
  timeLimitSec: number | null
}

export interface DifficultyRules {
  upAfterCleanRounds: number
  downAfterMistakesInRound: number
}

export const DIFFICULTY_RULES: DifficultyRules = {
  upAfterCleanRounds: 3,
  downAfterMistakesInRound: 2,
}

const fruit: ItemKind[] = ['apple', 'star', 'ball', 'duck']

export const ACTIVITIES: { [K in ActivityType]: ActivityDefinition<K> } = {
  counting: {
    id: 'counting',
    worldId: 'math',
    title: 'Counting',
    icon: '🍎',
    blurb: 'Move the right number of things into the basket.',
    levels: [
      { target: [1, 4], decoys: [1, 2], kinds: ['apple', 'star', 'ball'] },
      { target: [3, 6], decoys: [2, 3], kinds: fruit },
      { target: [5, 9], decoys: [2, 4], kinds: fruit },
      { target: [8, 12], decoys: [3, 4], kinds: fruit },
      { target: [10, 15], decoys: [3, 5], kinds: [...fruit, 'cube'] },
    ],
    hints: { enabled: true, maxLevel: 2 },
    timeLimitSec: null,
  },
  numberRecognition: {
    id: 'numberRecognition',
    worldId: 'math',
    title: 'Find the Number',
    icon: '🔢',
    blurb: 'Spot the number and put it in the golden slot.',
    levels: [
      { range: [0, 5], choices: 3 },
      { range: [0, 10], choices: 4 },
      { range: [0, 15], choices: 5 },
      { range: [0, 20], choices: 6 },
      { range: [5, 20], choices: 8 },
    ],
    hints: { enabled: true, maxLevel: 2 },
    timeLimitSec: null,
  },
  addition: {
    id: 'addition',
    worldId: 'math',
    title: 'Adding Up',
    icon: '➕',
    blurb: 'Put both baskets together, then find the total.',
    levels: [
      { a: [1, 3], b: [1, 2], maxSum: 5, choices: 3, kinds: ['apple'] },
      { a: [1, 4], b: [1, 3], maxSum: 7, choices: 3, kinds: ['apple', 'ball'] },
      { a: [2, 6], b: [1, 4], maxSum: 10, choices: 4, kinds: fruit },
      { a: [3, 8], b: [2, 6], maxSum: 14, choices: 4, kinds: fruit },
      { a: [5, 10], b: [3, 8], maxSum: 18, choices: 5, kinds: fruit },
    ],
    hints: { enabled: true, maxLevel: 2 },
    timeLimitSec: null,
  },
  subtraction: {
    id: 'subtraction',
    worldId: 'math',
    title: 'Taking Away',
    icon: '➖',
    blurb: 'Move some away, then count what is left.',
    levels: [
      { total: [3, 5], take: [1, 2], choices: 3, kinds: ['apple'] },
      { total: [4, 7], take: [1, 3], choices: 3, kinds: ['apple', 'star'] },
      { total: [6, 10], take: [2, 5], choices: 4, kinds: fruit },
      { total: [8, 14], take: [3, 7], choices: 4, kinds: fruit },
      { total: [10, 18], take: [4, 9], choices: 5, kinds: fruit },
    ],
    hints: { enabled: true, maxLevel: 2 },
    timeLimitSec: null,
  },
}

export const ACTIVITY_ORDER: ActivityType[] = ['counting', 'numberRecognition', 'addition', 'subtraction']

export function levelCount(type: ActivityType): number {
  return ACTIVITIES[type].levels.length
}

export function getLevel<T extends ActivityType>(type: T, level: number): LevelByType[T] {
  const levels = ACTIVITIES[type].levels as LevelByType[T][]
  const clamped = Math.min(Math.max(level, 1), levels.length)
  const cfg = levels[clamped - 1]
  if (!cfg) throw new Error(`No level ${level} for ${type}`)
  return cfg
}

export const DAILY_GOAL_ROUNDS = 5
