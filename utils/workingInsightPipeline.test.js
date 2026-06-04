import { describe, expect, it } from 'vitest';
import {
  applyWorkingInsightToRecord,
  qualityBandFromScore,
  runWorkingInsightPipeline,
} from '../services/mathpath/workingInsightPipeline.js';

describe('workingInsightPipeline', () => {
  it('generates a standard working insight with quality scoring', () => {
    const record = {
      workingId: 'working_1',
      workingSessionId: 'work_1',
      attemptId: 'attempt_1',
      sessionId: 'practice_1',
      studentId: 'student_1',
      questionId: 'q1',
      skillId: 'F018',
      answerGiven: '2/6',
      correctAnswer: '3/4',
      answerCorrect: false,
      confidenceLevel: 'i_know_this',
      ocrOutput: { rawText: '1/2 + 1/4 = 2/6', confidence: { score: 0.7 } },
      detectedSteps: [{ stepNumber: 1, text: '1/2 + 1/4 = 2/6' }],
    };

    const pipeline = runWorkingInsightPipeline(record, {
      question: 'Add 1/2 and 1/4.',
      correctAnswer: '3/4',
      expectedStepCount: 2,
      expectedOperations: ['common denominator', 'add numerators'],
    });
    const updated = applyWorkingInsightToRecord(record, pipeline);

    expect(updated.workingInsight).toMatchObject({
      workingId: 'working_1',
      attemptId: 'attempt_1',
      sessionId: 'practice_1',
      questionId: 'q1',
      skillCode: 'F018',
      answerGiven: '2/6',
      correctAnswer: '3/4',
      answerCorrect: false,
    });
    expect(updated.workingQualityScore).toBeGreaterThanOrEqual(0);
    expect(['EXCELLENT', 'GOOD', 'PARTIAL', 'INSUFFICIENT']).toContain(updated.qualityBand);
    expect(updated.workingInsight.studentExplanation).toBeTruthy();
  });

  it('maps quality scores to required bands', () => {
    expect(qualityBandFromScore(90)).toBe('EXCELLENT');
    expect(qualityBandFromScore(70)).toBe('GOOD');
    expect(qualityBandFromScore(45)).toBe('PARTIAL');
    expect(qualityBandFromScore(20)).toBe('INSUFFICIENT');
  });
});
