import { describe, expect, it } from 'vitest';
import { flattenMicroSkills } from '../knowledge/knowledgeMapModel.js';
import {
  INTERVENTION_TYPES,
  getMisconceptionById,
  getRemediationEntryByMicroSkillId,
  validateRemediationMap,
} from '../knowledge/remediationMapModel.js';
import { fractionsKnowledgeMapV1 } from './fractionsKnowledgeMapV1.js';
import { fractionsRemediationMapV1 } from './fractionsRemediationMapV1.js';

describe('fractionsRemediationMapV1', () => {
  it('covers every P4 fractions micro-skill from the knowledge map', () => {
    const result = validateRemediationMap(fractionsRemediationMapV1, fractionsKnowledgeMapV1);
    const microSkillCount = flattenMicroSkills(fractionsKnowledgeMapV1).length;

    expect(result.ok).toBe(true);
    expect(result.summary).toMatchObject({
      domain: 'fractions',
      stage: 'P4',
      entryCount: microSkillCount,
      knowledgeMicroSkillCount: microSkillCount,
    });
    expect(result.summary.misconceptionCount).toBeGreaterThan(microSkillCount);
  });

  it('requires observable behaviours, likely causes, and interventions for every misconception', () => {
    fractionsRemediationMapV1.entries.forEach((entry) => {
      expect(entry.observableBehaviours.length).toBeGreaterThan(0);
      expect(entry.likelyCauses.length).toBeGreaterThan(0);
      expect(entry.interventions.length).toBeGreaterThan(0);
      entry.misconceptions.forEach((misconception) => {
        expect(misconception.observableBehaviours.length).toBeGreaterThan(0);
        expect(misconception.likelyCauses.length).toBeGreaterThan(0);
        expect(misconception.interventions.length).toBeGreaterThan(0);
      });
    });
  });

  it('maps improper-to-mixed conversion to targeted evidence and interventions', () => {
    const entry = getRemediationEntryByMicroSkillId(
      fractionsRemediationMapV1,
      'fractions.p4.convert_improper_to_mixed'
    );
    const misconception = getMisconceptionById(fractionsRemediationMapV1, 'M-MIX-007');

    expect(entry.misconceptions.map((item) => item.id)).toEqual(['M-MIX-006', 'M-MIX-007']);
    expect(misconception.observableBehaviours).toContain('7/3 = 3 1/2.');
    expect(misconception.likelyCauses).toContain('Does not understand whole groups of denominator size.');
    expect(misconception.interventions).toEqual([
      INTERVENTION_TYPES.CONCEPT_REVIEW,
      INTERVENTION_TYPES.GUIDED_EXAMPLE,
      INTERVENTION_TYPES.FLUENCY,
    ]);
  });
});
