import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import { createInterface } from 'readline/promises';

const STORAGE_STATE_PATH = '.auth/reference-site.json';
const DEFAULT_LOGIN_URL = 'https://student.koobits.com/login';
const DEFAULT_MAX_CAPTURES = 50;
const LARGE_CAPTURE_LIMIT = 80;
const VIEWPORT = { width: 1600, height: 1000 };

// Adjust these selectors if the reference site changes its markup.
const SELECTORS = {
  skillCandidates: [
    'button:visible',
    '[role="button"]:visible',
    'a:visible',
    '[tabindex]:visible',
    '[class*="skill" i]:visible',
    '[class*="card" i]:visible',
    '[class*="item" i]:visible'
  ],
  preferredSkillText: /skill\s*\d+/i,
  detailPanels: [
    '[data-testid*="detail" i]:visible',
    '[data-testid*="panel" i]:visible',
    '[class*="detail" i]:visible',
    '[class*="panel" i]:visible',
    '[class*="proficiency" i]:visible',
    '[class*="report" i]:visible',
    'aside:visible',
    'main:visible'
  ]
};

function parseArgs(argv) {
  const args = {
    login: false,
    url: '',
    out: '',
    max: DEFAULT_MAX_CAPTURES,
    confirmLarge: false,
    headless: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--login') args.login = true;
    else if (arg === '--url') args.url = argv[++i] || '';
    else if (arg === '--out') args.out = argv[++i] || '';
    else if (arg === '--max') args.max = Number(argv[++i]);
    else if (arg === '--confirm-large') args.confirmLarge = true;
    else if (arg === '--headless') args.headless = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isInteger(args.max) || args.max <= 0) {
    throw new Error('--max must be a positive integer.');
  }
  if (args.max > LARGE_CAPTURE_LIMIT && !args.confirmLarge) {
    throw new Error(`Refusing to capture more than ${LARGE_CAPTURE_LIMIT} skills unless --confirm-large is passed.`);
  }

  return args;
}

function usage() {
  return [
    'Usage:',
    '  node scripts/captureSkillPanels.js --login',
    '  node scripts/captureSkillPanels.js --url "https://student.koobits.com/report/proficiency" --out captures/p4-numbers-to-100000',
    '',
    'Options:',
    '  --login             Open Chromium for manual login and save .auth/reference-site.json',
    '  --url <url>         Authorised report page to capture',
    '  --out <dir>         Output directory for screenshots and manifest.json',
    '  --max <n>           Max visible skill captures, default 50',
    '  --confirm-large     Required when --max is greater than 80',
    '  --headless          Optional; non-headless is the default'
  ].join('\n');
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function screenshotName(index) {
  return `skill-${String(index).padStart(3, '0')}.png`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForManualEnter(message) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    await rl.question(message);
  } finally {
    rl.close();
  }
}

async function runLoginMode(args) {
  await ensureDir(path.dirname(STORAGE_STATE_PATH));

  const browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  try {
    await page.goto(args.url || DEFAULT_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('Chromium is open. Log in manually and navigate until the authorised report page is usable.');
    await waitForManualEnter(`Press Enter here when login is complete to save ${STORAGE_STATE_PATH}...`);
    await context.storageState({ path: STORAGE_STATE_PATH });
    console.log(`Saved storage state to ${STORAGE_STATE_PATH}`);
  } finally {
    await browser.close();
  }
}

async function waitForPageLoad(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1800);
}

async function getVisibleSkillCandidates(page, seenKeys) {
  const viewport = page.viewportSize() || VIEWPORT;
  const candidates = await page.evaluate(
    ({ selectorList, preferredSource, seen }) => {
      const preferred = new RegExp(preferredSource, 'i');
      const seenSet = new Set(seen);
      const elements = [];
      const elementSet = new Set();

      for (const selector of selectorList) {
        for (const element of document.querySelectorAll(selector)) {
          if (elementSet.has(element)) continue;
          elementSet.add(element);

          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          if (
            rect.width < 30 ||
            rect.height < 20 ||
            rect.bottom <= 0 ||
            rect.top >= window.innerHeight ||
            rect.right <= 0 ||
            rect.left >= window.innerWidth ||
            style.visibility === 'hidden' ||
            style.display === 'none' ||
            Number(style.opacity) === 0
          ) {
            continue;
          }

          const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
          const aria = element.getAttribute('aria-label') || '';
          const label = text || aria.trim();
          if (!label) continue;

          const isLeftSide = rect.left < window.innerWidth * 0.62;
          const isPlausibleSize = rect.width <= window.innerWidth * 0.7 && rect.height <= 260;
          const hasPreferredText = preferred.test(label);
          const isButtonLike =
            element.tagName === 'BUTTON' ||
            element.tagName === 'A' ||
            element.getAttribute('role') === 'button' ||
            element.hasAttribute('tabindex') ||
            /skill|card|item/i.test(element.className || '');

          if (!isLeftSide || !isPlausibleSize || (!hasPreferredText && !isButtonLike)) continue;

          const keyBase = label.toLowerCase();
          const key = hasPreferredText ? keyBase : `${keyBase}::${Math.round(rect.left)}::${Math.round(rect.top)}`;
          if (seenSet.has(key)) continue;

          elements.push({
            label,
            key,
            selector,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            hasPreferredText
          });
        }
      }

      elements.sort((a, b) => {
        if (a.hasPreferredText !== b.hasPreferredText) return a.hasPreferredText ? -1 : 1;
        if (Math.abs(a.y - b.y) > 8) return a.y - b.y;
        return a.x - b.x;
      });

      return elements;
    },
    {
      selectorList: SELECTORS.skillCandidates,
      preferredSource: SELECTORS.preferredSkillText.source,
      seen: [...seenKeys],
      viewport
    }
  );

  const unique = [];
  const keys = new Set();
  for (const candidate of candidates) {
    if (keys.has(candidate.key)) continue;
    keys.add(candidate.key);
    unique.push(candidate);
  }
  return unique;
}

async function clickCandidateByText(page, candidate) {
  const clicked = await page.evaluate(
    ({ label, selectorList }) => {
      const normalizedTarget = label.replace(/\s+/g, ' ').trim();
      for (const selector of selectorList) {
        for (const element of document.querySelectorAll(selector)) {
          const rect = element.getBoundingClientRect();
          const text = (element.innerText || element.textContent || element.getAttribute('aria-label') || '')
            .replace(/\s+/g, ' ')
            .trim();
          if (text !== normalizedTarget) continue;
          if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) {
            continue;
          }
          element.scrollIntoView({ block: 'center', inline: 'nearest' });
          element.click();
          return true;
        }
      }
      return false;
    },
    { label: candidate.label, selectorList: SELECTORS.skillCandidates }
  );

  if (!clicked) {
    await page.mouse.click(candidate.x + candidate.width / 2, candidate.y + candidate.height / 2);
  }
}

async function findDetailPanel(page) {
  const viewport = page.viewportSize() || VIEWPORT;

  for (const selector of SELECTORS.detailPanels) {
    const locator = page.locator(selector);
    const count = await locator.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const item = locator.nth(i);
      const box = await item.boundingBox().catch(() => null);
      if (!box) continue;
      const isRightSide = box.x > viewport.width * 0.32;
      const hasUsefulArea = box.width > 250 && box.height > 180;
      const isNotFullViewport = box.width < viewport.width * 0.98 || box.x > viewport.width * 0.2;
      if (isRightSide && hasUsefulArea && isNotFullViewport) {
        return { locator: item, selector };
      }
    }
  }

  return null;
}

async function captureDetail(page, outputPath) {
  const panel = await findDetailPanel(page);
  if (panel) {
    await panel.locator.screenshot({ path: outputPath });
    return { mode: 'panel', selector: panel.selector };
  }

  const viewport = page.viewportSize() || VIEWPORT;
  const clip = {
    x: Math.floor(viewport.width * 0.38),
    y: 0,
    width: Math.floor(viewport.width * 0.62),
    height: viewport.height
  };
  await page.screenshot({ path: outputPath, clip });
  return { mode: 'right-side-clip', selector: null };
}

async function scrollForMoreSkills(page) {
  return page.evaluate(() => {
    const beforeWindow = window.scrollY;
    const scrollables = [...document.querySelectorAll('*')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element,
          rect,
          canScroll: element.scrollHeight > element.clientHeight + 40,
          leftSide: rect.left < window.innerWidth * 0.62,
          visible: rect.width > 80 && rect.height > 100 && rect.bottom > 0 && rect.top < window.innerHeight
        };
      })
      .filter((item) => item.canScroll && item.leftSide && item.visible)
      .sort((a, b) => b.rect.height - a.rect.height);

    for (const item of scrollables) {
      const before = item.element.scrollTop;
      item.element.scrollTop += Math.floor(window.innerHeight * 0.65);
      if (item.element.scrollTop !== before) {
        return { changed: true, target: 'left-scroll-container' };
      }
    }

    window.scrollBy(0, Math.floor(window.innerHeight * 0.65));
    return { changed: window.scrollY !== beforeWindow, target: 'window' };
  });
}

async function writeManifest(outDir, manifest) {
  await fs.writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

async function runCaptureMode(args) {
  if (!args.url) throw new Error('Capture mode requires --url.');
  if (!args.out) throw new Error('Capture mode requires --out.');
  if (!(await fileExists(STORAGE_STATE_PATH))) {
    throw new Error(`Missing ${STORAGE_STATE_PATH}. Run: node scripts/captureSkillPanels.js --login`);
  }

  await ensureDir(args.out);

  const manifest = {
    url: args.url,
    timestamp: new Date().toISOString(),
    capturedCount: 0,
    max: args.max,
    skills: []
  };

  const browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext({
    storageState: STORAGE_STATE_PATH,
    viewport: VIEWPORT
  });
  const page = await context.newPage();

  try {
    await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForPageLoad(page);

    const seenKeys = new Set();
    let stagnantScrolls = 0;
    let captureIndex = 1;

    while (captureIndex <= args.max && stagnantScrolls < 3) {
      const candidates = await getVisibleSkillCandidates(page, seenKeys);
      if (candidates.length === 0) {
        const scrollResult = await scrollForMoreSkills(page);
        await page.waitForTimeout(1200);
        stagnantScrolls = scrollResult.changed ? stagnantScrolls + 1 : stagnantScrolls + 1;
        continue;
      }

      stagnantScrolls = 0;

      for (const candidate of candidates) {
        if (captureIndex > args.max) break;
        if (seenKeys.has(candidate.key)) continue;
        seenKeys.add(candidate.key);

        const fileName = screenshotName(captureIndex);
        const screenshotPath = path.join(args.out, fileName);
        const manifestEntry = {
          index: captureIndex,
          detectedLabel: normalizeText(candidate.label),
          screenshotPath,
          success: false,
          error: null
        };

        try {
          await clickCandidateByText(page, candidate);
          await page.waitForTimeout(1600);
          const captureMeta = await captureDetail(page, screenshotPath);
          manifestEntry.success = true;
          manifestEntry.captureMode = captureMeta.mode;
          manifestEntry.panelSelector = captureMeta.selector;
          manifest.capturedCount += 1;
          console.log(`Captured ${fileName}: ${manifestEntry.detectedLabel}`);
        } catch (error) {
          manifestEntry.error = error?.message || String(error);
          console.warn(`Failed ${fileName}: ${manifestEntry.error}`);
        }

        manifest.skills.push(manifestEntry);
        await writeManifest(args.out, manifest);
        captureIndex += 1;
        await wait(2500);
      }

      if (captureIndex <= args.max) {
        const scrollResult = await scrollForMoreSkills(page);
        await page.waitForTimeout(1200);
        if (!scrollResult.changed) stagnantScrolls += 1;
      }
    }

    await writeManifest(args.out, manifest);
    console.log(`Done. Captured ${manifest.capturedCount} skill panels. Manifest: ${path.join(args.out, 'manifest.json')}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  if (args.login) {
    await runLoginMode(args);
    return;
  }

  await runCaptureMode(args);
}

main().catch((error) => {
  console.error(error.message || error);
  console.error('');
  console.error(usage());
  process.exitCode = 1;
});
