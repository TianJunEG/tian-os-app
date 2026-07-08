// resolveDiagnosticCompletion decides whether an answered diagnostic question
// ends the session and why. The critical case fixed here: when the next question
// can't be generated (a thin domain bank exhausts mid-run, e.g. volume where an
// adaptive STEP_DOWN has no easier item left), the student must be PLACED with the
// answers collected so far, not trapped behind a retryable 409 that a retry can't
// fix. We only surface the hard error when nothing at all has been answered.
import { describe, it, expect } from 'vitest';
import { resolveDiagnosticCompletion } from './diagnosticRuntime.js';

describe('resolveDiagnosticCompletion — question generation failure', () => {
  it('completes as coverage_complete when the bank exhausts after ≥1 answer', () => {
    const out = resolveDiagnosticCompletion({
      answeredCount: 3, maxQuestions: 8, minimumQuestions: 6, generationFailed: true,
      decision: { decisionType: 'STOP_AND_ASSIGN_PRACTICE', shouldStopDiagnostic: true },
    });
    expect(out.sessionComplete).toBe(true);
    expect(out.completionReason).toBe('coverage_complete');
  });

  it('completes even when fewer than the minimum were answered (thin check-in)', () => {
    const out = resolveDiagnosticCompletion({
      answeredCount: 1, maxQuestions: 8, minimumQuestions: 6, generationFailed: true,
    });
    expect(out.sessionComplete).toBe(true);
    expect(out.completionReason).toBe('coverage_complete');
  });

  it('still hard-errors when generation fails with nothing answered', () => {
    const out = resolveDiagnosticCompletion({
      answeredCount: 0, maxQuestions: 8, minimumQuestions: 6, generationFailed: true,
    });
    expect(out.sessionComplete).toBe(false);
    expect(out.completionReason).toBe('question_generation_failed');
  });

  it('target_reached takes precedence over a generation failure', () => {
    const out = resolveDiagnosticCompletion({
      answeredCount: 8, maxQuestions: 8, minimumQuestions: 6, generationFailed: true,
    });
    expect(out.sessionComplete).toBe(true);
    expect(out.completionReason).toBe('target_reached');
  });

  it('does not complete a healthy in-progress session (no failure, no stop)', () => {
    const out = resolveDiagnosticCompletion({
      answeredCount: 2, maxQuestions: 8, minimumQuestions: 6, nextQuestionAvailable: true,
      decision: { shouldStopDiagnostic: false },
    });
    expect(out.sessionComplete).toBe(false);
    expect(out.completionReason).toBe('in_progress');
  });
});
