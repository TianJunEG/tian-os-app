import { describe, expect, it } from 'vitest';
import {
  buildRetentionReviews,
  calculateFluencyMetrics,
  calculateFluencyScore,
  classifyFluencyBuckets,
  fluencyStatusFromScore,
  FLUENCY_STATUS,
} from './fluencyEngine.js';

describe('fluencyEngine', () => {
  it('calculates a 0-100 fluency score from accuracy, speed, and confidence', () => {
    const result = calculateFluencyScore({
      accuracy: 95,
      averageTimeSeconds: 8,
      confidenceAverage: 100,
      targetSeconds: 10,
    });

    expect(result.fluencyScore).toBe(97);
    expect(result.fluencyStatus).toBe(FLUENCY_STATUS.FLUENT);
    expect(result.components).toEqual({ accuracy: 95, speed: 100, confidence: 100 });
  });

  it('applies automaticity thresholds', () => {
    expect(fluencyStatusFromScore(59.9)).toBe(FLUENCY_STATUS.NOT_FLUENT);
    expect(fluencyStatusFromScore(60)).toBe(FLUENCY_STATUS.DEVELOPING);
    expect(fluencyStatusFromScore(84.9)).toBe(FLUENCY_STATUS.DEVELOPING);
    expect(fluencyStatusFromScore(85)).toBe(FLUENCY_STATUS.FLUENT);
  });

  it('includes skipped questions and working submissions in session metrics', () => {
    const metrics = calculateFluencyMetrics({
      skillCode: 'F001',
      targetSeconds: 10,
      attempts: [
        { answer: '1/2', correct: true, timeTakenSeconds: 8, confidence: 'high' },
        { answer: '2/3', correct: false, timeTakenSeconds: 15, confidence: 'not sure', workingSubmitted: true },
        { skipped: true, timeTakenSeconds: 20, confidence: 'low' },
      ],
    });

    expect(metrics.totalQuestions).toBe(3);
    expect(metrics.correctAnswers).toBe(1);
    expect(metrics.accuracy).toBe(33.3);
    expect(metrics.averageTimeSeconds).toBe(11.5);
    expect(metrics.workingSubmissionRate).toBe(33.3);
    expect(metrics.skippedQuestions).toBe(1);
    expect(metrics.fluencyStatus).toBe(FLUENCY_STATUS.NOT_FLUENT);
  });

  it('schedules day 3, 7, 14, and 30 retention reviews after fluency', () => {
    const fluentAt = new Date('2026-06-04T00:00:00.000Z');
    const reviews = buildRetentionReviews({
      studentId: 'student-1',
      skillId: 'skill-1',
      skillCode: 'F001',
      fluentAt,
    });

    expect(reviews.map((review) => review.intervalDays)).toEqual([3, 7, 14, 30]);
    expect(reviews.map((review) => review.reviewDate.toISOString().slice(0, 10))).toEqual([
      '2026-06-07',
      '2026-06-11',
      '2026-06-18',
      '2026-07-04',
    ]);
    expect(reviews.every((review) => review.completed === false && review.retained === false)).toBe(true);
  });

  it('returns student API bucket shapes with interpretations', () => {
    const summary = classifyFluencyBuckets([
      { skillId: 'a', skillCode: 'F001', skillName: 'Recognise Fractions', fluencyStatus: 'fluent', fluencyScore: 90, accuracy: 95, averageTimeSeconds: 7 },
      { skillId: 'b', skillCode: 'F010', skillName: 'Equivalent Fractions', fluencyStatus: 'developing', fluencyScore: 72, accuracy: 92, averageTimeSeconds: 18 },
      { skillId: 'c', skillCode: 'F003', skillName: 'Fraction of a Set', fluencyStatus: 'not_fluent', fluencyScore: 45, accuracy: 50, averageTimeSeconds: 22 },
    ]);

    expect(summary.fluentSkills).toHaveLength(1);
    expect(summary.developingSkills[0]).toMatchObject({
      skillId: 'b',
      skillCode: 'F010',
      skillName: 'Equivalent Fractions',
      fluencyStatus: 'developing',
    });
    expect(summary.developingSkills[0].interpretation).toContain('understands the concept');
    expect(summary.needsPracticeSkills[0].interpretation).toContain('accurate practice');
  });
});
