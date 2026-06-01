import { getQuestionFamily, getQuestionFamiliesBySkill } from './fractionQuestionFamilies.js';
import { getSkill } from './fractionSkillGraph.js';
import { calculateExamReadiness } from './fractionFluencyRetentionEngine.js';

export const EXAM_DIMENSIONS = [
  'knowledge',
  'fluency',
  'application',
  'reasoning',
  'examTechnique',
  'confidence',
  'retention',
  'workingQuality',
];

export const EXAM_QUESTION_TYPES = {
  KNOWLEDGE_RECALL: 'knowledge_recall',
  PROCEDURE: 'procedure',
  APPLICATION: 'application',
  REASONING: 'reasoning',
  MULTI_STEP: 'multi_step_problem',
  HEURISTICS: 'heuristics',
  OPEN_ENDED_EXPLANATION: 'open_ended_explanation',
  DATA_INTERPRETATION: 'data_interpretation',
  INVESTIGATION: 'investigation',
};

export const COGNITIVE_DEMAND = {
  L1_RECALL: { level: 1, label: 'Recall' },
  L2_ROUTINE: { level: 2, label: 'Routine Application' },
  L3_MULTI_STEP: { level: 3, label: 'Multi-Step Application' },
  L4_REASONING: { level: 4, label: 'Reasoning' },
  L5_NON_ROUTINE: { level: 5, label: 'Non-Routine Problem Solving' },
};

export const SINGAPORE_HEURISTICS = [
  'model_method',
  'guess_and_check',
  'working_backwards',
  'before_and_after',
  'assumption',
  'pattern_recognition',
];

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, toNum(value, 0)));
}

function round(value, places = 1) {
  const m = 10 ** places;
  return Math.round(toNum(value, 0) * m) / m;
}

function normalizeText(value = '') {
  return String(value || '').toLowerCase();
}

function cognitiveFromFamily(family = {}) {
  const text = `${family.name || ''} ${family.description || ''}`.toLowerCase();
  const difficulty = toNum(family.difficulty, 2);
  if (/investigation|non-routine|challenge/.test(text) || difficulty >= 5 && /extended|explanation|multi-step/.test(text)) return COGNITIVE_DEMAND.L5_NON_ROUTINE;
  if (/explain|justify|reasoning|model-based/.test(text)) return COGNITIVE_DEMAND.L4_REASONING;
  if (/multi-step|word problem|contextual|application/.test(text) || difficulty >= 4) return COGNITIVE_DEMAND.L3_MULTI_STEP;
  if (/convert|simplify|add|subtract|multiply|divide|compare|order/.test(text) || difficulty >= 2) return COGNITIVE_DEMAND.L2_ROUTINE;
  return COGNITIVE_DEMAND.L1_RECALL;
}

export function classifyExamQuestion(question = {}) {
  const family = getQuestionFamily(question.questionFamilyId) || question.questionFamily || {};
  const text = normalizeText(`${question.stem || ''} ${family.name || ''} ${family.description || ''}`);
  let questionType = EXAM_QUESTION_TYPES.PROCEDURE;
  if (/explain|justify|why|show/.test(text)) questionType = EXAM_QUESTION_TYPES.OPEN_ENDED_EXPLANATION;
  else if (/table|graph|chart|data/.test(text)) questionType = EXAM_QUESTION_TYPES.DATA_INTERPRETATION;
  else if (/investigate|pattern/.test(text)) questionType = EXAM_QUESTION_TYPES.INVESTIGATION;
  else if (/model|bar|remainder|backwards|before|after|assumption|guess/.test(text)) questionType = EXAM_QUESTION_TYPES.HEURISTICS;
  else if (/multi-step|then|after|remainder|at first|altogether/.test(text)) questionType = EXAM_QUESTION_TYPES.MULTI_STEP;
  else if (/word problem|context|application/.test(text)) questionType = EXAM_QUESTION_TYPES.APPLICATION;
  else if (/what is|identify|name/.test(text) && toNum(family.difficulty, 1) <= 1) questionType = EXAM_QUESTION_TYPES.KNOWLEDGE_RECALL;

  let cognitiveDemand = cognitiveFromFamily(family);
  if (questionType === EXAM_QUESTION_TYPES.OPEN_ENDED_EXPLANATION && cognitiveDemand.level < 4) {
    cognitiveDemand = COGNITIVE_DEMAND.L4_REASONING;
  }
  if ([EXAM_QUESTION_TYPES.HEURISTICS, EXAM_QUESTION_TYPES.INVESTIGATION].includes(questionType) && cognitiveDemand.level < 4) {
    cognitiveDemand = questionType === EXAM_QUESTION_TYPES.INVESTIGATION ? COGNITIVE_DEMAND.L5_NON_ROUTINE : COGNITIVE_DEMAND.L4_REASONING;
  }
  const estimatedMarks = toNum(question.estimatedMarks || question.marks || family.marks, cognitiveDemand.level >= 4 ? 3 : cognitiveDemand.level >= 3 ? 2 : 1);

  return {
    questionType,
    cognitiveDemand,
    estimatedMarks,
    skillId: question.skillId || family.skillId || '',
    questionFamilyId: question.questionFamilyId || family.id || '',
  };
}

export function buildMethodMarkStructure(question = {}) {
  const classification = classifyExamQuestion(question);
  const totalMarks = classification.estimatedMarks;
  const methodMarks = Math.max(0, totalMarks - 1);
  return {
    totalMarks,
    methodScoreMax: methodMarks,
    finalAnswerScoreMax: totalMarks > 0 ? 1 : 0,
    components: [
      { componentId: 'understands_question', label: 'Understands what to find', maxMarks: totalMarks >= 2 ? 1 : 0 },
      { componentId: 'correct_method', label: 'Correct method or model', maxMarks: Math.max(0, methodMarks - (totalMarks >= 3 ? 1 : 0)) },
      { componentId: 'intermediate_steps', label: 'Intermediate steps shown', maxMarks: totalMarks >= 3 ? 1 : 0 },
      { componentId: 'final_answer', label: 'Final answer', maxMarks: totalMarks > 0 ? 1 : 0 },
    ].filter((component) => component.maxMarks > 0),
    supportsPartialCredit: totalMarks > 1,
  };
}

export function scoreMethodMarks({ question = {}, methodCorrect = false, finalAnswerCorrect = false, partialSolution = false, multiStepSuccess = [] } = {}) {
  const structure = buildMethodMarkStructure(question);
  const methodScore = methodCorrect
    ? structure.methodScoreMax
    : partialSolution
      ? Math.max(1, Math.floor(structure.methodScoreMax / 2))
      : Math.min(structure.methodScoreMax, (multiStepSuccess || []).filter(Boolean).length);
  const finalAnswerScore = finalAnswerCorrect ? structure.finalAnswerScoreMax : 0;
  return {
    methodScore,
    finalAnswerScore,
    totalAwarded: Math.min(structure.totalMarks, methodScore + finalAnswerScore),
    totalMarks: structure.totalMarks,
    cases: {
      correctMethodWrongFinal: methodScore > 0 && finalAnswerScore === 0,
      incorrectMethodCorrectFinal: methodScore === 0 && finalAnswerScore > 0,
      partialSolution: Boolean(partialSolution),
      multiStepSuccessCount: (multiStepSuccess || []).filter(Boolean).length,
    },
    structure,
  };
}

export function evaluateWorkingQualityRubric(working = {}) {
  const indicators = {
    completeness: clamp(working.completeness ?? (working.stepsShown ? 80 : 40)),
    organisation: clamp(working.organisation ?? (working.labelledSteps ? 80 : 50)),
    logicalFlow: clamp(working.logicalFlow ?? (working.stepsInOrder ? 80 : 45)),
    stepAccuracy: clamp(working.stepAccuracy ?? (working.correctIntermediateSteps ? 80 : 45)),
    evidenceOfReasoning: clamp(working.evidenceOfReasoning ?? (working.explanationShown ? 75 : 40)),
  };
  const workingQualityScore = round(
    indicators.completeness * 0.25 +
    indicators.organisation * 0.15 +
    indicators.logicalFlow * 0.25 +
    indicators.stepAccuracy * 0.25 +
    indicators.evidenceOfReasoning * 0.1
  );
  return {
    workingQualityScore,
    indicators,
    band: workingQualityScore >= 80 ? 'strong' : workingQualityScore >= 60 ? 'developing' : 'needs_support',
  };
}

export function analyzeMultiStepReasoning(response = {}) {
  const steps = Array.isArray(response.steps) ? response.steps : [];
  const firstWrongIndex = steps.findIndex((step) => step.correct === false);
  const skippedSteps = steps.filter((step) => step.skipped || step.missing).map((step) => step.stepId || step.label);
  const abandoned = Boolean(response.abandoned || (steps.length && skippedSteps.length >= Math.ceil(steps.length / 2)));
  return {
    totalSteps: steps.length,
    correctSteps: steps.filter((step) => step.correct).length,
    failedEarlyStep: firstWrongIndex >= 0 && firstWrongIndex <= 1,
    failedFinalStep: steps.length > 0 && steps[steps.length - 1]?.correct === false,
    skippedIntermediateSteps: skippedSteps,
    abandonedProblem: abandoned,
    reasoningBreakdown: steps.map((step, index) => ({
      stepNumber: index + 1,
      stepId: step.stepId || `step_${index + 1}`,
      status: step.skipped || step.missing ? 'missing' : step.correct ? 'correct' : 'incorrect',
      skillId: step.skillId || '',
    })),
  };
}

export function trackHeuristicProgress(events = []) {
  const map = new Map(SINGAPORE_HEURISTICS.map((id) => [id, { heuristicId: id, exposure: 0, success: 0, weakness: 0 }]));
  (events || []).forEach((event) => {
    const id = event.heuristicId || event.strategyTag;
    if (!map.has(id)) map.set(id, { heuristicId: id, exposure: 0, success: 0, weakness: 0 });
    const row = map.get(id);
    row.exposure += 1;
    if (event.success) row.success += 1;
    else row.weakness += 1;
  });
  return [...map.values()].map((row) => ({
    ...row,
    successRate: row.exposure ? round((row.success / row.exposure) * 100) : null,
    status: row.exposure === 0 ? 'not_exposed' : row.success / row.exposure >= 0.75 ? 'secure' : 'needs_practice',
  }));
}

export function diagnoseWordProblemIssue(input = {}) {
  const text = normalizeText(`${input.questionStem || ''} ${input.studentExplanation || ''}`);
  const issues = [];
  if (input.misreadQuestion || /at first|left|remainder/.test(text) && input.answeredWrongQuantity) issues.push('reading_issue');
  if (input.noDiagram && /bar|model|remainder|ratio|before/.test(text)) issues.push('representation_issue');
  if (input.strategyMismatch || input.operationMismatch) issues.push('strategy_issue');
  if (input.calculationError) issues.push('calculation_issue');
  if (input.missingUnits || input.answerDoesNotMatchQuestion) issues.push('interpretation_issue');
  const interventions = issues.map((issue) => ({
    issue,
    intervention:
      issue === 'reading_issue' ? 'underline_question_and_find_target'
        : issue === 'representation_issue' ? 'draw_bar_model'
          : issue === 'strategy_issue' ? 'choose_heuristic_before_calculating'
            : issue === 'calculation_issue' ? 'slow_calculation_check'
              : 'write_final_statement_with_units',
  }));
  return { issues, interventions };
}

export function buildOpenEndedFoundation({ subject = 'science', response = {} } = {}) {
  if (subject === 'english') {
    return {
      subject,
      inference: clamp(response.inference, 0, 100),
      evidenceSelection: clamp(response.evidenceSelection, 0, 100),
      explanationQuality: clamp(response.explanationQuality, 0, 100),
      vocabulary: clamp(response.vocabulary, 0, 100),
      organisation: clamp(response.organisation, 0, 100),
      aiMarkingRequired: false,
    };
  }
  return {
    subject: 'science',
    conceptAccuracy: clamp(response.conceptAccuracy, 0, 100),
    keywordUsage: clamp(response.keywordUsage, 0, 100),
    explanationQuality: clamp(response.explanationQuality, 0, 100),
    reasoningQuality: clamp(response.reasoningQuality, 0, 100),
    evidenceUsage: clamp(response.evidenceUsage, 0, 100),
    aiMarkingRequired: false,
  };
}

export function detectExamTechniqueIssues(response = {}) {
  const indicators = [];
  if (response.missingUnits) indicators.push('missing_units');
  if (response.missingStatement) indicators.push('missing_statement');
  if (response.incompleteExplanation) indicators.push('incomplete_explanation');
  if (response.noEvidenceCited) indicators.push('no_evidence_cited');
  if (response.poorStructure) indicators.push('poor_structure');
  if (response.unclearReasoning) indicators.push('unclear_reasoning');
  return {
    indicators,
    score: clamp(100 - indicators.length * 15),
    recommendation:
      indicators.length
        ? 'Use an exam-answer checklist before submitting.'
        : 'Exam technique is clear.',
  };
}

export function analyzeTimeManagement(attempts = [], paper = {}) {
  const totalTime = attempts.reduce((sum, attempt) => sum + toNum(attempt.timeTaken || attempt.timeSpentSeconds, 0), 0);
  const totalMarks = attempts.reduce((sum, attempt) => sum + toNum(attempt.estimatedMarks || attempt.totalMarks, 1), 0);
  const secondsPerMark = totalMarks ? totalTime / totalMarks : 0;
  const targetSecondsPerMark = toNum(paper.targetSecondsPerMark, 90);
  return {
    totalTimeSeconds: round(totalTime),
    secondsPerMark: round(secondsPerMark),
    questionAbandonment: attempts.filter((a) => a.skipped || a.abandoned).length,
    rushingBehaviour: attempts.filter((a) => toNum(a.timeTaken, 0) < targetSecondsPerMark * 0.35 && !a.correct).length,
    overInvestment: attempts.filter((a) => toNum(a.timeTaken, 0) > targetSecondsPerMark * toNum(a.estimatedMarks || a.totalMarks, 1) * 1.7).length,
    insight:
      secondsPerMark > targetSecondsPerMark * 1.2 ? 'over_investing_time'
        : secondsPerMark < targetSecondsPerMark * 0.6 ? 'rushing'
          : 'balanced',
  };
}

export function analyzeConfidenceVsExamPerformance({ confidence = '', methodScore = 0, finalAnswerScore = 0, reasoningScore = 0 } = {}) {
  const confidenceScore = normalizeText(confidence).includes('very') ? 95 : normalizeText(confidence).includes('confident') ? 82 : normalizeText(confidence).includes('unsure') ? 55 : 35;
  const performance = clamp(methodScore * 35 + finalAnswerScore * 25 + reasoningScore * 40);
  if (confidenceScore >= 80 && performance < 60) return { pattern: 'confident_but_poor_reasoning', recommendation: 'Slow down and show method before final answer.' };
  if (confidenceScore < 60 && performance >= 75) return { pattern: 'low_confidence_strong_reasoning', recommendation: 'Build confidence with exam-style success streaks.' };
  if (confidenceScore < 50 && performance < 50) return { pattern: 'exam_anxiety_or_low_readiness', recommendation: 'Use scaffolded exam practice and short timed sections.' };
  return { pattern: 'confidence_aligned', recommendation: 'Continue current exam practice.' };
}

export function calculateSingaporeExamReadiness(input = {}) {
  const dimensions = {
    knowledge: clamp(input.knowledge),
    fluency: clamp(input.fluency),
    application: clamp(input.application),
    reasoning: clamp(input.reasoning),
    examTechnique: clamp(input.examTechnique),
    confidence: clamp(input.confidence),
    retention: clamp(input.retention),
    workingQuality: clamp(input.workingQuality),
  };
  const examReadiness = calculateExamReadiness({
    knowledgeScore: dimensions.knowledge,
    fluencyScore: dimensions.fluency,
    confidenceScore: dimensions.confidence,
    retentionScore: dimensions.retention,
    workingEvidenceScore: dimensions.workingQuality,
  });
  const applicationReasoningTechnique = round(dimensions.application * 0.25 + dimensions.reasoning * 0.45 + dimensions.examTechnique * 0.3);
  const transparentScore = round(examReadiness.examReadinessScore * 0.65 + applicationReasoningTechnique * 0.35);
  return {
    transparentScore,
    dimensions,
    componentScores: {
      foundation: examReadiness.examReadinessScore,
      applicationReasoningTechnique,
    },
    interpretation:
      transparentScore >= 80 ? 'exam_ready'
        : transparentScore >= 65 ? 'approaching_exam_ready'
          : 'exam_risk',
    noBlackBox: true,
  };
}

export function buildExamReadinessReport(input = {}) {
  const readiness = calculateSingaporeExamReadiness(input.dimensions || {});
  const strengths = Object.entries(readiness.dimensions).filter(([, score]) => score >= 75).map(([key]) => key);
  const weaknesses = Object.entries(readiness.dimensions).filter(([, score]) => score < 60).map(([key]) => key);
  return {
    reportType: 'singapore_exam_readiness',
    readiness,
    strengths,
    weaknesses,
    methodMarkRisks: input.methodMarkRisks || [],
    reasoningGaps: input.reasoningGaps || [],
    heuristicWeaknesses: input.heuristicWeaknesses || [],
    examTechniqueIssues: input.examTechniqueIssues || [],
    timeline: input.timeline || [],
    transparent: true,
  };
}

export function buildExamReadinessPages(report = {}) {
  return {
    student: {
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      reasoningSkills: report.reasoningGaps,
      heuristicsProgress: report.heuristicWeaknesses,
      examTechniqueProgress: report.examTechniqueIssues,
      upcomingFocusAreas: [...(report.weaknesses || []), ...(report.examTechniqueIssues || [])].slice(0, 5),
    },
    parent: {
      conceptGaps: report.weaknesses?.filter((x) => ['knowledge', 'application'].includes(x)) || [],
      reasoningGaps: report.reasoningGaps,
      examTechniqueIssues: report.examTechniqueIssues,
      recommendedSupportActions: ['Review worked examples', 'Ask child to explain steps aloud', 'Check final statement and units'],
    },
    tutor: {
      methodMarkRisks: report.methodMarkRisks,
      reasoningGaps: report.reasoningGaps,
      heuristicWeaknesses: report.heuristicWeaknesses,
      lessonPriorities: [...(report.reasoningGaps || []), ...(report.heuristicWeaknesses || [])].slice(0, 5),
      suggestedInterventions: ['method-mark practice', 'heuristics mini lesson', 'timed open-ended practice'],
    },
    teacher: {
      classReasoningProfile: report.reasoningGaps,
      commonExamTechniqueIssues: report.examTechniqueIssues,
      groupingRecommendations: report.heuristicWeaknesses.map((h) => ({ groupName: `${h} group`, focus: h })),
      suggestedReteachingTopics: report.weaknesses,
    },
  };
}

export function buildExamReadinessTimeline(events = []) {
  return (events || []).map((event, index) => ({
    eventId: event.eventId || `exam_timeline_${index + 1}`,
    timestamp: event.timestamp || new Date().toISOString(),
    eventType: event.eventType || 'exam_readiness_update',
    summary: event.summary || 'Exam-readiness evidence updated.',
    growthArea: event.growthArea || '',
    before: event.before ?? null,
    after: event.after ?? null,
  })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function validateFractionExamReadinessEngine() {
  const classification = classifyExamQuestion({
    skillId: 'F026',
    questionFamilyId: 'QF_F026_003',
    stem: 'Explain how Lina can work backwards using the remainder.',
  });
  const method = scoreMethodMarks({
    question: { questionFamilyId: 'QF_F026_003', marks: 3 },
    methodCorrect: true,
    finalAnswerCorrect: false,
    partialSolution: true,
    multiStepSuccess: [true, true, false],
  });
  const working = evaluateWorkingQualityRubric({
    completeness: 80,
    organisation: 70,
    logicalFlow: 75,
    stepAccuracy: 65,
    evidenceOfReasoning: 70,
  });
  const reasoning = analyzeMultiStepReasoning({
    steps: [
      { stepId: 'identify_remainder', correct: true },
      { stepId: 'unit_value', correct: false },
      { stepId: 'final_answer', correct: false },
    ],
  });
  const heuristic = trackHeuristicProgress([
    { heuristicId: 'model_method', success: true },
    { heuristicId: 'working_backwards', success: false },
  ]);
  const word = diagnoseWordProblemIssue({
    questionStem: 'Find the amount at first after a remainder is given.',
    answeredWrongQuantity: true,
    noDiagram: true,
    operationMismatch: true,
    missingUnits: true,
  });
  const science = buildOpenEndedFoundation({ subject: 'science', response: { conceptAccuracy: 70, keywordUsage: 60, explanationQuality: 65, reasoningQuality: 55, evidenceUsage: 50 } });
  const english = buildOpenEndedFoundation({ subject: 'english', response: { inference: 70, evidenceSelection: 60, explanationQuality: 65, vocabulary: 55, organisation: 75 } });
  const technique = detectExamTechniqueIssues({ missingUnits: true, incompleteExplanation: true, unclearReasoning: true });
  const time = analyzeTimeManagement([{ timeTaken: 220, estimatedMarks: 2 }, { timeTaken: 10, estimatedMarks: 1, correct: false }], { targetSecondsPerMark: 90 });
  const confidence = analyzeConfidenceVsExamPerformance({ confidence: 'Very confident', methodScore: 0, finalAnswerScore: 0, reasoningScore: 0.4 });
  const report = buildExamReadinessReport({
    dimensions: {
      knowledge: 82,
      fluency: 72,
      application: 58,
      reasoning: 54,
      examTechnique: technique.score,
      confidence: 70,
      retention: 75,
      workingQuality: working.workingQualityScore,
    },
    methodMarkRisks: ['correct_method_wrong_final'],
    reasoningGaps: ['failed early unit step'],
    heuristicWeaknesses: heuristic.filter((h) => h.status === 'needs_practice').map((h) => h.heuristicId),
    examTechniqueIssues: technique.indicators,
    timeline: buildExamReadinessTimeline([{ growthArea: 'reasoning', before: 45, after: 54 }]),
  });
  const pages = buildExamReadinessPages(report);

  const checks = {
    questionClassified: classification.questionType === EXAM_QUESTION_TYPES.OPEN_ENDED_EXPLANATION && classification.cognitiveDemand.level >= 4,
    methodMarksSeparate: method.methodScore > 0 && method.finalAnswerScore === 0,
    workingRubricScored: working.workingQualityScore > 0 && working.indicators.logicalFlow > 0,
    reasoningBreakdown: reasoning.failedEarlyStep === true && reasoning.failedFinalStep === true,
    heuristicTracked: heuristic.some((h) => h.heuristicId === 'working_backwards' && h.status === 'needs_practice'),
    wordProblemDiagnosed: word.issues.includes('reading_issue') && word.interventions.length > 0,
    openEndedFoundations: science.subject === 'science' && english.subject === 'english' && science.aiMarkingRequired === false,
    techniqueDetected: technique.indicators.includes('missing_units') && technique.score < 100,
    timeManagementDetected: ['over_investing_time', 'rushing', 'balanced'].includes(time.insight),
    confidenceExamPattern: confidence.pattern === 'confident_but_poor_reasoning',
    transparentReport: report.transparent === true && report.readiness.noBlackBox === true,
    rolePagesBuilt: Boolean(pages.student && pages.parent && pages.tutor && pages.teacher),
  };

  return {
    isValid: Object.values(checks).every(Boolean),
    checks,
    sample: { classification, method, working, reasoning, heuristic, word, science, english, technique, time, confidence, report, pages },
  };
}

export const fractionExamReadinessEngine = {
  classifyExamQuestion,
  buildMethodMarkStructure,
  scoreMethodMarks,
  evaluateWorkingQualityRubric,
  analyzeMultiStepReasoning,
  trackHeuristicProgress,
  diagnoseWordProblemIssue,
  buildOpenEndedFoundation,
  detectExamTechniqueIssues,
  analyzeTimeManagement,
  analyzeConfidenceVsExamPerformance,
  calculateSingaporeExamReadiness,
  buildExamReadinessReport,
  buildExamReadinessPages,
  buildExamReadinessTimeline,
  validateFractionExamReadinessEngine,
  EXAM_DIMENSIONS,
  EXAM_QUESTION_TYPES,
  COGNITIVE_DEMAND,
  SINGAPORE_HEURISTICS,
};

export default fractionExamReadinessEngine;
