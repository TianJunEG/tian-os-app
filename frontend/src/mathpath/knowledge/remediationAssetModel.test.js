import { describe, expect, it } from 'vitest';
import {
  REMEDIATION_ASSET_TYPES,
  buildRemediationAssetEntry,
  buildRemediationCoverageAudit,
  getRemediationAssetEntryByMicroSkillId,
  remediationPathRules,
  validateRemediationAssetMap,
} from './remediationAssetModel.js';

describe('remediationAssetModel', () => {
  const knowledgeMap = {
    domain: 'sample',
    stage: 'P4',
    topics: [
      {
        id: 'sample.topic',
        title: 'Sample Topic',
        microSkills: [
          {
            id: 'sample.micro',
            title: 'Sample micro skill',
            learningObjectives: ['Understand the idea.'],
            misconceptions: [{ id: 'M-SAMPLE-001', title: 'Sample misconception' }],
          },
        ],
      },
    ],
  };

  const misconceptionMap = {
    domain: 'sample',
    stage: 'P4',
    entries: [
      {
        topic: 'sample.topic',
        microSkill: 'sample.micro',
        misconceptions: [
          {
            id: 'M-SAMPLE-001',
            title: 'Sample misconception',
            interventions: ['GUIDED_EXAMPLE'],
          },
        ],
      },
    ],
  };

  const entry = buildRemediationAssetEntry({
    knowledgeMap,
    misconceptionMap,
    topic: 'sample.topic',
    microSkill: 'sample.micro',
  });

  const map = {
    domain: 'sample',
    stage: 'P4',
    remediationPathRules,
    entries: [entry],
  };

  it('validates concept-to-retention remediation coverage', () => {
    const result = validateRemediationAssetMap(map, knowledgeMap, misconceptionMap);

    expect(result.ok).toBe(true);
    expect(result.summary).toMatchObject({
      domain: 'sample',
      stage: 'P4',
      entryCount: 1,
      knowledgeMicroSkillCount: 1,
      pathRuleCount: remediationPathRules.length,
    });
  });

  it('creates misconception pathways through planned assets', () => {
    expect(entry.misconceptionPathways).toEqual([
      expect.objectContaining({
        misconceptionId: 'M-SAMPLE-001',
        recommendedAssetSequence: [
          'sample_micro_concept',
          'sample_micro_worked_example',
          'sample_micro_model_trainer',
          'sample_micro_guided_practice',
          'sample_micro_independent_practice',
        ],
      }),
    ]);
  });

  it('resolves entries and coverage audit rows', () => {
    expect(getRemediationAssetEntryByMicroSkillId(map, 'sample.micro')).toMatchObject({
      conceptAssets: [expect.objectContaining({ type: REMEDIATION_ASSET_TYPES.CONCEPT })],
      retentionAssets: [expect.objectContaining({ scheduleDays: [3, 7, 14, 30] })],
    });

    expect(buildRemediationCoverageAudit(map, knowledgeMap)).toEqual([
      expect.objectContaining({
        microSkill: 'sample.micro',
        coverageStatus: 'REMEDIATION_READY',
        riskLevel: 'LOW',
      }),
    ]);
  });

  it('rejects missing fluency coverage', () => {
    const result = validateRemediationAssetMap({
      ...map,
      entries: [{ ...entry, fluencyAssets: [] }],
    }, knowledgeMap, misconceptionMap);

    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('fluencyAssets');
  });
});
