import { describe, expect, it } from 'vitest';
import {
  buildRecoveryPackQueue,
  buildRecheckQueue,
  buildStudentCareAttentionQueue,
} from '../services/studentCare/studentCareAttentionEngine.js';

const now = new Date('2026-06-06T00:00:00.000Z');

describe('studentCareAttentionEngine', () => {
  const students = [
    { _id: 'student_1', name: 'Sarah' },
    { _id: 'student_2', name: 'Daniel' },
    { _id: 'student_3', name: 'Amelia' },
  ];

  it('ranks students needing attention by operational priority', () => {
    const queue = buildStudentCareAttentionQueue({
      students,
      now,
      evidenceByStudent: {
        student_1: {
          assignments: [{ _id: 'a1', title: 'Fractions Recovery Pack', status: 'completed', recheck: { recommended: true, recommendedAt: '2026-06-01T00:00:00.000Z' } }],
          growth: { remainingWeakSkills: ['F015'], latest: { completedAt: '2026-06-05T00:00:00.000Z' } },
        },
        student_2: {
          assignments: [{ _id: 'a2', title: 'Word Problems Pack', status: 'in_progress', updatedAt: '2026-06-05T00:00:00.000Z' }],
          growth: { remainingWeakSkills: ['F023', 'F024', 'F025'], latest: { completedAt: '2026-06-05T00:00:00.000Z' } },
        },
        student_3: {
          assignments: [],
          papers: [{ _id: 'p1', status: 'needs_review', updatedAt: '2026-06-05T00:00:00.000Z' }],
          growth: { remainingWeakSkills: [], latest: { completedAt: '2026-06-05T00:00:00.000Z' } },
        },
      },
    });

    expect(queue[0]).toMatchObject({ studentId: 'student_1', priority: 'high', type: 'recheck_overdue' });
    expect(queue[1]).toMatchObject({ studentId: 'student_2', priority: 'high', type: 'recovery_pack_incomplete' });
    expect(queue[2]).toMatchObject({ studentId: 'student_3', priority: 'medium', type: 'paper_needs_review' });
  });

  it('builds recovery pack and recheck queues', () => {
    const assignments = [
      { _id: 'a1', studentId: 'student_1', title: 'Fractions Recovery Pack', status: 'completed', targetQuestionCount: 15, completion: { questionsAttempted: 15, accuracy: 82 }, recheck: { recommended: true, recommendedAt: '2026-06-05T00:00:00.000Z' } },
      { _id: 'a2', studentId: 'student_2', title: 'Word Problems Pack', status: 'in_progress', targetQuestionCount: 15, completion: { questionsAttempted: 4, accuracy: 50 } },
    ];

    const recovery = buildRecoveryPackQueue({ students, assignments });
    const rechecks = buildRecheckQueue({ students, assignments, now });

    expect(recovery[0]).toMatchObject({ studentName: 'Sarah', status: 'recheck_ready', accuracy: 82 });
    expect(recovery[1]).toMatchObject({ studentName: 'Daniel', status: 'in_progress' });
    expect(rechecks).toHaveLength(1);
    expect(rechecks[0]).toMatchObject({ studentName: 'Sarah', status: 'recheck_ready' });
  });
});
