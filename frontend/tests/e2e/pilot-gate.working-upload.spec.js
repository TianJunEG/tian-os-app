import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

test('pilot gate: working upload route renders for student', async ({ page }) => {
  await loginAs(page, accounts.student, '/student');

  await page.goto('/student/mathpath/working/upload');
  await expect(page.locator('text=Route not found')).toHaveCount(0);
  // Direct nav without state renders the session-guard ErrorState ("Start from practice or
  // assessment summary"). Add "session" to the regex so that message is also accepted.
  await expect(page.getByText(/working|upload|paper|stylus|start from|practice|assessment|session/i).first()).toBeVisible({
    timeout: 15_000,
  });
});
