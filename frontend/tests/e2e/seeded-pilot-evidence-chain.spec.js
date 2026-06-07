const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Seeded pilot evidence chain smoke tests', () => {
  test('verify seeded data snapshot exists and basic invariants', async () => {
    const dataPath = path.resolve(process.cwd(), 'data/seededPilotEvidenceChainSmokeData.json');
    const exists = fs.existsSync(dataPath);
    expect(exists).toBeTruthy();

    const raw = fs.readFileSync(dataPath, 'utf8');
    const snapshot = JSON.parse(raw);

    // Basic expectations mirrored from the report
    expect(Array.isArray(snapshot.parents)).toBeTruthy();
    expect(snapshot.parents.length).toBeGreaterThanOrEqual(2);

    const parentA = snapshot.parents.find(p => p.id === 'parentA');
    expect(parentA).toBeTruthy();

    const childA1 = parentA.children.find(c => c.id === 'childA1');
    expect(childA1).toBeTruthy();
    expect(childA1.recoveryPacks && childA1.recoveryPacks.length).toBeGreaterThan(0);

    // Recovery Pack references resolve to real generated question records
    const qIds = childA1.recoveryPacks.flatMap(rp => rp.questionRefs || []);
    qIds.forEach(qid => {
      const q = (snapshot.questions || []).find(x => x.id === qid);
      expect(q).toBeTruthy();
    });
  });
});
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const apiBase = process.env.PLAYWRIGHT_API_BASE_URL || 'http://127.0.0.1:5001/api';
const rootDir = path.resolve(process.cwd(), '..');
const password = 'Passw0rd!';

async function login(page, { email, landingPath = '/parent' }) {
  const response = await page.request.post(`${apiBase}/auth/login`, {
    data: { email, password },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.ok(), `login ${email}: ${JSON.stringify(body)}`).toBeTruthy();
  expect(Boolean(body.token), `token for ${email}`).toBeTruthy();
  await page.addInitScript((token) => {
    window.localStorage.setItem('token', token);
  }, body.token);
  await page.goto(landingPath);
  await page.waitForLoadState('networkidle');
  return body.token;
}

async function apiFetch(page, token, route, { method = 'GET', data } = {}) {
  const response = await page.request.fetch(`${apiBase}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data,
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

function assertNoUnsupportedParentClaims(text) {
  expect(text).not.toMatch(/guaranteed/i);
  expect(text).not.toMatch(/scientifically proven/i);
  expect(text).not.toMatch(/clinically validated/i);
  expect(text).not.toMatch(/full mastery/i);
  expect(text).not.toMatch(/\bundefined\b/i);
  expect(text).not.toMatch(/\bNaN\b/);
}

test.beforeAll(() => {
  execFileSync('node', ['scripts/seedPilotEvidenceChainSmokeData.js'], {
    cwd: rootDir,
    env: {
      ...process.env,
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tutor-match',
      MONGODB_URI_LOCAL: process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match',
    },
    stdio: 'inherit',
  });
});

test('seeded pilot evidence chain resolves from diagnostic to parent visibility', async ({ page }) => {
  const parentToken = await login(page, {
    email: 'pilot.parent@tianos.test',
    landingPath: '/parent',
  });

  const childrenResult = await apiFetch(page, parentToken, '/family/children');
  expect(childrenResult.response.ok(), JSON.stringify(childrenResult.body)).toBeTruthy();
  const children = childrenResult.body.children || [];
  const childA1 = children.find((child) => child.name === 'Pilot Student 2 Weak Fractions');
  const childA2 = children.find((child) => child.name === 'Pilot Student 3 Strong Fractions');
  expect(childA1?.studentId).toBeTruthy();
  expect(childA2?.studentId).toBeTruthy();
  expect(children.some((child) => child.name === 'Pilot Chain Child B1')).toBeFalsy();

  const history = await apiFetch(page, parentToken, `/diagnostics/history?studentId=${childA1.studentId}&subjectId=math&domainId=fractions`);
  expect(history.response.ok(), JSON.stringify(history.body)).toBeTruthy();
  expect(history.body.history.length).toBeGreaterThanOrEqual(3);
  expect(history.body.history.some((row) => row.isBaseline)).toBeTruthy();
  expect(history.body.history.some((row) => row.diagnosticPurpose === 'recheck')).toBeTruthy();

  const growth = await apiFetch(page, parentToken, `/diagnostics/growth?studentId=${childA1.studentId}&subjectId=math&domainId=fractions`);
  expect(growth.response.ok(), JSON.stringify(growth.body)).toBeTruthy();
  expect(Number(growth.body.baseline?.readinessScore || 0)).toBe(35);
  expect(Number(growth.body.latest?.readinessScore || 0)).toBeGreaterThan(35);
  expect(Number(growth.body.overallImprovement || 0)).toBeGreaterThan(0);

  const assignments = await apiFetch(page, parentToken, `/mathpath/assignments?studentId=${childA1.studentId}`);
  expect(assignments.response.ok(), JSON.stringify(assignments.body)).toBeTruthy();
  const recoveryPack = (assignments.body.assignments || []).find((row) => row.sourceId === 'pilot_chain_a1_latest');
  expect(recoveryPack?.id || recoveryPack?._id).toBeTruthy();
  const assignmentId = recoveryPack.id || recoveryPack._id;

  const flow = await apiFetch(page, parentToken, `/mathpath/assignments/${assignmentId}/teaching-flow`);
  expect(flow.response.ok(), JSON.stringify(flow.body)).toBeTruthy();
  expect(flow.body.recoveryPack.warnings).toHaveLength(0);
  expect(flow.body.recoveryPack.workedExample.content.correctMethod).toContain('Rename');
  expect(flow.body.recoveryPack.guidedPractice.questions.every((q) => q.source === 'generated_question')).toBeTruthy();
  expect(flow.body.recoveryPack.independentPractice.questions.every((q) => q.source === 'generated_question')).toBeTruthy();
  expect(flow.body.recoveryPack.masteryCheck.questions.every((q) => q.source === 'generated_question')).toBeTruthy();
  expect(flow.body.recoveryPack.recheckReady).toBeTruthy();

  const successCentre = await apiFetch(page, parentToken, `/mathpath/success-centre/parent?studentId=${childA1.studentId}`);
  expect(successCentre.response.ok(), JSON.stringify(successCentre.body)).toBeTruthy();
  const successText = JSON.stringify(successCentre.body);
  expect(successText).toContain('Pilot Student 2 Weak Fractions');
  expect(successText).toContain('Recovery');
  assertNoUnsupportedParentClaims(successText);

  const report = await apiFetch(page, parentToken, `/mathpath/success-centre/parent/report?studentId=${childA1.studentId}`);
  expect(report.response.ok(), JSON.stringify(report.body)).toBeTruthy();
  const reportText = JSON.stringify(report.body);
  expect(reportText).toContain('Pilot Student 2 Weak Fractions');
  assertNoUnsupportedParentClaims(reportText);

  await page.goto(`/parent/children/${childA1.studentId}/mathpath`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Pilot Student 2 Weak Fractions').first()).toBeVisible();
  await expect(page.getByText('Pilot Student 3 Strong Fractions')).toHaveCount(0);
  assertNoUnsupportedParentClaims(await page.locator('body').innerText());

  await page.goto(`/parent/success-centre?child=${childA1.studentId}`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Parent Success Centre').first()).toBeVisible();
  await expect(page.getByText('Pilot Chain Child B1')).toHaveCount(0);
  assertNoUnsupportedParentClaims(await page.locator('body').innerText());

  await page.goto(`/parent/children/${childA2.studentId}/mathpath`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Pilot Student 3 Strong Fractions').first()).toBeVisible();
  await expect(page.getByText('Pilot Student 2 Weak Fractions')).toHaveCount(0);

  const parentBLogin = await page.request.post(`${apiBase}/auth/login`, {
    data: { email: 'pilot.chain.parentb@tianos.test', password },
  });
  const parentBBody = await parentBLogin.json();
  const parentBChildren = await page.request.fetch(`${apiBase}/family/children`, {
    headers: { Authorization: `Bearer ${parentBBody.token}` },
  });
  const parentBChildrenBody = await parentBChildren.json();
  const childB1 = (parentBChildrenBody.children || []).find((child) => child.name === 'Pilot Chain Child B1');
  expect(childB1?.studentId).toBeTruthy();

  const blocked = await apiFetch(page, parentToken, `/diagnostics/history?studentId=${childB1.studentId}&subjectId=math&domainId=fractions`);
  expect(blocked.response.status()).toBe(403);
  expect(JSON.stringify(blocked.body)).not.toContain('F020');
});

test('seeded student can open the assigned Recovery Pack teaching flow', async ({ page }) => {
  const token = await login(page, {
    email: 'pilot.student2@tianos.test',
    landingPath: '/student/mathpath/assignments',
  });
  const assignments = await apiFetch(page, token, '/mathpath/assignments');
  expect(assignments.response.ok(), JSON.stringify(assignments.body)).toBeTruthy();
  const recoveryPack = (assignments.body.assignments || []).find((row) => row.sourceId === 'pilot_chain_a1_latest');
  expect(recoveryPack?.id || recoveryPack?._id).toBeTruthy();

  await page.goto(`/student/mathpath/recovery-pack/${recoveryPack.id || recoveryPack._id}`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Fractions Recovery Pack').first()).toBeVisible();
  await expect(page.getByText('Common denominator missing').first()).toBeVisible();
  await expect(page.getByText(/Rename 1\/2 as 2\/4/i).first()).toBeVisible();
  await expect(page.getByText(/Guided/i).first()).toBeVisible();
  assertNoUnsupportedParentClaims(await page.locator('body').innerText());
});
