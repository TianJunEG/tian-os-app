import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const apiBase = process.env.PLAYWRIGHT_API_BASE_URL || process.env.VITE_API_URL || 'http://localhost:5001/api';

function portFromUrl(url, fallback) {
  try {
    const parsed = new URL(url);
    if (parsed.port) return parsed.port;
    return parsed.protocol === 'https:' ? '443' : '80';
  } catch {
    return fallback;
  }
}

const frontendPort = portFromUrl(baseURL, '3000');
const backendPort = process.env.BACKEND_PORT || portFromUrl(apiBase, '5001');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  globalSetup: './tests/e2e/helpers/pilot-global-setup.js',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-pilot', open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
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
        MONGODB_URI: process.env.MONGODB_URI || '',
        JWT_SECRET: process.env.JWT_SECRET || 'qa-test-secret',
      },
    },
    {
      command: `VITE_API_URL=${apiBase} npm run dev -- --host 0.0.0.0 --port ${frontendPort}`,
      port: Number(frontendPort),
      reuseExistingServer: true,
      timeout: 15_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
