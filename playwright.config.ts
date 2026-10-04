import { defineConfig, devices } from '@playwright/test'

// Parallel checkouts share the box: E2E_PORT moves the preview server (and
// its strictPort) off the default 4173 without touching the specs.
const port = Number(process.env.E2E_PORT ?? 4173)

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${port}`,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
