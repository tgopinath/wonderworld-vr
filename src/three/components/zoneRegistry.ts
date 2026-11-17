// Drop zones register their world-space footprint here; Grabbables query it on release.
import { create } from 'zustand'
import type { ZoneShape } from '@/engine/interaction/zones'

interface ZoneRegistry {
  zones: Record<string, ZoneShape>
  /** Zone currently under a dragged object (for live hover glow). */
  hot: string | null
  /** Item picked by click/tap for the accessible "select, then choose a zone" flow. */
  selected: string | null
  register(z: ZoneShape): void
  unregister(id: string): void
  setHot(id: string | null): void
  setSelected(id: string | null): void
}

export const useZones = create<ZoneRegistry>()((set) => ({
  zones: {},
  hot: null,
  selected: null,
  register: (z) => set((s) => ({ zones: { ...s.zones, [z.id]: z } })),
  unregister: (id) =>
    set((s) => {
      const { [id]: _gone, ...rest } = s.zones
      return { zones: rest }
    }),
  setHot: (hot) => set((s) => (s.hot === hot ? s : { hot })),
  setSelected: (selected) => set({ selected }),
}))
