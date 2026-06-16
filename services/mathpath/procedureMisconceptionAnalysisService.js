export const PROCEDURE_STATUSES = {
  CORRECT: 'correct_procedure',
  PARTIALLY_CORRECT: 'partially_correct_procedure',
  INCORRECT: 'incorrect_procedure',
  INCOMPLETE: 'incomplete_procedure',
  SKIPPED: 'skipped_procedure',
};

export const FAILURE_TYPES = {
  FIRST_INCORRECT_STEP: 'first_incorrect_step',
  LAST_CORRECT_STEP: 'last_correct_step',
  MISSING_STEP: 'missing_step',
  ABANDONED_STEP: 'abandoned_step',
  FINAL_ANSWER_ONLY: 'final_answer_only_mistake',
  NONE_DETECTED: 'none_detected',
};

export const MISCONCEPTION_LIBRARY_V1 = [
  {
    misconceptionId: 'FRAC_DENOM_LARGER_VALUE',
    domain: 'fractions',
    description: 'Larger denominator means larger fraction.',
    detectionRules: ['compares denominators directly', 'chooses fraction with larger denominator when numerators match'],
    confidenceThreshold: 0.62,
    recommendedIntervention: 'denominator_misconception',
  },
  {
    misconceptionId: 'FRAC_NUMERATOR_ONLY_COMPARISON',
    domain: 'fractions',
    description: 'Numerator-only comparison.',
    detectionRules: ['compares numerators without common whole or denominator reasoning'],
    confidenceThreshold: 0.6,
    recommendedIntervention: 'fractions_remediation_pack',
  },
  {
    misconceptionId: 'FRAC_DENOMINATOR_ONLY_COMPARISON',
    domain: 'fractions',
    description: 'Denominator-only comparison.',
    detectionRules: ['ignores numerator while comparing denominators'],
    confidenceThreshold: 0.6,
    recommendedIntervention: 'denominator_misconception',
  },
  {
    misconceptionId: 'FRAC_COMMON_DENOMINATOR_SETUP_ERROR',
    domain: 'fractions',
    description: 'Common denominator setup error.',
    detectionRules: ['adds denominators', 'uses unrelated common denominator', 'changes numerator without matching denominator change'],
    confidenceThreshold: 0.64,
    recommendedIntervention: 'fractions_remediation_pack',
  },
  {
    misconceptionId: 'DEC_LONGER_IS_LARGER',
    domain: 'decimals',
    description: 'Longer decimal means larger value.',
    detectionRules: ['chooses decimal with more digits after decimal point'],
    confidenceThreshold: 0.6,
    recommendedIntervention: 'place_value_review',
  },
  {
    misconceptionId: 'DEC_PLACE_VALUE_CONFUSION',
    domain: 'decimals',
    description: 'Place value confusion.',
    detectionRules: ['misreads tenths/hundredths/thousandths'],
    confidenceThreshold: 0.6,
    recommendedIntervention: 'decimal_place_value_pack',
  },
  {
    misconceptionId: 'PCT_FRACTION_CONFUSION',
    domain: 'percentage',
    description: 'Percent-fraction confusion.',
    detectionRules: ['treats percent number as numerator without denominator 100'],
    confidenceThreshold: 0.58,
    recommendedIntervention: 'percentage_conversion_pack',
  },
  {
    misconceptionId: 'PCT_DECIMAL_CONFUSION',
    domain: 'percentage',
    description: 'Percent-decimal confusion.',
    detectionRules: ['moves decimal point incorrectly when converting percent'],
    confidenceThreshold: 0.58,
    recommendedIntervention: 'percentage_conversion_pack',
  },
  {
    misconceptionId: 'RATIO_PART_PART_PART_WHOLE',
    domain: 'ratio',
    description: 'Part-part vs part-whole confusion.',
    detectionRules: ['uses total as one ratio part', 'treats part-part ratio as fraction of whole'],
    confidenceThreshold: 0.62,
    recommendedIntervention: 'ratio_model_pack',
  },
  {
    misconceptionId: 'WHOLE_OPERATION_SELECTION',
    domain: 'whole_numbers',
    description: 'Operation selection error.',
    detectionRules: ['uses wrong operation for context'],
    confidenceThreshold: 0.58,
    recommendedIntervention: 'word_problem_pack',
  },
  {
    misconceptionId: 'WHOLE_PLACE_VALUE_MISUNDERSTANDING',
    domain: 'whole_numbers',
    description: 'Place value misunderstanding.',
    detectionRules: ['misaligns digits', 'regroups from wrong place'],
    confidenceThreshold: 0.6,
    recommendedIntervention: 'place_value_review',
  },
];

const HEURISTICS = [
  { id: 'model_method', patterns: [/bar model|model|draw|diagram|part|whole|remainder/i] },
  { id: 'guess_and_check', patterns: [/guess|check|try|test/i] },
  { id: 'working_backwards', patterns: [/work(?:ing)? backwards|reverse|from the answer/i] },
  { id: 'assumption', patterns: [/assume|suppose|let .* be/i] },
  { id: 'pattern_recognition', patterns: [/pattern|sequence|repeat|rule/i] },
];

function toText(value = '') {
  return String(value || '').trim();
}

function clamp(value, min = 0, max = 100) {
  const n = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
}

function confidence(score, evidence = []) {
  return {
    score: Math.max(0, Math.min(1, Number(score) || 0)),
    evidence,
  };
}

function stepText(record = {}) {
  const steps = Array.isArray(record.detectedSteps) ? record.detectedSteps : [];
  return steps.map((step) => toText(step.text)).filter(Boolean);
}

function allWorkingText(record = {}) {
  return [
    record.ocrOutput?.rawText,
    ...stepText(record),
    record.datasetRecord?.question,
  ].filter(Boolean).join('\n');
}

function normalizeAnswer(value = '') {
  return toText(value).toLowerCase().replace(/\s+/g, ' ');
}

function fractionParts(value = '') {
  const match = toText(value).match(/(\d+)\s*\/\s*(\d+)/);
  return match ? { numerator: Number(match[1]), denominator: Number(match[2]) } : null;
}

function evidenceItem(type, detail, stepNumber = null) {
  return { type, detail, stepNumber };
}

export function analyzeProcedure(record = {}, questionMetadata = {}) {
  const steps = Array.isArray(record.detectedSteps) ? record.detectedSteps : [];
  const text = allWorkingText(record);
  const evidence = [];
  const hasWorking = steps.length > 0 || Boolean(record.ocrOutput?.rawText);
  const expectedKeywords = Array.isArray(questionMetadata.expectedProcedureKeywords)
    ? questionMetadata.expectedProcedureKeywords
    : [];
  const expectedOperations = Array.isArray(questionMetadata.expectedOperations)
    ? questionMetadata.expectedOperations
    : [];

  if (!hasWorking) {
    return {
      procedureStatus: PROCEDURE_STATUSES.SKIPPED,
      procedureConfidence: confidence(0.74, [evidenceItem('missing_working', 'No working steps were detected.')]),
      evidenceUsed: [],
    };
  }

  const matchedKeywords = expectedKeywords.filter((keyword) => new RegExp(keyword, 'i').test(text));
  const matchedOperations = expectedOperations.filter((operation) => new RegExp(operation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(text));
  if (matchedKeywords.length) evidence.push(evidenceItem('expected_keyword', matchedKeywords.join(', ')));
  if (matchedOperations.length) evidence.push(evidenceItem('expected_operation', matchedOperations.join(', ')));
  if (/=/.test(text)) evidence.push(evidenceItem('equation_present', 'An equation or equality was detected.'));
  if (/model|bar|diagram|draw/i.test(text)) evidence.push(evidenceItem('representation_present', 'A representation or model was mentioned.'));

  const score = Math.min(100, steps.length * 18 + matchedKeywords.length * 16 + matchedOperations.length * 18 + (/=/.test(text) ? 12 : 0));
  const finalAnswer = normalizeAnswer(questionMetadata.studentAnswer || record.datasetRecord?.outcome?.studentAnswer || '');
  const correctAnswer = normalizeAnswer(questionMetadata.correctAnswer || record.datasetRecord?.outcome?.correctAnswer || '');
  const answerCorrect = Boolean(correctAnswer && finalAnswer && finalAnswer === correctAnswer) || questionMetadata.answerCorrect === true;

  let procedureStatus = PROCEDURE_STATUSES.INCOMPLETE;
  if (score >= 70 && answerCorrect) procedureStatus = PROCEDURE_STATUSES.CORRECT;
  else if (score >= 55) procedureStatus = PROCEDURE_STATUSES.PARTIALLY_CORRECT;
  else if (score >= 25) procedureStatus = PROCEDURE_STATUSES.INCOMPLETE;
  if (questionMetadata.answerCorrect === false && score < 35) procedureStatus = PROCEDURE_STATUSES.INCORRECT;

  return {
    procedureStatus,
    procedureConfidence: confidence(Math.min(0.88, 0.35 + score / 140), evidence),
    evidenceUsed: evidence,
  };
}

export function identifyFailurePoint(record = {}, procedureAnalysis = {}, questionMetadata = {}) {
  const steps = Array.isArray(record.detectedSteps) ? record.detectedSteps : [];
  const expectedStepCount = Number(questionMetadata.expectedStepCount || 0);
  const textRows = stepText(record);
  const answerCorrect = questionMetadata.answerCorrect === true;
  const finalAnswer = normalizeAnswer(questionMetadata.studentAnswer || '');
  const correctAnswer = normalizeAnswer(questionMetadata.correctAnswer || '');

  if (!steps.length) {
    return {
      failureLocation: null,
      failureType: FAILURE_TYPES.MISSING_STEP,
      confidence: confidence(0.72, [evidenceItem('missing_steps', 'No detected steps to analyse.')]),
    };
  }

  const explicitWrongIndex = textRows.findIndex((line) => /wrong|error|mistake|incorrect|cannot|stuck/i.test(line));
  if (explicitWrongIndex >= 0) {
    return {
      failureLocation: { stepNumber: explicitWrongIndex + 1 },
      failureType: FAILURE_TYPES.FIRST_INCORRECT_STEP,
      confidence: confidence(0.68, [evidenceItem('step_marker', 'Step text contains an error/stuck marker.', explicitWrongIndex + 1)]),
    };
  }

  if (expectedStepCount && steps.length < expectedStepCount) {
    return {
      failureLocation: { stepNumber: steps.length + 1 },
      failureType: steps.length <= Math.floor(expectedStepCount / 2) ? FAILURE_TYPES.ABANDONED_STEP : FAILURE_TYPES.MISSING_STEP,
      confidence: confidence(0.62, [evidenceItem('short_solution', `Expected around ${expectedStepCount} steps, detected ${steps.length}.`)]),
    };
  }

  if (!answerCorrect && finalAnswer && correctAnswer && procedureAnalysis.procedureStatus === PROCEDURE_STATUSES.PARTIALLY_CORRECT) {
    return {
      failureLocation: { stepNumber: steps.length },
      failureType: FAILURE_TYPES.FINAL_ANSWER_ONLY,
      confidence: confidence(0.64, [evidenceItem('method_answer_split', 'Method evidence exists but final answer differs.', steps.length)]),
    };
  }

  return {
    failureLocation: steps.length ? { stepNumber: steps.length } : null,
    failureType: answerCorrect ? FAILURE_TYPES.NONE_DETECTED : FAILURE_TYPES.LAST_CORRECT_STEP,
    confidence: confidence(answerCorrect ? 0.5 : 0.46, [evidenceItem('heuristic', 'No explicit failed step detected.')]),
  };
}

export function detectMethodEvidence(record = {}, procedureAnalysis = {}, questionMetadata = {}) {
  const text = allWorkingText(record);
  const details = {
    correctSetup: /let |given|total|whole|remainder|common denominator|lcm|=/.test(text.toLowerCase()),
    correctRepresentation: /model|bar|diagram|draw|number line/.test(text.toLowerCase()),
    correctIntermediateSteps: (record.detectedSteps || []).length >= 2 || (record.ocrOutput?.equations || []).length >= 1,
    correctReasoningPath: procedureAnalysis.procedureStatus === PROCEDURE_STATUSES.CORRECT || procedureAnalysis.procedureStatus === PROCEDURE_STATUSES.PARTIALLY_CORRECT,
    correctModel: /model|bar|diagram/.test(text.toLowerCase()) || Boolean(questionMetadata.modelUsedCorrectly),
  };
  const score = clamp(
    (details.correctSetup ? 22 : 0) +
    (details.correctRepresentation ? 18 : 0) +
    (details.correctIntermediateSteps ? 22 : 0) +
    (details.correctReasoningPath ? 28 : 0) +
    (details.correctModel ? 10 : 0)
  );
  return {
    methodEvidenceScore: score,
    methodQuality: score >= 75 ? 'strong' : score >= 50 ? 'developing' : score >= 25 ? 'limited' : 'not_visible',
    finalAnswerQuality: questionMetadata.answerCorrect === true ? 'correct' : questionMetadata.answerCorrect === false ? 'incorrect' : 'unknown',
    methodEvidenceDetails: details,
  };
}

function pushMisconception(rows, libraryId, score, evidence) {
  const item = MISCONCEPTION_LIBRARY_V1.find((row) => row.misconceptionId === libraryId);
  if (!item) return;
  rows.push({
    misconceptionId: item.misconceptionId,
    description: item.description,
    domain: item.domain,
    confidence: Math.min(0.92, score),
    evidence,
    recommendedIntervention: item.recommendedIntervention,
  });
}

export function detectMisconceptions(record = {}, procedureAnalysis = {}, failurePoint = {}, questionMetadata = {}) {
  const text = allWorkingText(record).toLowerCase();
  const rows = [];
  const student = fractionParts(questionMetadata.studentAnswer || text);
  const correct = fractionParts(questionMetadata.correctAnswer || '');

  if (/larger denominator|denominator bigger|bigger denominator|bigger bottom|more parts means bigger|denominator.*bigger|bottom.*bigger|\d+\s+is bigger/.test(text)) {
    pushMisconception(rows, 'FRAC_DENOM_LARGER_VALUE', 0.78, ['Working text suggests larger denominator means larger value.']);
  }
  if (/compare numerator|bigger numerator|top number/.test(text) && !/common denominator|same whole|same denominator/.test(text)) {
    pushMisconception(rows, 'FRAC_NUMERATOR_ONLY_COMPARISON', 0.66, ['Numerator language detected without denominator/common-whole reasoning.']);
  }
  if (/compare denominator|bottom number/.test(text) && !/numerator|same numerator|common/.test(text)) {
    pushMisconception(rows, 'FRAC_DENOMINATOR_ONLY_COMPARISON', 0.63, ['Denominator comparison language detected without numerator reasoning.']);
  }
  if (/add denominators|denominator \+|bottom \+|common denominator/.test(text) && questionMetadata.answerCorrect === false) {
    pushMisconception(rows, 'FRAC_COMMON_DENOMINATOR_SETUP_ERROR', 0.7, ['Common denominator or denominator-addition language appears in incorrect working.']);
  }
  if (student && correct && student.denominator !== correct.denominator && questionMetadata.questionType === 'fraction_comparison') {
    pushMisconception(rows, 'FRAC_COMMON_DENOMINATOR_SETUP_ERROR', 0.58, ['Student answer denominator differs from expected comparison setup.']);
  }
  if (/0\.\d+/.test(text) && /longer|more digits/.test(text)) {
    pushMisconception(rows, 'DEC_LONGER_IS_LARGER', 0.65, ['Decimal length language detected.']);
  }
  if (/%|percent/.test(text) && /\/|fraction/.test(text) && questionMetadata.answerCorrect === false) {
    pushMisconception(rows, 'PCT_FRACTION_CONFUSION', 0.6, ['Percent and fraction conversion appear in incorrect response.']);
  }
  if (/ratio|:/.test(text) && /whole|total/.test(text) && questionMetadata.answerCorrect === false) {
    pushMisconception(rows, 'RATIO_PART_PART_PART_WHOLE', 0.62, ['Ratio language mixed with whole/total in incorrect response.']);
  }
  if (failurePoint.failureType === FAILURE_TYPES.FIRST_INCORRECT_STEP && /wrong operation|operation|multiply|divide|add|subtract/.test(text)) {
    pushMisconception(rows, 'WHOLE_OPERATION_SELECTION', 0.58, ['Failure point suggests wrong operation selection.']);
  }

  const sorted = rows.sort((a, b) => b.confidence - a.confidence);
  return {
    primaryMisconception: sorted[0] || null,
    secondaryMisconceptions: sorted.slice(1, 3),
    possibleMisconceptions: sorted,
    uncertaintyNote: sorted.length ? 'Misconceptions are suggestions for adult verification.' : 'No strong misconception pattern detected.',
  };
}

export function detectProcedurePatterns(analyses = []) {
  const counts = new Map();
  (analyses || []).forEach((analysis) => {
    (analysis.misconceptionDetection?.possibleMisconceptions || []).forEach((m) => {
      counts.set(m.misconceptionId, (counts.get(m.misconceptionId) || 0) + 1);
    });
    const fp = analysis.failurePoint?.failureType;
    if (fp && fp !== FAILURE_TYPES.NONE_DETECTED) counts.set(fp, (counts.get(fp) || 0) + 1);
    if (analysis.methodEvidence?.methodEvidenceDetails?.correctSetup === false) counts.set('repeated_setup_weakness', (counts.get('repeated_setup_weakness') || 0) + 1);
  });
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([patternId, count]) => ({ patternId, count, trend: count >= 3 ? 'persistent' : 'emerging' }));
}

export function buildMethodMarkFrameworkV2(methodEvidence = {}, questionMetadata = {}) {
  const maxMarks = Number(questionMetadata.estimatedMarks || questionMetadata.marks || 2);
  const methodPotential = Math.round((methodEvidence.methodEvidenceScore / 100) * Math.max(0, maxMarks - 1) * 10) / 10;
  const finalAnswerPotential = methodEvidence.finalAnswerQuality === 'correct' ? 1 : 0;
  const strengths = Object.entries(methodEvidence.methodEvidenceDetails || {})
    .filter(([, value]) => value)
    .map(([key]) => key);
  const weaknesses = Object.entries(methodEvidence.methodEvidenceDetails || {})
    .filter(([, value]) => !value)
    .map(([key]) => key);
  return {
    methodMarkPotential: methodPotential,
    finalAnswerPotential,
    estimatedTotalPotential: Math.min(maxMarks, methodPotential + finalAnswerPotential),
    methodStrengths: strengths,
    methodWeaknesses: weaknesses,
  };
}

export function analyzeWordProblemProcedure(record = {}, questionMetadata = {}) {
  const text = allWorkingText(record).toLowerCase();
  const issues = [];
  if (!/model|bar|diagram|number line/.test(text) && questionMetadata.requiresRepresentation) issues.push('representation_error');
  if (/model|bar/.test(text) && /wrong|incorrect|stuck/.test(text)) issues.push('model_error');
  if (/add|subtract|multiply|divide/.test(text) && questionMetadata.operationMismatch) issues.push('operation_selection_error');
  if (/=/.test(text) && questionMetadata.answerCorrect === false) issues.push('calculation_error');
  if (/left|remainder|total|altogether/.test(text) && questionMetadata.answeredWrongQuantity) issues.push('interpretation_error');
  return {
    problemSolvingPathway: {
      represented: /model|bar|diagram|number line/.test(text),
      operationSelected: /add|subtract|\+|-|multiply|divide|×|÷/.test(text),
      calculated: /=/.test(text),
      interpretedAnswer: /answer|ans|left|remainder|total/.test(text),
    },
    issues,
  };
}

export function detectHeuristics(record = {}, questionMetadata = {}) {
  const text = allWorkingText(record);
  return HEURISTICS.map((heuristic) => {
    const matched = heuristic.patterns.some((pattern) => pattern.test(text));
    return {
      heuristicId: heuristic.id,
      detected: matched,
      usage: matched
        ? questionMetadata.answerCorrect === false && /wrong|incorrect|stuck/.test(text.toLowerCase()) ? 'incorrect_usage' : 'possible_correct_usage'
        : 'not_detected',
      confidence: matched ? 0.62 : 0.2,
    };
  }).filter((row) => row.detected);
}

export function scoreWorkingQualityEnhanced(record = {}, methodEvidence = {}) {
  const steps = record.detectedSteps || [];
  const hasText = Boolean(record.ocrOutput?.rawText);
  const completeness = clamp(steps.length * 22);
  const organisation = clamp(steps.length >= 2 ? 72 : steps.length === 1 ? 45 : 15);
  const stepClarity = clamp((steps.filter((step) => step.text).length / Math.max(1, steps.length)) * 100);
  const reasoningVisibility = clamp(methodEvidence.methodEvidenceScore || 0);
  const methodEvidenceScore = clamp(methodEvidence.methodEvidenceScore || 0);
  const finalScore = Math.round((completeness * 0.22 + organisation * 0.18 + stepClarity * 0.2 + reasoningVisibility * 0.2 + methodEvidenceScore * 0.2) * 10) / 10;
  return {
    completeness,
    organisation,
    stepClarity: hasText ? stepClarity : 0,
    reasoningVisibility,
    methodEvidence: methodEvidenceScore,
    finalScore,
    band: finalScore >= 80 ? 'strong' : finalScore >= 60 ? 'developing' : finalScore >= 35 ? 'limited' : 'not_visible',
  };
}

export function buildStudentFeedback(analysis = {}) {
  const method = analysis.methodEvidence || {};
  const misconception = analysis.misconceptionDetection?.primaryMisconception;
  if (method.methodQuality === 'strong' && method.finalAnswerQuality === 'incorrect') {
    return 'You chose a sensible method, but an error happened near the final answer. Check the last calculation carefully.';
  }
  if (misconception?.misconceptionId === 'FRAC_DENOM_LARGER_VALUE') {
    return 'You may have treated the larger denominator as the larger fraction. Remember: more equal parts means each part is smaller.';
  }
  if (misconception?.misconceptionId === 'FRAC_NUMERATOR_ONLY_COMPARISON') {
    return 'You compared the numerators, but the denominators also matter unless the parts are the same size.';
  }
  if (analysis.procedureAnalysis?.procedureStatus === PROCEDURE_STATUSES.SKIPPED) {
    return 'Show your steps so your teacher or tutor can see how you are thinking.';
  }
  return 'Review the steps and try to explain why each line follows from the one before it.';
}

export function buildParentInsight(analysis = {}) {
  const misconception = analysis.misconceptionDetection?.primaryMisconception;
  if (misconception) {
    return {
      explanation: `Your child may be showing this pattern: ${misconception.description.toLowerCase()}`,
      suggestedSupport: 'Ask them to explain the size of each part using a simple drawing before calculating.',
    };
  }
  return {
    explanation: 'The working gives some evidence of the method, but no strong misconception pattern has been confirmed.',
    suggestedSupport: 'Encourage clear, step-by-step working and ask what each step means.',
  };
}

export function buildTutorInsight(analysis = {}) {
  return {
    procedureBreakdown: analysis.procedureAnalysis,
    failurePoint: analysis.failurePoint,
    misconception: analysis.misconceptionDetection?.primaryMisconception || null,
    interventionRecommendation: analysis.interventionRecommendation,
    suggestedLessonFocus: analysis.misconceptionDetection?.primaryMisconception?.recommendedIntervention || 'review_working_clarity',
  };
}

export function buildTeacherInsight(analyses = []) {
  const patterns = detectProcedurePatterns(analyses);
  const misconceptionCounts = new Map();
  analyses.forEach((analysis) => {
    const id = analysis.misconceptionDetection?.primaryMisconception?.misconceptionId;
    if (id) misconceptionCounts.set(id, (misconceptionCounts.get(id) || 0) + 1);
  });
  return {
    classMisconceptionClusters: [...misconceptionCounts.entries()].map(([misconceptionId, count]) => ({ misconceptionId, count })),
    procedureErrorTrends: patterns,
    methodMarkRisks: analyses.filter((analysis) => (analysis.methodMark?.methodMarkPotential || 0) < 1).length,
    groupingRecommendations: patterns.map((pattern) => ({
      groupBy: pattern.patternId,
      action: pattern.trend === 'persistent' ? 'small_group_reteach' : 'monitor_and_practice',
    })),
  };
}

export function connectIntervention(analysis = {}) {
  const misconception = analysis.misconceptionDetection?.primaryMisconception;
  const playbookId = misconception?.recommendedIntervention || 'fractions_remediation_pack';
  return {
    misconceptionId: misconception?.misconceptionId || null,
    interventionPlaybookId: playbookId,
    assignmentType: playbookId.includes('denominator') ? 'intervention_pack' : 'practice_pack',
    worksheetRecommended: true,
    reassessmentRecommended: true,
  };
}

export function buildHumanReviewAssistSuggestion(analysis = {}) {
  return {
    suggestedProcedure: analysis.procedureAnalysis,
    suggestedFailurePoint: analysis.failurePoint,
    suggestedMisconception: analysis.misconceptionDetection?.primaryMisconception || null,
    suggestedMethodEvidence: analysis.methodEvidence,
    reviewerActions: ['accept', 'edit', 'reject'],
  };
}

export function buildMisconceptionDatasetRecord(record = {}, analysis = {}, humanReviewOutcome = null) {
  return {
    question: record.datasetRecord?.question || '',
    working: record.datasetRecord?.working || record.rawArchive || {},
    procedureAnalysis: analysis.procedureAnalysis,
    misconceptionPrediction: analysis.misconceptionDetection,
    humanReviewOutcome,
    outcome: record.datasetRecord?.outcome || null,
    aiTrainingReady: Boolean(humanReviewOutcome?.accepted || humanReviewOutcome?.verified),
  };
}

export function buildAccuracyAuditReport(rows = []) {
  const reviewed = (rows || []).filter((row) => row.humanReviewOutcome);
  const accepted = reviewed.filter((row) => row.humanReviewOutcome.accepted || row.humanReviewOutcome.verified);
  const edited = reviewed.filter((row) => row.humanReviewOutcome.edited);
  const rejected = reviewed.filter((row) => row.humanReviewOutcome.rejected);
  const rate = (n, d) => d ? Math.round((n / d) * 1000) / 10 : 0;
  return {
    reviewedCount: reviewed.length,
    procedureDetectionAccuracy: rate(accepted.length, reviewed.length),
    failurePointAccuracy: rate(accepted.filter((row) => row.failurePointAccepted !== false).length, reviewed.length),
    misconceptionPredictionAccuracy: rate(accepted.filter((row) => row.misconceptionAccepted !== false).length, reviewed.length),
    humanAcceptanceRate: rate(accepted.length, reviewed.length),
    humanEditRate: rate(edited.length, reviewed.length),
    humanRejectRate: rate(rejected.length, reviewed.length),
  };
}

export function runProcedureMisconceptionAnalysis(record = {}, questionMetadata = {}) {
  const procedureAnalysis = analyzeProcedure(record, questionMetadata);
  const failurePoint = identifyFailurePoint(record, procedureAnalysis, questionMetadata);
  const methodEvidence = detectMethodEvidence(record, procedureAnalysis, questionMetadata);
  const misconceptionDetection = detectMisconceptions(record, procedureAnalysis, failurePoint, questionMetadata);
  const methodMark = buildMethodMarkFrameworkV2(methodEvidence, questionMetadata);
  const wordProblemAnalysis = analyzeWordProblemProcedure(record, questionMetadata);
  const heuristics = detectHeuristics(record, questionMetadata);
  const workingQuality = scoreWorkingQualityEnhanced(record, methodEvidence);
  const partial = {
    procedureAnalysis,
    failurePoint,
    methodEvidence,
    misconceptionDetection,
    methodMark,
    wordProblemAnalysis,
    heuristics,
    workingQuality,
  };
  const interventionRecommendation = connectIntervention(partial);
  const analysis = {
    ...partial,
    interventionRecommendation,
  };
  return {
    ...analysis,
    studentFeedback: buildStudentFeedback(analysis),
    parentInsight: buildParentInsight(analysis),
    tutorInsight: buildTutorInsight(analysis),
    humanReviewAssist: buildHumanReviewAssistSuggestion(analysis),
    misconceptionDatasetRecord: buildMisconceptionDatasetRecord(record, analysis),
  };
}

export function applyHumanReviewAssistDecision(analysis = {}, decision = {}) {
  return {
    ...analysis,
    humanReviewOutcome: {
      reviewerUserId: decision.reviewerUserId || '',
      reviewerRole: decision.reviewerRole || '',
      action: decision.action || 'accept',
      accepted: decision.action === 'accept',
      edited: decision.action === 'edit',
      rejected: decision.action === 'reject',
      verified: Boolean(decision.verified || decision.action === 'accept'),
      notes: decision.notes || '',
      correctedAnalysis: decision.correctedAnalysis || null,
      reviewedAt: decision.reviewedAt || new Date().toISOString(),
    },
  };
}

export function validateProcedureMisconceptionEngine() {
  const record = {
    workingId: 'w1',
    ocrOutput: { rawText: 'Compare denominator. 1/5 is bigger than 1/3 because 5 is bigger.' },
    detectedSteps: [
      { stepNumber: 1, text: 'Compare denominator.' },
      { stepNumber: 2, text: '1/5 is bigger than 1/3 because 5 is bigger.' },
    ],
    datasetRecord: { question: 'Which is larger, 1/5 or 1/3?' },
  };
  const analysis = runProcedureMisconceptionAnalysis(record, {
    answerCorrect: false,
    studentAnswer: '1/5',
    correctAnswer: '1/3',
    questionType: 'fraction_comparison',
    expectedStepCount: 2,
    expectedProcedureKeywords: ['same numerator', 'denominator'],
  });
  const reviewed = applyHumanReviewAssistDecision(analysis, { action: 'accept', reviewerRole: 'tutor' });
  const audit = buildAccuracyAuditReport([{ ...reviewed, humanReviewOutcome: reviewed.humanReviewOutcome }]);

  return {
    completed: true,
    checks: {
      procedureStatusSet: Boolean(analysis.procedureAnalysis.procedureStatus),
      failurePointSet: Boolean(analysis.failurePoint.failureType),
      methodEvidenceScored: Number.isFinite(analysis.methodEvidence.methodEvidenceScore),
      misconceptionDetected: analysis.misconceptionDetection.primaryMisconception?.misconceptionId === 'FRAC_DENOM_LARGER_VALUE',
      methodMarkProduced: Number.isFinite(analysis.methodMark.methodMarkPotential),
      feedbackGenerated: Boolean(analysis.studentFeedback && analysis.parentInsight?.explanation),
      interventionConnected: Boolean(analysis.interventionRecommendation.interventionPlaybookId),
      humanAssistAvailable: analysis.humanReviewAssist.reviewerActions.includes('accept'),
      auditCalculated: audit.humanAcceptanceRate === 100,
    },
  };
}
