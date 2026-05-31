import fs from 'fs/promises';
import path from 'path';

const BASE = process.env.QA_BASE || 'http://localhost:5050/api';
const PASSWORD = 'Passw0rd!';

const ACCOUNTS = {
  student: 'demo.student@tianos.test',
  parent: 'demo.parent@tianos.test',
  tutor: 'demo.tutor@tianos.test',
  teacher: 'demo.teacher@tianos.test',
};

async function call(token, method, apiPath, body, workspaceId = null) {
  const r = await fetch(`${BASE}${apiPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(workspaceId ? { 'X-Workspace-Id': workspaceId } : {}),
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

async function roleWorkspace(token, role) {
  const ctx = await call(token, 'GET', '/context');
  if (ctx.status !== 200) return null;
  return (ctx.data?.workspaces || []).find((w) => String(w.role) === role)?.id || null;
}

function pushRow(rows, area, check, pass, severity = 'low', details = '') {
  rows.push({ area, check, pass, severity, details });
}

async function main() {
  const startedAt = new Date();
  const rows = [];

  // Student
  const studentToken = await login(ACCOUNTS.student);
  pushRow(rows, 'student', 'login', Boolean(studentToken), 'critical');
  if (studentToken) {
    const mastery = await call(studentToken, 'GET', '/mastery');
    pushRow(rows, 'student', '/mastery returns', mastery.status === 200, 'high', `status=${mastery.status}`);
    const rec = mastery.data?.recommended;
    pushRow(rows, 'student', 'recommended skill exists', Boolean(rec), 'high', rec?.skillName || '');
    if (rec?.skillId) {
      const sess = await call(studentToken, 'POST', '/practice/sessions', { skillId: rec.skillId, questionCount: 5 });
      const items = sess.data?.items || [];
      pushRow(rows, 'student', 'practice session starts', sess.status === 200 || sess.status === 201, 'high', `status=${sess.status}`);
      pushRow(rows, 'student', 'recommended skill has questions', items.length > 0, 'critical', `${items.length} items`);
    }
  }

  // Parent
  const parentToken = await login(ACCOUNTS.parent);
  pushRow(rows, 'parent', 'login', Boolean(parentToken), 'critical');
  if (parentToken) {
    const kids = await call(parentToken, 'GET', '/family/children');
    const list = Array.isArray(kids.data?.children) ? kids.data.children : [];
    pushRow(rows, 'parent', '/family/children returns', kids.status === 200, 'high', `status=${kids.status}`);
    pushRow(rows, 'parent', 'has visible children', list.length > 0, 'high', `${list.length} children`);
  }

  // Tutor
  const tutorToken = await login(ACCOUNTS.tutor);
  pushRow(rows, 'tutor', 'login', Boolean(tutorToken), 'critical');
  if (tutorToken) {
    const ws = await roleWorkspace(tutorToken, 'tutor');
    pushRow(rows, 'tutor', 'tutor workspace resolved', Boolean(ws), 'high', ws || '');
    if (ws) {
      const home = await call(tutorToken, 'GET', '/tutor/home', null, ws);
      const students = await call(tutorToken, 'GET', '/tutor/students', null, ws);
      pushRow(rows, 'tutor', '/tutor/home returns', home.status === 200, 'medium', `status=${home.status}`);
      pushRow(rows, 'tutor', '/tutor/students returns', students.status === 200, 'medium', `status=${students.status}`);
    }
  }

  // Teacher
  const teacherToken = await login(ACCOUNTS.teacher);
  pushRow(rows, 'teacher', 'login', Boolean(teacherToken), 'critical');
  if (teacherToken) {
    const ws = await roleWorkspace(teacherToken, 'teacher');
    pushRow(rows, 'teacher', 'teacher workspace resolved', Boolean(ws), 'high', ws || '');
    if (ws) {
      const home = await call(teacherToken, 'GET', '/teacher/home', null, ws);
      const classes = await call(teacherToken, 'GET', '/teacher/classes', null, ws);
      pushRow(rows, 'teacher', '/teacher/home returns', home.status === 200, 'medium', `status=${home.status}`);
      pushRow(rows, 'teacher', '/teacher/classes returns', classes.status === 200, 'medium', `status=${classes.status}`);
    }
  }

  const failRows = rows.filter((r) => !r.pass);
  const severityRank = { critical: 3, high: 2, medium: 1, low: 0 };
  const topSeverity = failRows.sort((a, b) => severityRank[b.severity] - severityRank[a.severity])[0]?.severity || 'none';

  const outDir = path.resolve('docs/mathpath/pilot/logs');
  await fs.mkdir(outDir, { recursive: true });
  const stamp = startedAt.toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(outDir, `founder-bundle-safe-${stamp}.md`);
  const lines = [
    '# Founder/Team Safe QA Bundle',
    '',
    `Run at: ${startedAt.toISOString()}`,
    `Base URL: ${BASE}`,
    '',
    '| Area | Check | Status | Severity | Details |',
    '|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.area} | ${r.check} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.severity} | ${r.details || ''} |`),
    '',
    `Overall: ${rows.length - failRows.length} PASS / ${failRows.length} FAIL`,
    `Top blocker severity: ${topSeverity}`,
    '',
  ];
  await fs.writeFile(outPath, lines.join('\n'), 'utf8');
  console.log(`Founder bundle log written: ${outPath}`);
  console.log(JSON.stringify({ total: rows.length, fails: failRows.length, topSeverity, outPath }, null, 2));
  process.exit(failRows.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Founder bundle QA failed:', err?.message || err);
  process.exit(1);
});

