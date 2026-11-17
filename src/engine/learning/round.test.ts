import { describe, expect, it } from 'vitest'
import { createRng } from '@/engine/core/rng'
import { countIn, createRound, evaluate, initialState, makeChoices, placeItem, type Round, type RoundState } from './round'
import { ACTIVITIES, ACTIVITY_ORDER } from '@/config/activities'

const rng = () => createRng(42)

function moveAll(round: Round, state: RoundState, from: string, to: Parameters<typeof placeItem>[3], limit = Infinity) {
  let s = state
  let moved = 0
  for (const it of round.items) {
    if (moved >= limit) break
    if (it.kind !== 'number' && s.placements[it.id] === from) {
      s = placeItem(round, s, it.id, to)
      moved++
    }
  }
  return s
}

describe('makeChoices', () => {
  it('always includes the answer, unique, and in range', () => {
    for (let seed = 0; seed < 200; seed++) {
      const r = createRng(seed)
      const answer = seed % 21
      const c = makeChoices(r, answer, 5, 0, 20)
      expect(c).toContain(answer)
      expect(new Set(c).size).toBe(c.length)
      expect(c.every((n) => n >= 0 && n <= 20)).toBe(true)
      expect(c.length).toBe(5)
    }
  })
})

describe('createRound respects level config for every activity and level', () => {
  for (const type of ACTIVITY_ORDER) {
    ACTIVITIES[type].levels.forEach((_, i) => {
      it(`${type} L${i + 1}`, () => {
        for (let seed = 0; seed < 50; seed++) {
          const r = createRound(type, i + 1, createRng(seed))
          expect(r.items.length).toBeGreaterThan(0)
          if (r.type === 'addition') expect(r.a + r.b).toBeLessThanOrEqual(ACTIVITIES.addition.levels[i]!.maxSum)
          if (r.type === 'subtraction') expect(r.take).toBeLessThan(r.total)
          if (r.type === 'numberRecognition') expect(r.choices).toContain(r.target)
        }
      })
    })
  }
})

describe('counting', () => {
  it('is correct only when the tray holds exactly the target', () => {
    const round = createRound('counting', 2, rng())
    if (round.type !== 'counting') throw new Error()
    let s = initialState(round)
    s = moveAll(round, s, 'pile', 'tray', round.target - 1)
    const tooFew = evaluate(round, s)
    expect(tooFew.result.correct).toBe(false)
    expect(tooFew.result.hint?.level).toBe(1)
    expect(tooFew.state.mistakes).toBe(1)

    s = moveAll(round, tooFew.state, 'pile', 'tray', 2) // now one too many
    expect(countIn(round, s, 'tray')).toBe(round.target + 1)
    const tooMany = evaluate(round, s)
    expect(tooMany.result.correct).toBe(false)
    expect(tooMany.result.hint?.level).toBe(2)
    expect(tooMany.result.message).toMatch(/Take 1/)

    const back = round.items.find((i) => tooMany.state.placements[i.id] === 'tray')!
    s = placeItem(round, tooMany.state, back.id, 'pile')
    const ok = evaluate(round, s)
    expect(ok.result.correct).toBe(true)
    expect(ok.state.phase).toBe('done')
  })

  it('rejects drops into zones that do not belong to the activity', () => {
    const round = createRound('counting', 1, rng())
    const s = placeItem(round, initialState(round), round.items[0]!.id, 'answer')
    expect(s.placements[round.items[0]!.id]).toBe('pile')
  })
})

describe('number recognition', () => {
  it('validates the dropped value and sends wrong blocks back', () => {
    const round = createRound('numberRecognition', 3, rng())
    if (round.type !== 'numberRecognition') throw new Error()
    const wrong = round.items.find((i) => i.value !== round.target)!
    let s = placeItem(round, initialState(round), wrong.id, 'answer')
    const bad = evaluate(round, s, wrong.value)
    expect(bad.result.correct).toBe(false)
    expect(bad.state.placements[wrong.id]).toBe('shelf')

    const right = round.items.find((i) => i.value === round.target)!
    const second = evaluate(round, placeItem(round, bad.state, wrong.id, 'answer'), wrong.value)
    expect(second.result.hint?.highlight).toEqual([right.id])

    s = placeItem(round, second.state, right.id, 'answer')
    expect(evaluate(round, s, right.value).result.correct).toBe(true)
  })
})

describe('addition', () => {
  it('requires every object in the combined basket and the matching number', () => {
    const round = createRound('addition', 3, rng())
    if (round.type !== 'addition') throw new Error()
    let s = initialState(round)
    const answer = round.items.find((i) => i.kind === 'number' && i.value === round.a + round.b)!

    // Number slot is closed until the objects are combined.
    s = placeItem(round, s, answer.id, 'answer')
    expect(s.placements[answer.id]).toBe('shelf')
    expect(evaluate(round, s, answer.value).result.correct).toBe(false)

    s = moveAll(round, s, 'left', 'combined')
    expect(s.phase).toBe('move')
    s = moveAll(round, s, 'right', 'combined')
    expect(s.phase).toBe('answer')
    expect(countIn(round, s, 'combined')).toBe(round.a + round.b)

    s = placeItem(round, s, answer.id, 'answer')
    expect(evaluate(round, s, answer.value).result.correct).toBe(true)
  })
})

describe('subtraction', () => {
  it('opens the answer step only when exactly `take` are away', () => {
    const round = createRound('subtraction', 3, rng())
    if (round.type !== 'subtraction') throw new Error()
    let s = moveAll(round, initialState(round), 'group', 'away', round.take)
    expect(s.phase).toBe('answer')
    s = moveAll(round, s, 'group', 'away', 1)
    expect(s.phase).toBe('move')
    const back = round.items.find((i) => s.placements[i.id] === 'away')!
    s = placeItem(round, s, back.id, 'group')
    expect(s.phase).toBe('answer')

    const left = round.total - round.take
    const num = round.items.find((i) => i.kind === 'number' && i.value === left)!
    s = placeItem(round, s, num.id, 'answer')
    expect(evaluate(round, s, left).result.correct).toBe(true)
  })
})
