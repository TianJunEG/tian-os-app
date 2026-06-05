import { describe, expect, it } from 'vitest';
import {
  createEmptyAssetHooks,
  flattenMicroSkills,
  getLegacySkillMappings,
  getMicroSkillById,
  validateKnowledgeMap,
} from './knowledgeMapModel.js';

describe('knowledgeMapModel', () => {
  const sampleMap = {
    domain: 'sample',
    stage: 'P4',
    topics: [
      {
        id: 'sample.topic',
        title: 'Sample Topic',
        microSkills: [
          {
            ...createEmptyAssetHooks(),
            id: 'sample.micro.one',
            title: 'First micro skill',
            legacySkillIds: ['S001'],
            learningObjectives: ['Do one thing.'],
          },
          {
            ...createEmptyAssetHooks(),
            id: 'sample.micro.two',
            title: 'Second micro skill',
            legacySkillIds: ['S001', 'S002'],
            prerequisites: ['sample.micro.one'],
            learningObjectives: ['Do the next thing.'],
          },
        ],
      },
    ],
  };

  it('validates a reusable domain-topic-micro-skill map', () => {
    const result = validateKnowledgeMap(sampleMap);

    expect(result.ok).toBe(true);
    expect(result.summary).toMatchObject({
      domain: 'sample',
      stage: 'P4',
      topicCount: 1,
      microSkillCount: 2,
      legacySkillMappings: 2,
    });
  });

  it('flattens micro-skills and preserves topic context', () => {
    expect(flattenMicroSkills(sampleMap)).toEqual([
      expect.objectContaining({ id: 'sample.micro.one', topicId: 'sample.topic', domain: 'sample' }),
      expect.objectContaining({ id: 'sample.micro.two', topicTitle: 'Sample Topic', domain: 'sample' }),
    ]);
  });

  it('resolves micro-skills and legacy skill mappings', () => {
    expect(getMicroSkillById(sampleMap, 'sample.micro.two')).toMatchObject({
      title: 'Second micro skill',
      prerequisites: ['sample.micro.one'],
    });
    expect(getLegacySkillMappings(sampleMap)).toEqual({
      S001: ['sample.micro.one', 'sample.micro.two'],
      S002: ['sample.micro.two'],
    });
  });

  it('rejects unknown prerequisites', () => {
    const result = validateKnowledgeMap({
      ...sampleMap,
      topics: [
        {
          ...sampleMap.topics[0],
          microSkills: [
            {
              ...sampleMap.topics[0].microSkills[0],
              prerequisites: ['missing.micro.skill'],
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('unknown prerequisite missing.micro.skill');
  });
});
