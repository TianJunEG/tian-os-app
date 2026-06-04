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
});
