import { describe, expect, it } from 'vitest';
import {
  METHOD_MARK_BANDS_V3,
  REASONING_LEVELS,
  applyReasoningHumanReviewOverride,
  buildTeacherReasoningInsight,
  runReasoningMethodMarkAnalysis,
  updateReasoningProgression,
  validateReasoningMethodMarkEngine,
} from '../services/mathpath/reasoningMethodMarkEngine.js';

function strongRecord() {
  return {
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
}

describe('reasoningMethodMarkEngine', () => {
  it('scores transparent reasoning rubric dimensions', () => {
    const analysis = runReasoningMethodMarkAnalysis(strongRecord(), { questionMetadata: { estimatedMarks: 3 } });

    expect(Object.keys(analysis.reasoningRubric.dimensions)).toEqual([
      'representation',
      'strategySelection',
      'logicalProgression',
      'mathematicalAccuracy',
      'explanationQuality',
      'completion',
    ]);
    expect([REASONING_LEVELS.COMPETENT, REASONING_LEVELS.STRONG, REASONING_LEVELS.ADVANCED]).toContain(analysis.reasoningRubric.reasoningLevel);
  });

  it('recommends method-mark evidence without awarding official marks', () => {
    const analysis = runReasoningMethodMarkAnalysis(strongRecord(), { questionMetadata: { estimatedMarks: 3 } });

    expect(analysis.methodMarkV3.methodMarkRecommendation).toBe(METHOD_MARK_BANDS_V3.STRONG);
    expect(analysis.methodMarkV3.officialMarksAwarded).toBe(false);
    expect(analysis.methodMarkV3.rationale.length).toBeGreaterThan(1);
  });

  it('sees correct representation with wrong final answer as partial-credit evidence', () => {
    const record = strongRecord();
    record.methodEvidence = {
      ...record.methodEvidence,
      methodEvidenceScore: 74,
      finalAnswerQuality: 'incorrect',
    };
    record.failurePoint = { failureType: 'final_answer_only_mistake', failureLocation: { stepNumber: 4 } };
    const analysis = runReasoningMethodMarkAnalysis(record, { questionMetadata: { estimatedMarks: 3 } });

    expect(analysis.partialCredit.partialCreditRecommendation).toMatch(/partial_credit/);
    expect(analysis.studentReasoningFeedback).toContain('represented the problem well');
  });

  it('builds adult insights and exam readiness indicators', () => {
    const analysis = runReasoningMethodMarkAnalysis(strongRecord(), {
      questionMetadata: { estimatedMarks: 3 },
      examReadiness: { knowledge: 80, fluency: 70, retention: 75, confidenceSignal: 60 },
    });

    expect(analysis.parentReasoningInsight.reasoningStrengths.length).toBeGreaterThan(0);
    expect(analysis.tutorReasoningInsight.strategySelection.strategyStatus).toBeTruthy();
    expect(analysis.examReadinessIndicators.indicators.map((row) => row.label)).toEqual(expect.arrayContaining(['Reasoning', 'Method Evidence']));
  });

  it('supports teacher trend summaries and progression tracking', () => {
    const first = runReasoningMethodMarkAnalysis({ ...strongRecord(), methodEvidence: { methodEvidenceScore: 35, finalAnswerQuality: 'incorrect', methodEvidenceDetails: {} } });
    const second = runReasoningMethodMarkAnalysis(strongRecord());
    const progression = updateReasoningProgression([{
      timestamp: '2026-01-01T00:00:00.000Z',
      reasoningScore: first.reasoningRubric.overallScore,
      representationScore: first.reasoningRubric.dimensions.representation,
      methodEvidenceScore: first.methodEvidence.methodEvidenceScore,
    }], second, '2026-06-01T00:00:00.000Z');

    expect(buildTeacherReasoningInsight([first, second]).classReasoningTrends.length).toBeGreaterThan(0);
    expect(progression.trend.reasoningQualityImproved).toBe(true);
  });

  it('stores human review override and dataset readiness', () => {
    const analysis = runReasoningMethodMarkAnalysis(strongRecord());
    const reviewed = applyReasoningHumanReviewOverride(analysis, { action: 'accept', reviewerUserId: 'teacher_1' });

    expect(reviewed.humanValidation.accepted).toBe(true);
  });

  it('passes the built-in validator', () => {
    const validation = validateReasoningMethodMarkEngine();

    expect(validation.completed).toBe(true);
    expect(Object.values(validation.checks).every(Boolean)).toBe(true);
  });
});

