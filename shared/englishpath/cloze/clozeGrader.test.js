import { describe, it, expect } from 'vitest';
import { gradeBlank, gradePassage, editDistance } from './clozeGrader.js';
import { clozePassages } from './clozePassages.js';

const blank = (accept) => ({ n: 1, skill: 'content', accept });

describe('cloze grader', () => {
  it('accepts the exact answer and every valid alternative (fairness)', () => {
    const b = blank(['designer', 'enthusiast', 'collector']);
    expect(gradeBlank('designer', b).verdict).toBe('correct');
    expect(gradeBlank('collector', b).verdict).toBe('correct'); // a different-but-valid word is NOT wrong
    expect(gradeBlank('  Enthusiast ', b).verdict).toBe('correct'); // case/space-insensitive
  });

  it('tolerates a one-letter spelling slip on a longer word', () => {
    const r = gradeBlank('collecter', blank(['collector'])); // e for o
    expect(r.verdict).toBe('typo');
    expect(r.matched).toBe('collector');
  });

  it('does NOT treat a different short word as a typo', () => {
    // "on" vs "in" are one edit apart but are distinct answers, not misspellings.
    expect(gradeBlank('on', blank(['in'])).verdict).toBe('review');
  });

  it('marks a genuinely wrong word for review and still shows the valid answers', () => {
    const r = gradeBlank('banana', blank(['voice', 'eyes']));
    expect(r.verdict).toBe('review');
    expect(r.accepted).toEqual(['voice', 'eyes']);
  });

  it('an empty blank is blank, not wrong', () => {
    expect(gradeBlank('', blank(['one'])).verdict).toBe('blank');
  });

  it('scores a whole passage and breaks it down by skill', () => {
    const passage = clozePassages[0];
    // answer every blank with its first accepted word -> full marks
    const answers = {};
    for (const b of passage.blanks) answers[b.n] = b.accept[0];
    const res = gradePassage(answers, passage);
    expect(res.score).toBe(passage.blanks.length);
    expect(res.total).toBe(15);
    expect(res.needsReview).toEqual([]);
    // by-skill: every skill 100%
    for (const s of Object.values(res.bySkill)) expect(s.correct).toBe(s.total);
    expect(Object.keys(res.bySkill).sort()).toEqual(['collocation', 'content', 'grammar']);
  });

  it('a mixed attempt scores partially and flags only the wrong blanks', () => {
    const passage = clozePassages[0];
    const answers = { 47: 'walks', 50: 'alike', 54: 'wrongword', 60: 'life' };
    const res = gradePassage(answers, passage);
    expect(res.score).toBe(3); // walks, alike, life
    expect(res.needsReview).toContain(54);
    expect(res.perBlank.find((r) => r.n === 47).verdict).toBe('correct');
  });

  it('editDistance basics', () => {
    expect(editDistance('cat', 'cat')).toBe(0);
    expect(editDistance('cat', 'cot')).toBe(1);
    expect(editDistance('over', 'oven')).toBe(1);
  });
});
