import { describe, it, expect } from 'vitest';
import {
  calculateDecimalsExamReadiness,
  getDecimalsAssessmentReadiness,
  buildDecimalsAssessment,
  toClientAssessmentQuestions,
  scoreDecimalsAssessment,
} from '../services/mathpath/decimalsAssessmentService.js';

const mastered = (ids) => ids.map((skillId) => ({ skillId, status: 'accurate' }));

describe('Decimals assessment — readiness score', () => {
  it('weights knowledge 50 / fluency 30 / retention 20', () => {
    const r = calculateDecimalsExamReadiness({ knowledge: 100, fluency: 0, retention: 0 });
    expect(r.score).toBe(50);
    const full = calculateDecimalsExamReadiness({ knowledge: 100, fluency: 100, retention: 100 });
    expect(full.score).toBe(100);
    expect(full.band).toBe('exam_ready');
  });

  it('bands at exam_ready / approaching / exam_risk', () => {
    expect(calculateDecimalsExamReadiness({ knowledge: 80, fluency: 80, retention: 80 }).band).toBe('exam_ready');
    expect(calculateDecimalsExamReadiness({ knowledge: 70, fluency: 60, retention: 60 }).band).toBe('approaching_exam_ready');
    expect(calculateDecimalsExamReadiness({ knowledge: 40, fluency: 20, retention: 0 }).band).toBe('exam_risk');
  });
});

describe('Decimals assessment — readiness gate', () => {
  it('stays locked until enough skills are mastered', () => {
    const r = getDecimalsAssessmentReadiness({ skillStates: mastered(['D001', 'D002', 'D003']) });
    expect(r.ready).toBe(false);
    expect(r.coverage).toEqual({ mastered: 3, total: 14, required: 8 });
    expect(r.message).toMatch(/Master 5 more skills/);
  });

  it('unlocks at the mastery threshold and reports dimensions', () => {
    const states = [
      ...['D001', 'D002', 'D003', 'D004', 'D005', 'D006'].map((skillId) => ({ skillId, status: 'retained', fluencyLevel: 'gold' })),
      ...['D007', 'D008'].map((skillId) => ({ skillId, status: 'accurate' })),
    ];
    const r = getDecimalsAssessmentReadiness({ skillStates: states });
    expect(r.ready).toBe(true);
    expect(r.coverage.mastered).toBe(8);
    expect(r.knowledge).toBe(57); // 8/14
    expect(r.fluency).toBe(43); // 6/14 gold+
    expect(r.retention).toBe(43); // 6/14 retained
    expect(r.message).toMatch(/unlocked/i);
  });
});

describe('Decimals assessment — build + score', () => {
  it('builds a mixed paper across mastered skills', () => {
    const paper = buildDecimalsAssessment({ masteredSkillIds: ['D001', 'D006', 'D009'], count: 9 });
    expect(paper.questions).toHaveLength(9);
    expect(new Set(paper.questions.map((q) => q.questionId)).size).toBe(9);
    expect(paper.skillIds.sort()).toEqual(['D001', 'D006', 'D009']);
  });

  it('throws when there are no mastered skills', () => {
    expect(() => buildDecimalsAssessment({ masteredSkillIds: [] })).toThrow();
  });

  it('strips answers from the client copy', () => {
    const paper = buildDecimalsAssessment({ masteredSkillIds: ['D001'], count: 3 });
    const client = toClientAssessmentQuestions(paper.questions);
    expect(client.every((q) => q.answer === undefined && q.acceptedAnswers === undefined)).toBe(true);
    expect(client.every((q) => q.prompt && q.questionId)).toBe(true);
  });

  it('scores a full paper into an exam_ready band', () => {
    const paper = buildDecimalsAssessment({ masteredSkillIds: ['D001', 'D003'], count: 8 });
    const responses = paper.questions.map((q) => ({ questionId: q.questionId, studentAnswer: q.answer.display }));
    const scored = scoreDecimalsAssessment({ questions: paper.questions, responses });
    expect(scored.accuracy).toBe(100);
    expect(scored.band).toBe('exam_ready');
    expect(scored.weakSkillIds).toEqual([]);
  });

  it('flags weak skills and an exam_risk band for a poor paper', () => {
    const paper = buildDecimalsAssessment({ masteredSkillIds: ['D006'], count: 6 });
    const responses = paper.questions.map((q) => ({ questionId: q.questionId, studentAnswer: 'wrong' }));
    const scored = scoreDecimalsAssessment({ questions: paper.questions, responses });
    expect(scored.accuracy).toBe(0);
    expect(scored.band).toBe('exam_risk');
    expect(scored.weakSkillIds).toContain('D006');
    expect(scored.mistakes).toHaveLength(6);
  });
});
