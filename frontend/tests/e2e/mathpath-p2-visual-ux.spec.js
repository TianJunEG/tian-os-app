import { test, expect } from '@playwright/test';
import { accounts } from './helpers/auth';

const apiBase = process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:5001/api';

const viewports = [
  { name: 'mobile', size: { width: 390, height: 844 } },
  { name: 'desktop', size: { width: 1280, height: 800 } },
];

const practiceRoutes = [
  {
    name: 'percentages',
    path: '/student/mathpath/percentages/practice?skill=P001',
    title: /Percentages Practice/i,
  },
  {
    name: 'ratio-rate',
    path: '/student/mathpath/ratio-rate/practice?skill=R001',
    title: /Ratio & Rate Practice/i,
  },
  {
    name: 'statistics',
    path: '/student/mathpath/statistics/practice?skill=ST001',
    title: /Statistics Practice/i,
  },
  {
    name: 'volume',
    path: '/student/mathpath/volume/practice?skill=VL001',
    title: /Volume & Capacity Practice/i,
  },
];

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ));
  expect(overflow, 'page should not create horizontal overflow').toBeLessThanOrEqual(1);
}

async function authenticate(page) {
  const response = await page.request.post(`${apiBase}/auth/login`, {
    data: { email: accounts.student.email, password: accounts.student.password },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(Boolean(payload?.token)).toBeTruthy();
  await page.addInitScript((token) => {
    window.localStorage.setItem('token', token);
  }, payload.token);
}

test.describe('MathPath P2 visual UX smoke', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  for (const viewport of viewports) {
    for (const route of practiceRoutes) {
      test(`pilot gate: ${route.name} practice has no ${viewport.name} overflow`, async ({ page }) => {
        await page.setViewportSize(viewport.size);
        await page.goto(route.path);

        await expect(page.getByText(route.title)).toBeVisible();
        await expect(page.getByText(/Question\s+1\s+of/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /open working/i })).toBeVisible();
        await expect(page.getByTestId('question-diagram').locator('svg')).toBeVisible();
        await expectNoHorizontalOverflow(page);
      });
    }
  }
});
