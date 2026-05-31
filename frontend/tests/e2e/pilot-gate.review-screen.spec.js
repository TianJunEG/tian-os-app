import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

test('pilot gate: question review route renders', async ({ page }) => {
  await loginAs(page, accounts.student, '/student');
  await page.goto('/student/mathpath/review');
  await expect(page.locator('text=Route not found')).toHaveCount(0);
  await expect(page.getByText(/review|question|answer|solution/i).first()).toBeVisible({
    timeout: 15_000,
  });
});

