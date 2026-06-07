import { test, expect } from '@playwright/test';

const CHILDREN = [
  {
    studentId: 'child-a',
    name: 'Child Alpha',
    level: 'Primary 4',
    overallMastery: 31,
    masteredCount: 3,
    skillsSeen: 11,
    subjects: [{ subject: 'Math', mastered: 3, total: 26, overall: 31 }],
    weakestSkill: 'Alpha Fractions',
    weakestTopic: 'Alpha Topic',
  },
  {
    studentId: 'child-b',
    name: 'Child Beta',
    level: 'Primary 5',
    overallMastery: 82,
    masteredCount: 14,
    skillsSeen: 20,
    subjects: [{ subject: 'Math', mastered: 14, total: 26, overall: 82 }],
    weakestSkill: 'Beta Word Problems',
    weakestTopic: 'Beta Topic',
  },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fulfillJson(route, payload, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

function studentIdFromUrl(url) {
  const parsed = new URL(url);
  return parsed.searchParams.get('studentId') || '';
}

function successCentrePayload(studentId) {
  const isBeta = studentId === 'child-b';
  return {
    studentId,
    successCentre: {
      student: { id: studentId, name: isBeta ? 'Child Beta' : 'Child Alpha' },
      currentStatus: {
        baselineReadiness: isBeta ? 60 : 20,
        currentReadiness: isBeta ? 88 : 42,
        improvement: isBeta ? 28 : 22,
        remainingWeakSkillCount: isBeta ? 1 : 4,
        activeRecoveryPackCount: isBeta ? 2 : 1,
      },
      improvementJourney: {
        baseline: { readinessScore: isBeta ? 60 : 20 },
        current: { readinessScore: isBeta ? 88 : 42, improvement: isBeta ? 28 : 22 },
      },
      topImprovements: [{
        skillId: isBeta ? 'BETA-F010' : 'ALPHA-F010',
        skillName: isBeta ? 'Beta Equivalent Fractions' : 'Alpha Equivalent Fractions',
        beforeScore: isBeta ? 44 : 12,
        currentScore: isBeta ? 88 : 42,
        improvement: isBeta ? 44 : 30,
      }],
      currentConcerns: [{
        skillId: isBeta ? 'BETA-F025' : 'ALPHA-F025',
        skillName: isBeta ? 'Beta Story Problems' : 'Alpha Story Problems',
        currentReadiness: isBeta ? 55 : 24,
        suggestedAction: isBeta ? 'Beta recheck' : 'Alpha recovery',
      }],
      recommendedActions: [{
        type: 'assign_recovery_pack',
        priority: 'high',
        title: isBeta ? 'Beta Recovery Pack' : 'Alpha Recovery Pack',
        reason: isBeta ? 'Beta needs targeted practice.' : 'Alpha needs targeted practice.',
        skillId: isBeta ? 'BETA-F025' : 'ALPHA-F025',
      }],
      recentReports: [{
        type: 'report',
        id: isBeta ? 'beta-report' : 'alpha-report',
        title: isBeta ? 'Beta Progress Report' : 'Alpha Progress Report',
        createdAt: '2026-06-07T00:00:00.000Z',
      }],
      upcomingRechecks: [],
    },
  };
}

function masteryPayload(studentId) {
  const isBeta = studentId === 'child-b';
  return {
    studentId,
    recommended: { skillId: isBeta ? 'F025' : 'F010' },
    records: [
      { skillId: isBeta ? 'F025' : 'F010', status: 'weak', score: isBeta ? 55 : 24 },
      { skillId: isBeta ? 'F011' : 'F001', status: 'mastered', score: isBeta ? 95 : 90 },
    ],
  };
}

async function installParentMocks(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'mock-parent-token');
  });

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path.endsWith('/api/auth/me')) {
      return fulfillJson(route, { user: { id: 'parent-user', role: 'parent', roles: ['parent'], name: 'Parent QA' } });
    }
    if (path.endsWith('/api/context')) {
      return fulfillJson(route, {
        user: { id: 'parent-user', role: 'parent', roles: ['parent'] },
        workspaces: [{ id: 'family-workspace', role: 'parent', name: 'Family' }],
        defaultWorkspaceId: 'family-workspace',
      });
    }
    if (path.endsWith('/api/family/children')) {
      return fulfillJson(route, { children: CHILDREN });
    }
    if (path.includes('/api/family/children/') && path.endsWith('/recommendations')) {
      const childId = path.split('/children/')[1].split('/recommendations')[0];
      if (childId === 'child-a') await delay(400);
      return fulfillJson(route, {
        studentId: childId,
        recommendations: [{
          priority: 'high',
          action: childId === 'child-b' ? 'Beta recommended action' : 'Alpha recommended action',
          reason: childId === 'child-b' ? 'Beta-specific reason' : 'Alpha-specific reason',
          relatedSkillName: childId === 'child-b' ? 'Beta Word Problems' : 'Alpha Fractions',
        }],
      });
    }
    if (path.endsWith('/api/assignments')) {
      const childId = studentIdFromUrl(route.request().url());
      if (childId === 'child-a') await delay(400);
      return fulfillJson(route, {
        assignments: [{
          id: childId === 'child-b' ? 'beta-assignment' : 'alpha-assignment',
          module: 'MathPath',
          subject: 'Math',
          skillNames: [childId === 'child-b' ? 'Beta Practice Pack' : 'Alpha Practice Pack'],
          questionCount: childId === 'child-b' ? 8 : 5,
          status: childId === 'child-b' ? 'completed' : 'not_started',
        }],
      });
    }
    if (path.endsWith('/api/mastery')) {
      const childId = studentIdFromUrl(route.request().url());
      if (childId === 'child-a') await delay(400);
      return fulfillJson(route, masteryPayload(childId));
    }
    if (path.endsWith('/api/mastery/map')) {
      return fulfillJson(route, { topics: [] });
    }
    if (path.endsWith('/api/mastery/diagnostic/latest')) {
      const childId = studentIdFromUrl(route.request().url());
      return fulfillJson(route, {
        result: {
          recommendedStartingSkill: { skillId: childId === 'child-b' ? 'F025' : 'F010', name: childId === 'child-b' ? 'Beta Start Skill' : 'Alpha Start Skill' },
        },
      });
    }
    if (path.endsWith('/api/diagnostics/growth')) {
      const childId = studentIdFromUrl(route.request().url());
      return fulfillJson(route, {
        baseline: { diagnosticSessionId: `${childId}-baseline`, readinessScore: childId === 'child-b' ? 60 : 20, completedAt: '2026-06-01T00:00:00.000Z' },
        latest: { diagnosticSessionId: `${childId}-latest`, readinessScore: childId === 'child-b' ? 88 : 42, completedAt: '2026-06-07T00:00:00.000Z' },
        overallImprovement: childId === 'child-b' ? 28 : 22,
        perSkillGrowth: [{ skillId: childId === 'child-b' ? 'BETA-F025' : 'ALPHA-F010', skillName: childId === 'child-b' ? 'Beta Growth Skill' : 'Alpha Growth Skill', improvement: childId === 'child-b' ? 28 : 22 }],
        remainingWeakSkills: [childId === 'child-b' ? 'Beta Remaining Weak Skill' : 'Alpha Remaining Weak Skill'],
      });
    }
    if (path.endsWith('/api/mathpath-working/review-summary')) {
      return fulfillJson(route, { summary: {} });
    }
    if (path.includes('/api/fluency/student/')) {
      return fulfillJson(route, {});
    }
    if (path.endsWith('/api/mathpath/success-centre/parent')) {
      const childId = studentIdFromUrl(route.request().url());
      if (childId === 'child-a') await delay(400);
      return fulfillJson(route, successCentrePayload(childId));
    }
    if (path.endsWith('/api/worksheets/gen')) {
      const childId = studentIdFromUrl(route.request().url());
      if (childId === 'child-a') await delay(400);
      return fulfillJson(route, {
        worksheets: [{
          id: childId === 'child-b' ? 'beta-worksheet' : 'alpha-worksheet',
          title: childId === 'child-b' ? 'Beta Worksheet' : 'Alpha Worksheet',
          questionCount: childId === 'child-b' ? 12 : 6,
          difficulty: 'medium',
          assignedStatus: 'unassigned',
        }],
      });
    }
    if (path.includes('/api/mathpath/paper-analysis/')) {
      const analysisId = path.split('/paper-analysis/')[1];
      const isBeta = analysisId === 'beta-analysis';
      if (!isBeta) await delay(400);
      return fulfillJson(route, {
        analysis: {
          _id: analysisId,
          studentId: isBeta ? 'child-b' : 'child-a',
          originalFilename: isBeta ? 'Beta Paper.pdf' : 'Alpha Paper.pdf',
          status: 'needs_review',
          weakSkillIds: [isBeta ? 'BETA-F025' : 'ALPHA-F010'],
          detectedQuestions: [{
            questionNumber: '1',
            questionText: isBeta ? 'Beta paper question' : 'Alpha paper question',
            confidence: 0.9,
            detectedSkillIds: [isBeta ? 'BETA-F025' : 'ALPHA-F010'],
          }],
          reportSummary: { totalQuestions: 1, correct: isBeta ? 1 : 0, incorrect: isBeta ? 0 : 1, confidence: 0.9 },
        },
      });
    }

    return fulfillJson(route, {});
  });
}

test.describe('parent child switching isolation', () => {
  test.beforeEach(async ({ page }) => {
    await installParentMocks(page);
  });

  test('Parent Home clears stale recommendations and assignments when switching children', async ({ page }) => {
    await page.goto('/parent?child=child-a');
    await expect(page.getByRole('combobox')).toBeVisible();

    await page.getByRole('combobox').selectOption('child-b');
    await expect(page.getByText('Child Beta · Primary 5')).toBeVisible();
    await expect(page.getByText('Beta recommended action')).toBeVisible();
    await expect(page.getByText('1 of 1 completed')).toBeVisible();
    await expect(page.getByText('Alpha recommended action')).toHaveCount(0);

    await delay(500);
    await expect(page.getByText('Alpha recommended action')).toHaveCount(0);
    await expect(page.getByText('0 of 1 completed')).toHaveCount(0);
  });

  test('Parent Success Centre does not show late Child A data after switching to Child B', async ({ page }) => {
    await page.goto('/parent/success-centre?child=child-a');
    await expect(page.getByRole('combobox')).toBeVisible();

    await page.getByRole('combobox').selectOption('child-b');
    await expect(page.getByText('Child Beta is at 88% readiness')).toBeVisible();
    await expect(page.getByText('Beta Progress Report')).toBeVisible();
    await expect(page.getByText('Beta Recovery Pack')).toBeVisible();
    await expect(page.getByText('Child Alpha is at 42% readiness')).toHaveCount(0);
    await expect(page.getByText('Alpha Progress Report')).toHaveCount(0);

    await delay(500);
    await expect(page.getByText('Child Alpha is at 42% readiness')).toHaveCount(0);
    await expect(page.getByText('Alpha Recovery Pack')).toHaveCount(0);
  });

  test('Parent MathPath Dashboard ignores stale Child A responses after navigating to Child B', async ({ page }) => {
    await page.goto('/parent/children/child-a/mathpath');
    await page.goto('/parent/children/child-b/mathpath');
    await expect(page.getByText('Child Beta')).toBeVisible();
    await expect(page.getByText('Beta Start Skill').first()).toBeVisible();
    await expect(page.getByText('Beta Remaining Weak Skill')).toBeVisible();
    await delay(500);
    await expect(page.getByText('Alpha Start Skill')).toHaveCount(0);
    await expect(page.getByText('Alpha Remaining Weak Skill')).toHaveCount(0);
  });

  test('Worksheets ignore stale Child A responses after navigating to Child B', async ({ page }) => {
    await page.goto('/parent/children/child-a/worksheets');
    await page.goto('/parent/children/child-b/worksheets');
    await expect(page.getByText('Beta Worksheet')).toBeVisible();
    await delay(500);
    await expect(page.getByText('Alpha Worksheet')).toHaveCount(0);
  });

  test('Paper Analysis ignores stale Child A responses after navigating to Child B', async ({ page }) => {
    await page.goto('/parent/children/child-a/mathpath/analyse-paper?analysis=alpha-analysis');
    await page.goto('/parent/children/child-b/mathpath/analyse-paper?analysis=beta-analysis');
    await expect(page.getByText('Beta Paper.pdf')).toBeVisible();
    await expect(page.getByText('Beta paper question').first()).toBeVisible();
    await delay(500);
    await expect(page.getByText('Alpha Paper.pdf')).toHaveCount(0);
    await expect(page.getByText('Alpha paper question')).toHaveCount(0);
  });
});
