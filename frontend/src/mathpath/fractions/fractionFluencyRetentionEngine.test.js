import { describe, expect, it } from 'vitest';
import {
  FLUENCY_STATES,
  RETENTION_STATES,
  analyzeConfidenceVsFluency,
  analyzeWorkingDependence,
  buildFluencyDrillPack,
  buildFluencyRetentionDashboards,
  buildSkillTimingHistory,
  buildSpacedReviewSchedule,
  calculateExamReadiness,
  calculateQuestionTiming,
  calculateSkillFluencyProfile,
  detectForgetting,
  evaluateAccuracyConsistency,
  evaluateRetentionStatus,
  generateRetentionReview,
  getFluencyBenchmark,
  recommendFluencyIntervention,
  validateFractionFluencyRetentionEngine,
} from './fractionFluencyRetentionEngine.js';
import { validateFractionRetentionEngine } from './fractionRetentionEngine.js';

describe('Sprint 6 fluency and retention engine', () => {
  const attempts = [
    { skillId: 'F010', questionFamilyId: 'QF_F010_001', questionId: 'q1', sessionId: 'a', correct: true, timeTaken: 32, confidence: 'Confident', workingUploaded: true, workingStrokes: [1, 2, 3] },
    { skillId: 'F010', questionFamilyId: 'QF_F010_002', questionId: 'q2', sessionId: 'a', correct: true, timeTaken: 28, confidence: 'Confident', workingUploaded: true, workingStrokes: [1, 2] },
    { skillId: 'F010', questionFamilyId: 'QF_F010_003', questionId: 'q3', sessionId: 'b', correct: true, timeTaken: 18, confidence: 'Very Confident', workingUploaded: false },
    { skillId: 'F010', questionFamilyId: 'QF_F010_004', questionId: 'q4', sessionId: 'b', correct: true, timeTaken: 16, confidence: 'Very Confident', workingUploaded: false },
    { skillId: 'F010', questionFamilyId: 'QF_F010_005', questionId: 'q5', sessionId: 'c', correct: true, timeTaken: 14, confidence: 'Very Confident', workingUploaded: false },
  ];

  it('calculates raw, effective, total and review timing', () => {
    const timing = calculateQuestionTiming({
      questionStartedAt: '2026-01-01T00:00:00.000Z',
      answerSubmittedAt: '2026-01-01T00:00:20.000Z',
      workingSubmittedAt: '2026-01-01T00:00:25.000Z',
      reviewEndedAt: '2026-01-01T00:00:35.000Z',
    });

    expect(timing.effectiveAnswerTimeSeconds).toBe(20);
    expect(timing.workingTimeSeconds).toBe(25);
    expect(timing.reviewTimeSeconds).toBe(15);
    expect(timing.totalQuestionTimeSeconds).toBe(40);
  });

  it('builds benchmarks and a separate fluency profile', () => {
    const benchmark = getFluencyBenchmark({ skillId: 'F010', level: 'P4', difficulty: 2 });
    const profile = calculateSkillFluencyProfile({ skillId: 'F010', attempts, level: 'P4', difficulty: 2 });

    expect(benchmark.developingSeconds).toBeGreaterThan(benchmark.fluentSeconds);
    expect(profile.masteryScoreSeparate).toBe(true);
    expect(Object.values(FLUENCY_STATES)).toContain(profile.fluencyState);
    expect(profile.workingDependence.trend).toBe('reducing_working');
  });

  it('evaluates working dependence and accuracy consistency', () => {
    const dependence = analyzeWorkingDependence(attempts);
    const consistency = evaluateAccuracyConsistency(attempts);

    expect(dependence.workingFrequency).toBe(2);
    expect(consistency.multiSessionSuccess).toBe(true);
    expect(consistency.variantSuccess).toBe(true);
  });

  it('creates fluency drill recommendations instead of concept remediation when accuracy is strong but speed is developing', () => {
    const profile = calculateSkillFluencyProfile({ skillId: 'F010', attempts, level: 'P4', difficulty: 2 });
    const recommendation = recommendFluencyIntervention({ ...profile, fluencyState: FLUENCY_STATES.DEVELOPING, accuracyRate: 90 });
    const drill = buildFluencyDrillPack({ skillId: 'F010' });

    expect(recommendation.interventionType).toBe('fluency_drill_pack');
    expect(drill.mode).toBe('fluency_drill');
    expect(drill.timeTrackingRequired).toBe(true);
  });

  it('schedules retention and generates different review questions', () => {
    const schedule = buildSpacedReviewSchedule({ skillId: 'F010', masteredAt: '2026-01-01T00:00:00.000Z' });
    const status = evaluateRetentionStatus({ skillId: 'F010', masteredAt: '2026-01-01T00:00:00.000Z', asOf: '2026-01-08T00:00:00.000Z' });
    const review = generateRetentionReview({ skillId: 'F010', previousQuestionIds: ['QF_F010_001'] });

    expect(schedule.reviews.map((r) => r.intervalDays)).toEqual([1, 7, 30, 90, 180]);
    expect(status.retentionState).toBe(RETENTION_STATES.REVIEW_DUE);
    expect(review.questionFamilyIds).not.toContain('QF_F010_001');
  });

  it('detects forgetting from recent decline after prior mastery', () => {
    const alerts = detectForgetting({
      masteredSkillIds: ['F010'],
      recentAttempts: [
        { skillId: 'F010', correct: false, sessionId: 'r1', questionFamilyId: 'QF_F010_001' },
        { skillId: 'F010', correct: false, sessionId: 'r1', questionFamilyId: 'QF_F010_002' },
        { skillId: 'F010', correct: true, sessionId: 'r2', questionFamilyId: 'QF_F010_003' },
      ],
    });

    expect(alerts[0].alertType).toBe('forgetting_detected');
  });

  it('combines confidence, fluency and exam readiness transparently', () => {
    const profile = calculateSkillFluencyProfile({ skillId: 'F010', attempts, level: 'P4', difficulty: 2 });
    const confidence = analyzeConfidenceVsFluency({ ...profile, averageResponseTime: profile.benchmark.secureSeconds + 10, confidenceAverage: 90, accuracyRate: 90 });
    const exam = calculateExamReadiness({ knowledgeScore: 85, fluencyScore: profile.fluencyScore, confidenceScore: 90, retentionScore: 70, workingEvidenceScore: 80 });

    expect(confidence.pattern).toBe('overconfident_but_slow');
    expect(exam.transparent).toBe(true);
    expect(exam.components).toHaveProperty('retention');
  });

  it('builds student, parent, tutor and teacher fluency dashboard payloads', () => {
    const profile = calculateSkillFluencyProfile({ skillId: 'F010', attempts, level: 'P4', difficulty: 2 });
    const dashboards = buildFluencyRetentionDashboards({
      profiles: [profile],
      retentionStatuses: [evaluateRetentionStatus({ skillId: 'F010', masteredAt: '2026-01-01T00:00:00.000Z', asOf: '2026-01-08T00:00:00.000Z' })],
    });

    expect(dashboards.student.retentionReviewsDue.length).toBeGreaterThan(0);
    expect(dashboards.parent.upcomingReviews.length).toBeGreaterThan(0);
    expect(dashboards.tutor.suggestedInterventions.length).toBe(1);
    expect(dashboards.teacher.groupingRecommendations.length).toBeGreaterThan(0);
  });

  it('passes built-in validators and preserves legacy retention validator', () => {
    expect(buildSkillTimingHistory(attempts).F010.samples.length).toBe(5);
    expect(validateFractionFluencyRetentionEngine().isValid).toBe(true);
    expect(validateFractionRetentionEngine().isValid).toBe(true);
  });
});
