import { describe, expect, it } from 'vitest';
import {
  auditSkillVisualRequirements,
  evaluateQuestionVisualCoverage,
  getSkillVisualRequirement,
} from '../services/mathpath/skillVisualRequirementEngine.js';

describe('skillVisualRequirementEngine', () => {
  it('requires number lines for F005', () => {
    const requirement = getSkillVisualRequirement('F005');

    expect(requirement.visualRequired).toBe(true);
    expect(requirement.requiredVisualTypes).toContain('number_line');
  });

  it('requires bar models for fraction word problem skills', () => {
    const requirement = getSkillVisualRequirement('F025');

    expect(requirement.requiredVisualTypes).toContain('bar_model');
    expect(requirement.reason).toMatch(/model-method/i);
  });

  it('detects missing visual metadata on a question', () => {
    const coverage = evaluateQuestionVisualCoverage({
      skillId: 'F023',
      questionText: 'Ali spent 1/2 of his money and then 1/3 of the remainder. How much was left?',
    });

    expect(coverage.visualModelRequired).toBe(true);
    expect(coverage.missingVisualTypes).toContain('bar_model');
    expect(coverage.status).toBe('missing');
  });

  it('accepts provided visual metadata', () => {
    const coverage = evaluateQuestionVisualCoverage({
      skillId: 'F005',
      questionText: 'Place 3/4 on the number line.',
      metadata: { visualType: 'number_line' },
    });

    expect(coverage.missingVisualTypes).toEqual([]);
    expect(coverage.status).toBe('present');
  });

  it('builds a fraction skill visual requirement audit', () => {
    const audit = auditSkillVisualRequirements(['F005'], [
      { id: 'q1', skillId: 'F005', questionText: 'Place 3/4 on the number line.' },
    ]);

    expect(audit[0]).toMatchObject({
      skillId: 'F005',
      currentStatus: 'partial',
      missingQuestionCount: 1,
    });
  });
});
