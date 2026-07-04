import crypto from 'crypto';
import ClassDiagnosticSession from '../../models/ClassDiagnosticSession.js';
import ClassStudent from '../../models/ClassStudent.js';
import Student from '../../models/Student.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import PracticeSession from '../../models/PracticeSession.js';
import PracticeAttempt from '../../models/PracticeAttempt.js';

// Unambiguous alphabet (no 0/O/1/I) — these codes get read off a projector.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours — covers a class period generously

// 8 chars over a 32-symbol alphabet ≈ 40 bits of entropy — makes guessing an
// active code impractical even across distributed IPs within the session window.
export function generateSessionCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

// Snapshot the class's active roster (id + name only) so the unauthenticated
// kiosk never reads class data directly. Restricted to the session's workspace
// as a safety net.
async function snapshotRoster(classId, workspaceId) {
  const links = await ClassStudent.find({ classId, status: 'active' });
  const studentIds = links.map((l) => l.studentId);
  const students = await Student.find({ _id: { $in: studentIds } }).select('_id name workspaceId').lean();
  return students
    .filter((s) => String(s.workspaceId) === String(workspaceId))
    .map((s) => ({ studentId: s._id, name: s.name, taken: false, status: 'not_started' }));
}

// A code that doesn't collide with an existing session (unique index is the real guard).
async function reserveUniqueCode() {
  let code = generateSessionCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const clash = await ClassDiagnosticSession.findOne({ code }).select('_id').lean();
    if (!clash) break;
    code = generateSessionCode();
  }
  return code;
}

// Create one class DIAGNOSTIC session for a class the teacher owns.
export async function createClassDiagnosticSession({
  classId,
  workspaceId,
  teacherUserId,
  subjectId = 'math',
  domainId,
  mode = 'core',
  studentLevel = '',
  ttlMs = DEFAULT_TTL_MS,
}) {
  const roster = await snapshotRoster(classId, workspaceId);
  const code = await reserveUniqueCode();
  return ClassDiagnosticSession.create({
    workspaceId,
    classId,
    teacherUserId: String(teacherUserId),
    code,
    subjectId,
    domainId,
    type: 'diagnostic',
    mode,
    studentLevel,
    status: 'open',
    roster,
    expiresAt: new Date(Date.now() + ttlMs),
  });
}

// Create one class PRACTICE session: a fixed set of questions on a single skill.
// Reuses the same roster snapshot + code + expiry as the diagnostic; domainId is
// still populated (the skill's topic/domain) so the teacher list/UI stays uniform.
export async function createClassPracticeSession({
  classId,
  workspaceId,
  teacherUserId,
  subjectId = 'math',
  domainId,
  skillId,
  skillName = '',
  questionCount = 10,
  studentLevel = '',
  ttlMs = DEFAULT_TTL_MS,
}) {
  const roster = await snapshotRoster(classId, workspaceId);
  const code = await reserveUniqueCode();
  return ClassDiagnosticSession.create({
    workspaceId,
    classId,
    teacherUserId: String(teacherUserId),
    code,
    subjectId,
    domainId,
    type: 'practice',
    practiceConfig: { skillId: String(skillId), skillName, questionCount },
    studentLevel,
    status: 'open',
    roster,
    expiresAt: new Date(Date.now() + ttlMs),
  });
}

// Roll roster statuses into the {notStarted, inProgress, completed} summary.
function rosterSummary(roster = []) {
  let notStarted = 0;
  let inProgress = 0;
  let completed = 0;
  for (const r of roster) {
    const status = r.status || 'not_started';
    if (status === 'completed') completed += 1;
    else if (status === 'in_progress') inProgress += 1;
    else notStarted += 1;
  }
  return { notStarted, inProgress, completed, total: roster.length };
}

// Diagnostic live view: merge the roster snapshot with the linked per-student
// diagnostic sessions (sourceType:'kiosk', sourceId:<id>). Pure read.
async function buildDiagnosticStatus(session) {
  const linked = await MathPathDiagnosticSession
    .find({ sourceType: 'kiosk', sourceId: String(session._id) })
    .select('diagnosticSessionId studentId status adaptiveState result')
    .lean();
  const byStudent = new Map(linked.map((d) => [String(d.studentId), d]));

  const students = (session.roster || []).map((r) => {
    const d = byStudent.get(String(r.studentId));
    const answeredCount = Array.isArray(d?.adaptiveState?.responses) ? d.adaptiveState.responses.length : 0;
    return {
      studentId: String(r.studentId),
      name: r.name,
      attemptStatus: r.status || 'not_started',
      answeredCount,
      readinessScore: d?.result?.readinessScore ?? null,
      weakSkillCount: Array.isArray(d?.result?.weakSkillIds) ? d.result.weakSkillIds.length : null,
    };
  });

  return {
    type: 'diagnostic',
    sessionId: String(session._id),
    code: session.code,
    domainId: session.domainId,
    mode: session.mode,
    status: session.status,
    expiresAt: session.expiresAt,
    students,
    summary: rosterSummary(session.roster || []),
  };
}

// Practice live view: for each roster slot that has begun, read its latest
// PracticeSession + attempt counts. `readinessScore` carries the practice
// scorePct so the teacher panel renders with no UI change. Pure read.
async function buildPracticeStatus(session) {
  const practiceIds = (session.roster || []).map((r) => r.practiceSessionId).filter(Boolean);
  const sessions = practiceIds.length
    ? await PracticeSession.find({ _id: { $in: practiceIds } }).select('_id summary status').lean()
    : [];
  const bySessionId = new Map(sessions.map((s) => [String(s._id), s]));

  // Live answered counts for in-progress sets (before the summary is written).
  const attemptAgg = practiceIds.length
    ? await PracticeAttempt.aggregate([
      { $match: { sessionId: { $in: sessions.map((s) => s._id) } } },
      { $group: { _id: '$sessionId', answered: { $sum: 1 }, correct: { $sum: { $cond: ['$correct', 1, 0] } } } },
    ])
    : [];
  const byAttemptSession = new Map(attemptAgg.map((a) => [String(a._id), a]));

  const students = (session.roster || []).map((r) => {
    const ps = r.practiceSessionId ? bySessionId.get(String(r.practiceSessionId)) : null;
    const agg = r.practiceSessionId ? byAttemptSession.get(String(r.practiceSessionId)) : null;
    // Prefer the live attempt aggregate (accurate mid-set AND after completion,
    // since attempts persist); fall back to the written summary. A default summary
    // reads scorePct:0, so we must NOT let it mask the live score.
    const answeredCount = agg?.answered ?? ps?.summary?.total ?? 0;
    const scorePct = agg && agg.answered
      ? Math.round((agg.correct / agg.answered) * 100)
      : (ps?.summary?.scorePct ?? null);
    return {
      studentId: String(r.studentId),
      name: r.name,
      attemptStatus: r.status || 'not_started',
      answeredCount,
      readinessScore: scorePct, // reuse the column; it's the practice score for this type
      weakSkillCount: null,
    };
  });

  return {
    type: 'practice',
    sessionId: String(session._id),
    code: session.code,
    domainId: session.domainId,
    skillName: session.practiceConfig?.skillName || '',
    questionCount: session.practiceConfig?.questionCount ?? null,
    status: session.status,
    expiresAt: session.expiresAt,
    students,
    summary: rosterSummary(session.roster || []),
  };
}

// Live status for the teacher's polling view — dispatches by session type.
export async function buildKioskStatus(session) {
  if (session.type === 'practice') return buildPracticeStatus(session);
  return buildDiagnosticStatus(session);
}

export default {
  generateSessionCode,
  createClassDiagnosticSession,
  createClassPracticeSession,
  buildKioskStatus,
};
