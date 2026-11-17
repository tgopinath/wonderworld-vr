import { expect, test } from '@playwright/test'
import { createProfile, settle } from './helpers'

test('welcome → profile → classroom, keyboard navigation moves the player', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Start learning' })).toBeVisible()
  await expect(page.getByRole('status').first()).toBeVisible() // device indicator

  await createProfile(page, 'Asha')
  await page.getByRole('button', { name: /Enter the classroom/ }).click()
  await expect(page).toHaveURL(/\/play/)
  await expect(page.locator('canvas')).toBeVisible()
  await settle(page)
  await expect(page.getByTestId('caption')).toContainText('Pip')

  const cam = () => page.evaluate(() => (window as unknown as { __ww: { camera(): { position: number[] } } }).__ww.camera().position)
  const before = await cam()
  await page.keyboard.down('w')
  await page.waitForTimeout(1500)
  await page.keyboard.up('w')
  const after = await cam()
  expect(after[2]!).toBeLessThan(before[2]! - 0.15) // walked forward (−z); headless GPU emulation renders few fps
})

test('locked worlds are clearly marked and not playable', async ({ page }) => {
  await createProfile(page, 'Ravi')
  await expect(page.getByText('Coming soon')).toHaveCount(5)
  await expect(page.getByRole('button', { name: 'Start' })).toHaveCount(1)
})

test('parent gate protects the dashboard', async ({ page }) => {
  await createProfile(page, 'Mira')
  await page.goto('/parent')
  await page.getByLabel('Answer').fill('1')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('not quite right')).toBeVisible()
  await expect(page.getByText('Learning dashboard')).toHaveCount(0)
})
