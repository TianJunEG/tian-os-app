import { describe, expect, it } from 'vitest';
import { segmentQuestionsFromOcrPages } from '../services/mathpath/questionSegmentationService.js';

describe('questionSegmentationService', () => {
  it('extracts question numbers, marks, answers, teacher marks and warnings from OCR pages', () => {
    const questions = segmentQuestionsFromOcrPages([
      {
        pageNumber: 1,
        extractedText: '1. Add 1/2 and 1/3 [2 marks]\nAnswer: 2/5\nwrong\n2. Simplify 4/8 [1 mark]',
        confidence: 0.82,
      },
    ]);

    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({
      questionNumber: '1',
      marks: 2,
      studentAnswer: '2/5',
      teacherMarkedCorrect: false,
      teacherMark: 'wrong',
      needsAdultReview: true,
    });
    expect(questions[1]).toMatchObject({
      questionNumber: '2',
      marks: 1,
      pageNumber: 1,
    });
  });
});
