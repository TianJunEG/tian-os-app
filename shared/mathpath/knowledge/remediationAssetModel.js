import { flattenMicroSkills, getMicroSkillById } from './knowledgeMapModel.js';
import { getRemediationEntryByMicroSkillId } from './remediationMapModel.js';

export const REMEDIATION_ASSET_MAP_VERSION = 'remediation-asset-map-v1';

export const REMEDIATION_ASSET_TYPES = Object.freeze({
  CONCEPT: 'CONCEPT',
  WORKED_EXAMPLE: 'WORKED_EXAMPLE',
  MODEL_TRAINER: 'MODEL_TRAINER',
  GUIDED_PRACTICE: 'GUIDED_PRACTICE',
  INDEPENDENT_PRACTICE: 'INDEPENDENT_PRACTICE',
  FLUENCY: 'FLUENCY',
  RETENTION: 'RETENTION',
});

export const REMEDIATION_PATH_TYPES = Object.freeze({
  FULL_REMEDIATION: 'FULL_REMEDIATION',
  CONCEPT_GUIDED: 'CONCEPT_GUIDED',
  FLUENCY_PATH: 'FLUENCY_PATH',
  RETENTION_PATH: 'RETENTION_PATH',
});

export const FUTURE_REMEDIATION_HOOKS = Object.freeze([
  'paperReviewMapping',
  'tutorInterventionMapping',
  'parentRecommendations',
  'teacherGrouping',
  'aiCoaching',
]);

export const remediationPathRules = Object.freeze([
  {
    id: 'wrong_high_confidence_misconception',
    signal: 'Wrong + high confidence + misconception detected',
    conditions: { answerCorrect: false, confidence: 'HIGH', misconceptionDetected: true },
    pathway: REMEDIATION_PATH_TYPES.FULL_REMEDIATION,
    recommendedSequence: [
      REMEDIATION_ASSET_TYPES.CONCEPT,
      REMEDIATION_ASSET_TYPES.WORKED_EXAMPLE,
      REMEDIATION_ASSET_TYPES.MODEL_TRAINER,
      REMEDIATION_ASSET_TYPES.GUIDED_PRACTICE,
      REMEDIATION_ASSET_TYPES.INDEPENDENT_PRACTICE,
    ],
    priority: 'HIGH',
  },
  {
    id: 'wrong_low_confidence',
    signal: 'Wrong + low confidence',
    conditions: { answerCorrect: false, confidence: 'LOW' },
    pathway: REMEDIATION_PATH_TYPES.CONCEPT_GUIDED,
    recommendedSequence: [
      REMEDIATION_ASSET_TYPES.CONCEPT,
      REMEDIATION_ASSET_TYPES.WORKED_EXAMPLE,
      REMEDIATION_ASSET_TYPES.GUIDED_PRACTICE,
    ],
    priority: 'MEDIUM',
  },
  {
    id: 'correct_slow',
    signal: 'Correct + slow',
    conditions: { answerCorrect: true, speed: 'SLOW' },
    pathway: REMEDIATION_PATH_TYPES.FLUENCY_PATH,
    recommendedSequence: [
      REMEDIATION_ASSET_TYPES.FLUENCY,
      REMEDIATION_ASSET_TYPES.RETENTION,
    ],
    priority: 'LOW',
  },
  {
    id: 'correct_fast',
    signal: 'Correct + fast',
    conditions: { answerCorrect: true, speed: 'FAST' },
    pathway: REMEDIATION_PATH_TYPES.RETENTION_PATH,
    recommendedSequence: [
      REMEDIATION_ASSET_TYPES.RETENTION,
    ],
    priority: 'LOW',
  },
]);

export function createEmptyRemediationHooks() {
  return FUTURE_REMEDIATION_HOOKS.reduce((hooks, key) => {
    hooks[key] = [];
    return hooks;
  }, {});
}

export function normalizeRemediationAssetMap(map = {}) {
  return {
    ...map,
    modelVersion: map.modelVersion || REMEDIATION_ASSET_MAP_VERSION,
    remediationPathRules: Array.isArray(map.remediationPathRules)
      ? map.remediationPathRules
      : remediationPathRules,
    entries: Array.isArray(map.entries)
      ? map.entries.map((entry) => ({
        conceptAssets: [],
        workedExamples: [],
        modelTrainerAssets: [],
        guidedPracticeAssets: [],
        independentPracticeAssets: [],
        fluencyAssets: [],
        retentionAssets: [],
        misconceptionPathways: [],
        ...createEmptyRemediationHooks(),
        ...entry,
        conceptAssets: Array.isArray(entry.conceptAssets) ? entry.conceptAssets : [],
        workedExamples: Array.isArray(entry.workedExamples) ? entry.workedExamples : [],
        modelTrainerAssets: Array.isArray(entry.modelTrainerAssets) ? entry.modelTrainerAssets : [],
        guidedPracticeAssets: Array.isArray(entry.guidedPracticeAssets) ? entry.guidedPracticeAssets : [],
        independentPracticeAssets: Array.isArray(entry.independentPracticeAssets) ? entry.independentPracticeAssets : [],
        fluencyAssets: Array.isArray(entry.fluencyAssets) ? entry.fluencyAssets : [],
        retentionAssets: Array.isArray(entry.retentionAssets) ? entry.retentionAssets : [],
        misconceptionPathways: Array.isArray(entry.misconceptionPathways) ? entry.misconceptionPathways : [],
      }))
      : [],
  };
}

export function getRemediationAssetEntryByMicroSkillId(map = {}, microSkillId = '') {
  return normalizeRemediationAssetMap(map).entries.find((entry) => entry.microSkill === microSkillId) || null;
}

export function buildRemediationAssetEntry({
  knowledgeMap,
  misconceptionMap,
  topic,
  microSkill,
  assetSeed = {},
}) {
  const sourceMicroSkill = getMicroSkillById(knowledgeMap, microSkill);
  const misconceptionEntry = getRemediationEntryByMicroSkillId(misconceptionMap, microSkill);
  const baseId = microSkill.replace(/\./g, '_');
  const defaultTitle = sourceMicroSkill?.title || microSkill;

  const asset = (suffix, type, title, purpose) => ({
    id: `${baseId}_${suffix}`,
    type,
    title,
    purpose,
    status: 'PLANNED',
  });

  const conceptAssets = assetSeed.conceptAssets || [
    asset('concept', REMEDIATION_ASSET_TYPES.CONCEPT, `${defaultTitle} concept explanation`, 'Explain the core idea in simple language.'),
  ];
  const workedExamples = assetSeed.workedExamples || [
    asset('worked_example', REMEDIATION_ASSET_TYPES.WORKED_EXAMPLE, `${defaultTitle} worked example`, 'Show a complete step-by-step method.'),
  ];
  const modelTrainerAssets = assetSeed.modelTrainerAssets || [
    asset('model_trainer', REMEDIATION_ASSET_TYPES.MODEL_TRAINER, `${defaultTitle} visual model trainer`, 'Build understanding through visual or concrete representation.'),
  ];
  const guidedPracticeAssets = assetSeed.guidedPracticeAssets || [
    asset('guided_practice', REMEDIATION_ASSET_TYPES.GUIDED_PRACTICE, `${defaultTitle} guided practice`, 'Provide hints, scaffolds, and error-specific feedback.'),
  ];
  const independentPracticeAssets = assetSeed.independentPracticeAssets || [
    asset('independent_practice', REMEDIATION_ASSET_TYPES.INDEPENDENT_PRACTICE, `${defaultTitle} independent practice`, 'Confirm understanding without hints.'),
  ];
  const fluencyAssets = assetSeed.fluencyAssets || [
    asset('fluency', REMEDIATION_ASSET_TYPES.FLUENCY, `${defaultTitle} fluency practice`, 'Build speed and automaticity after understanding is secure.'),
  ];
  const retentionAssets = assetSeed.retentionAssets || [
    {
      ...asset('retention', REMEDIATION_ASSET_TYPES.RETENTION, `${defaultTitle} retention review`, 'Schedule spaced review after mastery.'),
      scheduleDays: [3, 7, 14, 30],
    },
  ];

  const misconceptionPathways = (misconceptionEntry?.misconceptions || []).map((misconception) => ({
    misconceptionId: misconception.id,
    recommendedAssetSequence: [
      conceptAssets[0].id,
      workedExamples[0].id,
      modelTrainerAssets[0].id,
      guidedPracticeAssets[0].id,
      independentPracticeAssets[0].id,
    ],
    interventionTypes: misconception.interventions || [],
  }));

  return {
    domain: knowledgeMap.domain,
    topic,
    microSkill,
    microSkillTitle: defaultTitle,
    conceptAssets,
    workedExamples,
    modelTrainerAssets,
    guidedPracticeAssets,
    independentPracticeAssets,
    fluencyAssets,
    retentionAssets,
    misconceptionPathways,
    ...createEmptyRemediationHooks(),
  };
}

export function validateRemediationAssetMap(map = {}, knowledgeMap = null, misconceptionMap = null) {
  const normalized = normalizeRemediationAssetMap(map);
  const errors = [];
  const entryMicroSkillIds = new Set();
  const knownMicroSkillIds = knowledgeMap
    ? new Set(flattenMicroSkills(knowledgeMap).map((microSkill) => microSkill.id))
    : null;

  if (!normalized.domain) errors.push('Remediation asset map must define a domain.');
  if (!normalized.stage) errors.push('Remediation asset map must define a stage.');
  if (!normalized.entries.length) errors.push('Remediation asset map must contain entries.');
  if (!normalized.remediationPathRules.length) errors.push('Remediation asset map must define path rules.');

  normalized.entries.forEach((entry) => {
    if (!entry.topic) errors.push(`Entry ${entry.microSkill || '(missing micro-skill)'} must define a topic.`);
    if (!entry.microSkill) errors.push('Entry is missing a microSkill id.');
    if (entry.microSkill && entryMicroSkillIds.has(entry.microSkill)) {
      errors.push(`Duplicate remediation asset entry for ${entry.microSkill}.`);
    }
    if (entry.microSkill) entryMicroSkillIds.add(entry.microSkill);
    if (knownMicroSkillIds && entry.microSkill && !knownMicroSkillIds.has(entry.microSkill)) {
      errors.push(`Remediation asset entry references unknown micro-skill ${entry.microSkill}.`);
    }

    [
      'conceptAssets',
      'workedExamples',
      'modelTrainerAssets',
      'guidedPracticeAssets',
      'independentPracticeAssets',
      'fluencyAssets',
      'retentionAssets',
    ].forEach((assetKey) => {
      if (!entry[assetKey].length) errors.push(`Entry ${entry.microSkill} must define ${assetKey}.`);
    });

    FUTURE_REMEDIATION_HOOKS.forEach((hook) => {
      if (!Array.isArray(entry[hook])) errors.push(`Entry ${entry.microSkill} must define ${hook} as an array.`);
    });

    entry.retentionAssets.forEach((asset) => {
      const schedule = asset.scheduleDays || [];
      [3, 7, 14, 30].forEach((day) => {
        if (!schedule.includes(day)) {
          errors.push(`Retention asset ${asset.id} must include day ${day}.`);
        }
      });
    });
  });

  if (knowledgeMap) {
    flattenMicroSkills(knowledgeMap).forEach((microSkill) => {
      if (!entryMicroSkillIds.has(microSkill.id)) {
        errors.push(`Missing remediation asset entry for micro-skill ${microSkill.id}.`);
      }
    });
  }

  if (misconceptionMap) {
    normalized.entries.forEach((entry) => {
      const misconceptionEntry = getRemediationEntryByMicroSkillId(misconceptionMap, entry.microSkill);
      const misconceptionIds = new Set((misconceptionEntry?.misconceptions || []).map((item) => item.id));
      const pathwayIds = new Set(entry.misconceptionPathways.map((pathway) => pathway.misconceptionId));
      misconceptionIds.forEach((misconceptionId) => {
        if (!pathwayIds.has(misconceptionId)) {
          errors.push(`Entry ${entry.microSkill} is missing pathway for ${misconceptionId}.`);
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
      entryCount: entryMicroSkillIds.size,
      knowledgeMicroSkillCount: knowledgeMap ? flattenMicroSkills(knowledgeMap).length : null,
      pathRuleCount: normalized.remediationPathRules.length,
    },
  };
}

export function buildRemediationCoverageAudit(map = {}, knowledgeMap = null) {
  const normalized = normalizeRemediationAssetMap(map);
  const microSkills = knowledgeMap ? flattenMicroSkills(knowledgeMap) : [];
  return microSkills.map((microSkill) => {
    const entry = getRemediationAssetEntryByMicroSkillId(normalized, microSkill.id);
    const missingAssets = [
      !entry ? 'remediation asset entry' : '',
      entry && !entry.conceptAssets.length ? 'concept assets' : '',
      entry && !entry.workedExamples.length ? 'worked examples' : '',
      entry && !entry.modelTrainerAssets.length ? 'model trainers' : '',
      entry && !entry.guidedPracticeAssets.length ? 'guided practice' : '',
      entry && !entry.independentPracticeAssets.length ? 'independent practice' : '',
      entry && !entry.fluencyAssets.length ? 'fluency' : '',
      entry && !entry.retentionAssets.length ? 'retention' : '',
    ].filter(Boolean);

    return {
      microSkill: microSkill.id,
      title: microSkill.title,
      conceptAssets: entry?.conceptAssets?.length || 0,
      workedExamples: entry?.workedExamples?.length || 0,
      modelTrainers: entry?.modelTrainerAssets?.length || 0,
      guidedPractice: entry?.guidedPracticeAssets?.length || 0,
      independentPractice: entry?.independentPracticeAssets?.length || 0,
      fluency: entry?.fluencyAssets?.length || 0,
      retention: entry?.retentionAssets?.length || 0,
      coverageStatus: missingAssets.length ? 'NOT_READY' : 'REMEDIATION_READY',
      missingAssets,
      riskLevel: missingAssets.length ? 'HIGH' : 'LOW',
    };
  });
}
