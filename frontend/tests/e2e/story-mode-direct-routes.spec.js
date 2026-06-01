import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

const storyFlagEnabled = process.env.VITE_ENABLE_FRACTIONS_STORY_MODE === 'true'
  || process.env.ENABLE_FRACTIONS_STORY_MODE === 'true';

const viewports = [
  { name: 'mobile-360', width: 360, height: 740 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const routes = [
  { name: 'default', path: '/student/mathpath/fractions/story' },
  { name: 'F025', path: '/student/mathpath/fractions/story/F025' },
  { name: 'F026', path: '/student/mathpath/fractions/story/F026' },
];

test.describe('Fractions Story Mode direct route QA', () => {
  test.skip(!storyFlagEnabled, 'Set VITE_ENABLE_FRACTIONS_STORY_MODE=true to run Story Mode browser QA.');

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.speechSynthesis = {
        speak: () => {},
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        getVoices: () => [],
      };
      window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
        this.text = text;
        this.rate = 1;
      };
    });
  });

  for (const viewport of viewports) {
    for (const route of routes) {
      test(`${route.name} route fits ${viewport.name}`, async ({ page }, testInfo) => {
        const consoleErrors = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await loginAs(page, accounts.student, route.path);
        await expect(page.getByText('Problem Solving Story').first()).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText(/Story support/i)).toBeVisible();
        await expect(
          page.getByText(/^Listen$/).or(page.getByText(/Audio is unavailable/i)).first()
        ).toBeVisible();
        await expect(page.getByText(/Model prompt/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /continue|complete story/i })).toBeVisible();

        const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        expect(horizontalOverflow).toBeFalsy();
        expect(consoleErrors).toEqual([]);

        await page.screenshot({
          path: testInfo.outputPath(`story-${route.name}-${viewport.name}.png`),
          fullPage: true,
        });
      });
    }
  }

  test('invalid skill route shows safe choices', async ({ page }) => {
    await loginAs(page, accounts.student, '/student/mathpath/fractions/story/F099');
    await expect(page.getByText(/Choose a supported Story Mode skill/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Start F025 Story/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Start F026 Story/i })).toBeVisible();
  });
});
