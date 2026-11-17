import { DATA_VERSION, MAX_ATTEMPTS, emptyData, type AppData, type Repository } from './repository'

export const STORAGE_KEY = 'wonderworld:v1'

/** Fill in any field missing from an older or partial save so the app never crashes on load. */
export function normalize(raw: unknown): AppData {
  const base = emptyData()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<AppData>
  if (r.version !== DATA_VERSION) return base
  return {
    ...base,
    ...r,
    settings: { ...base.settings, ...r.settings, comfort: { ...base.settings.comfort, ...r.settings?.comfort } },
    parent: { ...base.parent, ...r.parent, levelLocks: { ...r.parent?.levelLocks } },
    profiles: Array.isArray(r.profiles) ? r.profiles : [],
    attempts: Array.isArray(r.attempts) ? r.attempts.slice(-MAX_ATTEMPTS) : [],
    progress: r.progress ?? {},
    rewards: r.rewards ?? {},
    learningTimeMs: r.learningTimeMs ?? {},
  }
}

export class LocalRepository implements Repository {
  readonly kind = 'local' as const
  constructor(private readonly storage: Storage | null = safeStorage()) {}

  async load(): Promise<AppData> {
    if (!this.storage) return emptyData()
    try {
      const text = this.storage.getItem(STORAGE_KEY)
      return normalize(text ? JSON.parse(text) : null)
    } catch {
      return emptyData()
    }
  }

  async save(data: AppData): Promise<void> {
    if (!this.storage) return
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify({ ...data, attempts: data.attempts.slice(-MAX_ATTEMPTS) }))
    } catch {
      // Quota or private mode — progress stays in memory for this session.
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage?.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}
