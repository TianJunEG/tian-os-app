import { describe, expect, it } from 'vitest';
import {
  INTERVENTION_TYPES,
  getMisconceptionById,
  getRemediationEntryByMicroSkillId,
  validateRemediationMap,
} from './remediationMapModel.js';

describe('remediationMapModel', () => {
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

  const remediationMap = {
    domain: 'sample',
    stage: 'P4',
    entries: [
      {
        domain: 'sample',
        topic: 'sample.topic',
        microSkill: 'sample.micro',
        misconceptions: [
          {
            id: 'M-SAMPLE-001',
            title: 'Sample misconception',
            observableBehaviours: ['Writes a matching wrong answer.'],
            likelyCauses: ['Uses the wrong idea.'],
            interventions: [INTERVENTION_TYPES.GUIDED_EXAMPLE],
          },
        ],
        observableBehaviours: ['Writes a matching wrong answer.'],
        likelyCauses: ['Uses the wrong idea.'],
        interventions: [INTERVENTION_TYPES.GUIDED_EXAMPLE],
      },
    ],
  };

  it('validates misconception coverage against a knowledge map', () => {
    const result = validateRemediationMap(remediationMap, knowledgeMap);

    expect(result.ok).toBe(true);
    expect(result.summary).toMatchObject({
      domain: 'sample',
      stage: 'P4',
      entryCount: 1,
      misconceptionCount: 1,
      knowledgeMicroSkillCount: 1,
    });
  });

  it('resolves entries and misconceptions', () => {
    expect(getRemediationEntryByMicroSkillId(remediationMap, 'sample.micro')).toMatchObject({
      topic: 'sample.topic',
      interventions: [INTERVENTION_TYPES.GUIDED_EXAMPLE],
    });
    expect(getMisconceptionById(remediationMap, 'M-SAMPLE-001')).toMatchObject({
      microSkill: 'sample.micro',
      observableBehaviours: ['Writes a matching wrong answer.'],
    });
  });

  it('rejects misconceptions without observable evidence', () => {
    const result = validateRemediationMap({
      ...remediationMap,
      entries: [
        {
          ...remediationMap.entries[0],
          misconceptions: [{ id: 'M-SAMPLE-001', title: 'Sample misconception' }],
        },
      ],
    }, knowledgeMap);

    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('observable evidence');
  });
});
