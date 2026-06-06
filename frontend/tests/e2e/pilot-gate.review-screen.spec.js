import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

test('pilot gate: question review route renders', async ({ page }) => {
  await loginAs(page, accounts.student, '/student');
  await page.goto('/student/mathpath/review');
  await expect(page.locator('text=Route not found')).toHaveCount(0);
  await expect(page.getByText(/question review|mistake-to-mastery|review mistakes|recent mistakes|No review data found yet|Question Review/i).first()).toBeVisible({
    timeout: 15_000,
  });
});
