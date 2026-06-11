export const KNOWLEDGE_MAP_VERSION = 'knowledge-map-v1';

export const KNOWLEDGE_ASSET_HOOKS = Object.freeze([
  'diagnosticAssets',
  'practiceAssets',
  'fluencyAssets',
  'wordPathAssets',
  'modelTrainerAssets',
  'remediationAssets',
]);

export function createEmptyAssetHooks() {
  return KNOWLEDGE_ASSET_HOOKS.reduce((hooks, key) => {
    hooks[key] = [];
    return hooks;
  }, {});
}

export function normalizeKnowledgeMap(map = {}) {
  const topics = Array.isArray(map.topics) ? map.topics : [];
  return {
    ...map,
    modelVersion: map.modelVersion || KNOWLEDGE_MAP_VERSION,
    topics: topics.map((topic, topicIndex) => ({
      ...topic,
      order: topic.order ?? topicIndex + 1,
      microSkills: Array.isArray(topic.microSkills)
        ? topic.microSkills.map((microSkill, skillIndex) => ({
          ...createEmptyAssetHooks(),
          ...microSkill,
          order: microSkill.order ?? skillIndex + 1,
          misconceptions: Array.isArray(microSkill.misconceptions)
            ? microSkill.misconceptions
            : [],
        }))
        : [],
    })),
  };
}

export function flattenMicroSkills(map = {}) {
  return normalizeKnowledgeMap(map).topics.flatMap((topic) =>
    topic.microSkills.map((microSkill) => ({
      ...microSkill,
      topicId: topic.id,
      topicTitle: topic.title,
      domain: map.domain,
    }))
  );
}

export function getTopicById(map = {}, topicId = '') {
  return normalizeKnowledgeMap(map).topics.find((topic) => topic.id === topicId) || null;
}

export function getMicroSkillById(map = {}, microSkillId = '') {
  return flattenMicroSkills(map).find((microSkill) => microSkill.id === microSkillId) || null;
}

export function getLegacySkillMappings(map = {}) {
  return flattenMicroSkills(map).reduce((mappings, microSkill) => {
    (microSkill.legacySkillIds || []).forEach((legacySkillId) => {
      if (!mappings[legacySkillId]) mappings[legacySkillId] = [];
      mappings[legacySkillId].push(microSkill.id);
    });
    return mappings;
  }, {});
}

export function validateKnowledgeMap(map = {}) {
  const normalized = normalizeKnowledgeMap(map);
  const errors = [];
  const topicIds = new Set();
  const microSkillIds = new Set();

  if (!normalized.domain) errors.push('Knowledge map must define a domain.');
  if (!normalized.stage) errors.push('Knowledge map must define a stage.');
  if (!normalized.topics.length) errors.push('Knowledge map must contain at least one topic.');

  normalized.topics.forEach((topic) => {
    if (!topic.id) errors.push('Topic is missing an id.');
    if (topicIds.has(topic.id)) errors.push(`Duplicate topic id: ${topic.id}.`);
    topicIds.add(topic.id);
    if (!topic.title) errors.push(`Topic ${topic.id || '(missing id)'} is missing a title.`);

    topic.microSkills.forEach((microSkill) => {
      if (!microSkill.id) errors.push(`Topic ${topic.id} has a micro-skill without an id.`);
      if (microSkillIds.has(microSkill.id)) errors.push(`Duplicate micro-skill id: ${microSkill.id}.`);
      microSkillIds.add(microSkill.id);
      if (!microSkill.title) errors.push(`Micro-skill ${microSkill.id || '(missing id)'} is missing a title.`);
      if (!Array.isArray(microSkill.learningObjectives) || microSkill.learningObjectives.length === 0) {
        errors.push(`Micro-skill ${microSkill.id} must define learning objectives.`);
      }
      KNOWLEDGE_ASSET_HOOKS.forEach((hook) => {
        if (!Array.isArray(microSkill[hook])) {
          errors.push(`Micro-skill ${microSkill.id} must define ${hook} as an array.`);
        }
      });
    });
  });

  flattenMicroSkills(normalized).forEach((microSkill) => {
    (microSkill.prerequisites || []).forEach((prerequisiteId) => {
      if (!microSkillIds.has(prerequisiteId)) {
        errors.push(`Micro-skill ${microSkill.id} has unknown prerequisite ${prerequisiteId}.`);
      }
    });
  });

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      domain: normalized.domain,
      stage: normalized.stage,
      topicCount: normalized.topics.length,
      microSkillCount: microSkillIds.size,
      legacySkillMappings: Object.keys(getLegacySkillMappings(normalized)).length,
    },
  };
}
