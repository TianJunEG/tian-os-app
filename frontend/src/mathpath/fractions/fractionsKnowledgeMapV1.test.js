import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_ASSET_HOOKS,
  flattenMicroSkills,
  getLegacySkillMappings,
  validateKnowledgeMap,
} from '../knowledge/knowledgeMapModel.js';
import { fractionsKnowledgeMapV1 } from './fractionsKnowledgeMapV1.js';

describe('fractionsKnowledgeMapV1', () => {
  it('defines a valid P4 fractions knowledge map without production selectors', () => {
    const result = validateKnowledgeMap(fractionsKnowledgeMapV1);

    expect(result.ok).toBe(true);
    expect(result.summary).toMatchObject({
      domain: 'fractions',
      stage: 'P4',
      topicCount: 6,
    });
    expect(fractionsKnowledgeMapV1.source.productionBehaviorChanged).toBe(false);
  });

  it('preserves legacy F-code compatibility for audited P4 skills', () => {
    const legacyMappings = getLegacySkillMappings(fractionsKnowledgeMapV1);

    [
      'F001', 'F002', 'F003', 'F004', 'F005',
      'F006', 'F007', 'F008', 'F009',
      'F010', 'F011', 'F012',
      'F013', 'F014', 'F015',
      'F016', 'F017', 'F018', 'F019', 'F020',
      'F023', 'F024', 'F025',
    ].forEach((legacySkillId) => {
      expect(legacyMappings[legacySkillId]?.length).toBeGreaterThan(0);
    });
  });

  it('stores misconceptions and future asset hooks on every micro-skill', () => {
    flattenMicroSkills(fractionsKnowledgeMapV1).forEach((microSkill) => {
      expect(microSkill.learningObjectives.length).toBeGreaterThan(0);
      expect(microSkill.misconceptions.length).toBeGreaterThan(0);
      KNOWLEDGE_ASSET_HOOKS.forEach((hook) => {
        expect(Array.isArray(microSkill[hook])).toBe(true);
        expect(microSkill[hook]).toHaveLength(0);
      });
    });
  });
});
