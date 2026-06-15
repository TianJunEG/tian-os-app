import { describe, it, expect } from 'vitest';
import decimalsDiagnosticDomain, {
  buildSkillGraph,
  getQuestionBank,
  getQuestionById,
  toGenericQuestion,
  loadSkills,
  selectTargetSkills,
  selectInitialQuestions,
  resolveDiagnosticCount,
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

describe('Decimals diagnostic domain — runtime methods (DB-free)', () => {
  it('loadSkills returns all skills plus a framework-id index', () => {
    const { skills, byFrameworkId } = loadSkills();
    expect(skills).toHaveLength(14);
    expect(byFrameworkId.get('D006').name).toBe('Adding and Subtracting Decimals');
  });

  it('selectTargetSkills orders by difficulty and honours a start skill', () => {
    const { skills } = loadSkills();
    const ordered = selectTargetSkills({ skills });
    expect(ordered[0].difficulty).toBeLessThanOrEqual(ordered[ordered.length - 1].difficulty);
    const withStart = selectTargetSkills({ skills, startSkillId: 'D011' });
    expect(withStart[0].skillId).toBe('D011');
  });

  it('selectInitialQuestions returns one question per evenly-sampled skill', () => {
    const { skills } = loadSkills();
    const targetSkills = selectTargetSkills({ skills });
    const questions = selectInitialQuestions({ targetSkills, count: 8 });
    expect(questions).toHaveLength(8);
    expect(new Set(questions.map((q) => q.questionId)).size).toBe(8);
    expect(new Set(questions.map((q) => q.skillId)).size).toBe(8); // distinct skills
    expect(questions.every((q) => q.answer && q.prompt)).toBe(true);
  });

  it('resolveDiagnosticCount returns fewer questions for a quick run', () => {
    expect(resolveDiagnosticCount('core')).toBe(8);
    expect(resolveDiagnosticCount('quick')).toBe(5);
  });

  it('getQuestionById regenerates the EXACT question (deterministic round-trip)', () => {
    const { bank } = getQuestionBank({ targetSkillIds: ['D006', 'D009'], perSkill: 2 });
    for (const q of bank) {
      const regen = getQuestionById(q.questionId);
      expect(regen).toBeTruthy();
      expect(regen.questionId).toBe(q.questionId);
      expect(regen.prompt).toBe(q.prompt);
      expect(regen.answer.display).toBe(q.answer.display);
      // the regenerated item grades the bank item's correct answer as correct
      expect(scoreAnswer(toGenericQuestion(regen), { answer: q.answer.display })).toBe(true);
    }
    expect(getQuestionById('not-a-valid-id')).toBeNull();
  });

  it('supports a full DB-free start → answer data path', () => {
    const { skills } = loadSkills();
    const targetSkills = selectTargetSkills({ skills });
    const initial = selectInitialQuestions({ targetSkills, count: resolveDiagnosticCount('core') });
    const first = initial[0];
    // runtime re-fetches the current question by id, then grades it
    const refetched = getQuestionById(first.questionId);
    expect(refetched.skillId).toBe(first.skillId);
    expect(scoreAnswer(toGenericQuestion(refetched), { answer: refetched.answer.display })).toBe(true);
    expect(scoreAnswer(toGenericQuestion(refetched), { answer: 'wrong' })).toBe(false);
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
