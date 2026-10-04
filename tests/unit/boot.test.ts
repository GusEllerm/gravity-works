import { test, expect } from 'vitest'
import { boot } from '../../src/boot.ts'

test('boot renders the placeholder shell', () => {
  const el = { innerHTML: '' } as HTMLElement
  boot(el)
  expect(el.innerHTML).toContain('Gravity Works')
})
