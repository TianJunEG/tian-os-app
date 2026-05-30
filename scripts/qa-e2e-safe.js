// Safe/non-destructive QA check for pilot readiness.
// - No cleanup/deletes.
// - Reuses live seeded accounts.
// - Validates parent-child visibility and core student practice flow.
//
// Usage:
//   QA_BASE=http://localhost:5050/api node scripts/qa-e2e-safe.js

const BASE = process.env.QA_BASE || 'http://localhost:5050/api';
let pass = 0;
let fail = 0;
const findings = [];

const ok = (name, cond, detail = '') => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'} — ${name}${detail ? `  · ${detail}` : ''}`);
  if (cond) pass += 1;
  else {
    fail += 1;
    findings.push(name + (detail ? ` (${detail})` : ''));
  }
};

async function call(token, method, path, body) {
  const resp = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await resp.json().catch(() => ({}));
  return { status: resp.status, data };
}

async function login(email, password = 'Passw0rd!') {
  const r = await call(null, 'POST', '/auth/login', { email, password });
  return r.data?.token || null;
}

async function runParentGate() {
  console.log('\n1) Parent linkage gate');
  const parentToken = await login('demo.parent@tianos.test');
  ok('parent login', Boolean(parentToken));
  if (!parentToken) return;

  const children = await call(parentToken, 'GET', '/family/children');
  ok('/family/children responds', children.status === 200, `status=${children.status}`);
  const list = Array.isArray(children.data?.children) ? children.data.children : [];
  ok('parent sees at least one child', list.length > 0, `${list.length} children`);
}

async function runStudentGate() {
  console.log('\n2) Student practice gate');
  const studentToken = await login('demo.student@tianos.test');
  ok('student login', Boolean(studentToken));
  if (!studentToken) return;

  const mastery = await call(studentToken, 'GET', '/mastery');
  ok('/mastery responds', mastery.status === 200, `status=${mastery.status}`);
  const rec = mastery.data?.recommended;
  ok('recommended skill exists', Boolean(rec), rec?.skillName || '');

  if (!rec?.skillId) return;
  const session = await call(studentToken, 'POST', '/practice/sessions', { skillId: rec.skillId, questionCount: 5 });
  ok('practice session starts', session.status === 201 || session.status === 200, `status=${session.status}`);
  const items = Array.isArray(session.data?.items) ? session.data.items : [];
  ok('recommended path has questions (no empty set)', items.length > 0, `${items.length} items`);
}

async function main() {
  try {
    await runParentGate();
    await runStudentGate();
  } catch (err) {
    console.error('Unexpected QA error:', err?.message || err);
    findings.push(`Unexpected QA error: ${err?.message || String(err)}`);
    fail += 1;
  }

  console.log(`\n=== SAFE QA RESULT: ${pass} passed, ${fail} failed ===`);
  if (findings.length) {
    console.log('Findings:');
    findings.forEach((f) => console.log(`  • ${f}`));
  }
  process.exit(fail > 0 ? 1 : 0);
}

main();

