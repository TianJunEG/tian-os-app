// store.js — single source of truth. Holds the shared DB + the logged-in user, exposes
// role-scoped selectors and the mutations that make actions ripple across dashboards
// (e.g. a parent's tutor request shows up in the admin queue; an admin match assigns a tutor
// that the student and parent immediately see). Persists to localStorage.

import { seed, SUBJECTS, TOPICS, topicsOf, STATUS } from './data.js';

const KEY = 'eduos.v1';
const hasLS = typeof localStorage !== 'undefined';

export const PERSONAS = [
  { id: 'pri', role: 'parent', sub: 'Parent · 2 children', color: '#4f46e5' },
  { id: 'ethan', role: 'student', sub: 'Student · Secondary 3', color: '#7c3aed' },
  { id: 'chua', role: 'tutor', sub: 'Tutor · E-Math & A-Math', color: '#0ea5e9' },
  { id: 'admin', role: 'admin', sub: 'Operations · Tutor Match HQ', color: '#0f766e' },
];

const state = { db: null, user: null };

function load() {
  if (hasLS) {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && raw.db) { state.db = raw.db; state.user = raw.user || null; return; }
    } catch { /* fall through to fresh seed */ }
  }
  state.db = seed();
}
function save() { if (hasLS) localStorage.setItem(KEY, JSON.stringify({ db: state.db, user: state.user })); }
load();

export function resetAll() { state.db = seed(); state.user = null; save(); }
export const db = () => state.db;

// ---- session ----
export function user() {
  if (!state.user) return null;
  return { ...state.user, name: displayName(state.user) };
}
export function login(personaId) {
  const p = PERSONAS.find((x) => x.id === personaId);
  if (p) { state.user = { id: p.id, role: p.role }; save(); }
}
export function logout() { state.user = null; save(); }
function displayName(u) {
  if (u.role === 'admin') return 'Operations';
  return (record(u.role, u.id) || {}).name || u.id;
}
function record(role, id) {
  const d = state.db;
  if (role === 'parent') return d.parents.find((x) => x.id === id);
  if (role === 'student') return d.students.find((x) => x.id === id);
  if (role === 'tutor') return d.tutors.find((x) => x.id === id);
  return null;
}
// notification mailbox key per session
export const mailbox = (u = state.user) => (u ? (u.role === 'admin' ? 'admin' : u.id) : null);

// ---- permissions (illustrative; the UI is also role-scoped) ----
const CAN = {
  parent: ['view:children', 'request:tutor', 'pay:invoice', 'view:reports'],
  student: ['view:self', 'do:worksheet', 'mark:revised', 'view:lessons'],
  tutor: ['view:students', 'log:lesson', 'add:report', 'confirm:lesson'],
  admin: ['view:all', 'assign:tutor', 'override:match', 'manage:ops'],
};
export const can = (action) => !!state.user && (CAN[state.user.role] || []).includes(action);

// ---- selectors ----
export const parent = (id) => state.db.parents.find((p) => p.id === id);
export const student = (id) => state.db.students.find((s) => s.id === id);
export const tutor = (id) => state.db.tutors.find((t) => t.id === id);
export const subject = (id) => SUBJECTS.find((s) => s.id === id);
export const childrenOf = (parentId) => state.db.students.filter((s) => s.parentId === parentId);
export const studentsOfTutor = (tutorId) => state.db.students.filter((s) => Object.values(s.tutors || {}).includes(tutorId));
export const progressFor = (studentId, topicId) => state.db.progress[`${studentId}:${topicId}`] || { status: 'not-started', accuracy: 0 };

export function subjectMastery(studentId, subjectId) {
  const ts = topicsOf(subjectId);
  const counts = { 'not-started': 0, learning: 0, 'needs-revision': 0, mastered: 0 };
  let started = 0, accSum = 0, accN = 0;
  for (const t of ts) {
    const p = progressFor(studentId, t.id);
    counts[p.status]++;
    if (p.status !== 'not-started') { started++; accSum += p.accuracy; accN++; }
  }
  const pct = Math.round((counts.mastered / ts.length) * 100);
  return { pct, counts, total: ts.length, started, avgAccuracy: accN ? Math.round(accSum / accN) : 0 };
}
export function overallMastery(studentId) {
  const s = student(studentId);
  if (!s) return 0;
  const ms = s.subjects.map((sub) => subjectMastery(studentId, sub).pct);
  return ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : 0;
}
export const lessonsFor = (studentId) => state.db.lessons.filter((l) => l.studentId === studentId);
export const lessonsByTutor = (tutorId) => state.db.lessons.filter((l) => l.tutorId === tutorId);
export const worksheetsFor = (studentId) => state.db.worksheets.filter((w) => w.studentId === studentId);
export const reportsFor = (studentId) => state.db.reports.filter((r) => r.studentId === studentId);
export const reportsByTutor = (tutorId) => state.db.reports.filter((r) => r.tutorId === tutorId);
export const invoicesFor = (parentId) => state.db.invoices.filter((i) => i.parentId === parentId);
export const revisionFor = (studentId) => state.db.revision[studentId] || [0, 0, 0, 0, 0, 0, 0];
export const notificationsFor = (key) => state.db.notifications.filter((n) => n.for === key);
export const hasTutor = (s, subjectId) => !!(s.tutors && s.tutors[subjectId]);
export const anyTutor = (s) => Object.keys(s.tutors || {}).length > 0;

// ---- mutations (ripple across roles) ----
let seq = 1000;
const uid = (p) => `${p}${++seq}`;

export function notify(forKey, { type = 'info', icon = 'bell', text }) {
  state.db.notifications.unshift({ id: uid('n'), for: forKey, type, icon, text, time: 'just now' });
}

export function requestTutor(studentId, subjectId) {
  const s = student(studentId);
  state.db.matchQueue.unshift({
    id: uid('mq'), studentName: s.name, level: s.level, subjectId, urgency: 'normal', status: 'open',
    studentId, parentId: s.parentId,
    candidates: state.db.tutors.filter((t) => t.subjects.includes(subjectId)).slice(0, 3).map((t) => ({ tutorId: t.id, score: 70 + Math.round(Math.random() * 25) })).sort((a, b) => b.score - a.score),
  });
  notify('admin', { type: 'info', icon: 'inbox', text: `${s.name} (${parent(s.parentId).name}) requested a ${subject(subjectId).name} tutor` });
  notify(s.parentId, { type: 'info', icon: 'check', text: `Tutor request sent for ${s.name} — ${subject(subjectId).name}. We'll match within 48h.` });
  save();
}

export function assignTutor(studentId, subjectId, tutorId, queueId) {
  const s = student(studentId); const t = tutor(tutorId);
  s.tutors = { ...s.tutors, [subjectId]: tutorId };
  if (!t.studentIds.includes(studentId)) t.studentIds.push(studentId);
  if (queueId) { const q = state.db.matchQueue.find((m) => m.id === queueId); if (q) q.status = 'matched'; }
  notify(s.parentId, { type: 'info', icon: 'users', text: `${t.name} assigned to ${s.name} for ${subject(subjectId).name}. Trial lesson available.` });
  notify(studentId, { type: 'info', icon: 'users', text: `${t.name} is now your ${subject(subjectId).name} tutor 🎉` });
  notify(tutorId, { type: 'info', icon: 'user', text: `New student assigned: ${s.name} (${subject(subjectId).name})` });
  save();
}

export function addReport(tutorId, studentId, text, focusTopicId) {
  const t = tutor(tutorId); const s = student(studentId);
  state.db.reports.unshift({ id: uid('r'), tutorId, studentId, date: today(), text, focus: focusTopicId ? [focusTopicId] : [] });
  notify(s.parentId, { type: 'info', icon: 'clipboard', text: `${t.name} uploaded a lesson summary for ${s.name}` });
  save();
}

export function confirmLesson(lessonId) {
  const l = state.db.lessons.find((x) => x.id === lessonId);
  if (l) { l.status = 'scheduled'; notify(student(l.studentId).parentId, { type: 'info', icon: 'calendar', text: `Lesson confirmed for ${student(l.studentId).name} on ${fmtDate(l.date)}` }); }
  save();
}

export function completeWorksheet(worksheetId, score) {
  const w = state.db.worksheets.find((x) => x.id === worksheetId);
  if (!w) return;
  w.status = 'done'; w.score = score; w.date = today();
  const p = state.db.progress[`${w.studentId}:${w.topicId}`];
  if (p) {
    p.accuracy = Math.round((p.accuracy + score) / (p.accuracy ? 2 : 1)) || score;
    if (score >= 85) p.status = 'mastered';
    else if (score >= 65) p.status = (p.status === 'mastered' ? 'mastered' : 'learning');
    else p.status = 'needs-revision';
  }
  bumpRevisionToday(w.studentId, 15);
  save();
}

export function markRevised(studentId, topicId) {
  const p = state.db.progress[`${studentId}:${topicId}`];
  if (p && p.status === 'not-started') { p.status = 'learning'; p.accuracy = 60; }
  bumpRevisionToday(studentId, 20);
  const s = student(studentId);
  if (s && s.weeklyDone < s.weeklyGoal) s.weeklyDone++;
  save();
}
function bumpRevisionToday(studentId, mins) {
  const arr = state.db.revision[studentId] || (state.db.revision[studentId] = [0, 0, 0, 0, 0, 0, 0]);
  arr[arr.length - 1] += mins;
}

export function payInvoice(invoiceId) {
  const i = state.db.invoices.find((x) => x.id === invoiceId);
  if (i) i.status = 'paid';
  save();
}

export function approveMatch(queueId, tutorId) {
  const q = state.db.matchQueue.find((m) => m.id === queueId);
  if (!q) return;
  if (q.studentId) { assignTutor(q.studentId, q.subjectId, tutorId, queueId); return; }
  q.status = 'matched'; q.matchedTutor = tutorId;
  notify('admin', { type: 'info', icon: 'check', text: `${tutor(tutorId).name} matched to ${q.studentName} (${subject(q.subjectId).name})` });
  save();
}

export function advanceLead(leadId) {
  const l = state.db.leads.find((x) => x.id === leadId);
  const flow = { new: 'contacted', contacted: 'trial booked', 'trial booked': 'converted' };
  if (l && flow[l.status]) l.status = flow[l.status];
  save();
}
export function resolveTicket(ticketId) {
  const t = state.db.tickets.find((x) => x.id === ticketId);
  if (t) t.status = 'resolved';
  save();
}

// ---- small date helpers ----
export function today() { return new Date().toISOString().slice(0, 10); }
export function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
