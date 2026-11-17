// Persistent app data: profiles, progress, rewards, settings, parent controls.
import { create } from 'zustand'
import { AGE_GROUPS, type ActivityAttempt, type ActivityProgress, type ActivityType, type AgeGroup, type AvatarId, type ChildProfile, type ParentSettings, type Settings } from '@/engine/core/types'
import { uid } from '@/engine/core/rng'
import { emptyRewards, applyRound, type RewardResult } from '@/engine/rewards/rewards'
import { recordRound, type LevelChange } from '@/engine/difficulty/difficulty'
import { DIFFICULTY_RULES, getLevel, levelCount } from '@/config/activities'
import { emptyData, type AppData, type Repository } from '@/persistence/repository'
import { LocalRepository } from '@/persistence/localRepository'

export interface AppState extends AppData {
  ready: boolean
  repo: Repository
  init(repo?: Repository): Promise<void>
  createProfile(input: { nickname: string; ageGroup: AgeGroup; avatarId: AvatarId }): ChildProfile
  updateProfile(id: string, patch: Partial<Pick<ChildProfile, 'nickname' | 'ageGroup' | 'avatarId' | 'preferences'>>): void
  deleteProfile(id: string): void
  setActiveProfile(id: string | null): void
  updateSettings(patch: Partial<Settings>): void
  updateComfort(patch: Partial<Settings['comfort']>): void
  updateParent(patch: Partial<ParentSettings>): void
  setLevel(activity: ActivityType, level: number): void
  addLearningTime(ms: number): void
  completeRound(input: { activityId: ActivityType; level: number; mistakes: number; hintsUsed: number; durationMs: number }): { reward: RewardResult; change: LevelChange; nextLevel: number }
  wipeAll(): Promise<void>
}

export function blankProgress(activityId: ActivityType, level: number): ActivityProgress {
  return { activityId, level, streakCorrect: 0, streakIncorrect: 0, rounds: 0, correctRounds: 0, mistakes: 0, bestStars: 0 }
}

const pick = (s: AppState): AppData => ({
  version: s.version,
  profiles: s.profiles,
  activeProfileId: s.activeProfileId,
  progress: s.progress,
  attempts: s.attempts,
  rewards: s.rewards,
  learningTimeMs: s.learningTimeMs,
  settings: s.settings,
  parent: s.parent,
})

export const useAppStore = create<AppState>()((set, get) => ({
  ...emptyData(),
  ready: false,
  repo: new LocalRepository(),

  async init(repo) {
    const r = repo ?? get().repo
    const data = await r.load()
    set({ ...data, repo: r, ready: true })
  },

  createProfile({ nickname, ageGroup, avatarId }) {
    const profile: ChildProfile = {
      id: uid('child'),
      nickname: nickname.trim().slice(0, 20) || 'Explorer',
      ageGroup,
      avatarId,
      preferences: { narration: true },
      createdAt: new Date().toISOString(),
    }
    const start = AGE_GROUPS[ageGroup].startLevel
    set((s) => ({
      profiles: [...s.profiles, profile],
      activeProfileId: profile.id,
      rewards: { ...s.rewards, [profile.id]: emptyRewards() },
      progress: {
        ...s.progress,
        [profile.id]: {
          counting: blankProgress('counting', start),
          numberRecognition: blankProgress('numberRecognition', start),
          addition: blankProgress('addition', start),
          subtraction: blankProgress('subtraction', start),
        },
      },
    }))
    return profile
  },

  updateProfile(id, patch) {
    set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  },

  deleteProfile(id) {
    set((s) => {
      const { [id]: _p, ...progress } = s.progress
      const { [id]: _r, ...rewards } = s.rewards
      const { [id]: _t, ...learningTimeMs } = s.learningTimeMs
      return {
        profiles: s.profiles.filter((p) => p.id !== id),
        activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
        attempts: s.attempts.filter((a) => a.profileId !== id),
        progress,
        rewards,
        learningTimeMs,
      }
    })
  },

  setActiveProfile(id) {
    set({ activeProfileId: id })
  },

  updateSettings(patch) {
    set((s) => ({ settings: { ...s.settings, ...patch } }))
  },
  updateComfort(patch) {
    set((s) => ({ settings: { ...s.settings, comfort: { ...s.settings.comfort, ...patch } } }))
  },
  updateParent(patch) {
    set((s) => ({ parent: { ...s.parent, ...patch } }))
  },

  setLevel(activity, level) {
    const pid = get().activeProfileId
    if (!pid) return
    const lvl = Math.min(Math.max(level, 1), levelCount(activity))
    set((s) => {
      const cur = s.progress[pid]?.[activity] ?? blankProgress(activity, lvl)
      return { progress: { ...s.progress, [pid]: { ...s.progress[pid], [activity]: { ...cur, level: lvl, streakCorrect: 0, streakIncorrect: 0 } } } }
    })
  },

  addLearningTime(ms) {
    const pid = get().activeProfileId
    if (!pid || ms <= 0) return
    set((s) => ({ learningTimeMs: { ...s.learningTimeMs, [pid]: (s.learningTimeMs[pid] ?? 0) + ms } }))
  },

  completeRound({ activityId, level, mistakes, hintsUsed, durationMs }) {
    const s = get()
    const pid = s.activeProfileId
    if (!pid) throw new Error('No active profile')
    const prev = s.progress[pid]?.[activityId] ?? blankProgress(activityId, level)
    getLevel(activityId, level) // validates level exists
    const lock = s.parent.levelLocks[activityId]
    const diff = recordRound(
      { level: prev.level, streakCorrect: prev.streakCorrect, streakIncorrect: prev.streakIncorrect },
      mistakes,
      DIFFICULTY_RULES,
      { min: 1, max: levelCount(activityId), ...(lock !== undefined ? { locked: lock } : {}) },
    )
    const nextProgress: ActivityProgress = {
      ...prev,
      ...diff.state,
      rounds: prev.rounds + 1,
      correctRounds: prev.correctRounds + (mistakes === 0 ? 1 : 0),
      mistakes: prev.mistakes + mistakes,
    }
    const allProgress = { ...s.progress[pid], [activityId]: nextProgress }
    const reward = applyRound(s.rewards[pid] ?? emptyRewards(), { activityId, mistakes, progress: allProgress, now: new Date() })
    nextProgress.bestStars = Math.max(prev.bestStars, reward.stars)

    const attempt: ActivityAttempt = {
      id: uid('att'),
      profileId: pid,
      worldId: 'math',
      activityId,
      level,
      mistakes,
      hintsUsed,
      stars: reward.stars,
      durationMs,
      completedAt: new Date().toISOString(),
    }
    set({
      progress: { ...s.progress, [pid]: allProgress },
      rewards: { ...s.rewards, [pid]: reward.state },
      attempts: [...s.attempts, attempt],
    })
    return { reward, change: diff.change, nextLevel: diff.state.level }
  },

  async wipeAll() {
    await get().repo.clear()
    set({ ...emptyData() })
  },
}))

// Debounced auto-save of everything persistent.
let saveTimer: ReturnType<typeof setTimeout> | undefined
useAppStore.subscribe((s, prev) => {
  if (!s.ready || !prev.ready) return
  const changed = (Object.keys(pick(s)) as (keyof AppData)[]).some((k) => s[k] !== prev[k])
  if (!changed) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void s.repo.save(pick(useAppStore.getState())), 150)
})

export function flushSave(): Promise<void> {
  clearTimeout(saveTimer)
  const s = useAppStore.getState()
  return s.ready ? s.repo.save(pick(s)) : Promise.resolve()
}

export const selectActiveProfile = (s: AppState) => s.profiles.find((p) => p.id === s.activeProfileId) ?? null
