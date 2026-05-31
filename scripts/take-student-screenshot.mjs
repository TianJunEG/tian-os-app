import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5173';
const EMAIL = process.env.STUDENT_EMAIL || 'demo.student@tianos.test';
const PASSWORD = process.env.STUDENT_PASSWORD || 'Passw0rd!';
const OUTPUT = process.env.OUTPUT_PATH || '/private/tmp/mathpath-student-dashboard.png';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/student|\/student\/mathpath/, { timeout: 15000 });
  await page.goto(`${BASE_URL}/student/mathpath`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  await page.screenshot({ path: OUTPUT, fullPage: true });
  console.log(`Saved screenshot: ${OUTPUT}`);
} finally {
  await browser.close();
}
