// Regression: the user reported "for all fraction questions must have the
// fractions insert boxes" alongside the F015_004 stem/answer mismatch fix
// (shared/mathpath/fractions/fractionQuestionGenerator.js).  After that fix
// F015_004 now returns the GREATER value as its answer (e.g. "12/5" or "1 4/5")
// instead of a comparison symbol. This test pins down that
// AnswerInputRenderer.normalizeType then routes those answers to the
// fraction / mixed_number input UIs — not the plain text fallback — so
// students get the proper fraction insert boxes.
import { describe, it, expect } from 'vitest';
import { getAnswerInputType } from './AnswerInputRenderer.jsx';

describe('AnswerInputRenderer — fraction questions get the fraction insert boxes', () => {
  it('routes "12/5"-style fraction answers to the fraction input', () => {
    const q = {
      type: 'short_answer',
      prompt: 'Which is greater: 1 4/5 or 12/5?',
      answer: { type: 'text', value: '12/5', display: '12/5' },
      acceptedAnswers: ['12/5', '<'],
    };
    expect(getAnswerInputType(q)).toBe('fraction');
  });

  it('routes "2 5/6"-style mixed-number answers to the mixed-number input', () => {
    const q = {
      type: 'short_answer',
      prompt: 'Which is greater: 2 5/6 or 8/6?',
      answer: { type: 'text', value: '2 5/6', display: '2 5/6' },
      acceptedAnswers: ['2 5/6', '>'],
    };
    expect(getAnswerInputType(q)).toBe('mixed_number');
  });

  it('keeps the comparison symbol picker for "Write > or <" stems', () => {
    // F006/F007/F008 — these explicitly ask for a symbol so the symbol picker
    // is the right UX (don't regress them onto a fraction input).
    const q = {
      type: 'short_answer',
      prompt: 'Write > or < to compare: 1/4 and 3/4',
      answer: { type: 'text', value: '<', display: '<' },
      acceptedAnswers: ['<', '3/4'],
    };
    expect(getAnswerInputType(q)).toBe('comparison');
  });
});
