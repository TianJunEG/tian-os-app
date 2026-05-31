import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

test('pilot gate: working upload route renders for student', async ({ page }) => {
  await loginAs(page, accounts.student, '/student');

  await page.goto('/student/mathpath/working/upload');
  await expect(page.locator('text=Route not found')).toHaveCount(0);
  await expect(page.getByText(/working|upload|paper|stylus/i).first()).toBeVisible({
    timeout: 15_000,
  });
});
