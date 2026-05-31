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

test('pilot gate: unauthorized role access is blocked', async ({ page }) => {
  await loginAs(page, accounts.student, '/student');
  await page.goto('/teacher');
  await expect(page).not.toHaveURL(/\/teacher$/);
});

