import { describe, expect, it } from 'vitest';
import {
  FLUENCY_STATES,
  RETENTION_STATES,
  analyzeConfidenceVsFluency,
  analyzeWorkingDependence,
  buildFluencyDrillPack,
  buildFluencyRetentionDashboards,
  buildRetentionScheduleFromFluency,
  buildSkillTimingHistory,
  buildSpacedReviewSchedule,
  buildTimedPracticeSession,
  calculateAutomaticFluencyScore,
  calculateExamReadiness,
  calculateQuestionTiming,
  calculateSkillFluencyProfile,
  detectMentalCalculation,
  detectForgetting,
  evaluateAccuracyConsistency,
  evaluateRetentionStatus,
  generateRetentionReview,
  getFluencyBenchmark,
  recommendFluencyIntervention,
  trackSpeedProgress,
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
    const timedPractice = buildTimedPracticeSession({ skillId: 'F010', currentFluencyState: FLUENCY_STATES.DEVELOPING });

    expect(recommendation.interventionType).toBe('fluency_drill_pack');
    expect(drill.mode).toBe('fluency_drill');
    expect(drill.timeTrackingRequired).toBe(true);
    expect(timedPractice.mode).toBe('timed_fluency_practice');
    expect(timedPractice.timerVisible).toBe(true);
    expect(timedPractice.perQuestionTargetSeconds).toBeGreaterThan(0);
  });

  it('scores automatic fluency separately from correctness', () => {
    const automaticScore = calculateAutomaticFluencyScore({
      accuracyRate: 100,
      averageResponseTime: 8,
      benchmark: { secureSeconds: 20, automaticSeconds: 10 },
      consistencyScore: 90,
      mentalCalculation: { detected: true, mentalCalculationRate: 100 },
      workingDependence: { dependenceLevel: 'mental_or_automatic' },
      confidenceAverage: 90,
    });
    const slowCorrectScore = calculateAutomaticFluencyScore({
      accuracyRate: 100,
      averageResponseTime: 42,
      benchmark: { secureSeconds: 20, automaticSeconds: 10 },
      consistencyScore: 90,
      mentalCalculation: { detected: false, mentalCalculationRate: 0 },
      workingDependence: { dependenceLevel: 'high_working_dependence' },
      confidenceAverage: 90,
    });

    expect(automaticScore.automaticityBand).toBe(FLUENCY_STATES.AUTOMATIC);
    expect(automaticScore.automaticFluencyScore).toBeGreaterThan(slowCorrectScore.automaticFluencyScore);
  });

  it('detects mental calculation from fast correct answers without working', () => {
    const mentalAttempts = [
      { skillId: 'F010', questionFamilyId: 'QF_F010_001', correct: true, timeTaken: 8, mentalMathEligible: true, workingUploaded: false },
      { skillId: 'F010', questionFamilyId: 'QF_F010_002', correct: true, timeTaken: 9, mentalMathEligible: true, workingUploaded: false },
      { skillId: 'F010', questionFamilyId: 'QF_F010_003', correct: true, timeTaken: 10, mentalMathEligible: true, workingUploaded: false },
      { skillId: 'F010', questionFamilyId: 'QF_F010_004', correct: true, timeTaken: 11, mentalMathEligible: true, workingUploaded: false },
    ];

    const detection = detectMentalCalculation({ attempts: mentalAttempts, benchmark: { fluentSeconds: 12 } });

    expect(detection.detected).toBe(true);
    expect(detection.mentalCalculationRate).toBe(100);
    expect(detection.evidence).toBe('fast_correct_answers_without_working');
  });

  it('tracks speed improvement and personal bests over attempts', () => {
    const speed = trackSpeedProgress({
      attempts: [
        { correct: true, timeTaken: 40, timestamp: '2026-01-01T00:00:00.000Z' },
        { correct: true, timeTaken: 36, timestamp: '2026-01-02T00:00:00.000Z' },
        { correct: true, timeTaken: 22, timestamp: '2026-01-03T00:00:00.000Z' },
        { correct: true, timeTaken: 18, timestamp: '2026-01-04T00:00:00.000Z' },
      ],
    });

    expect(speed.speedTrend).toBe('improving');
    expect(speed.personalBestSeconds).toBe(18);
    expect(speed.speedImprovementPercent).toBeGreaterThan(10);
  });

  it('schedules retention and generates different review questions', () => {
    const schedule = buildSpacedReviewSchedule({ skillId: 'F010', masteredAt: '2026-01-01T00:00:00.000Z' });
    const status = evaluateRetentionStatus({ skillId: 'F010', masteredAt: '2026-01-01T00:00:00.000Z', asOf: '2026-01-08T00:00:00.000Z' });
    const review = generateRetentionReview({ skillId: 'F010', previousQuestionIds: ['QF_F010_001'] });
    const fluencySchedule = buildRetentionScheduleFromFluency({
      profile: {
        skillId: 'F010',
        fluencyState: FLUENCY_STATES.AUTOMATIC,
        automaticFluencyScore: 94,
        benchmark: { fluentSeconds: 12, automaticSeconds: 8 },
      },
      masteredAt: '2026-01-01T00:00:00.000Z',
    });

    expect(schedule.reviews.map((r) => r.intervalDays)).toEqual([1, 7, 30, 90, 180]);
    expect(status.retentionState).toBe(RETENTION_STATES.REVIEW_DUE);
    expect(review.questionFamilyIds).not.toContain('QF_F010_001');
    expect(fluencySchedule.shouldSchedule).toBe(true);
    expect(fluencySchedule.reviews[0].reviewMode).toBe('speed_accuracy_retention');
    expect(fluencySchedule.reviews[0].targetSeconds).toBe(12);
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
