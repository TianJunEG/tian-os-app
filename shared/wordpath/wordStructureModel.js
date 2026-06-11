export const WORDPATH_MODEL_VERSION = 'wordpath-knowledge-map-v1';

export const WORD_DIAGNOSTIC_TYPES = Object.freeze({
  RECOGNITION: 'RECOGNITION',
  REASONING: 'REASONING',
  MISCONCEPTION_DETECTION: 'MISCONCEPTION_DETECTION',
});

export const WORD_REMEDIATION_ASSET_TYPES = Object.freeze({
  CONCEPT_EXPLANATION: 'CONCEPT_EXPLANATION',
  WORKED_EXAMPLE: 'WORKED_EXAMPLE',
  MODEL_METHOD_EXAMPLE: 'MODEL_METHOD_EXAMPLE',
  GUIDED_PRACTICE: 'GUIDED_PRACTICE',
  INDEPENDENT_PRACTICE: 'INDEPENDENT_PRACTICE',
  FLUENCY_VARIANT: 'FLUENCY_VARIANT',
  RETENTION_REVIEW: 'RETENTION_REVIEW',
});

export const MODEL_METHOD_TYPES = Object.freeze({
  PART_WHOLE: 'PART_WHOLE',
  COMPARISON: 'COMPARISON',
  BEFORE_AFTER: 'BEFORE_AFTER',
  TRANSFER: 'TRANSFER',
  REPEATED_QUANTITY: 'REPEATED_QUANTITY',
  UNIT_VALUE: 'UNIT_VALUE',
  FRACTION_BAR: 'FRACTION_BAR',
  RATIO_BAR: 'RATIO_BAR',
  RATE_TABLE: 'RATE_TABLE',
  PERCENT_BAR: 'PERCENT_BAR',
});

export function normalizeWordPathMap(map = {}) {
  return {
    ...map,
    modelVersion: map.modelVersion || WORDPATH_MODEL_VERSION,
    structures: Array.isArray(map.structures)
      ? map.structures.map((structure, structureIndex) => ({
        ...structure,
        order: structure.order ?? structureIndex + 1,
        microSkills: Array.isArray(structure.microSkills)
          ? structure.microSkills.map((microSkill, skillIndex) => ({
            misconceptions: [],
            diagnosticAssets: [],
            remediationAssets: [],
            mathPathLinks: [],
            ...microSkill,
            order: microSkill.order ?? skillIndex + 1,
            misconceptions: Array.isArray(microSkill.misconceptions) ? microSkill.misconceptions : [],
            diagnosticAssets: Array.isArray(microSkill.diagnosticAssets) ? microSkill.diagnosticAssets : [],
            remediationAssets: Array.isArray(microSkill.remediationAssets) ? microSkill.remediationAssets : [],
            mathPathLinks: Array.isArray(microSkill.mathPathLinks) ? microSkill.mathPathLinks : [],
          }))
          : [],
      }))
      : [],
  };
}

export function flattenWordMicroSkills(map = {}) {
  return normalizeWordPathMap(map).structures.flatMap((structure) =>
    structure.microSkills.map((microSkill) => ({
      ...microSkill,
      structure: structure.id,
      structureTitle: structure.title,
      domain: map.domain,
    }))
  );
}

export function getWordStructureById(map = {}, structureId = '') {
  return normalizeWordPathMap(map).structures.find((structure) => structure.id === structureId) || null;
}

export function getWordMicroSkillById(map = {}, microSkillId = '') {
  return flattenWordMicroSkills(map).find((microSkill) => microSkill.id === microSkillId) || null;
}

export function buildWordMisconceptionMap(map = {}) {
  return flattenWordMicroSkills(map).flatMap((microSkill) =>
    microSkill.misconceptions.map((misconception) => ({
      structure: microSkill.structure,
      microSkill: microSkill.id,
      misconception: misconception.id,
      title: misconception.title,
      observableBehaviour: misconception.observableBehaviour,
      likelyCause: misconception.likelyCause,
    }))
  );
}

export function buildWordDiagnosticAssetMap(map = {}) {
  return flattenWordMicroSkills(map).map((microSkill) => ({
    structure: microSkill.structure,
    microSkill: microSkill.id,
    diagnosticAssets: microSkill.diagnosticAssets,
  }));
}

export function buildWordRemediationAssetMap(map = {}) {
  return flattenWordMicroSkills(map).map((microSkill) => ({
    structure: microSkill.structure,
    microSkill: microSkill.id,
    remediationAssets: microSkill.remediationAssets,
  }));
}

export function validateWordPathMap(map = {}) {
  const normalized = normalizeWordPathMap(map);
  const errors = [];
  const structureIds = new Set();
  const microSkillIds = new Set();

  if (normalized.domain !== 'wordpath') errors.push('WordPath map must use domain "wordpath".');
  if (!normalized.structures.length) errors.push('WordPath map must define problem structures.');

  normalized.structures.forEach((structure) => {
    if (!structure.id) errors.push('Problem structure is missing an id.');
    if (structureIds.has(structure.id)) errors.push(`Duplicate structure id: ${structure.id}.`);
    if (structure.id) structureIds.add(structure.id);
    if (!structure.title) errors.push(`Structure ${structure.id || '(missing id)'} is missing a title.`);
    if (!structure.modelMethod?.modelType) errors.push(`Structure ${structure.id} must define modelMethod.modelType.`);
    if (!structure.modelMethod?.visualRepresentation) errors.push(`Structure ${structure.id} must define modelMethod.visualRepresentation.`);
    if (!structure.microSkills.length) errors.push(`Structure ${structure.id} must define micro-skills.`);

    structure.microSkills.forEach((microSkill) => {
      if (!microSkill.id) errors.push(`Structure ${structure.id} has a micro-skill without an id.`);
      if (microSkillIds.has(microSkill.id)) errors.push(`Duplicate micro-skill id: ${microSkill.id}.`);
      if (microSkill.id) microSkillIds.add(microSkill.id);
      if (!microSkill.title) errors.push(`Micro-skill ${microSkill.id || '(missing id)'} is missing a title.`);
      if (!microSkill.misconceptions.length) errors.push(`Micro-skill ${microSkill.id} must define misconceptions.`);
      if (!microSkill.mathPathLinks.length) errors.push(`Micro-skill ${microSkill.id} must define MathPath links.`);

      const diagnosticTypes = new Set(microSkill.diagnosticAssets.map((asset) => asset.type));
      [
        WORD_DIAGNOSTIC_TYPES.RECOGNITION,
        WORD_DIAGNOSTIC_TYPES.REASONING,
        WORD_DIAGNOSTIC_TYPES.MISCONCEPTION_DETECTION,
      ].forEach((type) => {
        if (!diagnosticTypes.has(type)) {
          errors.push(`Micro-skill ${microSkill.id} is missing ${type} diagnostic asset.`);
        }
      });

      const remediationTypes = new Set(microSkill.remediationAssets.map((asset) => asset.type));
      [
        WORD_REMEDIATION_ASSET_TYPES.CONCEPT_EXPLANATION,
        WORD_REMEDIATION_ASSET_TYPES.WORKED_EXAMPLE,
        WORD_REMEDIATION_ASSET_TYPES.MODEL_METHOD_EXAMPLE,
        WORD_REMEDIATION_ASSET_TYPES.GUIDED_PRACTICE,
        WORD_REMEDIATION_ASSET_TYPES.INDEPENDENT_PRACTICE,
        WORD_REMEDIATION_ASSET_TYPES.FLUENCY_VARIANT,
        WORD_REMEDIATION_ASSET_TYPES.RETENTION_REVIEW,
      ].forEach((type) => {
        if (!remediationTypes.has(type)) {
          errors.push(`Micro-skill ${microSkill.id} is missing ${type} remediation asset.`);
        }
      });

      microSkill.misconceptions.forEach((misconception) => {
        if (!misconception.id) errors.push(`Micro-skill ${microSkill.id} has a misconception without an id.`);
        if (!misconception.observableBehaviour) errors.push(`Misconception ${misconception.id} must define observableBehaviour.`);
        if (!misconception.likelyCause) errors.push(`Misconception ${misconception.id} must define likelyCause.`);
      });
    });
  });

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      structureCount: structureIds.size,
      microSkillCount: microSkillIds.size,
      misconceptionCount: buildWordMisconceptionMap(normalized).length,
      diagnosticAssetCount: flattenWordMicroSkills(normalized).reduce((sum, item) => sum + item.diagnosticAssets.length, 0),
      remediationAssetCount: flattenWordMicroSkills(normalized).reduce((sum, item) => sum + item.remediationAssets.length, 0),
    },
  };
}
