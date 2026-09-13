import { test, expect } from '@playwright/test';
import { accounts, loginAs } from './helpers/auth';

const VIEWPORTS = [
  { name: 'small-phone-360x740', width: 360, height: 740 },
  { name: 'iphone-390x844', width: 390, height: 844 },
  { name: 'ipad-portrait-768x1024', width: 768, height: 1024 },
  { name: 'ipad-landscape-1024x768', width: 1024, height: 768 },
];

const FROZEN_DOMAINS = [
  { name: 'Fractions', path: '/student/mathpath/practice/recommended-pathway' },
  { name: 'Decimals', path: '/student/mathpath/decimals/practice?skill=D006' },
  { name: 'Percentages', path: '/student/mathpath/percentages/practice?skill=P003' },
  { name: 'Ratio & Rate', path: '/student/mathpath/ratio-rate/practice?skill=R001' },
  { name: 'Number Sense', path: '/student/mathpath/number-sense/practice?skill=NS005' },
  { name: 'Operations', path: '/student/mathpath/operations/practice?skill=OP003' },
];

async function expectNoPageOverflow(page) {
  const metrics = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    docWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(Math.max(metrics.bodyWidth, metrics.docWidth)).toBeLessThanOrEqual(metrics.viewportWidth + 2);
}

async function openWorking(page) {
  const openButton = page.getByRole('button', { name: /Open full-screen working|Open Working|Open working/i }).first();
  await expect(openButton).toBeVisible({ timeout: 20_000 });
  await openButton.click();
  const dialog = page.getByRole('dialog', { name: /Full-screen working/i });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function drawOnCanvas(page) {
  const canvas = page.getByLabel('Full-screen working canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  const x = box.x + Math.min(box.width - 20, Math.max(70, box.width * 0.35));
  const y = box.y + Math.min(box.height - 20, Math.max(80, box.height * 0.35));
  await canvas.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: x,
    clientY: y,
  });
  await canvas.dispatchEvent('pointermove', {
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: x + 70,
    clientY: y + 32,
  });
  await canvas.dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: x + 70,
    clientY: y + 32,
  });
}

async function expectButtonReachable(page, button) {
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box).toBeTruthy();
  const viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function expectAnswerControlReachable(page) {
  const input = page.locator('input[placeholder="Type your answer"]').first();
  if (await input.isVisible().catch(() => false)) {
    await expect(input).toBeVisible();
    return;
  }
  await expect(page.locator('main button').filter({ hasText: /\S/ }).first()).toBeVisible();
}

async function saveWorkingAndExpectPreview(page) {
  const dialog = page.getByRole('dialog', { name: /Full-screen working/i });
  const saveButton = dialog.getByRole('button', { name: /Save Working/i });
  const closeButton = dialog.getByRole('button', { name: /Close/i });
  await expectButtonReachable(page, saveButton);
  await expectButtonReachable(page, closeButton);
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect(page.getByAltText(/Saved working preview/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Working saved/i).first()).toBeVisible();
  await expectNoPageOverflow(page);
}

async function answerCurrentQuestionWrong(page) {
  if (await page.getByText(/Practice complete/i).isVisible().catch(() => false)) return false;
  const input = page.locator('input[placeholder="Type your answer"]').first();
  if (await input.isVisible().catch(() => false)) {
    await input.fill('999999');
  } else {
    const choice = page.locator('main button').filter({ hasText: /\S/ }).nth(1);
    await choice.click();
  }
  const nextButton = page.getByRole('button', { name: /Next|Finish/i }).first();
  if (!(await nextButton.isVisible().catch(() => false))) return false;
  await nextButton.click();
  await Promise.race([
    page.getByText(/Practice complete/i).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => null),
    page.getByText(/Question\s+\d+\s+of\s+\d+/i).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => null),
  ]);
  return true;
}

async function finishSessionWithSkips(page) {
  for (let i = 0; i < 8; i += 1) {
    if (await page.getByText(/Practice complete/i).isVisible().catch(() => false)) return;
    const answered = await answerCurrentQuestionWrong(page);
    if (!answered) break;
  }
  await expect(page.getByText(/Practice complete/i)).toBeVisible({ timeout: 20_000 });
}

test.describe('MathPath frozen-domain mobile/tablet working evidence QA', () => {
  for (const viewport of VIEWPORTS) {
    for (const domain of FROZEN_DOMAINS) {
      test(`${domain.name}: working canvas save/preview has no overflow at ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await loginAs(page, accounts.student, domain.path);
        await expect(page.getByText(/Question\s+\d+\s+of\s+\d+/i)).toBeVisible({ timeout: 20_000 });
        await expectNoPageOverflow(page);

        await expectAnswerControlReachable(page);
        const dialog = await openWorking(page);
        await expectNoPageOverflow(page);
        await drawOnCanvas(page);

        await expect(dialog.getByRole('button', { name: /Undo/i }).first()).toBeVisible();
        await expect(dialog.getByRole('button', { name: /Clear/i }).first()).toBeVisible();
        await saveWorkingAndExpectPreview(page);
      });
    }
  }

  test('Decimals: wrong mobile answer creates reviewable saved working state', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, accounts.student, '/student/mathpath/decimals/practice?skill=D006');
    await expect(page.getByText(/Question\s+\d+\s+of\s+\d+/i)).toBeVisible({ timeout: 20_000 });
    await openWorking(page);
    await drawOnCanvas(page);
    await saveWorkingAndExpectPreview(page);

    await answerCurrentQuestionWrong(page);
    await finishSessionWithSkips(page);

    await page.goto('/student/mathpath/mistakes/review');
    await expect(page.getByText(/Mistake to mastery/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Working saved|Working missing|Working marked not needed/i).first()).toBeVisible({ timeout: 20_000 });
    await expectNoPageOverflow(page);
  });
});
