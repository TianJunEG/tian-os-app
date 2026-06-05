import { describe, expect, it } from 'vitest';
import { flattenMicroSkills } from '../knowledge/knowledgeMapModel.js';
import {
  REMEDIATION_PATH_TYPES,
  buildRemediationCoverageAudit,
  getRemediationAssetEntryByMicroSkillId,
  validateRemediationAssetMap,
} from '../knowledge/remediationAssetModel.js';
import { fractionsKnowledgeMapV1 } from './fractionsKnowledgeMapV1.js';
import { fractionsRemediationAssetMapV1 } from './fractionsRemediationAssetMapV1.js';
import { fractionsRemediationMapV1 } from './fractionsRemediationMapV1.js';

describe('fractionsRemediationAssetMapV1', () => {
  it('covers every P4 fractions micro-skill with a full remediation asset stack', () => {
    const microSkillCount = flattenMicroSkills(fractionsKnowledgeMapV1).length;
    const result = validateRemediationAssetMap(
      fractionsRemediationAssetMapV1,
      fractionsKnowledgeMapV1,
      fractionsRemediationMapV1
    );

    expect(result.ok).toBe(true);
    expect(result.summary).toMatchObject({
      domain: 'fractions',
      stage: 'P4',
      entryCount: microSkillCount,
      knowledgeMicroSkillCount: microSkillCount,
    });
  });

  it('marks all remediation coverage audit rows as ready', () => {
    const auditRows = buildRemediationCoverageAudit(fractionsRemediationAssetMapV1, fractionsKnowledgeMapV1);

    expect(auditRows).toHaveLength(flattenMicroSkills(fractionsKnowledgeMapV1).length);
    auditRows.forEach((row) => {
      expect(row).toMatchObject({
        conceptAssets: 1,
        workedExamples: 1,
        modelTrainers: 1,
        guidedPractice: 1,
        independentPractice: 1,
        fluency: 1,
        retention: 1,
        coverageStatus: 'REMEDIATION_READY',
        missingAssets: [],
        riskLevel: 'LOW',
      });
    });
  });

  it('maps improper-to-mixed misconceptions through concept-to-practice assets', () => {
    const entry = getRemediationAssetEntryByMicroSkillId(
      fractionsRemediationAssetMapV1,
      'fractions.p4.convert_improper_to_mixed'
    );

    expect(entry.misconceptionPathways.map((pathway) => pathway.misconceptionId)).toEqual([
      'M-MIX-006',
      'M-MIX-007',
    ]);
    expect(entry.misconceptionPathways[0].recommendedAssetSequence).toEqual([
      'fractions_p4_convert_improper_to_mixed_concept',
      'fractions_p4_convert_improper_to_mixed_worked_example',
      'fractions_p4_convert_improper_to_mixed_model_trainer',
      'fractions_p4_convert_improper_to_mixed_guided_practice',
      'fractions_p4_convert_improper_to_mixed_independent_practice',
    ]);
    expect(entry.retentionAssets[0].scheduleDays).toEqual([3, 7, 14, 30]);
  });

  it('defines reusable remediation path rules', () => {
    expect(fractionsRemediationAssetMapV1.remediationPathRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'wrong_high_confidence_misconception',
          pathway: REMEDIATION_PATH_TYPES.FULL_REMEDIATION,
          priority: 'HIGH',
        }),
        expect.objectContaining({
          id: 'correct_slow',
          pathway: REMEDIATION_PATH_TYPES.FLUENCY_PATH,
        }),
        expect.objectContaining({
          id: 'correct_fast',
          pathway: REMEDIATION_PATH_TYPES.RETENTION_PATH,
        }),
      ])
    );
  });
});
