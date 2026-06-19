import { describe, it, expect } from 'vitest';
import { buildPaperSections } from './paperSectioning.js';

const q = (id, type, marks = 2) => ({ questionId: id, type, marks });

describe('buildPaperSections', () => {
  it('returns empty for no questions', () => {
    expect(buildPaperSections({ questions: [] })).toEqual({ sections: [], questions: [] });
  });

  it('non-booklet specs collapse to a single section preserving order', () => {
    const input = [q('a', 'mcq'), q('b', 'open_ended'), q('c', 'short_answer')];
    const { sections, questions } = buildPaperSections({ questions: input, paperType: 'paper1', testMode: 'topic_test' });
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe('single');
    expect(questions.map((x) => x.questionId)).toEqual(['a', 'b', 'c']); // order preserved
    expect(questions.every((x) => x.sectionIndex === 0)).toBe(true);
  });

  it('psle_mock splits into Paper 1 booklets + Paper 2 by question type', () => {
    const input = [
      q('open1', 'open_ended', 4),
      q('mcq1', 'mcq', 1),
      q('short1', 'short_answer', 2),
      q('mcq2', 'mcq', 1),
    ];
    const { sections, questions } = buildPaperSections({ questions: input, paperType: 'combined', testMode: 'psle_mock' });
    expect(sections.map((s) => s.id)).toEqual(['p1a', 'p1b', 'p2']); // booklet order
    // MCQ first (Booklet A), then short answer (Booklet B), then open_ended (Paper 2)
    expect(questions.map((x) => x.questionId)).toEqual(['mcq1', 'mcq2', 'short1', 'open1']);
    expect(questions.find((x) => x.questionId === 'open1').paper).toBe(2);
  });

  it('applies PSLE calculator convention: Paper 1 no calc, Paper 2 calc', () => {
    const input = [q('m', 'mcq'), q('o', 'open_ended')];
    const { sections } = buildPaperSections({ questions: input, paperType: 'combined', testMode: 'psle_mock', calculatorAllowed: false });
    expect(sections.find((s) => s.paper === 1).calculatorAllowed).toBe(false);
    expect(sections.find((s) => s.paper === 2).calculatorAllowed).toBe(true);
  });

  it('sums marks and counts per section', () => {
    const input = [q('m1', 'mcq', 1), q('m2', 'mcq', 1), q('o1', 'open_ended', 5)];
    const { sections } = buildPaperSections({ questions: input, paperType: 'combined', testMode: 'psle_mock' });
    const p1a = sections.find((s) => s.id === 'p1a');
    expect(p1a.questionCount).toBe(2);
    expect(p1a.marks).toBe(2);
    expect(sections.find((s) => s.id === 'p2').marks).toBe(5);
  });

  it('omits empty sections (no Paper 2 when no open-ended questions)', () => {
    const input = [q('m', 'mcq'), q('s', 'short_answer')];
    const { sections } = buildPaperSections({ questions: input, paperType: 'combined', testMode: 'psle_mock' });
    expect(sections.map((s) => s.id)).toEqual(['p1a', 'p1b']);
    expect(sections.some((s) => s.paper === 2)).toBe(false);
  });

  it('tags startIndex correctly for the flat player', () => {
    const input = [q('o', 'open_ended'), q('m1', 'mcq'), q('m2', 'mcq')];
    const { sections, questions } = buildPaperSections({ questions: input, paperType: 'combined', testMode: 'psle_mock' });
    const p1a = sections.find((s) => s.id === 'p1a');
    const p2 = sections.find((s) => s.id === 'p2');
    expect(p1a.startIndex).toBe(0);
    expect(p2.startIndex).toBe(2);
    expect(questions[p2.startIndex].questionId).toBe('o');
  });
});
