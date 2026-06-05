import { expect } from '@playwright/test';

export const accounts = {
  student: {
    email: process.env.PILOT_STUDENT_EMAIL || 'demo.student@tianos.test',
    password: process.env.PILOT_STUDENT_PASSWORD || 'Passw0rd!',
  },
  parent: {
    email: process.env.PILOT_PARENT_EMAIL || 'demo.parent@tianos.test',
    password: process.env.PILOT_PARENT_PASSWORD || 'Passw0rd!',
  },
  tutor: {
    email: process.env.PILOT_TUTOR_EMAIL || 'demo.tutor@tianos.test',
    password: process.env.PILOT_TUTOR_PASSWORD || 'Passw0rd!',
  },
  teacher: {
    email: process.env.PILOT_TEACHER_EMAIL || 'demo.teacher@tianos.test',
    password: process.env.PILOT_TEACHER_PASSWORD || 'Passw0rd!',
  },
};

const apiBase = process.env.PLAYWRIGHT_API_BASE_URL || 'http://127.0.0.1:5001/api';

export async function loginAs(page, account, landingPath = '/student') {
  const response = await page.request.post(`${apiBase}/auth/login`, {
    data: { email: account.email, password: account.password },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  const token = payload?.token;
  expect(Boolean(token)).toBeTruthy();

  await page.addInitScript((t) => {
    window.localStorage.setItem('token', t);
  }, token);

  await page.goto(landingPath);
  await page.waitForLoadState('networkidle');
  return token;
}

export async function safeGoto(page, path) {
  await page.goto(path);
  const routeNotFound = page.locator('text=Route not found');
  if (await routeNotFound.count()) {
    await expect(routeNotFound).toHaveCount(0);
  }
}
