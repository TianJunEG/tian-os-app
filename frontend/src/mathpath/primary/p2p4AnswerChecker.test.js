import { describe, it, expect } from 'vitest';
import { checkP4Answer } from './p4AnswerChecker';
import { checkP2Answer } from './p2AnswerChecker';

// Regression: both checkers had a positional signature checkPxAnswer(question,
// studentAnswer) while every caller passes a single object
// checkPxAnswer({ studentAnswer, question: { answer, answerType } }). That made
// studentAnswer + rawAnswer both undefined, so every answer (right OR wrong) was
// graded correct. These assert wrong answers are actually marked wrong.

describe('checkP4Answer — object signature, false-correct regression', () => {
  it('marks a correct numeric answer correct', () => {
    expect(checkP4Answer({ studentAnswer: '42', question: { answer: 42, answerType: 'number' } }).correct).toBe(true);
  });
  it('marks a WRONG numeric answer incorrect', () => {
    expect(checkP4Answer({ studentAnswer: '7', question: { answer: 42, answerType: 'number' } }).correct).toBe(false);
  });
  it('marks a WRONG text answer incorrect', () => {
    expect(checkP4Answer({ studentAnswer: 'cat', question: { answer: 'dog', answerType: 'text' } }).correct).toBe(false);
  });
});

describe('checkP2Answer — object signature, false-correct regression', () => {
  it('marks a correct numeric answer correct', () => {
    expect(checkP2Answer({ studentAnswer: '5', question: { answer: 5, answerType: 'number' } }).correct).toBe(true);
  });
  it('marks a WRONG numeric answer incorrect', () => {
    expect(checkP2Answer({ studentAnswer: '9', question: { answer: 5, answerType: 'number' } }).correct).toBe(false);
  });
  it('marks a WRONG text answer incorrect', () => {
    expect(checkP2Answer({ studentAnswer: 'red', question: { answer: 'blue', answerType: 'text' } }).correct).toBe(false);
  });
});
