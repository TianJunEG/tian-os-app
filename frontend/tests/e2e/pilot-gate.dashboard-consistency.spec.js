import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

const roleRoutes = [
  { name: 'student', account: accounts.student, route: '/student', landingPath: '/student' },
  { name: 'parent', account: accounts.parent, route: '/parent', landingPath: '/parent' },
  { name: 'tutor', account: accounts.tutor, route: '/tutor', landingPath: '/tutor' },
  { name: 'teacher', account: accounts.teacher, route: '/teacher', landingPath: '/teacher' },
];

for (const roleCase of roleRoutes) {
  test(`pilot gate: ${roleCase.name} dashboard route loads without hard error`, async ({ page }) => {
    await loginAs(page, roleCase.account, roleCase.landingPath);
    await page.goto(roleCase.route);

    await expect(page.locator('text=Route not found')).toHaveCount(0);
    await expect(page.getByText(/error|failed|not authorized/i)).toHaveCount(0);
    await expect(page.url()).toContain(`/${roleCase.name}`);
  });
}
