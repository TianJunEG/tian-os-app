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

// Learning-source registry — every companion app plugs in here by declaring the subjects it
// covers, its same-origin launch path, and whether it's live yet. Any app that emits the shared
// result contract (with a `source` listed here) flows into the unified profile automatically.
// `live:false` renders a "coming soon" slot (dormant module) until the app's folder is dropped in.
export const SOURCES = {
  mathpath: { id: 'mathpath', label: 'MathPath', subjects: ['emath', 'amath'], path: '/mathpath/', live: true },
  spelling: { id: 'spelling', label: 'Spell Master', subjects: ['eng', 'chi'], path: '/spelling/', live: false },
  science: { id: 'science', label: 'Science Lab', subjects: ['chem', 'bio', 'phys'], path: '/science/', live: false },
};
const KNOWN_SOURCES = new Set(Object.keys(SOURCES));
export const sourceForSubject = (subjectId) => Object.values(SOURCES).find((s) => s.subjects.includes(subjectId)) || null;

// Pick the Education OS subject a result belongs to (honours the launch hint, else the source's
// subjects the student is enrolled in).
export function mapSubject(db, rec) {
  const s = db.students.find((x) => x.id === rec.studentId);
  const src = SOURCES[rec.source];
  if (isSubject(rec.subjectHint) && (!s || s.subjects.includes(rec.subjectHint))) return rec.subjectHint;
  if (s && src) { const m = src.subjects.find((sub) => s.subjects.includes(sub)); if (m) return m; }
  if (s) return s.subjects[0];
  return (src && src.subjects[0]) || 'emath';
}

// Map a MathPath skill name to the closest topic of a subject (keyword heuristic).
const KW = [
  // maths
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
  // English / Chinese (spelling app)
  [/grammar|spelling|tense|punctuation/, 'grammar'],
  [/comprehen|理解/, 'comprehen'],
  [/composit|essay|writing|作文/, 'composit'],
  [/oral|口试/, 'oral'],
  [/vocab|word|词汇/, 'vocab'],
  // Science (science app)
  [/atom/, 'atomic'], [/bond/, 'bonding'], [/acid|base|alkali/, 'acid'], [/mole/, 'mole'], [/organic/, 'organic'], [/redox|oxid/, 'redox'],
  [/cell/, 'cell'], [/transport|diffus|osmos/, 'transport'], [/genetic|dna|inherit/, 'genetic'], [/ecolog|environment/, 'ecolog'], [/enzyme/, 'enzyme'],
  [/kinematic|speed|motion/, 'kinematic'], [/force|newton/, 'force'], [/energy|work|power/, 'energy'], [/electric|circuit|current/, 'electric'], [/wave|light|sound/, 'wave'],
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
    if (!KNOWN_SOURCES.has(rec.source) || !rec.studentId) continue;
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
