import { describe, expect, it } from 'vitest';
import { detectPaperMarks } from '../services/mathpath/paperMarkDetectionService.js';

describe('paperMarkDetectionService', () => {
  it('detects student answer, selected option, and wrong mark with confidence', () => {
    const result = detectPaperMarks('1. Compare the fractions. Answer: 2/5\nSelected: B\n✗');

    expect(result).toMatchObject({
      studentAnswer: '2/5',
      studentAnswerConfidence: 0.72,
      selectedOption: 'B',
      selectedOptionConfidence: 0.68,
      teacherMarkedCorrect: false,
      teacherMark: 'wrong',
      teacherMarkConfidence: 0.7,
    });
  });

  it('detects score annotations without finalising correctness', () => {
    const result = detectPaperMarks('Teacher mark: 1/2');

    expect(result.detectedMarks).toBe(1);
    expect(result.teacherMarkedCorrect).toBeNull();
    expect(result.teacherMark).toBe('1/2');
    expect(result.detectedMarksConfidence).toBeGreaterThan(0);
  });
});
