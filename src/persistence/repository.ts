import type {
  ActivityAttempt,
  ActivityProgress,
  ActivityType,
  ChildProfile,
  ParentSettings,
  RewardState,
  Settings,
} from '@/engine/core/types'

export const DATA_VERSION = 1

export interface AppData {
  version: typeof DATA_VERSION
  profiles: ChildProfile[]
  activeProfileId: string | null
  progress: Record<string, Partial<Record<ActivityType, ActivityProgress>>>
  attempts: ActivityAttempt[]
  rewards: Record<string, RewardState>
  /** Total active play time per profile, in ms. */
  learningTimeMs: Record<string, number>
  settings: Settings
  parent: ParentSettings
}

/**
 * Storage boundary. LocalRepository powers demo mode (no backend);
 * an ApiRepository (Phase 5) will implement the same contract against the Node API.
 */
export interface Repository {
  readonly kind: 'local' | 'api'
  load(): Promise<AppData>
  save(data: AppData): Promise<void>
  /** Permanently delete everything this repository holds (parent "delete all data"). */
  clear(): Promise<void>
}

export function defaultSettings(): Settings {
  return {
    masterVolume: 0.8,
    music: false,
    sfx: true,
    narration: true,
    captions: true,
    comfort: { turn: 'snap', snapDegrees: 30, teleport: true, vignette: true, mode: 'standing' },
  }
}

export function defaultParent(): ParentSettings {
  return { pinHash: null, salt: null, sessionLimitMin: null, breakReminderMin: 20, levelLocks: {} }
}

export function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    profiles: [],
    activeProfileId: null,
    progress: {},
    attempts: [],
    rewards: {},
    learningTimeMs: {},
    settings: defaultSettings(),
    parent: defaultParent(),
  }
}

/** Keep only the newest attempts so local storage stays small. */
export const MAX_ATTEMPTS = 2000
