import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

// Shared helper: wait for page to settle before screenshotting
async function settle(page) {
  await page.waitForLoadState('networkidle');
  // Let CSS transitions finish (they're disabled via reducedMotion but give
  // React one extra tick to flush any pending state updates)
  await page.waitForTimeout(300);
}

// ── Unauthenticated screens ──────────────────────────────────────────────────

test('visual: login page', async ({ page }) => {
  await page.goto('/login');
  await settle(page);
  await expect(page).toHaveScreenshot('login.png');
});

// ── Student screens ──────────────────────────────────────────────────────────

test('visual: student dashboard', async ({ page }) => {
  await loginAs(page, accounts.student, '/student');
  await settle(page);
  await expect(page).toHaveScreenshot('student-dashboard.png');
});

test('visual: student mathpath fractions map', async ({ page }) => {
  await loginAs(page, accounts.student, '/student/mathpath');
  await settle(page);
  await expect(page).toHaveScreenshot('student-mathpath-map.png');
});

// ── Parent screens ───────────────────────────────────────────────────────────

test('visual: parent dashboard', async ({ page }) => {
  await loginAs(page, accounts.parent, '/parent');
  await settle(page);
  await expect(page).toHaveScreenshot('parent-dashboard.png');
});

// ── Tutor screens ────────────────────────────────────────────────────────────

test('visual: tutor dashboard', async ({ page }) => {
  await loginAs(page, accounts.tutor, '/tutor');
  await settle(page);
  await expect(page).toHaveScreenshot('tutor-dashboard.png');
});
