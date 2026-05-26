import { describe, it, expect } from 'vitest';
import { applyMarks } from './marking.js';

const makeSession = () => ({
  questions: [
    { prompt: 'q0' },
    { prompt: 'q1', studentResponse: 'typed' },
    { prompt: 'q2' },
  ],
});

describe('applyMarks', () => {
  it('marks answered questions and computes the percentage score', () => {
    const session = makeSession();
    const { answered, correct } = applyMarks(session, [
      { index: 0, correct: true, feedback: 'good' },
      { index: 2, correct: false, feedback: 'nope' },
    ]);
    expect(answered).toBe(2);
    expect(correct).toBe(1);
    expect(session.score).toBe(50);
    expect(session.questions[0].correct).toBe(true);
    expect(session.questions[0].feedback).toBe('good');
    expect(session.questions[2].correct).toBe(false);
  });

  it('leaves unanswered questions untouched', () => {
    const session = makeSession();
    applyMarks(session, [{ index: 0, correct: true }]);
    expect(session.questions[1].correct).toBeUndefined();
    expect(session.questions[1].markedAt).toBeUndefined();
  });

  it('fills studentResponse from the transcription when none was typed', () => {
    const session = makeSession();
    applyMarks(session, [{ index: 0, correct: true, readAs: '2x+1' }]);
    expect(session.questions[0].studentResponse).toBe('2x+1');
  });

  it('keeps an existing typed answer over the transcription', () => {
    const session = makeSession();
    applyMarks(session, [{ index: 1, correct: true, readAs: 'ocr-text' }]);
    expect(session.questions[1].studentResponse).toBe('typed');
  });

  it('marks the whole session complete', () => {
    const session = makeSession();
    applyMarks(session, [{ index: 0, correct: true }]);
    expect(session.marked).toBe(true);
    expect(session.completed).toBe(true);
    expect(session.completedAt).toBeInstanceOf(Date);
  });

  it('scores zero when nothing was answered', () => {
    const session = makeSession();
    const { answered } = applyMarks(session, []);
    expect(answered).toBe(0);
    expect(session.score).toBe(0);
  });
});
