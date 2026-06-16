import {
  buildFractionDiagnosticSession,
  scoreFractionDiagnosticAttempt,
} from '../fractions/fractionDiagnosticEngine.js';
import {
  buildFractionPracticeSession,
  getFractionPracticeQueue,
} from '../fractions/fractionPracticeEngine.js';
import {
  calculateDomainFluency,
  calculateSkillFluency,
  calculateQuestionFamilyFluency,
} from '../fractions/fractionFluencyEngine.js';
import {
  getDueFractionRetentionReviews,
} from '../fractions/fractionRetentionEngine.js';
import {
  buildMistakeToMasteryPlan,
} from '../fractions/fractionMistakeToMasteryEngine.js';
import {
  calculateFractionReadinessScore,
} from '../fractions/fractionAssessmentEngine.js';
import {
  buildStudentProgressState,
} from '../state/mathPathStudentProgressEngine.js';
import {
  buildParentMathPathSummary,
} from '../dashboard/parentMathPathDashboardEngine.js';
import { getQuestionFamily } from '../fractions/fractionQuestionFamilies.js';

const SCHEMA_VERSION = 'mathpath-domain-pipeline-v1';
const VALID_MODES = new Set(['diagnostic', 'practice', 'fluency', 'retention', 'assessment', 'full']);

function nowIso() {
  return new Date().toISOString();
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeObj(v) {
  return v && typeof v === 'object' ? v : {};
}

function dedupe(arr = []) {
  return [...new Set(arr)];
}

function getLatestAssessmentSummary(assessmentResults = []) {
  const latest = Array.isArray(assessmentResults) ? assessmentResults[assessmentResults.length - 1] : null;
  if (!latest) return null;
  const readiness = latest.readinessScore || calculateFractionReadinessScore({
    score: latest.percentage || 0,
    skillBreakdown: latest.skillBreakdown || {},
    fluencyBreakdown: latest.fluencyBreakdown || {},
    workingSummary: latest.workingSummary || {},
  });
  return {
    totalScore: latest.totalScore ?? null,
    percentage: latest.percentage ?? null,
    readiness,
    skillBreakdown: latest.skillBreakdown || {},
    questionFamilyBreakdown: latest.questionFamilyBreakdown || {},
    recommendedNextActions: latest.recommendedNextActions || [],
  };
}

function deriveFluencyState(attemptHistory = []) {
  const responses = Array.isArray(attemptHistory) ? attemptHistory : [];
  const byFamily = new Map();
  responses.forEach((r) => {
    if (!r.questionFamilyId) return;
    if (!byFamily.has(r.questionFamilyId)) byFamily.set(r.questionFamilyId, []);
    byFamily.get(r.questionFamilyId).push(r);
  });

  const questionFamilyResults = [];
  byFamily.forEach((items, familyId) => {
    const family = getQuestionFamily(familyId);
    if (!family) return;
    const scored = calculateQuestionFamilyFluency(items, family);
    questionFamilyResults.push({
      ...scored,
      skillId: family.skillId,
      questionFamilyId: familyId,
      displayName: family.name,
    });
  });

  const skillIds = [...new Set(questionFamilyResults.map((r) => r.skillId))];
  const skillResults = skillIds.map((skillId) => calculateSkillFluency(skillId, questionFamilyResults));
  const domain = calculateDomainFluency('fractions', skillResults);

  return {
    questionFamilyResults,
    skillResults,
    domain,
    fluentSkillIds: skillResults.filter((s) => ['fluent', 'automatic'].includes(s.status)).map((s) => s.skillId),
    accurateButSlowAreas: questionFamilyResults
      .filter((r) => r.status === 'accurateButSlow')
      .map((r) => r.displayName),
    automaticAreas: questionFamilyResults
      .filter((r) => r.status === 'automatic')
      .map((r) => r.displayName),
    fluentAreas: questionFamilyResults
      .filter((r) => r.status === 'fluent')
      .map((r) => r.displayName),
  };
}

// Canonical registry domains the pipeline accepts. Fractions has dedicated
// frontend engines; the other domains run the parent-dashboard ('full') path
// using provided/empty state + the domain-generic dashboard engine (which
// resolves a per-domain skill graph). The fractions-specific COMPUTE branches
// (diagnostic build, practice build, mistake fallback) are gated to fractions
// inside runMathPathDomainPipeline so foreign data never hits a fractions engine.
const SUPPORTED_DOMAINS = new Set([
  'fractions', 'decimals', 'percentage', 'ratio', 'circles', 'geometry', 'algebra',
  'volume', 'area_perimeter', 'statistics', 'speed', 'four_operations',
  'number_sense', 'money', 'time', 'measurement',
]);

export function getDomainEngines(domainId) {
  if (!SUPPORTED_DOMAINS.has(domainId)) return null;
  return {
    diagnostic: { buildFractionDiagnosticSession, scoreFractionDiagnosticAttempt },
    practice: { buildFractionPracticeSession, getFractionPracticeQueue },
    fluency: { calculateDomainFluency, calculateSkillFluency, calculateQuestionFamilyFluency },
    retention: { getDueFractionRetentionReviews },
    mistakes: { buildMistakeToMasteryPlan },
    assessment: { calculateFractionReadinessScore },
    state: { buildStudentProgressState },
    dashboard: { buildParentMathPathSummary },
  };
}

export function validatePipelineInput(options = {}) {
  const errors = [];
  const warnings = [];
  const mode = String(options.mode || 'full').toLowerCase();

  if (!options.studentId) errors.push({ code: 'INVALID_STUDENT_ID', message: 'studentId is required.' });
  if (!VALID_MODES.has(mode)) errors.push({ code: 'INVALID_MODE', message: `mode must be one of: ${[...VALID_MODES].join(', ')}` });
  if (!options.domainId) errors.push({ code: 'INVALID_DOMAIN', message: 'domainId is required.' });
  if (options.domainId && !getDomainEngines(options.domainId)) {
    errors.push({ code: 'UNSUPPORTED_DOMAIN', message: `Domain "${options.domainId}" is not supported.` });
  }

  if (mode === 'diagnostic' && !options.diagnosticResult && !(options.diagnosticResponses?.length)) {
    warnings.push('No diagnostic result/responses provided; diagnostic output may be partial.');
  }
  if (mode === 'practice' && !options.practiceState && !(options.attemptHistory?.length)) {
    warnings.push('No practice state/attempt history provided; practice queue may be generic.');
  }
  if (mode === 'assessment' && !(options.assessmentResults?.length)) {
    warnings.push('No assessment results provided; assessment summary will be partial.');
  }

  return { valid: errors.length === 0, errors, warnings, mode };
}

export function getPipelineWarnings(result = {}) {
  const warnings = [];
  const hasAssessment = !!(result.assessment && result.assessment.latest);
  const hasWorking = !!(result.working && result.working.summary && Object.keys(result.working.summary).length);
  const hasRetention = !!(result.retention && result.retention.state && Object.keys(result.retention.state).length);
  const hasDiagnostic =
    !!(result.diagnostic && result.diagnostic.summary &&
      ((result.diagnostic.summary.masteredSkillIds && result.diagnostic.summary.masteredSkillIds.length) ||
        (result.diagnostic.summary.weakSkillIds && result.diagnostic.summary.weakSkillIds.length) ||
        result.diagnostic.summary.recommendedStartingSkillId));
  const hasProgressSignal =
    !!(result.studentProgress &&
      result.studentProgress.studentId &&
      ((result.studentProgress.weakSkills && result.studentProgress.weakSkills.length) ||
        (result.studentProgress.masteryProgress && result.studentProgress.masteryProgress.percentageMastered > 0)));

  if (!hasAssessment) warnings.push('missing assessment data');
  if (!hasWorking) warnings.push('missing working analysis');
  if (!hasRetention) warnings.push('incomplete retention data');
  if (!hasDiagnostic) warnings.push('no diagnostic available');
  if (!hasProgressSignal) warnings.push('partial student progress state');
  return warnings;
}

export function getPipelineErrors(error) {
  const message = error?.message || 'Unknown pipeline error.';
  return [{
    code: 'PIPELINE_EXECUTION_ERROR',
    message,
    safe: true,
  }];
}

export function buildVersionedPipelinePayload(result = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: nowIso(),
    studentId: result.studentId || null,
    domainId: result.domainId || null,
    mode: result.mode || 'full',
    diagnostic: result.diagnostic || null,
    practice: result.practice || null,
    fluency: result.fluency || null,
    retention: result.retention || null,
    mistakes: result.mistakes || null,
    assessment: result.assessment || null,
    working: result.working || null,
    studentProgress: result.studentProgress || null,
    parentDashboard: result.parentDashboard || null,
    nextRecommendedAction: result.nextRecommendedAction || null,
    warnings: result.warnings || [],
    errors: result.errors || [],
  };
}

export function runMathPathDomainPipeline(options = {}) {
  const inputValidation = validatePipelineInput(options);
  if (!inputValidation.valid) {
    return buildVersionedPipelinePayload({
      studentId: options.studentId || null,
      domainId: options.domainId || null,
      mode: inputValidation.mode,
      warnings: inputValidation.warnings,
      errors: inputValidation.errors,
    });
  }

  try {
    const mode = inputValidation.mode;
    const studentId = options.studentId;
    const domainId = options.domainId;

    let diagnostic = null;
    let practice = null;
    let fluency = null;
    let retention = null;
    let mistakes = null;
    let assessment = null;
    let working = null;

    // Diagnostic stage
    if (mode === 'diagnostic' || mode === 'full' || mode === 'practice' || mode === 'fluency' || mode === 'retention' || mode === 'assessment') {
      if (options.diagnosticResult) {
        diagnostic = { summary: safeObj(options.diagnosticResult), source: 'provided' };
      } else if (domainId === 'fractions' && Array.isArray(options.diagnosticResponses) && options.diagnosticResponses.length) {
        const session = buildFractionDiagnosticSession({
          studentLevel: options.studentLevel || 'P4',
          mode: options.diagnosticMode || 'core',
          previousMasteredSkillIds: options.previousMasteredSkillIds || [],
          previousWeakSkillIds: options.previousWeakSkillIds || [],
        });
        const result = scoreFractionDiagnosticAttempt({
          sessionId: session.sessionId,
          responses: options.diagnosticResponses,
        });
        diagnostic = { session, summary: result, source: 'computed' };
      } else {
        diagnostic = { summary: {}, source: 'empty' };
      }
    }

    // Practice stage
    if (mode === 'practice' || mode === 'full' || mode === 'fluency' || mode === 'retention' || mode === 'assessment') {
      if (options.practiceState) {
        practice = { state: safeObj(options.practiceState), source: 'provided' };
      } else if (domainId === 'fractions') {
        const session = buildFractionPracticeSession({
          studentId,
          diagnosticResult: diagnostic?.summary || {},
          masteredSkillIds: options.masteredSkillIds || diagnostic?.summary?.masteredSkillIds || [],
          weakSkillIds: options.weakSkillIds || diagnostic?.summary?.weakSkillIds || [],
          currentSkillId: options.currentSkillId || diagnostic?.summary?.recommendedStartingSkillId || null,
          attemptHistory: options.attemptHistory || [],
          sessionLength: options.sessionLength || 8,
        });
        const queue = getFractionPracticeQueue({
          masteredSkillIds: session?.masteredSkillIds || options.masteredSkillIds || [],
          weakSkillIds: options.weakSkillIds || diagnostic?.summary?.weakSkillIds || [],
          currentSkillId: session.targetSkillId,
          retentionDueSkillIds: options.retentionState?.skillsDueForReview || [],
          familyHistory: options.practiceState?.familyHistory || {},
        });
        practice = {
          session,
          state: {
            masteredSkillIds: options.masteredSkillIds || diagnostic?.summary?.masteredSkillIds || [],
            weakSkillIds: options.weakSkillIds || diagnostic?.summary?.weakSkillIds || [],
            currentSkillId: session.targetSkillId,
            practiceQueue: queue,
          },
          source: 'computed',
        };
      }
    }

    // Fluency stage
    if (mode === 'fluency' || mode === 'full' || mode === 'retention' || mode === 'assessment') {
      if (options.fluencyState) {
        fluency = { state: safeObj(options.fluencyState), source: 'provided' };
      } else {
        const derived = deriveFluencyState(options.attemptHistory || []);
        fluency = { state: derived, source: 'computed' };
      }
    }

    // Retention stage
    if (mode === 'retention' || mode === 'full' || mode === 'assessment') {
      const retentionState = options.retentionState || {};
      const due = getDueFractionRetentionReviews(
        {
          retentionPlans: retentionState.retentionPlans || {},
        },
        options.currentDate || new Date()
      );
      retention = {
        state: {
          ...retentionState,
          skillsDueForReview: retentionState.skillsDueForReview || dedupe(due.map((d) => d.skillId)),
        },
        dueReviews: due,
        source: options.retentionState ? 'provided+computed' : 'computed',
      };
    }

    // Mistake stage
    if (mode === 'full' || mode === 'assessment' || mode === 'practice') {
      const plans = options.mistakePlans || [];
      if (plans.length) {
        mistakes = { plans, source: 'provided' };
      } else if (domainId === 'fractions') {
        const fallback = buildMistakeToMasteryPlan({
          studentId,
          mistakeResults: [],
          currentSkillId: practice?.state?.currentSkillId || diagnostic?.summary?.recommendedStartingSkillId || 'F001',
          attemptHistory: options.attemptHistory || [],
          practiceQueue: practice?.state?.practiceQueue || [],
        });
        mistakes = { plans: [fallback], source: 'computed' };
      }
    }

    // Assessment stage
    if (mode === 'assessment' || mode === 'full') {
      const latest = getLatestAssessmentSummary(options.assessmentResults || []);
      assessment = {
        latest,
        source: options.assessmentResults?.length ? 'provided' : 'empty',
      };
    }

    // Working stage
    if (mode === 'full' || mode === 'practice' || mode === 'assessment') {
      working = {
        summary: options.workingAnalysisSummary || {},
        source: options.workingAnalysisSummary ? 'provided' : 'empty',
      };
    }

    const progressInput = {
      studentId,
      diagnosticResult: diagnostic?.summary || options.diagnosticResult || {},
      practiceState: practice?.state || options.practiceState || {},
      fluencyState: fluency?.state || options.fluencyState || {},
      retentionState: retention?.state || options.retentionState || {},
      assessmentResults: options.assessmentResults || [],
      mistakePlans: mistakes?.plans || options.mistakePlans || [],
      workingAnalysisSummary: working?.summary || options.workingAnalysisSummary || {},
    };

    const studentProgress = buildStudentProgressState(progressInput);
    const parentDashboard = buildParentMathPathSummary({
      ...progressInput,
      domainId,
    });

    const partial = {
      studentId,
      domainId,
      mode,
      diagnostic,
      practice,
      fluency,
      retention,
      mistakes,
      assessment,
      working,
      studentProgress,
      parentDashboard,
      nextRecommendedAction: studentProgress.nextRecommendedAction || null,
    };
    partial.warnings = [...inputValidation.warnings, ...getPipelineWarnings(partial)];
    partial.errors = [];

    return buildVersionedPipelinePayload(partial);
  } catch (error) {
    return buildVersionedPipelinePayload({
      studentId: options.studentId || null,
      domainId: options.domainId || null,
      mode: String(options.mode || 'full').toLowerCase(),
      warnings: [],
      errors: getPipelineErrors(error),
    });
  }
}

export function validateMathPathDomainOrchestrator() {
  const unsupported = runMathPathDomainPipeline({
    studentId: 's1',
    domainId: 'not_a_real_domain',
    mode: 'full',
  });
  const invalidMode = runMathPathDomainPipeline({
    studentId: 's1',
    domainId: 'fractions',
    mode: 'xyz',
  });
  const full = runMathPathDomainPipeline({
    studentId: 's2',
    domainId: 'fractions',
    mode: 'full',
    studentLevel: 'P5',
    diagnosticResult: {
      masteredSkillIds: ['F001', 'F002'],
      weakSkillIds: ['F010'],
      recommendedStartingSkillId: 'F010',
    },
    practiceState: {
      masteredSkillIds: ['F001', 'F002'],
      weakSkillIds: ['F010'],
      currentSkillId: 'F010',
    },
    attemptHistory: [
      { questionId: 'p1', skillId: 'F010', questionFamilyId: 'QF_F010_001', correct: true, timeTaken: 20, confidence: 'confident' },
      { questionId: 'p2', skillId: 'F018', questionFamilyId: 'QF_F018_001', correct: false, timeTaken: 30, confidence: 'unsure' },
    ],
    retentionState: {
      skillsDueForReview: ['F003'],
      retainedSkillIds: ['F001'],
    },
    assessmentResults: [
      {
        percentage: 62,
        readinessScore: { readinessScore: 64, readinessBand: 'approaching' },
        skillBreakdown: { F010: { percentage: 55 }, F018: { percentage: 48 } },
        fluencyBreakdown: {},
        workingSummary: {},
      },
    ],
    workingAnalysisSummary: {
      missingWorkingCount: 1,
      averageWorkingQuality: 61,
    },
    mistakePlans: [
      {
        focusMistakes: [{ mistakeCode: 'M001', count: 2, highestSeverity: 'high' }],
        rootCauseSkillIds: ['F010'],
        remediationQueue: [{ skillId: 'F010' }],
      },
    ],
  });

  const partial = runMathPathDomainPipeline({
    studentId: 's3',
    domainId: 'fractions',
    mode: 'full',
  });

  const checks = {
    unsupportedDomainSafeError:
      Array.isArray(unsupported.errors) && unsupported.errors.some((e) => e.code === 'UNSUPPORTED_DOMAIN'),
    invalidModeSafeError:
      Array.isArray(invalidMode.errors) && invalidMode.errors.some((e) => e.code === 'INVALID_MODE'),
    fullHasSchemaVersion: full.schemaVersion === SCHEMA_VERSION,
    partialMissingDataWarning: Array.isArray(partial.warnings) && partial.warnings.length > 0,
    fractionsDomainLoadsEngines: !!getDomainEngines('fractions'),
    studentProgressIncluded: !!full.studentProgress?.studentId,
    parentDashboardIncluded: !!full.parentDashboard?.overallStatus,
    nextActionIncluded: !!full.nextRecommendedAction?.action,
    stableOutputShape: [
      'schemaVersion',
      'generatedAt',
      'studentId',
      'domainId',
      'mode',
      'diagnostic',
      'practice',
      'fluency',
      'retention',
      'mistakes',
      'assessment',
      'working',
      'studentProgress',
      'parentDashboard',
      'nextRecommendedAction',
      'warnings',
      'errors',
    ].every((k) => Object.prototype.hasOwnProperty.call(full, k)),
  };

  return {
    isValid: Object.values(checks).every(Boolean),
    checks,
    sample: {
      full,
      unsupported,
      invalidMode,
      partial,
    },
  };
}

export const mathPathDomainOrchestrator = {
  runMathPathDomainPipeline,
  getDomainEngines,
  validatePipelineInput,
  buildVersionedPipelinePayload,
  getPipelineWarnings,
  getPipelineErrors,
  validateMathPathDomainOrchestrator,
};

export default mathPathDomainOrchestrator;
