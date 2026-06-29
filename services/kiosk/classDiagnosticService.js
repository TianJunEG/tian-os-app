import crypto from 'crypto';
import ClassDiagnosticSession from '../../models/ClassDiagnosticSession.js';
import ClassStudent from '../../models/ClassStudent.js';
import Student from '../../models/Student.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';

// Unambiguous alphabet (no 0/O/1/I) — these codes get read off a projector.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours — covers a class period generously

export function generateSessionCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

// Create one class diagnostic session for a class the teacher owns. Snapshots the
// active roster (id + name only) so the unauthenticated kiosk never reads class
// data directly. Roster is restricted to the session's workspace as a safety net.
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
  const links = await ClassStudent.find({ classId, status: 'active' });
  const studentIds = links.map((l) => l.studentId);
  const students = await Student.find({ _id: { $in: studentIds } }).select('_id name workspaceId').lean();
  const roster = students
    .filter((s) => String(s.workspaceId) === String(workspaceId))
    .map((s) => ({ studentId: s._id, name: s.name, taken: false, status: 'not_started' }));

  // Unique code with a few retries on collision (unique index is the real guard).
  let code = generateSessionCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const clash = await ClassDiagnosticSession.findOne({ code }).select('_id').lean();
    if (!clash) break;
    code = generateSessionCode();
  }

  return ClassDiagnosticSession.create({
    workspaceId,
    classId,
    teacherUserId: String(teacherUserId),
    code,
    subjectId,
    domainId,
    mode,
    studentLevel,
    status: 'open',
    roster,
    expiresAt: new Date(Date.now() + ttlMs),
  });
}

// Live status for the teacher's polling view: merge the roster snapshot with the
// linked per-student diagnostic sessions (sourceType:'kiosk', sourceId:<id>).
// Pure read — no engine recompute.
export async function buildKioskStatus(session) {
  const linked = await MathPathDiagnosticSession
    .find({ sourceType: 'kiosk', sourceId: String(session._id) })
    .select('diagnosticSessionId studentId status adaptiveState result')
    .lean();
  const byStudent = new Map(linked.map((d) => [String(d.studentId), d]));

  let notStarted = 0;
  let inProgress = 0;
  let completed = 0;
  const students = (session.roster || []).map((r) => {
    const d = byStudent.get(String(r.studentId));
    const answeredCount = Array.isArray(d?.adaptiveState?.responses) ? d.adaptiveState.responses.length : 0;
    const status = r.status || 'not_started';
    if (status === 'completed') completed += 1;
    else if (status === 'in_progress') inProgress += 1;
    else notStarted += 1;
    return {
      studentId: String(r.studentId),
      name: r.name,
      attemptStatus: status,
      answeredCount,
      readinessScore: d?.result?.readinessScore ?? null,
      weakSkillCount: Array.isArray(d?.result?.weakSkillIds) ? d.result.weakSkillIds.length : null,
    };
  });

  return {
    sessionId: String(session._id),
    code: session.code,
    domainId: session.domainId,
    mode: session.mode,
    status: session.status,
    expiresAt: session.expiresAt,
    students,
    summary: { notStarted, inProgress, completed, total: (session.roster || []).length },
  };
}

export default { generateSessionCode, createClassDiagnosticSession, buildKioskStatus };
