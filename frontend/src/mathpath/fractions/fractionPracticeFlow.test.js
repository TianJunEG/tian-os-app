import { describe, expect, it } from 'vitest';
import {
  startFractionPracticeFlow,
  submitFractionPracticeAttempt,
} from './fractionPracticeFlow';

function answerFor(question) {
  return question.answer?.display || question.acceptedAnswers?.[0] || '1/2';
}

function startWorkingRequiredSession() {
  const studentId = `student_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const session = startFractionPracticeFlow({
    studentId,
    requestedSkillId: 'F001',
    requestedQuestionFamilyId: 'QF_F001_003',
    sessionLength: 3,
  });
  return { ...session, studentId };
}

describe('fractionPracticeFlow working evidence completion', () => {
  it('does not require upload when every working-required question is declared not needed', () => {
    const session = startWorkingRequiredSession();
    expect(session.workingExpected).toBe(true);

    const responses = session.questions.map((question) => ({
      questionId: question.questionId,
      studentAnswer: answerFor(question),
      timeTaken: 10,
      confidence: 'confident',
      workingNotNeeded: true,
    }));

    const summary = submitFractionPracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: session.studentId,
      responses,
    });

    expect(summary.workingUploadRequired).toBe(false);
    expect(summary.questionWorkingSummary).toMatchObject({
      totalQuestions: session.questions.length,
      workingSubmitted: 0,
      workingNotNeeded: session.questions.length,
      missingWorking: 0,
      status: 'Ready to continue',
      allNoWorkingDeclarations: true,
    });
  });

  it('requires upload when a working-required question has no submitted or not-needed decision', () => {
    const session = startWorkingRequiredSession();
    const responses = session.questions.map((question) => ({
      questionId: question.questionId,
      studentAnswer: answerFor(question),
      timeTaken: 10,
      confidence: 'confident',
    }));

    const summary = submitFractionPracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: session.studentId,
      responses,
    });

    expect(summary.workingUploadRequired).toBe(true);
    expect(summary.questionWorkingSummary.missingWorking).toBeGreaterThan(0);
    expect(summary.questionWorkingSummary.status).toBe('Missing working');
  });

  it('does not require upload when every working-required question has submitted working', () => {
    const session = startWorkingRequiredSession();
    const responses = session.questions.map((question) => ({
      questionId: question.questionId,
      studentAnswer: answerFor(question),
      timeTaken: 10,
      confidence: 'confident',
      workingSubmitted: true,
    }));

    const summary = submitFractionPracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: session.studentId,
      responses,
    });

    expect(summary.workingUploadRequired).toBe(false);
    expect(summary.questionWorkingSummary.workingSubmitted).toBe(session.questions.length);
    expect(summary.questionWorkingSummary.missingWorking).toBe(0);
  });

  it('generates unique questionIds within a session (E1 root cause)', () => {
    const session = startWorkingRequiredSession();
    const ids = session.questions.map((q) => q.questionId);
    // Colliding questionIds made the session questionById map resolve responses to
    // the wrong stored question, scoring correct answers as wrong.
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reports 100% accuracy when every real question is answered correctly (E1)', () => {
    const session = startWorkingRequiredSession();
    const responses = session.questions.map((question) => ({
      questionId: question.questionId,
      studentAnswer: answerFor(question),
      timeTaken: 10,
      confidence: 'confident',
      workingNotNeeded: true,
    }));

    const summary = submitFractionPracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: session.studentId,
      responses,
    });

    expect(summary.accuracySummary.accuracyPercentage).toBe(100);
    expect(summary.accuracySummary.totalQuestions).toBe(session.questions.length);
    expect(summary.accuracySummary.correctCount).toBe(session.questions.length);
    expect(summary.accuracySummary.incorrectCount).toBe(0);
  });

  it('excludes phantom/unknown questionId responses from accuracy (E1)', () => {
    const session = startWorkingRequiredSession();
    const realResponses = session.questions.map((question) => ({
      questionId: question.questionId,
      studentAnswer: answerFor(question),
      timeTaken: 10,
      confidence: 'confident',
      workingNotNeeded: true,
    }));
    // Stale/duplicate/regenerated ids that are not part of this session must not
    // count against accuracy — previously these drove an all-correct session to 50%.
    const phantomResponses = [
      { questionId: 'stale-question-1', studentAnswer: '1/2', timeTaken: 5 },
      { questionId: 'stale-question-2', studentAnswer: '1/2', timeTaken: 5 },
    ];

    const summary = submitFractionPracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: session.studentId,
      responses: [...realResponses, ...phantomResponses],
    });

    expect(summary.accuracySummary.accuracyPercentage).toBe(100);
    expect(summary.accuracySummary.totalQuestions).toBe(session.questions.length);
    expect(summary.accuracySummary.correctCount).toBe(session.questions.length);
  });

  it('requires upload when working-required questions were completed on paper', () => {
    const session = startWorkingRequiredSession();
    const responses = session.questions.map((question) => ({
      questionId: question.questionId,
      studentAnswer: answerFor(question),
      timeTaken: 10,
      confidence: 'confident',
      workingOnPaper: true,
    }));

    const summary = submitFractionPracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: session.studentId,
      responses,
    });

    expect(summary.workingUploadRequired).toBe(true);
    expect(summary.questionWorkingSummary).toMatchObject({
      workingOnPaper: session.questions.length,
      missingWorking: 0,
      status: 'Upload paper working',
    });
  });
});
