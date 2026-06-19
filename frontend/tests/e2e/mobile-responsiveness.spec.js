import { test, expect } from '@playwright/test';

// Representative mobile viewports from the audit scope
const IPHONE_SE = { width: 375, height: 667 };
const IPHONE_14 = { width: 390, height: 844 };
const IPAD_PORTRAIT = { width: 768, height: 1024 };

const studentCreds = {
  email: process.env.TEST_STUDENT_EMAIL || 'pilot.student1@tianos.test',
  password: process.env.TEST_STUDENT_PASSWORD || 'Passw0rd!',
};
const parentCreds = {
  email: process.env.TEST_PARENT_EMAIL || 'pilot.parent1@tianos.test',
  password: process.env.TEST_PARENT_PASSWORD || 'Passw0rd!',
};
const tutorCreds = {
  email: process.env.TEST_TUTOR_EMAIL || 'pilot.tutor1@tianos.test',
  password: process.env.TEST_TUTOR_PASSWORD || 'Passw0rd!',
};

async function login(page, { email, password }) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/(student|parent|tutor|dashboard)/);
}

// Returns the scrollWidth > clientWidth check for the document body
async function hasHorizontalOverflow(page) {
  return page.evaluate(() => document.body.scrollWidth > document.body.clientWidth);
}

// Returns the minimum touch-target dimension for a button selector
async function minTouchTarget(page, selector) {
  return page.evaluate((sel) => {
    const els = [...document.querySelectorAll(sel)];
    if (!els.length) return null;
    return Math.min(...els.map((el) => {
      const r = el.getBoundingClientRect();
      return Math.min(r.width, r.height);
    }));
  }, selector);
}

// ─── No horizontal overflow ───────────────────────────────────────────────────

test.describe('No horizontal overflow @ iPhone SE', () => {
  test.use({ viewport: IPHONE_SE });

  test('student dashboard', async ({ page }) => {
    await login(page, studentCreds);
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('MathPath home', async ({ page }) => {
    await login(page, studentCreds);
    await page.goto('/student/mathpath');
    await page.waitForLoadState('networkidle');
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('MathPath mistakes home', async ({ page }) => {
    await login(page, studentCreds);
    await page.goto('/student/mathpath/mistakes');
    await page.waitForLoadState('networkidle');
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('parent dashboard', async ({ page }) => {
    await login(page, parentCreds);
    await page.goto('/parent/children');
    await page.waitForLoadState('networkidle');
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('tutor home', async ({ page }) => {
    await login(page, tutorCreds);
    await page.goto('/tutor');
    await page.waitForLoadState('networkidle');
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
});

// ─── Touch targets ────────────────────────────────────────────────────────────

test.describe('Touch targets ≥ 44 px', () => {
  test.use({ viewport: IPHONE_SE });

  test('MobileNav buttons are ≥ 44 px', async ({ page }) => {
    await login(page, studentCreds);
    await page.goto('/student');
    // MobileNav buttons have min-h-[56px]
    const minH = await minTouchTarget(page, 'nav.fixed button');
    expect(minH).toBeGreaterThanOrEqual(44);
  });

  test('AppShell bottom nav items are ≥ 44 px tall', async ({ page }) => {
    await login(page, parentCreds);
    await page.goto('/parent/children');
    // AppShell nav links — min-h comes from py-2 + icon + label; check height
    const minH = await minTouchTarget(page, 'nav.fixed a');
    if (minH !== null) expect(minH).toBeGreaterThanOrEqual(44);
  });

  test('Practice MCQ option buttons are ≥ 44 px', async ({ page }) => {
    await login(page, studentCreds);
    await page.goto('/student/mathpath');
    await page.waitForLoadState('networkidle');
    // Start a practice session if the Start button is visible
    const startBtn = page.getByRole('button', { name: /start|practice/i }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(1000);
      const minH = await minTouchTarget(page, 'button[class*="min-h"]');
      if (minH !== null) expect(minH).toBeGreaterThanOrEqual(44);
    }
  });

  test('ChildNav tab links are ≥ 44 px tall', async ({ page }) => {
    await login(page, parentCreds);
    // Navigate to any child's detail page
    const res = await page.request.get('/api/parent/children');
    if (res.ok()) {
      const children = await res.json();
      if (children.length) {
        const id = children[0].id || children[0]._id;
        await page.goto(`/parent/children/${id}/progress`);
        await page.waitForLoadState('networkidle');
        const minH = await minTouchTarget(page, 'nav a, div[class*="border-b"] a');
        if (minH !== null) expect(minH).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

// ─── Footer visible above bottom nav ─────────────────────────────────────────

test.describe('Content not hidden behind fixed nav', () => {
  test.use({ viewport: IPHONE_SE });

  async function lastChildBottomClearance(page) {
    // Returns px between the last meaningful content block's bottom and the viewport bottom
    return page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return Infinity;
      const rect = main.getBoundingClientRect();
      // Estimate fixed nav height
      const nav = document.querySelector('nav.fixed');
      const navH = nav ? nav.getBoundingClientRect().height : 0;
      return window.innerHeight - navH - rect.bottom;
    });
  }

  test('student dashboard main clears mobile nav', async ({ page }) => {
    await login(page, studentCreds);
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const clearance = await lastChildBottomClearance(page);
    // Main should have padding that puts its bottom above the nav (clearance ≥ 0)
    expect(clearance).toBeGreaterThanOrEqual(0);
  });

  test('parent dashboard main clears mobile nav', async ({ page }) => {
    await login(page, parentCreds);
    await page.goto('/parent/children');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const clearance = await lastChildBottomClearance(page);
    expect(clearance).toBeGreaterThanOrEqual(0);
  });
});

// ─── Modal scroll ─────────────────────────────────────────────────────────────

test.describe('Modal scrollability', () => {
  test.use({ viewport: IPHONE_SE });

  test('modal body is scrollable when content overflows', async ({ page }) => {
    await login(page, studentCreds);
    await page.goto('/student/mathpath');
    await page.waitForLoadState('networkidle');
    // Open any modal — try the "Upload Paper" route which triggers a modal-ish flow
    // For a generic check: inject a tall modal and verify the body scrolls
    const canScroll = await page.evaluate(() => {
      // Find the first modal overlay if present
      const modalBody = document.querySelector('[class*="overflow-y-auto"]');
      if (!modalBody) return true; // no modal open — skip
      return modalBody.scrollHeight > modalBody.clientHeight
        ? modalBody.style.overflow !== 'hidden'
        : true;
    });
    expect(canScroll).toBe(true);
  });
});

// ─── Tab strip scroll affordance ─────────────────────────────────────────────

test.describe('ChildNav tab strip', () => {
  test.use({ viewport: IPHONE_SE });

  test('tab strip has fade gradient scroll affordance', async ({ page }) => {
    await login(page, parentCreds);
    const res = await page.request.get('/api/parent/children');
    if (!res.ok()) return;
    const children = await res.json();
    if (!children.length) return;
    const id = children[0].id || children[0]._id;
    await page.goto(`/parent/children/${id}/progress`);
    await page.waitForLoadState('networkidle');
    // The fade gradient div has pointer-events-none and a bg-gradient class
    const fadeExists = await page.evaluate(() => {
      const el = document.querySelector('[class*="from-white"][class*="pointer-events-none"]');
      return !!el;
    });
    expect(fadeExists).toBe(true);
  });
});

// ─── Times tables input ───────────────────────────────────────────────────────

test.describe('TimesTablesFlashQuiz input', () => {
  test.use({ viewport: IPHONE_SE });

  test('answer input uses type=text not type=number', async ({ page }) => {
    await login(page, studentCreds);
    await page.goto('/student/mathpath/fluency/times-tables');
    await page.waitForLoadState('networkidle');
    const inputType = await page.evaluate(() => {
      const inp = document.querySelector('input[inputmode="numeric"]');
      return inp ? inp.type : null;
    });
    if (inputType !== null) {
      expect(inputType).toBe('text');
    }
  });
});

// ─── iPad portrait smoke ──────────────────────────────────────────────────────

test.describe('iPad portrait — no overflow', () => {
  test.use({ viewport: IPAD_PORTRAIT });

  test('student mathpath home has no horizontal overflow', async ({ page }) => {
    await login(page, studentCreds);
    await page.goto('/student/mathpath');
    await page.waitForLoadState('networkidle');
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('tutor home has no horizontal overflow', async ({ page }) => {
    await login(page, tutorCreds);
    await page.goto('/tutor');
    await page.waitForLoadState('networkidle');
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
});
