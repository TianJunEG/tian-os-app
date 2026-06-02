import { test, expect } from '@playwright/test';
import { accounts } from './helpers/auth';

const apiBase = process.env.PLAYWRIGHT_API_BASE_URL || 'http://127.0.0.1:5001/api';

const viewports = [
  { name: 'mobile-360', width: 360, height: 740 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const routes = [
  { name: 'default', path: '/student/mathpath/fractions/story' },
  { name: 'F025', path: '/student/mathpath/fractions/story/F025' },
  { name: 'F026', path: '/student/mathpath/fractions/story/F026' },
];

test.describe('Fractions Story Mode direct route QA', () => {
  let authToken = '';

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${apiBase}/auth/login`, {
      data: { email: accounts.student.email, password: accounts.student.password },
    });
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    authToken = payload?.token || '';
    expect(authToken).toBeTruthy();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.speechSynthesis = {
        speak: () => {},
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        getVoices: () => [],
      };
      window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
        this.text = text;
        this.rate = 1;
      };
    });
    await page.addInitScript((token) => {
      window.localStorage.setItem('token', token);
    }, authToken);
  });

  for (const viewport of viewports) {
    for (const route of routes) {
      test(`${route.name} route fits ${viewport.name}`, async ({ page }, testInfo) => {
        const consoleErrors = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route.path);
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(/Fraction Rescue Mission|Remainder Rescue Mission/i).first()).toBeVisible();
        await expect(page.getByText(/Scene 1 of/i)).toBeVisible();
        await expect(page.getByLabel(/Story problem/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Need a hint/i })).toBeVisible();
        await expect(page.getByTestId('story-visual-model').first()).toBeVisible();
        await expect(page.getByText(/Problem Solving Story is not available yet/i)).toHaveCount(0);
        await expect(
          page.getByText(/^Listen$/).or(page.getByText(/Audio is unavailable/i)).first()
        ).toBeVisible();
        await expect(page.getByRole('button', { name: /Check Answer/i })).toBeVisible();

        const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        expect(horizontalOverflow).toBeFalsy();
        expect(consoleErrors).toEqual([]);

        await page.screenshot({
          path: testInfo.outputPath(`story-${route.name}-${viewport.name}.png`),
          fullPage: true,
        });
      });
    }
  }

  test('invalid skill route shows safe choices', async ({ page }) => {
    await page.goto('/student/mathpath/fractions/story/F099');
    await expect(page.getByText(/Choose a supported Story Mode skill/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Start F025 Story/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Start F026 Story/i })).toBeVisible();
  });

  test('unsupported story domain shows coming soon state', async ({ page }) => {
    await page.goto('/student/mathpath/geometry/story');
    await expect(page.getByText(/Story Mode for this topic is coming soon/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Start Fractions Story/i })).toBeVisible();
  });
});
