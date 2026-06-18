import { describe, it, expect } from 'vitest';
import { generateFractionQuestionSet, checkFractionAnswer } from './fractionQuestionGenerator.js';
import { fractionSkillGraph } from './fractionSkillGraph.js';
import { getQuestionFamiliesBySkill } from './fractionQuestionFamilies.js';

const SKILL_IDS = fractionSkillGraph.skillIds;
// Skills where every family is quarantined will generate 0 questions — skip coverage check for those.
const ACTIVE_SKILL_IDS = SKILL_IDS.filter((id) => getQuestionFamiliesBySkill(id).length > 0);

function sampleAll(perSkill = 40) {
  const out = [];
  for (const skillId of ACTIVE_SKILL_IDS) {
    for (let c = 0; c < perSkill; c++) {
      out.push(...generateFractionQuestionSet({ skillId, count: 6 }));
    }
  }
  return out;
}

describe('fractionQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for every skill that has active families', () => {
    for (const skillId of ACTIVE_SKILL_IDS) {
      const qs = generateFractionQuestionSet({ skillId, count: 6 });
      expect(qs.length, `no questions for ${skillId}`).toBeGreaterThan(0);
    }
  });

  it('reports which skills have all families quarantined (informational)', () => {
    const fullyQuarantined = SKILL_IDS.filter((id) => getQuestionFamiliesBySkill(id).length === 0);
    // F013 is expected — all 5 families quarantined. If this list grows unexpectedly, investigate.
    expect(fullyQuarantined).toEqual(expect.arrayContaining(['F013']));
  });

  // Singapore school paper wording guards — these patterns must never appear in production.
  it('uses Singapore school paper wording — no "Compute:" prefix', () => {
    for (const q of questions) expect(q.prompt, q.prompt).not.toMatch(/\bCompute:/i);
  });

  it('uses Singapore school paper wording — no "Exam-style:" prefix', () => {
    for (const q of questions) expect(q.prompt, q.prompt).not.toMatch(/\bExam-style:/i);
  });

  it('uses Singapore school paper wording — no "Mastery challenge:" prefix', () => {
    for (const q of questions) expect(q.prompt, q.prompt).not.toMatch(/\bMastery challenge:/i);
  });

  it('uses Singapore school paper wording — no "Calculate:" prefix', () => {
    for (const q of questions) expect(q.prompt, q.prompt).not.toMatch(/\bCalculate:/i);
  });

  it('uses Singapore school paper wording — "simplest form" not "lowest terms"', () => {
    for (const q of questions) expect(q.prompt, q.prompt).not.toMatch(/lowest terms/i);
  });

  it('uses Singapore school paper wording — "Express as" not "Convert to" for fractions', () => {
    for (const q of questions) expect(q.prompt, q.prompt).not.toMatch(/Convert the mixed number/i);
  });

  it('uses Singapore school paper wording — "Arrange" not "Order these fractions"', () => {
    for (const q of questions) expect(q.prompt, q.prompt).not.toMatch(/Order these fractions from/i);
  });

  // Diagram integrity — fraction_bar renderer only supports shaded <= parts (single bar).
  // Multi-shape questions (shaded > parts, or wholes field present) require a renderer that
  // is not yet built and will show a blank diagram. Any question that reaches here is a bug.
  it('has no fraction_bar diagramSpec where shaded > parts', () => {
    for (const q of questions) {
      const spec = q.diagramSpec;
      if (!spec || spec.type !== 'fraction_bar') continue;
      const { parts, shaded, wholes } = spec.data || {};
      expect(
        wholes,
        `${q.prompt} — multi-shape diagramSpec (wholes=${wholes}) will render blank`,
      ).toBeUndefined();
      expect(
        Number(shaded) <= Number(parts),
        `${q.prompt} — shaded (${shaded}) > parts (${parts}), will render blank`,
      ).toBe(true);
    }
  });

  // Answer integrity
  it('every answer has a display string', () => {
    for (const q of questions) {
      expect(typeof q.answer?.display, q.prompt).toBe('string');
      expect(q.answer.display.length, q.prompt).toBeGreaterThan(0);
    }
  });

  it('every question has at least one solution step', () => {
    for (const q of questions) {
      expect(Array.isArray(q.solutionSteps), q.prompt).toBe(true);
      expect(q.solutionSteps.length, q.prompt).toBeGreaterThanOrEqual(1);
    }
  });

  // checkFractionAnswer — correct answer always accepted
  it('checkFractionAnswer accepts the generated correct answer', () => {
    const sample = generateFractionQuestionSet({ skillId: 'F001', count: 6 });
    for (const q of sample) {
      if (!q.acceptedAnswers?.length) continue;
      const result = checkFractionAnswer({
        studentAnswer: q.acceptedAnswers[0],
        correctAnswer: q.answer,
        acceptedAnswers: q.acceptedAnswers,
      });
      expect(result.correct, `${q.prompt} — answer: ${q.acceptedAnswers[0]}`).toBe(true);
    }
  });

  it('checkFractionAnswer rejects a clearly wrong answer', () => {
    const sample = generateFractionQuestionSet({ skillId: 'F001', count: 6 });
    for (const q of sample) {
      const result = checkFractionAnswer({
        studentAnswer: 'WRONG_ANSWER_XYZ',
        correctAnswer: q.answer,
        acceptedAnswers: q.acceptedAnswers || [],
      });
      expect(result.correct, q.prompt).toBe(false);
    }
  });
});
