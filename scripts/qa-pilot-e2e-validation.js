#!/usr/bin/env node
// Pilot E2E Validation — Tasks 2 & 3
//
// Task 2: Fluency end-to-end (start session → answer → complete → verify telemetry + retention)
// Task 3: Full Mistake-to-Mastery loop (incorrect answer → mistake recorded → remediation →
//          parent dashboard → tutor dashboard → telemetry)
//
// Generates JWT tokens directly to bypass login rate limits.
//
// Usage: node scripts/qa-pilot-e2e-validation.js

import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import Skill from '../models/Skill.js';
import Topic from '../models/Topic.js';

dotenv.config();

const BASE = process.env.API_URL || 'http://localhost:5001';
const JWT_SECRET = process.env.JWT_SECRET;
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

const results = [];
let studentToken, parentToken, tutorToken;
let studentUserId, parentUserId, tutorUserId;
let studentRecordId; // Student._id (not the user ID)
let fluencySkillId;

function record(section, test, pass, detail = '') {
  const status = pass ? 'PASS' : 'FAIL';
  results.push({ section, test, status, detail });
  const icon = pass ? '✅' : '❌';
  console.log(`  ${icon} ${test}${detail ? ` — ${detail}` : ''}`);
}

function mintToken(userId, role) {
  return jwt.sign({ id: String(userId), role }, JWT_SECRET, { expiresIn: '1h' });
}

async function api(method, path, body = null, token = null) {
  const url = `${BASE}${path}`;
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, ok: res.ok };
}

// ─── Setup ───────────────────────────────────────────────────────────────────

async function setup() {
  console.log('\n🔧 Resolving test accounts from database...');
  await mongoose.connect(URI);

  const studentUser = await User.findOne({ email: 'demo.student@tianos.test' });
  const parentUser = await User.findOne({ email: 'demo.parent@tianos.test' });
  const tutorUser = await User.findOne({ email: 'demo.tutor@tianos.test' });

  if (!studentUser) throw new Error('No demo.student@tianos.test user found — run seed:foundation');
  studentUserId = studentUser._id;
  parentUserId = parentUser?._id;
  tutorUserId = tutorUser?._id;

  record('Setup', 'Student user found', true, `id=${studentUserId}`);
  record('Setup', 'Parent user found', Boolean(parentUserId), parentUserId ? `id=${parentUserId}` : 'missing');
  record('Setup', 'Tutor user found', Boolean(tutorUserId), tutorUserId ? `id=${tutorUserId}` : 'missing');

  // Mint JWT tokens directly (bypasses login rate limits)
  studentToken = mintToken(studentUserId, 'student');
  if (parentUserId) parentToken = mintToken(parentUserId, 'parent');
  if (tutorUserId) tutorToken = mintToken(tutorUserId, 'tutor');

  // Verify student token works
  const meRes = await api('GET', '/api/auth/me', null, studentToken);
  record('Setup', 'Student token valid (GET /auth/me)', meRes.ok, meRes.ok ? `role=${meRes.data?.user?.role}` : JSON.stringify(meRes.data));

  // Find Student record
  const studentRecord = await Student.findOne({ userId: studentUserId });
  if (studentRecord) {
    studentRecordId = String(studentRecord._id);
    record('Setup', 'Student profile found', true, `name=${studentRecord.name}, level=${studentRecord.level}`);
  } else {
    record('Setup', 'Student profile found', false, 'No Student record for this user');
  }

  // Check guardian relationship
  if (studentRecordId && parentUserId) {
    const guardian = await StudentGuardian.findOne({ studentId: studentRecord._id, guardianUserId: parentUserId });
    record('Setup', 'Parent-student guardian link', Boolean(guardian), guardian ? 'linked' : 'NOT linked — parent dashboard may 403');
  }

  // Find a fluency skill
  const fluencyTopic = await Topic.findOne({ name: 'Number Fluency' });
  if (fluencyTopic) {
    const skill = await Skill.findOne({ topicId: fluencyTopic._id });
    if (skill) {
      fluencySkillId = String(skill._id);
      record('Setup', 'Fluency skill available', true, `"${skill.name}" id=${fluencySkillId}`);
    } else {
      record('Setup', 'Fluency skill available', false, 'Topic exists but no skills — run seed:fluency');
    }
  } else {
    record('Setup', 'Fluency topic exists', false, 'No "Number Fluency" topic — run seed:fluency');
  }

  await mongoose.disconnect();
}

// ─── Task 2: Fluency E2E ────────────────────────────────────────────────────

async function validateFluencyE2E() {
  console.log('\n━━━ Task 2: Fluency End-to-End ━━━');

  if (!fluencySkillId) {
    record('Fluency', 'BLOCKED — no fluency skill', false, 'Run seed:fluency first');
    return;
  }

  // 2a. Pre-session summary
  console.log('\n📊 2a. Fluency summary...');
  const summaryRes = await api('GET', '/api/fluency/me', null, studentToken);
  record('Fluency', 'GET /fluency/me returns 200', summaryRes.ok, summaryRes.ok ? '' : JSON.stringify(summaryRes.data).slice(0, 100));
  if (summaryRes.ok) {
    const d = summaryRes.data;
    record('Fluency', 'Response has fluency buckets', Array.isArray(d.fluentSkills) && Array.isArray(d.developingSkills));
  }

  // 2b. Start session
  console.log('\n🚀 2b. Starting fluency session...');
  const startRes = await api('POST', '/api/fluency/session/start', {
    skillId: fluencySkillId,
    questionCount: 5,
  }, studentToken);
  record('Fluency', 'POST /fluency/session/start', startRes.ok, startRes.ok ? '' : JSON.stringify(startRes.data).slice(0, 120));

  if (!startRes.ok) {
    record('Fluency', 'SESSION BLOCKED', false, 'Cannot start');
    return;
  }

  const sessionId = startRes.data?.session_id;
  const items = startRes.data?.items || [];
  record('Fluency', 'Session has questions', items.length > 0, `${items.length} questions`);
  record('Fluency', 'Session has skill info', Boolean(startRes.data?.skillName), startRes.data?.skillName);
  record('Fluency', 'Mode is fluency', startRes.data?.mode === 'fluency');

  if (!sessionId || !items.length) return;

  // 2c. Build answers
  const attempts = items.map((item, i) => ({
    questionId: String(item.questionId),
    answer: String(i + 1),
    timeTakenSeconds: 3 + Math.random() * 7,
    confidence: i % 3 === 0 ? 'high' : 'medium',
    correct: i % 2 === 0,
  }));

  // 2d. Complete
  console.log(`\n🏁 2d. Completing fluency session (${items.length} answers)...`);
  const completeRes = await api('POST', '/api/fluency/session/complete', { sessionId, attempts }, studentToken);
  record('Fluency', 'POST /fluency/session/complete', completeRes.ok, completeRes.ok ? '' : JSON.stringify(completeRes.data).slice(0, 120));

  if (completeRes.ok) {
    const f = completeRes.data?.fluency || {};
    record('Fluency', 'Fluency metrics returned', f.totalQuestions !== undefined, `total=${f.totalQuestions}, correct=${f.correctAnswers}`);
    record('Fluency', 'Fluency score calculated', f.fluencyScore !== undefined, `score=${f.fluencyScore}`);
    record('Fluency', 'Fluency status assigned', Boolean(f.fluencyStatus), `status=${f.fluencyStatus}`);
    record('Fluency', 'Record persisted', Boolean(completeRes.data?.record));
  }

  // 2e. Post-session summary
  console.log('\n📊 2e. Verifying summary updated...');
  const postSummary = await api('GET', '/api/fluency/me', null, studentToken);
  record('Fluency', 'Post-session summary loads', postSummary.ok);
  if (postSummary.ok) {
    const d = postSummary.data;
    const totalTracked = (d.fluentSkills?.length || 0) + (d.developingSkills?.length || 0) + (d.needsPracticeSkills?.length || 0);
    record('Fluency', 'Skills tracked after session', totalTracked > 0, `tracked=${totalTracked}`);
    record('Fluency', 'Empty state cleared', d.emptyState === null, d.emptyState || 'cleared');
  }

  // 2f. Retention schedule
  console.log('\n🔄 2f. Retention schedule...');
  const retRes = await api('GET', '/api/fluency/me/retention', null, studentToken);
  record('Fluency', 'GET /fluency/me/retention', retRes.ok);
  if (retRes.ok) {
    record('Fluency', 'Retention structure valid', retRes.data?.upcomingReviews !== undefined);
  }

  // 2g. Telemetry
  console.log('\n📡 2g. Fluency telemetry...');
  const analyticsRes = await api('GET', '/api/mastery/analytics', null, studentToken);
  record('Fluency', 'Analytics endpoint works', analyticsRes.ok);
}

// ─── Task 3: Full Mistake-to-Mastery Loop ────────────────────────────────────

async function validateMistakeToMastery() {
  console.log('\n━━━ Task 3: Mistake-to-Mastery Full Loop ━━━');

  // 3a. Start practice
  console.log('\n🎯 3a. Starting fractions practice...');
  const practiceRes = await api('POST', '/api/mastery/fractions/practice/start', { questionCount: 4 }, studentToken);
  record('M2M', 'POST fractions/practice/start', practiceRes.ok, practiceRes.ok ? '' : JSON.stringify(practiceRes.data).slice(0, 120));

  const practiceSessionId = practiceRes.data?.practiceSessionId;
  const questions = practiceRes.data?.questions || [];
  if (practiceRes.ok) {
    record('M2M', 'Session created', Boolean(practiceSessionId), `id=${practiceSessionId?.slice(0, 30)}`);
    record('M2M', 'Questions returned', questions.length > 0, `${questions.length} questions`);
  }

  if (!practiceSessionId || !questions.length) {
    record('M2M', 'PRACTICE BLOCKED', false, 'Cannot proceed without session');
    return;
  }

  // 3b. Submit with deliberate wrong answers
  console.log('\n❌ 3b. Submitting answers (some wrong, with confidence + working)...');
  const responses = questions.map((q, i) => ({
    questionId: q.questionId,
    studentAnswer: i === 0 ? 'DELIBERATELY_WRONG' : (q.answer?.display || '1/2'),
    timeTaken: 10 + i * 5,
    confidence: i === 0 ? 'i_know_this' : 'medium',
    workingSubmitted: i === 0,
  }));

  const submitRes = await api('POST', `/api/mastery/fractions/practice/${practiceSessionId}/submit`, { responses }, studentToken);
  record('M2M', 'POST practice/:id/submit', submitRes.ok, submitRes.ok ? '' : JSON.stringify(submitRes.data).slice(0, 120));

  if (submitRes.ok) {
    const d = submitRes.data;
    const r = d.results || [];
    record('M2M', 'Results returned', r.length > 0, `${r.length} results`);
    const wrongCount = r.filter(x => x.correct === false).length;
    record('M2M', 'Wrong answers detected', wrongCount > 0, `${wrongCount} wrong`);
    record('M2M', 'Persisted', d.persisted === true);
  }

  // 3c. Mistakes
  console.log('\n📋 3c. Checking mistakes...');
  const mistakesRes = await api('GET', '/api/mistakes', null, studentToken);
  record('M2M', 'GET /mistakes', mistakesRes.ok);
  let latestMistakeId = null;
  if (mistakesRes.ok) {
    const mistakes = Array.isArray(mistakesRes.data) ? mistakesRes.data : (mistakesRes.data?.mistakes || []);
    record('M2M', 'Mistakes exist', mistakes.length > 0, `${mistakes.length} total`);
    if (mistakes.length > 0) {
      const m = mistakes[0];
      latestMistakeId = m._id;
      record('M2M', 'Has confidence', Boolean(m.confidence), `confidence=${m.confidence}`);
      record('M2M', 'Has skill ref', Boolean(m.skillCode || m.skillId || m.skillName));
      record('M2M', 'Has question data', Boolean(m.questionStem || m.questionId));
    }
  }

  // 3d. Mistake learning flow
  if (latestMistakeId) {
    console.log('\n🔍 3d. Mistake review (acknowledge)...');
    const ackRes = await api('PATCH', `/api/mistakes/${latestMistakeId}/learning`, { action: 'acknowledge' }, studentToken);
    record('M2M', 'PATCH learning (acknowledge)', ackRes.ok, ackRes.ok ? `status=${ackRes.data?.learningStatus}` : JSON.stringify(ackRes.data).slice(0, 100));
  }

  // 3e. Remediation
  console.log('\n💊 3e. Remediation plan...');
  const graphRes = await api('GET', '/api/mastery/graph', null, studentToken);
  let remSkillId = null;
  if (graphRes.ok) {
    const skills = graphRes.data?.skills || [];
    record('M2M', 'Skill graph loaded', skills.length > 0, `${skills.length} skills`);
    const match = skills.find(s => s.mongoId);
    remSkillId = match?.mongoId;
  }

  if (remSkillId) {
    const remRes = await api('POST', '/api/mastery/remediation', {
      skillId: remSkillId,
      recentAttempts: [{
        answer: 'WRONG', correct: false, confidence: 'i_know_this',
        workingEvidence: { qualityBand: 'GOOD', detectedMethod: 'common_denominator', detectedIssue: 'missing_step' },
      }],
    }, studentToken);
    record('Remediation', 'POST /remediation', remRes.ok, remRes.ok ? '' : JSON.stringify(remRes.data).slice(0, 120));
    if (remRes.ok) {
      const p = remRes.data;
      record('Remediation', 'Has strategy', Boolean(p.strategy), `strategy=${p.strategy}`);
      record('Remediation', 'Has stages/steps', Boolean(p.stages?.length || p.steps?.length || p.workedExample));
      record('Remediation', 'Working evidence flag', p.workingEvidenceUsed !== undefined, `used=${p.workingEvidenceUsed}`);
    }
  } else {
    record('Remediation', 'Skill resolution from graph', false, 'No mongoId in graph skills');
  }

  // 3f. Parent Dashboard
  console.log('\n👨‍👩‍👧 3f. Parent Dashboard...');
  if (parentToken && studentRecordId) {
    const sid = studentRecordId;
    const pMastery = await api('GET', `/api/mastery/?studentId=${sid}`, null, parentToken);
    record('Parent', 'GET /mastery', pMastery.ok, pMastery.ok ? '' : `${pMastery.status}: ${JSON.stringify(pMastery.data).slice(0, 80)}`);

    const pAnalytics = await api('GET', `/api/mastery/analytics?studentId=${sid}`, null, parentToken);
    record('Parent', 'GET /analytics', pAnalytics.ok, pAnalytics.ok ? '' : `${pAnalytics.status}`);

    const pFluency = await api('GET', `/api/fluency/student/${sid}`, null, parentToken);
    record('Parent', 'GET /fluency/student/:id', pFluency.ok, pFluency.ok ? '' : `${pFluency.status}`);

    const pGraph = await api('GET', `/api/mastery/graph?studentId=${sid}`, null, parentToken);
    record('Parent', 'GET /graph', pGraph.ok, pGraph.ok ? `skills=${pGraph.data?.skills?.length}` : `${pGraph.status}`);

    if (pAnalytics.ok) {
      const d = pAnalytics.data;
      record('Parent', 'Has accuracy data', d.accuracy !== undefined || d.overallAccuracy !== undefined);
      record('Parent', 'Has mastery data', d.skillsMastered !== undefined || d.masteryVelocity !== undefined);
    }
  } else {
    record('Parent', 'Dashboard check', false, parentToken ? 'No studentRecordId' : 'No parent token');
  }

  // 3g. Tutor Dashboard
  console.log('\n🧑‍🏫 3g. Tutor Dashboard...');
  if (tutorToken && studentRecordId) {
    const sid = studentRecordId;
    const tMastery = await api('GET', `/api/mastery/?studentId=${sid}`, null, tutorToken);
    record('Tutor', 'GET /mastery', tMastery.ok, tMastery.ok ? '' : `${tMastery.status}: ${JSON.stringify(tMastery.data).slice(0, 80)}`);

    const tAnalytics = await api('GET', `/api/mastery/analytics?studentId=${sid}`, null, tutorToken);
    record('Tutor', 'GET /analytics', tAnalytics.ok, tAnalytics.ok ? '' : `${tAnalytics.status}`);

    const tGraph = await api('GET', `/api/mastery/graph?studentId=${sid}`, null, tutorToken);
    record('Tutor', 'GET /graph', tGraph.ok, tGraph.ok ? `skills=${tGraph.data?.skills?.length}` : `${tGraph.status}`);

    const tFluency = await api('GET', `/api/fluency/student/${sid}`, null, tutorToken);
    record('Tutor', 'GET /fluency/student/:id', tFluency.ok, tFluency.ok ? '' : `${tFluency.status}`);
  } else {
    record('Tutor', 'Dashboard check', false, tutorToken ? 'No studentRecordId' : 'No tutor token');
  }

  // 3h. Telemetry
  console.log('\n📡 3h. Telemetry...');
  const aRes = await api('GET', '/api/mastery/analytics', null, studentToken);
  record('Telemetry', 'Analytics returns data', aRes.ok);
  if (aRes.ok) {
    const d = aRes.data;
    record('Telemetry', 'Has accuracy', d.accuracy !== undefined || d.overallAccuracy !== undefined);
    record('Telemetry', 'Has mastery velocity', d.masteryVelocity !== undefined || d.skillsMastered !== undefined);
    record('Telemetry', 'Has timing analytics', d.timingAnalytics !== undefined);
  }
}

// ─── Report ──────────────────────────────────────────────────────────────────

function printReport() {
  console.log('\n\n' + '═'.repeat(70));
  console.log('  PILOT VALIDATION REPORT');
  console.log('═'.repeat(70));

  const sections = [...new Set(results.map(r => r.section))];
  let totalPass = 0, totalFail = 0;

  for (const section of sections) {
    const sectionResults = results.filter(r => r.section === section);
    const pass = sectionResults.filter(r => r.status === 'PASS').length;
    const fail = sectionResults.filter(r => r.status === 'FAIL').length;
    totalPass += pass;
    totalFail += fail;
    console.log(`\n  ${section}: ${pass}/${pass + fail} passed`);
    for (const r of sectionResults) {
      if (r.status === 'FAIL') {
        console.log(`    ❌ ${r.test}${r.detail ? ` — ${r.detail}` : ''}`);
      }
    }
  }

  console.log('\n' + '─'.repeat(70));
  console.log(`  TOTAL: ${totalPass}/${totalPass + totalFail} passed, ${totalFail} failed`);
  if (totalFail === 0) console.log('\n  🎉 ALL CHECKS PASSED — Pilot ready!');
  else console.log(`\n  ⚠️  ${totalFail} check(s) need attention before pilot.`);
  console.log('═'.repeat(70));

  console.log('\n  PILOT READINESS MATRIX:');
  const matrix = {
    'Fluency E2E': results.filter(r => r.section === 'Fluency'),
    'Mistake Detection + Practice': results.filter(r => r.section === 'M2M'),
    'Remediation': results.filter(r => r.section === 'Remediation'),
    'Parent Dashboard': results.filter(r => r.section === 'Parent'),
    'Tutor Dashboard': results.filter(r => r.section === 'Tutor'),
    'Telemetry': results.filter(r => r.section === 'Telemetry'),
  };
  for (const [area, checks] of Object.entries(matrix)) {
    const pass = checks.filter(r => r.status === 'PASS').length;
    const total = checks.length;
    const pct = total ? Math.round((pass / total) * 100) : 0;
    const bar = total ? (pct === 100 ? '🟢' : pct >= 70 ? '🟡' : '🔴') : '⚪';
    console.log(`    ${bar} ${area}: ${pass}/${total} (${pct}%)`);
  }
  console.log('');
  return totalFail;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔬 Pilot E2E Validation');
  console.log(`   Server: ${BASE}`);
  console.log(`   Time:   ${new Date().toISOString()}`);

  try {
    await setup();
    await validateFluencyE2E();
    await validateMistakeToMastery();
  } catch (err) {
    console.error('\n💥 Fatal error:', err.message);
    record('FATAL', err.message, false);
  }

  const failures = printReport();
  process.exit(failures > 0 ? 1 : 0);
}

main();
