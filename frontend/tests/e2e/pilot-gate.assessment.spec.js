import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

test('pilot gate: assessment lifecycle surface is reachable', async ({ page }) => {
  await loginAs(page, accounts.student, '/student');

  await page.goto('/student/mathpath/assessment');
  await expect(page.getByText(/assessment|time limit|start assessment|submit/i).first()).toBeVisible({
    timeout: 15_000,
  });
});
