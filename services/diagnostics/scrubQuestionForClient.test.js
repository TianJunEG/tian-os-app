import { describe, it, expect } from 'vitest';
import { scrubQuestionForClient } from './diagnosticRuntime.js';

// The diagnostic engine scores server-side (getQuestionById + scoreAnswer), so
// the question object sent to the student must never carry its own answer.
describe('scrubQuestionForClient', () => {
  it('removes answer + solution fields but keeps everything the client needs', () => {
    const q = {
      questionId: 'q1',
      skillId: 'NS009',
      questionFamilyId: 'fam1',
      prompt: 'What is 2 + 3?',
      type: 'short_answer',
      choices: ['4', '5', '6'],
      answerInputType: 'number',
      answer: '5',
      correctAnswer: '5',
      workedSolution: '2 + 3 = 5',
      modelAnswer: '5',
      explanation: 'add them',
      solution: '5',
    };
    const safe = scrubQuestionForClient(q);
    // solution fields gone
    expect(safe.answer).toBeUndefined();
    expect(safe.correctAnswer).toBeUndefined();
    expect(safe.workedSolution).toBeUndefined();
    expect(safe.modelAnswer).toBeUndefined();
    expect(safe.explanation).toBeUndefined();
    expect(safe.solution).toBeUndefined();
    // renderable fields kept
    expect(safe).toMatchObject({
      questionId: 'q1', skillId: 'NS009', questionFamilyId: 'fam1',
      prompt: 'What is 2 + 3?', type: 'short_answer', choices: ['4', '5', '6'],
      answerInputType: 'number',
    });
    // non-mutating: the source object is untouched (engine still needs its answer)
    expect(q.answer).toBe('5');
  });

  it('passes through null / non-object values unchanged', () => {
    expect(scrubQuestionForClient(null)).toBeNull();
    expect(scrubQuestionForClient(undefined)).toBeUndefined();
  });
});
