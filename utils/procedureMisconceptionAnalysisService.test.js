import { describe, expect, it } from 'vitest';
import {
  MISCONCEPTION_LIBRARY_V1,
  PROCEDURE_STATUSES,
  applyHumanReviewAssistDecision,
  buildAccuracyAuditReport,
  buildTeacherInsight,
  detectProcedurePatterns,
  runProcedureMisconceptionAnalysis,
  validateProcedureMisconceptionEngine,
} from '../services/mathpath/procedureMisconceptionAnalysisService.js';

describe('procedureMisconceptionAnalysisService', () => {
  it('ships a multi-domain misconception library', () => {
    expect(MISCONCEPTION_LIBRARY_V1.map((m) => m.misconceptionId)).toEqual(expect.arrayContaining([
      'FRAC_DENOM_LARGER_VALUE',
      'DEC_LONGER_IS_LARGER',
      'PCT_FRACTION_CONFUSION',
      'RATIO_PART_PART_PART_WHOLE',
      'WHOLE_OPERATION_SELECTION',
    ]));
  });

  it('analyses procedure, failure point, method evidence, and misconception', () => {
    const analysis = runProcedureMisconceptionAnalysis({
      ocrOutput: { rawText: 'Compare denominator. 1/5 is bigger than 1/3 because 5 is bigger.' },
      detectedSteps: [
        { stepNumber: 1, text: 'Compare denominator.' },
        { stepNumber: 2, text: '1/5 is bigger than 1/3 because 5 is bigger.' },
      ],
      datasetRecord: { question: 'Which is larger, 1/5 or 1/3?' },
    }, {
      answerCorrect: false,
      studentAnswer: '1/5',
      correctAnswer: '1/3',
      questionType: 'fraction_comparison',
      expectedStepCount: 2,
      expectedProcedureKeywords: ['same numerator', 'denominator'],
    });

    expect(analysis.procedureAnalysis.procedureStatus).not.toBe(PROCEDURE_STATUSES.SKIPPED);
    expect(analysis.failurePoint.failureType).toBeTruthy();
    expect(analysis.methodEvidence.methodEvidenceScore).toBeGreaterThanOrEqual(0);
    expect(analysis.misconceptionDetection.primaryMisconception.misconceptionId).toBe('FRAC_DENOM_LARGER_VALUE');
    expect(analysis.studentFeedback).toContain('larger denominator');
  });

  it('separates method quality from final answer quality', () => {
    const analysis = runProcedureMisconceptionAnalysis({
      ocrOutput: { rawText: 'common denominator 6\n1/3 = 2/6\n1/2 = 3/6\nanswer 4/6' },
      detectedSteps: [
        { stepNumber: 1, text: 'common denominator 6' },
        { stepNumber: 2, text: '1/3 = 2/6' },
        { stepNumber: 3, text: '1/2 = 3/6' },
        { stepNumber: 4, text: 'answer 4/6' },
      ],
    }, {
      answerCorrect: false,
      studentAnswer: '4/6',
      correctAnswer: '5/6',
      expectedOperations: ['='],
      estimatedMarks: 3,
    });

    expect(analysis.methodEvidence.methodQuality).toMatch(/strong|developing/);
    expect(analysis.methodEvidence.finalAnswerQuality).toBe('incorrect');
    expect(analysis.methodMark.methodMarkPotential).toBeGreaterThan(0);
  });

  it('detects repeated patterns and teacher clusters', () => {
    const rows = [
      runProcedureMisconceptionAnalysis({ ocrOutput: { rawText: 'larger denominator means bigger' }, detectedSteps: [{ stepNumber: 1, text: 'larger denominator means bigger' }] }, { answerCorrect: false }),
      runProcedureMisconceptionAnalysis({ ocrOutput: { rawText: 'bigger bottom number so bigger fraction' }, detectedSteps: [{ stepNumber: 1, text: 'bigger bottom number so bigger fraction' }] }, { answerCorrect: false }),
    ];

    expect(detectProcedurePatterns(rows).some((p) => p.patternId === 'FRAC_DENOM_LARGER_VALUE')).toBe(true);
    expect(buildTeacherInsight(rows).classMisconceptionClusters[0].count).toBe(2);
  });

  it('stores human assist decisions and audit metrics', () => {
    const analysis = runProcedureMisconceptionAnalysis({ ocrOutput: { rawText: '1/2 + 1/3 = 2/5' }, detectedSteps: [{ stepNumber: 1, text: '1/2 + 1/3 = 2/5' }] }, { answerCorrect: false });
    const reviewed = applyHumanReviewAssistDecision(analysis, { action: 'accept', reviewerUserId: 't1', verified: true });
    const audit = buildAccuracyAuditReport([{ ...reviewed, humanReviewOutcome: reviewed.humanReviewOutcome }]);

    expect(reviewed.humanReviewOutcome.accepted).toBe(true);
    expect(audit.humanAcceptanceRate).toBe(100);
  });

  it('passes the built-in validator', () => {
    const validation = validateProcedureMisconceptionEngine();

    expect(validation.completed).toBe(true);
    expect(Object.values(validation.checks).every(Boolean)).toBe(true);
  });
});

