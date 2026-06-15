import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const backendPort = process.env.BACKEND_PORT || '5001';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.visual.spec.js',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      // Allow up to 0.2% pixel difference for anti-aliasing / font rendering
      maxDiffPixelRatio: 0.002,
      animations: 'disabled',
    },
  },
  globalSetup: './tests/e2e/helpers/pilot-global-setup.js',
  snapshotDir: './tests/e2e/snapshots',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-visual', open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
    // Disable CSS animations/transitions for stable screenshots
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },
  webServer: [
    {
      command: `QA_DISABLE_RATE_LIMIT=1 AUTO_SEED_PILOT_ACCOUNTS=1 PORT=${backendPort} node ../server.js`,
      port: Number(backendPort),
      reuseExistingServer: true,
      timeout: 30_000,
      env: {
        NODE_ENV: 'test',
        QA_DISABLE_RATE_LIMIT: '1',
        AUTO_SEED_PILOT_ACCOUNTS: '1',
      },
    },
    {
      command: 'npm run dev',
      port: 3000,
      reuseExistingServer: true,
      timeout: 15_000,
    },
  ],
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
