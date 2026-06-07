import { runProcedureMisconceptionAnalysis } from './procedureMisconceptionAnalysisService.js';
import { runReasoningMethodMarkAnalysis, updateReasoningProgression } from './reasoningMethodMarkEngine.js';
import { detectMisconceptions } from './misconceptionDetectionService.js';

export const WORKING_QUALITY_BANDS = Object.freeze({
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  PARTIAL: 'PARTIAL',
  INSUFFICIENT: 'INSUFFICIENT',
});

function toText(value = '') {
  return String(value || '').trim();
}

function scoreFromRecord(record = {}, procedure = {}, reasoning = {}) {
  const base = Number(procedure.workingQuality?.finalScore ?? record.workingQualityEnhanced?.finalScore ?? reasoning.reasoningRubric?.reasoningScore ?? 0);
  if (Number.isFinite(base) && base > 0) return Math.max(0, Math.min(100, Math.round(base)));
  const steps = Array.isArray(record.detectedSteps) ? record.detectedSteps.length : 0;
  const hasText = Boolean(record.ocrOutput?.rawText);
  return Math.max(0, Math.min(100, (steps * 22) + (hasText ? 18 : 0)));
}

export function qualityBandFromScore(score = 0) {
  const n = Number(score) || 0;
  if (n >= 80) return WORKING_QUALITY_BANDS.EXCELLENT;
  if (n >= 60) return WORKING_QUALITY_BANDS.GOOD;
  if (n >= 35) return WORKING_QUALITY_BANDS.PARTIAL;
  return WORKING_QUALITY_BANDS.INSUFFICIENT;
}

function detectedMethodFromAnalysis(record = {}, procedure = {}, reasoning = {}) {
  const text = [
    record.ocrOutput?.rawText,
    ...(record.detectedSteps || []).map((step) => step.text),
  ].join('\n').toLowerCase();
  if (/common denominator|same denominator|lcm/.test(text)) return 'Common denominator method';
  if (/bar model|model method|diagram|draw/.test(text)) return 'Visual model method';
  if (/number line/.test(text)) return 'Number line method';
  if (/multiply|×/.test(text)) return 'Multiplicative method';
  if (/divide|÷/.test(text)) return 'Division method';
  if (reasoning.strategy?.strategyEvidence?.length) return 'Visible strategy detected';
  if (procedure.methodEvidence?.methodQuality === 'not_visible') return 'Method not visible';
  return procedure.methodEvidence?.methodQuality ? 'Step-by-step working' : 'Working submitted';
}

function issueFromAnalysis(procedure = {}, reasoning = {}) {
  const misconception = procedure.misconceptionDetection?.primaryMisconception;
  if (misconception) return misconception.description;
  const failureType = procedure.failurePoint?.failureType || reasoning.failurePoint?.failureType || '';
  const labels = {
    missing_step: 'A key step appears to be missing.',
    abandoned_step: 'The working stops before the method is complete.',
    first_incorrect_step: 'The method appears to go wrong part-way through.',
    final_answer_only_mistake: 'The method is partly visible, but the final answer does not match.',
    skipped_procedure: 'No working steps were detected.',
  };
  return labels[failureType] || '';
}

function studentExplanationFor(procedure = {}) {
  const misconceptionId = procedure.misconceptionDetection?.primaryMisconception?.misconceptionId || '';
  if (misconceptionId === 'FRAC_DENOM_LARGER_VALUE') {
    return 'You may be treating the larger denominator as the larger fraction. More equal parts means each part is smaller.';
  }
  if (misconceptionId === 'FRAC_NUMERATOR_ONLY_COMPARISON') {
    return 'You may be comparing only the numerators. Check that the parts are the same size before comparing.';
  }
  if (misconceptionId === 'FRAC_COMMON_DENOMINATOR_SETUP_ERROR') {
    return 'You may be mixing up numerators and denominators. Try finding a common denominator before combining fractions.';
  }
  if (procedure.failurePoint?.failureType === 'missing_step') {
    return 'A step seems to be missing. Write the intermediate step before the final answer.';
  }
  if (procedure.failurePoint?.failureType === 'final_answer_only_mistake') {
    return 'Your method has useful parts. Recheck the final calculation carefully.';
  }
  return procedure.studentFeedback || 'Review the visible steps and explain why each line follows from the one before it.';
}

export function buildWorkingInsight({ record = {}, procedure = {}, reasoning = {} } = {}) {
  const workingQualityScore = scoreFromRecord(record, procedure, reasoning);
  const misconception = procedure.misconceptionDetection?.primaryMisconception || null;
  const detectedIssue = issueFromAnalysis(procedure, reasoning);
  const detectedSteps = Array.isArray(record.detectedSteps) ? record.detectedSteps : [];
  const confidenceScore = Math.max(
    Number(record.ocrOutput?.confidence?.score || 0),
    Number(procedure.procedureAnalysis?.procedureConfidence?.score || 0),
    Number(reasoning.reasoningRubric?.confidence?.score || 0)
  );
  const genericMisconceptions = detectMisconceptions({
    questionText: record.questionText || record.datasetRecord?.question || '',
    studentAnswer: [
      record.answerGiven,
      record.ocrOutput?.rawText,
      ...(record.detectedSteps || []).map((step) => step.text),
    ].filter(Boolean).join('\n'),
    teacherMarkedCorrect: record.answerCorrect === false ? false : null,
  });
  const misconceptionTags = [
    misconception?.misconceptionId,
    ...(genericMisconceptions.misconceptionTags || []),
  ].filter(Boolean);
  return {
    workingId: record.workingId || '',
    attemptId: toText(record.attemptId),
    sessionId: toText(record.sessionId || record.practiceSessionId || record.assessmentSessionId || record.workingSessionId),
    questionId: toText(record.questionId),
    skillCode: toText(record.skillCode || record.skillId),
    answerGiven: toText(record.answerGiven),
    correctAnswer: toText(record.correctAnswer),
    answerCorrect: record.answerCorrect === true,
    confidenceLevel: toText(record.confidenceLevel),
    detectedMethod: detectedMethodFromAnalysis(record, procedure, reasoning),
    detectedSteps,
    extractedWorkingText: toText(record.ocrOutput?.rawText),
    detectedIssue,
    misconceptionDetected: misconception ? {
      misconceptionId: misconception.misconceptionId,
      description: misconception.description,
      confidence: misconception.confidence,
    } : null,
    misconceptionTags: [...new Set(misconceptionTags)],
    misconceptionConfidence: Math.max(Number(misconception?.confidence || 0), Number(genericMisconceptions.confidence || 0)),
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    workingQualityScore,
    qualityBand: qualityBandFromScore(workingQualityScore),
    parentInsight: procedure.parentInsight || reasoning.parentReasoningInsight || null,
    tutorInsight: procedure.tutorInsight || reasoning.tutorReasoningInsight || null,
    studentExplanation: studentExplanationFor(procedure),
    remediationRecommendation: procedure.interventionRecommendation || reasoning.interventionRecommendation || null,
  };
}

export function runWorkingInsightPipeline(record = {}, questionMetadata = {}) {
  const procedure = runProcedureMisconceptionAnalysis(record, questionMetadata);
  const reasoning = runReasoningMethodMarkAnalysis(
    {
      ...record,
      procedureAnalysis: procedure.procedureAnalysis,
      failurePoint: procedure.failurePoint,
      methodEvidence: procedure.methodEvidence,
      wordProblemAnalysis: procedure.wordProblemAnalysis,
      heuristics: procedure.heuristics,
      workingQualityEnhanced: procedure.workingQuality,
      interventionRecommendationV2: procedure.interventionRecommendation,
    },
    {
      questionMetadata,
      procedureAnalysis: procedure.procedureAnalysis,
      failurePoint: procedure.failurePoint,
      methodEvidence: procedure.methodEvidence,
      heuristics: procedure.heuristics,
      wordProblemAnalysis: procedure.wordProblemAnalysis,
    }
  );
  const reasoningProgression = updateReasoningProgression(
    Array.isArray(record.reasoningProgression?.history) ? record.reasoningProgression.history : [],
    reasoning
  );
  const insight = buildWorkingInsight({ record, procedure, reasoning });
  return { procedure, reasoning, reasoningProgression, insight };
}

export function applyWorkingInsightToRecord(record = {}, pipeline = {}) {
  const { procedure = {}, reasoning = {}, reasoningProgression = null, insight = {} } = pipeline;
  return {
    ...record,
    procedureAnalysis: procedure.procedureAnalysis,
    failurePoint: procedure.failurePoint,
    methodEvidence: procedure.methodEvidence,
    misconceptionDetection: procedure.misconceptionDetection,
    procedurePatterns: procedure.procedurePatterns || record.procedurePatterns || [],
    methodMark: procedure.methodMark,
    wordProblemAnalysis: procedure.wordProblemAnalysis,
    heuristics: procedure.heuristics || [],
    workingQualityEnhanced: procedure.workingQuality,
    studentFeedback: procedure.studentFeedback || insight.studentExplanation || '',
    parentInsight: procedure.parentInsight || null,
    tutorInsight: procedure.tutorInsight || null,
    teacherInsight: procedure.teacherInsight || null,
    interventionRecommendationV2: procedure.interventionRecommendation || null,
    humanReviewAssist: procedure.humanReviewAssist || null,
    misconceptionDatasetRecord: procedure.misconceptionDatasetRecord || null,
    reasoningAnalysis: reasoning,
    reasoningRubric: reasoning.reasoningRubric,
    representationAnalysis: reasoning.representation,
    strategyAnalysis: reasoning.strategy,
    logicalFlowAnalysis: reasoning.logicalFlow,
    partialCreditRecommendation: reasoning.partialCredit,
    methodMarkV3: reasoning.methodMarkV3,
    wordProblemReasoning: reasoning.wordProblemReasoning,
    multiStepSolutionMap: reasoning.multiStepSolution,
    explanationAnalysis: reasoning.explanationAnalysis,
    studentReasoningFeedback: reasoning.studentReasoningFeedback || '',
    parentReasoningInsight: reasoning.parentReasoningInsight || null,
    tutorReasoningInsight: reasoning.tutorReasoningInsight || null,
    teacherReasoningInsight: reasoning.teacherReasoningInsight || null,
    reasoningProgression,
    examReadinessIndicators: reasoning.examReadinessIndicators || null,
    reasoningSafety: reasoning.safety || null,
    reasoningDatasetRecord: reasoning.reasoningDatasetRecord || null,
    workingInsight: insight,
    workingQualityScore: insight.workingQualityScore,
    qualityBand: insight.qualityBand,
    analysisStatus: 'needs_human_review',
  };
}
