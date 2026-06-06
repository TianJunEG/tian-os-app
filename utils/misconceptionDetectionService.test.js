import { describe, expect, it } from 'vitest';
import { detectMisconceptions } from '../services/mathpath/misconceptionDetectionService.js';

describe('misconceptionDetectionService', () => {
  it('detects direct denominator addition evidence', () => {
    const result = detectMisconceptions({
      questionText: 'Add 1/2 and 1/3',
      studentAnswer: '1/2 + 1/3 = 2/5',
      teacherMarkedCorrect: false,
    });

    expect(result.misconceptionTags).toContain('fraction_add_denominators_directly');
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});
