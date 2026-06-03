import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  DIAGNOSTIC_DECISIONS,
  calculateDiagnosticReadinessScore,
  decideNextDiagnosticStep,
} from './adaptiveDiagnosticDecisionEngine.js';
import { selectNextDiagnosticQuestion } from './selectNextDiagnosticQuestion.js';

const skills = [
  { skillId: 'T001', subjectId: 'test_subject', domainId: 'test_domain', difficulty: 1, prerequisiteSkillIds: [], relatedSkillIds: ['T002'] },
  { skillId: 'T002', subjectId: 'test_subject', domainId: 'test_domain', difficulty: 2, prerequisiteSkillIds: ['T001'], relatedSkillIds: ['T003'] },
  { skillId: 'T003', subjectId: 'test_subject', domainId: 'test_domain', difficulty: 3, prerequisiteSkillIds: ['T002'], relatedSkillIds: [] },
];

const baseQuestion = {
  questionId: 'q3a',
  skillId: 'T003',
  difficulty: 3,
  canRephrase: true,
  hasParallelItem: true,
  expectedTimeMs: 30000,
  errorTagsSupported: ['missing_prerequisite', 'misread_question'],
};

function decide(overrides = {}) {
  return decideNextDiagnosticStep({
    currentSkill: overrides.currentSkill || skills[2],
    currentQuestion: overrides.currentQuestion || baseQuestion,
    response: overrides.response || {},
    studentEvidence: overrides.studentEvidence || {},
    skillGraph: overrides.skillGraph || skills,
    questionBank: overrides.questionBank || [],
    sessionState: overrides.sessionState || {},
  });
}

describe('adaptive diagnostic decision engine', () => {
  it('correct + high confidence + reasonable time moves up or marks secure', () => {
    const d = decide({ currentSkill: skills[1], currentQuestion: { ...baseQuestion, skillId: 'T002', difficulty: 2 }, response: { correct: true, confidence: 'i_know_this', timeTakenMs: 10000 } });
    expect([DIAGNOSTIC_DECISIONS.MOVE_UP, DIAGNOSTIC_DECISIONS.MARK_SECURE]).toContain(d.decisionType);
  });

  it('correct + low confidence marks fragile or confirms same level', () => {
    const d = decide({ response: { correct: true, confidence: 'not_sure', timeTakenMs: 10000 } });
    expect([DIAGNOSTIC_DECISIONS.MARK_FRAGILE, DIAGNOSTIC_DECISIONS.SAME_LEVEL_CONFIRMATION]).toContain(d.decisionType);
  });

  it('correct + slow marks fragile', () => {
    const d = decide({ response: { correct: true, confidence: 'i_know_this', timeTakenMs: 90000 } });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.MARK_FRAGILE);
  });

  it('wrong + high confidence triggers misconception probe', () => {
    const d = decide({ response: { correct: false, confidence: 'i_know_this' } });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.MISCONCEPTION_PROBE);
  });

  it('wrong + low confidence + prerequisites probes prerequisite', () => {
    const d = decide({ response: { correct: false, confidence: 'not_sure' }, studentEvidence: { secureSkillIds: ['T001'] } });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE);
    expect(d.nextSkillId).toBe('T002');
  });

  it('wrong + low confidence + no prerequisites steps down', () => {
    const d = decide({ currentSkill: { ...skills[2], prerequisiteSkillIds: [] }, response: { correct: false, confidence: 'not_sure' } });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.STEP_DOWN);
  });

  it('skipped question steps down or probes prerequisite', () => {
    const d = decide({ response: { correct: false, confidence: 'dont_know', skipped: true } });
    expect([DIAGNOSTIC_DECISIONS.STEP_DOWN, DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE]).toContain(d.decisionType);
  });

  it('blank answer steps down or probes prerequisite', () => {
    const d = decide({ response: { correct: false, confidence: 'dont_know', blankAnswer: true, studentAnswer: '' } });
    expect([DIAGNOSTIC_DECISIONS.STEP_DOWN, DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE]).toContain(d.decisionType);
  });

  it('repeated wrong answers stop and assign practice', () => {
    const d = decide({ response: { correct: false, confidence: 'not_sure' }, studentEvidence: { consecutiveWrong: 2 }, sessionState: { repeatedWrongLimit: 3 } });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.STOP_AND_ASSIGN_PRACTICE);
    expect(d.shouldStopDiagnostic).toBe(true);
  });

  it('rephrase allowed and not used returns REPHRASE_ONCE', () => {
    const d = decide({ response: { correct: false, confidence: 'not_sure', detectedErrorTags: ['misread_question'] } });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.REPHRASE_ONCE);
  });

  it('rephrase already used does not repeat', () => {
    const d = decide({
      response: { correct: false, confidence: 'not_sure', detectedErrorTags: ['misread_question'] },
      sessionState: { rephraseUsedByQuestion: { q3a: true } },
    });
    expect(d.decisionType).not.toBe(DIAGNOSTIC_DECISIONS.REPHRASE_ONCE);
  });

  it('missing prerequisite metadata logs gap and steps down', () => {
    const d = decide({ currentSkill: { ...skills[2], prerequisiteSkillIds: [] }, response: { correct: false, confidence: 'not_sure' } });
    expect(d.metadataGaps).toContain('missing_prerequisite_metadata');
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.STEP_DOWN);
  });

  it('no valid next question stops gracefully through selector fallback', () => {
    const d = decide({ response: { correct: false, confidence: 'not_sure' }, studentEvidence: { secureSkillIds: ['T001'] } });
    const next = selectNextDiagnosticQuestion({ decision: d, questionBank: [], sessionState: {} });
    expect(next).toBeNull();
  });

  it('works with fake non-math domain', () => {
    const d = decide({ response: { correct: false, confidence: 'not_sure' }, studentEvidence: { secureSkillIds: ['T001'] } });
    expect(d.nextSkillId).toBe('T002');
  });

  it('works with fake science skill graph', () => {
    const science = [
      { skillId: 'SCI001', subjectId: 'science', domainId: 'energy', difficulty: 1, prerequisiteSkillIds: [] },
      { skillId: 'SCI002', subjectId: 'science', domainId: 'energy', difficulty: 2, prerequisiteSkillIds: ['SCI001'] },
    ];
    const d = decide({ currentSkill: science[1], currentQuestion: { questionId: 'sq', skillId: 'SCI002' }, response: { correct: false, confidence: 'not_sure' }, skillGraph: science });
    expect(d.nextSkillId).toBe('SCI001');
  });

  it('works with fake grammar skill graph', () => {
    const grammar = [
      { skillId: 'G001', subjectId: 'english', domainId: 'grammar', difficulty: 1, prerequisiteSkillIds: [] },
      { skillId: 'G002', subjectId: 'english', domainId: 'grammar', difficulty: 2, prerequisiteSkillIds: ['G001'] },
    ];
    const d = decide({ currentSkill: grammar[1], currentQuestion: { questionId: 'gq', skillId: 'G002', hasParallelItem: true }, response: { correct: true, confidence: 'not_sure' }, skillGraph: grammar });
    expect([DIAGNOSTIC_DECISIONS.MARK_FRAGILE, DIAGNOSTIC_DECISIONS.SAME_LEVEL_CONFIRMATION]).toContain(d.decisionType);
  });

  it('engine contains no hardcoded Fractions skill IDs', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'services/mathpath/diagnosticDecisionEngine.js'), 'utf8');
    expect(source).not.toMatch(/\bF\d{3}\b|fractions|Fractions/);
  });

  it('selector avoids repeated questions', () => {
    const decision = { decisionType: DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE, nextSkillId: 'T002', currentQuestionId: 'q3a' };
    const next = selectNextDiagnosticQuestion({
      decision,
      questionBank: [
        { questionId: 'q2a', skillId: 'T002', difficulty: 2 },
        { questionId: 'q2b', skillId: 'T002', difficulty: 2 },
      ],
      sessionState: { attemptedQuestionIds: ['q2a'] },
    });
    expect(next.questionId).toBe('q2b');
  });

  it('selector does not continue after terminal MARK_SECURE with no next skill', () => {
    const decision = {
      decisionType: DIAGNOSTIC_DECISIONS.MARK_SECURE,
      currentSkillId: 'T003',
      currentQuestionId: 'q3a',
      nextSkillId: '',
    };
    const next = selectNextDiagnosticQuestion({
      decision,
      questionBank: [
        { questionId: 'q3b', skillId: 'T003', difficulty: 3 },
      ],
      sessionState: { attemptedQuestionIds: ['q3a'] },
    });
    expect(next).toBeNull();
  });

  it('decision object can be stored as session decision history', () => {
    const d = decide({ response: { correct: false, confidence: 'not_sure', timeTakenMs: 42000 } });
    const session = { decisionHistory: [d] };
    expect(session.decisionHistory[0]).toMatchObject({ currentSkillId: 'T003', currentQuestionId: 'q3a', decisionType: expect.any(String) });
  });

  it('readiness score changes with confidence, time, difficulty, and skip', () => {
    const strong = calculateDiagnosticReadinessScore({ correct: true, confidence: 'i_know_this', timeTakenMs: 10000, difficulty: 3 });
    const weak = calculateDiagnosticReadinessScore({ correct: true, confidence: 'not_sure', timeTakenMs: 90000, difficulty: 3, attempts: 2 });
    const skipped = calculateDiagnosticReadinessScore({ correct: false, skipped: true, difficulty: 3 });
    expect(strong).toBeGreaterThan(weak);
    expect(skipped).toBe(0);
  });
});
