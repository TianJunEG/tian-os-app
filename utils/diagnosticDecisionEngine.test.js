import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  DIAGNOSTIC_DECISIONS,
  calculateDiagnosticReadinessScore,
  decideNextDiagnosticStep,
} from '../services/mathpath/diagnosticDecisionEngine.js';

const testSkills = [
  {
    skillId: 'T001',
    subjectId: 'test_subject',
    domainId: 'test_domain',
    name: 'Foundation skill',
    difficulty: 1,
    prerequisiteSkillIds: [],
    relatedSkillIds: ['T002'],
  },
  {
    skillId: 'T002',
    subjectId: 'test_subject',
    domainId: 'test_domain',
    name: 'Middle skill',
    difficulty: 2,
    prerequisiteSkillIds: ['T001'],
    relatedSkillIds: ['T003'],
  },
  {
    skillId: 'T003',
    subjectId: 'test_subject',
    domainId: 'test_domain',
    name: 'Advanced skill',
    difficulty: 3,
    prerequisiteSkillIds: ['T002'],
    relatedSkillIds: [],
  },
];

const scienceSkills = [
  {
    skillId: 'SCI001',
    subjectId: 'science',
    domainId: 'energy',
    difficulty: 1,
    prerequisiteSkillIds: [],
    relatedSkillIds: ['SCI002'],
  },
  {
    skillId: 'SCI002',
    subjectId: 'science',
    domainId: 'energy',
    difficulty: 2,
    prerequisiteSkillIds: ['SCI001'],
  },
];

const grammarSkills = [
  {
    skillId: 'GRAM001',
    subjectId: 'english',
    domainId: 'grammar',
    difficulty: 1,
    prerequisiteSkillIds: [],
    relatedSkillIds: ['GRAM002'],
  },
  {
    skillId: 'GRAM002',
    subjectId: 'english',
    domainId: 'grammar',
    difficulty: 2,
    prerequisiteSkillIds: ['GRAM001'],
  },
];

const question = {
  questionId: 'q-current',
  skillId: 'T003',
  difficulty: 3,
  diagnosticPurpose: 'main_skill_probe',
  errorTagsSupported: ['missing_prerequisite', 'careless_error'],
  canRephrase: true,
  hasParallelItem: true,
  expectedTimeMs: 30000,
};

describe('generic diagnostic decision engine', () => {
  it('marks secure or moves up after a correct high-confidence response', () => {
    const decision = decideNextDiagnosticStep({
      currentSkill: testSkills[1],
      currentQuestion: { ...question, skillId: 'T002', difficulty: 2 },
      response: { correct: true, confidence: 'i_know_this', timeTakenMs: 12000 },
      studentEvidence: { secureSkillIds: ['T001'] },
      skillGraph: testSkills,
    });

    expect(decision.decisionType).toBe(DIAGNOSTIC_DECISIONS.MOVE_UP);
    expect(decision.nextSkillId).toBe('T003');
  });

  it('marks fragile or asks for same-level confirmation after correct low-confidence response', () => {
    const decision = decideNextDiagnosticStep({
      currentSkill: testSkills[1],
      currentQuestion: { ...question, skillId: 'T002', hasParallelItem: true },
      response: { correct: true, confidence: 'not_sure', timeTakenMs: 12000 },
      skillGraph: testSkills,
    });

    expect(decision.decisionType).toBe(DIAGNOSTIC_DECISIONS.SAME_LEVEL_CONFIRMATION);
    expect(decision.nextSkillId).toBe('T002');
  });

  it('triggers misconception probe after wrong high-confidence response', () => {
    const decision = decideNextDiagnosticStep({
      currentSkill: testSkills[2],
      currentQuestion: question,
      response: { correct: false, confidence: 'i_know_this', detectedErrorTags: ['operation_mismatch'] },
      skillGraph: testSkills,
    });

    expect(decision.decisionType).toBe(DIAGNOSTIC_DECISIONS.MISCONCEPTION_PROBE);
    expect(decision.nextSkillId).toBe('T003');
  });

  it('probes prerequisite from skillGraph after wrong low-confidence response', () => {
    const decision = decideNextDiagnosticStep({
      currentSkill: testSkills[2],
      currentQuestion: question,
      response: { correct: false, confidence: 'not_sure', detectedErrorTags: ['missing_prerequisite'] },
      studentEvidence: { secureSkillIds: ['T001'] },
      skillGraph: testSkills,
    });

    expect(decision.decisionType).toBe(DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE);
    expect(decision.nextSkillId).toBe('T002');
    expect(decision.reason).toMatch(/skill graph/i);
  });

  it('steps down or probes prerequisite after skipped question', () => {
    const decision = decideNextDiagnosticStep({
      currentSkill: testSkills[2],
      currentQuestion: question,
      response: { correct: false, confidence: 'dont_know', skipped: true },
      studentEvidence: { secureSkillIds: ['T001', 'T002'] },
      skillGraph: testSkills,
    });

    expect([DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE, DIAGNOSTIC_DECISIONS.STEP_DOWN]).toContain(decision.decisionType);
    expect(decision.nextSkillId).toBe('T002');
  });

  it('steps down after blank answer when prerequisite metadata is not useful', () => {
    const currentSkill = { ...testSkills[2], prerequisiteSkillIds: [] };
    const decision = decideNextDiagnosticStep({
      currentSkill,
      currentQuestion: question,
      response: { correct: false, confidence: 'dont_know', blankAnswer: true, studentAnswer: '' },
      skillGraph: testSkills,
    });

    expect(decision.decisionType).toBe(DIAGNOSTIC_DECISIONS.STEP_DOWN);
    expect(decision.nextSkillId).toBe('T002');
  });

  it('stops and assigns practice after repeated wrong answers', () => {
    const decision = decideNextDiagnosticStep({
      currentSkill: testSkills[2],
      currentQuestion: question,
      response: { correct: false, confidence: 'not_sure' },
      studentEvidence: { secureSkillIds: ['T001'], consecutiveWrong: 1 },
      sessionState: { repeatedWrongLimit: 2 },
      skillGraph: testSkills,
    });

    expect(decision.decisionType).toBe(DIAGNOSTIC_DECISIONS.STOP_AND_ASSIGN_PRACTICE);
    expect(decision.shouldStopDiagnostic).toBe(true);
    expect(decision.assignedPracticeSkillIds).toEqual(['T002']);
  });

  it('rephrases once only when currentQuestion.canRephrase is true', () => {
    const first = decideNextDiagnosticStep({
      currentSkill: testSkills[2],
      currentQuestion: { ...question, canRephrase: true },
      response: { correct: false, confidence: 'not_sure', detectedErrorTags: ['misread_question'] },
      skillGraph: testSkills,
    });
    const second = decideNextDiagnosticStep({
      currentSkill: testSkills[2],
      currentQuestion: { ...question, canRephrase: true },
      response: { correct: false, confidence: 'not_sure', detectedErrorTags: ['misread_question'] },
      sessionState: { rephraseUsedByQuestion: { 'q-current': true } },
      skillGraph: testSkills,
    });

    expect(first.decisionType).toBe(DIAGNOSTIC_DECISIONS.REPHRASE_ONCE);
    expect(first.shouldRephrase).toBe(true);
    expect(second.decisionType).not.toBe(DIAGNOSTIC_DECISIONS.REPHRASE_ONCE);
  });

  it('engine source contains no hardcoded fraction skill IDs', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'services/mathpath/diagnosticDecisionEngine.js'), 'utf8');
    expect(source).not.toMatch(/\bF\d{3}\b/);
  });

  it('works with a fake non-math domain', () => {
    const decision = decideNextDiagnosticStep({
      currentSkill: testSkills[2],
      currentQuestion: question,
      response: { correct: false, confidence: 'not_sure' },
      studentEvidence: { secureSkillIds: ['T001'] },
      skillGraph: testSkills,
    });

    expect(decision.nextSkillId).toBe('T002');
  });

  it('works with a fake science skill graph', () => {
    const decision = decideNextDiagnosticStep({
      currentSkill: scienceSkills[1],
      currentQuestion: { questionId: 'sci-q', skillId: 'SCI002', difficulty: 2 },
      response: { correct: false, confidence: 'dont_know' },
      skillGraph: scienceSkills,
    });

    expect(decision.decisionType).toBe(DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE);
    expect(decision.nextSkillId).toBe('SCI001');
  });

  it('works with a fake grammar skill graph', () => {
    const decision = decideNextDiagnosticStep({
      currentSkill: grammarSkills[1],
      currentQuestion: { questionId: 'grammar-q', skillId: 'GRAM002', difficulty: 2 },
      response: { correct: true, confidence: 'not_sure', timeTakenMs: 10000 },
      skillGraph: grammarSkills,
    });

    expect(decision.decisionType).toBe(DIAGNOSTIC_DECISIONS.MARK_FRAGILE);
    expect(decision.nextSkillId).toBe('GRAM002');
  });

  it('falls back to difficulty step-down and logs metadata gap when prerequisiteSkillIds are missing', () => {
    const decision = decideNextDiagnosticStep({
      currentSkill: { ...testSkills[2], prerequisiteSkillIds: [] },
      currentQuestion: question,
      response: { correct: false, confidence: 'not_sure' },
      skillGraph: testSkills,
    });

    expect(decision.decisionType).toBe(DIAGNOSTIC_DECISIONS.STEP_DOWN);
    expect(decision.nextSkillId).toBe('T002');
    expect(decision.metadataGaps).toContain('missing_prerequisite_metadata');
  });

  it('returns a decision object suitable for diagnostic session decision history', () => {
    const decision = decideNextDiagnosticStep({
      sessionId: 'diag_1',
      studentId: 'student_1',
      currentSkill: testSkills[2],
      currentQuestion: question,
      response: { correct: false, confidence: 'not_sure', timeTakenMs: 42000, workingSubmitted: false },
      skillGraph: testSkills,
    });

    expect(decision).toMatchObject({
      sessionId: 'diag_1',
      studentId: 'student_1',
      currentSkillId: 'T003',
      currentQuestionId: 'q-current',
      responseCorrect: false,
      confidence: 'not_sure',
      timeTakenMs: 42000,
      workingSubmitted: false,
      decisionType: DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE,
      nextSkillId: 'T002',
    });
  });

  it('readiness score changes with confidence, time, attempts, and difficulty', () => {
    const secure = calculateDiagnosticReadinessScore({
      correct: true,
      confidence: 'i_know_this',
      timeTakenMs: 12000,
      difficulty: 3,
      attempts: 1,
    });
    const fragile = calculateDiagnosticReadinessScore({
      correct: true,
      confidence: 'not_sure',
      timeTakenMs: 90000,
      difficulty: 3,
      attempts: 2,
    });

    expect(secure).toBeGreaterThan(fragile);
  });
});
