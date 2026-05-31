import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

test('pilot gate: student practice critical path', async ({ page }) => {
  await loginAs(page, accounts.student, '/student');

  await page.goto('/student');
  await expect(page.getByRole('link', { name: /mathpath/i })).toBeVisible();

  const continuePractice = page.getByRole('button', { name: /continue practice/i }).first();
  const openPractice = page.getByRole('button', { name: /open practice/i }).first();
  if (await continuePractice.count()) {
    await continuePractice.click();
  } else if (await openPractice.count()) {
    await openPractice.click();
  } else {
    await page.goto('/student/practice');
  }

  // Smoke-level assertion for pilot gate: user can reach a usable practice surface.
  await expect(page.getByText(/practice|question|submit|answer/i).first()).toBeVisible({
    timeout: 15_000,
  });
});
