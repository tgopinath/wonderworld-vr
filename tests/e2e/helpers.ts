// Helpers that drive the REAL 3D scene with the mouse. The page exposes a read-only
// `window.__ww` bridge (dev builds / ?e2e) that reports where objects are on screen.
import { expect, type Page } from '@playwright/test'

export interface RoundInfo {
  scene: string
  loading: boolean
  moving: boolean
  round: null | { type: string; target?: number; a?: number; b?: number; total?: number; take?: number; items: { id: string; kind: string; value?: number }[] }
  placements?: Record<string, string>
  phase?: string
  mistakes?: number
  celebration: null | { stars: number }
}

export async function createProfile(page: Page, nickname = 'Tester') {
  await page.goto('/profiles?new=1')
  await page.getByPlaceholder('e.g. Star Fox').fill(nickname)
  await page.getByRole('button', { name: 'Let’s go!' }).click()
  await expect(page).toHaveURL(/\/worlds/)
}

export const roundInfo = (page: Page) => page.evaluate(() => (window as unknown as { __ww: { round(): RoundInfo } }).__ww.round())

export async function screenOf(page: Page, id: string) {
  const p = await page.evaluate((i) => (window as unknown as { __ww: { screen(id: string): { x: number; y: number } | null } }).__ww.screen(i), id)
  if (!p) throw new Error(`object ${id} not on screen`)
  return p
}

/** Wait until the world finished loading and the desktop camera stopped gliding. */
export async function settle(page: Page) {
  await page.waitForFunction(() => 'round' in ((window as unknown as { __ww?: object }).__ww ?? {}), null, { timeout: 60_000 })
  await expect.poll(async () => (await roundInfo(page)).loading, { timeout: 60_000 }).toBe(false)
  // Desktop camera glides to activity viewpoints; wait for it to arrive (headless GPUs render few fps).
  await expect.poll(async () => (await roundInfo(page)).moving, { timeout: 60_000 }).toBe(false)
  await page.waitForTimeout(300)
}

export async function press3D(page: Page, buttonId: string) {
  await settle(page)
  const p = await screenOf(page, buttonId)
  await page.mouse.click(p.x, p.y)
}

/** Real drag: press on the object, move in steps, release over the target zone's object/point. */
export async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  // Objects' origin is their base; grab a little above it.
  await page.mouse.move(from.x, from.y - 8)
  await page.mouse.down()
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2 - 20, { steps: 6 })
  await page.mouse.move(to.x, to.y, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(450)
}

/** Screen point of a zone's centre, computed from any object resting in it, or a named anchor. */
export async function zoneAnchor(page: Page, zoneId: string) {
  const p = await page.evaluate((z) => (window as unknown as { __ww: { zone(id: string): { x: number; y: number } | null } }).__ww.zone(z), zoneId)
  if (!p) throw new Error(`zone ${zoneId} not on screen`)
  return p
}
