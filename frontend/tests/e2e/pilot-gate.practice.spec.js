import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

test('pilot gate: student practice critical path', async ({ page }) => {
  await loginAs(page, accounts.student, '/student/mathpath');
  await page.goto('/student/mathpath');
  await expect(page.getByText(/MathPath|Fractions|Learning Paths/i).first()).toBeVisible();

  // Continue Learning / Mastery Check route to a practice surface.
  // "Start Fractions Check-In" intentionally excluded — it leads to the
  // diagnostic flow, not a practice session.
  const continueLearning = page.getByRole('button', { name: /continue learning/i }).first();
  const startLearning = page.getByRole('button', { name: /start mastery check|start practice test/i }).first();
  if (await continueLearning.count()) {
    await continueLearning.click();
  } else if (await startLearning.count()) {
    await startLearning.click();
  } else {
    await page.goto('/student/mathpath/practice/recommended-pathway');
  }

  // Assert question surface + timed capture signal + answer action contract.
  await expect(page.getByText(/Question\s+\d+\s+of\s+\d+|Question\s+\d+ of/i).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/\d+s/).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /submit answer|check answer|next question|continue/i })).toBeVisible({ timeout: 10_000 });
});
