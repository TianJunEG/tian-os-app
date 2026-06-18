import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

const priorityDomains = [
  { name: 'Fractions', map: '/student/mathpath/path', practice: '/student/mathpath/practice/recommended-pathway' },
  { name: 'Decimals', map: '/student/mathpath/decimals', practice: '/student/mathpath/decimals/practice' },
  { name: 'Percentages', map: '/student/mathpath/percentages', practice: '/student/mathpath/percentages/practice' },
  { name: 'Ratio & Rate', map: '/student/mathpath/ratio-rate', practice: '/student/mathpath/ratio-rate/practice' },
  { name: 'Number Sense', map: '/student/mathpath/number-sense', practice: '/student/mathpath/number-sense/practice' },
  { name: 'Operations', map: '/student/mathpath/operations', practice: '/student/mathpath/operations/practice' },
];

const extendedDomains = [
  { name: 'Algebra', map: '/student/mathpath/algebra', practice: '/student/mathpath/algebra/practice' },
  { name: 'Area & Perimeter', map: '/student/mathpath/area-perimeter', practice: '/student/mathpath/area-perimeter/practice' },
  { name: 'Circles', map: '/student/mathpath/circles', practice: '/student/mathpath/circles/practice' },
  { name: 'Geometry', map: '/student/mathpath/geometry', practice: '/student/mathpath/geometry/practice' },
  { name: 'Measurement', map: '/student/mathpath/measurement', practice: '/student/mathpath/measurement/practice' },
  { name: 'Money', map: '/student/mathpath/money', practice: '/student/mathpath/money/practice' },
  { name: 'Statistics', map: '/student/mathpath/statistics', practice: '/student/mathpath/statistics/practice' },
  { name: 'Time', map: '/student/mathpath/time', practice: '/student/mathpath/time/practice' },
  { name: 'Volume', map: '/student/mathpath/volume', practice: '/student/mathpath/volume/practice' },
];

function hardErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

async function expectStudentRoute(page, path) {
  await loginAs(page, accounts.student, path);
  await expect(page.locator('body')).not.toContainText(/route not found|404|page not found/i);
  await expect(page).not.toHaveURL(/\/login$/);
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ));
  expect(overflow, 'page should not create horizontal overflow').toBeLessThanOrEqual(1);
}

async function expectPracticeReady(page, path) {
  await expectStudentRoute(page, path);
  await expect(page.getByText(/Question\s+1\s+of/i)).toBeVisible({ timeout: 15_000 });

  const answerControls = page.locator([
    'input[type="text"]',
    'input[type="number"]',
    '[role="radio"]',
    'button:has-text("Tap to enter")',
    'button:has-text("Next")',
    'button:has-text("Submit answer")',
  ].join(', '));
  await expect(answerControls.first()).toBeVisible();
}

test.describe('MathPath student-facing QA', () => {
  test.describe('priority pilot domains', () => {
    for (const domain of priorityDomains) {
      test(`${domain.name} map and practice are student-usable`, async ({ page }) => {
        const errors = hardErrors(page);
        await expectStudentRoute(page, domain.map);
        await expectNoHorizontalOverflow(page);
        await expectPracticeReady(page, domain.practice);
        expect(errors, `${domain.name} should not emit hard browser errors`).toEqual([]);
      });
    }
  });

  test.describe('extended domain smoke', () => {
    for (const domain of extendedDomains) {
      test(`${domain.name} map and practice smoke`, async ({ page }) => {
        test.setTimeout(25_000);
        const errors = hardErrors(page);
        await expectStudentRoute(page, domain.map);
        await expectPracticeReady(page, domain.practice);
        expect(errors, `${domain.name} should not emit hard browser errors`).toEqual([]);
      });
    }
  });

  test('working evidence opens without backend failure', async ({ page }) => {
    const failedWorkingCalls = [];
    page.on('response', async (response) => {
      if (response.url().includes('/api/') && response.url().includes('working') && response.status() >= 400) {
        failedWorkingCalls.push(`${response.status()} ${response.url()}`);
      }
    });

    await expectPracticeReady(page, '/student/mathpath/practice/recommended-pathway');
    await page.getByRole('button', { name: /open working/i }).click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10_000 });
    expect(failedWorkingCalls).toEqual([]);
  });

  test('mistake review remains reachable after a wrong decimal answer', async ({ page }) => {
    await expectPracticeReady(page, '/student/mathpath/decimals/practice');
    const input = page.locator('input[type="text"]').first();
    await input.fill('999');
    await page.getByRole('button', { name: /^Next$/i }).click();
    await expectStudentRoute(page, '/student/mathpath/mistakes');
    await expect(page.getByText(/Mistake-to-Mastery|Review mistakes|to review/i).first()).toBeVisible();
  });

  test.describe('mobile smoke', () => {
    const mobileRoutes = [
      '/student',
      '/student/mathpath',
      '/student/mathpath/practice/recommended-pathway',
      '/student/mathpath/decimals/practice',
      '/student/mathpath/percentages/practice',
      '/student/mathpath/ratio-rate/practice',
      '/student/mathpath/number-sense/practice',
      '/student/mathpath/operations/practice',
    ];

    for (const route of mobileRoutes) {
      test(`${route} has no mobile horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await expectStudentRoute(page, route);
        await expectNoHorizontalOverflow(page);
      });
    }
  });
});
