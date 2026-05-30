const ANALYSIS_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  COMPLETE: 'complete',
  NEEDS_MANUAL_REVIEW: 'needsManualReview',
};

const QUALITY_BANDS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  NEEDS_IMPROVEMENT: 'needsImprovement',
  UNREADABLE: 'unreadable',
};

const GUIDANCE_LIBRARY = [
  'Write each step clearly on a new line.',
  'Label the question number before starting your working.',
  'Make sure fractions are written with clear numerator and denominator.',
  'Avoid squeezing too many steps into one line.',
];

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function qualityBandFromScore(score) {
  if (score >= 85) return QUALITY_BANDS.EXCELLENT;
  if (score >= 65) return QUALITY_BANDS.GOOD;
  if (score >= 40) return QUALITY_BANDS.NEEDS_IMPROVEMENT;
  return QUALITY_BANDS.UNREADABLE;
}

export function scoreWorkingQuality(input = {}) {
  const legibilityScore = clamp(toNumber(input.legibilityScore, 0));
  const organisationScore = clamp(toNumber(input.organisationScore, 0));
  const completenessScore = clamp(toNumber(input.completenessScore, 0));
  const finalScore = Math.round((legibilityScore * 0.4 + organisationScore * 0.3 + completenessScore * 0.3) * 10) / 10;
  const band = qualityBandFromScore(finalScore);
  return {
    legibilityScore,
    organisationScore,
    completenessScore,
    finalScore,
    band,
  };
}

export function detectMissingWorking(questionWorkingMap = []) {
  return (questionWorkingMap || [])
    .filter(
      (item) =>
        item.workingRequired === true &&
        item.noWorkingRequiredChecked !== true &&
        (!item.workingSubmissionId || item.mappingStatus === 'missing')
    )
    .map((item) => item.questionId);
}

export function generateCalculatorIntegrityFlags(options = {}) {
  const {
    workingRequired = false,
    workingPresent = false,
    timeTaken = null,
    answerCorrect = false,
    workingQualityBand = QUALITY_BANDS.GOOD,
  } = options;

  const flags = [];

  if (workingRequired && !workingPresent) {
    flags.push({
      flagType: 'missingWorking',
      severity: 'medium',
      reason: 'Working was expected but not provided for review.',
    });
  }

  if (workingRequired && answerCorrect && !workingPresent) {
    flags.push({
      flagType: 'answerWithoutMethod',
      severity: 'medium',
      reason: 'Answer is correct but method is not visible.',
    });
  }

  if (workingRequired && !workingPresent && toNumber(timeTaken, 999) <= 8) {
    flags.push({
      flagType: 'suspiciousSpeed',
      severity: 'low',
      reason: 'Answer was produced very quickly without visible working.',
    });
  }

  if (workingQualityBand === QUALITY_BANDS.UNREADABLE) {
    flags.push({
      flagType: 'unreadableWorking',
      severity: 'medium',
      reason: 'Working is difficult to read and needs clearer presentation.',
    });
  }

  if (workingRequired && workingPresent && [QUALITY_BANDS.NEEDS_IMPROVEMENT, QUALITY_BANDS.UNREADABLE].includes(workingQualityBand)) {
    flags.push({
      flagType: 'insufficientSteps',
      severity: 'low',
      reason: 'Working may be incomplete for full method verification.',
    });
  }

  return flags;
}

function defaultPlaceholderMistake() {
  return {
    mistakeCode: 'M001',
    confidence: 0.4,
    evidence: 'Placeholder only. Full analysis requires OCR/AI.',
  };
}

function determineRecommendedAction({ analysisStatus, flags, workingQualityBand }) {
  if (analysisStatus === ANALYSIS_STATUS.NEEDS_MANUAL_REVIEW) return 'manualReview';
  if (flags.some((f) => f.flagType === 'missingWorking')) return 'requestWorkingUpload';
  if (flags.some((f) => f.flagType === 'unreadableWorking')) return 'improveWorkingClarity';
  if (workingQualityBand === QUALITY_BANDS.NEEDS_IMPROVEMENT) return 'improveWorkingHabits';
  return 'continuePractice';
}

export function createPendingWorkingAnalysis(workingSession = {}) {
  const {
    workingSessionId,
    studentId,
    domainId = 'fractions',
    questionWorkingMap = [],
    questionMetadata = {},
    submission = null,
  } = workingSession;

  if (!workingSessionId || !studentId) {
    throw new Error('workingSessionId and studentId are required.');
  }

  return (questionWorkingMap || []).map((mapItem) => {
    const meta = questionMetadata[mapItem.questionId] || {};
    const workingPresent = Boolean(mapItem.workingSubmissionId) || mapItem.noWorkingRequiredChecked === true;
    const quality = scoreWorkingQuality(meta.workingQuality || {});
    const flags = generateCalculatorIntegrityFlags({
      workingRequired: mapItem.workingRequired,
      workingPresent,
      timeTaken: meta.timeTaken,
      answerCorrect: Boolean(meta.answerCorrect),
      workingQualityBand: quality.band,
    });

    let analysisStatus = ANALYSIS_STATUS.PENDING;
    if (!mapItem.workingRequired || mapItem.noWorkingRequiredChecked === true) analysisStatus = ANALYSIS_STATUS.COMPLETE;
    else if (!workingPresent) analysisStatus = ANALYSIS_STATUS.PARTIAL;
    else if (quality.band === QUALITY_BANDS.UNREADABLE) analysisStatus = ANALYSIS_STATUS.NEEDS_MANUAL_REVIEW;
    else analysisStatus = ANALYSIS_STATUS.COMPLETE;

    const detectedSteps = workingPresent ? (meta.detectedSteps || []) : [];
    const missingSteps = workingPresent ? (meta.missingSteps || []) : ['Step extraction pending OCR/AI'];

    return {
      workingAnalysisId: makeId('workinganalysis'),
      workingSessionId,
      studentId,
      domainId,
      questionId: mapItem.questionId,
      skillId: meta.skillId || null,
      questionFamilyId: meta.questionFamilyId || null,
      analysisStatus,
      workingPresent,
      workingQualityScore: quality.finalScore,
      workingQualityBand: quality.band,
      detectedSteps,
      missingSteps,
      suspectedMistakes: [defaultPlaceholderMistake()],
      calculatorIntegrityFlags: flags,
      recommendedAction: determineRecommendedAction({
        analysisStatus,
        flags,
        workingQualityBand: quality.band,
      }),
      confidenceScore: mapItem.workingRequired ? 0.5 : 0.8,
      createdAt: nowIso(),
      guidance: GUIDANCE_LIBRARY,
      sourceSubmission: submission
        ? {
            inputMethod: submission.inputMethod,
            fileUrls: submission.fileUrls || [],
            digitalInkData: submission.digitalInkData || null,
          }
        : null,
    };
  });
}

export function buildWorkingAnalysisSummary(results = []) {
  const list = Array.isArray(results) ? results : [];
  const totalQuestionsAnalysed = list.length;
  const workingPresentCount = list.filter((r) => r.workingPresent).length;
  const missingWorkingCount = list.filter((r) => !r.workingPresent).length;
  const averageWorkingQuality =
    list.length > 0
      ? Math.round(
          (list.reduce((sum, r) => sum + toNumber(r.workingQualityScore, 0), 0) / list.length) * 10
        ) / 10
      : 0;
  const questionsNeedingManualReview = list
    .filter((r) => r.analysisStatus === ANALYSIS_STATUS.NEEDS_MANUAL_REVIEW)
    .map((r) => r.questionId);
  const calculatorIntegrityFlags = list.flatMap((r) => r.calculatorIntegrityFlags || []);

  const parentFriendlySummary =
    missingWorkingCount > 0
      ? 'Some required workings were missing. Please encourage clear step-by-step working so teachers can support progress.'
      : 'Working was generally submitted. Continue encouraging clear and organised steps to strengthen mathematical communication.';

  const tutorFriendlySummary =
    questionsNeedingManualReview.length > 0
      ? `Manual review recommended for ${questionsNeedingManualReview.length} question(s) due to unclear or incomplete working.`
      : 'Working quality is generally analyzable. Continue targeted method feedback.';

  return {
    totalQuestionsAnalysed,
    workingPresentCount,
    missingWorkingCount,
    averageWorkingQuality,
    questionsNeedingManualReview,
    calculatorIntegrityFlags,
    parentFriendlySummary,
    tutorFriendlySummary,
  };
}

export function prepareForFutureAIAnalysis(workingAnalysisResult = {}) {
  return {
    questionId: workingAnalysisResult.questionId || null,
    skillId: workingAnalysisResult.skillId || null,
    questionFamilyId: workingAnalysisResult.questionFamilyId || null,
    imageUrls: workingAnalysisResult.sourceSubmission?.fileUrls || [],
    digitalInkData: workingAnalysisResult.sourceSubmission?.digitalInkData || null,
    expectedWorkingRequired: Boolean(
      workingAnalysisResult.workingPresent === false ||
      workingAnalysisResult.calculatorIntegrityFlags?.some((f) => f.flagType === 'missingWorking')
    ),
    finalAnswer: workingAnalysisResult.finalAnswer || null,
    correctAnswer: workingAnalysisResult.correctAnswer || null,
    studentAnswer: workingAnalysisResult.studentAnswer || null,
  };
}

export function validateWorkingAnalysisFramework() {
  const workingSession = {
    workingSessionId: 'ws_001',
    studentId: 'student_1',
    questionWorkingMap: [
      {
        questionId: 'Q1',
        workingSubmissionId: 'sub_1',
        mappingStatus: 'autoMapped',
        workingRequired: true,
        noWorkingRequiredChecked: false,
      },
      {
        questionId: 'Q2',
        workingSubmissionId: null,
        mappingStatus: 'missing',
        workingRequired: true,
        noWorkingRequiredChecked: false,
      },
      {
        questionId: 'Q3',
        workingSubmissionId: null,
        mappingStatus: 'manuallyMapped',
        workingRequired: false,
        noWorkingRequiredChecked: true,
      },
    ],
    questionMetadata: {
      Q1: {
        skillId: 'F010',
        questionFamilyId: 'QF_F010_001',
        answerCorrect: true,
        timeTaken: 9,
        workingQuality: { legibilityScore: 90, organisationScore: 88, completenessScore: 86 },
      },
      Q2: {
        skillId: 'F018',
        questionFamilyId: 'QF_F018_001',
        answerCorrect: true,
        timeTaken: 6,
        workingQuality: { legibilityScore: 20, organisationScore: 25, completenessScore: 20 },
      },
      Q3: {
        skillId: 'F001',
        questionFamilyId: 'QF_F001_001',
        answerCorrect: true,
        timeTaken: 5,
        workingQuality: { legibilityScore: 80, organisationScore: 78, completenessScore: 82 },
      },
    },
    submission: {
      inputMethod: 'paper',
      fileUrls: ['https://example.com/working.jpg'],
      digitalInkData: null,
    },
  };

  const pending = createPendingWorkingAnalysis(workingSession);
  const missing = detectMissingWorking(workingSession.questionWorkingMap);
  const qExcellent = scoreWorkingQuality({ legibilityScore: 90, organisationScore: 90, completenessScore: 90 });
  const qUnreadable = scoreWorkingQuality({ legibilityScore: 10, organisationScore: 15, completenessScore: 20 });
  const flags = generateCalculatorIntegrityFlags({
    workingRequired: true,
    workingPresent: false,
    timeTaken: 5,
    answerCorrect: true,
    workingQualityBand: QUALITY_BANDS.UNREADABLE,
  });
  const summary = buildWorkingAnalysisSummary(pending);
  const aiPayload = prepareForFutureAIAnalysis(pending[0]);

  return {
    isValid:
      pending.length === 3 &&
      missing.includes('Q2') &&
      qExcellent.band === QUALITY_BANDS.EXCELLENT &&
      qUnreadable.band === QUALITY_BANDS.UNREADABLE &&
      flags.every((f) => !/cheat|dishonest|fraud/i.test(f.reason)) &&
      pending.some((r) => r.analysisStatus === ANALYSIS_STATUS.NEEDS_MANUAL_REVIEW || r.workingQualityBand === QUALITY_BANDS.UNREADABLE) &&
      typeof summary.parentFriendlySummary === 'string' &&
      typeof summary.tutorFriendlySummary === 'string' &&
      aiPayload.questionId !== undefined &&
      aiPayload.skillId !== undefined &&
      aiPayload.questionFamilyId !== undefined &&
      aiPayload.imageUrls !== undefined &&
      aiPayload.digitalInkData !== undefined &&
      aiPayload.expectedWorkingRequired !== undefined &&
      aiPayload.finalAnswer !== undefined &&
      aiPayload.correctAnswer !== undefined &&
      aiPayload.studentAnswer !== undefined,
    checks: {
      pendingCreated: pending.length === 3,
      missingWorkingDetected: missing.includes('Q2'),
      qualityBandCalculated: qExcellent.band === QUALITY_BANDS.EXCELLENT && qUnreadable.band === QUALITY_BANDS.UNREADABLE,
      flagsNonAccusatory: flags.every((f) => !/cheat|dishonest|fraud/i.test(f.reason)),
      unreadableFlaggedForReview: pending.some((r) => r.analysisStatus === ANALYSIS_STATUS.NEEDS_MANUAL_REVIEW || r.workingQualityBand === QUALITY_BANDS.UNREADABLE),
      summariesIncluded: Boolean(summary.parentFriendlySummary && summary.tutorFriendlySummary),
      aiPayloadFieldsPresent:
        aiPayload.questionId !== undefined &&
        aiPayload.skillId !== undefined &&
        aiPayload.questionFamilyId !== undefined &&
        aiPayload.imageUrls !== undefined &&
        aiPayload.digitalInkData !== undefined &&
        aiPayload.expectedWorkingRequired !== undefined &&
        aiPayload.finalAnswer !== undefined &&
        aiPayload.correctAnswer !== undefined &&
        aiPayload.studentAnswer !== undefined,
    },
    sample: {
      pending: pending[0],
      summary,
      aiPayload,
    },
  };
}

export const workingAnalysisFramework = {
  ANALYSIS_STATUS,
  QUALITY_BANDS,
  createPendingWorkingAnalysis,
  scoreWorkingQuality,
  detectMissingWorking,
  generateCalculatorIntegrityFlags,
  buildWorkingAnalysisSummary,
  prepareForFutureAIAnalysis,
  validateWorkingAnalysisFramework,
};

export default workingAnalysisFramework;
