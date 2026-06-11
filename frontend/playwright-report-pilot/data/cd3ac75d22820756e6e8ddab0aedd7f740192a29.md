# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pilot-gate.route-guard.spec.js >> pilot gate: unauthorized role access is blocked
- Location: tests/e2e/pilot-gate.route-guard.spec.js:109:1

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1  | import { expect } from '@playwright/test';
  2  | 
  3  | export const accounts = {
  4  |   student: {
  5  |     email: process.env.PILOT_STUDENT_EMAIL || 'demo.student@tianos.test',
  6  |     password: process.env.PILOT_STUDENT_PASSWORD || 'Passw0rd!',
  7  |   },
  8  |   parent: {
  9  |     email: process.env.PILOT_PARENT_EMAIL || 'demo.parent@tianos.test',
  10 |     password: process.env.PILOT_PARENT_PASSWORD || 'Passw0rd!',
  11 |   },
  12 |   tutor: {
  13 |     email: process.env.PILOT_TUTOR_EMAIL || 'demo.tutor@tianos.test',
  14 |     password: process.env.PILOT_TUTOR_PASSWORD || 'Passw0rd!',
  15 |   },
  16 |   teacher: {
  17 |     email: process.env.PILOT_TEACHER_EMAIL || 'demo.teacher@tianos.test',
  18 |     password: process.env.PILOT_TEACHER_PASSWORD || 'Passw0rd!',
  19 |   },
  20 | };
  21 | 
  22 | const apiBase = process.env.PLAYWRIGHT_API_BASE_URL || 'http://127.0.0.1:5001/api';
  23 | 
  24 | export async function loginAs(page, account, landingPath = '/student') {
  25 |   const response = await page.request.post(`${apiBase}/auth/login`, {
  26 |     data: { email: account.email, password: account.password },
  27 |   });
> 28 |   expect(response.ok()).toBeTruthy();
     |                         ^ Error: expect(received).toBeTruthy()
  29 |   const payload = await response.json();
  30 |   const token = payload?.token;
  31 |   expect(Boolean(token)).toBeTruthy();
  32 | 
  33 |   await page.addInitScript((t) => {
  34 |     window.localStorage.setItem('token', t);
  35 |   }, token);
  36 | 
  37 |   await page.goto(landingPath);
  38 |   await page.waitForLoadState('networkidle');
  39 |   return token;
  40 | }
  41 | 
  42 | export async function safeGoto(page, path) {
  43 |   await page.goto(path);
  44 |   const routeNotFound = page.locator('text=Route not found');
  45 |   if (await routeNotFound.count()) {
  46 |     await expect(routeNotFound).toHaveCount(0);
  47 |   }
  48 | }
  49 | 
```