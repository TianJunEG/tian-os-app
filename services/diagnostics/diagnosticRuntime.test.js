import { describe, expect, it } from 'vitest';
import {
  buildDiagnosticLifecycleLog,
  resolveDiagnosticCompletion,
} from './diagnosticRuntime.js';

describe('diagnostic runtime completion rules', () => {
  it('does not complete a 10-question diagnostic after one adaptive stop signal', () => {
    const completion = resolveDiagnosticCompletion({
      answeredCount: 1,
      maxQuestions: 10,
      minimumQuestions: 10,
      decision: {
        shouldStopDiagnostic: true,
        decisionType: 'STOP_AND_ASSIGN_PRACTICE',
      },
      nextQuestionAvailable: true,
    });

    expect(completion).toEqual({
      sessionComplete: false,
      completionReason: 'in_progress',
      adaptiveStopDeferred: true,
    });
  });

  it('completes when the target question count is reached', () => {
    expect(resolveDiagnosticCompletion({
      answeredCount: 10,
      maxQuestions: 10,
      minimumQuestions: 10,
      decision: { shouldStopDiagnostic: false },
      nextQuestionAvailable: false,
    })).toMatchObject({
      sessionComplete: true,
      completionReason: 'target_reached',
    });
  });

  it('allows explicit adaptive completion after the configured minimum is reached', () => {
    expect(resolveDiagnosticCompletion({
      answeredCount: 4,
      maxQuestions: 10,
      minimumQuestions: 4,
      decision: {
        shouldStopDiagnostic: true,
        decisionType: 'MARK_SECURE',
      },
      nextQuestionAvailable: true,
    })).toMatchObject({
      sessionComplete: true,
      completionReason: 'placement_confident',
      adaptiveStopDeferred: false,
    });
  });

  it('completes with a traceable reason when question generation fails', () => {
    expect(resolveDiagnosticCompletion({
      answeredCount: 1,
      maxQuestions: 10,
      minimumQuestions: 10,
      decision: { shouldStopDiagnostic: false },
      nextQuestionAvailable: false,
      generationFailed: true,
    })).toMatchObject({
      sessionComplete: true,
      completionReason: 'question_generation_failed',
    });
  });

  it('preserves minimum question count enforcement for resumed sessions', () => {
    const previousResponses = 4;
    const currentAnswer = 1;

    expect(resolveDiagnosticCompletion({
      answeredCount: previousResponses + currentAnswer,
      maxQuestions: 10,
      minimumQuestions: 10,
      decision: {
        shouldStopDiagnostic: true,
        decisionType: 'ASSIGN_REMEDIATION',
      },
      nextQuestionAvailable: true,
    })).toMatchObject({
      sessionComplete: false,
      completionReason: 'in_progress',
    });
  });

  it('builds lifecycle logs with remaining question counts', () => {
    expect(buildDiagnosticLifecycleLog({
      sessionId: 'diag-1',
      targetQuestions: 10,
      questionsAnswered: 3,
      completionReason: 'in_progress',
    })).toEqual({
      sessionId: 'diag-1',
      targetQuestions: 10,
      questionsAnswered: 3,
      questionsRemaining: 7,
      completionReason: 'in_progress',
    });
  });
});
