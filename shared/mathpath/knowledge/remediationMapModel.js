import { flattenMicroSkills, getMicroSkillById } from './knowledgeMapModel.js';

export const REMEDIATION_MAP_VERSION = 'remediation-map-v1';

export const INTERVENTION_TYPES = Object.freeze({
  CONCEPT_REVIEW: 'CONCEPT_REVIEW',
  GUIDED_EXAMPLE: 'GUIDED_EXAMPLE',
  MODEL_TRAINER: 'MODEL_TRAINER',
  TARGETED_PRACTICE: 'TARGETED_PRACTICE',
  FLUENCY: 'FLUENCY',
});

export function normalizeRemediationMap(map = {}) {
  return {
    ...map,
    modelVersion: map.modelVersion || REMEDIATION_MAP_VERSION,
    entries: Array.isArray(map.entries)
      ? map.entries.map((entry) => ({
        misconceptions: [],
        observableBehaviours: [],
        likelyCauses: [],
        interventions: [],
        ...entry,
        misconceptions: Array.isArray(entry.misconceptions) ? entry.misconceptions : [],
        observableBehaviours: Array.isArray(entry.observableBehaviours) ? entry.observableBehaviours : [],
        likelyCauses: Array.isArray(entry.likelyCauses) ? entry.likelyCauses : [],
        interventions: Array.isArray(entry.interventions) ? entry.interventions : [],
      }))
      : [],
  };
}

export function getRemediationEntryByMicroSkillId(map = {}, microSkillId = '') {
  return normalizeRemediationMap(map).entries.find((entry) => entry.microSkill === microSkillId) || null;
}

export function getMisconceptionById(map = {}, misconceptionId = '') {
  return normalizeRemediationMap(map).entries
    .flatMap((entry) => entry.misconceptions.map((misconception) => ({
      ...misconception,
      microSkill: entry.microSkill,
      topic: entry.topic,
      domain: entry.domain,
    })))
    .find((misconception) => misconception.id === misconceptionId) || null;
}

export function validateRemediationMap(map = {}, knowledgeMap = null) {
  const normalized = normalizeRemediationMap(map);
  const errors = [];
  const microSkillIds = new Set();
  const misconceptionIds = new Set();
  const knownMicroSkillIds = knowledgeMap
    ? new Set(flattenMicroSkills(knowledgeMap).map((microSkill) => microSkill.id))
    : null;

  if (!normalized.domain) errors.push('Remediation map must define a domain.');
  if (!normalized.stage) errors.push('Remediation map must define a stage.');
  if (!normalized.entries.length) errors.push('Remediation map must contain entries.');

  normalized.entries.forEach((entry) => {
    if (!entry.topic) errors.push(`Entry ${entry.microSkill || '(missing micro-skill)'} must define a topic.`);
    if (!entry.microSkill) errors.push('Entry is missing a microSkill id.');
    if (entry.microSkill && microSkillIds.has(entry.microSkill)) {
      errors.push(`Duplicate remediation entry for ${entry.microSkill}.`);
    }
    if (entry.microSkill) microSkillIds.add(entry.microSkill);
    if (knownMicroSkillIds && entry.microSkill && !knownMicroSkillIds.has(entry.microSkill)) {
      errors.push(`Remediation entry references unknown micro-skill ${entry.microSkill}.`);
    }

    if (!entry.misconceptions.length) errors.push(`Entry ${entry.microSkill} must define misconceptions.`);
    if (!entry.observableBehaviours.length) errors.push(`Entry ${entry.microSkill} must define observableBehaviours.`);
    if (!entry.likelyCauses.length) errors.push(`Entry ${entry.microSkill} must define likelyCauses.`);
    if (!entry.interventions.length) errors.push(`Entry ${entry.microSkill} must define interventions.`);

    entry.misconceptions.forEach((misconception) => {
      if (!misconception.id) errors.push(`Entry ${entry.microSkill} has a misconception without an id.`);
      if (misconception.id && misconceptionIds.has(misconception.id)) {
        errors.push(`Duplicate misconception id ${misconception.id}.`);
      }
      if (misconception.id) misconceptionIds.add(misconception.id);
      if (!misconception.title) errors.push(`Misconception ${misconception.id} must define a title.`);
      if (!Array.isArray(misconception.observableBehaviours) || misconception.observableBehaviours.length === 0) {
        errors.push(`Misconception ${misconception.id} must define observable evidence.`);
      }
      if (!Array.isArray(misconception.likelyCauses) || misconception.likelyCauses.length === 0) {
        errors.push(`Misconception ${misconception.id} must define likely causes.`);
      }
      if (!Array.isArray(misconception.interventions) || misconception.interventions.length === 0) {
        errors.push(`Misconception ${misconception.id} must define interventions.`);
      }
    });
  });

  if (knowledgeMap) {
    flattenMicroSkills(knowledgeMap).forEach((microSkill) => {
      if (!microSkillIds.has(microSkill.id)) {
        errors.push(`Missing remediation entry for micro-skill ${microSkill.id}.`);
      }
      const entry = getRemediationEntryByMicroSkillId(normalized, microSkill.id);
      const entryMisconceptionIds = new Set((entry?.misconceptions || []).map((misconception) => misconception.id));
      (microSkill.misconceptions || []).forEach((misconception) => {
        if (!entryMisconceptionIds.has(misconception.id)) {
          errors.push(`Micro-skill ${microSkill.id} is missing mapped misconception ${misconception.id}.`);
        }
      });
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      domain: normalized.domain,
      stage: normalized.stage,
      entryCount: normalized.entries.length,
      misconceptionCount: misconceptionIds.size,
      knowledgeMicroSkillCount: knowledgeMap ? flattenMicroSkills(knowledgeMap).length : null,
    },
  };
}

export function buildRemediationEntryFromKnowledge({ knowledgeMap, topic, microSkill, misconceptions = [] }) {
  const sourceMicroSkill = getMicroSkillById(knowledgeMap, microSkill);
  return {
    domain: knowledgeMap.domain,
    topic,
    microSkill,
    microSkillTitle: sourceMicroSkill?.title || '',
    misconceptions,
    observableBehaviours: [...new Set(misconceptions.flatMap((item) => item.observableBehaviours || []))],
    likelyCauses: [...new Set(misconceptions.flatMap((item) => item.likelyCauses || []))],
    interventions: [...new Set(misconceptions.flatMap((item) => item.interventions || []))],
  };
}
