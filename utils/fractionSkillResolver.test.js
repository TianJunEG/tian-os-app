import { describe, it, expect } from 'vitest';
import {
  resolveFractionSkillId,
  getCanonicalFractionSkillLinks,
} from '../services/mathpath/fractionSkillResolver.js';

describe('fractionSkillResolver', () => {
  it('maps F025/F026 to canonical links', () => {
    const f025 = getCanonicalFractionSkillLinks('F025');
    const f026 = getCanonicalFractionSkillLinks('F026');
    expect(f025?.frameworkSkillId).toBe('F025');
    expect(f026?.frameworkSkillId).toBe('F026');
    expect(typeof f025?.universalSkillSlug).toBe('string');
    expect(typeof f026?.universalSkillSlug).toBe('string');
  });

  it('resolves legacy/domain slugs to F-codes', () => {
    expect(resolveFractionSkillId('fr.exam-applications')).toBe('F025');
    expect(resolveFractionSkillId('fr.mastery-challenge')).toBe('F026');
  });

  it('resolves universal slugs back to F-codes', () => {
    expect(resolveFractionSkillId('fractions.word_problems_basic')).toBe('F025');
    expect(resolveFractionSkillId('fractions.word_problems_multi_step')).toBe('F026');
  });
});
