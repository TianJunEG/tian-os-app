import { flattenMicroSkills, getMicroSkillById } from './knowledgeMapModel.js';
import { getRemediationEntryByMicroSkillId } from './remediationMapModel.js';

export const DIAGNOSTIC_ASSET_MAP_VERSION = 'diagnostic-asset-map-v1';

export const DIAGNOSTIC_QUESTION_TYPES = Object.freeze({
  RECOGNITION: 'RECOGNITION',
  PROCEDURAL: 'PROCEDURAL',
  APPLICATION: 'APPLICATION',
  REASONING: 'REASONING',
});

export const DIAGNOSTIC_OUTCOMES = Object.freeze({
  LIKELY_MASTERED: 'LIKELY_MASTERED',
  POSSIBLE_FLUENCY: 'POSSIBLE_FLUENCY',
  KNOWLEDGE_GAP: 'KNOWLEDGE_GAP',
  MISCONCEPTION: 'MISCONCEPTION',
  OVERCONFIDENCE_RISK: 'OVERCONFIDENCE_RISK',
  WORKING_HABIT_REVIEW: 'WORKING_HABIT_REVIEW',
});

export const FUTURE_DIAGNOSTIC_HOOKS = Object.freeze([
  'practiceAssets',
  'fluencyAssets',
  'checkpointAssets',
  'wordPathAssets',
  'paperReviewMapping',
]);

export const diagnosticSignalRules = Object.freeze([
  {
    id: 'correct_high_confidence',
    signal: 'Correct + high confidence',
    conditions: { answerCorrect: true, confidence: 'HIGH' },
    outcome: DIAGNOSTIC_OUTCOMES.LIKELY_MASTERED,
    confidenceWeight: 0.9,
    misconceptionWeight: 0,
    remediationWeight: 0.1,
  },
  {
    id: 'correct_no_working',
    signal: 'Correct + no working declared',
    conditions: { answerCorrect: true, workingNotNeeded: true },
    outcome: DIAGNOSTIC_OUTCOMES.POSSIBLE_FLUENCY,
    confidenceWeight: 0.7,
    misconceptionWeight: 0,
    remediationWeight: 0.15,
  },
  {
    id: 'correct_with_working',
    signal: 'Correct + working submitted',
    conditions: { answerCorrect: true, workingSubmitted: true },
    outcome: DIAGNOSTIC_OUTCOMES.LIKELY_MASTERED,
    confidenceWeight: 0.65,
    misconceptionWeight: 0,
    remediationWeight: 0.2,
  },
  {
    id: 'wrong_low_confidence',
    signal: 'Wrong + low confidence',
    conditions: { answerCorrect: false, confidence: 'LOW' },
    outcome: DIAGNOSTIC_OUTCOMES.KNOWLEDGE_GAP,
    confidenceWeight: 0.2,
    misconceptionWeight: 0.45,
    remediationWeight: 0.7,
  },
  {
    id: 'wrong_high_confidence',
    signal: 'Wrong + high confidence',
    conditions: { answerCorrect: false, confidence: 'HIGH' },
    outcome: DIAGNOSTIC_OUTCOMES.MISCONCEPTION,
    confidenceWeight: 0.1,
    misconceptionWeight: 0.85,
    remediationWeight: 0.85,
  },
  {
    id: 'wrong_high_confidence_no_working',
    signal: 'Wrong + high confidence + no working',
    conditions: { answerCorrect: false, confidence: 'HIGH', workingNotNeeded: true },
    outcome: DIAGNOSTIC_OUTCOMES.OVERCONFIDENCE_RISK,
    confidenceWeight: 0.05,
    misconceptionWeight: 0.95,
    remediationWeight: 1,
  },
  {
    id: 'wrong_no_working_high_requirement',
    signal: 'Wrong + no working + high working requirement',
    conditions: { answerCorrect: false, workingNotNeeded: true, workingRequirementLevel: 'HIGH' },
    outcome: DIAGNOSTIC_OUTCOMES.WORKING_HABIT_REVIEW,
    confidenceWeight: 0.1,
    misconceptionWeight: 0.75,
    remediationWeight: 0.95,
  },
]);

export function createEmptyDiagnosticHooks() {
  return FUTURE_DIAGNOSTIC_HOOKS.reduce((hooks, key) => {
    hooks[key] = [];
    return hooks;
  }, {});
}

export function normalizeDiagnosticAssetMap(map = {}) {
  return {
    ...map,
    modelVersion: map.modelVersion || DIAGNOSTIC_ASSET_MAP_VERSION,
    diagnosticSignalRules: Array.isArray(map.diagnosticSignalRules)
      ? map.diagnosticSignalRules
      : diagnosticSignalRules,
    entries: Array.isArray(map.entries)
      ? map.entries.map((entry) => ({
        diagnosticQuestions: [],
        confidenceIndicators: [],
        workingIndicators: [],
        misconceptionIndicators: [],
        remediationTriggers: [],
        ...createEmptyDiagnosticHooks(),
        ...entry,
        diagnosticQuestions: Array.isArray(entry.diagnosticQuestions) ? entry.diagnosticQuestions : [],
        confidenceIndicators: Array.isArray(entry.confidenceIndicators) ? entry.confidenceIndicators : [],
        workingIndicators: Array.isArray(entry.workingIndicators) ? entry.workingIndicators : [],
        misconceptionIndicators: Array.isArray(entry.misconceptionIndicators) ? entry.misconceptionIndicators : [],
        remediationTriggers: Array.isArray(entry.remediationTriggers) ? entry.remediationTriggers : [],
      }))
      : [],
  };
}

export function getDiagnosticEntryByMicroSkillId(map = {}, microSkillId = '') {
  return normalizeDiagnosticAssetMap(map).entries.find((entry) => entry.microSkill === microSkillId) || null;
}

export function buildDiagnosticEntry({ knowledgeMap, remediationMap, topic, microSkill, diagnosticQuestions = [] }) {
  const sourceMicroSkill = getMicroSkillById(knowledgeMap, microSkill);
  const remediationEntry = getRemediationEntryByMicroSkillId(remediationMap, microSkill);
  const misconceptionIndicators = (remediationEntry?.misconceptions || []).map((misconception) => ({
    misconceptionId: misconception.id,
    observableBehaviours: misconception.observableBehaviours,
    evidenceWeight: 0.85,
  }));

  return {
    domain: knowledgeMap.domain,
    topic,
    microSkill,
    microSkillTitle: sourceMicroSkill?.title || '',
    diagnosticQuestions,
    confidenceIndicators: [
      { signal: 'Correct + high confidence', interpretation: DIAGNOSTIC_OUTCOMES.LIKELY_MASTERED },
      { signal: 'Wrong + high confidence', interpretation: DIAGNOSTIC_OUTCOMES.MISCONCEPTION },
      { signal: 'Wrong + low confidence', interpretation: DIAGNOSTIC_OUTCOMES.KNOWLEDGE_GAP },
    ],
    workingIndicators: [
      { signal: 'Correct without working', interpretation: DIAGNOSTIC_OUTCOMES.POSSIBLE_FLUENCY },
      { signal: 'Wrong without working', interpretation: DIAGNOSTIC_OUTCOMES.OVERCONFIDENCE_RISK },
      { signal: 'Correct with working', interpretation: 'Understanding visible; fluency still building' },
    ],
    misconceptionIndicators,
    remediationTriggers: [
      { signalRuleId: 'wrong_high_confidence', triggerStrength: 'STRONG' },
      { signalRuleId: 'wrong_high_confidence_no_working', triggerStrength: 'CRITICAL' },
      { signalRuleId: 'wrong_low_confidence', triggerStrength: 'MEDIUM' },
    ],
    ...createEmptyDiagnosticHooks(),
  };
}

export function validateDiagnosticAssetMap(map = {}, knowledgeMap = null, remediationMap = null) {
  const normalized = normalizeDiagnosticAssetMap(map);
  const errors = [];
  const entryMicroSkillIds = new Set();
  const knownMicroSkillIds = knowledgeMap
    ? new Set(flattenMicroSkills(knowledgeMap).map((microSkill) => microSkill.id))
    : null;

  if (!normalized.domain) errors.push('Diagnostic asset map must define a domain.');
  if (!normalized.stage) errors.push('Diagnostic asset map must define a stage.');
  if (!normalized.entries.length) errors.push('Diagnostic asset map must contain entries.');
  if (!normalized.diagnosticSignalRules.length) errors.push('Diagnostic asset map must define signal rules.');

  normalized.entries.forEach((entry) => {
    if (!entry.topic) errors.push(`Entry ${entry.microSkill || '(missing micro-skill)'} must define a topic.`);
    if (!entry.microSkill) errors.push('Entry is missing a microSkill id.');
    if (entry.microSkill && entryMicroSkillIds.has(entry.microSkill)) {
      errors.push(`Duplicate diagnostic entry for ${entry.microSkill}.`);
    }
    if (entry.microSkill) entryMicroSkillIds.add(entry.microSkill);
    if (knownMicroSkillIds && entry.microSkill && !knownMicroSkillIds.has(entry.microSkill)) {
      errors.push(`Diagnostic entry references unknown micro-skill ${entry.microSkill}.`);
    }

    const questionTypes = new Set(entry.diagnosticQuestions.map((question) => question.type));
    [DIAGNOSTIC_QUESTION_TYPES.RECOGNITION, DIAGNOSTIC_QUESTION_TYPES.PROCEDURAL].forEach((requiredType) => {
      if (!questionTypes.has(requiredType)) {
        errors.push(`Entry ${entry.microSkill} is missing ${requiredType} diagnostic question.`);
      }
    });
    if (!entry.diagnosticQuestions.some((question) => question.detectsMisconceptions?.length)) {
      errors.push(`Entry ${entry.microSkill} is missing a misconception detection question.`);
    }
    if (!entry.confidenceIndicators.length) errors.push(`Entry ${entry.microSkill} must define confidenceIndicators.`);
    if (!entry.workingIndicators.length) errors.push(`Entry ${entry.microSkill} must define workingIndicators.`);
    if (!entry.misconceptionIndicators.length) errors.push(`Entry ${entry.microSkill} must define misconceptionIndicators.`);
    if (!entry.remediationTriggers.length) errors.push(`Entry ${entry.microSkill} must define remediationTriggers.`);
    FUTURE_DIAGNOSTIC_HOOKS.forEach((hook) => {
      if (!Array.isArray(entry[hook])) errors.push(`Entry ${entry.microSkill} must define ${hook} as an array.`);
    });
  });

  if (knowledgeMap) {
    flattenMicroSkills(knowledgeMap).forEach((microSkill) => {
      if (!entryMicroSkillIds.has(microSkill.id)) {
        errors.push(`Missing diagnostic entry for micro-skill ${microSkill.id}.`);
      }
    });
  }

  if (remediationMap) {
    normalizeDiagnosticAssetMap(normalized).entries.forEach((entry) => {
      const remediationEntry = getRemediationEntryByMicroSkillId(remediationMap, entry.microSkill);
      const remediationMisconceptions = new Set((remediationEntry?.misconceptions || []).map((item) => item.id));
      const diagnosticMisconceptions = new Set(entry.misconceptionIndicators.map((item) => item.misconceptionId));
      remediationMisconceptions.forEach((misconceptionId) => {
        if (!diagnosticMisconceptions.has(misconceptionId)) {
          errors.push(`Entry ${entry.microSkill} is missing diagnostic indicator for ${misconceptionId}.`);
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
      diagnosticQuestionCount: normalized.entries.reduce((sum, entry) => sum + entry.diagnosticQuestions.length, 0),
      knowledgeMicroSkillCount: knowledgeMap ? flattenMicroSkills(knowledgeMap).length : null,
    },
  };
}

export function buildDiagnosticCoverageAudit(map = {}, knowledgeMap = null) {
  const normalized = normalizeDiagnosticAssetMap(map);
  const microSkills = knowledgeMap ? flattenMicroSkills(knowledgeMap) : [];
  return microSkills.map((microSkill) => {
    const entry = getDiagnosticEntryByMicroSkillId(normalized, microSkill.id);
    const questionCount = entry?.diagnosticQuestions?.length || 0;
    const missingAssets = [
      !entry ? 'diagnostic entry' : '',
      entry && !entry.diagnosticQuestions.some((question) => question.type === DIAGNOSTIC_QUESTION_TYPES.RECOGNITION) ? 'recognition question' : '',
      entry && !entry.diagnosticQuestions.some((question) => question.type === DIAGNOSTIC_QUESTION_TYPES.PROCEDURAL) ? 'procedural question' : '',
      entry && !entry.diagnosticQuestions.some((question) => question.detectsMisconceptions?.length) ? 'misconception detection question' : '',
      entry && !entry.confidenceIndicators.length ? 'confidence indicators' : '',
      entry && !entry.workingIndicators.length ? 'working indicators' : '',
    ].filter(Boolean);
    return {
      microSkill: microSkill.id,
      title: microSkill.title,
      diagnosticQuestionsCount: questionCount,
      coverageStatus: missingAssets.length ? 'NOT_READY' : 'DIAGNOSTIC_READY',
      missingAssets,
      riskLevel: missingAssets.length ? (questionCount === 0 ? 'HIGH' : 'MEDIUM') : 'LOW',
    };
  });
}
