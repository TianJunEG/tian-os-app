// Regression: the operations practice/retention/fluency services accept a skillId
// that may be an ID ('OP001') or a diagnostic slug ('op.add.facts'). getSkill()
// resolves both, but the question-family lookup is keyed by ID only — so a slug
// must be canonicalised to an ID before generation, or the drill comes back empty.
import { describe, it, expect } from 'vitest';
import { getSkill } from '../../shared/mathpath/operations/OperationsSkillGraph.js';
import { buildOperationsRetentionReview } from './operationsRetentionService.js';
import { buildOperationsFluencyDrill } from './operationsFluencyService.js';

// Pick a real skill that has both an ID and a slug.
const sample = getSkill('OP001');

describe('operations services canonicalise slug → ID', () => {
  it('the fixture skill exposes both id and slug', () => {
    expect(sample).toBeTruthy();
    expect(sample.id).toBe('OP001');
    expect(typeof sample.slug).toBe('string');
    expect(sample.slug).toContain('.');
    // getSkill resolves the slug back to the same skill
    expect(getSkill(sample.slug)?.id).toBe('OP001');
  });

  it('retention review yields the same question count for slug and ID', () => {
    const byId = buildOperationsRetentionReview({ skillId: sample.id });
    const bySlug = buildOperationsRetentionReview({ skillId: sample.slug });
    expect(byId.questions.length).toBeGreaterThan(0);
    expect(bySlug.questions.length).toBe(byId.questions.length);
    expect(bySlug.skillId).toBe('OP001'); // canonicalised
  });

  it('fluency drill yields questions when given a slug', () => {
    const bySlug = buildOperationsFluencyDrill({ skillId: sample.slug });
    expect(bySlug.questions.length).toBeGreaterThan(0);
    expect(bySlug.skillId).toBe('OP001'); // canonicalised
  });
});
