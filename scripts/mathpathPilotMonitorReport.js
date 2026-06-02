import dotenv from 'dotenv';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import path from 'path';
import User from '../models/User.js';
import MathPathAttempt from '../models/mathpath/MathPathAttempt.js';
import MathPathDiagnosticSession from '../models/mathpath/MathPathDiagnosticSession.js';
import MathPathMistakeRecord from '../models/mathpath/MathPathMistakeRecord.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathWorkingSession from '../models/mathpath/MathPathWorkingSession.js';

dotenv.config();

const ROOT = process.cwd();
const URI = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match';
const OUT_DIR = path.join(ROOT, 'docs/mathpath/pilot/logs');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = path.join(OUT_DIR, `mathpath-pilot-monitor-${stamp}.md`);

function toDateValue(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

function latestDate(...values) {
  const dates = values.map(toDateValue).filter(Boolean);
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function formatDate(value) {
  const date = toDateValue(value);
  return date ? date.toISOString().slice(0, 19).replace('T', ' ') : '-';
}

function riskForStudent({ diagnosticStatus, practiceCompleted, mistakes, workingPending, helpRequests, lastActivityAt }) {
  if (!lastActivityAt) return 'Needs follow-up';
  if (helpRequests >= 3 || workingPending >= 2 || mistakes >= 5) return 'Needs follow-up';
  if (diagnosticStatus !== 'completed' || practiceCompleted === 0 || mistakes >= 2 || helpRequests > 0 || workingPending > 0) return 'Watch';
  return 'OK';
}

function byStudent(items) {
  return items.reduce((acc, item) => {
    const id = String(item.studentId || '');
    if (!acc.has(id)) acc.set(id, []);
    acc.get(id).push(item);
    return acc;
  }, new Map());
}

async function buildPilotSnapshot(limit = 50) {
  const students = await User.find({
    $and: [
      { $or: [{ role: 'student' }, { roles: 'student' }] },
      {
        $or: [
          { is_test_account: true },
          { email: /@tianos\.test$/i },
        ],
      },
    ],
  })
    .select('name email is_test_account lastLogin createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const studentIds = students.map((student) => String(student._id));
  const [
    diagnostics,
    practiceSessions,
    attempts,
    mistakes,
    workings,
    helpRequests,
  ] = await Promise.all([
    MathPathDiagnosticSession.find({ studentId: { $in: studentIds }, domainId: 'fractions' }).sort({ updatedAt: -1 }).lean(),
    MathPathPracticeSession.find({ studentId: { $in: studentIds }, domainId: 'fractions' }).sort({ updatedAt: -1 }).lean(),
    MathPathAttempt.find({ studentId: { $in: studentIds }, domainId: 'fractions' }).sort({ createdAt: -1 }).lean(),
    MathPathMistakeRecord.find({ studentId: { $in: studentIds }, domainId: 'fractions' }).sort({ lastSeenAt: -1 }).lean(),
    MathPathWorkingSession.find({ studentId: { $in: studentIds }, domainId: 'fractions' }).sort({ updatedAt: -1 }).lean(),
    MathPathAttempt.find({ studentId: { $in: studentIds }, domainId: 'fractions', helpRequested: true }).sort({ createdAt: -1 }).lean(),
  ]);

  const diagnosticsByStudent = byStudent(diagnostics);
  const practiceByStudent = byStudent(practiceSessions);
  const attemptsByStudent = byStudent(attempts);
  const mistakesByStudent = byStudent(mistakes);
  const workingsByStudent = byStudent(workings);
  const helpByStudent = byStudent(helpRequests);

  const rows = students.map((student) => {
    const id = String(student._id);
    const ds = diagnosticsByStudent.get(id) || [];
    const ps = practiceByStudent.get(id) || [];
    const as = attemptsByStudent.get(id) || [];
    const ms = mistakesByStudent.get(id) || [];
    const ws = workingsByStudent.get(id) || [];
    const hs = helpByStudent.get(id) || [];
    const latestDiagnostic = ds[0] || null;
    const latestPractice = ps[0] || null;
    const latestAttempt = as[0] || null;
    const latestWorking = ws[0] || null;
    const workingSubmitted = ws.filter((working) => ['submitted', 'mapped', 'analysisReady'].includes(working.status)).length;
    const workingPending = ws.filter((working) => working.status === 'pending' || working.analysisStatus === 'pending_analysis').length;
    const practiceCompleted = ps.filter((session) => session.status === 'completed').length;
    const diagnosticStatus = latestDiagnostic?.status || 'notStarted';
    const currentSkillId = latestPractice?.targetSkillId || latestAttempt?.skillId || latestDiagnostic?.targetSkillIds?.[0] || '';
    const lastActivityAt = latestDate(
      student.lastLogin,
      latestDiagnostic?.updatedAt,
      latestDiagnostic?.completedAt,
      latestPractice?.updatedAt,
      latestPractice?.completedAt,
      latestAttempt?.createdAt,
      latestWorking?.updatedAt,
      latestWorking?.submittedAt
    );
    const correctAttempts = as.filter((attempt) => attempt.correct).length;
    const accuracy = as.length ? Math.round((correctAttempts / as.length) * 100) : null;
    const risk = riskForStudent({
      diagnosticStatus,
      practiceCompleted,
      mistakes: ms.length,
      workingPending,
      helpRequests: hs.length,
      lastActivityAt,
    });

    return {
      name: student.name || '-',
      email: student.email || '-',
      lastActivityAt,
      diagnosticStatus,
      practiceCompleted,
      practiceSessions: ps.length,
      attempts: as.length,
      accuracy,
      currentSkillId,
      mistakesCaptured: ms.length,
      workingSubmitted,
      workingPending,
      helpRequests: hs.length,
      risk,
    };
  });

  const summary = {
    totalStudents: rows.length,
    diagnosticsCompleted: rows.filter((row) => row.diagnosticStatus === 'completed').length,
    practiceCompleted: rows.reduce((sum, row) => sum + row.practiceCompleted, 0),
    attempts: rows.reduce((sum, row) => sum + row.attempts, 0),
    mistakesCaptured: rows.reduce((sum, row) => sum + row.mistakesCaptured, 0),
    workingSubmitted: rows.reduce((sum, row) => sum + row.workingSubmitted, 0),
    helpRequests: rows.reduce((sum, row) => sum + row.helpRequests, 0),
    riskCounts: rows.reduce((acc, row) => {
      acc[row.risk] = (acc[row.risk] || 0) + 1;
      return acc;
    }, {}),
  };

  return { generatedAt: new Date(), summary, rows };
}

function renderMarkdown(snapshot) {
  const { generatedAt, summary, rows } = snapshot;
  const riskCounts = summary.riskCounts || {};
  const lines = [
    '# MathPath Fractions Pilot Monitor',
    '',
    `Generated at: ${generatedAt.toISOString()}`,
    '',
    '## Summary',
    '',
    `- Pilot/test students: ${summary.totalStudents}`,
    `- Diagnostics completed: ${summary.diagnosticsCompleted}`,
    `- Completed practice sessions: ${summary.practiceCompleted}`,
    `- Attempts captured: ${summary.attempts}`,
    `- Mistakes captured: ${summary.mistakesCaptured}`,
    `- Workings submitted: ${summary.workingSubmitted}`,
    `- Help requests: ${summary.helpRequests}`,
    `- Risk: ${riskCounts.OK || 0} OK / ${riskCounts.Watch || 0} Watch / ${riskCounts['Needs follow-up'] || 0} Needs follow-up`,
    '',
    '## Student Snapshot',
    '',
    '| Student | Last Activity | Diagnostic | Practice | Current Skill | Accuracy | Mistakes | Workings | Help | Risk |',
    '|---|---|---|---:|---|---:|---:|---|---:|---|',
    ...rows.map((row) => [
      `${row.name}<br>${row.email}`,
      formatDate(row.lastActivityAt),
      row.diagnosticStatus,
      `${row.practiceCompleted}/${row.practiceSessions}`,
      row.currentSkillId || '-',
      row.accuracy === null ? '-' : `${row.accuracy}%`,
      row.mistakesCaptured,
      `${row.workingSubmitted} submitted / ${row.workingPending} pending`,
      row.helpRequests,
      row.risk,
    ].join(' | ')).map((row) => `| ${row} |`),
    '',
    '## Follow-Up Rules',
    '',
    '- Needs follow-up: no activity, 3+ help requests, 2+ pending workings, or 5+ captured mistakes.',
    '- Watch: diagnostic incomplete, no completed practice, 2+ mistakes, any help request, or any pending working.',
    '- OK: active, diagnostic complete, practice captured, and no immediate support signal.',
  ];
  return lines.join('\n');
}

async function main() {
  await mongoose.connect(URI);
  const snapshot = await buildPilotSnapshot(Number(process.env.PILOT_MONITOR_LIMIT || 50));
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(outPath, renderMarkdown(snapshot), 'utf8');
  console.log(JSON.stringify({
    outPath,
    summary: snapshot.summary,
  }, null, 2));
}

main()
  .catch((err) => {
    console.error('mathpathPilotMonitorReport failed:', err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
