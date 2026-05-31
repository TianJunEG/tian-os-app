import { test } from '@playwright/test';

test('student mathpath screenshot', async ({ page }) => {
  const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
  const email = process.env.STUDENT_EMAIL || 'demo.student@tianos.test';
  const password = process.env.STUDENT_PASSWORD || 'Passw0rd!';
  const output = process.env.OUTPUT_PATH || '/private/tmp/mathpath-student-dashboard.png';

  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/student|\/student\/mathpath/, { timeout: 15000 });

  await page.goto(`${baseUrl}/student/mathpath`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: output, fullPage: true });
});
