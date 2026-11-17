// Plays real rounds with real mouse drags on the WebGL canvas, then checks
// validation, hints, rewards, persistence after reload, and the parent dashboard.
import { expect, test, type Page } from '@playwright/test'
import { createProfile, drag, press3D, roundInfo, screenOf, settle, zoneAnchor } from './helpers'

// Test-only PIN for this local app (see tests/e2e/README.md).
const TEST_PIN = '2468'

async function enterMath(page: Page) {
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page).toHaveURL(/\/play/)
  await settle(page)
  await expect.poll(async () => (await roundInfo(page)).scene).toBe('math')
}

const countIn = async (page: Page, zone: string) => {
  const info = await roundInfo(page)
  return info.round!.items.filter((it) => it.kind !== 'number' && info.placements![it.id] === zone).length
}

async function moveObjects(page: Page, from: string, to: string, count: number) {
  for (let i = 0; i < count; i++) {
    const info = await roundInfo(page)
    const ids = info.round!.items.filter((it) => it.kind !== 'number' && info.placements![it.id] === from).map((it) => it.id)
    if (!ids.length) throw new Error(`nothing left in ${from}`)
    // Grab the object nearest the camera (lowest on screen) so nothing occludes it.
    const points = await Promise.all(ids.map((id) => screenOf(page, id)))
    const front = points.reduce((best, p) => (p.y > best.y ? p : best))
    const before = await countIn(page, to)
    await drag(page, front, await zoneAnchor(page, to))
    await expect.poll(() => countIn(page, to)).toBe(before + 1)
  }
}

async function dropNumber(page: Page, value: number) {
  const info = await roundInfo(page)
  const block = info.round!.items.find((it) => it.kind === 'number' && it.value === value)!
  await drag(page, await screenOf(page, block.id), await zoneAnchor(page, 'answer'))
}

test('counting: wrong count gives a hint, right count is rewarded and persists', async ({ page }) => {
  await createProfile(page, 'Counter')
  await enterMath(page)
  await press3D(page, 'activity:counting')
  await expect.poll(async () => (await roundInfo(page)).round?.type).toBe('counting')
  await settle(page)

  const target = (await roundInfo(page)).round!.target!
  if (target > 1) {
    await moveObjects(page, 'pile', 'tray', target - 1)
    await press3D(page, 'round:check')
    await expect.poll(async () => (await roundInfo(page)).mistakes).toBe(1)
    await expect(page.getByTestId('caption')).toContainText(/Almost/)
    await moveObjects(page, 'pile', 'tray', 1)
  } else {
    await moveObjects(page, 'pile', 'tray', 1)
  }
  await press3D(page, 'round:check')
  await expect.poll(async () => (await roundInfo(page)).celebration?.stars).toBeGreaterThan(0)
  await expect(page.getByTestId('caption')).toContainText(/Brilliant counting/)

  // Progress survives a full reload.
  await page.reload()
  await page.goto('/worlds')
  await expect(page.getByText('Lv 1/5 · 1 done').first()).toBeVisible()
})

test('addition: combine both baskets, then drop the matching number', async ({ page }) => {
  await createProfile(page, 'Adder')
  await enterMath(page)
  await press3D(page, 'activity:addition')
  await expect.poll(async () => (await roundInfo(page)).round?.type).toBe('addition')
  await settle(page)

  const { a, b } = (await roundInfo(page)).round!
  await moveObjects(page, 'left', 'combined', a!)
  await moveObjects(page, 'right', 'combined', b!)
  await expect.poll(async () => (await roundInfo(page)).phase).toBe('answer')
  await settle(page)

  // A wrong number first → gentle hint, block goes back.
  const wrong = (await roundInfo(page)).round!.items.find((it) => it.kind === 'number' && it.value !== a! + b!)!
  await dropNumber(page, wrong.value!)
  await expect.poll(async () => (await roundInfo(page)).mistakes).toBe(1)

  await dropNumber(page, a! + b!)
  await expect.poll(async () => (await roundInfo(page)).celebration?.stars).toBe(2)
  await expect(page.getByTestId('caption')).toContainText(`${a} + ${b} = ${a! + b!}`)

  // Parent dashboard shows the saved result.
  await page.goto('/parent')
  const q = await page.getByTestId('gate-question').innerText()
  const [x, y] = q.split('×').map((n) => Number(n.trim()))
  await page.getByLabel('Answer').fill(String(x! * y!))
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('PIN', { exact: true }).fill(TEST_PIN)
  await page.getByLabel('Repeat PIN').fill(TEST_PIN)
  await page.getByRole('button', { name: 'Save PIN' }).click()
  await expect(page.getByText('Learning dashboard')).toBeVisible()
  await expect(page.getByTestId('done-addition')).toHaveText('1')
  await expect(page.getByTestId('stat-stars')).toHaveText('2')
})
