import { describe, it, expect } from 'vitest';
import {
  buildDecimalsPracticeSession,
  toClientQuestions,
  scoreDecimalsSubmission,
} from '../services/mathpath/decimalsPracticeService.js';

describe('Decimals practice service — session building', () => {
  it('builds a question set for an explicit target skill', () => {
    const session = buildDecimalsPracticeSession({ targetSkillId: 'D006', questionCount: 6 });
    expect(session.domainId).toBe('decimals');
    expect(session.targetSkillId).toBe('D006');
    expect(session.questions).toHaveLength(6);
    expect(session.questions.every((q) => q.skillId === 'D006')).toBe(true);
    expect(session.questions.every((q) => q.questionId)).toBe(true);
    // unique stable question ids
    expect(new Set(session.questions.map((q) => q.questionId)).size).toBe(6);
  });

  it('falls back to the engine-recommended skill when none given', () => {
    const session = buildDecimalsPracticeSession({ masteredSkillIds: ['D001', 'D002', 'D003'], questionCount: 4 });
    expect(session.targetSkillId).toBe('D004');
    expect(session.questions).toHaveLength(4);
  });

  it('rejects an unknown explicit skill', () => {
    // unknown explicit id falls through to engine recommendation (D001 for a fresh student)
    const session = buildDecimalsPracticeSession({ targetSkillId: 'ZZZ' });
    expect(session.targetSkillId).toBe('D001');
  });

  it('strips answers and solutions from the client copy', () => {
    const session = buildDecimalsPracticeSession({ targetSkillId: 'D001', questionCount: 3 });
    const client = toClientQuestions(session.questions);
    expect(client.every((q) => q.answer === undefined && q.solutionSteps === undefined)).toBe(true);
    expect(client.every((q) => q.prompt && q.questionId)).toBe(true);
  });
});

describe('Decimals practice service — grading', () => {
  it('grades a fully-correct submission and marks the skill mastered', () => {
    const session = buildDecimalsPracticeSession({ targetSkillId: 'D001', questionCount: 5 });
    const responses = session.questions.map((q) => ({ questionId: q.questionId, studentAnswer: q.answer.display }));
    const scored = scoreDecimalsSubmission({ questions: session.questions, responses });
    expect(scored.accuracySummary).toMatchObject({ total: 5, correct: 5, accuracyPercentage: 100 });
    expect(scored.perSkill.D001.status).toBe('mastered');
    expect(scored.mistakes).toHaveLength(0);
  });

  it('records mistakes with misconception tags for wrong answers', () => {
    const session = buildDecimalsPracticeSession({ targetSkillId: 'D006', questionCount: 4 });
    const responses = session.questions.map((q) => ({ questionId: q.questionId, studentAnswer: '-999' }));
    const scored = scoreDecimalsSubmission({ questions: session.questions, responses });
    expect(scored.accuracySummary.correct).toBe(0);
    expect(scored.perSkill.D006.status).toBe('needsReview');
    expect(scored.mistakes).toHaveLength(4);
    expect(scored.mistakes.every((m) => m.misconceptionTag)).toBe(true);
  });

  it('computes learning status for partial accuracy', () => {
    const session = buildDecimalsPracticeSession({ targetSkillId: 'D003', questionCount: 4 });
    const responses = session.questions.map((q, i) => ({
      questionId: q.questionId,
      studentAnswer: i < 3 ? q.answer.display : 'wrong',
    }));
    const scored = scoreDecimalsSubmission({ questions: session.questions, responses });
    expect(scored.accuracySummary.accuracyPercentage).toBe(75);
    expect(scored.perSkill.D003.status).toBe('learning');
  });

  it('ignores responses for unknown question ids', () => {
    const session = buildDecimalsPracticeSession({ targetSkillId: 'D001', questionCount: 2 });
    const scored = scoreDecimalsSubmission({
      questions: session.questions,
      responses: [{ questionId: 'does-not-exist', studentAnswer: '1' }],
    });
    expect(scored.results[0].error).toBe('unknown_question');
    expect(scored.accuracySummary.total).toBe(0);
  });
});
