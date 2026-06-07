import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import { getMisconceptionsForSkill, listSkillMisconceptionEntries } from './skillMisconceptionMap.js';

const PASS_THRESHOLD = 70;
const asArray = (value) => (Array.isArray(value) ? value : []);
const id = (value) => value?._id?.toString?.() || value?.toString?.() || value;

function snapshotMap(session = {}) {
  return new Map(asArray(session.perSkillSnapshot).map((row) => [row.skillId, row]));
}

function sourceDiagnosticFor(assignment, diagnostics = []) {
  return diagnostics.find((session) => session.diagnosticSessionId === assignment.sourceId || id(session._id) === assignment.sourceId) || null;
}

function recheckFor(assignment, diagnostics = []) {
  const assignmentId = id(assignment._id);
  return diagnostics.find((session) => session.diagnosticPurpose === 'recheck'
    && (id(session.assignmentId) === assignmentId
      || session.sourceId === assignmentId
      || session.diagnosticSessionId === assignment.recheck?.diagnosticSessionId)) || null;
}

export function calculateInterventionEffectiveness({ assignments = [], diagnostics = [] } = {}) {
  const skillRows = new Map(listSkillMisconceptionEntries().map((entry) => [entry.skillId, {
    skillId: entry.skillId,
    skillName: entry.skillName,
    interventionsUsed: 0,
    completed: 0,
    lowAccuracyCompletions: 0,
    rechecksCompleted: 0,
    successfulRechecks: 0,
    totalImprovement: 0,
    improvementSamples: 0,
    unresolvedMisconceptions: new Set(),
    misconceptionTags: new Set([...(entry.primary || []), ...(entry.secondary || [])]),
  }]));

  for (const assignment of assignments) {
    const source = sourceDiagnosticFor(assignment, diagnostics);
    const recheck = recheckFor(assignment, diagnostics);
    const before = snapshotMap(source || {});
    const after = snapshotMap(recheck || {});

    for (const skillId of asArray(assignment.skillIds)) {
      if (!skillRows.has(skillId)) {
        skillRows.set(skillId, {
          skillId,
          skillName: skillId,
          interventionsUsed: 0,
          completed: 0,
          lowAccuracyCompletions: 0,
          rechecksCompleted: 0,
          successfulRechecks: 0,
          totalImprovement: 0,
          improvementSamples: 0,
          unresolvedMisconceptions: new Set(),
          misconceptionTags: new Set(getMisconceptionsForSkill(skillId)),
        });
      }
      const row = skillRows.get(skillId);
      row.interventionsUsed += 1;
      if (assignment.status === 'completed') row.completed += 1;
      if (assignment.status === 'completed' && Number(assignment.completion?.accuracy || 0) < PASS_THRESHOLD) {
        row.lowAccuracyCompletions += 1;
        getMisconceptionsForSkill(skillId).forEach((tag) => row.unresolvedMisconceptions.add(tag));
      }
      const beforeScore = before.get(skillId)?.score;
      const afterScore = after.get(skillId)?.score;
      if (recheck && afterScore !== undefined) {
        row.rechecksCompleted += 1;
        if (Number(afterScore) >= PASS_THRESHOLD) row.successfulRechecks += 1;
        if (beforeScore !== undefined) {
          row.totalImprovement += Number(afterScore) - Number(beforeScore);
          row.improvementSamples += 1;
        }
        if (Number(afterScore) < PASS_THRESHOLD) {
          getMisconceptionsForSkill(skillId).forEach((tag) => row.unresolvedMisconceptions.add(tag));
        }
      }
    }
  }

  const perSkill = [...skillRows.values()]
    .filter((row) => row.interventionsUsed > 0)
    .map((row) => ({
      skillId: row.skillId,
      skillName: row.skillName,
      interventionsUsed: row.interventionsUsed,
      completionRate: row.interventionsUsed ? Math.round((row.completed / row.interventionsUsed) * 100) : 0,
      recheckSuccessRate: row.rechecksCompleted ? Math.round((row.successfulRechecks / row.rechecksCompleted) * 100) : 0,
      improvementRate: row.improvementSamples ? Math.round(row.totalImprovement / row.improvementSamples) : 0,
      repeatedFailureRate: row.rechecksCompleted
        ? Math.min(100, Math.round(((row.rechecksCompleted - row.successfulRechecks + row.lowAccuracyCompletions) / Math.max(row.rechecksCompleted, row.lowAccuracyCompletions || 1)) * 100))
        : row.lowAccuracyCompletions
          ? 100
          : 0,
      unresolvedMisconceptions: [...row.unresolvedMisconceptions],
      misconceptionTags: [...row.misconceptionTags],
    }))
    .sort((a, b) => b.interventionsUsed - a.interventionsUsed || a.recheckSuccessRate - b.recheckSuccessRate);

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((assignment) => assignment.status === 'completed').length;
  const recheckedAssignments = perSkill.reduce((sum, row) => sum + row.interventionsUsed, 0);
  const successfulSkills = perSkill.filter((row) => row.recheckSuccessRate >= 70 && row.recheckSuccessRate > 0);
  const weakSkills = perSkill.filter((row) => row.recheckSuccessRate < 70 || row.repeatedFailureRate > 0);

  return {
    assignmentCount: totalAssignments,
    recoveryPackCompletionRate: totalAssignments ? Math.round((completedAssignments / totalAssignments) * 100) : 0,
    recheckSuccessRate: perSkill.length
      ? Math.round(perSkill.reduce((sum, row) => sum + row.recheckSuccessRate, 0) / perSkill.length)
      : 0,
    improvementRate: perSkill.length
      ? Math.round(perSkill.reduce((sum, row) => sum + row.improvementRate, 0) / perSkill.length)
      : 0,
    repeatedFailureRate: perSkill.length
      ? Math.round(perSkill.reduce((sum, row) => sum + row.repeatedFailureRate, 0) / perSkill.length)
      : 0,
    perSkill,
    strongestInterventions: successfulSkills.slice(0, 10),
    weakestInterventions: weakSkills.slice(0, 10),
    recheckedAssignments,
  };
}

export async function getInterventionEffectivenessReport({ studentId, domainId = 'fractions', limit = 200 } = {}) {
  const filter = { domainId };
  if (studentId) filter.studentId = studentId;
  const assignments = await MathPathAssignment.find(filter).sort({ createdAt: -1 }).limit(Number(limit) || 200).lean();
  const diagnostics = await MathPathDiagnosticSession.find({
    domainId,
    ...(studentId ? { studentId } : {}),
    $or: [
      { diagnosticPurpose: 'recheck' },
      { diagnosticSessionId: { $in: assignments.map((assignment) => assignment.sourceId) } },
    ],
  }).lean();
  return calculateInterventionEffectiveness({ assignments, diagnostics });
}

export default {
  calculateInterventionEffectiveness,
  getInterventionEffectivenessReport,
};
