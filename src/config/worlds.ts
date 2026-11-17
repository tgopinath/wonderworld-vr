import type { WorldId } from '@/engine/core/types'

export interface WorldDefinition {
  id: WorldId
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  color: string
  accent: string
  icon: string
  /** Short Latin text shown inside the 3D portal (3D text uses a Latin-only font). */
  glyph: string
  /** False = not built yet. Shown honestly as "Coming soon"; never behaves like a playable world. */
  available: boolean
}

export const WORLDS: WorldDefinition[] = [
  { id: 'math', glyph: '1+2', title: 'Mathematics World', description: 'Count, find numbers, add and take away with things you can grab.', difficulty: 'Easy', color: '#ff8a3d', accent: '#ffd166', icon: '🧮', available: true },
  { id: 'geography', glyph: 'Map', title: 'Geography World', description: 'Spin the globe and build the map of India piece by piece.', difficulty: 'Medium', color: '#2bb673', accent: '#a7f3d0', icon: '🌏', available: false },
  { id: 'space', glyph: 'Sky', title: 'Space Explorer', description: 'Hold the planets and line them up around the Sun.', difficulty: 'Medium', color: '#6c5ce7', accent: '#c4b5fd', icon: '🪐', available: false },
  { id: 'science', glyph: 'Lab', title: 'Science Lab', description: 'Explore the body, plants and the water cycle.', difficulty: 'Medium', color: '#00b4d8', accent: '#bae6fd', icon: '🔬', available: false },
  { id: 'money', glyph: 'Rs', title: 'Money World', description: 'Learn Indian coins and notes by shopping.', difficulty: 'Easy', color: '#f4b400', accent: '#fde68a', icon: '🪙', available: false },
  { id: 'puzzle', glyph: '?!', title: 'Puzzle Adventure', description: 'Patterns and number puzzles to crack.', difficulty: 'Hard', color: '#ef476f', accent: '#fbcfe8', icon: '🧩', available: false },
]

export function getWorld(id: WorldId): WorldDefinition {
  const w = WORLDS.find((x) => x.id === id)
  if (!w) throw new Error(`Unknown world ${id}`)
  return w
}
