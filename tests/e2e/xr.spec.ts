// WebXR emulator test (IWER, Meta Quest 3 profile). Drives emulated controllers to:
// enter VR → ray + trigger on the Maths portal → ray + trigger on a board button →
// grip-grab an object, carry it into the basket, release → engine records the placement → exit VR.
// This verifies the shared interaction code path for XR input. It does NOT replace on-device Quest testing.
import { expect, test, type Page } from '@playwright/test'
import { createProfile, roundInfo, settle } from './helpers'

type V3 = [number, number, number]

const ww = <T,>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([f, a]) => (window as unknown as { __ww: Record<string, (...x: unknown[]) => unknown> }).__ww[f as string]!(...(a as unknown[])), [fn, args] as const) as Promise<T>

/** Controller poses are relative to the XR origin (player position, yaw 0 in these tests). */
async function toLocal(page: Page, world: V3): Promise<V3> {
  const p = await ww<{ x: number; z: number }>(page, 'player')
  return [world[0] - p.x, world[1], world[2] - p.z]
}

async function aim(page: Page, hand: 'left' | 'right', fromLocal: V3, targetWorld: V3) {
  const to = await toLocal(page, targetWorld)
  await page.evaluate(
    ([h, from, t]) => {
      const c = (window as unknown as { __iwer: { controllers: Record<string, { position: { set(...v: number[]): void }; quaternion: { set(...v: number[]): void } }> } }).__iwer.controllers[h as string]!
      const f = from as number[]
      const g = t as number[]
      c.position.set(f[0]!, f[1]!, f[2]!)
      let b = [g[0]! - f[0]!, g[1]! - f[1]!, g[2]! - f[2]!]
      const L = Math.hypot(...b)
      b = b.map((v) => v / L)
      // Rotation taking −Z onto b.
      const cx = 0 * b[2]! - -1 * b[1]!
      const cy = -1 * b[0]! - 0 * b[2]!
      const cz = 0
      const w = 1 - b[2]!
      const n = Math.hypot(cx, cy, cz, w)
      c.quaternion.set(cx / n, cy / n, cz / n, w / n)
    },
    [hand, fromLocal, to] as const,
  )
  await wiggle(page, hand)
}

/**
 * Real hands never hold perfectly still, and the pointer library re-intersects when a controller moves.
 * Emulated poses are static, so nudge the controller by a millimetre for a few frames after each pose change.
 */
async function wiggle(page: Page, hand: 'left' | 'right') {
  for (let i = 0; i < 4; i++) {
    await page.evaluate(
      ([h, d]) => {
        const c = (window as unknown as { __iwer: { controllers: Record<string, { position: { x: number } }> } }).__iwer.controllers[h as string]!
        c.position.x += d as number
      },
      [hand, i % 2 ? -0.001 : 0.001] as const,
    )
    await waitFrames(page, 2)
  }
}

async function waitFrames(page: Page, n: number) {
  const start = await ww<number>(page, 'frames')
  await expect.poll(() => ww<number>(page, 'frames'), { timeout: 30_000 }).toBeGreaterThanOrEqual(start + n)
}

async function moveTo(page: Page, hand: 'left' | 'right', world: V3) {
  const local = await toLocal(page, world)
  await page.evaluate(
    ([h, p]) => {
      const c = (window as unknown as { __iwer: { controllers: Record<string, { position: { set(...v: number[]): void }; quaternion: { set(...v: number[]): void } }> } }).__iwer.controllers[h as string]!
      const v = p as number[]
      c.position.set(v[0]!, v[1]!, v[2]!)
      c.quaternion.set(0, 0, 0, 1)
    },
    [hand, local] as const,
  )
  await wiggle(page, hand)
}

async function button(page: Page, hand: 'left' | 'right', id: 'trigger' | 'squeeze', value: 0 | 1, waitMs = 350) {
  await page.evaluate(([h, b, v]) => (window as unknown as { __iwer: { controllers: Record<string, { updateButtonValue(id: string, v: number): void }> } }).__iwer.controllers[h as string]!.updateButtonValue(b as string, v as number), [hand, id, value] as const)
  await waitFrames(page, 4)
  await page.waitForTimeout(waitMs)
}

/** A quick trigger pull (a "click" must finish within the pointer library's click threshold). */
async function click(page: Page, hand: 'left' | 'right') {
  await page.evaluate(async (h) => {
    const c = (window as unknown as { __iwer: { controllers: Record<string, { updateButtonValue(id: string, v: number): void }> } }).__iwer.controllers[h]!
    c.updateButtonValue('trigger', 1)
    await new Promise((r) => setTimeout(r, 250))
    c.updateButtonValue('trigger', 0)
  }, hand)
  await page.waitForTimeout(500)
}

test('VR (emulated Quest 3): ray select, grip grab and release, exit', async ({ page }) => {
  test.setTimeout(180_000) // software-rendered WebXR runs at a few fps
  await createProfile(page, 'VRKid')
  await page.goto('/play?xr=emulate&xrui=off')
  await settle(page)
  await page.getByTestId('enter-vr').click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __ww: { xrVisibility(): string | undefined } }).__ww.xrVisibility())).toBe('visible')

  await expect.poll(async () => (await ww<unknown[]>(page, 'xr')).length, { timeout: 30_000 }).toBe(2) // both controllers tracked

  // Teleport: push the left stick forward (arc appears), aim at the floor, pull the trigger, let go.
  const before = await ww<{ x: number; z: number }>(page, 'player')
  await page.evaluate(() => (window as unknown as { __iwer: { controllers: Record<string, { updateAxes(id: string, x: number, y: number): void }> } }).__iwer.controllers.left!.updateAxes('thumbstick', 0, -1))
  await waitFrames(page, 4)
  await aim(page, 'left', [-0.2, 1.2, -0.2], [before.x - 0.2, 0, before.z - 1.6])
  await click(page, 'left')
  await page.evaluate(() => (window as unknown as { __iwer: { controllers: Record<string, { updateAxes(id: string, x: number, y: number): void }> } }).__iwer.controllers.left!.updateAxes('thumbstick', 0, 0))
  await expect.poll(async () => (await ww<{ z: number }>(page, 'player')).z, { timeout: 15_000 }).toBeLessThan(before.z - 0.5)
  await waitFrames(page, 4)

  // Ray + trigger on the Maths portal.
  const portal = await ww<V3>(page, 'world', 'portal:math')
  await aim(page, 'right', [0.2, 1.2, -0.2], portal)
  await click(page, 'right')
  await expect.poll(async () => (await roundInfo(page)).scene, { timeout: 30_000 }).toBe('math')
  await expect.poll(async () => (await roundInfo(page)).loading, { timeout: 60_000 }).toBe(false)

  // Ray + trigger on the "Counting" board button.
  await expect.poll(() => ww<V3 | null>(page, 'world', 'activity:counting')).not.toBeNull()
  const btn = await ww<V3>(page, 'world', 'activity:counting')
  await aim(page, 'right', [0.2, 1.2, -0.2], btn)
  await click(page, 'right')
  await expect.poll(async () => (await roundInfo(page)).round?.type, { timeout: 30_000 }).toBe('counting')
  await page.waitForTimeout(800) // XR rig steps up to the table

  // Grip-grab one object from the pile, carry it into the basket, release.
  const info = await roundInfo(page)
  const item = info.round!.items[0]!.id
  const itemPos = await ww<V3>(page, 'world', item)
  await moveTo(page, 'right', [itemPos[0], itemPos[1] + 0.04, itemPos[2]])
  await button(page, 'right', 'squeeze', 1)
  const tray = await ww<V3>(page, 'zoneWorld', 'tray')
  await moveTo(page, 'right', [tray[0], tray[1] + 0.12, tray[2]])
  await moveTo(page, 'right', [tray[0], tray[1] + 0.06, tray[2]])
  await button(page, 'right', 'squeeze', 0)
  await expect.poll(async () => (await roundInfo(page)).placements?.[item], { timeout: 15_000 }).toBe('tray')

  // Exit VR safely via the session end path used by the 3D "Exit VR" button.
  await page.evaluate(() => (window as unknown as { __ww: { exitVR(): void } }).__ww.exitVR())
  await expect.poll(() => page.evaluate(() => (window as unknown as { __ww: { xrVisibility(): string | undefined } }).__ww.xrVisibility())).toBeUndefined()
})
