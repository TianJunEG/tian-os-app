// ai.js — the platform's "educational intelligence". Pure functions derived from the shared
// data (no external calls): weak-topic detection, exam readiness, revision consistency, tutor
// suitability, and role-specific recommendations. AI assists the humans — it never blocks them.

import * as S from './store.js';
import { SUBJECTS, TOPICS, topicsOf } from './data.js';

const subjName = (id) => (SUBJECTS.find((s) => s.id === id) || {}).name || id;
const topic = (id) => TOPICS.find((t) => t.id === id);

// Topics a student is struggling with: needs-revision, or low accuracy while learning.
export function weakTopics(studentId, limit = 99) {
  const s = S.student(studentId);
  if (!s) return [];
  const out = [];
  for (const subId of s.subjects) {
    for (const t of topicsOf(subId)) {
      const p = S.progressFor(studentId, t.id);
      const weak = p.status === 'needs-revision' || (p.status === 'learning' && p.accuracy < 60);
      if (weak) out.push({ topicId: t.id, name: t.name, subjectId: subId, subject: subjName(subId), status: p.status, accuracy: p.accuracy });
    }
  }
  return out.sort((a, b) => a.accuracy - b.accuracy).slice(0, limit);
}

// Revision consistency over the last 7 days.
export function revisionConsistency(studentId) {
  const arr = S.revisionFor(studentId);
  const activeDays = arr.filter((m) => m > 0).length;
  const pct = Math.round((activeDays / 7) * 100);
  const trendNum = (arr[4] + arr[5] + arr[6]) - (arr[1] + arr[2] + arr[3]);
  const trend = trendNum > 8 ? 'up' : trendNum < -8 ? 'down' : 'flat';
  return { activeDays, pct, minutesWeek: arr.reduce((a, b) => a + b, 0), trend, series: arr };
}

// Exam readiness for a subject: blends mastery, accuracy and revision consistency.
export function examReadiness(studentId, subjectId) {
  const m = S.subjectMastery(studentId, subjectId);
  const rc = revisionConsistency(studentId);
  const score = Math.round(0.45 * m.pct + 0.35 * m.avgAccuracy + 0.2 * rc.pct);
  const band = score >= 75 ? 'on track' : score >= 50 ? 'building' : 'at risk';
  return { score, band, trend: rc.trend, mastery: m.pct, accuracy: m.avgAccuracy };
}
export function overallReadiness(studentId) {
  const s = S.student(studentId); if (!s) return { score: 0, band: 'at risk' };
  const scores = s.subjects.map((sub) => examReadiness(studentId, sub).score);
  const score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  return { score, band: score >= 75 ? 'on track' : score >= 50 ? 'building' : 'at risk' };
}

// Mock exam countdown — always a sensible future date.
export function examInfo() {
  const d = new Date(); d.setDate(d.getDate() + 52);
  return { name: 'Mid-Year Exams', date: d, daysLeft: 52 };
}

// Tutor suitability for a student+subject (the "suitability score" parents see).
export function suitability(tutorId, studentId, subjectId) {
  const t = S.tutor(tutorId); if (!t || !t.subjects.includes(subjectId)) return 0;
  const rating = (t.rating / 5) * 100;
  const exp = Math.min(100, 55 + t.yearsExp * 5);
  let h = 0; for (const ch of (tutorId + studentId + subjectId)) h = (h * 31 + ch.charCodeAt(0)) % 1000; // deterministic "fit"
  const fit = 70 + (h % 28);
  return Math.round(0.45 * rating + 0.25 * exp + 0.30 * fit);
}

// ---- recommendations ----
const reco = (icon, tone, title, desc, action) => ({ icon, tone, title, desc, action });

export function recommendationsForStudent(studentId) {
  const out = [];
  const weak = weakTopics(studentId, 2);
  const rc = revisionConsistency(studentId);
  const ex = examInfo();
  weak.forEach((w) => out.push(reco('target', 'warn', `Revise ${w.name}`, `${w.subject} · ${w.accuracy}% accuracy — your weakest topic. 15-min focused set ready.`, { act: 'open-worksheet', subjectId: w.subjectId })));
  if (rc.activeDays < 4) out.push(reco('flame', 'info', 'Keep your streak alive', `You revised ${rc.activeDays} of the last 7 days. A short session today keeps momentum.`, { act: 'nav', go: '#/student/planner' }));
  out.push(reco('sparkles', 'brand', `${ex.daysLeft} days to ${ex.name}`, 'Your adaptive plan front-loads weak topics. Follow today’s 3 tasks.', { act: 'nav', go: '#/student/planner' }));
  return out.slice(0, 3);
}

export function recommendationsForParent(parentId) {
  const out = [];
  for (const c of S.childrenOf(parentId)) {
    const weak = weakTopics(c.id, 1)[0];
    if (weak) {
      if (!S.hasTutor(c, weak.subjectId)) {
        out.push(reco('users', 'warn', `Recommended intervention for ${c.name}`, `Persistent weakness in ${weak.subject} (${weak.name}). A targeted tutor could lift this fast.`, { act: 'request-tutor', studentId: c.id, subjectId: weak.subjectId }));
      } else {
        out.push(reco('target', 'info', `${c.name}: focus on ${weak.name}`, `${weak.subject} accuracy is ${weak.accuracy}%. Tutor has been notified; revision worksheet assigned.`, { act: 'open-child', studentId: c.id }));
      }
    }
    const rc = revisionConsistency(c.id);
    if (rc.activeDays < 3) out.push(reco('clock', 'warn', `${c.name}'s revision is slipping`, `Only ${rc.activeDays} active day(s) this week. A gentle nudge helps consistency.`, { act: 'open-child', studentId: c.id }));
  }
  return out.slice(0, 3);
}

// Cross-roster teaching intelligence for a tutor.
export function tutorInsights(tutorId) {
  const students = S.studentsOfTutor(tutorId);
  const concept = {}; const risks = []; const suggested = [];
  for (const s of students) {
    const weak = weakTopics(s.id, 99);
    weak.forEach((w) => { concept[w.name] = concept[w.name] || { name: w.name, subject: w.subject, count: 0 }; concept[w.name].count++; });
    const r = S.revisionFor(s.id).filter((m) => m > 0).length;
    const read = overallReadiness(s.id);
    if (read.score < 60 || r < 3) risks.push({ studentId: s.id, name: s.name, reason: read.score < 60 ? `Readiness ${read.score}% — below target` : `Low revision (${r}/7 days)` });
    const top = weak[0];
    if (top) suggested.push({ studentId: s.id, name: s.name, topic: top.name, subject: top.subject });
  }
  const recurring = Object.values(concept).sort((a, b) => b.count - a.count);
  return { recurring, risks, suggested, count: students.length };
}
