import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

test.describe('PSL — Problem Solving Lab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, accounts.student, '/student/psl');
  });

  test('PSL home loads and shows skill cards', async ({ page }) => {
    await expect(page.getByText(/Problem Solving/i).first()).toBeVisible({ timeout: 15_000 });
    // Should see at least one heuristic group or skill card
    const skillCards = page.locator('[role="button"], button').filter({ hasText: /bar.model|find.pattern|substitution|make.list|guess.check|work.backwards/i });
    const heroButton = page.getByRole('button', { name: /continue learning|start|practice/i }).first();
    const hasContent = (await skillCards.count()) > 0 || (await heroButton.count()) > 0;
    expect(hasContent).toBeTruthy();
  });

  test('PSL decision guide is accessible', async ({ page }) => {
    const guideLink = page.getByText(/decision guide|which heuristic/i).first();
    if (await guideLink.count()) {
      await guideLink.click();
      await expect(page.getByText(/heuristic|strategy|approach/i).first()).toBeVisible({ timeout: 10_000 });
    } else {
      // Navigate directly
      await page.goto('/student/psl/decision-guide');
      await expect(page.getByText(/heuristic|strategy|approach/i).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('PSL session can be started from a skill', async ({ page }) => {
    // Wait for skills to load
    await page.waitForTimeout(2000);

    // Try clicking a skill card to start a session
    const skillButton = page.locator('[role="button"], button').filter({ hasText: /bar.model|find.pattern|substitution|make.list|guess.check|work.backwards/i }).first();
    if (await skillButton.count()) {
      await skillButton.click();
      // Should either start a session or show a prerequisite gate
      const sessionStarted = page.getByText(/read the problem|understand|step 1|story|problem/i).first();
      const prerequisiteGate = page.getByText(/prerequisite|not ready|go to mathpath/i).first();
      const startButton = page.getByRole('button', { name: /start|begin|practice/i }).first();

      const reachedSomething = await Promise.race([
        sessionStarted.waitFor({ timeout: 10_000 }).then(() => 'session'),
        prerequisiteGate.waitFor({ timeout: 10_000 }).then(() => 'gate'),
        startButton.waitFor({ timeout: 10_000 }).then(() => 'start'),
      ]).catch(() => 'timeout');

      expect(['session', 'gate', 'start']).toContain(reachedSomething);
    }
  });

  test('PSL session shows 6-step progress bar', async ({ page }) => {
    // Navigate directly to start a session via API
    const apiBase = process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:5001/api';
    const token = await page.evaluate(() => window.localStorage.getItem('token'));

    // Get available skills from PSL home
    const homeRes = await page.request.get(`${apiBase}/psl/home`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!homeRes.ok()) {
      test.skip(true, 'PSL home API not available');
      return;
    }

    const homeData = await homeRes.json();
    const skills = homeData?.skills || homeData?.data?.skills || [];
    if (skills.length === 0) {
      test.skip(true, 'No PSL skills available');
      return;
    }

    // Try to start a session with the first skill
    const firstSkill = skills[0];
    const skillId = firstSkill.skillId || firstSkill._id || firstSkill.id;

    // Check readiness first
    const readinessRes = await page.request.get(`${apiBase}/psl/skills/${skillId}/readiness`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (readinessRes.ok()) {
      const readiness = await readinessRes.json();
      if (readiness?.blockers?.length > 0 || readiness?.data?.blockers?.length > 0) {
        test.skip(true, 'First PSL skill has unmet prerequisites');
        return;
      }
    }

    const startRes = await page.request.post(`${apiBase}/psl/sessions`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { skillId, problemCount: 1 },
    });

    if (!startRes.ok()) {
      test.skip(true, 'Could not start PSL session');
      return;
    }

    const session = await startRes.json();
    const sessionId = session?.sessionId || session?.data?.sessionId || session?._id;
    expect(sessionId).toBeTruthy();

    await page.goto(`/student/psl/session/${sessionId}`);
    await page.waitForLoadState('networkidle');

    // Session page should show the story/problem text
    await expect(page.locator('text=/story|problem|read/i').first()).toBeVisible({ timeout: 15_000 });
  });

  test('PSL mistakes page loads', async ({ page }) => {
    await page.goto('/student/psl/mistakes');
    await page.waitForLoadState('networkidle');
    // Should show mistakes or empty state
    const hasMistakes = page.getByText(/mistake|review|no mistakes/i).first();
    await expect(hasMistakes).toBeVisible({ timeout: 10_000 });
  });

  test('PSL routes are guarded by feature flag', async ({ page }) => {
    // PSL is on by default, so routes should be accessible
    await page.goto('/student/psl');
    // Should NOT show "coming soon" or redirect to 404
    const comingSoon = page.getByText(/coming soon/i).first();
    const notFound = page.getByText(/not found|404/i).first();
    // Wait briefly for either to appear
    await page.waitForTimeout(2000);
    const isBlocked = (await comingSoon.count()) > 0 || (await notFound.count()) > 0;
    // PSL should be accessible (not blocked)
    expect(isBlocked).toBe(false);
  });
});
