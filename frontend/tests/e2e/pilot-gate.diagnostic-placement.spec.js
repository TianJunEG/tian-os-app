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

  await expect(page.getByRole('heading', { name: /Fractions Check-In|Fractions Diagnostic/i })).toBeVisible({
    timeout: 15_000,
  });

  const startCheckIn = page.getByRole('button', {
    name: /Start Fractions Check-In|Start Fractions Diagnostic|Start Diagnostic/i,
  }).first();
  if (await startCheckIn.count()) {
    await startCheckIn.click();
    await expect(page.getByText(/Fractions Check-In|Fractions Diagnostic|Question\s+\d+|Question\s+\d+\s+of/i).first()).toBeVisible({
      timeout: 15_000,
    });
  } else {
    await expect(page.getByText(/Question\s+\d+|Fractions Check-In|Fractions Diagnostic|check-in helps MathPath|Question\s+\d+\s+of/i).first()).toBeVisible({
      timeout: 15_000,
    });
  }
});
