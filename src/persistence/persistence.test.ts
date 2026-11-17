import { beforeEach, describe, expect, it } from 'vitest'
import { LocalRepository, STORAGE_KEY, normalize } from './localRepository'
import { emptyData } from './repository'
import { hashPin, isValidPin, newSalt } from './pin'
import { useAppStore } from '@/state/appStore'

describe('LocalRepository', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips data', async () => {
    const repo = new LocalRepository(localStorage)
    const data = { ...emptyData(), activeProfileId: 'x' }
    await repo.save(data)
    expect((await repo.load()).activeProfileId).toBe('x')
  })

  it('survives corrupt or foreign data', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect((await new LocalRepository(localStorage).load()).profiles).toEqual([])
    expect(normalize({ version: 99 }).profiles).toEqual([])
    const partial = normalize({ version: 1, settings: { music: true } })
    expect(partial.settings.music).toBe(true)
    expect(partial.settings.comfort.turn).toBe('snap')
  })
})

describe('parent PIN', () => {
  it('hashes with salt and validates format', async () => {
    const salt = newSalt()
    const a = await hashPin('1234', salt)
    expect(a).toHaveLength(64)
    expect(await hashPin('1234', salt)).toBe(a)
    expect(await hashPin('1234', newSalt())).not.toBe(a)
    expect(isValidPin('12')).toBe(false)
    expect(isValidPin('1234')).toBe(true)
  })
})

describe('app store round completion', () => {
  beforeEach(async () => {
    localStorage.clear()
    await useAppStore.getState().init(new LocalRepository(localStorage))
  })

  it('records attempts, progress, rewards and adapts level', () => {
    const app = useAppStore.getState()
    const p = app.createProfile({ nickname: 'Asha', ageGroup: 'little', avatarId: 'fox' })
    for (let i = 0; i < 3; i++) useAppStore.getState().completeRound({ activityId: 'counting', level: 1, mistakes: 0, hintsUsed: 0, durationMs: 1000 })
    const s = useAppStore.getState()
    expect(s.attempts).toHaveLength(3)
    expect(s.progress[p.id]?.counting?.level).toBe(2)
    expect(s.rewards[p.id]?.stars).toBe(9)
    expect(s.rewards[p.id]?.badges.map((b) => b.id)).toContain('first-steps')
  })

  it('deleting a profile removes all of its data', () => {
    const p = useAppStore.getState().createProfile({ nickname: 'Ravi', ageGroup: 'adventurer', avatarId: 'owl' })
    useAppStore.getState().completeRound({ activityId: 'addition', level: 2, mistakes: 1, hintsUsed: 1, durationMs: 500 })
    useAppStore.getState().deleteProfile(p.id)
    const s = useAppStore.getState()
    expect(s.profiles).toHaveLength(0)
    expect(s.attempts).toHaveLength(0)
    expect(s.progress[p.id]).toBeUndefined()
  })
})
