import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:5001/api';

const tutorRoutes = ['/tutor', '/tutor/students'];
const teacherRoutes = [
  '/teacher',
  '/teacher/classes',
];
const studentCriticalRoutes = [
  '/student/mathpath/working/upload',
  '/student/mathpath/assessment',
];
const testSpecificationRoutes = [
  { role: 'parent', landing: '/parent', getRoute: (id) => `/parent/children/${id}/mathpath/test-spec` },
  { role: 'tutor', landing: '/tutor', getRoute: (id) => `/tutor/students/${id}/mathpath/test-spec` },
  { role: 'teacher', landing: '/teacher', getRoute: (id) => `/teacher/classes/${id}/mathpath/test-spec` },
];

async function resolveTestEntityId(pageToken, role) {
  if (role === 'parent') {
    const response = await pageToken.get(`${API_BASE}/family/children`);
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.children?.[0]?.studentId || null;
  }
  if (role === 'tutor') {
    const response = await pageToken.get(`${API_BASE}/tutor/students`);
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.students?.[0]?.studentId || null;
  }
  if (role === 'teacher') {
    const response = await pageToken.get(`${API_BASE}/teacher/classes`);
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.classes?.[0]?.classId || null;
  }
  return null;
}

function apiRequestWithToken(token) {
  return {
    get: (path) => fetch(path, { headers: { Authorization: `Bearer ${token}` } }),
  };
}

test('pilot gate: tutor and teacher key routes do not 404 for authorized roles', async ({ page }) => {
  const tutorToken = await loginAs(page, accounts.tutor, '/tutor');
  const tutorApi = apiRequestWithToken(tutorToken);
  for (const route of tutorRoutes) {
    await page.goto(route);
    await expect(page.locator('text=Route not found')).toHaveCount(0);
  }
  const tutorStudentId = await resolveTestEntityId(tutorApi, 'tutor');
  if (tutorStudentId) {
    await page.goto(`/tutor/students/${tutorStudentId}/lesson-prep`);
    await expect(page.locator('text=Route not found')).toHaveCount(0);
  } else {
    test.info().annotations.push({ type: 'note', description: 'No tutor student found for route-guard check; skipping lesson prep check.' });
  }

  const teacherToken = await loginAs(page, accounts.teacher, '/teacher');
  const teacherApi = apiRequestWithToken(teacherToken);
  for (const route of teacherRoutes) {
    await page.goto(route);
    await expect(page.locator('text=Route not found')).toHaveCount(0);
  }
  const teacherClassId = await resolveTestEntityId(teacherApi, 'teacher');
  if (teacherClassId) {
    for (const route of [`/teacher/classes/${teacherClassId}`, `/teacher/classes/${teacherClassId}/mastery`, `/teacher/classes/${teacherClassId}/students`]) {
      await page.goto(route);
      await expect(page.locator('text=Route not found')).toHaveCount(0);
    }
  } else {
    test.info().annotations.push({ type: 'note', description: 'No teacher class found for route-guard check; skipping class route checks.' });
  }
});

test('pilot gate: student working upload and assessment routes are available', async ({ page }) => {
  await loginAs(page, accounts.student, '/student');
  for (const route of studentCriticalRoutes) {
    await page.goto(route);
    await expect(page.locator('text=Route not found')).toHaveCount(0);
  }
});

test('pilot gate: test specification routes are available for parent/tutor/teacher', async ({ page }) => {
  const roleToAccount = {
    parent: accounts.parent,
    tutor: accounts.tutor,
    teacher: accounts.teacher,
  };
  for (const item of testSpecificationRoutes) {
    const token = await loginAs(page, roleToAccount[item.role], item.landing);
    const api = apiRequestWithToken(token);
    const entityId = await resolveTestEntityId(api, item.role);
    if (!entityId) {
      test.info().annotations.push({ type: 'note', description: `No ${item.role} test entity available; skipping test-spec route check.` });
      continue;
    }
    const targetRoute = item.getRoute(entityId);
    await page.goto(targetRoute);
    await expect(page.locator('text=Route not found')).toHaveCount(0);
  }
});

test('pilot gate: unauthorized role access is blocked', async ({ page }) => {
  await loginAs(page, accounts.student, '/student');
  await page.goto('/teacher');
  await expect(page).not.toHaveURL(/\/teacher$/);
});
