import { defineConfig, devices } from '@playwright/test'

// The stage-3 filmstrip gate owns port 4210: it samples frames on
// wall-clock 250 ms boundaries and cannot share a preview server (or a
// box) with the parallel suite. Run: npm run test:e2e:filmstrip
const port = Number(process.env.E2E_FILMSTRIP_PORT ?? 4210)

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: 'filmstrip.spec.ts',
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: `http://localhost:${port}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
