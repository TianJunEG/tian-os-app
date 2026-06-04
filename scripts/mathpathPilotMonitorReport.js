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

function dayKey(value) {
  const date = toDateValue(value);
  return date ? date.toISOString().slice(0, 10) : '';
}

function normalizeConfidence(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (['high', 'i know this', 'know', 'confident'].includes(raw)) return 'high';
  if (['low', "i don't know", 'dont know', 'not confident'].includes(raw)) return 'low';
  if (['medium', "i'm not sure", 'im not sure', 'not sure', 'unsure'].includes(raw)) return 'medium';
  return raw || 'unknown';
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

async function buildPilotSnapshot(limit = 5) {
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
    const activeDays = new Set([
      ...ps.map((session) => dayKey(session.startedAt || session.createdAt || session.updatedAt)),
      ...as.map((attempt) => dayKey(attempt.timestamp || attempt.createdAt)),
      ...ws.map((working) => dayKey(working.submittedAt || working.updatedAt || working.createdAt)),
    ].filter(Boolean)).size;
    const confidenceCounts = as.reduce((acc, attempt) => {
      const confidence = normalizeConfidence(attempt.confidence || attempt.confidenceLevel || attempt.reflection);
      acc[confidence] = (acc[confidence] || 0) + 1;
      return acc;
    }, {});
    const highConfidenceWrong = as.filter((attempt) => (
      !attempt.correct
      && normalizeConfidence(attempt.confidence || attempt.confidenceLevel || attempt.reflection) === 'high'
    )).length;
    const attemptsWithWorking = as.filter((attempt) => (
      attempt.workingSubmitted
      || attempt.workingUploaded
      || attempt.fullscreenWorkingSubmitted
      || (Array.isArray(attempt.workingStrokes) && attempt.workingStrokes.length > 0)
      || (Array.isArray(attempt.fullscreenWorkingStrokes) && attempt.fullscreenWorkingStrokes.length > 0)
      || Boolean(attempt.workingImage || attempt.fullscreenWorkingImage)
    )).length;
    const workingUsageRate = as.length ? Math.round((attemptsWithWorking / as.length) * 100) : null;
    const completionRate = ps.length ? Math.round((practiceCompleted / ps.length) * 100) : null;
    const sessionsPerDay = activeDays ? Number((ps.length / activeDays).toFixed(2)) : 0;
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
      sessionsPerDay,
      completionRate,
      attempts: as.length,
      accuracy,
      currentSkillId,
      mistakesCaptured: ms.length,
      workingSubmitted,
      workingPending,
      workingUsageRate,
      helpRequests: hs.length,
      confidenceCounts,
      highConfidenceWrong,
      risk,
    };
  });

  const totalPracticeSessions = rows.reduce((sum, row) => sum + row.practiceSessions, 0);
  const totalCompletedPractice = rows.reduce((sum, row) => sum + row.practiceCompleted, 0);
  const totalAttempts = rows.reduce((sum, row) => sum + row.attempts, 0);
  const totalWorkingAttempts = rows.reduce((sum, row) => (
    sum + Math.round((row.attempts * (row.workingUsageRate || 0)) / 100)
  ), 0);
  const confidenceTotals = rows.reduce((acc, row) => {
    Object.entries(row.confidenceCounts || {}).forEach(([key, count]) => {
      acc[key] = (acc[key] || 0) + count;
    });
    return acc;
  }, {});

  const summary = {
    totalStudents: rows.length,
    diagnosticsCompleted: rows.filter((row) => row.diagnosticStatus === 'completed').length,
    practiceCompleted: totalCompletedPractice,
    practiceSessions: totalPracticeSessions,
    completionRate: totalPracticeSessions ? Math.round((totalCompletedPractice / totalPracticeSessions) * 100) : null,
    sessionsPerStudentPerDay: rows.length
      ? Number((rows.reduce((sum, row) => sum + row.sessionsPerDay, 0) / rows.length).toFixed(2))
      : 0,
    attempts: totalAttempts,
    mistakesCaptured: rows.reduce((sum, row) => sum + row.mistakesCaptured, 0),
    workingSubmitted: rows.reduce((sum, row) => sum + row.workingSubmitted, 0),
    workingUsageRate: totalAttempts ? Math.round((totalWorkingAttempts / totalAttempts) * 100) : null,
    helpRequests: rows.reduce((sum, row) => sum + row.helpRequests, 0),
    confidenceTotals,
    highConfidenceWrong: rows.reduce((sum, row) => sum + row.highConfidenceWrong, 0),
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
    `- Completed practice sessions: ${summary.practiceCompleted}/${summary.practiceSessions}`,
    `- Completion rate: ${summary.completionRate === null ? '-' : `${summary.completionRate}%`}`,
    `- Sessions/student/day: ${summary.sessionsPerStudentPerDay}`,
    `- Attempts captured: ${summary.attempts}`,
    `- Mistakes captured: ${summary.mistakesCaptured}`,
    `- Workings submitted: ${summary.workingSubmitted}`,
    `- Working usage rate: ${summary.workingUsageRate === null ? '-' : `${summary.workingUsageRate}%`}`,
    `- Help requests: ${summary.helpRequests}`,
    `- Confidence pattern: ${summary.confidenceTotals.high || 0} high / ${summary.confidenceTotals.medium || 0} medium / ${summary.confidenceTotals.low || 0} low / ${summary.confidenceTotals.unknown || 0} unknown`,
    `- High-confidence wrong answers: ${summary.highConfidenceWrong}`,
    `- Risk: ${riskCounts.OK || 0} OK / ${riskCounts.Watch || 0} Watch / ${riskCounts['Needs follow-up'] || 0} Needs follow-up`,
    '',
    '## Student Snapshot',
    '',
    '| Student | Last Activity | Diagnostic | Practice | Sessions/Day | Current Skill | Accuracy | Mistakes | Working Usage | High-Confidence Wrong | Help | Risk |',
    '|---|---|---|---:|---:|---|---:|---:|---:|---:|---:|---|',
    ...rows.map((row) => [
      `${row.name}<br>${row.email}`,
      formatDate(row.lastActivityAt),
      row.diagnosticStatus,
      `${row.practiceCompleted}/${row.practiceSessions}${row.completionRate === null ? '' : ` (${row.completionRate}%)`}`,
      row.sessionsPerDay,
      row.currentSkillId || '-',
      row.accuracy === null ? '-' : `${row.accuracy}%`,
      row.mistakesCaptured,
      row.workingUsageRate === null ? '-' : `${row.workingUsageRate}%`,
      row.highConfidenceWrong,
      row.helpRequests,
      row.risk,
    ].join(' | ')).map((row) => `| ${row} |`),
    '',
    '## Follow-Up Rules',
    '',
    '- Needs follow-up: no activity, 3+ help requests, 2+ pending workings, or 5+ captured mistakes.',
    '- Watch: diagnostic incomplete, no completed practice, 2+ mistakes, any help request, or any pending working.',
    '- High-confidence wrong answers: prioritise tutor review because the student may have a misconception they trust.',
    '- Low working usage with low accuracy: check whether the working flow is too hard to use, then assign a short guided session.',
    '- OK: active, diagnostic complete, practice captured, and no immediate support signal.',
  ];
  return lines.join('\n');
}

async function main() {
  await mongoose.connect(URI);
  const snapshot = await buildPilotSnapshot(Number(process.env.PILOT_MONITOR_LIMIT || 5));
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
