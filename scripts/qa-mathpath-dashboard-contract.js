import fs from 'fs/promises';
import path from 'path';
import { runMathPathDomainPipeline } from '../frontend/src/mathpath/orchestration/mathPathDomainOrchestrator.js';
import { validateStudentDashboardPayload } from '../frontend/src/mathpath/orchestration/pipelineContract.js';

const BASE = process.env.QA_BASE || 'http://localhost:5050/api';
const PASSWORD = 'Passw0rd!';
const STUDENTS = [
  ...(process.env.QA_DASHBOARD_STUDENTS ? process.env.QA_DASHBOARD_STUDENTS.split(',').map((email) => email.trim()).filter(Boolean) : []),
  ...(process.env.PILOT_STUDENT_EMAIL ? [process.env.PILOT_STUDENT_EMAIL] : []),
  ...(process.env.PILOT_STUDENT2_EMAIL ? [process.env.PILOT_STUDENT2_EMAIL] : []),
  ...(process.env.PILOT_STUDENT3_EMAIL ? [process.env.PILOT_STUDENT3_EMAIL] : []),
  ...(process.env.PILOT_STUDENT4_EMAIL ? [process.env.PILOT_STUDENT4_EMAIL] : []),
  ...(process.env.PILOT_STUDENT5_EMAIL ? [process.env.PILOT_STUDENT5_EMAIL] : []),
  'demo.student@tianos.test',
  'pilot.student1@tianos.test',
  'pilot.student2@tianos.test',
  'pilot.student3@tianos.test',
  'pilot.student4@tianos.test',
  'pilot.student5@tianos.test',
];

const UNIQUE_STUDENTS = [...new Set(STUDENTS.filter(Boolean))];

async function call(token, method, apiPath, body) {
  const r = await fetch(`${BASE}${apiPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

async function login(email) {
  const r = await call(null, 'POST', '/auth/login', { email, password: PASSWORD });
  return r.data?.token || null;
}

async function runOne(email) {
  const token = await login(email);
  if (!token) {
    return { email, pass: false, reason: 'login failed' };
  }

  const mastery = await call(token, 'GET', '/mastery');
  if (mastery.status !== 200) {
    return { email, pass: false, reason: `/mastery status ${mastery.status}` };
  }

  const rec = mastery.data?.recommended || null;
  const weakSkillIds = (mastery.data?.weakSkills || []).map((w) => String(w.skillId || '')).filter(Boolean);
  const masteredSkillIds = (mastery.data?.records || [])
    .filter((r) => r.status === 'mastered')
    .map((r) => String(r.skillId || ''))
    .filter(Boolean);
  const currentSkillId = rec?.skillId ? String(rec.skillId) : weakSkillIds[0] || 'F001';

  const payload = runMathPathDomainPipeline({
    studentId: email,
    domainId: 'fractions',
    mode: 'full',
    diagnosticResult: {
      masteredSkillIds,
      weakSkillIds,
      recommendedStartingSkillId: currentSkillId,
    },
    practiceState: {
      masteredSkillIds,
      weakSkillIds,
      currentSkillId,
    },
    fluencyState: {
      fluentSkillIds: [],
      accurateButSlowAreas: [],
    },
    retentionState: {
      retainedSkillIds: [],
      skillsDueForReview: [],
      skillsNeedingRefresh: [],
    },
    assessmentResults: [],
    mistakePlans: [],
    workingAnalysisSummary: {},
  });

  const contract = validateStudentDashboardPayload(payload);
  return {
    email,
    pass: contract.valid,
    reason: contract.valid ? 'contract valid' : contract.errors.join(' | '),
    currentSkill: payload?.studentProgress?.currentSkill || '',
    nextAction: payload?.studentProgress?.nextRecommendedAction?.action || '',
  };
}

async function main() {
  const started = new Date();
  const results = [];
  for (const email of UNIQUE_STUDENTS) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await runOne(email));
  }

  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.length - passCount;
  const stamp = started.toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve('docs/mathpath/pilot/logs');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `dashboard-contract-${stamp}.md`);
  const lines = [
    '# Dashboard Contract QA',
    '',
    `Run at: ${started.toISOString()}`,
    `Base: ${BASE}`,
    '',
    '| Student | Status | Current Skill | Next Action | Notes |',
    '|---|---|---|---|---|',
    ...results.map((r) => `| ${r.email} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.currentSkill || '-'} | ${r.nextAction || '-'} | ${r.reason} |`),
    '',
    `Summary: ${passCount} PASS / ${failCount} FAIL`,
    '',
  ];
  await fs.writeFile(outPath, lines.join('\n'), 'utf8');

  console.log(`Dashboard contract QA written: ${outPath}`);
  console.log(JSON.stringify({ passCount, failCount, outPath }, null, 2));
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Dashboard contract QA failed:', err?.message || err);
  process.exit(1);
});
