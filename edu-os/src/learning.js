// learning.js — the MathPath ↔ Education OS bridge (ingest side).
// MathPath writes practice results to a shared event log (localStorage key, the same shape a
// real backend would store). Here we map each result onto the unified student profile so the
// Progress/Revision engines — and therefore every dashboard — reflect actual practice.
//
// Event contract (one record per finished MathPath session):
//   { source:'mathpath', studentId, subjectHint, curriculumId, skillId, skillName,
//     accuracy:0-100, mastered:bool, minutes:int, ts:epochMs }

import { SUBJECTS, topicsOf } from './data.js';

export const SHARED_KEY = 'tutormatch.learning';
const hasLS = typeof localStorage !== 'undefined';
const isSubject = (id) => SUBJECTS.some((s) => s.id === id);

// Pick the Education OS subject a MathPath result belongs to.
export function mapSubject(db, rec) {
  const s = db.students.find((x) => x.id === rec.studentId);
  const hint = isSubject(rec.subjectHint) ? rec.subjectHint : null;
  if (hint && (!s || s.subjects.includes(hint))) return hint;
  if (s) { if (s.subjects.includes('emath')) return 'emath'; if (s.subjects.includes('amath')) return 'amath'; return s.subjects[0]; }
  return 'emath';
}

// Map a MathPath skill name to the closest topic of a subject (keyword heuristic).
const KW = [
  [/fraction|ratio|mixed|equival/, 'fraction'],
  [/percent/, 'percent'],
  [/geometr|area|perimeter|angle|shape|volume|circle|triangle|solid/, 'geometr'],
  [/trig/, 'trig'],
  [/statistic|graph|average|data|chart|mean/, 'statist'],
  [/quadratic/, 'quadratic'],
  [/polynomial|expand|factoris|factoriz/, 'polynomial'],
  [/indices|surd|power/, 'indices'],
  [/different|calculus/, 'different'],
  [/integrat/, 'integrat'],
];
export function mapTopic(subjectId, skillName = '') {
  const ts = topicsOf(subjectId);
  if (!ts.length) return null;
  const n = skillName.toLowerCase();
  for (const [re, key] of KW) {
    if (re.test(n)) { const hit = ts.find((t) => t.name.toLowerCase().includes(key)); if (hit) return hit.id; }
  }
  // default: the subject's foundational topic (usually Algebra / first topic)
  return (ts.find((t) => /algebra/i.test(t.name)) || ts[0]).id;
}

export const REMEDIATION_AT = 65; // below this, MathPath mistakes spawn a remediation worksheet
const today = () => new Date().toISOString().slice(0, 10);
let _rid = 0;
const wsId = () => `wsai-${Date.now().toString(36)}-${_rid++}`;

// Prefer the exact topic the dashboard launched (rec.topicId); else infer from the skill name.
export function resolveTopic(subjectId, rec) {
  if (rec.topicId && topicsOf(subjectId).some((t) => t.id === rec.topicId)) return rec.topicId;
  return mapTopic(subjectId, rec.skillName);
}

// Apply a batch of result records to the shared profile. Returns the number applied.
// Mistake-based remediation: a weak result auto-assigns a targeted worksheet; a strong result
// on a topic with an open worksheet marks that worksheet done. (The AI Worksheet System loop.)
export function applyRecords(db, records) {
  let applied = 0;
  for (const rec of records) {
    if (rec.source !== 'mathpath' || !rec.studentId) continue;
    const subjectId = mapSubject(db, rec);
    const topicId = resolveTopic(subjectId, rec);
    if (!topicId) continue;
    const key = `${rec.studentId}:${topicId}`;
    const prev = db.progress[key] || { status: 'not-started', accuracy: 0 };
    const acc = prev.accuracy ? Math.round((prev.accuracy + rec.accuracy) / 2) : rec.accuracy;
    db.progress[key] = { accuracy: acc, status: rec.mastered || acc >= 85 ? 'mastered' : acc >= REMEDIATION_AT ? 'learning' : 'needs-revision' };

    const arr = db.revision[rec.studentId] || (db.revision[rec.studentId] = [0, 0, 0, 0, 0, 0, 0]);
    arr[arr.length - 1] += rec.minutes || 0;

    const open = db.worksheets.find((w) => w.studentId === rec.studentId && w.topicId === topicId && w.status === 'assigned');
    if (rec.accuracy >= REMEDIATION_AT) {
      if (open) { open.status = 'done'; open.score = rec.accuracy; open.date = today(); } // remediation cleared
    } else if (!open) {
      db.worksheets.push({ id: wsId(), studentId: rec.studentId, topicId, status: 'assigned', type: 'Remediation', source: 'mathpath-mistakes', reason: `${rec.accuracy}% in MathPath — targeted practice generated`, date: null, score: null });
    }
    applied++;
  }
  return applied;
}

export function readLog() {
  if (!hasLS) return [];
  try { return JSON.parse(localStorage.getItem(SHARED_KEY)) || []; } catch { return []; }
}

// Ingest any new MathPath results into db (idempotent via a stored cursor). Caller persists db.
export function ingest(db) {
  const log = readLog();
  const cursor = db._learnCursor || 0;
  const fresh = log.filter((r) => (r.ts || 0) > cursor);
  if (!fresh.length) return 0;
  const n = applyRecords(db, fresh);
  db._learnCursor = Math.max(cursor, ...log.map((r) => r.ts || 0));
  return n;
}
