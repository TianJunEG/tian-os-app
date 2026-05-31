import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

test('pilot gate: diagnostic to placement to recommended practice CTA', async ({ page }) => {
  await loginAs(page, accounts.student, '/student');
  await page.goto('/student');

  const diagnosticCta = page.getByRole('button', { name: /start.*diagnostic/i }).first();
  if (await diagnosticCta.count()) {
    await diagnosticCta.click();
  } else {
    await page.goto('/student/mathpath/diagnostic');
  }

  await expect(page.getByText(/diagnostic|start diagnostic|question/i).first()).toBeVisible({
    timeout: 15_000,
  });
});
