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

const studentCandidates = [
  ...(process.env.QA_STUDENT_EMAILS ? process.env.QA_STUDENT_EMAILS.split(',').map((email) => email.trim()).filter(Boolean) : []),
  ...(process.env.PILOT_STUDENT_EMAIL ? [process.env.PILOT_STUDENT_EMAIL] : []),
  'demo.student@tianos.test',
  'pilot.student1@tianos.test',
  'pilot.student2@tianos.test',
  'pilot.student3@tianos.test',
  'pilot.student4@tianos.test',
  'pilot.student5@tianos.test',
  'test.student2@tianos.test',
  'test.student3@tianos.test',
];

const parentCandidates = [
  ...(process.env.QA_PARENT_EMAILS ? process.env.QA_PARENT_EMAILS.split(',').map((email) => email.trim()).filter(Boolean) : []),
  ...(process.env.PILOT_PARENT_EMAIL ? [process.env.PILOT_PARENT_EMAIL] : []),
  'demo.parent@tianos.test',
];

const unique = (items) => Array.from(new Set(items.filter(Boolean)));

async function loginFromCandidates(candidates, password = 'Passw0rd!') {
  for (const email of unique(candidates)) {
    const token = await login(email, password);
    if (token) return { token, email };
  }
  return { token: null, email: null };
}

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
  const { token: parentToken } = await loginFromCandidates(parentCandidates);
  ok('parent login', Boolean(parentToken));
  if (!parentToken) return;

  const children = await call(parentToken, 'GET', '/family/children');
  ok('/family/children responds', children.status === 200, `status=${children.status}`);
  const list = Array.isArray(children.data?.children) ? children.data.children : [];
  ok('parent sees at least one child', list.length > 0, `${list.length} children`);
}

async function runStudentGate() {
  console.log('\n2) Student practice gate');
  const { token: studentToken } = await loginFromCandidates(studentCandidates);
  ok('student login', Boolean(studentToken));
  if (!studentToken) return;

  const mastery = await call(studentToken, 'GET', '/mastery');
  ok('/mastery responds', mastery.status === 200, `status=${mastery.status}`);
  const rec = mastery.data?.recommended;
  if (rec?.skillId) {
    ok('recommended skill exists', true, rec?.skillName || '');
  } else {
    console.log('  NOTE: no recommended skill returned; using first available math skill as fallback');
  }

  const trySession = async (skillId) => {
    const session = await call(studentToken, 'POST', '/practice/sessions', { skillId, questionCount: 5 });
    const items = Array.isArray(session.data?.items) ? session.data.items : [];
    const started = (session.status === 201 || session.status === 200) && items.length > 0;
    return { started, status: session.status, items, reason: `status=${session.status}, items=${items.length}` };
  };

  let sessionResult = rec?.skillId ? await trySession(rec.skillId) : null;
  if (sessionResult && !sessionResult.started) {
    console.log(`  NOTE: recommended practice session not available (${sessionResult.reason})`);
  }

  if (!sessionResult || !sessionResult.started) {
    const skills = await call(studentToken, 'GET', '/skills?subject=math');
    const fallbackSkill = Array.isArray(skills.data?.skills)
      ? skills.data.skills.find((skill) => Number(skill?.availableQuestionCount || 0) > 0)
      : null;
    if (fallbackSkill?.skillId) {
      const fallback = await trySession(fallbackSkill.skillId);
      if (fallback.started) {
        sessionResult = { ...fallback, reason: `fallbackSkill=${fallbackSkill.name || fallbackSkill.skillId}` };
      }
    } else if (!sessionResult) {
      sessionResult = { started: false, reason: `no math skills with questions (skillsStatus=${skills.status})` };
    }
  }

  ok('practice session starts', sessionResult?.started === true, sessionResult?.reason || 'no session started');
  if (sessionResult?.started) {
    ok('session has questions (no empty set)', sessionResult.items.length > 0, `${sessionResult.items.length} items`);
  }
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
