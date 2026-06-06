import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import { getDiagnosticHistory, buildDiagnosticGrowth } from '../diagnostics/diagnosticGrowthService.js';

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function average(values = []) {
  const nums = values.map((value) => num(value, NaN)).filter(Number.isFinite);
  return nums.length ? Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length) : 0;
}

export async function getPilotDashboardMetrics({ subjectId = 'math', domainId = 'fractions' } = {}) {
  const [
    baselineSessions,
    recheckSessions,
    assignments,
    papers,
    misconceptions,
  ] = await Promise.all([
    MathPathDiagnosticSession.find({ subjectId, domainId, status: 'completed', isBaseline: true }).lean(),
    MathPathDiagnosticSession.find({ subjectId, domainId, status: 'completed', diagnosticPurpose: 'recheck' }).lean(),
    MathPathAssignment.find({ subjectId, domainId }).lean(),
    PaperAnalysis.find({ subjectId, domainId }).lean(),
    MathPathMistakeRecord.find({ domainId }).lean(),
  ]);

  const studentIds = [...new Set([
    ...baselineSessions.map((session) => String(session.studentId)),
    ...recheckSessions.map((session) => String(session.studentId)),
    ...assignments.map((assignment) => String(assignment.studentId)),
  ].filter(Boolean))];

  const improvements = await Promise.all(studentIds.map(async (studentId) => {
    const history = await getDiagnosticHistory({ studentId, subjectId, domainId });
    return buildDiagnosticGrowth(history).overallImprovement;
  }));

  const misconceptionCounts = misconceptions.reduce((acc, row) => {
    const key = row.mistakeName || row.mistakeCode || 'mistake';
    acc[key] = (acc[key] || 0) + num(row.frequency, 1);
    return acc;
  }, {});

  return {
    subjectId,
    domainId,
    studentsWithBaseline: new Set(baselineSessions.map((session) => String(session.studentId))).size,
    studentsWithRecheck: new Set(recheckSessions.map((session) => String(session.studentId))).size,
    recoveryPacksAssigned: assignments.length,
    recoveryPacksCompleted: assignments.filter((assignment) => assignment.status === 'completed').length,
    averageReadinessImprovement: average(improvements.filter((value) => value !== null && value !== undefined)),
    topMisconceptions: Object.entries(misconceptionCounts)
      .map(([misconception, count]) => ({ misconception, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    papersUploaded: papers.length,
    papersReviewed: papers.filter((paper) => ['reviewed', 'assigned'].includes(paper.status)).length,
  };
}

export default {
  getPilotDashboardMetrics,
};
