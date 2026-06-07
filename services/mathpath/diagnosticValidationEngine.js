import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAttempt from '../../models/mathpath/MathPathAttempt.js';
import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import { buildCrossEvidenceValidation } from './crossEvidenceValidator.js';

const WEAK_SCORE_THRESHOLD = 70;

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const asArray = (value) => (Array.isArray(value) ? value : []);
const objectId = (value) => value?._id?.toString?.() || value?.toString?.() || value;

function confidenceBucket(value) {
  const text = String(value || '').toLowerCase();
  if (['high', 'very_high', 'confident', 'i_know_this', 'know'].some((token) => text.includes(token))) return 'high';
  if (['low', 'help', 'not_sure', 'unsure'].some((token) => text.includes(token))) return 'low';
  if (text) return 'medium';
  return 'unknown';
}

function isCorrect(attempt) {
  return Boolean(attempt?.answerCorrect ?? attempt?.correct);
}

export function classifyAttemptEvidence(attempt = {}) {
  const correct = isCorrect(attempt);
  const confidence = confidenceBucket(attempt.confidenceLevel || attempt.confidence);
  const hasWorking = Boolean(attempt.workingSubmitted);
  const noWorking = Boolean(attempt.workingNotNeeded);
  const highWorkingRequirement = attempt.workingRequirementLevel === 'HIGH';

  if (correct && confidence === 'high' && (hasWorking || noWorking)) return 'correct_evidence';
  if (!correct && confidence === 'high' && noWorking) return 'confidence_mismatch';
  if (!correct && highWorkingRequirement && noWorking) return 'procedural_error';
  if (!correct && hasWorking) return attempt.possibleMisconception ? 'conceptual_error' : 'procedural_error';
  if (!correct && confidence === 'low') return 'knowledge_gap';
  if (!correct) return 'careless_error';
  if (correct && confidence === 'low') return 'confidence_mismatch';
  return 'correct_evidence';
}

export function calculateEvidenceConfidenceScore({
  diagnosticEvidence = {},
  paperEvidence = {},
  workingEvidence = {},
  assignmentEvidence = {},
  recheckEvidence = {},
} = {}) {
  let score = 0;

  const diagnosticQuestions = Number(diagnosticEvidence.questionsAnswered || 0);
  if (diagnosticQuestions >= 3) score += 22;
  else if (diagnosticQuestions === 2) score += 15;
  else if (diagnosticQuestions === 1) score += 7;
  if (diagnosticEvidence.hasConsistentErrors) score += 8;
  if (diagnosticEvidence.hasPerSkillSnapshot) score += 5;

  if (paperEvidence.confirmedWeakSkill) score += 15;
  else if (paperEvidence.detectedWeakSkill) score += 8;
  if (paperEvidence.adultReviewed) score += 5;

  if (workingEvidence.methodIssueDetected) score += 10;
  else if (workingEvidence.workingSubmitted) score += 6;
  if (workingEvidence.noWorkingRisk) score += 5;

  if (assignmentEvidence.completed) score += 8;
  if (assignmentEvidence.lowAccuracy || assignmentEvidence.improved) score += 7;

  if (recheckEvidence.completed) score += 10;
  if (recheckEvidence.confirmedImprovement || recheckEvidence.confirmedStillWeak) score += 5;

  return clamp(score);
}

function skillSnapshotMap(session) {
  return new Map(asArray(session?.perSkillSnapshot).map((snapshot) => [snapshot.skillId, snapshot]));
}

function getSessionWeakSkillIds(session = {}) {
  const result = session.result || session.resultPayload || {};
  return Array.from(new Set([
    ...asArray(result.weakSkillIds),
    ...asArray(result.remainingWeakSkills),
    ...asArray(session.assignedPracticeSkillIds),
    ...asArray(session.perSkillSnapshot)
      .filter((snapshot) => Number(snapshot.score) < WEAK_SCORE_THRESHOLD)
      .map((snapshot) => snapshot.skillId),
  ].filter(Boolean)));
}

function summarizeAttempts(attempts = []) {
  const total = attempts.length;
  const correctCount = attempts.filter(isCorrect).length;
  const wrongCount = total - correctCount;
  const highConfidenceWrong = attempts.filter((attempt) => !isCorrect(attempt) && confidenceBucket(attempt.confidenceLevel || attempt.confidence) === 'high').length;
  const lowConfidenceCorrect = attempts.filter((attempt) => isCorrect(attempt) && confidenceBucket(attempt.confidenceLevel || attempt.confidence) === 'low').length;
  const noWorkingHighRequirement = attempts.filter((attempt) => !isCorrect(attempt) && attempt.workingRequirementLevel === 'HIGH' && attempt.workingNotNeeded).length;
  const workingSubmitted = attempts.filter((attempt) => attempt.workingSubmitted).length;
  const workingNotNeeded = attempts.filter((attempt) => attempt.workingNotNeeded).length;
  const times = attempts.map((attempt) => Number(attempt.timeTaken || attempt.timeSpentSeconds || 0)).filter((value) => value > 0);
  const misconceptionTags = Array.from(new Set(attempts.flatMap((attempt) => [
    attempt.possibleMisconception,
    ...asArray(attempt.heuristicTags),
  ]).filter(Boolean)));

  return {
    total,
    correctCount,
    wrongCount,
    wrongRate: total ? wrongCount / total : 0,
    highConfidenceWrong,
    lowConfidenceCorrect,
    noWorkingHighRequirement,
    workingSubmitted,
    workingNotNeeded,
    averageTimeTaken: times.length ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length) : 0,
    misconceptionTags,
    classifiedEvidence: attempts.map(classifyAttemptEvidence),
  };
}

function paperEvidenceForSkill(paperAnalyses = [], skillId) {
  const matchingPapers = paperAnalyses.filter((paper) => (paper.weakSkillIds || []).includes(skillId)
    || asArray(paper.detectedQuestions).some((question) => (
      asArray(question.detectedSkillIds).includes(skillId)
      && (question.adultConfirmedWrong || question.teacherMarkedCorrect === false)
    )));
  const confirmedWrongQuestions = matchingPapers.flatMap((paper) => asArray(paper.detectedQuestions)
    .filter((question) => asArray(question.detectedSkillIds).includes(skillId)
      && question.adultConfirmedWrong));

  return {
    detectedWeakSkill: matchingPapers.length > 0,
    confirmedWeakSkill: confirmedWrongQuestions.length > 0 || matchingPapers.some((paper) => paper.status === 'reviewed'),
    adultReviewed: matchingPapers.some((paper) => ['reviewed', 'assigned'].includes(paper.status)),
    misconceptionTags: Array.from(new Set(confirmedWrongQuestions.flatMap((question) => asArray(question.misconceptionTags)))),
    count: matchingPapers.length,
  };
}

function assignmentEvidenceForSkill(assignments = [], skillId) {
  const matching = assignments.filter((assignment) => asArray(assignment.skillIds).includes(skillId));
  const completed = matching.filter((assignment) => assignment.status === 'completed');
  const lowAccuracy = matching.some((assignment) => Number(assignment.completion?.accuracy || 0) > 0
    && Number(assignment.completion?.accuracy || 0) < WEAK_SCORE_THRESHOLD);
  const improved = completed.some((assignment) => Number(assignment.completion?.accuracy || 0) >= WEAK_SCORE_THRESHOLD);

  return {
    linkedAssignments: matching.map((assignment) => objectId(assignment._id)),
    completed: completed.length > 0,
    lowAccuracy,
    improved,
  };
}

function recheckEvidenceForSkill(rechecks = [], skillId) {
  const snapshots = rechecks.flatMap((session) => asArray(session.perSkillSnapshot)
    .filter((snapshot) => snapshot.skillId === skillId)
    .map((snapshot) => ({ ...snapshot, sessionId: session.diagnosticSessionId, completedAt: session.completedAt })));
  const latest = snapshots.at(-1);
  return {
    completed: Boolean(latest),
    latestScore: latest?.score,
    confirmedImprovement: latest ? Number(latest.score) >= WEAK_SCORE_THRESHOLD : false,
    confirmedStillWeak: latest ? Number(latest.score) < WEAK_SCORE_THRESHOLD : false,
    latest,
  };
}

function evidenceStrength({ snapshot, attempts, paperEvidence, assignmentEvidence, recheckEvidence }) {
  if (attempts.total >= 3 && (attempts.wrongRate >= 0.5 || Number(snapshot?.score) < 60)) return 'strong';
  if (paperEvidence.confirmedWeakSkill || recheckEvidence.confirmedStillWeak) return 'strong';
  if (attempts.total >= 2 || assignmentEvidence.lowAccuracy || Number(snapshot?.score) < WEAK_SCORE_THRESHOLD) return 'moderate';
  return 'weak';
}

function validationEntry({ session, skillId, attempts, paperAnalyses, assignments, rechecks }) {
  const snapshots = skillSnapshotMap(session);
  const snapshot = snapshots.get(skillId);
  const skillAttempts = attempts.filter((attempt) => attempt.skillId === skillId);
  const attemptSummary = summarizeAttempts(skillAttempts);
  const paperEvidence = paperEvidenceForSkill(paperAnalyses, skillId);
  const assignmentEvidence = assignmentEvidenceForSkill(assignments, skillId);
  const recheckEvidence = recheckEvidenceForSkill(rechecks, skillId);
  const score = snapshot?.score ?? (attemptSummary.total ? Math.round((attemptSummary.correctCount / attemptSummary.total) * 100) : null);
  const isWeak = Number(score) < WEAK_SCORE_THRESHOLD || getSessionWeakSkillIds(session).includes(skillId);
  const diagnosticEvidence = {
    questionsAnswered: snapshot?.questionsAnswered || attemptSummary.total,
    hasConsistentErrors: attemptSummary.wrongCount >= 2 && attemptSummary.wrongRate >= 0.5,
    hasPerSkillSnapshot: Boolean(snapshot),
  };
  const workingEvidence = {
    workingSubmitted: attemptSummary.workingSubmitted > 0,
    methodIssueDetected: attemptSummary.noWorkingHighRequirement > 0 || attemptSummary.misconceptionTags.length > 0,
    noWorkingRisk: attemptSummary.noWorkingHighRequirement > 0,
  };
  const confidenceScore = calculateEvidenceConfidenceScore({
    diagnosticEvidence,
    paperEvidence,
    workingEvidence,
    assignmentEvidence,
    recheckEvidence,
  });
  const strength = evidenceStrength({ snapshot, attempts: attemptSummary, paperEvidence, assignmentEvidence, recheckEvidence });
  const falsePositiveRisk = Boolean(isWeak && (
    diagnosticEvidence.questionsAnswered <= 1
    || (attemptSummary.wrongCount <= 1 && !paperEvidence.confirmedWeakSkill && !assignmentEvidence.lowAccuracy)
    || (attemptSummary.correctCount > attemptSummary.wrongCount && !paperEvidence.confirmedWeakSkill)
  ));
  const falseNegativeRisk = Boolean(!isWeak && (
    paperEvidence.confirmedWeakSkill
    || attemptSummary.highConfidenceWrong > 0
    || attemptSummary.noWorkingHighRequirement > 0
    || assignmentEvidence.lowAccuracy
  ));
  const alternativeExplanations = [
    diagnosticEvidence.questionsAnswered <= 1 ? 'single_question_evidence' : null,
    attemptSummary.highConfidenceWrong ? 'confidence_mismatch' : null,
    attemptSummary.lowConfidenceCorrect ? 'underconfidence_or_lucky_success' : null,
    attemptSummary.noWorkingHighRequirement ? 'no_working_on_high_reasoning_question' : null,
    falsePositiveRisk ? 'weak_skill_claim_needs_more_evidence' : null,
    falseNegativeRisk ? 'passed_skill_has_conflicting_external_evidence' : null,
  ].filter(Boolean);

  return {
    skillId,
    skillName: snapshot?.skillName || skillId,
    score,
    questionsUsed: diagnosticEvidence.questionsAnswered,
    misconceptionsTargeted: Array.from(new Set([
      ...asArray(snapshot?.misconceptionTags),
      ...attemptSummary.misconceptionTags,
      ...paperEvidence.misconceptionTags,
    ])),
    evidenceStrength: strength,
    confidenceLevel: confidenceScore >= 75 ? 'high' : confidenceScore >= 50 ? 'medium' : 'low',
    confidenceScore,
    interventionLinkage: {
      assignedPractice: asArray(session.assignedPracticeSkillIds).includes(skillId),
      linkedAssignments: assignmentEvidence.linkedAssignments,
      recommended: isWeak || paperEvidence.confirmedWeakSkill || assignmentEvidence.lowAccuracy,
    },
    supportingEvidence: {
      diagnostic: diagnosticEvidence,
      attempts: attemptSummary,
      paper: paperEvidence,
      assignment: assignmentEvidence,
      recheck: recheckEvidence,
    },
    alternativeExplanations,
    isWeak,
    falsePositiveRisk,
    falseNegativeRisk,
    recommendedAction: falsePositiveRisk
      ? 'collect_more_evidence'
      : falseNegativeRisk
        ? 'manual_review'
        : isWeak
          ? 'assign_targeted_practice'
          : 'retention_review',
  };
}

export function validateDiagnosticSession({
  session,
  attempts = [],
  paperAnalyses = [],
  assignments = [],
  rechecks = [],
} = {}) {
  if (!session) throw new Error('Diagnostic session is required.');

  const skillIds = Array.from(new Set([
    ...asArray(session.perSkillSnapshot).map((snapshot) => snapshot.skillId),
    ...getSessionWeakSkillIds(session),
    ...attempts.map((attempt) => attempt.skillId),
    ...paperAnalyses.flatMap((paper) => asArray(paper.weakSkillIds)),
    ...assignments.flatMap((assignment) => asArray(assignment.skillIds)),
  ].filter(Boolean)));

  const skillValidationMatrix = skillIds.map((skillId) => validationEntry({
    session,
    skillId,
    attempts,
    paperAnalyses,
    assignments,
    rechecks,
  }));
  const crossEvidence = buildCrossEvidenceValidation({
    skillIds,
    diagnostics: [session],
    attempts,
    paperAnalyses,
    assignments,
    rechecks,
  });

  return {
    diagnosticSessionId: session.diagnosticSessionId || objectId(session._id),
    studentId: objectId(session.studentId),
    subjectId: session.subjectId,
    domainId: session.domainId,
    readinessScore: session.readinessScore,
    skillValidationMatrix,
    crossEvidence,
    identifiedWeakSkills: skillValidationMatrix.filter((entry) => entry.isWeak).map((entry) => entry.skillId),
    strongestEvidence: skillValidationMatrix.filter((entry) => entry.evidenceStrength === 'strong'),
    weakEvidence: skillValidationMatrix.filter((entry) => entry.evidenceStrength === 'weak'),
    falsePositiveRisks: skillValidationMatrix.filter((entry) => entry.falsePositiveRisk),
    falseNegativeRisks: skillValidationMatrix.filter((entry) => entry.falseNegativeRisk),
    confidenceDistribution: {
      high: skillValidationMatrix.filter((entry) => entry.confidenceLevel === 'high').length,
      medium: skillValidationMatrix.filter((entry) => entry.confidenceLevel === 'medium').length,
      low: skillValidationMatrix.filter((entry) => entry.confidenceLevel === 'low').length,
    },
    misconceptionValidation: {
      conceptual: skillValidationMatrix.filter((entry) => entry.supportingEvidence.attempts.classifiedEvidence.includes('conceptual_error')).length,
      procedural: skillValidationMatrix.filter((entry) => entry.supportingEvidence.attempts.classifiedEvidence.includes('procedural_error')).length,
      careless: skillValidationMatrix.filter((entry) => entry.supportingEvidence.attempts.classifiedEvidence.includes('careless_error')).length,
      confidenceMismatch: skillValidationMatrix.filter((entry) => entry.supportingEvidence.attempts.classifiedEvidence.includes('confidence_mismatch')).length,
    },
    interventionPriorities: skillValidationMatrix
      .filter((entry) => entry.recommendedAction !== 'retention_review')
      .sort((a, b) => b.confidenceScore - a.confidenceScore),
  };
}

export function validateInterventions({ assignments = [], diagnostics = [] } = {}) {
  return assignments.map((assignment) => {
    const targetSkills = asArray(assignment.skillIds);
    const sourceDiagnostic = diagnostics.find((session) => objectId(session._id) === objectId(assignment.sourceId)
      || session.diagnosticSessionId === assignment.sourceId);
    const laterRechecks = diagnostics.filter((session) => session.diagnosticPurpose === 'recheck'
      && (objectId(session.assignmentId) === objectId(assignment._id) || session.sourceId === objectId(assignment._id)));
    const latestRecheck = laterRechecks.at(-1);
    const baselineSnapshots = skillSnapshotMap(sourceDiagnostic || {});
    const recheckSnapshots = skillSnapshotMap(latestRecheck || {});
    const targetedSkillImprovement = targetSkills.map((skillId) => {
      const beforeScore = baselineSnapshots.get(skillId)?.score;
      const afterScore = recheckSnapshots.get(skillId)?.score;
      return {
        skillId,
        beforeScore,
        afterScore,
        improvement: afterScore !== undefined && beforeScore !== undefined ? Number(afterScore) - Number(beforeScore) : null,
        status: afterScore === undefined ? 'pending_recheck' : Number(afterScore) >= WEAK_SCORE_THRESHOLD ? 'improved' : 'still_weak',
      };
    });

    return {
      assignmentId: objectId(assignment._id),
      sourceType: assignment.sourceType,
      status: assignment.status,
      completionAccuracy: assignment.completion?.accuracy,
      recheckCompleted: Boolean(latestRecheck),
      targetedSkillImprovement,
      interventionSucceeded: targetedSkillImprovement.some((item) => item.status === 'improved'),
      unresolvedMisconceptions: targetedSkillImprovement.filter((item) => item.status === 'still_weak').map((item) => item.skillId),
    };
  });
}

export async function getDiagnosticValidationReport({
  studentId,
  subjectId = 'math',
  domainId = 'fractions',
  limit = 50,
} = {}) {
  const sessionQuery = { status: 'completed', subjectId, domainId };
  if (studentId) sessionQuery.studentId = studentId;

  const sessions = await MathPathDiagnosticSession.find(sessionQuery)
    .sort({ completedAt: -1, createdAt: -1 })
    .limit(Number(limit) || 50)
    .lean();
  const studentIds = Array.from(new Set(sessions.map((session) => objectId(session.studentId)).filter(Boolean)));
  const queryStudentIds = studentId ? [studentId] : studentIds;

  const [attempts, paperAnalyses, assignments, rechecks] = await Promise.all([
    MathPathAttempt.find({ studentId: { $in: queryStudentIds }, domainId }).lean(),
    PaperAnalysis.find({ studentId: { $in: queryStudentIds }, domainId }).lean(),
    MathPathAssignment.find({ studentId: { $in: queryStudentIds }, domainId }).lean(),
    MathPathDiagnosticSession.find({ studentId: { $in: queryStudentIds }, subjectId, domainId, diagnosticPurpose: 'recheck', status: 'completed' }).sort({ completedAt: 1 }).lean(),
  ]);

  const validations = sessions.map((session) => validateDiagnosticSession({
    session,
    attempts: attempts.filter((attempt) => objectId(attempt.sessionId) === session.diagnosticSessionId
      || objectId(attempt.studentId) === objectId(session.studentId)),
    paperAnalyses: paperAnalyses.filter((paper) => objectId(paper.studentId) === objectId(session.studentId)),
    assignments: assignments.filter((assignment) => objectId(assignment.studentId) === objectId(session.studentId)),
    rechecks: rechecks.filter((recheck) => objectId(recheck.studentId) === objectId(session.studentId)),
  }));
  const interventionValidation = validateInterventions({ assignments, diagnostics: sessions.concat(rechecks) });

  return {
    subjectId,
    domainId,
    sessionCount: sessions.length,
    skillValidationMatrix: validations.flatMap((validation) => validation.skillValidationMatrix),
    strongestEvidence: validations.flatMap((validation) => validation.strongestEvidence).slice(0, 25),
    weakEvidence: validations.flatMap((validation) => validation.weakEvidence).slice(0, 25),
    falsePositives: validations.flatMap((validation) => validation.falsePositiveRisks).slice(0, 25),
    falseNegatives: validations.flatMap((validation) => validation.falseNegativeRisks).slice(0, 25),
    confidenceDistribution: validations.reduce((acc, validation) => {
      acc.high += validation.confidenceDistribution.high;
      acc.medium += validation.confidenceDistribution.medium;
      acc.low += validation.confidenceDistribution.low;
      return acc;
    }, { high: 0, medium: 0, low: 0 }),
    crossEvidence: validations.flatMap((validation) => validation.crossEvidence).slice(0, 50),
    interventionSuccessRates: {
      checked: interventionValidation.length,
      succeeded: interventionValidation.filter((item) => item.interventionSucceeded).length,
      failed: interventionValidation.filter((item) => item.unresolvedMisconceptions.length > 0).length,
      pendingRecheck: interventionValidation.filter((item) => !item.recheckCompleted).length,
    },
    interventionValidation,
  };
}
