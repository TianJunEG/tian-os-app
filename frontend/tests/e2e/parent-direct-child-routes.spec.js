import { test, expect } from '@playwright/test';

const CHILDREN = [
  {
    studentId: 'child-a1',
    name: 'Child Alpha One',
    level: 'Primary 4',
    overallMastery: 35,
    masteredCount: 4,
    skillsSeen: 12,
    subjects: [{ subject: 'Math', mastered: 4, total: 26, overall: 35 }],
  },
  {
    studentId: 'child-a2',
    name: 'Child Alpha Two',
    level: 'Primary 5',
    overallMastery: 76,
    masteredCount: 12,
    skillsSeen: 19,
    subjects: [{ subject: 'Math', mastered: 12, total: 26, overall: 76 }],
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

function requestedStudentId(url) {
  const parsed = new URL(url);
  return parsed.searchParams.get('studentId') || '';
}

function isAllowedStudent(studentId) {
  return CHILDREN.some((child) => child.studentId === studentId);
}

function isA2(studentId) {
  return studentId === 'child-a2';
}

function masteryPayload(studentId) {
  return {
    records: [
      { skillId: isA2(studentId) ? 'A2-F010' : 'A1-F010', status: 'mastered', score: isA2(studentId) ? 92 : 61 },
      { skillId: isA2(studentId) ? 'A2-F025' : 'A1-F025', status: 'weak', score: isA2(studentId) ? 48 : 22 },
    ],
  };
}

function mapPayload(studentId) {
  return {
    topics: [{
      topicId: isA2(studentId) ? 'a2-topic' : 'a1-topic',
      name: isA2(studentId) ? 'A2 Fraction Progress' : 'A1 Fraction Progress',
      masteredCount: isA2(studentId) ? 12 : 4,
      total: 26,
      skills: [
        { skillId: isA2(studentId) ? 'A2-F010' : 'A1-F010', name: isA2(studentId) ? 'A2 Equivalent Fractions' : 'A1 Equivalent Fractions', status: 'mastered' },
        { skillId: isA2(studentId) ? 'A2-F025' : 'A1-F025', name: isA2(studentId) ? 'A2 Story Problems' : 'A1 Story Problems', status: 'weak' },
      ],
    }],
  };
}

function assignmentPayload(studentId) {
  return {
    assignments: [{
      id: isA2(studentId) ? 'assignment-a2' : 'assignment-a1',
      module: 'MathPath',
      subject: 'Math',
      skillNames: [isA2(studentId) ? 'A2 Recovery Skill' : 'A1 Recovery Skill'],
      questionCount: isA2(studentId) ? 8 : 6,
      status: isA2(studentId) ? 'completed' : 'in_progress',
      dueDate: '2026-06-08T00:00:00.000Z',
    }],
  };
}

function worksheetListPayload(studentId) {
  return {
    worksheets: [{
      id: isA2(studentId) ? 'worksheet-a2' : 'worksheet-a1',
      title: isA2(studentId) ? 'A2 Worksheet Pack' : 'A1 Worksheet Pack',
      questionCount: isA2(studentId) ? 9 : 5,
      difficulty: 'medium',
      assignedStatus: 'draft',
    }],
  };
}

function worksheetPayload(worksheetId) {
  const beta = worksheetId === 'worksheet-a2';
  return {
    worksheet: {
      id: worksheetId,
      difficulty: 'medium',
      questionCount: beta ? 9 : 5,
      assignedStatus: 'draft',
      includesSolutions: false,
      content: {
        title: beta ? 'A2 Worksheet Pack' : 'A1 Worksheet Pack',
        skillNames: [beta ? 'A2 Worksheet Skill' : 'A1 Worksheet Skill'],
        studentName: beta ? 'Child Alpha Two' : 'Child Alpha One',
        questions: [{
          n: 1,
          stem: beta ? 'A2 worksheet question' : 'A1 worksheet question',
          answer: beta ? 12 : 6,
        }],
      },
    },
  };
}

function successCentrePayload(studentId) {
  const beta = isA2(studentId);
  return {
    successCentre: {
      student: { id: studentId, name: beta ? 'Child Alpha Two' : 'Child Alpha One' },
      currentStatus: {
        baselineReadiness: beta ? 58 : 24,
        currentReadiness: beta ? 81 : 39,
        improvement: beta ? 23 : 15,
      },
      improvementJourney: {
        baseline: { readinessScore: beta ? 58 : 24 },
        current: { readinessScore: beta ? 81 : 39, improvement: beta ? 23 : 15 },
      },
      topImprovements: [{
        skillId: beta ? 'A2-F010' : 'A1-F010',
        skillName: beta ? 'A2 Report Improvement' : 'A1 Report Improvement',
        beforeScore: beta ? 40 : 10,
        currentScore: beta ? 81 : 39,
        improvement: beta ? 41 : 29,
      }],
      currentConcerns: [],
      recommendedActions: [],
      recentReports: [{
        id: beta ? 'report-a2' : 'report-a1',
        title: beta ? 'A2 Impact Evidence Report' : 'A1 Impact Evidence Report',
        createdAt: '2026-06-07T00:00:00.000Z',
      }],
      upcomingRechecks: [],
    },
  };
}

function paperPayload(analysisId) {
  const beta = analysisId === 'paper-a2';
  return {
    analysis: {
      _id: analysisId,
      id: analysisId,
      studentId: beta ? 'child-a2' : 'child-a1',
      status: 'needs_review',
      uploadType: 'marked_script',
      originalFilename: beta ? 'A2 School Paper.pdf' : 'A1 School Paper.pdf',
      detectedQuestions: [{
        questionNumber: '1',
        questionText: beta ? 'A2 direct paper question' : 'A1 direct paper question',
        detectedSkillIds: [beta ? 'A2-F025' : 'A1-F025'],
        confidence: beta ? 0.8 : 0.6,
      }],
      recommendedActions: [],
    },
  };
}

async function installDirectRouteMocks(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'mock-parent-token');
  });

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path.endsWith('/api/auth/me')) {
      return fulfillJson(route, { user: { id: 'parent-a', role: 'parent', roles: ['parent'], name: 'Parent A' } });
    }
    if (path.endsWith('/api/context')) {
      return fulfillJson(route, {
        user: { id: 'parent-a', role: 'parent', roles: ['parent'] },
        workspaces: [{ id: 'family-a', role: 'parent', name: 'Family A' }],
        defaultWorkspaceId: 'family-a',
      });
    }
    if (path.endsWith('/api/family/children')) {
      return fulfillJson(route, { children: CHILDREN });
    }

    if (path.endsWith('/api/mastery')) {
      const studentId = requestedStudentId(url);
      if (!isAllowedStudent(studentId)) return fulfillJson(route, { error: 'Forbidden' }, 403);
      if (studentId === 'child-a1') await delay(250);
      return fulfillJson(route, masteryPayload(studentId));
    }
    if (path.endsWith('/api/mastery/map')) {
      const studentId = requestedStudentId(url);
      if (!isAllowedStudent(studentId)) return fulfillJson(route, { error: 'Forbidden' }, 403);
      if (studentId === 'child-a1') await delay(250);
      return fulfillJson(route, mapPayload(studentId));
    }
    if (path.endsWith('/api/assignments')) {
      const studentId = requestedStudentId(url);
      if (!isAllowedStudent(studentId)) return fulfillJson(route, { error: 'Forbidden' }, 403);
      if (studentId === 'child-a1') await delay(250);
      return fulfillJson(route, assignmentPayload(studentId));
    }
    if (path.endsWith('/api/worksheets/gen')) {
      const studentId = requestedStudentId(url);
      if (!isAllowedStudent(studentId)) return fulfillJson(route, { error: 'Forbidden' }, 403);
      if (studentId === 'child-a1') await delay(250);
      return fulfillJson(route, worksheetListPayload(studentId));
    }
    if (path.includes('/api/worksheets/gen/')) {
      const worksheetId = path.split('/').pop();
      if (worksheetId === 'worksheet-b1') return fulfillJson(route, { error: 'Forbidden' }, 403);
      if (worksheetId === 'worksheet-a1') await delay(250);
      return fulfillJson(route, worksheetPayload(worksheetId));
    }
    if (path.endsWith('/api/mathpath/success-centre/parent')) {
      const studentId = requestedStudentId(url);
      if (!isAllowedStudent(studentId)) return fulfillJson(route, { error: 'Forbidden' }, 403);
      if (studentId === 'child-a1') await delay(250);
      return fulfillJson(route, successCentrePayload(studentId));
    }
    if (path.includes('/api/mathpath/paper-analysis/')) {
      const analysisId = path.split('/').pop();
      if (analysisId === 'paper-b1') return fulfillJson(route, { error: 'Forbidden' }, 403);
      if (analysisId === 'paper-a1') await delay(250);
      return fulfillJson(route, paperPayload(analysisId));
    }
    if (path.endsWith('/api/fluency/student/child-a1') || path.endsWith('/api/fluency/student/child-a2')) {
      return fulfillJson(route, { summary: { currentStreak: 0 } });
    }
    if (path.endsWith('/api/mastery/diagnostic/latest') || path.endsWith('/api/diagnostics/growth') || path.endsWith('/api/mathpath-working/review-summary')) {
      const studentId = requestedStudentId(url);
      if (!isAllowedStudent(studentId)) return fulfillJson(route, { error: 'Forbidden' }, 403);
      return fulfillJson(route, {});
    }

    return fulfillJson(route, {});
  });
}

test.describe('parent direct child route isolation', () => {
  test.beforeEach(async ({ page }) => {
    await installDirectRouteMocks(page);
  });

  test('direct progress routes render only the requested linked child', async ({ page }) => {
    await page.goto('/parent/children/child-a1/progress');
    await expect(page.getByText('Child Alpha One')).toBeVisible();
    await expect(page.getByText('A1 Fraction Progress')).toBeVisible();
    await expect(page.getByText('A2 Fraction Progress')).toHaveCount(0);

    await page.goto('/parent/children/child-a2/progress');
    await expect(page.getByText('Child Alpha Two')).toBeVisible();
    await expect(page.getByText('A2 Fraction Progress')).toBeVisible();
    await expect(page.getByText('A1 Fraction Progress')).toHaveCount(0);
  });

  test('unauthorized direct progress route shows a safe blocked state without protected data', async ({ page }) => {
    await page.goto('/parent/children/child-b1/progress');
    await expect(page.getByText("Couldn't load mastery data.")).toBeVisible();
    await expect(page.getByText('A1 Fraction Progress')).toHaveCount(0);
    await expect(page.getByText('A2 Fraction Progress')).toHaveCount(0);
  });

  test('direct Success Centre report evidence routes do not mix children or stale activeChild storage', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('activeChild', 'child-a1'));
    await page.goto('/parent/success-centre?child=child-a2');
    await expect(page.getByText('Child Alpha Two is at 81% readiness')).toBeVisible();
    await expect(page.getByText('A2 Impact Evidence Report')).toBeVisible();
    await expect(page.getByText('A1 Impact Evidence Report')).toHaveCount(0);
  });

  test('direct assignments and worksheet history routes use the requested child only', async ({ page }) => {
    await page.goto('/parent/children/child-a1/assignments');
    await expect(page.getByText('A1 Recovery Skill')).toBeVisible();
    await expect(page.getByText('A2 Recovery Skill')).toHaveCount(0);

    await page.goto('/parent/children/child-a2/assignments');
    await expect(page.getByText('A2 Recovery Skill')).toBeVisible();
    await expect(page.getByText('A1 Recovery Skill')).toHaveCount(0);

    await page.goto('/parent/children/child-a2/worksheets');
    await expect(page.getByText('A2 Worksheet Pack')).toBeVisible();
    await expect(page.getByText('A1 Worksheet Pack')).toHaveCount(0);
  });

  test('direct worksheet preview ignores stale responses when navigating between child routes', async ({ page }) => {
    await page.goto('/parent/children/child-a1/worksheets/worksheet-a1');
    await page.goto('/parent/children/child-a2/worksheets/worksheet-a2');
    await expect(page.getByRole('heading', { name: 'Child Alpha Two' })).toBeVisible();
    await expect(page.getByText('A2 worksheet question')).toBeVisible();
    await delay(500);
    await expect(page.getByText('A1 worksheet question')).toHaveCount(0);
  });

  test('unauthorized direct worksheet detail route does not show another child worksheet', async ({ page }) => {
    await page.goto('/parent/children/child-b1/worksheets/worksheet-b1');
    await expect(page.getByText(/Forbidden|Could not load worksheet/i)).toBeVisible();
    await expect(page.getByText('A1 worksheet question')).toHaveCount(0);
    await expect(page.getByText('A2 worksheet question')).toHaveCount(0);
  });

  test('direct paper analysis detail route ignores stale and unauthorized data', async ({ page }) => {
    await page.goto('/parent/children/child-a1/mathpath/analyse-paper?analysis=paper-a1');
    await page.goto('/parent/children/child-a2/mathpath/analyse-paper?analysis=paper-a2');
    await expect(page.getByText('A2 School Paper.pdf')).toBeVisible();
    await expect(page.getByText('A2 direct paper question').first()).toBeVisible();
    await delay(500);
    await expect(page.getByText('A1 School Paper.pdf')).toHaveCount(0);
    await expect(page.getByText('A1 direct paper question')).toHaveCount(0);

    await page.goto('/parent/children/child-b1/mathpath/analyse-paper?analysis=paper-b1');
    await expect(page.getByText(/You do not have access to this child|Forbidden|Could not load paper analysis/i)).toBeVisible();
    await expect(page.getByText('A2 School Paper.pdf')).toHaveCount(0);
  });
});
