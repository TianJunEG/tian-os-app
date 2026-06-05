import { describe, expect, it } from 'vitest';
import {
  MODEL_METHOD_TYPES,
  WORD_DIAGNOSTIC_TYPES,
  WORD_REMEDIATION_ASSET_TYPES,
  buildWordDiagnosticAssetMap,
  buildWordMisconceptionMap,
  buildWordRemediationAssetMap,
  getWordMicroSkillById,
  validateWordPathMap,
} from './wordStructureModel.js';

describe('wordStructureModel', () => {
  const sampleMap = {
    domain: 'wordpath',
    structures: [
      {
        id: 'wordpath.sample',
        title: 'Sample Structure',
        modelMethod: {
          modelType: MODEL_METHOD_TYPES.PART_WHOLE,
          visualRepresentation: 'sample bar',
        },
        microSkills: [
          {
            id: 'wordpath.sample.micro',
            title: 'Sample micro-skill',
            misconceptions: [
              {
                id: 'WP-SAMPLE-001',
                title: 'Sample misconception',
                observableBehaviour: 'Uses the wrong quantity.',
                likelyCause: 'Reference quantity is unclear.',
              },
            ],
            diagnosticAssets: [
              { id: 'd1', type: WORD_DIAGNOSTIC_TYPES.RECOGNITION },
              { id: 'd2', type: WORD_DIAGNOSTIC_TYPES.REASONING },
              { id: 'd3', type: WORD_DIAGNOSTIC_TYPES.MISCONCEPTION_DETECTION },
            ],
            remediationAssets: [
              { id: 'r1', type: WORD_REMEDIATION_ASSET_TYPES.CONCEPT_EXPLANATION },
              { id: 'r2', type: WORD_REMEDIATION_ASSET_TYPES.WORKED_EXAMPLE },
              { id: 'r3', type: WORD_REMEDIATION_ASSET_TYPES.MODEL_METHOD_EXAMPLE },
              { id: 'r4', type: WORD_REMEDIATION_ASSET_TYPES.GUIDED_PRACTICE },
              { id: 'r5', type: WORD_REMEDIATION_ASSET_TYPES.INDEPENDENT_PRACTICE },
              { id: 'r6', type: WORD_REMEDIATION_ASSET_TYPES.FLUENCY_VARIANT },
              { id: 'r7', type: WORD_REMEDIATION_ASSET_TYPES.RETENTION_REVIEW },
            ],
            mathPathLinks: ['F001'],
          },
        ],
      },
    ],
  };

  it('validates a reusable WordPath structure map', () => {
    const result = validateWordPathMap(sampleMap);

    expect(result.ok).toBe(true);
    expect(result.summary).toMatchObject({
      structureCount: 1,
      microSkillCount: 1,
      misconceptionCount: 1,
      diagnosticAssetCount: 3,
      remediationAssetCount: 7,
    });
  });

  it('builds misconception, diagnostic, and remediation maps', () => {
    expect(buildWordMisconceptionMap(sampleMap)).toEqual([
      expect.objectContaining({
        structure: 'wordpath.sample',
        microSkill: 'wordpath.sample.micro',
        misconception: 'WP-SAMPLE-001',
      }),
    ]);
    expect(buildWordDiagnosticAssetMap(sampleMap)[0].diagnosticAssets).toHaveLength(3);
    expect(buildWordRemediationAssetMap(sampleMap)[0].remediationAssets).toHaveLength(7);
  });

  it('resolves micro-skills by id', () => {
    expect(getWordMicroSkillById(sampleMap, 'wordpath.sample.micro')).toMatchObject({
      structure: 'wordpath.sample',
      mathPathLinks: ['F001'],
    });
  });

  it('rejects missing model method metadata', () => {
    const result = validateWordPathMap({
      ...sampleMap,
      structures: [{ ...sampleMap.structures[0], modelMethod: {} }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('modelMethod.modelType');
  });
});
