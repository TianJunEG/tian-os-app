import { describe, it, expect } from 'vitest';
import { checkP1Answer, checkP1AnswerCompat } from './p1AnswerChecker.js';

describe('checkP1Answer', () => {
  // ── number answers ──────────────────────────────────────────────────────
  describe('number answerType', () => {
    it('correct integer answer', () => {
      const result = checkP1Answer({
        studentAnswer: '5',
        question: { answer: 5, answerType: 'number' },
      });
      expect(result.correct).toBe(true);
      expect(result.normalizedStudentAnswer).toBe('5');
      expect(result.normalizedCorrectAnswer).toBe('5');
    });

    it('incorrect integer answer', () => {
      const result = checkP1Answer({
        studentAnswer: '3',
        question: { answer: 5, answerType: 'number' },
      });
      expect(result.correct).toBe(false);
    });

    it('handles whitespace in student answer', () => {
      const result = checkP1Answer({
        studentAnswer: '  7  ',
        question: { answer: 7, answerType: 'number' },
      });
      expect(result.correct).toBe(true);
    });

    it('handles string correct answer', () => {
      const result = checkP1Answer({
        studentAnswer: '12',
        question: { answer: '12', answerType: 'number' },
      });
      expect(result.correct).toBe(true);
    });

    it('rejects non-numeric student answer', () => {
      const result = checkP1Answer({
        studentAnswer: 'abc',
        question: { answer: 5, answerType: 'number' },
      });
      expect(result.correct).toBe(false);
      expect(result.normalizedStudentAnswer).toBe('abc');
    });

    it('rejects empty student answer', () => {
      const result = checkP1Answer({
        studentAnswer: '',
        question: { answer: 5, answerType: 'number' },
      });
      expect(result.correct).toBe(false);
    });

    it('infers number type from answer being a number', () => {
      const result = checkP1Answer({
        studentAnswer: '10',
        question: { answer: 10 },
      });
      expect(result.correct).toBe(true);
    });

    it('handles zero correctly', () => {
      const result = checkP1Answer({
        studentAnswer: '0',
        question: { answer: 0, answerType: 'number' },
      });
      expect(result.correct).toBe(true);
    });
  });

  // ── choice answers ──────────────────────────────────────────────────────
  describe('choice answerType', () => {
    it('correct choice (exact match)', () => {
      const result = checkP1Answer({
        studentAnswer: 'three',
        question: { answer: 'three', answerType: 'choice' },
      });
      expect(result.correct).toBe(true);
    });

    it('correct choice (case insensitive)', () => {
      const result = checkP1Answer({
        studentAnswer: 'Three',
        question: { answer: 'three', answerType: 'choice' },
      });
      expect(result.correct).toBe(true);
    });

    it('incorrect choice', () => {
      const result = checkP1Answer({
        studentAnswer: 'four',
        question: { answer: 'three', answerType: 'choice' },
      });
      expect(result.correct).toBe(false);
    });

    it('rejects empty choice', () => {
      const result = checkP1Answer({
        studentAnswer: '',
        question: { answer: 'three', answerType: 'choice' },
      });
      expect(result.correct).toBe(false);
    });
  });

  // ── text answers ────────────────────────────────────────────────────────
  describe('text answerType', () => {
    it('correct text answer', () => {
      const result = checkP1Answer({
        studentAnswer: 'circle',
        question: { answer: 'circle', answerType: 'text' },
      });
      expect(result.correct).toBe(true);
    });

    it('case insensitive text match', () => {
      const result = checkP1Answer({
        studentAnswer: 'CIRCLE',
        question: { answer: 'circle', answerType: 'text' },
      });
      expect(result.correct).toBe(true);
    });

    it('handles whitespace trimming', () => {
      const result = checkP1Answer({
        studentAnswer: '  circle  ',
        question: { answer: 'circle', answerType: 'text' },
      });
      expect(result.correct).toBe(true);
    });

    it('incorrect text answer', () => {
      const result = checkP1Answer({
        studentAnswer: 'square',
        question: { answer: 'circle', answerType: 'text' },
      });
      expect(result.correct).toBe(false);
    });
  });

  // ── fallback ────────────────────────────────────────────────────────────
  describe('unknown answerType (fallback)', () => {
    it('falls back to text comparison', () => {
      const result = checkP1Answer({
        studentAnswer: 'yes',
        question: { answer: 'yes', answerType: 'unknown' },
      });
      expect(result.correct).toBe(true);
    });
  });
});

describe('checkP1AnswerCompat', () => {
  it('works with number correctAnswer', () => {
    const result = checkP1AnswerCompat({
      studentAnswer: '8',
      correctAnswer: 8,
    });
    expect(result.correct).toBe(true);
  });

  it('works with object correctAnswer', () => {
    const result = checkP1AnswerCompat({
      studentAnswer: '5',
      correctAnswer: { display: '5', type: 'whole', value: 5 },
    });
    expect(result.correct).toBe(true);
  });

  it('works with string correctAnswer', () => {
    const result = checkP1AnswerCompat({
      studentAnswer: 'triangle',
      correctAnswer: 'triangle',
    });
    expect(result.correct).toBe(true);
  });

  it('prefers question object when provided', () => {
    const result = checkP1AnswerCompat({
      studentAnswer: '7',
      correctAnswer: 'ignored',
      question: { answer: 7, answerType: 'number' },
    });
    expect(result.correct).toBe(true);
  });
});
