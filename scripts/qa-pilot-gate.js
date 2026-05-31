import fs from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'docs/mathpath/pilot/logs');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = path.join(OUT_DIR, `pilot-qa-gate-${stamp}.md`);

function runCommand(cmd, args, options = {}) {
  const run = spawnSync(cmd, args, {
    cwd: options.cwd || ROOT,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });
  return {
    ok: run.status === 0,
    status: run.status ?? 1,
    stdout: run.stdout || '',
    stderr: run.stderr || '',
    command: [cmd, ...args].join(' '),
  };
}

function tail(text, lines = 30) {
  const chunks = String(text || '').trim().split('\n');
  return chunks.slice(Math.max(0, chunks.length - lines)).join('\n');
}

async function main() {
  const checks = [];
  const push = (area, check, result, artifact = '') => {
    checks.push({ area, check, pass: result.ok, status: result.status, artifact, result });
  };

  const preflight = runCommand('node', ['scripts/qa-pilot-preflight.js']);
  push('1.environment', 'preflight + seed account smoke', preflight);

  const backendFlow = runCommand('node', ['scripts/qa-e2e-safe.js']);
  push('2.seeded-accounts', 'backend safe student/parent smoke', backendFlow);

  const diagnostic = runCommand(
    'npx',
    ['playwright', 'test', '-c', 'playwright.pilot.config.js', 'tests/e2e/pilot-gate.diagnostic-placement.spec.js'],
    { cwd: path.join(ROOT, 'frontend') }
  );
  push('3.diagnostic', 'fractions diagnostic ui flow', diagnostic, 'frontend/playwright-report-pilot');

  const placementReuse = runCommand(
    'npx',
    ['playwright', 'test', '-c', 'playwright.pilot.config.js', 'tests/e2e/pilot-gate.diagnostic-placement.spec.js'],
    { cwd: path.join(ROOT, 'frontend') }
  );
  push('4.placement-persistence', 'placement persistence + reuse', placementReuse, 'frontend/playwright-report-pilot');

  const practice = runCommand(
    'npx',
    ['playwright', 'test', '-c', 'playwright.pilot.config.js', 'tests/e2e/pilot-gate.practice.spec.js'],
    { cwd: path.join(ROOT, 'frontend') }
  );
  push('5.practice', 'fractions practice ui flow', practice, 'frontend/playwright-report-pilot');

  const working = runCommand(
    'npx',
    ['playwright', 'test', '-c', 'playwright.pilot.config.js', 'tests/e2e/pilot-gate.working-upload.spec.js'],
    { cwd: path.join(ROOT, 'frontend') }
  );
  push('6.working-upload', 'working upload ui flow', working, 'frontend/playwright-report-pilot');

  const assessment = runCommand(
    'npx',
    ['playwright', 'test', '-c', 'playwright.pilot.config.js', 'tests/e2e/pilot-gate.assessment.spec.js'],
    { cwd: path.join(ROOT, 'frontend') }
  );
  push('7.assessment', 'assessment ui flow', assessment, 'frontend/playwright-report-pilot');

  const review = runCommand(
    'npx',
    ['playwright', 'test', '-c', 'playwright.pilot.config.js', 'tests/e2e/pilot-gate.review-screen.spec.js'],
    { cwd: path.join(ROOT, 'frontend') }
  );
  push('8.review-screen', 'question review screen', review, 'frontend/playwright-report-pilot');

  const crossDash = runCommand('node', ['scripts/qa-mathpath-dashboard-contract.js']);
  push('9.cross-dashboard', 'student/parent/tutor/teacher consistency contract', crossDash);

  const routeGuard = runCommand(
    'npx',
    ['playwright', 'test', '-c', 'playwright.pilot.config.js', 'tests/e2e/pilot-gate.route-guard.spec.js'],
    { cwd: path.join(ROOT, 'frontend') }
  );
  push('10.route-guard', 'tutor/teacher route availability and unauthorized block', routeGuard, 'frontend/playwright-report-pilot');

  const failCount = checks.filter((c) => !c.pass).length;
  const passCount = checks.length - failCount;

  await fs.mkdir(OUT_DIR, { recursive: true });
  const lines = [
    '# MathPath Pilot QA Gate',
    '',
    `Run at: ${new Date().toISOString()}`,
    '',
    '| Area | Check | Status | Exit | Artifact |',
    '|---|---|---|---:|---|',
    ...checks.map((c) => `| ${c.area} | ${c.check} | ${c.pass ? 'PASS' : 'FAIL'} | ${c.status} | ${c.artifact || '-'} |`),
    '',
    `Summary: ${passCount} PASS / ${failCount} FAIL`,
    '',
    '## Failure Tails',
    '',
    ...checks
      .filter((c) => !c.pass)
      .flatMap((c) => [
        `### ${c.area} — ${c.check}`,
        '```txt',
        tail(`${c.result.stdout}\n${c.result.stderr}`, 60) || '(no output)',
        '```',
        '',
      ]),
  ];
  await fs.writeFile(outPath, lines.join('\n'), 'utf8');
  console.log(`Pilot QA gate report: ${outPath}`);
  console.log(JSON.stringify({ passCount, failCount, outPath }, null, 2));
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('qa-pilot-gate failed:', err?.message || err);
  process.exit(1);
});

