export const REASONING_LEVELS = {
  BEGINNING: 'beginning',
  DEVELOPING: 'developing',
  COMPETENT: 'competent',
  STRONG: 'strong',
  ADVANCED: 'advanced',
};

export const STRATEGY_STATUS = {
  APPROPRIATE: 'appropriate_strategy',
  PARTIALLY_APPROPRIATE: 'partially_appropriate_strategy',
  INEFFICIENT: 'inefficient_strategy',
  INCORRECT: 'incorrect_strategy',
  NOT_VISIBLE: 'strategy_not_visible',
};

export const METHOD_MARK_BANDS_V3 = {
  STRONG: 'strong_method_evidence',
  MODERATE: 'moderate_method_evidence',
  WEAK: 'weak_method_evidence',
  NONE: 'no_method_evidence',
};

function clamp(value, min = 0, max = 100) {
  const n = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
}

function confidence(score, evidence = [], summary = '') {
  return {
    score: Math.max(0, Math.min(1, Number(score) || 0)),
    evidence,
    summary,
    uncertainty: score < 0.6 ? 'human_review_recommended' : 'usable_with_review',
  };
}

function steps(record = {}) {
  return Array.isArray(record.detectedSteps) ? record.detectedSteps : [];
}

function text(record = {}) {
  return [
    record.ocrOutput?.rawText,
    ...(steps(record).map((step) => step.text || '')),
    record.datasetRecord?.question,
  ].filter(Boolean).join('\n').toLowerCase();
}

function levelFromScore(score) {
  if (score >= 88) return REASONING_LEVELS.ADVANCED;
  if (score >= 75) return REASONING_LEVELS.STRONG;
  if (score >= 60) return REASONING_LEVELS.COMPETENT;
  if (score >= 35) return REASONING_LEVELS.DEVELOPING;
  return REASONING_LEVELS.BEGINNING;
}

function methodBand(score) {
  if (score >= 75) return METHOD_MARK_BANDS_V3.STRONG;
  if (score >= 50) return METHOD_MARK_BANDS_V3.MODERATE;
  if (score >= 20) return METHOD_MARK_BANDS_V3.WEAK;
  return METHOD_MARK_BANDS_V3.NONE;
}

export function analyzeRepresentation(record = {}, procedureAnalysis = {}) {
  const body = text(record);
  const hasModel = /bar model|model method|model|diagram|draw|drawing/.test(body);
  const hasNumberLine = /number line/.test(body);
  const hasTable = /table|tabulate|column/.test(body);
  const hasFractionModel = /fraction model|shaded|equal parts|parts/.test(body);
  const representationEvidence = [
    hasModel ? 'model_or_diagram_detected' : null,
    hasNumberLine ? 'number_line_detected' : null,
    hasTable ? 'table_detected' : null,
    hasFractionModel ? 'fraction_model_language_detected' : null,
  ].filter(Boolean);
  const completeness = clamp(
    (hasModel ? 35 : 0) +
    (hasNumberLine || hasTable || hasFractionModel ? 25 : 0) +
    (procedureAnalysis?.procedureStatus?.includes('correct') ? 20 : 0) +
    (steps(record).length >= 2 ? 20 : 0)
  );
  return {
    representationQuality: completeness >= 75 ? 'strong' : completeness >= 50 ? 'developing' : completeness >= 20 ? 'limited' : 'not_visible',
    representationCompleteness: completeness,
    representationEvidence,
    confidence: confidence(representationEvidence.length ? 0.68 : 0.42, representationEvidence, 'Representation analysis is based on detected model, diagram, number-line, table, and fraction-model cues.'),
  };
}

export function analyzeStrategy(record = {}, procedureAnalysis = {}, heuristics = []) {
  const body = text(record);
  const detectedHeuristic = (heuristics || []).find((row) => row.detected)?.heuristicId || null;
  const strategyEvidence = [];
  if (detectedHeuristic) strategyEvidence.push(`heuristic:${detectedHeuristic}`);
  if (/common denominator|lcm|same denominator/.test(body)) strategyEvidence.push('common_denominator_strategy');
  if (/working backwards|reverse/.test(body)) strategyEvidence.push('working_backwards_strategy');
  if (/guess|check|try/.test(body)) strategyEvidence.push('guess_and_check_strategy');
  if (/assume|let .* be/.test(body)) strategyEvidence.push('assumption_strategy');

  let strategyStatus = STRATEGY_STATUS.NOT_VISIBLE;
  if (procedureAnalysis?.procedureStatus === 'correct_procedure') strategyStatus = STRATEGY_STATUS.APPROPRIATE;
  else if (procedureAnalysis?.procedureStatus === 'partially_correct_procedure') strategyStatus = STRATEGY_STATUS.PARTIALLY_APPROPRIATE;
  else if (strategyEvidence.length) strategyStatus = STRATEGY_STATUS.INEFFICIENT;
  if (procedureAnalysis?.procedureStatus === 'incorrect_procedure' && strategyEvidence.length <= 1) strategyStatus = STRATEGY_STATUS.INCORRECT;

  return {
    strategyStatus,
    strategyEvidence,
    detectedHeuristic,
    confidence: confidence(strategyEvidence.length ? 0.66 : 0.38, strategyEvidence, 'Strategy analysis uses procedure status and visible strategy cues.'),
  };
}

export function analyzeLogicalFlow(record = {}, failurePoint = {}) {
  const list = steps(record);
  const ordered = list.every((step, index) => Number(step.stepNumber || index + 1) === index + 1);
  const missingTransitions = list.filter((step) => !step.text || String(step.text).length < 3).map((step) => step.stepNumber);
  const reasoningJumps = [];
  for (let i = 1; i < list.length; i += 1) {
    const prev = String(list[i - 1]?.text || '');
    const curr = String(list[i]?.text || '');
    if (prev && curr && curr.length > prev.length * 3 && !/[=+\-×x÷/]/.test(curr)) reasoningJumps.push(list[i].stepNumber || i + 1);
  }
  const abandoned = failurePoint?.failureType === 'abandoned_step';
  const score = clamp(
    (ordered ? 25 : 5) +
    (list.length >= 3 ? 30 : list.length >= 2 ? 20 : list.length ? 10 : 0) +
    (missingTransitions.length ? 0 : 20) +
    (reasoningJumps.length ? 0 : 15) +
    (abandoned ? 0 : 10)
  );
  return {
    logicalFlowScore: score,
    indicators: {
      ordered,
      missingSteps: failurePoint?.failureType === 'missing_step' ? [failurePoint.failureLocation?.stepNumber].filter(Boolean) : [],
      reasoningJumps,
      incompleteTransitions: missingTransitions,
      abandonedReasoning: abandoned,
    },
    confidence: confidence(list.length ? 0.64 : 0.3, [`${list.length} detected step(s)`], 'Logical flow is inferred from step order, transitions, and failure point signals.'),
  };
}

export function scoreReasoningRubric({ record = {}, procedureAnalysis = {}, failurePoint = {}, methodEvidence = {}, representation = null, strategy = null, logicalFlow = null } = {}) {
  const rep = representation || analyzeRepresentation(record, procedureAnalysis);
  const strat = strategy || analyzeStrategy(record, procedureAnalysis, record.heuristics || []);
  const flow = logicalFlow || analyzeLogicalFlow(record, failurePoint);
  const methodScore = clamp(methodEvidence.methodEvidenceScore || record.methodEvidence?.methodEvidenceScore || 0);
  const explanationText = text(record);
  const explanationQuality = clamp(
    (/because|therefore|so|since/.test(explanationText) ? 45 : 0) +
    (/answer|ans|left|total|remainder/.test(explanationText) ? 25 : 0) +
    (steps(record).length >= 3 ? 20 : 0) +
    (record.misconceptionDetection?.primaryMisconception ? 0 : 10)
  );
  const completion = clamp(
    (steps(record).length >= 3 ? 45 : steps(record).length >= 2 ? 30 : steps(record).length ? 15 : 0) +
    (methodEvidence.finalAnswerQuality === 'correct' ? 30 : methodEvidence.finalAnswerQuality === 'incorrect' ? 15 : 10) +
    (failurePoint?.failureType === 'none_detected' ? 25 : 0)
  );
  const mathematicalAccuracy = clamp(
    (procedureAnalysis.procedureStatus === 'correct_procedure' ? 55 : 0) +
    (procedureAnalysis.procedureStatus === 'partially_correct_procedure' ? 35 : 0) +
    (methodScore * 0.35) +
    (methodEvidence.finalAnswerQuality === 'correct' ? 10 : 0)
  );
  const strategyScore = strat.strategyStatus === STRATEGY_STATUS.APPROPRIATE
    ? 90
    : strat.strategyStatus === STRATEGY_STATUS.PARTIALLY_APPROPRIATE
      ? 65
      : strat.strategyStatus === STRATEGY_STATUS.INEFFICIENT
        ? 45
        : strat.strategyStatus === STRATEGY_STATUS.INCORRECT
          ? 20
          : 10;
  const dimensions = {
    representation: rep.representationCompleteness,
    strategySelection: strategyScore,
    logicalProgression: flow.logicalFlowScore,
    mathematicalAccuracy,
    explanationQuality,
    completion,
  };
  const overallScore = Math.round((
    dimensions.representation * 0.15 +
    dimensions.strategySelection * 0.18 +
    dimensions.logicalProgression * 0.22 +
    dimensions.mathematicalAccuracy * 0.22 +
    dimensions.explanationQuality * 0.1 +
    dimensions.completion * 0.13
  ) * 10) / 10;
  return {
    dimensions,
    overallScore,
    reasoningLevel: levelFromScore(overallScore),
    confidence: confidence(0.62, Object.entries(dimensions).map(([k, v]) => `${k}:${v}`), 'Rubric score is transparent and dimension-based.'),
  };
}

export function buildPartialCreditRecommendation({ methodEvidence = {}, reasoningRubric = {}, failurePoint = {}, questionMetadata = {} } = {}) {
  const evidence = [];
  const score = methodEvidence.methodEvidenceScore || 0;
  if (methodEvidence.methodEvidenceDetails?.correctSetup) evidence.push('Correct setup visible.');
  if (methodEvidence.methodEvidenceDetails?.correctRepresentation) evidence.push('Useful representation visible.');
  if (methodEvidence.methodEvidenceDetails?.correctIntermediateSteps) evidence.push('Intermediate steps are visible.');
  if (methodEvidence.finalAnswerQuality === 'incorrect' && score >= 60) evidence.push('Final answer is wrong but method evidence is meaningful.');
  if (failurePoint.failureType === 'final_answer_only_mistake') evidence.push('Failure appears near the final answer.');

  let recommendation = 'no_partial_credit_recommended';
  if (score >= 75 || reasoningRubric.overallScore >= 75) recommendation = 'strong_partial_credit_recommended';
  else if (score >= 50 || reasoningRubric.overallScore >= 55) recommendation = 'moderate_partial_credit_recommended';
  else if (score >= 20 || reasoningRubric.overallScore >= 35) recommendation = 'limited_partial_credit_recommended';

  return {
    partialCreditRecommendation: recommendation,
    supportingEvidence: evidence,
    confidence: confidence(evidence.length ? 0.68 : 0.42, evidence, 'Partial credit is educational guidance, not official mark awarding.'),
    maximumMarksContext: questionMetadata.estimatedMarks || questionMetadata.marks || null,
  };
}

export function buildMethodMarkEngineV3(methodEvidence = {}, partialCredit = {}, questionMetadata = {}) {
  const score = methodEvidence.methodEvidenceScore || 0;
  const band = methodBand(score);
  const rationale = [
    `Method evidence score: ${score}`,
    `Final answer quality: ${methodEvidence.finalAnswerQuality || 'unknown'}`,
    ...(partialCredit.supportingEvidence || []),
  ];
  return {
    methodMarkRecommendation: band,
    rationale,
    confidence: confidence(score >= 50 ? 0.7 : 0.5, rationale, 'Method-mark recommendation is advisory and requires human review.'),
    officialMarksAwarded: false,
    estimatedMarks: questionMetadata.estimatedMarks || questionMetadata.marks || null,
  };
}

export function analyzeWordProblemReasoning(record = {}, questionMetadata = {}, wordProblemAnalysis = {}) {
  const pathway = wordProblemAnalysis.problemSolvingPathway || {};
  return {
    stages: {
      problemInterpretation: pathway.interpretedAnswer || /left|total|remainder|altogether|difference/.test(text(record)),
      representation: pathway.represented || false,
      operationSelection: pathway.operationSelected || false,
      calculationPath: pathway.calculated || false,
      conclusion: /answer|ans|therefore|so/.test(text(record)),
    },
    issues: wordProblemAnalysis.issues || [],
    confidence: confidence(0.58, Object.entries(pathway).map(([k, v]) => `${k}:${v}`), 'Word-problem reasoning is stage-based and conservative.'),
  };
}

export function analyzeMultiStepSolution(record = {}, failurePoint = {}) {
  const list = steps(record);
  const start = list[0]?.text ? 'visible_start' : 'missing_start';
  const middle = list.length >= 3 ? 'visible_middle' : list.length >= 2 ? 'thin_middle' : 'missing_middle';
  const end = failurePoint.failureType === 'final_answer_only_mistake'
    ? 'incorrect_end'
    : list.length >= 2
      ? 'visible_end'
      : 'missing_end';
  return {
    solutionMap: {
      start,
      middle,
      end,
      incorrectTransition: failurePoint.failureType === 'first_incorrect_step' ? failurePoint.failureLocation : null,
      skippedReasoning: failurePoint.failureType === 'missing_step' ? failurePoint.failureLocation : null,
    },
    confidence: confidence(list.length ? 0.6 : 0.25, [`${list.length} step(s)`], 'Multi-step map follows visible step structure and failure-point evidence.'),
  };
}

export function analyzeExplanationFoundation(response = {}) {
  const body = String(response.text || response.explanation || '').toLowerCase();
  return {
    claim: /i think|therefore|answer|is/.test(body) ? 'visible' : 'not_visible',
    evidence: /because|from|given|shown|data/.test(body) ? 'visible' : 'not_visible',
    reasoning: /so|therefore|since|because/.test(body) ? 'visible' : 'not_visible',
    structure: body.split(/[.!?\n]+/).filter(Boolean).length >= 2 ? 'multi_part' : 'single_part',
    keywordUsage: Array.isArray(response.expectedKeywords)
      ? response.expectedKeywords.filter((keyword) => body.includes(String(keyword).toLowerCase()))
      : [],
    confidence: confidence(body ? 0.55 : 0.2, ['foundation_only'], 'General explanation framework for future SciencePath and EnglishPath.'),
  };
}

export function buildStudentReasoningFeedback(analysis = {}) {
  const rubric = analysis.reasoningRubric || {};
  const method = analysis.methodMarkV3 || {};
  if (analysis.representation?.representationQuality === 'strong' && analysis.methodEvidence?.finalAnswerQuality === 'incorrect') {
    return 'You represented the problem well, but an error happened during the calculation. Check the calculation step.';
  }
  if (rubric.reasoningLevel === REASONING_LEVELS.STRONG || rubric.reasoningLevel === REASONING_LEVELS.ADVANCED) {
    return 'You showed clear reasoning and a suitable strategy. Keep checking each calculation carefully.';
  }
  if (analysis.logicalFlow?.indicators?.missingSteps?.length) {
    return 'You skipped an important reasoning step. Add the missing step so your solution is easier to follow.';
  }
  if (method.methodMarkRecommendation === METHOD_MARK_BANDS_V3.NONE) {
    return 'Try to show your method, not only the final answer. Your working helps your teacher understand your thinking.';
  }
  return 'You are building your reasoning. Write each step clearly and explain why it follows from the previous step.';
}

export function buildParentReasoningInsight(analysis = {}) {
  const strengths = [];
  const weaknesses = [];
  if ((analysis.reasoningRubric?.dimensions?.representation || 0) >= 60) strengths.push('representation');
  else weaknesses.push('representation');
  if ((analysis.reasoningRubric?.dimensions?.logicalProgression || 0) >= 60) strengths.push('logical flow');
  else weaknesses.push('logical flow');
  if ((analysis.methodEvidence?.methodEvidenceScore || 0) >= 60) strengths.push('method evidence');
  else weaknesses.push('method evidence');
  return {
    reasoningStrengths: strengths,
    reasoningWeaknesses: weaknesses,
    methodMarkRisks: analysis.methodMarkV3?.methodMarkRecommendation === METHOD_MARK_BANDS_V3.NONE ? ['method_not_visible'] : [],
    recommendedSupportActions: weaknesses.includes('representation')
      ? ['Ask your child to draw a simple model before calculating.']
      : ['Ask your child to explain each step out loud.'],
    explanation: `Reasoning level is ${analysis.reasoningRubric?.reasoningLevel || 'building'}.`,
  };
}

export function buildTutorReasoningInsight(analysis = {}) {
  return {
    strategySelection: analysis.strategy,
    methodEvidence: analysis.methodEvidence,
    failurePoints: analysis.failurePoint,
    lessonRecommendations: [
      analysis.strategy?.strategyStatus === STRATEGY_STATUS.INCORRECT ? 'reselect_strategy_before_calculating' : null,
      analysis.logicalFlow?.indicators?.missingSteps?.length ? 'fill_missing_reasoning_steps' : null,
      analysis.methodMarkV3?.methodMarkRecommendation === METHOD_MARK_BANDS_V3.WEAK ? 'model_method_mark_examples' : null,
    ].filter(Boolean),
    suggestedInterventions: analysis.interventionRecommendation || null,
  };
}

export function buildTeacherReasoningInsight(analyses = []) {
  const counts = new Map();
  (analyses || []).forEach((analysis) => {
    const level = analysis.reasoningRubric?.reasoningLevel || REASONING_LEVELS.BEGINNING;
    counts.set(level, (counts.get(level) || 0) + 1);
  });
  const breakdowns = (analyses || []).flatMap((analysis) => {
    const rows = [];
    if (analysis.logicalFlow?.indicators?.missingSteps?.length) rows.push('missing_reasoning_steps');
    if (analysis.methodMarkV3?.methodMarkRecommendation === METHOD_MARK_BANDS_V3.NONE) rows.push('no_method_evidence');
    if (analysis.strategy?.strategyStatus === STRATEGY_STATUS.INCORRECT) rows.push('incorrect_strategy');
    return rows;
  });
  const breakdownCounts = breakdowns.reduce((acc, key) => ({ ...acc, [key]: (acc[key] || 0) + 1 }), {});
  return {
    classReasoningTrends: [...counts.entries()].map(([reasoningLevel, count]) => ({ reasoningLevel, count })),
    methodMarkTrends: (analyses || []).map((analysis) => analysis.methodMarkV3?.methodMarkRecommendation).filter(Boolean),
    commonReasoningBreakdowns: Object.entries(breakdownCounts).map(([breakdown, count]) => ({ breakdown, count })),
    groupingRecommendations: Object.entries(breakdownCounts).map(([breakdown]) => ({ groupBy: breakdown, action: 'targeted_reasoning_practice' })),
  };
}

export function updateReasoningProgression(history = [], analysis = {}, timestamp = new Date().toISOString()) {
  const row = {
    timestamp,
    skillId: analysis.skillId || null,
    reasoningLevel: analysis.reasoningRubric?.reasoningLevel || REASONING_LEVELS.BEGINNING,
    reasoningScore: analysis.reasoningRubric?.overallScore || 0,
    representationScore: analysis.reasoningRubric?.dimensions?.representation || 0,
    methodEvidenceScore: analysis.methodEvidence?.methodEvidenceScore || 0,
  };
  const next = [...(Array.isArray(history) ? history : []), row];
  const previous = next.length > 1 ? next[next.length - 2] : null;
  return {
    history: next,
    latest: row,
    trend: previous
      ? {
          reasoningQualityImproved: row.reasoningScore > previous.reasoningScore,
          representationQualityImproved: row.representationScore > previous.representationScore,
          methodEvidenceImproved: row.methodEvidenceScore > previous.methodEvidenceScore,
        }
      : {
          reasoningQualityImproved: false,
          representationQualityImproved: false,
          methodEvidenceImproved: false,
        },
  };
}

export function connectExamReadinessIndicators({ knowledge = null, fluency = null, retention = null, confidenceSignal = null, analysis = {} } = {}) {
  return {
    knowledge,
    fluency,
    retention,
    confidence: confidenceSignal,
    reasoning: analysis.reasoningRubric?.overallScore ?? null,
    workingQuality: analysis.workingQuality?.finalScore ?? null,
    methodEvidence: analysis.methodEvidence?.methodEvidenceScore ?? null,
    indicators: [
      { label: 'Reasoning', value: analysis.reasoningRubric?.overallScore ?? null, evidence: analysis.reasoningRubric?.confidence?.evidence || [] },
      { label: 'Method Evidence', value: analysis.methodEvidence?.methodEvidenceScore ?? null, evidence: analysis.methodMarkV3?.rationale || [] },
      { label: 'Working Quality', value: analysis.workingQuality?.finalScore ?? null, evidence: ['Derived from working clarity and method evidence.'] },
    ],
  };
}

export function applyReasoningHumanReviewOverride(analysis = {}, decision = {}) {
  return {
    ...analysis,
    humanValidation: {
      reviewerUserId: decision.reviewerUserId || '',
      reviewerRole: decision.reviewerRole || '',
      action: decision.action || 'accept',
      accepted: decision.action === 'accept',
      modified: decision.action === 'modify',
      rejected: decision.action === 'reject',
      reviewerFeedback: decision.reviewerFeedback || '',
      correctedAnalysis: decision.correctedAnalysis || null,
      reviewedAt: decision.reviewedAt || new Date().toISOString(),
    },
  };
}

export function buildReasoningDatasetRecord(record = {}, analysis = {}, humanValidation = null) {
  return {
    question: record.datasetRecord?.question || '',
    working: record.rawArchive || record.datasetRecord?.working || {},
    reasoningAnalysis: analysis.reasoningRubric,
    methodMarkRecommendation: analysis.methodMarkV3,
    humanValidation,
    outcome: record.datasetRecord?.outcome || null,
    aiTrainingReady: Boolean(humanValidation?.accepted || humanValidation?.modified),
  };
}

export function runReasoningMethodMarkAnalysis(record = {}, context = {}) {
  const procedureAnalysis = context.procedureAnalysis || record.procedureAnalysis || {};
  const failurePoint = context.failurePoint || record.failurePoint || {};
  const methodEvidence = context.methodEvidence || record.methodEvidence || {};
  const representation = analyzeRepresentation(record, procedureAnalysis);
  const strategy = analyzeStrategy(record, procedureAnalysis, context.heuristics || record.heuristics || []);
  const logicalFlow = analyzeLogicalFlow(record, failurePoint);
  const reasoningRubric = scoreReasoningRubric({
    record,
    procedureAnalysis,
    failurePoint,
    methodEvidence,
    representation,
    strategy,
    logicalFlow,
  });
  const partialCredit = buildPartialCreditRecommendation({
    methodEvidence,
    reasoningRubric,
    failurePoint,
    questionMetadata: context.questionMetadata || {},
  });
  const methodMarkV3 = buildMethodMarkEngineV3(methodEvidence, partialCredit, context.questionMetadata || {});
  const wordProblemReasoning = analyzeWordProblemReasoning(record, context.questionMetadata || {}, context.wordProblemAnalysis || record.wordProblemAnalysis || {});
  const multiStepSolution = analyzeMultiStepSolution(record, failurePoint);
  const explanationAnalysis = analyzeExplanationFoundation({
    text: record.ocrOutput?.rawText || '',
    expectedKeywords: context.questionMetadata?.expectedExplanationKeywords || [],
  });
  const analysis = {
    skillId: record.skillId || context.questionMetadata?.skillId || null,
    representation,
    strategy,
    logicalFlow,
    reasoningRubric,
    partialCredit,
    methodMarkV3,
    wordProblemReasoning,
    multiStepSolution,
    explanationAnalysis,
    methodEvidence,
    failurePoint,
    workingQuality: record.workingQualityEnhanced || null,
    interventionRecommendation: record.interventionRecommendationV2 || null,
  };
  return {
    ...analysis,
    studentReasoningFeedback: buildStudentReasoningFeedback(analysis),
    parentReasoningInsight: buildParentReasoningInsight(analysis),
    tutorReasoningInsight: buildTutorReasoningInsight(analysis),
    examReadinessIndicators: connectExamReadinessIndicators({ ...context.examReadiness, analysis }),
    reasoningDatasetRecord: buildReasoningDatasetRecord(record, analysis),
    safety: {
      evidenceShown: true,
      confidenceShown: true,
      humanReviewAllowed: true,
      unsupportedConclusionPolicy: 'flag_uncertainty',
      uncertaintyFlagged: [
        representation.confidence,
        strategy.confidence,
        logicalFlow.confidence,
        reasoningRubric.confidence,
        partialCredit.confidence,
        methodMarkV3.confidence,
      ].some((row) => row.score < 0.6),
    },
  };
}

export function validateReasoningMethodMarkEngine() {
  const record = {
    skillId: 'F020',
    ocrOutput: { rawText: 'Draw bar model. Split into 5 equal parts. Remove 2 parts. 3/5 left. Answer 3/5.' },
    detectedSteps: [
      { stepNumber: 1, text: 'Draw bar model.' },
      { stepNumber: 2, text: 'Split into 5 equal parts.' },
      { stepNumber: 3, text: 'Remove 2 parts.' },
      { stepNumber: 4, text: '3/5 left. Answer 3/5.' },
    ],
    procedureAnalysis: { procedureStatus: 'correct_procedure' },
    failurePoint: { failureType: 'none_detected' },
    methodEvidence: {
      methodEvidenceScore: 86,
      finalAnswerQuality: 'correct',
      methodEvidenceDetails: {
        correctSetup: true,
        correctRepresentation: true,
        correctIntermediateSteps: true,
        correctReasoningPath: true,
        correctModel: true,
      },
    },
    wordProblemAnalysis: {
      problemSolvingPathway: { represented: true, operationSelected: true, calculated: true, interpretedAnswer: true },
      issues: [],
    },
    datasetRecord: { question: 'Sally gave away 2/5. How much was left?' },
  };
  const analysis = runReasoningMethodMarkAnalysis(record, { questionMetadata: { estimatedMarks: 3 } });
  const reviewed = applyReasoningHumanReviewOverride(analysis, { action: 'accept', reviewerRole: 'teacher' });
  const progression = updateReasoningProgression([], analysis);

  return {
    completed: true,
    checks: {
      rubricDimensionsPresent: Object.keys(analysis.reasoningRubric.dimensions).length === 6,
      representationAnalysed: analysis.representation.representationQuality === 'strong',
      strategyAnalysed: Boolean(analysis.strategy.strategyStatus),
      partialCreditRecommended: Boolean(analysis.partialCredit.partialCreditRecommendation),
      methodMarkV3Produced: analysis.methodMarkV3.officialMarksAwarded === false,
      feedbackGenerated: Boolean(analysis.studentReasoningFeedback && analysis.parentReasoningInsight?.explanation),
      examReadinessConnected: analysis.examReadinessIndicators.indicators.some((row) => row.label === 'Reasoning'),
      safetyPresent: analysis.safety.evidenceShown && analysis.safety.humanReviewAllowed,
      humanOverrideStored: reviewed.humanValidation.accepted === true,
      progressionTracked: progression.history.length === 1,
    },
  };
}
