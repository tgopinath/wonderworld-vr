import { describe, expect, it } from 'vitest'
import { initialInteraction, interact, type InteractionEvent } from './machine'
import { findZone, slotOffset, type ZoneShape } from './zones'

const run = (...evs: InteractionEvent[]) => evs.reduce(interact, initialInteraction)

describe('interaction state machine', () => {
  it('hover → grab → release into an accepting zone → settle', () => {
    expect(run({ type: 'hoverIn' }).state).toBe('hover')
    expect(run({ type: 'hoverIn' }, { type: 'grab' }).state).toBe('grabbed')
    const placed = run({ type: 'hoverIn' }, { type: 'grab' }, { type: 'release', accepted: true })
    expect(placed.state).toBe('placedCorrect')
    expect(interact(placed, { type: 'settle' }).state).toBe('hover')
  })

  it('rejected drop is placedIncorrect and cannot be re-grabbed until settled', () => {
    const bad = run({ type: 'grab' }, { type: 'release', accepted: false })
    expect(bad.state).toBe('placedIncorrect')
    expect(interact(bad, { type: 'grab' }).state).toBe('placedIncorrect')
    expect(interact(interact(bad, { type: 'settle' }), { type: 'grab' }).state).toBe('grabbed')
  })

  it('select from hover, deselect on hover out, reset from anywhere', () => {
    expect(run({ type: 'hoverIn' }, { type: 'select' }).state).toBe('selected')
    expect(run({ type: 'hoverIn' }, { type: 'select' }, { type: 'hoverOut' }).state).toBe('idle')
    expect(run({ type: 'grab' }, { type: 'reset' }).state).toBe('idle')
  })

  it('release outside every zone returns to idle', () => {
    expect(run({ type: 'grab' }, { type: 'release', accepted: null }).state).toBe('idle')
  })
})

describe('zones', () => {
  const tray: ZoneShape = { id: 'tray', center: [0, 0.75, 0], halfX: 0.2, halfZ: 0.15, height: 0.1 }
  const pile: ZoneShape = { id: 'pile', center: [0.5, 0.75, 0], halfX: 0.2, halfZ: 0.15, height: 0.1 }

  it('finds the zone under a point, with a forgiving margin', () => {
    expect(findZone([tray, pile], [0.05, 0.8, 0.05])?.id).toBe('tray')
    expect(findZone([tray, pile], [0.22, 0.8, 0])?.id).toBe('tray')
    expect(findZone([tray, pile], [0.5, 0.8, 0.1])?.id).toBe('pile')
    expect(findZone([tray, pile], [0, 2.5, 0])).toBeNull()
    expect(findZone([tray, pile], [-1, 0.8, 0])).toBeNull()
  })

  it('slot offsets are unique and inside the zone', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 12; i++) {
      const [x, z] = slotOffset(i, 12, 0.3, 0.2)
      expect(Math.abs(x)).toBeLessThanOrEqual(0.3)
      expect(Math.abs(z)).toBeLessThanOrEqual(0.2)
      seen.add(`${x.toFixed(3)},${z.toFixed(3)}`)
    }
    expect(seen.size).toBe(12)
  })
})
