import { defineConfig, devices } from '@playwright/test'

// Parallel checkouts share the box: E2E_PORT moves the preview server (and
// its strictPort) off the default 4173 without touching the specs.
const port = Number(process.env.E2E_PORT ?? 4173)

export default defineConfig({
  testDir: 'tests/e2e',
  // the filmstrip gate owns its own port (4210) and config — it samples on
  // wall-clock boundaries and must not share the parallel suite's server
  testIgnore: 'filmstrip.spec.ts',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${port}`,
  },
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      // E2E_SWIFTSHADER=1 reproduces CI's renderer truth on a GPU box (Linux
      // CI has no GPU and renders through SwiftShader); pair with
      // E2E_STARVE_RAF_MS (the specs' rAF-delay harness) for CI frame pacing
      launchOptions: { args: process.env.E2E_SWIFTSHADER === '1' ? ['--use-angle=swiftshader'] : [] },
    },
  }],
  webServer: {
    command: `npm run build && npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
