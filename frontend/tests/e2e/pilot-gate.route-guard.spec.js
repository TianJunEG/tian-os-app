import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

const tutorRoutes = ['/tutor', '/tutor/students', '/tutor/students/demo/lesson-prep'];
const teacherRoutes = [
  '/teacher',
  '/teacher/classes',
  '/teacher/classes/demo',
  '/teacher/classes/demo/mastery',
  '/teacher/classes/demo/students',
];
const studentCriticalRoutes = [
  '/student/mathpath/working/upload',
  '/student/mathpath/assessment',
];
const testSpecificationRoutes = [
  { role: 'parent', landing: '/parent', route: '/parent/children/demo/mathpath/test-spec' },
  { role: 'tutor', landing: '/tutor', route: '/tutor/students/demo/mathpath/test-spec' },
  { role: 'teacher', landing: '/teacher', route: '/teacher/classes/demo/mathpath/test-spec' },
];

test('pilot gate: tutor and teacher key routes do not 404 for authorized roles', async ({ page }) => {
  await loginAs(page, accounts.tutor, '/tutor');
  for (const route of tutorRoutes) {
    await page.goto(route);
    await expect(page.locator('text=Route not found')).toHaveCount(0);
  }

  await loginAs(page, accounts.teacher, '/teacher');
  for (const route of teacherRoutes) {
    await page.goto(route);
    await expect(page.locator('text=Route not found')).toHaveCount(0);
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
    await loginAs(page, roleToAccount[item.role], item.landing);
    await page.goto(item.route);
    await expect(page.locator('text=Route not found')).toHaveCount(0);
  }
});

test('pilot gate: unauthorized role access is blocked', async ({ page }) => {
  await loginAs(page, accounts.student, '/student');
  await page.goto('/teacher');
  await expect(page).not.toHaveURL(/\/teacher$/);
});
