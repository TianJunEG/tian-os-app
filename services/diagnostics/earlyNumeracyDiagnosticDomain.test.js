// The K2 Early-Numeracy diagnostic adapter. EarlyNumeracy skills carry
// questionFamilies + their own generator (not the questionStructures shape the
// generic factory consumes), so this domain has a hand-written adapter. These
// tests pin the runtime contract: deterministic replay-by-id, level-aware skill
// selection, faithful grading via the EN answer checker, and a well-formed
// result.
import { describe, it, expect } from 'vitest';
import en from './domains/earlyNumeracyDiagnosticDomain.js';
import { hasDiagnosticDomain, getDiagnosticDomain } from './diagnosticDomainRegistry.js';

describe('earlyNumeracyDiagnosticDomain — registry', () => {
  it('is registered under math/early_numeracy', () => {
    expect(hasDiagnosticDomain({ subjectId: 'math', domainId: 'early_numeracy' })).toBe(true);
    expect(getDiagnosticDomain({ subjectId: 'math', domainId: 'early_numeracy' }).displayName).toBe('Numeracy');
  });

  it('exposes the full diagnostic-domain contract', () => {
    for (const m of ['loadSkills', 'selectTargetSkills', 'selectInitialQuestions', 'getQuestionBank', 'getQuestionById', 'scoreAnswer', 'detectErrorTags', 'buildResult', 'getSupportiveCopy', 'resolveDiagnosticCount', 'normalizeDiagnosticModeForLevel']) {
      expect(typeof en[m]).toBe('function');
    }
  });
});

describe('earlyNumeracyDiagnosticDomain — skills', () => {
  it('shapes skills keyed by slug, with EN-id prerequisites mapped to slugs', () => {
    const { skills } = en.loadSkills();
    expect(skills.length).toBeGreaterThanOrEqual(8);
    const first = skills[0];
    expect(first.skillId).toBe('en.count.to10');
    expect(first.name).toBe('Counting to 10');
    // A skill whose EN-id prerequisite is EN001 should now reference its slug.
    const withPrereq = skills.find((s) => s.prerequisiteSkillIds.length);
    expect(withPrereq.prerequisiteSkillIds.every((p) => p.startsWith('en.'))).toBe(true);
  });

  it('basic mode targets K2 skills', () => {
    const { skills } = en.loadSkills();
    const target = en.selectTargetSkills({ skills, mode: 'basic' });
    expect(target.length).toBeGreaterThan(0);
  });
});

describe('earlyNumeracyDiagnosticDomain — questions', () => {
  it('selects initial questions and replays them deterministically by id', () => {
    const { skills } = en.loadSkills();
    const target = en.selectTargetSkills({ skills, mode: 'core' });
    const initial = en.selectInitialQuestions({ targetSkills: target, count: 4 });
    expect(initial.length).toBeGreaterThan(0);
    for (const q of initial) {
      expect(q.questionId).toMatch(/__q\d+$/);
      const replayed = en.getQuestionById(q.questionId);
      expect(replayed).not.toBeNull();
      // Same id → same prompt (deterministic, static-salt replay).
      expect(replayed.prompt).toBe(q.prompt);
    }
  });

  it('grades a correct answer correct and a wrong answer wrong', () => {
    const { skills } = en.loadSkills();
    const q = en.selectInitialQuestions({ targetSkills: skills, count: 1 })[0];
    expect(en.scoreAnswer(q, { answer: q.answer?.display })).toBe(true);
    expect(en.scoreAnswer(q, { answer: '___definitely-wrong___' })).toBe(false);
    expect(en.scoreAnswer(q, { skipped: true })).toBe(false);
  });
});

describe('earlyNumeracyDiagnosticDomain — result', () => {
  it('builds a result with a recommended starting skill', () => {
    const { skills } = en.loadSkills();
    const a = skills[0].skillId;
    const result = en.buildResult({
      session: { currentSkillId: a, mode: 'baseline' },
      responses: [
        { skillId: a, correct: false, skipped: false },
        { skillId: skills[1].skillId, correct: true, skipped: false },
      ],
      decisionHistory: [],
      readinessScore: 50,
      assignedPracticeSkillIds: [a],
    });
    expect(result.diagnosticCompleted).toBe(true);
    expect(result.recommendedStartingSkillId).toBe(a);
    expect(result.weakSkills.some((w) => w.skillId === a)).toBe(true);
    expect(result.perSkillSnapshot.length).toBe(2);
  });
});
