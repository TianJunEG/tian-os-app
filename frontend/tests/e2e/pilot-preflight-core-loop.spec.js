import { test, expect } from '@playwright/test';

const apiBase = process.env.PLAYWRIGHT_API_BASE_URL || 'http://127.0.0.1:5001/api';

const pilotStudents = [
  { email: 'pilot.student1@tianos.test', password: 'Passw0rd!', workingMode: 'submitted' },
  { email: 'pilot.student2@tianos.test', password: 'Passw0rd!', workingMode: 'paper' },
  { email: 'pilot.student3@tianos.test', password: 'Passw0rd!', workingMode: 'notNeeded' },
  { email: 'pilot.student4@tianos.test', password: 'Passw0rd!', workingMode: 'submitted' },
  { email: 'pilot.student5@tianos.test', password: 'Passw0rd!', workingMode: 'paper' },
];

const visibleRoutes = [
  '/student',
  '/student/mathpath',
  '/student/mathpath/mistakes',
  '/student/progress',
];

const gatedRoutes = [
  {
    path: '/student/mathpath/assessment',
    safeCopy: /Test Mode is not available for this pilot yet/i,
  },
  {
    path: '/student/mathpath/fluency',
    safeCopy: /Fluency practice is not available yet\. Continue learning to unlock it/i,
  },
  {
    path: '/student/mathpath/fractions/model-trainer',
    safeCopy: /Model Trainer is not available for this pilot yet/i,
  },
];

const forbiddenVisibleCopy = [
  /Route not found/i,
  /Run npm run/i,
  /\bseed\b/i,
  /demo-student/i,
  /\bfake\b/i,
  /placeholder mistake/i,
  /Question unavailable/i,
  /\bundefined\b/i,
  /\bNaN\b/,
  /0\s*\/\s*1\s+skills mastered/i,
];

const forbiddenActiveHref = [
  /\/student\/mathpath\/fluency/i,
  /\/student\/mathpath\/assessment/i,
  /\/student\/mathpath\/fractions\/model-trainer/i,
  /\/student\/mathpath\/fractions\/story/i,
  /\/student\/science/i,
  /\/student\/worksheets/i,
];

function correctAnswerFor(question = {}) {
  return String(
    question.answer?.display
      || question.answer
      || question.correctAnswer
      || question.acceptedAnswers?.[0]
      || '1/2'
  );
}

function wrongAnswerFor(question = {}) {
  const correct = correctAnswerFor(question);
  return correct === '0' || correct === '0/1' ? '999' : '0/1';
}

function compactAccountLabel(email = '') {
  return email.replace('@tianos.test', '');
}

async function apiFetch(page, token, method, route, data) {
  const response = await page.request.fetch(`${apiBase}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data,
  });
  const body = await response.json().catch(() => ({}));
  expect(response.ok(), `${method} ${route}: ${JSON.stringify(body)}`).toBeTruthy();
  return body;
}

async function loginAndOpen(page, account, landingPath = '/student') {
  const response = await page.request.post(`${apiBase}/auth/login`, {
    data: { email: account.email, password: account.password },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.ok(), `login ${account.email}: ${JSON.stringify(body)}`).toBeTruthy();
  expect(Boolean(body.token), `login token for ${account.email}`).toBeTruthy();

  await page.addInitScript((token) => {
    window.localStorage.setItem('token', token);
  }, body.token);
  await page.goto(landingPath);
  await page.waitForLoadState('networkidle');
  return body.token;
}

async function expectNoForbiddenVisibleCopy(page) {
  const text = await page.locator('body').innerText();
  for (const pattern of forbiddenVisibleCopy) {
    expect(text, `forbidden visible copy matched ${pattern}`).not.toMatch(pattern);
  }
}

async function expectRouteHealthy(page, route) {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
  await expectNoForbiddenVisibleCopy(page);
}

async function expectNoActiveGatedCtas(page) {
  const hrefs = await page.locator('a:visible').evaluateAll((links) => (
    links.map((link) => link.getAttribute('href') || '').filter(Boolean)
  ));
  for (const href of hrefs) {
    for (const pattern of forbiddenActiveHref) {
      expect(href, `active pilot CTA points to gated route ${href}`).not.toMatch(pattern);
    }
  }
}

async function completeDiagnostic(page, token) {
  const start = await apiFetch(page, token, 'POST', '/mastery/diagnostic/start', {
    diagnosticPurpose: 'pilot_preflight',
  });
  const sessionId = start.sessionId || start.session?.sessionId;
  expect(Boolean(sessionId), 'diagnostic session id').toBeTruthy();

  const targetQuestions = Number(
    start.diagnosticConfig?.estimatedQuestionCount
      || start.session?.estimatedQuestionCount
      || start.progress?.estimatedQuestionCount
      || 10
  );
  let currentQuestion = start.nextQuestion || start.currentQuestion || start.questions?.[0];
  expect(Boolean(currentQuestion?.questionId), 'first diagnostic question').toBeTruthy();

  let answeredQuestions = 0;
  let completionReason = '';
  let result = null;

  for (let i = 0; i < Math.max(targetQuestions + 2, 12); i += 1) {
    const body = {
      questionId: currentQuestion.questionId,
      questionFamilyId: currentQuestion.questionFamilyId,
      answer: i === 0 ? wrongAnswerFor(currentQuestion) : correctAnswerFor(currentQuestion),
      confidence: i === 0 ? 'i_know_this' : 'i_know_this',
      timeTakenMs: 12000 + i,
      workingNotNeeded: true,
      workingRequirementLevel: 'LOW',
      attempts: 1,
    };
    const answer = await apiFetch(page, token, 'POST', `/mastery/diagnostic/${sessionId}/answer`, body);
    answeredQuestions = Number(answer.progress?.answeredCount || answer.answeredQuestions || answeredQuestions + 1);
    completionReason = answer.completionReason || answer.progress?.completionReason || '';
    result = answer;

    if (answer.sessionComplete) break;
    currentQuestion = answer.nextQuestion;
    expect(Boolean(currentQuestion?.questionId), `next diagnostic question after ${answeredQuestions}`).toBeTruthy();
  }

  expect(result?.sessionComplete, `diagnostic completed with reason ${completionReason || 'missing'}`).toBeTruthy();
  expect(answeredQuestions, 'diagnostic should not end after a single question').toBeGreaterThan(1);
  if (completionReason === 'target_reached') {
    expect(answeredQuestions, 'diagnostic should reach expected question count').toBeGreaterThanOrEqual(targetQuestions);
  }
  expect(Boolean(completionReason), 'diagnostic completion reason').toBeTruthy();
  return {
    sessionId,
    answeredQuestions,
    targetQuestions,
    completionReason,
    recommendedSkillId: result?.assignedPracticeSkillIds?.[0]
      || result?.result?.recommendedStartingSkill?.skillId
      || result?.result?.recommendedSkills?.[0]?.skillId
      || 'F001',
  };
}

function buildWorkingPayload(mode, question, index, workingSessionId) {
  const timestamp = new Date(Date.now() + index * 1000).toISOString();
  const base = {
    questionId: question.questionId,
    studentAnswer: index === 0 ? wrongAnswerFor(question) : correctAnswerFor(question),
    confidence: index === 0 ? 'i_know_this' : 'i_know_this',
    timeTaken: 12 + index,
    attemptNumber: 1,
    workingSessionId,
    workingRequirementLevel: mode === 'notNeeded' ? 'LOW' : 'HIGH',
    questionStartedAt: timestamp,
    questionEndedAt: timestamp,
    timestamp,
  };

  if (mode === 'submitted') {
    return {
      ...base,
      workingSubmitted: true,
      workingUploaded: true,
      workingSubmittedAt: timestamp,
      workingImage: 'data:image/png;base64,iVBORw0KGgo=',
      workingStrokes: [{ tool: 'pen', points: [{ x: 10, y: 10 }, { x: 40, y: 30 }] }],
      fullscreenWorkingSubmitted: true,
      fullscreenWorkingImage: 'data:image/png;base64,iVBORw0KGgo=',
      fullscreenWorkingStrokes: [{ tool: 'pen', points: [{ x: 12, y: 20 }, { x: 42, y: 44 }] }],
      fullscreenWorkingSubmittedAt: timestamp,
    };
  }

  if (mode === 'paper') {
    return {
      ...base,
      workingOnPaper: true,
    };
  }

  return {
    ...base,
    workingNotNeeded: true,
  };
}

async function completePractice(page, token, skillId, workingMode) {
  const start = await apiFetch(page, token, 'POST', '/mastery/fractions/practice/start', {
    skillId,
    questionCount: 5,
    sessionType: 'practice',
  });
  expect(Boolean(start.practiceSessionId), 'practice session id').toBeTruthy();
  expect(start.questions?.length || 0, 'practice question count').toBeGreaterThanOrEqual(5);

  const responses = start.questions
    .slice(0, 5)
    .map((question, index) => buildWorkingPayload(workingMode, question, index, start.workingSessionId));
  const submit = await apiFetch(page, token, 'POST', `/mastery/fractions/practice/${start.practiceSessionId}/submit`, {
    sessionType: 'practice',
    responses,
  });

  expect(submit.persisted, 'practice persisted').toBeTruthy();
  expect(submit.results?.length || 0, 'practice saved result count').toBe(5);
  expect(submit.results.some((result) => result.correct === false), 'practice creates at least one wrong answer').toBeTruthy();
  expect(submit.lifecycleLog?.attemptSaved, 'attempts saved').toBeTruthy();
  expect(submit.lifecycleLog?.mistakeCreated, 'mistake created').toBeTruthy();
  expect(submit.lifecycleLog?.progressUpdated, 'progress updated').toBeTruthy();

  if (workingMode === 'submitted') {
    expect(submit.results.some((result) => result.workingSubmitted)).toBeTruthy();
  } else if (workingMode === 'paper') {
    expect(submit.results.some((result) => result.workingOnPaper)).toBeTruthy();
    expect(submit.workingUploadRequired).toBeTruthy();
  } else {
    expect(submit.results.some((result) => result.workingNotNeeded)).toBeTruthy();
  }

  return {
    sessionId: start.practiceSessionId,
    questionCount: submit.results.length,
    workingUploadRequired: Boolean(submit.workingUploadRequired),
  };
}

test.describe('5-student pilot preflight core loop', () => {
  test('all pilot students complete diagnostic, practice, mistakes, progress, and dashboard loop', async ({ page }) => {
    test.setTimeout(180_000);
    const outcomes = [];

    for (const account of pilotStudents) {
      const token = await loginAndOpen(page, account);
      await apiFetch(page, token, 'POST', '/mastery/test/reset-state', {});

      for (const route of visibleRoutes) {
        await expectRouteHealthy(page, route);
      }
      await expectNoActiveGatedCtas(page);

      const diagnostic = await completeDiagnostic(page, token);
      const practice = await completePractice(page, token, diagnostic.recommendedSkillId, account.workingMode);

      const mistakes = await apiFetch(page, token, 'GET', '/mistakes?module=MathPath');
      expect(mistakes.mistakes?.length || 0, `${account.email} mistake count`).toBeGreaterThan(0);
      expect(mistakes.weakSkills?.length || 0, `${account.email} weak skills`).toBeGreaterThan(0);

      const graph = await apiFetch(page, token, 'GET', '/mastery/graph');
      const totalSkills = Number(graph.summary?.total || graph.summary?.totalSkills || graph.totalSkills || 0);
      expect(totalSkills, `${account.email} graph total skills`).toBeGreaterThanOrEqual(26);

      const summary = await apiFetch(page, token, 'GET', '/student-profile/summary');
      expect(summary, `${account.email} student profile summary`).toBeTruthy();

      for (const route of visibleRoutes) {
        await expectRouteHealthy(page, route);
      }
      await expectNoActiveGatedCtas(page);

      outcomes.push({
        account: compactAccountLabel(account.email),
        workingMode: account.workingMode,
        diagnosticAnswered: diagnostic.answeredQuestions,
        diagnosticTarget: diagnostic.targetQuestions,
        diagnosticCompletionReason: diagnostic.completionReason,
        practiceQuestions: practice.questionCount,
        mistakeCount: mistakes.mistakes.length,
        totalSkills,
        workingUploadRequired: practice.workingUploadRequired,
      });
    }

    expect(outcomes.map((item) => item.workingMode)).toEqual([
      'submitted',
      'paper',
      'notNeeded',
      'submitted',
      'paper',
    ]);
    console.info('pilot preflight outcomes', JSON.stringify(outcomes, null, 2));
  });

  test('directly opened non-pilot routes show safe gated states', async ({ page }) => {
    const token = await loginAndOpen(page, pilotStudents[0]);
    expect(Boolean(token)).toBeTruthy();

    for (const route of gatedRoutes) {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByText(route.safeCopy)).toBeVisible();
      await expectNoForbiddenVisibleCopy(page);
    }
  });
});
