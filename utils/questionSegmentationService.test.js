import { describe, expect, it } from 'vitest';
import {
  detectTeacherMark,
  extractStudentAnswer,
  segmentQuestionsFromOcrPages,
} from '../services/mathpath/questionSegmentationService.js';

describe('questionSegmentationService', () => {
  it('segments OCR text into question metadata', () => {
    const questions = segmentQuestionsFromOcrPages([
      {
        pageNumber: 1,
        extractedText: '1. Add 1/2 and 1/4 [2 marks]\nAnswer: 3/6\nwrong\n2. Simplify 4/8 (1 mark)\nAnswer: 1/2\ncorrect',
      },
    ]);

    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({
      questionNumber: '1',
      marks: 2,
      studentAnswer: '3/6',
      teacherMarkedCorrect: false,
    });
    expect(questions[1]).toMatchObject({
      questionNumber: '2',
      marks: 1,
      teacherMarkedCorrect: true,
    });
  });

  it('extracts answers and teacher marks without grading', () => {
    expect(extractStudentAnswer('Answer: 2/5')).toMatchObject({ studentAnswer: '2/5' });
    expect(detectTeacherMark('teacher wrote cross')).toMatchObject({ teacherMarkedCorrect: false });
  });
});
