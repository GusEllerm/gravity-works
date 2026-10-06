import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '__capture.spec.ts',
  fullyParallel: false,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4321' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npx vite preview --port 4321 --strictPort', url: 'http://localhost:4321', reuseExistingServer: true, timeout: 60_000 },
})
