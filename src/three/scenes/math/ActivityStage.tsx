// Renders the live round: zones + grabbable objects at the positions the engine dictates.
import { useCallback, useMemo } from 'react'
import { useSessionStore } from '@/state/sessionStore'
import { useAppStore } from '@/state/appStore'
import { countIn, type ZoneId } from '@/engine/learning/round'
import { Grabbable } from '../../components/Grabbable'
import { DropZone } from '../../components/DropZone'
import { ITEM_RADIUS, ItemModel, NumberBlock } from '../../components/Items'
import { ZONES, restPositions, tableHeight, zoneWorld } from './layout'

export function ActivityStage() {
  const round = useSessionStore((s) => s.round)
  const state = useSessionStore((s) => s.roundState)
  const resetToken = useSessionStore((s) => s.resetToken)
  const roundKey = useSessionStore((s) => s.roundStartedAt)
  const place = useSessionStore((s) => s.place)
  const mode = useAppStore((s) => s.settings.comfort.mode)
  const surfaceY = tableHeight(mode)

  const rests = useMemo(() => (round && state ? restPositions(round, state, surfaceY) : {}), [round, state, surfaceY])
  const zones = useMemo(() => (round ? ZONES[round.type].map((z) => ({ ...z, world: zoneWorld(z, surfaceY) })) : []), [round, surfaceY])

  const onDrop = useCallback((id: string, zone: string | null) => place(id, zone as ZoneId | null).accepted, [place])
  const onPlaceSelected = useCallback((itemId: string, zoneId: string) => void place(itemId, zoneId as ZoneId), [place])

  if (!round || !state) return null
  const highlight = new Set(state.hint?.highlight ?? [])
  const done = state.phase === 'done'

  return (
    <group key={roundKey}>
      {zones
        .filter((z) => !z.phase || z.phase === state.phase || (done && z.phase === 'answer'))
        .map((z) => (
          <DropZone
            key={z.id}
            id={z.id}
            position={z.world}
            halfX={z.halfX}
            halfZ={z.halfZ}
            variant={z.variant}
            color={z.color}
            label={z.label}
            count={z.counted && (round.type === 'counting' || state.phase === 'move') ? countIn(round, state, z.id) : null}
            onPlaceSelected={onPlaceSelected}
          />
        ))}
      {round.items.map((it) => {
        const visible = it.phase === 'move' || state.phase !== 'move'
        if (!visible) return null
        const rest = rests[it.id]
        if (!rest) return null
        const isNumber = it.kind === 'number'
        return (
          <Grabbable
            key={it.id}
            id={it.id}
            rest={rest}
            surfaceY={surfaceY}
            onDrop={onDrop}
            disabled={done}
            highlight={highlight.has(it.id)}
            radius={isNumber ? 0.06 : ITEM_RADIUS}
            label={isNumber ? `number ${it.value}` : it.kind}
            resetKey={resetToken}
          >
            {isNumber ? <NumberBlock value={it.value ?? 0} /> : <ItemModel kind={it.kind as Exclude<typeof it.kind, 'number'>} />}
          </Grabbable>
        )
      })}
    </group>
  )
}
