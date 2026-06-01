import { describe, expect, it } from 'vitest';
import {
  EXAM_QUESTION_TYPES,
  analyzeConfidenceVsExamPerformance,
  analyzeMultiStepReasoning,
  analyzeTimeManagement,
  buildExamReadinessPages,
  buildExamReadinessReport,
  buildExamReadinessTimeline,
  buildMethodMarkStructure,
  buildOpenEndedFoundation,
  calculateSingaporeExamReadiness,
  classifyExamQuestion,
  detectExamTechniqueIssues,
  diagnoseWordProblemIssue,
  evaluateWorkingQualityRubric,
  scoreMethodMarks,
  trackHeuristicProgress,
  validateFractionExamReadinessEngine,
} from './fractionExamReadinessEngine.js';

describe('Sprint 7 Singapore exam readiness engine', () => {
  it('classifies exam questions by type, cognitive demand and marks', () => {
    const classified = classifyExamQuestion({
      skillId: 'F026',
      questionFamilyId: 'QF_F026_003',
      stem: 'Explain how to solve this multi-step remainder problem.',
      marks: 3,
    });

    expect(classified.questionType).toBe(EXAM_QUESTION_TYPES.OPEN_ENDED_EXPLANATION);
    expect(classified.cognitiveDemand.level).toBeGreaterThanOrEqual(4);
    expect(classified.estimatedMarks).toBe(3);
  });

  it('stores method marks separately from final-answer marks', () => {
    const structure = buildMethodMarkStructure({ questionFamilyId: 'QF_F026_003', marks: 3 });
    const score = scoreMethodMarks({
      question: { questionFamilyId: 'QF_F026_003', marks: 3 },
      methodCorrect: true,
      finalAnswerCorrect: false,
      multiStepSuccess: [true, true, false],
    });

    expect(structure.supportsPartialCredit).toBe(true);
    expect(score.methodScore).toBeGreaterThan(0);
    expect(score.finalAnswerScore).toBe(0);
    expect(score.cases.correctMethodWrongFinal).toBe(true);
  });

  it('evaluates working quality and multi-step reasoning', () => {
    const working = evaluateWorkingQualityRubric({
      completeness: 80,
      organisation: 70,
      logicalFlow: 75,
      stepAccuracy: 65,
      evidenceOfReasoning: 70,
    });
    const reasoning = analyzeMultiStepReasoning({
      steps: [
        { stepId: 'read', correct: true },
        { stepId: 'unit', correct: false },
        { stepId: 'answer', correct: false },
      ],
    });

    expect(working.indicators).toHaveProperty('logicalFlow');
    expect(working.workingQualityScore).toBeGreaterThan(0);
    expect(reasoning.failedEarlyStep).toBe(true);
    expect(reasoning.failedFinalStep).toBe(true);
  });

  it('tracks Singapore Math heuristics and word-problem issues', () => {
    const heuristics = trackHeuristicProgress([
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

    expect(heuristics.find((h) => h.heuristicId === 'working_backwards').status).toBe('needs_practice');
    expect(word.issues).toEqual(expect.arrayContaining(['reading_issue', 'representation_issue', 'strategy_issue', 'interpretation_issue']));
  });

  it('provides Science and English open-ended foundations without AI marking', () => {
    const science = buildOpenEndedFoundation({ subject: 'science', response: { conceptAccuracy: 70, keywordUsage: 60, explanationQuality: 65, reasoningQuality: 55, evidenceUsage: 50 } });
    const english = buildOpenEndedFoundation({ subject: 'english', response: { inference: 70, evidenceSelection: 60, explanationQuality: 65, vocabulary: 55, organisation: 75 } });

    expect(science).toHaveProperty('conceptAccuracy');
    expect(english).toHaveProperty('inference');
    expect(science.aiMarkingRequired).toBe(false);
    expect(english.aiMarkingRequired).toBe(false);
  });

  it('detects exam technique, timing and confidence-performance patterns', () => {
    const technique = detectExamTechniqueIssues({ missingUnits: true, incompleteExplanation: true });
    const timing = analyzeTimeManagement([{ timeTaken: 240, estimatedMarks: 2 }, { timeTaken: 10, estimatedMarks: 1, correct: false }], { targetSecondsPerMark: 90 });
    const confidence = analyzeConfidenceVsExamPerformance({ confidence: 'Very confident', methodScore: 0, finalAnswerScore: 0, reasoningScore: 0.4 });

    expect(technique.indicators).toContain('missing_units');
    expect(['over_investing_time', 'rushing', 'balanced']).toContain(timing.insight);
    expect(confidence.pattern).toBe('confident_but_poor_reasoning');
  });

  it('builds transparent exam readiness report, pages and timeline', () => {
    const readiness = calculateSingaporeExamReadiness({
      knowledge: 80,
      fluency: 70,
      application: 55,
      reasoning: 52,
      examTechnique: 60,
      confidence: 75,
      retention: 70,
      workingQuality: 72,
    });
    const timeline = buildExamReadinessTimeline([{ growthArea: 'reasoning', before: 40, after: 52 }]);
    const report = buildExamReadinessReport({
      dimensions: readiness.dimensions,
      reasoningGaps: ['multi-step reasoning'],
      heuristicWeaknesses: ['working_backwards'],
      examTechniqueIssues: ['missing_units'],
      timeline,
    });
    const pages = buildExamReadinessPages(report);

    expect(readiness.noBlackBox).toBe(true);
    expect(report.transparent).toBe(true);
    expect(timeline[0].growthArea).toBe('reasoning');
    expect(pages.student.upcomingFocusAreas.length).toBeGreaterThan(0);
    expect(pages.teacher.groupingRecommendations[0]).toMatchObject({ focus: 'working_backwards' });
  });

  it('passes the built-in validator', () => {
    expect(validateFractionExamReadinessEngine().isValid).toBe(true);
  });
});
