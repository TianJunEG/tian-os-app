import { describe, expect, it } from 'vitest';
import {
  buildPracticeMistakeSnapshot,
  buildFractionsPersistedSkillGraphView,
  buildPracticeLifecycleLog,
  practiceAttemptDoc,
  shouldCreatePracticeMistake,
} from '../routes/mastery.js';

describe('MathPath practice persistence helpers', () => {
  it('logs practice persistence status with student and session identity', () => {
    expect(buildPracticeLifecycleLog({
      sessionId: 'practice_1',
      studentId: 'student_1',
      questionId: 'q1',
      attemptSaved: true,
      mistakeCreated: true,
      progressUpdated: true,
      answeredQuestions: 6,
      targetQuestions: 6,
      completionReason: 'target_reached',
    })).toEqual({
      sessionId: 'practice_1',
      studentId: 'student_1',
      questionId: 'q1',
      attemptSaved: true,
      mistakeCreated: true,
      progressUpdated: true,
      answeredQuestions: 6,
      targetQuestions: 6,
      completionReason: 'target_reached',
    });
  });

  it('maps answer, confidence, timing, and working evidence onto MathPathAttempt fields', () => {
    const doc = practiceAttemptDoc({
      studentId: 'student_1',
      sessionId: 'practice_1',
      sessionType: 'practice',
      question: {
        questionId: 'q1',
        skillId: 'F001',
        questionFamilyId: 'QF_F001_001',
        answer: { display: '1/2' },
      },
      result: {
        attemptId: 'attempt_1',
        questionId: 'q1',
        skillId: 'F001',
        questionFamilyId: 'QF_F001_001',
        answer: '1/3',
        studentAnswer: '1/3',
        correctAnswer: '1/2',
        correct: false,
        confidence: 'i_know_this',
        workingSubmitted: true,
        workingOnPaper: true,
        workingNotNeeded: false,
        workingRequirementLevel: 'HIGH',
        workingCode: 'ABCD',
        timeTaken: 12,
        attemptNumber: 1,
      },
    });

    expect(doc).toMatchObject({
      attemptId: 'attempt_1',
      studentId: 'student_1',
      sessionId: 'practice_1',
      questionId: 'q1',
      answer: '1/3',
      answerCorrect: false,
      confidence: 'i_know_this',
      workingSubmitted: true,
      workingOnPaper: true,
      workingNotNeeded: false,
      workingRequirementLevel: 'HIGH',
      timeTaken: 12,
    });
  });

  it('creates mistake snapshots only for wrong persisted practice attempts', () => {
    expect(shouldCreatePracticeMistake({ correct: false })).toBe(true);
    expect(shouldCreatePracticeMistake({ correct: true })).toBe(false);
    expect(shouldCreatePracticeMistake({ correct: false, error: 'invalid' })).toBe(false);

    const snapshot = buildPracticeMistakeSnapshot({
      student: { _id: 'student_object_1', workspaceId: 'workspace_1' },
      sessionId: 'practice_1',
      skillObjectId: 'skill_object_1',
      attempt: { attemptId: 'attempt_1' },
      question: {
        questionId: 'q1',
        skillId: 'F001',
        prompt: 'What fraction is shaded?',
        answer: { display: '1/2' },
        solutionSteps: ['Count shaded parts.', 'Count total parts.'],
      },
      result: {
        questionId: 'q1',
        skillId: 'F001',
        studentAnswer: '1/3',
        correctAnswer: '1/2',
        correct: false,
        confidence: 'i_know_this',
        workingSubmitted: false,
        workingOnPaper: true,
        workingNotNeeded: false,
        workingSessionId: 'working_1',
        workingImage: 'data:image/png;base64,abc',
        workingStrokes: [{ points: [{ x: 1, y: 2 }] }],
        timeTaken: 14,
      },
      mistakeTag: 'practice_error',
    });

    expect(snapshot).toMatchObject({
      studentId: 'student_object_1',
      workspaceId: 'workspace_1',
      questionId: 'q1',
      sessionId: 'practice_1',
      attemptId: 'attempt_1',
      skillCode: 'F001',
      questionText: 'What fraction is shaded?',
      questionStem: 'What fraction is shaded?',
      studentAnswer: '1/3',
      correctAnswer: '1/2',
      answerCorrect: false,
      confidence: 'i_know_this',
      workingSubmitted: false,
      workingOnPaper: true,
      workingNotNeeded: false,
      workingSessionId: 'working_1',
      workingImage: 'data:image/png;base64,abc',
      timeTaken: 14,
      source: 'practice-incorrect',
      status: 'open',
    });
    expect(snapshot.workingStrokes).toHaveLength(1);
  });

  it('builds Fractions progress from persisted MathPath skill states with the full skill denominator', () => {
    const view = buildFractionsPersistedSkillGraphView([
      {
        // Accurate in practice but no recheck yet → counts as in progress, NOT mastered.
        skillId: 'F001',
        status: 'accurate',
        accuracy: 92,
        attemptCount: 4,
        lastPractisedAt: new Date('2026-06-04T01:00:00.000Z'),
      },
      {
        skillId: 'F002',
        status: 'learning',
        accuracy: 60,
        attemptCount: 3,
        lastPractisedAt: new Date('2026-06-04T01:10:00.000Z'),
      },
      {
        skillId: 'F003',
        status: 'needsReview',
        accuracy: 30,
        attemptCount: 2,
        lastPractisedAt: new Date('2026-06-04T01:20:00.000Z'),
      },
      {
        // Passed a recheck/retention → retained is the only state that counts as mastered.
        skillId: 'F004',
        status: 'retained',
        accuracy: 95,
        attemptCount: 5,
        lastPractisedAt: new Date('2026-06-04T01:30:00.000Z'),
      },
    ]);

    expect(view.summary.total).toBe(26);
    expect(view.summary.mastered).toBe(1);
    expect(view.summary.inProgress).toBe(3);
    expect(view.summary.notStarted).toBe(22);
    const flat = view.topics.flatMap((topic) => topic.skills);
    expect(flat.find((skill) => skill.skillId === 'F001')).toMatchObject({
      status: 'learning',
      attempts: 4,
      score: 92,
    });
    expect(flat.find((skill) => skill.skillId === 'F004')).toMatchObject({
      status: 'mastered',
      attempts: 5,
      score: 95,
    });
    expect(flat.find((skill) => skill.skillId === 'F003')).toMatchObject({
      status: 'needs_review',
    });
  });
});
