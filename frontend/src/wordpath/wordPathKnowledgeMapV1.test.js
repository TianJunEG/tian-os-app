import { describe, expect, it } from 'vitest';
import {
  MODEL_METHOD_TYPES,
  buildWordMisconceptionMap,
  getWordMicroSkillById,
  getWordStructureById,
  validateWordPathMap,
} from './wordStructureModel.js';
import { wordPathKnowledgeMapV1 } from './wordPathKnowledgeMapV1.js';

describe('wordPathKnowledgeMapV1', () => {
  it('defines a valid standalone WordPath architecture', () => {
    const result = validateWordPathMap(wordPathKnowledgeMapV1);

    expect(result.ok).toBe(true);
    expect(result.summary).toMatchObject({
      structureCount: 13,
      microSkillCount: 16,
      diagnosticAssetCount: 48,
      remediationAssetCount: 112,
    });
    expect(wordPathKnowledgeMapV1.productionBehaviorChanged).toBe(false);
  });

  it('includes Singapore Model Method metadata for each structure', () => {
    wordPathKnowledgeMapV1.structures.forEach((structure) => {
      expect(structure.modelMethod.modelType).toBeTruthy();
      expect(structure.modelMethod.visualRepresentation).toBeTruthy();
    });
    expect(getWordStructureById(wordPathKnowledgeMapV1, 'wordpath.fraction_of_remainder')).toMatchObject({
      modelMethod: {
        modelType: MODEL_METHOD_TYPES.FRACTION_BAR,
        visualRepresentation: 'original bar, removed segment, then remainder bar repartitioned',
      },
    });
  });

  it('maps Fraction of Remainder thinking separately from fraction computation', () => {
    const microSkill = getWordMicroSkillById(
      wordPathKnowledgeMapV1,
      'wordpath.fraction_remainder.identify_original_removed_remainder'
    );

    expect(microSkill.mathPathLinks).toEqual([
      'F024',
      'F025',
      'fractions.p4.fraction_remainder_reasoning',
    ]);
    expect(microSkill.misconceptions.map((item) => item.id)).toEqual(['WP-FR-001', 'WP-FR-002']);
    expect(microSkill.diagnosticAssets).toHaveLength(3);
    expect(microSkill.remediationAssets).toHaveLength(7);
  });

  it('exposes misconception evidence for word-structure weaknesses', () => {
    expect(buildWordMisconceptionMap(wordPathKnowledgeMapV1)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          structure: 'wordpath.fraction_of_remainder',
          microSkill: 'wordpath.fraction_remainder.identify_original_removed_remainder',
          misconception: 'WP-FR-001',
          observableBehaviour: 'Applies each fraction to the starting amount.',
        }),
        expect.objectContaining({
          structure: 'wordpath.repeated_quantity',
          misconception: 'WP-RQ-001',
        }),
      ])
    );
  });
});
