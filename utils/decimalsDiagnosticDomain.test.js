import { describe, it, expect } from 'vitest';
import decimalsDiagnosticDomain, {
  buildSkillGraph,
  getQuestionBank,
  scoreAnswer,
  detectErrorTags,
  buildResult,
} from '../services/diagnostics/domains/decimalsDiagnosticDomain.js';
import { DIAGNOSTIC_DECISIONS, decideNextDiagnosticStep } from './adaptiveDiagnosticDecisionEngine.js';
import { selectNextDiagnosticQuestion } from './selectNextDiagnosticQuestion.js';
import diagnosticsRegistry from '../services/diagnostics/diagnosticDomainRegistry.js';

describe('Decimals diagnostic domain — registration + shapes', () => {
  it('is registered in the diagnostic registry', () => {
    expect(diagnosticsRegistry.hasDiagnosticDomain({ subjectId: 'math', domainId: 'decimals' })).toBe(true);
    expect(decimalsDiagnosticDomain.domainId).toBe('decimals');
    expect(decimalsDiagnosticDomain.defaultStartSkillIds).toEqual(['D001']);
  });

  it('builds a generic skill graph with prerequisites and error tags', () => {
    const graph = buildSkillGraph();
    expect(graph).toHaveLength(14);
    const d004 = graph.find((s) => s.skillId === 'D004');
    expect(d004.prerequisiteSkillIds).toContain('D003');
    expect(d004.difficulty).toBeGreaterThan(0);
    const d006 = graph.find((s) => s.skillId === 'D006');
    expect(d006.commonErrorTags).toContain('dec/add-misalign');
  });

  it('builds a generator-backed question bank for target skills', () => {
    const { bank, skillsByFrameworkId } = getQuestionBank({ targetSkillIds: ['D001', 'D006'], perSkill: 3 });
    expect(bank).toHaveLength(6);
    expect(bank.every((q) => ['D001', 'D006'].includes(q.skillId))).toBe(true);
    expect(bank.every((q) => q.questionId && q.prompt)).toBe(true);
    expect(new Set(bank.map((q) => q.questionId)).size).toBe(6); // unique ids
    expect(skillsByFrameworkId.get('D001').name).toBe('Decimal Place Value');
  });
});

describe('Decimals diagnostic domain — scoring', () => {
  it('scores a correct answer true and a wrong answer false', () => {
    const { bank } = getQuestionBank({ targetSkillIds: ['D001'], perSkill: 1 });
    const q = bank[0];
    expect(scoreAnswer(q, { answer: q.raw.answer.display })).toBe(true);
    expect(scoreAnswer(q, { answer: 'definitely-wrong' })).toBe(false);
    expect(scoreAnswer(q, { skipped: true })).toBe(false);
  });

  it('surfaces the misconception tag for a wrong answer', () => {
    const { bank } = getQuestionBank({ targetSkillIds: ['D006'], perSkill: 1 });
    const q = bank[0];
    expect(detectErrorTags(q, {}, true)).toEqual([]);
    expect(detectErrorTags(q, {}, false)).toContain('dec/add-misalign');
  });
});

describe('Decimals diagnostic domain — adaptive loop (generic engine)', () => {
  const skillGraph = buildSkillGraph();

  it('probes the prerequisite when a skill is answered wrong', () => {
    const currentSkill = skillGraph.find((s) => s.skillId === 'D004'); // prereq D003
    const decision = decideNextDiagnosticStep({
      currentSkill,
      currentQuestion: { questionId: 'q-d004', skillId: 'D004', difficulty: currentSkill.difficulty },
      response: { correct: false, confidence: 'not_sure', studentAnswer: 'x' },
      skillGraph,
      questionBank: [],
      sessionState: {},
    });
    expect(decision.decisionType).toBe(DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE);
    expect(decision.nextSkillId).toBe('D003');
  });

  it('does not drop to a prerequisite when a skill is answered correctly', () => {
    const currentSkill = skillGraph.find((s) => s.skillId === 'D003');
    const decision = decideNextDiagnosticStep({
      currentSkill,
      currentQuestion: { questionId: 'q-d003', skillId: 'D003', difficulty: currentSkill.difficulty },
      response: { correct: true, confidence: 'confident' },
      skillGraph,
      questionBank: [],
      sessionState: {},
    });
    expect([
      DIAGNOSTIC_DECISIONS.MOVE_UP,
      DIAGNOSTIC_DECISIONS.MARK_SECURE,
      DIAGNOSTIC_DECISIONS.SAME_LEVEL_CONFIRMATION,
    ]).toContain(decision.decisionType);
    expect(decision.decisionType).not.toBe(DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE);
  });

  it('selects a next question for the decided skill from the bank', () => {
    const { bank } = getQuestionBank({ targetSkillIds: ['D003', 'D004'], perSkill: 3 });
    const decision = { decisionType: DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE, nextSkillId: 'D003' };
    const next = selectNextDiagnosticQuestion({
      decision,
      questionBank: bank,
      sessionState: { attemptedQuestionIds: [] },
    });
    expect(next).toBeTruthy();
    expect(next.skillId).toBe('D003');
  });
});

describe('Decimals diagnostic domain — result', () => {
  it('builds a result with weak/secure skills and a recommended start', () => {
    const result = buildResult({
      session: { mode: 'baseline' },
      responses: [
        { skillId: 'D001', correct: true },
        { skillId: 'D003', correct: true },
        { skillId: 'D006', correct: false },
      ],
      decisionHistory: [
        { decisionType: DIAGNOSTIC_DECISIONS.MARK_SECURE, currentSkillId: 'D001' },
        { decisionType: DIAGNOSTIC_DECISIONS.MOVE_UP, currentSkillId: 'D003' },
      ],
      readinessScore: 62,
      assignedPracticeSkillIds: ['D006'],
    });
    expect(result.readinessBand).toBe('progressing');
    expect(result.weakSkills.map((s) => s.skillId)).toContain('D006');
    expect(result.masteredSkills.map((s) => s.skillId)).toEqual(expect.arrayContaining(['D001', 'D003']));
    expect(result.recommendedStartingSkillId).toBe('D006');
    expect(result.diagnosticCompleted).toBe(true);
  });
});
