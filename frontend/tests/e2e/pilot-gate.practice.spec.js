import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

test('pilot gate: student practice critical path', async ({ page }) => {
  await loginAs(page, accounts.student, '/student/mathpath');
  await page.goto('/student/mathpath');
  await expect(page.getByRole('link', { name: /^MathPath$/ })).toBeVisible();

  // Continue Learning should route to a practice-capable session surface.
  const continueLearning = page.getByRole('button', { name: /continue learning/i }).first();
  const checkIn = page.getByRole('button', { name: /start fractions check-in|start fractions diagnostic/i }).first();
  if (await continueLearning.count()) {
    await continueLearning.click();
  } else if (await checkIn.count()) {
    await checkIn.click();
  } else {
    await page.goto('/student/mathpath/practice/recommended-pathway');
  }

  // Assert question surface + timed capture signal + answer action contract.
  await expect(page.getByText(/Question\s+\d+\s+of\s+\d+/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/\d+s/).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /submit answer|check answer/i })).toBeVisible({ timeout: 10_000 });
});
