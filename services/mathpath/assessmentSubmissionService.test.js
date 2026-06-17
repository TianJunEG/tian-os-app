import { describe, it, expect } from 'vitest';
import { markAssessment, normalizeAnswer } from './assessmentSubmissionService.js';

const q = (id, answer, marks = 2, extra = {}) => ({
  questionId: id,
  marks,
  answer: { display: answer },
  acceptedAnswers: [answer],
  ...extra,
});

describe('normalizeAnswer', () => {
  it('lowercases, trims, and strips internal whitespace', () => {
    expect(normalizeAnswer('  3 / 4 ')).toBe('3/4');
    expect(normalizeAnswer('ABC')).toBe('abc');
    expect(normalizeAnswer(null)).toBe('');
  });
});

describe('markAssessment', () => {
  const questions = [
    q('q1', '3/4', 2, { skillId: 'F010', skillRefId: 'aaaa', misconceptionTag: 'wrong-denominator' }),
    q('q2', '12', 3, { skillId: 'F011', skillRefId: 'bbbb' }),
    q('q3', '5', 1, { skillId: 'F012', skillRefId: 'cccc', misconceptionTag: 'off-by-one' }),
  ];

  it('marks correct/incorrect and sums marks + score', () => {
    const out = markAssessment({
      questions,
      responses: [
        { questionId: 'q1', answer: ' 3/4 ' }, // correct (normalized)
        { questionId: 'q2', answer: '11' }, // wrong
        { questionId: 'q3', answer: '5' }, // correct
      ],
    });
    expect(out.totalMarks).toBe(6);
    expect(out.totalAwarded).toBe(3); // 2 + 0 + 1
    expect(out.scorePct).toBe(50);
    expect(out.items.find((i) => i.questionId === 'q1').correct).toBe(true);
    expect(out.items.find((i) => i.questionId === 'q2').correct).toBe(false);
  });

  it('treats a missing/blank response as skipped + incorrect', () => {
    const out = markAssessment({ questions, responses: [{ questionId: 'q1', answer: '3/4' }] });
    const q2 = out.items.find((i) => i.questionId === 'q2');
    expect(q2.correct).toBe(false);
    expect(q2.skipped).toBe(true);
  });

  it('carries the misconception tag and skill ids through for wrong answers', () => {
    const out = markAssessment({ questions, responses: [{ questionId: 'q1', answer: 'nope' }] });
    const item = out.items.find((i) => i.questionId === 'q1');
    expect(item.correct).toBe(false);
    expect(item.misconceptionTag).toBe('wrong-denominator');
    expect(item.skillRefId).toBe('aaaa');
    expect(item.skillId).toBe('F010');
  });

  it('scores zero cleanly when there are no questions', () => {
    expect(markAssessment({ questions: [], responses: [] })).toMatchObject({ totalMarks: 0, totalAwarded: 0, scorePct: 0, items: [] });
  });
});
