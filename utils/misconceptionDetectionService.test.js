import { describe, expect, it } from 'vitest';
import { detectMisconceptions, getParentExplanation, classifyMisconceptionConfidence } from '../services/mathpath/misconceptionDetectionService.js';

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

  it('includes confidence level classification', () => {
    const result = detectMisconceptions({
      questionText: 'Add 1/2 and 1/3',
      studentAnswer: '1/2 + 1/3 = 2/5',
      teacherMarkedCorrect: false,
    });
    expect(result.confidenceLevel).toMatch(/^(high|moderate|limited)$/);
  });

  it('includes parent explanation in misconception details', () => {
    const result = detectMisconceptions({
      questionText: 'Add 1/2 and 1/3',
      studentAnswer: '1/2 + 1/3 = 2/5',
      teacherMarkedCorrect: false,
    });
    const detail = result.misconceptionDetails.find((d) => d.misconceptionId === 'adds_denominators_directly');
    expect(detail).toBeDefined();
    expect(detail.parentExplanation).toContain('bottom numbers');
    expect(detail.confidenceLevel).toMatch(/^(high|moderate|limited)$/);
  });

  it('returns parent explanations for all key misconceptions', () => {
    const ids = [
      'mixed_improper_conversion_error',
      'whole_number_thinking',
      'numerator_denominator_confusion',
      'calculation_error',
      'wrong_whole_identified',
      'improper_fraction_conversion_error',
      'answer_form_mismatch',
      'number_line_partition_error',
    ];
    for (const id of ids) {
      expect(getParentExplanation(id)).toBeTruthy();
    }
  });

  it('classifies confidence levels correctly', () => {
    expect(classifyMisconceptionConfidence(0.85)).toBe('high');
    expect(classifyMisconceptionConfidence(0.6)).toBe('moderate');
    expect(classifyMisconceptionConfidence(0.3)).toBe('limited');
  });
});
