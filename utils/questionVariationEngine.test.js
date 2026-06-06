import { describe, expect, it } from 'vitest';
import {
  analyseQuestionVariation,
  normalizeQuestionTemplate,
} from '../services/mathpath/questionVariationEngine.js';

describe('questionVariationEngine', () => {
  it('normalizes numbers and object contexts for template comparison', () => {
    expect(normalizeQuestionTemplate('Ali has 12 cards. What is 1/3 of 12 cards?'))
      .toBe('<name> has <number> <object>. what is <fraction> of <number> <object>?');
  });

  it('detects repeated wording templates', () => {
    const result = analyseQuestionVariation([
      { id: 'q1', questionText: 'Ali has 12 cards. What is 1/3 of 12 cards?' },
      { id: 'q2', questionText: 'Ben has 18 stickers. What is 1/3 of 18 stickers?' },
      { id: 'q3', questionText: 'Mary has 24 apples. What is 1/3 of 24 apples?' },
      { id: 'q4', questionText: 'Place 3/4 on the number line.' },
    ]);

    expect(result.repeatedTemplates).toEqual([
      expect.objectContaining({ count: 3, questionIds: ['q1', 'q2', 'q3'] }),
    ]);
    expect(result.diversityScore).toBeLessThan(100);
  });
});
