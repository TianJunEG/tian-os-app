import PartnerOrganisation from '../../models/PartnerOrganisation.js';
import PartnerMembership from '../../models/PartnerMembership.js';
import PartnerStudent from '../../models/PartnerStudent.js';
import Student from '../../models/Student.js';
import StudentLearningEvent from '../../models/studentProfile/StudentLearningEvent.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';

function id(value) {
  return String(value || '').trim();
}

function percent(numerator, denominator) {
  return denominator ? Math.round((numerator / denominator) * 100) : 0;
}

function latestCompletedByStudent(sessions = []) {
  const byStudent = new Map();
  for (const session of sessions) {
    const sid = id(session.studentId);
    const existing = byStudent.get(sid);
    const currentDate = new Date(session.completedAt || session.updatedAt || 0).getTime();
    const existingDate = new Date(existing?.completedAt || existing?.updatedAt || 0).getTime();
    if (!existing || currentDate > existingDate) byStudent.set(sid, session);
  }
  return byStudent;
}

function readinessGrowth(sessions = []) {
  const baselineByStudent = new Map();
  for (const session of sessions) {
    if (!session.isBaseline && session.diagnosticPurpose !== 'baseline') continue;
    const sid = id(session.studentId);
    const existing = baselineByStudent.get(sid);
    const currentDate = new Date(session.completedAt || session.updatedAt || 0).getTime();
    const existingDate = new Date(existing?.completedAt || existing?.updatedAt || 0).getTime();
    if (!existing || currentDate < existingDate) baselineByStudent.set(sid, session);
  }
  const latestByStudent = latestCompletedByStudent(sessions);
  const improvements = [];
  for (const [sid, baseline] of baselineByStudent.entries()) {
    const latest = latestByStudent.get(sid);
    if (!latest || id(latest.diagnosticSessionId) === id(baseline.diagnosticSessionId)) continue;
    improvements.push(Number(latest.readinessScore || 0) - Number(baseline.readinessScore || 0));
  }
  return {
    improvements,
    averageReadinessImprovement: improvements.length
      ? Math.round(improvements.reduce((sum, value) => sum + value, 0) / improvements.length)
      : 0,
  };
}

export function buildPartnerMetricsFromData({
  partner = null,
  students = [],
  memberships = [],
  studentLinks = [],
  learningEvents = [],
  diagnostics = [],
  assignments = [],
  paperAnalyses = [],
} = {}) {
  const activeLinks = studentLinks.filter((link) => link.status === 'active');
  const activeStudentIds = new Set(activeLinks.map((link) => id(link.studentId)));
  const activeSince = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeStudents7d = new Set(
    learningEvents
      .filter((event) => activeStudentIds.has(id(event.studentId)) && new Date(event.occurredAt || event.createdAt || 0).getTime() >= activeSince)
      .map((event) => id(event.studentId))
  ).size;

  const completedDiagnostics = diagnostics.filter((session) => session.status === 'completed');
  const baselineDiagnosticsCompleted = completedDiagnostics.filter((session) => session.isBaseline || session.diagnosticPurpose === 'baseline').length;
  const completedAssignments = assignments.filter((assignment) => assignment.status === 'completed');
  const rechecksCompleted = completedDiagnostics.filter((session) => session.diagnosticPurpose === 'recheck').length;
  const { averageReadinessImprovement } = readinessGrowth(completedDiagnostics);
  const weakStudentIds = new Set();
  for (const session of completedDiagnostics) {
    if ((session.assignedPracticeSkillIds || []).length || (session.resultPayload?.remainingWeakSkills || []).length) {
      weakStudentIds.add(id(session.studentId));
    }
  }
  for (const analysis of paperAnalyses) {
    if ((analysis.weakSkillIds || []).length) weakStudentIds.add(id(analysis.studentId));
  }

  return {
    partnerId: id(partner?._id || partner?.id),
    totalStudents: activeLinks.length || students.length,
    staffCount: memberships.filter((membership) => membership.status !== 'removed').length,
    activeStudents7d,
    baselineDiagnosticsCompleted,
    recoveryPacksAssigned: assignments.length,
    recoveryPacksCompleted: completedAssignments.length,
    recoveryPackCompletionRate: percent(completedAssignments.length, assignments.length),
    rechecksCompleted,
    recheckCompletionRate: percent(rechecksCompleted, completedDiagnostics.length),
    averageReadinessImprovement,
    papersUploaded: paperAnalyses.length,
    parentReportsGenerated: 0,
    studentsNeedingAttention: weakStudentIds.size,
  };
}

function perSkillGrowth(diagnostics = []) {
  const completed = diagnostics.filter((session) => session.status === 'completed');
  const firstByStudent = new Map();
  const latestByStudent = latestCompletedByStudent(completed);
  for (const session of completed) {
    const sid = id(session.studentId);
    const existing = firstByStudent.get(sid);
    const currentDate = new Date(session.completedAt || session.updatedAt || 0).getTime();
    const existingDate = new Date(existing?.completedAt || existing?.updatedAt || 0).getTime();
    if (!existing || currentDate < existingDate) firstByStudent.set(sid, session);
  }
  const rows = new Map();
  for (const [sid, first] of firstByStudent.entries()) {
    const latest = latestByStudent.get(sid);
    if (!latest || id(first.diagnosticSessionId) === id(latest.diagnosticSessionId)) continue;
    const firstBySkill = new Map((first.perSkillSnapshot || []).map((row) => [id(row.skillId), row]));
    for (const latestRow of latest.perSkillSnapshot || []) {
      const skillId = id(latestRow.skillId);
      const firstRow = firstBySkill.get(skillId);
      if (!skillId || !firstRow) continue;
      const current = rows.get(skillId) || { skillId, skillName: latestRow.skillName || firstRow.skillName || skillId, improvements: [] };
      current.improvements.push(Number(latestRow.score || 0) - Number(firstRow.score || 0));
      rows.set(skillId, current);
    }
  }
  return Array.from(rows.values())
    .map((row) => ({
      skillId: row.skillId,
      skillName: row.skillName,
      averageImprovement: row.improvements.length
        ? Math.round(row.improvements.reduce((sum, value) => sum + value, 0) / row.improvements.length)
        : 0,
    }))
    .sort((a, b) => b.averageImprovement - a.averageImprovement);
}

function weakSkillCounts({ diagnostics = [], paperAnalyses = [] } = {}) {
  const counts = new Map();
  const add = (skillId) => {
    const key = id(skillId);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  };
  for (const session of diagnostics) {
    for (const skillId of session.assignedPracticeSkillIds || []) add(skillId);
    for (const skillId of session.resultPayload?.remainingWeakSkills || []) add(skillId);
    for (const row of session.perSkillSnapshot || []) {
      if (Number(row.score || 0) < 70) add(row.skillId);
    }
  }
  for (const analysis of paperAnalyses) {
    for (const skillId of analysis.weakSkillIds || []) add(skillId);
  }
  return Array.from(counts.entries())
    .map(([skillId, count]) => ({ skillId, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getPartnerMetrics(partnerId) {
  const partner = await PartnerOrganisation.findById(partnerId).lean();
  if (!partner) {
    const err = new Error('Partner not found.');
    err.status = 404;
    throw err;
  }
  const [memberships, studentLinks] = await Promise.all([
    PartnerMembership.find({ organisationId: partner._id }).lean(),
    PartnerStudent.find({ organisationId: partner._id }).lean(),
  ]);
  const studentIds = studentLinks.map((link) => id(link.studentId));
  const [students, learningEvents, diagnostics, assignments, paperAnalyses] = await Promise.all([
    Student.find({ _id: { $in: studentIds } }).lean(),
    StudentLearningEvent.find({ studentId: { $in: studentIds } }).lean(),
    MathPathDiagnosticSession.find({ studentId: { $in: studentIds } }).lean(),
    MathPathAssignment.find({ studentId: { $in: studentIds } }).lean(),
    PaperAnalysis.find({ studentId: { $in: studentIds } }).lean(),
  ]);

  return buildPartnerMetricsFromData({
    partner,
    students,
    memberships,
    studentLinks,
    learningEvents,
    diagnostics,
    assignments,
    paperAnalyses,
  });
}

export async function getPartnerImpactReport(partnerId) {
  const partner = await PartnerOrganisation.findById(partnerId).lean();
  if (!partner) {
    const err = new Error('Partner not found.');
    err.status = 404;
    throw err;
  }
  const [memberships, studentLinks] = await Promise.all([
    PartnerMembership.find({ organisationId: partner._id }).lean(),
    PartnerStudent.find({ organisationId: partner._id }).lean(),
  ]);
  const studentIds = studentLinks.map((link) => id(link.studentId));
  const [students, learningEvents, diagnostics, assignments, paperAnalyses] = await Promise.all([
    Student.find({ _id: { $in: studentIds } }).lean(),
    StudentLearningEvent.find({ studentId: { $in: studentIds } }).lean(),
    MathPathDiagnosticSession.find({ studentId: { $in: studentIds } }).lean(),
    MathPathAssignment.find({ studentId: { $in: studentIds } }).lean(),
    PaperAnalysis.find({ studentId: { $in: studentIds } }).lean(),
  ]);
  const metrics = buildPartnerMetricsFromData({
    partner,
    students,
    memberships,
    studentLinks,
    learningEvents,
    diagnostics,
    assignments,
    paperAnalyses,
  });
  const weakSkills = weakSkillCounts({ diagnostics, paperAnalyses });
  const improvedSkills = perSkillGrowth(diagnostics).filter((row) => row.averageImprovement > 0);
  const dataQualityWarnings = [];
  if (!students.length) dataQualityWarnings.push('No active linked students yet.');
  if (!diagnostics.some((session) => session.isBaseline || session.diagnosticPurpose === 'baseline')) {
    dataQualityWarnings.push('No baseline diagnostics available for linked students.');
  }
  if (!diagnostics.some((session) => session.diagnosticPurpose === 'recheck')) {
    dataQualityWarnings.push('No completed recheck diagnostics yet.');
  }

  return {
    partner: {
      id: id(partner._id),
      name: partner.name,
      type: partner.type,
      status: partner.status,
      contactName: partner.contactName,
      contactEmail: partner.contactEmail,
    },
    pilotSize: metrics.totalStudents,
    interventionCompletionRate: metrics.recoveryPackCompletionRate,
    recheckCompletionRate: metrics.recheckCompletionRate,
    averageReadinessGain: metrics.averageReadinessImprovement,
    topImprovedSkills: improvedSkills.slice(0, 5),
    topRemainingWeakSkills: weakSkills.slice(0, 5),
    evidenceExamples: paperAnalyses.slice(0, 3).map((analysis) => ({
      paperAnalysisId: id(analysis._id),
      studentId: id(analysis.studentId),
      weakSkillIds: analysis.weakSkillIds || [],
      status: analysis.status,
    })),
    metrics,
    dataQualityWarnings,
  };
}

export default {
  buildPartnerMetricsFromData,
  getPartnerMetrics,
  getPartnerImpactReport,
};
