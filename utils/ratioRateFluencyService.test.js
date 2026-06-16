import { describe, it, expect } from 'vitest';
import {
  getFluencyBenchmarks,
  computeConsistencyScore,
  classifyFluency,
  buildRatioRateFluencyDrill,
  toClientFluencyQuestions,
  scoreRatioRateFluencyDrill,
} from '../services/mathpath/ratioRateFluencyService.js';

describe('Ratio fluency — benchmarks + classification', () => {
  it('derives bronze/silver/gold/platinum from a family target', () => {
    const b = getFluencyBenchmarks({ fluencyTargetSeconds: 10 });
    expect(b).toEqual({ bronze: 18, silver: 14, gold: 10, platinum: 7 });
  });

  it('classifies platinum/gold/silver/bronze and notReady by thresholds', () => {
    const benchmarks = { bronze: 18, silver: 14, gold: 10, platinum: 7 };
    expect(classifyFluency({ accuracy: 100, averageTime: 6, consistencyScore: 90, benchmarks, attemptsCount: 8 })).toBe('platinum');
    expect(classifyFluency({ accuracy: 93, averageTime: 9, consistencyScore: 78, benchmarks, attemptsCount: 8 })).toBe('gold');
    expect(classifyFluency({ accuracy: 89, averageTime: 13, consistencyScore: 66, benchmarks, attemptsCount: 8 })).toBe('silver');
    expect(classifyFluency({ accuracy: 86, averageTime: 17, consistencyScore: 56, benchmarks, attemptsCount: 8 })).toBe('bronze');
    // too few attempts or too slow / inaccurate → notReady
    expect(classifyFluency({ accuracy: 100, averageTime: 5, consistencyScore: 99, benchmarks, attemptsCount: 2 })).toBe('notReady');
    expect(classifyFluency({ accuracy: 70, averageTime: 5, consistencyScore: 99, benchmarks, attemptsCount: 8 })).toBe('notReady');
  });

  it('rewards stable, fast, accurate attempts with a higher consistency score', () => {
    const stable = computeConsistencyScore(
      [1, 2, 3, 4, 5].map(() => ({ correct: true, timeTaken: 8 })), 10,
    );
    const erratic = computeConsistencyScore(
      [{ correct: true, timeTaken: 2 }, { correct: false, timeTaken: 30 }, { correct: true, timeTaken: 25 }], 10,
    );
    expect(stable).toBeGreaterThan(erratic);
  });
});

describe('Ratio fluency — drill building', () => {
  it('builds a timed drill for a skill with benchmarks and questions', () => {
    const drill = buildRatioRateFluencyDrill({ skillId: 'R001', count: 8 });
    expect(drill.domainId).toBe('ratio');
    expect(drill.skillId).toBe('R001');
    expect(drill.benchmarks.gold).toBeGreaterThan(0);
    expect(drill.questions).toHaveLength(8);
    expect(drill.questions.every((q) => q.skillId === 'R001')).toBe(true);
    expect(new Set(drill.questions.map((q) => q.questionId)).size).toBe(8);
  });

  it('strips answers from the client copy', () => {
    const drill = buildRatioRateFluencyDrill({ skillId: 'R002', count: 4 });
    const client = toClientFluencyQuestions(drill.questions);
    expect(client.every((q) => q.answer === undefined && q.acceptedAnswers === undefined)).toBe(true);
    expect(client.every((q) => q.prompt && q.questionId)).toBe(true);
  });

  it('rejects an unknown skill', () => {
    expect(() => buildRatioRateFluencyDrill({ skillId: 'ZZZ' })).toThrow();
  });
});

describe('Ratio fluency — scoring', () => {
  it('awards a high band for fast, fully-correct answers', () => {
    const drill = buildRatioRateFluencyDrill({ skillId: 'R001', count: 8 });
    const fast = drill.questions.map((q) => ({ questionId: q.questionId, studentAnswer: q.acceptedAnswers[0], timeTaken: 3 }));
    const scored = scoreRatioRateFluencyDrill({ skillId: 'R001', questions: drill.questions, responses: fast });
    expect(scored.accuracy).toBe(100);
    expect(scored.domainId).toBe('ratio');
    expect(['gold', 'platinum', 'silver']).toContain(scored.band);
    expect(scored.averageTime).toBe(3);
  });

  it('returns notReady for slow or inaccurate drills', () => {
    const drill = buildRatioRateFluencyDrill({ skillId: 'R002', count: 8 });
    const slowWrong = drill.questions.map((q, i) => ({
      questionId: q.questionId,
      studentAnswer: i % 2 === 0 ? q.acceptedAnswers[0] : 'definitely-wrong',
      timeTaken: 90,
    }));
    const scored = scoreRatioRateFluencyDrill({ skillId: 'R002', questions: drill.questions, responses: slowWrong });
    expect(scored.band).toBe('notReady');
    expect(scored.accuracy).toBeLessThan(80);
  });

  it('ignores responses for unknown question ids', () => {
    const drill = buildRatioRateFluencyDrill({ skillId: 'R001', count: 3 });
    const scored = scoreRatioRateFluencyDrill({
      skillId: 'R001',
      questions: drill.questions,
      responses: [{ questionId: 'nope', studentAnswer: '1', timeTaken: 5 }],
    });
    expect(scored.total).toBe(0);
    expect(scored.band).toBe('notReady');
  });
});
