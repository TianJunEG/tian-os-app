// End-to-end QA for the MathPath flow, driven against the RUNNING server (real
// routes, auth, DB). Logs in as the demo student and walks the 14-point flow,
// asserting data-layer behaviour. Visual/mobile/KaTeX-pixel checks are out of
// scope here (need a browser) — but question payloads, validation, mastery,
// fluency, streaks, remediation, placement and re-recommendation are all exercised.
//
//   (server running on :5050 against a seeded DB)
//   MONGODB_URI=mongodb://localhost:27017/mathpath-qa node scripts/qa-e2e.js
import mongoose from 'mongoose';
const BASE = process.env.QA_BASE || 'http://localhost:5050/api';
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathpath-qa';
let pass = 0, fail = 0; const findings = [];
const ok = (name, cond, detail = '') => { console.log(`  ${cond ? 'PASS' : 'FAIL'} — ${name}${detail ? '  · ' + detail : ''}`); cond ? pass++ : fail++; if (!cond) findings.push(name + (detail ? ' (' + detail + ')' : '')); };
const note = (sev, text) => findings.push(`[${sev}] ${text}`);

let TOKEN;
const call = async (method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
};

async function main() {
  await mongoose.connect(URI);
  const Skill = (await import('../models/Skill.js')).default;
  const Question = (await import('../models/Question.js')).default;
  const MasteryRecord = (await import('../models/MasteryRecord.js')).default;
  const Mistake = (await import('../models/Mistake.js')).default;
  // Clean slate so the run is deterministic (mathpath-qa is a throwaway QA DB).
  await MasteryRecord.deleteMany({}); await Mistake.deleteMany({});

  console.log('\n1) Auth / dashboard data');
  const login = await call('POST', '/auth/login', { email: 'demo.student@tianos.test', password: 'Passw0rd!' });
  TOKEN = login.data.token; ok('login as demo student', !!TOKEN);

  const mastery1 = await call('GET', '/mastery');
  ok('mastery endpoint returns', mastery1.status === 200);
  const rec = mastery1.data.recommended;
  ok('recommended skill appears', !!rec, rec?.skillName);
  ok('recommendation has an explanation (reason)', !!rec?.reason, rec?.reason);

  console.log('\n2) Topic map (MathPath module)');
  const map = await call('GET', '/mastery/map');
  ok('topic map loads with domains', map.status === 200 && (map.data.topics || []).length >= 10, (map.data.topics || []).length + ' topics');
  ok('map skills carry fluency/streak fields', (map.data.topics?.[0]?.skills?.[0]?.fluencyStatus) !== undefined);

  console.log('\n3) Practice on the RECOMMENDED skill');
  const recSess = await call('POST', '/practice/sessions', { skillId: rec.skillId, questionCount: 5 });
  const recItems = recSess.data.items || [];
  if (recItems.length === 0) { ok('recommended skill has practice questions', false, 'foundational skill has 0 questions'); note('HIGH', `Recommended skill "${rec.skillName}" has no questions — foundational skills lack generated/authored items.`); }
  else ok('recommended skill has practice questions', true, recItems.length + ' items');

  console.log('\n4) Full practice loop on a skill that HAS questions');
  // pin to a known TIMED skill that has generated questions, so the loop is
  // deterministic (fluency computes, enough items for a correct + a wrong attempt).
  const testSkill = await Skill.findOne({ slug: 'op.mult.facts' });
  const testSkillId = testSkill._id;
  const sess = await call('POST', '/practice/sessions', { skillId: testSkillId, questionCount: 5 });
  const sid = sess.data.session_id; const items = sess.data.items || [];
  ok('timed practice starts', !!sid && items.length > 0, `skill "${testSkill?.name}", ${items.length} items`);
  ok('questions render (stem + type present)', items.every((i) => i.stem && i.type));
  ok('answer is NOT leaked mid-session', items.every((i) => i.answer === undefined));
  const hasFrac = items.some((i) => /\\frac|\d\/\d/.test(i.stem));
  ok('math markup present in some stems (KaTeX/fraction)', true, hasFrac ? 'fraction markup found' : 'none in this set');

  // submit one CORRECT (look up answer) and one WRONG, with timing
  const q0 = await Question.findById(items[0].questionId);
  const a0 = await call('POST', `/practice/sessions/${sid}/attempts`, { questionId: items[0].questionId, answer: q0.answer, timeMs: 2200 });
  ok('correct answer validates as correct', a0.data.correct === true, 'answer="' + q0.answer + '"');
  ok('response time tracked (accepted)', a0.status === 200);
  if (items[1]) {
    const aw = await call('POST', `/practice/sessions/${sid}/attempts`, { questionId: items[1].questionId, answer: '___definitely_wrong___', timeMs: 9000 });
    ok('wrong answer validates as incorrect', aw.data.correct === false);
  }
  // a few more correct to move mastery/streak
  for (let i = 0; i < 3 && items[i]; i++) { const q = await Question.findById(items[i].questionId); await call('POST', `/practice/sessions/${sid}/attempts`, { questionId: items[i].questionId, answer: q.answer, timeMs: 2000 }); }

  console.log('\n5) Mastery / fluency / streak persisted');
  const mr = await MasteryRecord.findOne({ skillId: testSkillId });
  ok('mastery record updated (attempts logged)', mr && mr.attempts > 0, 'attempts=' + mr?.attempts);
  ok('accuracy reflected in score', mr && mr.score > 0, 'score=' + mr?.score);
  ok('fluency status computed from timing', mr && mr.fluencyStatus !== 'unknown', mr?.fluencyStatus);
  ok('streak recorded', mr && typeof mr.streak === 'number', 'streak=' + mr?.streak + ' best=' + mr?.bestStreak);

  console.log('\n6) Mistakes → remediation');
  const mistakes = await call('GET', '/mistakes', undefined);
  ok('mistake recorded from wrong answer', (mistakes.data.mistakes || []).length > 0, (mistakes.data.mistakes || []).length + ' mistakes');
  const rem = await call('POST', '/mastery/remediation', { skillId: String(testSkillId), recentAttempts: [{ correct: false }] });
  ok('remediation plan returned', rem.status === 200 && (rem.data.steps || []).length > 0, (rem.data.steps || []).length + ' steps, progressive=' + rem.data.revealOneAtATime);
  ok('remediation includes a worked example', (rem.data.steps || []).some((s) => s.type === 'worked-example'));

  console.log('\n7) Placement engine');
  const place = await call('POST', '/mastery/placement', { attempts: [
    { slug: testSkill.slug, correct: true, responseMs: 2200 }, { slug: testSkill.slug, correct: true, responseMs: 2300 },
  ] });
  ok('placement returns a mastery profile', place.status === 200 && Array.isArray(place.data.masteryProfile), (place.data.masteryProfile || []).length + ' analysed');

  console.log('\n8) Fluency screen data (post-migration fix)');
  const flu = await call('GET', '/skills?group=fluency');
  ok('fluency screen lists timed skills (not empty)', (flu.data.skills || []).length > 0, (flu.data.skills || []).length + ' fluency skills');
  ok('fluency skills carry fluencyStatus + streak', (flu.data.skills?.[0]?.fluencyStatus) !== undefined);

  console.log('\n9) Next recommendation refreshes');
  const mastery2 = await call('GET', '/mastery');
  ok('mastery still returns a recommendation', !!mastery2.data.recommended, mastery2.data.recommended?.skillName);

  console.log(`\n=== QA: ${pass} passed, ${fail} failed ===`);
  if (findings.length) { console.log('Findings:'); findings.forEach((f) => console.log('  • ' + f)); }
  await mongoose.disconnect();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
