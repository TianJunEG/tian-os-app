import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

const pilotRoutes = [
  { path: '/student', name: 'Student Dashboard' },
  { path: '/student/mathpath', name: 'MathPath Home' },
  { path: '/student/mathpath/practice/recommended-pathway', name: 'Recommended Practice' },
  { path: '/student/mathpath/mistakes', name: 'Mistakes' },
  { path: '/student/mathpath/mistakes/review', name: 'Mistake Review' },
  { path: '/student/progress', name: 'Progress' },
  { path: '/student/profile', name: 'Profile' },
  { path: '/student/mathpath/working/upload', name: 'Working Upload' },
  { path: '/student/mathpath/working/review', name: 'Working Review' },
];

const gatedRoutes = [
  {
    path: '/student/mathpath/assessment',
    safeCopy: /Test Mode is not available for this pilot yet/i,
  },
  {
    path: '/student/mathpath/fluency',
    safeCopy: /Fluency practice is not available yet\. Continue learning to unlock it/i,
  },
  {
    path: '/student/mathpath/fractions/model-trainer',
    safeCopy: /Model Trainer is not available for this pilot yet/i,
  },
];

const forbiddenVisibleCopy = [
  /Route not found/i,
  /Run npm run/i,
  /\bseed\b/i,
  /demo-student/i,
  /\bfake\b/i,
  /placeholder mistake/i,
  /Question unavailable/i,
  /\bundefined\b/i,
  /\bNaN\b/,
];

const forbiddenActiveCtaCopy = [
  /Fluency Challenge/i,
  /Mastery Check/i,
  /Open model trainer/i,
  /Story Mode/i,
  /SciencePath/i,
  /Worksheet/i,
];

const forbiddenActiveHref = [
  /\/student\/mathpath\/fluency/i,
  /\/student\/mathpath\/assessment/i,
  /\/student\/mathpath\/fractions\/model-trainer/i,
  /\/student\/mathpath\/fractions\/story/i,
  /\/student\/science/i,
  /\/student\/worksheets/i,
];

async function visibleBodyText(page) {
  return page.locator('body').innerText();
}

async function expectNoForbiddenVisibleCopy(page) {
  const text = await visibleBodyText(page);
  for (const pattern of forbiddenVisibleCopy) {
    expect(text, `forbidden visible copy matched ${pattern}`).not.toMatch(pattern);
  }
}

async function expectPilotRouteHealthy(page, route) {
  await page.goto(route.path);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
  await expectNoForbiddenVisibleCopy(page);
}

async function expectNoActiveGatedCtas(page) {
  for (const pattern of forbiddenActiveCtaCopy) {
    await expect(page.getByRole('link', { name: pattern })).toHaveCount(0);
    await expect(page.getByRole('button', { name: pattern })).toHaveCount(0);
  }

  const hrefs = await page.locator('a:visible').evaluateAll((links) => (
    links
      .map((link) => link.getAttribute('href') || '')
      .filter(Boolean)
  ));
  for (const href of hrefs) {
    for (const pattern of forbiddenActiveHref) {
      expect(href, `active pilot CTA points to gated route ${href}`).not.toMatch(pattern);
    }
  }
}

test.describe('pilot visible student routes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, accounts.student, '/student');
  });

  for (const route of pilotRoutes) {
    test(`pilot visible route loads: ${route.name}`, async ({ page }) => {
      await expectPilotRouteHealthy(page, route);
    });
  }

  test('visible student CTAs stay inside the stable pilot route set', async ({ page }) => {
    for (const route of pilotRoutes.filter((item) => !item.path.includes('/practice/'))) {
      await expectPilotRouteHealthy(page, route);
      await expectNoActiveGatedCtas(page);
    }
  });

  for (const route of gatedRoutes) {
    test(`direct gated route shows safe unavailable state: ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByText(route.safeCopy)).toBeVisible();
      await expectNoForbiddenVisibleCopy(page);
    });
  }
});
