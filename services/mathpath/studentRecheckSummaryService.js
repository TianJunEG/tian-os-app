import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import { getMisconception } from './misconceptionRegistry.js';
import { encouragementForImprovement, nextActionCopy, safeStudentPhrase } from './studentCoachingCopy.js';
import { getSkillDisplayName, replaceSkillIdsForStudents } from './skillDisplayNameService.js';

const PASS_THRESHOLD = 70;
const asArray = (value) => (Array.isArray(value) ? value : []);
const id = (value) => value?._id?.toString?.() || value?.toString?.() || value;

const MISCONCEPTION_STUDENT_COPY = {
  adds_denominators_directly: 'You are no longer adding the bottom numbers directly. You are learning to make the pieces the same size first.',
  subtracts_denominators_directly: 'You are keeping the same-sized parts clear before subtracting.',
  common_denominator_missing: 'You are getting better at making fraction parts the same size before combining them.',
  uses_original_instead_of_remainder: 'You are learning to use the remaining amount as the new whole.',
  numerator_denominator_confusion: 'You are getting clearer about what the top and bottom numbers mean.',
  equivalence_scale_error: 'You are getting better at changing both parts of the fraction by the same amount.',
  incorrect_simplification: 'You are checking whether a fraction can be simplified further.',
  skipped_step: 'You are learning to show each important step instead of jumping too quickly.',
  operation_mismatch: 'You are getting better at choosing the method that matches the story.',
  calculation_error: 'You are building a stronger checking habit for calculations.',
};

function score(row = {}) {
  const n = Number(row.score);
  return Number.isFinite(n) ? n : null;
}

function mapBySkill(rows = []) {
  return new Map(asArray(rows).map((row) => [row.skillId, row]));
}

function shapeSkillGrowth({ skillId, beforeRow, currentRow } = {}) {
  const display = getSkillDisplayName(skillId);
  const beforeScore = score(beforeRow);
  const currentScore = score(currentRow);
  const improvement = beforeScore === null || currentScore === null ? null : Math.round(currentScore - beforeScore);
  return {
    displayName: display.shortStudentLabel,
    explanation: display.studentExplanation,
    beforeScore,
    currentScore,
    improvement,
    isImproved: improvement !== null && improvement > 0,
    isSecure: currentScore !== null && currentScore >= PASS_THRESHOLD,
  };
}

function resolvedMisconceptionCopy({ beforeTags = [], currentTags = [] } = {}) {
  return beforeTags
    .filter((tag) => !currentTags.includes(tag))
    .map((tag) => ({
      title: getMisconception(tag)?.misconceptionName || 'A tricky mistake',
      explanation: MISCONCEPTION_STUDENT_COPY[tag] || 'You are showing a stronger method than before.',
    }));
}

function chooseNextAction({ improvedSkills = [], stillNeedsWork = [], assignment = null } = {}) {
  if (stillNeedsWork.length) {
    const first = stillNeedsWork[0];
    return nextActionCopy({
      type: assignment?.status === 'completed' ? 'guided_practice' : 'continue_recovery_pack',
      reason: `${first.displayName} ${stillNeedsWork.length > 1 ? 'and a few other skills are' : 'is'} still practising. A few more guided questions will help.`,
    });
  }
  if (improvedSkills.length) {
    return nextActionCopy({
      type: 'start_next_learning_path',
      reason: 'you showed progress in the skills from this Recovery Pack.',
    });
  }
  return nextActionCopy({
    type: 'continue_practice',
    reason: 'this recheck gives us useful information, and more practice will help confirm the skill.',
  });
}

export function buildStudentRecheckSummary({ recheck = {}, baseline = null, previous = null, assignment = null } = {}) {
  const before = previous || baseline || null;
  const beforeRows = mapBySkill(before?.perSkillSnapshot || []);
  const currentRows = mapBySkill(recheck.perSkillSnapshot || []);
  const targetSkillIds = asArray(assignment?.skillIds).length
    ? asArray(assignment.skillIds)
    : asArray(recheck.targetSkillIds).length
      ? asArray(recheck.targetSkillIds)
      : [...currentRows.keys()];
  const growthRows = targetSkillIds
    .map((skillId) => shapeSkillGrowth({
      skillId,
      beforeRow: beforeRows.get(skillId),
      currentRow: currentRows.get(skillId),
    }))
    .filter((row) => row.currentScore !== null || row.beforeScore !== null);
  const improvedSkills = growthRows.filter((row) => row.isImproved);
  const stillNeedsWork = growthRows.filter((row) => !row.isSecure);
  const beforeTags = asArray(before?.perSkillSnapshot).flatMap((row) => asArray(row.misconceptionTags));
  const currentTags = asArray(recheck?.perSkillSnapshot).flatMap((row) => asArray(row.misconceptionTags));
  const resolvedMisconceptions = resolvedMisconceptionCopy({ beforeTags, currentTags });
  const baselineScore = Number(baseline?.readinessScore ?? baseline?.result?.overallFractionReadinessScore ?? 0);
  const recheckScore = Number(recheck.readinessScore ?? recheck.result?.overallFractionReadinessScore ?? 0);
  const overallImprovement = Number.isFinite(recheckScore - baselineScore) ? Math.round(recheckScore - baselineScore) : null;
  const nextRecommendedAction = chooseNextAction({ improvedSkills, stillNeedsWork, assignment });
  const firstImproved = improvedSkills[0];
  const firstStill = stillNeedsWork[0];
  const coachingExplanation = firstImproved
    ? `You improved in ${firstImproved.displayName}. This means ${firstImproved.explanation} is getting stronger.`
    : firstStill
      ? `${firstStill.displayName} is still practising. Keep going with short guided questions.`
      : 'This recheck helps Tian OS choose your next practice step.';

  return {
    title: assignment ? 'Recovery Pack Recheck' : 'Recheck Complete',
    encouragementMessage: encouragementForImprovement(overallImprovement),
    overallImprovement,
    improvedSkills,
    stillNeedsWork,
    resolvedMisconceptions,
    nextRecommendedAction,
    coachingExplanation: replaceSkillIdsForStudents(safeStudentPhrase(coachingExplanation)),
    displaySkillNames: targetSkillIds.map((skillId) => getSkillDisplayName(skillId).shortStudentLabel),
    evidenceConfidence: growthRows.length >= 2 ? 'medium' : growthRows.length ? 'developing' : 'limited',
    recoveryPackContext: assignment ? {
      title: assignment.title || 'Recovery Pack',
      completed: assignment.status === 'completed',
      message: 'This recheck came after your Recovery Pack.',
    } : null,
  };
}

export async function getStudentRecheckSummary({
  studentId,
  diagnosticSessionId,
  assignmentId = '',
  domainId = 'fractions',
  subjectId = 'math',
} = {}) {
  const recheck = await MathPathDiagnosticSession.findOne({
    studentId: String(studentId),
    diagnosticSessionId,
    domainId,
    subjectId,
    status: 'completed',
  }).lean();
  if (!recheck) {
    const err = new Error('Completed recheck not found.');
    err.status = 404;
    throw err;
  }
  if (recheck.diagnosticPurpose !== 'recheck') {
    const err = new Error('This diagnostic is not a recheck.');
    err.status = 409;
    throw err;
  }
  const resolvedAssignmentId = assignmentId || id(recheck.assignmentId) || recheck.sourceId || '';
  const assignment = resolvedAssignmentId
    ? await MathPathAssignment.findOne({ _id: resolvedAssignmentId, studentId: String(studentId) }).lean()
    : null;
  const baseline = recheck.baselineDiagnosticId
    ? await MathPathDiagnosticSession.findOne({ diagnosticSessionId: recheck.baselineDiagnosticId, studentId: String(studentId) }).lean()
    : null;
  const previous = recheck.previousDiagnosticId
    ? await MathPathDiagnosticSession.findOne({ diagnosticSessionId: recheck.previousDiagnosticId, studentId: String(studentId) }).lean()
    : null;

  return buildStudentRecheckSummary({ recheck, baseline, previous, assignment });
}

export default {
  buildStudentRecheckSummary,
  getStudentRecheckSummary,
};
