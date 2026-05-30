import {
  buildFractionDiagnosticSession,
  scoreFractionDiagnosticAttempt,
} from '../fractions/fractionDiagnosticEngine.js';
import {
  buildFractionPracticeSession,
  getFractionPracticeQueue,
} from '../fractions/fractionPracticeEngine.js';
import {
  calculateQuestionFamilyFluency,
  calculateSkillFluency,
  calculateDomainFluency,
} from '../fractions/fractionFluencyEngine.js';
import {
  scheduleFractionRetentionReviews,
  getDueFractionRetentionReviews,
  scoreFractionRetentionReview,
} from '../fractions/fractionRetentionEngine.js';
import {
  classifyFractionMistake,
  buildMistakeToMasteryPlan,
} from '../fractions/fractionMistakeToMasteryEngine.js';
import {
  buildFractionAssessmentSession,
  scoreFractionAssessmentSubmission,
  buildAssessmentReport,
} from '../fractions/fractionAssessmentEngine.js';
import {
  createPendingWorkingAnalysis,
  buildWorkingAnalysisSummary,
} from '../working/workingAnalysisFramework.js';
import {
  buildParentMathPathSummary,
} from '../dashboard/parentMathPathDashboardEngine.js';
import {
  buildStudentProgressState,
  buildStudentDashboardPayload,
} from '../state/mathPathStudentProgressEngine.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from '../fractions/fractionQuestionFamilies.js';
import { getSkill } from '../fractions/fractionSkillGraph.js';

const ORCHESTRATOR_VERSION = 'mathpath-domain-orchestrator/v1.0.0';

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function pickFirstFamily(skillId) {
  return getQuestionFamiliesBySkill(skillId)[0]?.id || null;
}

function normalizePracticeAttempts(practiceAttempts = []) {
  return (practiceAttempts || []).map((a, idx) => ({
    questionId: a.questionId || `practice_q_${idx + 1}`,
    skillId: a.skillId,
    questionFamilyId: a.questionFamilyId || pickFirstFamily(a.skillId),
    correct: Boolean(a.correct),
    timeTaken: Number(a.timeTaken || 0),
    confidence: a.confidence ?? 'unsure',
    workingUploaded: Boolean(a.workingUploaded),
    skipped: Boolean(a.skipped),
    studentAnswer: a.studentAnswer ?? null,
    correctAnswer: a.correctAnswer ?? null,
  }));
}

function groupByFamily(attempts = []) {
  const map = new Map();
  attempts.forEach((a) => {
    if (!a.questionFamilyId) return;
    if (!map.has(a.questionFamilyId)) map.set(a.questionFamilyId, []);
    map.get(a.questionFamilyId).push(a);
  });
  return map;
}

function deriveFluencyState(practiceAttempts = []) {
  const byFamily = groupByFamily(practiceAttempts);
  const familyResults = [];
  byFamily.forEach((attempts, familyId) => {
    const family = getQuestionFamily(familyId);
    if (!family) return;
    familyResults.push({
      ...calculateQuestionFamilyFluency(attempts, family),
      skillId: family.skillId,
      displayName: `${getSkill(family.skillId)?.name || family.skillId} — ${family.name}`,
    });
  });

  const skillIds = [...new Set(familyResults.map((r) => r.skillId))];
  const skillResults = skillIds.map((skillId) => calculateSkillFluency(skillId, familyResults));
  const domain = calculateDomainFluency('fractions', skillResults);

  return {
    questionFamilyResults: familyResults,
    skillResults,
    domain,
    fluentSkillIds: skillResults.filter((s) => ['fluent', 'automatic'].includes(s.status)).map((s) => s.skillId),
    accurateButSlowAreas: familyResults
      .filter((f) => f.status === 'accurateButSlow')
      .map((f) => f.displayName || f.questionFamilyId),
  };
}

function deriveRetentionState({ masteredSkillIds = [], fluentSkillIds = [], retentionReviews = [], asOfDate = new Date() }) {
  const retentionPlans = {};
  masteredSkillIds.forEach((skillId) => {
    retentionPlans[skillId] = {
      ...scheduleFractionRetentionReviews(skillId, asOfDate),
      questionFamilyIds: getQuestionFamiliesBySkill(skillId).slice(0, 2).map((f) => f.id),
    };
  });

  const reviewResults = (retentionReviews || []).map((r) => scoreFractionRetentionReview(r));
  const retainedSkillIds = reviewResults
    .filter((r) => r.retentionStatus === 'retained')
    .map((r, idx) => retentionReviews[idx]?.skillId)
    .filter(Boolean);
  const skillsNeedingRefresh = reviewResults
    .filter((r) => ['needsReview', 'forgotten'].includes(r.retentionStatus))
    .map((r, idx) => retentionReviews[idx]?.skillId)
    .filter(Boolean);

  const dueEntries = getDueFractionRetentionReviews({ retentionPlans }, asOfDate);
  const skillsDueForReview = [...new Set(dueEntries.map((d) => d.skillId))];

  return {
    retentionPlans,
    reviewResults,
    retainedSkillIds: [...new Set([...retainedSkillIds, ...fluentSkillIds.filter((id) => retainedSkillIds.includes(id))])],
    skillsDueForReview,
    skillsNeedingRefresh: [...new Set(skillsNeedingRefresh)],
  };
}

function deriveWorkingSummary(workingInput = {}) {
  const pending = createPendingWorkingAnalysis(workingInput);
  const summary = buildWorkingAnalysisSummary(pending);
  return { pendingResults: pending, summary };
}

function deriveMistakePlan({ studentId, practiceAttempts = [], currentSkillId = null, workingResults = [] }) {
  const mistakeResults = (practiceAttempts || [])
    .filter((a) => !a.correct)
    .map((a) => {
      const workingAnalysisResult = workingResults.find((w) => w.questionId === a.questionId) || {};
      return classifyFractionMistake({
        skillId: a.skillId,
        questionFamilyId: a.questionFamilyId,
        studentAnswer: a.studentAnswer,
        correctAnswer: a.correctAnswer,
        confidence: a.confidence,
        timeTaken: a.timeTaken,
        workingAnalysisResult,
        attemptHistory: [],
        assessmentMode: false,
      });
    });

  const plan = buildMistakeToMasteryPlan({
    studentId,
    mistakeResults,
    currentSkillId,
    attemptHistory: practiceAttempts,
    practiceQueue: [],
  });

  return { mistakeResults, mistakePlan: plan };
}

function deriveAssessment({
  studentId,
  singaporeLevel = 'P4',
  weakSkillIds = [],
  recentSkillIds = [],
  masteredSkillIds = [],
  assessmentInput = {},
}) {
  const session = buildFractionAssessmentSession({
    studentId,
    assessmentType: assessmentInput.assessmentType || 'progress',
    singaporeLevel,
    weakSkillIds,
    recentSkillIds,
    masteredSkillIds,
    paperType: assessmentInput.paperType || 'paper1',
    mode: assessmentInput.mode || 'core',
  });

  const responses = (assessmentInput.responses || []).map((r, idx) => ({
    questionId: r.questionId || `assessment_q_${idx + 1}`,
    skillId: r.skillId,
    questionFamilyId: r.questionFamilyId || pickFirstFamily(r.skillId),
    correct: Boolean(r.correct),
    marksAwarded: Number(r.marksAwarded || 0),
    totalMarks: Number(r.totalMarks || 1),
    timeTaken: Number(r.timeTaken || 0),
    confidence: r.confidence ?? 'unsure',
    workingUploaded: Boolean(r.workingUploaded),
    studentAnswer: r.studentAnswer ?? null,
    correctAnswer: r.correctAnswer ?? null,
    workingAnalysisResult: r.workingAnalysisResult || {},
  }));

  const scored = scoreFractionAssessmentSubmission({
    assessmentSessionId: session.assessmentSessionId,
    responses,
    retentionData: assessmentInput.retentionData || null,
  });
  const report = buildAssessmentReport(scored);

  return {
    session,
    scored,
    report,
    assessmentResults: [scored],
  };
}

/**
 * End-to-end MathPath domain pipeline orchestrator.
 * Stable versioned output for API consumers.
 */
export function runMathPathDomainPipeline(input = {}) {
  const orchestrationId = makeId('mathpath_orch');
  const generatedAt = nowIso();
  const domainId = input.domainId || 'fractions';
  const studentId = input.studentId;
  if (!studentId) throw new Error('studentId is required.');

  // 1) Diagnostic
  const diagnosticSession = buildFractionDiagnosticSession({
    studentLevel: input.studentLevel || 'P4',
    mode: input.diagnosticMode || 'core',
    previousMasteredSkillIds: input.previousMasteredSkillIds || [],
    previousWeakSkillIds: input.previousWeakSkillIds || [],
  });
  const diagnosticScored = scoreFractionDiagnosticAttempt({
    sessionId: diagnosticSession.sessionId,
    responses: input.diagnosticResponses || [],
  });

  // 2) Practice
  const practiceSession = buildFractionPracticeSession({
    studentId,
    diagnosticResult: diagnosticScored,
    masteredSkillIds: diagnosticScored.masteredSkillIds || [],
    weakSkillIds: diagnosticScored.weakSkillIds || [],
    currentSkillId: diagnosticScored.recommendedStartingSkillId || null,
    attemptHistory: input.practiceAttempts || [],
    sessionLength: input.practiceSessionLength || 8,
  });
  const normalizedPracticeAttempts = normalizePracticeAttempts(input.practiceAttempts || []);
  const practiceQueue = getFractionPracticeQueue({
    masteredSkillIds: diagnosticScored.masteredSkillIds || [],
    weakSkillIds: diagnosticScored.weakSkillIds || [],
    currentSkillId: practiceSession.targetSkillId,
    retentionDueSkillIds: [],
    familyHistory: {},
  });
  const practiceState = {
    masteredSkillIds: diagnosticScored.masteredSkillIds || [],
    weakSkillIds: diagnosticScored.weakSkillIds || [],
    currentSkillId: practiceSession.targetSkillId,
    practiceQueue,
    targetQuestionFamilyIds: practiceSession.targetQuestionFamilyIds,
    fluentSkillIds: [],
  };

  // 3) Fluency
  const fluencyState = deriveFluencyState(normalizedPracticeAttempts);
  practiceState.fluentSkillIds = fluencyState.fluentSkillIds;

  // 4) Working analysis
  const workingInput = input.workingSession || {
    workingSessionId: makeId('working_session'),
    studentId,
    domainId,
    questionWorkingMap: normalizedPracticeAttempts.map((a) => ({
      questionId: a.questionId,
      workingSubmissionId: a.workingUploaded ? makeId('submission') : null,
      mappingStatus: a.workingUploaded ? 'autoMapped' : 'missing',
      workingRequired: true,
      noWorkingRequiredChecked: false,
    })),
    questionMetadata: Object.fromEntries(
      normalizedPracticeAttempts.map((a) => [
        a.questionId,
        {
          skillId: a.skillId,
          questionFamilyId: a.questionFamilyId,
          answerCorrect: a.correct,
          timeTaken: a.timeTaken,
          workingQuality: input.defaultWorkingQuality || { legibilityScore: 70, organisationScore: 70, completenessScore: 70 },
        },
      ])
    ),
    submission: input.workingSubmission || null,
  };
  const workingBundle = deriveWorkingSummary(workingInput);

  // 5) Mistake-to-Mastery
  const mistakeBundle = deriveMistakePlan({
    studentId,
    practiceAttempts: normalizedPracticeAttempts,
    currentSkillId: practiceSession.targetSkillId,
    workingResults: workingBundle.pendingResults,
  });

  // 6) Retention
  const retentionState = deriveRetentionState({
    masteredSkillIds: diagnosticScored.masteredSkillIds || [],
    fluentSkillIds: fluencyState.fluentSkillIds || [],
    retentionReviews: input.retentionReviews || [],
    asOfDate: input.currentDate || new Date(),
  });

  // 7) Assessment
  const assessmentBundle = deriveAssessment({
    studentId,
    singaporeLevel: input.studentLevel || 'P4',
    weakSkillIds: diagnosticScored.weakSkillIds || [],
    recentSkillIds: normalizedPracticeAttempts.map((a) => a.skillId),
    masteredSkillIds: diagnosticScored.masteredSkillIds || [],
    assessmentInput: input.assessmentInput || {},
  });

  // 8) Student unified state + payload
  const studentState = buildStudentProgressState({
    studentId,
    diagnosticResult: diagnosticScored,
    practiceState,
    fluencyState,
    retentionState,
    assessmentResults: assessmentBundle.assessmentResults,
    mistakePlans: [mistakeBundle.mistakePlan],
    workingAnalysisSummary: workingBundle.summary,
  });
  const studentPayload = buildStudentDashboardPayload(studentState);

  // 9) Parent payload
  const parentPayload = buildParentMathPathSummary({
    studentId,
    domainId,
    diagnosticResult: diagnosticScored,
    practiceState,
    fluencyState,
    retentionState,
    assessmentResults: assessmentBundle.assessmentResults,
    mistakeToMasteryPlans: [mistakeBundle.mistakePlan],
    workingAnalysisSummary: workingBundle.summary,
  });

  return {
    apiVersion: ORCHESTRATOR_VERSION,
    orchestrationId,
    generatedAt,
    domainId,
    studentId,
    pipeline: {
      diagnostic: {
        session: diagnosticSession,
        result: diagnosticScored,
      },
      practice: {
        session: practiceSession,
        state: practiceState,
      },
      fluency: fluencyState,
      retention: retentionState,
      workingAnalysis: workingBundle,
      mistakes: mistakeBundle,
      assessment: assessmentBundle,
    },
    payloads: {
      studentState,
      studentDashboard: studentPayload,
      parentDashboard: parentPayload,
    },
  };
}

export function validateMathPathDomainOrchestrator() {
  const result = runMathPathDomainPipeline({
    studentId: 'orch_student_1',
    studentLevel: 'P5',
    diagnosticMode: 'core',
    diagnosticResponses: [
      { questionId: 'd1', skillId: 'F010', questionFamilyId: 'QF_F010_001', correct: false, timeTaken: 20, confidence: 'unsure', skipped: false },
      { questionId: 'd2', skillId: 'F011', questionFamilyId: 'QF_F011_001', correct: false, timeTaken: 20, confidence: 'unsure', skipped: false },
      { questionId: 'd3', skillId: 'F016', questionFamilyId: 'QF_F016_001', correct: true, timeTaken: 30, confidence: 'confident', skipped: false },
      { questionId: 'd4', skillId: 'F018', questionFamilyId: 'QF_F018_001', correct: false, timeTaken: 35, confidence: 'guessing', skipped: false },
    ],
    practiceAttempts: [
      {
        questionId: 'p1',
        skillId: 'F018',
        questionFamilyId: 'QF_F018_001',
        correct: false,
        timeTaken: 24,
        confidence: 'confident',
        workingUploaded: false,
        studentAnswer: '2/5',
        correctAnswer: '5/6',
      },
      {
        questionId: 'p2',
        skillId: 'F010',
        questionFamilyId: 'QF_F010_001',
        correct: true,
        timeTaken: 12,
        confidence: 'very confident',
        workingUploaded: true,
        studentAnswer: '2/4',
        correctAnswer: '2/4',
      },
    ],
    retentionReviews: [
      {
        skillId: 'F001',
        questionFamilyId: 'QF_F001_001',
        correct: true,
        timeTaken: 10,
        confidence: 'confident',
        previousFluencyLevel: 'gold',
      },
    ],
    assessmentInput: {
      assessmentType: 'progress',
      paperType: 'paper1',
      responses: [
        {
          questionId: 'a1',
          skillId: 'F010',
          questionFamilyId: 'QF_F010_001',
          correct: false,
          marksAwarded: 0,
          totalMarks: 2,
          timeTaken: 18,
          confidence: 'unsure',
          workingUploaded: true,
          studentAnswer: '1/3',
          correctAnswer: '1/2',
        },
        {
          questionId: 'a2',
          skillId: 'F016',
          questionFamilyId: 'QF_F016_001',
          correct: true,
          marksAwarded: 2,
          totalMarks: 2,
          timeTaken: 14,
          confidence: 'confident',
          workingUploaded: true,
          studentAnswer: '5/8',
          correctAnswer: '5/8',
        },
      ],
    },
  });

  const checks = {
    hasVersionedOutput: typeof result.apiVersion === 'string' && result.apiVersion.startsWith('mathpath-domain-orchestrator/'),
    includesAllPipelineStages: Boolean(
      result.pipeline.diagnostic &&
      result.pipeline.practice &&
      result.pipeline.fluency &&
      result.pipeline.retention &&
      result.pipeline.workingAnalysis &&
      result.pipeline.mistakes &&
      result.pipeline.assessment
    ),
    includesStudentPayload: Boolean(result.payloads.studentState && result.payloads.studentDashboard),
    includesParentPayload: Boolean(result.payloads.parentDashboard),
    stableTopLevelKeys: ['apiVersion', 'orchestrationId', 'generatedAt', 'domainId', 'studentId', 'pipeline', 'payloads']
      .every((k) => Object.prototype.hasOwnProperty.call(result, k)),
    nextActionPresent: Boolean(result.payloads.studentState?.nextRecommendedAction?.action),
  };

  return {
    isValid: Object.values(checks).every(Boolean),
    checks,
    sample: {
      apiVersion: result.apiVersion,
      orchestrationId: result.orchestrationId,
      nextAction: result.payloads.studentState.nextRecommendedAction,
      parentOverallStatus: result.payloads.parentDashboard.overallStatus,
      readiness: result.payloads.studentState.readinessLevel,
    },
  };
}

export const mathPathDomainOrchestrator = {
  runMathPathDomainPipeline,
  validateMathPathDomainOrchestrator,
  ORCHESTRATOR_VERSION,
};

export default mathPathDomainOrchestrator;
