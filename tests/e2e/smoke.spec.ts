import { test, expect } from '@playwright/test'
import { goto } from './goto.ts'

test('placeholder page loads without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))

  await goto(page, '/')
  await expect(page).toHaveTitle('Gravity Works')
  await expect(page.getByRole('heading', { name: 'Gravity Works' })).toBeVisible()

  expect(errors).toEqual([])
})
