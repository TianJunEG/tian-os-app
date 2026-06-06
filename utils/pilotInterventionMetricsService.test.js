import { describe, expect, it } from 'vitest';
import {
  buildPilotInterventionMetrics,
  getStudentsNeedingAttentionFromData,
} from '../services/mathpath/pilotInterventionMetricsService.js';

const now = new Date('2026-06-06T12:00:00.000Z');

function daysAgo(days) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

describe('pilotInterventionMetricsService', () => {
  it('calculates intervention funnel, growth, assignment, recheck and paper metrics', () => {
    const metrics = buildPilotInterventionMetrics({
      students: [
        { _id: 'student_1', name: 'Jas' },
        { _id: 'student_2', name: 'Min' },
      ],
      diagnostics: [
        {
          studentId: 'student_1',
          diagnosticSessionId: 'baseline_1',
          status: 'completed',
          isBaseline: true,
          readinessScore: 40,
          completedAt: daysAgo(20),
          perSkillSnapshot: [{ skillId: 'F015', score: 30 }],
        },
        {
          studentId: 'student_1',
          diagnosticSessionId: 'recheck_1',
          status: 'completed',
          diagnosticPurpose: 'recheck',
          assignmentId: 'assignment_1',
          readinessScore: 78,
          completedAt: daysAgo(1),
          perSkillSnapshot: [{ skillId: 'F015', score: 80 }],
        },
        {
          studentId: 'student_2',
          diagnosticSessionId: 'baseline_2',
          status: 'completed',
          isBaseline: true,
          readinessScore: 50,
          completedAt: daysAgo(15),
        },
      ],
      assignments: [
        {
          _id: 'assignment_1',
          studentId: 'student_1',
          sourceType: 'diagnostic',
          sourceId: 'baseline_1',
          skillIds: ['F015'],
          status: 'completed',
          targetQuestionCount: 10,
          completion: { questionsAttempted: 10, correctCount: 8, accuracy: 80 },
          recheck: { recommended: true, diagnosticSessionId: 'recheck_1' },
          createdAt: daysAgo(10),
        },
        {
          _id: 'assignment_2',
          studentId: 'student_2',
          sourceType: 'paper_analysis',
          sourceId: 'paper_1',
          skillIds: ['F019'],
          status: 'assigned',
          completion: { questionsAttempted: 0, accuracy: 0 },
          createdAt: daysAgo(3),
        },
      ],
      attempts: [
        { studentId: 'student_1', createdAt: daysAgo(2) },
        { studentId: 'student_2', createdAt: daysAgo(3) },
      ],
      papers: [
        {
          _id: 'paper_1',
          studentId: 'student_2',
          status: 'assigned',
          weakSkillIds: ['F019'],
          linkedPracticeAssignmentIds: ['assignment_2'],
          detectedQuestions: [{ misconceptionTags: ['remainder_error'] }],
          createdAt: daysAgo(4),
        },
        { _id: 'paper_2', studentId: 'student_1', status: 'needs_review', weakSkillIds: [], createdAt: daysAgo(1) },
      ],
      mistakes: [
        { studentId: 'student_1', mistakeCode: 'add_denominators', frequency: 2 },
        { studentId: 'student_2', mistakeName: 'Remainder error', frequency: 1 },
      ],
    });

    expect(metrics.funnel.totalStudents).toBe(2);
    expect(metrics.funnel.studentsWithBaselineDiagnostic).toBe(2);
    expect(metrics.funnel.studentsWithRecoveryPackAssigned).toBe(2);
    expect(metrics.funnel.studentsWithRecoveryPackCompleted).toBe(1);
    expect(metrics.funnel.studentsWithRecheckCompleted).toBe(1);
    expect(metrics.growth.averageReadinessImprovement).toBe(38);
    expect(metrics.growth.averageTargetedSkillImprovement).toBe(50);
    expect(metrics.assignments.assignmentCompletionRate).toBe(50);
    expect(metrics.rechecks.recheckCompletionRate).toBe(100);
    expect(metrics.paperAnalysis.paperConversionRate).toBe(50);
    expect(metrics.commonWeakSkills[0]).toEqual({ skillId: 'F019', count: 2 });
    expect(metrics.misconceptions.mostCommonMisconceptions[0]).toEqual({ misconception: 'add_denominators', count: 2 });
  });

  it('ranks students needing attention and detects data quality warnings', () => {
    const diagnostics = [
      {
        studentId: 'student_1',
        diagnosticSessionId: 'baseline_1',
        status: 'completed',
        isBaseline: true,
        readinessScore: 42,
        completedAt: daysAgo(12),
      },
      {
        studentId: 'student_2',
        diagnosticSessionId: 'baseline_2',
        status: 'completed',
        isBaseline: true,
        readinessScore: 70,
        completedAt: daysAgo(14),
      },
    ];
    const assignments = [
      {
        _id: 'assignment_2',
        studentId: 'student_2',
        sourceType: 'diagnostic',
        sourceId: 'baseline_2',
        status: 'assigned',
        completion: { questionsAttempted: 0 },
        createdAt: daysAgo(8),
      },
      {
        _id: 'assignment_bad',
        studentId: 'student_3',
        status: 'assigned',
        completion: { questionsAttempted: 0 },
        createdAt: daysAgo(1),
      },
    ];
    const papers = [{ _id: 'paper_1', studentId: 'student_1', status: 'needs_review', weakSkillIds: [] }];

    const attention = getStudentsNeedingAttentionFromData({
      students: [{ _id: 'student_1', name: 'Jas' }, { _id: 'student_2', name: 'Min' }],
      diagnostics,
      assignments,
      papers,
    });
    const metrics = buildPilotInterventionMetrics({ diagnostics, assignments, papers });

    expect(attention[0]).toMatchObject({
      studentId: 'student_1',
      priority: 'high',
      recommendedAction: 'Assign Recovery Pack',
    });
    expect(attention.some((row) => row.reason.includes('not started after 7 days'))).toBe(true);
    expect(metrics.dataQualityWarnings.some((warning) => warning.type === 'assignment_missing_source')).toBe(true);
    expect(metrics.dataQualityWarnings.some((warning) => warning.type === 'growth_not_yet_measurable')).toBe(true);
  });
});
