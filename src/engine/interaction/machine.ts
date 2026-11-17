// Interaction state machine shared by every grabbable object (mouse, touch, XR ray, XR grip, hands).

export type InteractionState = 'idle' | 'hover' | 'selected' | 'grabbed' | 'placedCorrect' | 'placedIncorrect'

export type InteractionEvent =
  | { type: 'hoverIn' }
  | { type: 'hoverOut' }
  | { type: 'select' }
  | { type: 'grab' }
  | { type: 'release'; accepted: boolean | null } // null = dropped outside any zone
  | { type: 'settle' } // feedback animation finished
  | { type: 'reset' }

export interface InteractionContext {
  state: InteractionState
  hovered: boolean
}

export const initialInteraction: InteractionContext = { state: 'idle', hovered: false }

export function interact(ctx: InteractionContext, ev: InteractionEvent): InteractionContext {
  switch (ev.type) {
    case 'reset':
      return { state: 'idle', hovered: false }
    case 'hoverIn':
      if (ctx.state === 'idle') return { state: 'hover', hovered: true }
      return { ...ctx, hovered: true }
    case 'hoverOut':
      if (ctx.state === 'hover' || ctx.state === 'selected') return { state: 'idle', hovered: false }
      return { ...ctx, hovered: false }
    case 'select':
      if (ctx.state === 'idle' || ctx.state === 'hover') return { ...ctx, state: 'selected' }
      return ctx
    case 'grab':
      if (ctx.state === 'placedIncorrect') return ctx // wait for it to fly home first
      return { ...ctx, state: 'grabbed' }
    case 'release':
      if (ctx.state !== 'grabbed') return ctx
      if (ev.accepted === true) return { ...ctx, state: 'placedCorrect' }
      if (ev.accepted === false) return { ...ctx, state: 'placedIncorrect' }
      return { ...ctx, state: ctx.hovered ? 'hover' : 'idle' }
    case 'settle':
      if (ctx.state === 'placedCorrect' || ctx.state === 'placedIncorrect') {
        return { ...ctx, state: ctx.hovered ? 'hover' : 'idle' }
      }
      return ctx
  }
}

/** Visual treatment per state — consumed by the 3D layer. */
export function interactionLook(state: InteractionState): { scale: number; emissive: number; outline: string | null } {
  switch (state) {
    case 'hover':
      return { scale: 1.12, emissive: 0.25, outline: '#ffffff' }
    case 'selected':
      return { scale: 1.12, emissive: 0.35, outline: '#ffd166' }
    case 'grabbed':
      return { scale: 1.18, emissive: 0.3, outline: '#ffd166' }
    case 'placedCorrect':
      return { scale: 1.0, emissive: 0.5, outline: '#34d399' }
    case 'placedIncorrect':
      return { scale: 1.0, emissive: 0.4, outline: '#fb923c' }
    default:
      return { scale: 1.0, emissive: 0, outline: null }
  }
}
