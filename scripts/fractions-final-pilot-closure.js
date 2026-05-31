import fs from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';

const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, 'docs/mathpath/pilot/logs');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = path.join(LOG_DIR, `fractions-final-closure-${stamp}.md`);

function run(command, args, options = {}) {
  const res = spawnSync(command, args, {
    cwd: options.cwd || ROOT,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });
  return {
    ok: res.status === 0,
    status: res.status ?? 1,
    cmd: [command, ...args].join(' '),
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  };
}

function tail(text, lines = 40) {
  const arr = String(text || '').trim().split('\n');
  return arr.slice(Math.max(0, arr.length - lines)).join('\n');
}

async function main() {
  const gates = [];
  const add = (id, gate, result, critical = true, notes = '') => {
    gates.push({ id, gate, result, critical, notes, pass: result.ok });
  };

  add(
    1,
    'Fractions depth regression tests',
    run('npm', ['test', '--', 'utils/fractionsDepthPass.test.js', 'utils/fractionsCurriculumVisibility.test.js', 'utils/fractionsSecondaryG1.test.js']),
    true
  );

  add(2, 'Regenerate Fractions coverage report', run('node', ['scripts/updateFractionsCoverageReport.js']), false);
  add(3, 'Seeded DB coverage proof (alpha pack seed)', run('node', ['scripts/seedFractionsAlphaPack.js']), true);
  add(4, 'Pilot API preflight (backend/CORS/seed accounts)', run('node', ['scripts/qa-pilot-preflight.js']), true);

  const failCritical = gates.filter((g) => g.critical && !g.pass).length;
  const decision = failCritical > 0 ? 'NO-GO' : 'CONDITIONAL GO';

  await fs.mkdir(LOG_DIR, { recursive: true });
  const lines = [
    '# Fractions Final Pilot Closure Checklist',
    '',
    `Run at: ${new Date().toISOString()}`,
    '',
    '| Gate | Check | Critical | Status | Exit |',
    '|---:|---|---|---|---:|',
    ...gates.map((g) => `| ${g.id} | ${g.gate} | ${g.critical ? 'Yes' : 'No'} | ${g.pass ? 'PASS' : 'FAIL'} | ${g.result.status} |`),
    '',
    `Final decision: **${decision}**`,
    '',
    '## Failure evidence',
    '',
    ...gates
      .filter((g) => !g.pass)
      .flatMap((g) => [
        `### Gate ${g.id}: ${g.gate}`,
        '```txt',
        tail(`${g.result.stdout}\n${g.result.stderr}`) || '(no output)',
        '```',
        '',
      ]),
  ];
  await fs.writeFile(outPath, lines.join('\n'), 'utf8');

  console.log(JSON.stringify({
    outPath,
    decision,
    total: gates.length,
    pass: gates.filter((g) => g.pass).length,
    fail: gates.filter((g) => !g.pass).length,
    failCritical,
  }, null, 2));

  process.exit(failCritical > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('fractions-final-pilot-closure failed:', err?.message || err);
  process.exit(1);
});

