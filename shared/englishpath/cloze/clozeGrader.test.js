import { describe, it, expect } from 'vitest';
import { gradeBlank, gradePassage } from './clozeGrader.js';
import { clozePassages } from './clozePassages.js';

const blank = (accept) => ({ n: 1, skill: 'content', accept });

describe('cloze grader', () => {
  it('accepts the exact answer (case/space-insensitive)', () => {
    const b = blank(['designer']);
    expect(gradeBlank('designer', b).verdict).toBe('correct');
    expect(gradeBlank('  Designer ', b).verdict).toBe('correct');
  });

  it('rejects a misspelling of the correct word', () => {
    expect(gradeBlank('collecter', blank(['collector'])).verdict).toBe('wrong');
  });

  it('rejects a different word form', () => {
    expect(gradeBlank('collecting', blank(['collector'])).verdict).toBe('wrong');
  });

  it('marks a wrong word and shows the accepted answer', () => {
    const r = gradeBlank('banana', blank(['voice']));
    expect(r.verdict).toBe('wrong');
    expect(r.accepted).toEqual(['voice']);
  });

  it('an empty blank is blank, not wrong', () => {
    expect(gradeBlank('', blank(['one'])).verdict).toBe('blank');
  });

  it('scores a whole passage and breaks it down by skill', () => {
    const passage = clozePassages[0];
    const answers = {};
    for (const b of passage.blanks) answers[b.n] = b.accept[0];
    const res = gradePassage(answers, passage);
    expect(res.score).toBe(passage.blanks.length);
    expect(res.total).toBe(15);
    expect(res.needsWrong).toEqual([]);
    for (const s of Object.values(res.bySkill)) expect(s.correct).toBe(s.total);
    expect(Object.keys(res.bySkill).sort()).toEqual(['collocation', 'content', 'grammar']);
  });

  it('a mixed attempt scores partially and flags only the wrong blanks', () => {
    const passage = clozePassages[0];
    const [b1, b2, b3] = passage.blanks;
    const answers = { [b1.n]: b1.accept[0], [b2.n]: b2.accept[0], [b3.n]: 'zzzwrongword' };
    const res = gradePassage(answers, passage);
    expect(res.score).toBe(2);
    expect(res.needsWrong).toContain(b3.n);
    expect(res.perBlank.find((r) => r.n === b1.n).verdict).toBe('correct');
  });
});
