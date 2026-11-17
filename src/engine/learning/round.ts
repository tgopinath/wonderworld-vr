// Round generation + validation for every Maths activity.
// The 3D layer only reports placements; this module decides what is right.
import { ACTIVITIES, getLevel, type ItemKind } from '@/config/activities'
import type { ActivityType } from '@/engine/core/types'
import { pick, randInt, shuffle, type Rng } from '@/engine/core/rng'

export type ZoneId = 'pile' | 'tray' | 'left' | 'right' | 'combined' | 'group' | 'away' | 'shelf' | 'answer'

export interface RoundItem {
  id: string
  kind: ItemKind | 'number'
  /** For number blocks. */
  value?: number
  /** Zone the item starts in. */
  home: ZoneId
  /** Number blocks only appear in the answer phase for addition/subtraction. */
  phase: 'move' | 'answer'
}

interface RoundBase {
  type: ActivityType
  level: number
  items: RoundItem[]
  prompt: string
  /** Narration line (same as prompt, phrased for speech). */
  say: string
}

export interface CountingRound extends RoundBase {
  type: 'counting'
  target: number
  kind: ItemKind
}
export interface NumberRecognitionRound extends RoundBase {
  type: 'numberRecognition'
  target: number
  choices: number[]
}
export interface AdditionRound extends RoundBase {
  type: 'addition'
  a: number
  b: number
  kind: ItemKind
  choices: number[]
}
export interface SubtractionRound extends RoundBase {
  type: 'subtraction'
  total: number
  take: number
  kind: ItemKind
  choices: number[]
}

export type Round = CountingRound | NumberRecognitionRound | AdditionRound | SubtractionRound

export type Phase = 'move' | 'answer' | 'done'

export interface RoundState {
  placements: Record<string, ZoneId>
  phase: Phase
  mistakes: number
  hintsUsed: number
  /** Latest hint shown to the child, if any. */
  hint: Hint | null
  /** Number value most recently dropped in the answer slot. */
  answer: number | null
}

export interface Hint {
  level: 1 | 2
  text: string
  /** Item ids to glow (level-2 hints). */
  highlight: string[]
}

export interface Evaluation {
  correct: boolean
  /** Text shown + spoken. Always encouraging. */
  message: string
  hint: Hint | null
}

const NAMES: Record<ItemKind, [string, string]> = {
  apple: ['apple', 'apples'],
  star: ['star', 'stars'],
  ball: ['ball', 'balls'],
  duck: ['duck', 'ducks'],
  cube: ['block', 'blocks'],
}

export function itemName(kind: ItemKind, n: number): string {
  return n === 1 ? NAMES[kind][0] : NAMES[kind][1]
}

/** Answer choices: always includes `answer`, unique, within [min,max], biased to near-misses. */
export function makeChoices(rng: Rng, answer: number, count: number, min = 0, max = 20): number[] {
  const set = new Set<number>([answer])
  const near = shuffle(rng, [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3, answer - 3])
  for (const n of near) {
    if (set.size >= count) break
    if (n >= min && n <= max) set.add(n)
  }
  let guard = 0
  while (set.size < count && guard++ < 200) set.add(randInt(rng, min, max))
  return shuffle(rng, [...set])
}

function numberItems(values: number[], home: ZoneId, phase: RoundItem['phase']): RoundItem[] {
  return values.map((v, i) => ({ id: `num-${v}-${i}`, kind: 'number', value: v, home, phase }))
}

function objectItems(kind: ItemKind, n: number, home: ZoneId, prefix: string): RoundItem[] {
  return Array.from({ length: n }, (_, i) => ({ id: `${prefix}-${i}`, kind, home, phase: 'move' as const }))
}

export function createRound(type: ActivityType, level: number, rng: Rng): Round {
  switch (type) {
    case 'counting': {
      const cfg = getLevel('counting', level)
      const target = randInt(rng, cfg.target[0], cfg.target[1])
      const decoys = randInt(rng, cfg.decoys[0], cfg.decoys[1])
      const kind = pick(rng, cfg.kinds)
      const name = itemName(kind, target)
      return {
        type,
        level,
        target,
        kind,
        items: objectItems(kind, target + decoys, 'pile', 'obj'),
        prompt: `Put ${target} ${name} in the basket`,
        say: `Can you put ${target} ${name} in the basket? Then press Check.`,
      }
    }
    case 'numberRecognition': {
      const cfg = getLevel('numberRecognition', level)
      const target = randInt(rng, cfg.range[0], cfg.range[1])
      const choices = makeChoices(rng, target, cfg.choices, cfg.range[0], cfg.range[1])
      return {
        type,
        level,
        target,
        choices,
        items: numberItems(choices, 'shelf', 'move'),
        prompt: `Find the number ${target}`,
        say: `Find the number ${target}, and put it in the golden slot.`,
      }
    }
    case 'addition': {
      const cfg = getLevel('addition', level)
      let a = randInt(rng, cfg.a[0], cfg.a[1])
      let b = randInt(rng, cfg.b[0], cfg.b[1])
      while (a + b > cfg.maxSum) {
        if (a >= b && a > 1) a--
        else if (b > 1) b--
        else break
      }
      const kind = pick(rng, cfg.kinds)
      const choices = makeChoices(rng, a + b, cfg.choices, 0, 20)
      return {
        type,
        level,
        a,
        b,
        kind,
        choices,
        items: [
          ...objectItems(kind, a, 'left', 'left'),
          ...objectItems(kind, b, 'right', 'right'),
          ...numberItems(choices, 'shelf', 'answer'),
        ],
        prompt: `${a} + ${b} = ?`,
        say: `${a} plus ${b}. Move all the ${itemName(kind, 2)} into the big basket.`,
      }
    }
    case 'subtraction': {
      const cfg = getLevel('subtraction', level)
      const total = randInt(rng, cfg.total[0], cfg.total[1])
      const take = Math.min(randInt(rng, cfg.take[0], cfg.take[1]), total - 1)
      const kind = pick(rng, cfg.kinds)
      const choices = makeChoices(rng, total - take, cfg.choices, 0, 20)
      return {
        type,
        level,
        total,
        take,
        kind,
        choices,
        items: [...objectItems(kind, total, 'group', 'obj'), ...numberItems(choices, 'shelf', 'answer')],
        prompt: `${total} - ${take} = ?`,
        say: `There are ${total} ${itemName(kind, total)}. Take ${take} away into the box.`,
      }
    }
  }
}

export function initialState(round: Round): RoundState {
  const placements: Record<string, ZoneId> = {}
  for (const it of round.items) placements[it.id] = it.home
  return { placements, phase: 'move', mistakes: 0, hintsUsed: 0, hint: null, answer: null }
}

export function countIn(round: Round, state: RoundState, zone: ZoneId): number {
  let n = 0
  for (const it of round.items) if (it.kind !== 'number' && state.placements[it.id] === zone) n++
  return n
}

/** Which zones accept which items. Used by the 3D layer to show green/red feedback on drop. */
export function zoneAccepts(round: Round, state: RoundState, item: RoundItem, zone: ZoneId): boolean {
  if (state.phase === 'done') return false
  if (item.kind === 'number') {
    if (zone === 'shelf') return true
    if (zone !== 'answer') return false
    return round.type === 'numberRecognition' ? state.phase === 'move' : state.phase === 'answer'
  }
  switch (round.type) {
    case 'counting':
      return zone === 'pile' || zone === 'tray'
    case 'addition':
      return zone === 'left' || zone === 'right' || zone === 'combined'
    case 'subtraction':
      return zone === 'group' || zone === 'away'
    default:
      return false
  }
}

function withPhase(round: Round, s: RoundState): RoundState {
  if (s.phase !== 'move') return s
  if (round.type === 'addition') {
    const done = countIn(round, s, 'left') === 0 && countIn(round, s, 'right') === 0
    return done ? { ...s, phase: 'answer', hint: null } : s
  }
  if (round.type === 'subtraction') {
    return countIn(round, s, 'away') === round.take ? { ...s, phase: 'answer', hint: null } : s
  }
  return s
}

/**
 * Record that an item now sits in `zone` (or was dropped outside every zone → back home).
 * Returns the new state. Rejected drops return the item to its home.
 */
export function placeItem(round: Round, state: RoundState, itemId: string, zone: ZoneId | null): RoundState {
  const item = round.items.find((i) => i.id === itemId)
  if (!item || state.phase === 'done') return state
  const target = zone && zoneAccepts(round, state, item, zone) ? zone : item.home
  const next: RoundState = { ...state, placements: { ...state.placements, [itemId]: target } }
  // Subtraction: moving items back out of the "away" box can re-open the move phase.
  if (round.type === 'subtraction' && next.phase === 'answer' && countIn(round, next, 'away') !== round.take) {
    return { ...next, phase: 'move' }
  }
  return withPhase(round, next)
}

function hintFor(round: Round, state: RoundState, level: 1 | 2): Hint {
  switch (round.type) {
    case 'counting': {
      const have = countIn(round, state, 'tray')
      const diff = round.target - have
      if (level === 1) {
        return {
          level,
          text: diff > 0 ? 'Almost! Count the basket again — do you need more?' : 'Almost! Count the basket again — is that too many?',
          highlight: [],
        }
      }
      const n = Math.abs(diff)
      return {
        level,
        text: diff > 0 ? `You have ${have}. Add ${n} more ${itemName(round.kind, n)}.` : `You have ${have}. Take ${n} ${itemName(round.kind, n)} out.`,
        highlight: [],
      }
    }
    case 'numberRecognition': {
      const t = round.target
      const correctItem = round.items.find((i) => i.value === t)
      if (level === 1) {
        const clue = t === 0 ? 'It looks like a circle — it means nothing at all.' : `It comes right after ${t - 1}.`
        return { level, text: `Good try! ${clue}`, highlight: [] }
      }
      return { level, text: `Look for the glowing number — that's ${t}!`, highlight: correctItem ? [correctItem.id] : [] }
    }
    case 'addition':
    case 'subtraction': {
      const zone: ZoneId = round.type === 'addition' ? 'combined' : 'group'
      const n = countIn(round, state, zone)
      const where = round.type === 'addition' ? 'big basket' : 'group that is left'
      if (level === 1) return { level, text: `Nice effort! Touch and count each one in the ${where}.`, highlight: [] }
      const correctItem = round.items.find((i) => i.kind === 'number' && i.value === n)
      return { level, text: `There are ${n} in the ${where}. Find the number ${n}.`, highlight: correctItem ? [correctItem.id] : [] }
    }
  }
}

function praise(round: Round): string {
  switch (round.type) {
    case 'counting':
      return `Yes! ${round.target} ${itemName(round.kind, round.target)}. Brilliant counting!`
    case 'numberRecognition':
      return `You found ${round.target}! Super eyes!`
    case 'addition':
      return `${round.a} + ${round.b} = ${round.a + round.b}. Amazing!`
    case 'subtraction':
      return `${round.total} take away ${round.take} is ${round.total - round.take}. Well done!`
  }
}

/**
 * The single source of truth for "is this answer right?".
 * - counting: called when the child presses Check.
 * - others: called when a number block lands in the answer slot (`answerValue`).
 */
export function evaluate(round: Round, state: RoundState, answerValue?: number): { state: RoundState; result: Evaluation } {
  let correct: boolean
  switch (round.type) {
    case 'counting':
      correct = countIn(round, state, 'tray') === round.target
      break
    case 'numberRecognition':
      correct = answerValue === round.target
      break
    case 'addition':
      correct =
        state.phase === 'answer' &&
        countIn(round, state, 'combined') === round.a + round.b &&
        answerValue === countIn(round, state, 'combined')
      break
    case 'subtraction':
      correct =
        state.phase === 'answer' &&
        countIn(round, state, 'away') === round.take &&
        answerValue === countIn(round, state, 'group')
      break
  }

  if (correct) {
    return {
      state: { ...state, phase: 'done', hint: null, answer: answerValue ?? null },
      result: { correct: true, message: praise(round), hint: null },
    }
  }

  const mistakes = state.mistakes + 1
  const def = round.type
  const hintCfg = ACTIVITIES[def].hints
  const hintLevel: 1 | 2 = mistakes >= 2 && hintCfg.maxLevel === 2 ? 2 : 1
  const hint: Hint = hintCfg.enabled
    ? hintFor(round, state, hintLevel)
    : { level: 1, text: 'Good try! Have another go.', highlight: [] }
  // Wrong number blocks go back to the shelf so the child can try again.
  const placements = { ...state.placements }
  if (def !== 'counting') {
    for (const it of round.items) if (it.kind === 'number' && placements[it.id] === 'answer') placements[it.id] = 'shelf'
  }
  return {
    state: { ...state, placements, mistakes, hintsUsed: state.hintsUsed + 1, hint, answer: null },
    result: { correct: false, message: hint.text, hint },
  }
}
