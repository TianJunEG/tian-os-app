import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

test.describe('MathPath working evidence QA', () => {
  test('MathPath Home uses the full Fractions skill denominator', async ({ page }) => {
    await loginAs(page, accounts.student, '/student/mathpath');
    await expect(page.getByText(/\d+\/26 skills mastered/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test('PracticeSession saves and deletes full-screen working evidence', async ({ page }) => {
    await loginAs(page, accounts.student, '/student/mathpath/practice/recommended-pathway');
    await expect(page.getByText(/Question\s+\d+\s+of\s+\d+/i)).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /Open full-screen working|Open Working/i }).first().click();
    await expect(page.getByRole('dialog', { name: /Full-screen working/i })).toBeVisible();

    const dialog = page.getByRole('dialog', { name: /Full-screen working/i });
    const canvas = page.getByLabel('Full-screen working canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    const startX = box.x + Math.min(box.width - 80, Math.max(120, box.width * 0.65));
    const startY = box.y + Math.min(box.height - 80, Math.max(160, box.height * 0.45));
    await canvas.dispatchEvent('pointerdown', {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: startX,
      clientY: startY,
    });
    await canvas.dispatchEvent('pointermove', {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: startX + 64,
      clientY: startY + 28,
    });
    await canvas.dispatchEvent('pointermove', {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: startX + 128,
      clientY: startY + 56,
    });
    await canvas.dispatchEvent('pointerup', {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: 0,
      clientX: startX + 128,
      clientY: startY + 56,
    });
    const saveWorking = dialog.getByRole('button', { name: /Save Working/i });
    await expect(saveWorking).toBeEnabled();
    await saveWorking.click();

    await expect(page.getByAltText(/Saved working preview/i)).toBeVisible();
    await expect(page.getByText(/submitted with your (typed )?answer/i)).toBeVisible();

    await page.getByRole('button', { name: /Delete|Remove working/i }).click();
    await expect(page.getByText(/No (full-screen )?working saved yet/i)).toBeVisible();
  });
});
