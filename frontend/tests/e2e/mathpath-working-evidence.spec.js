import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

test.describe('MathPath working evidence QA', () => {
  test('MathPath Home uses the full Fractions skill denominator', async ({ page }) => {
    await loginAs(page, accounts.student, '/student/mathpath');
    await expect(page.getByRole('heading', { name: /Courses/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/\d+\/26 skills mastered/i).first()).toBeVisible();
  });

  test('PracticeSession saves and deletes full-screen working evidence', async ({ page }) => {
    await loginAs(page, accounts.student, '/student/mathpath/practice/recommended-pathway');
    await expect(page.getByText(/Question\s+\d+\s+of\s+\d+/i)).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /Open Working/i }).first().click();
    await expect(page.getByRole('dialog', { name: /Full-screen working/i })).toBeVisible();

    const canvas = page.getByLabel('Full-screen working canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 30, y: 30 },
      targetPosition: { x: 150, y: 120 },
      force: true,
    });
    await expect(page.getByRole('button', { name: /Save Working/i })).toBeEnabled();
    await page.getByRole('button', { name: /Save Working/i }).click();

    await expect(page.getByText(/Saved working/i)).toBeVisible();
    await expect(page.getByText(/submitted with your typed answer/i)).toBeVisible();

    await page.getByRole('button', { name: /Delete/i }).click();
    await expect(page.getByText(/No full-screen working saved yet/i)).toBeVisible();
  });
});
